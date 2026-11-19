/*
 * Travel partners and their B2B (net) rates, shared by /package/b2b (the B2B
 * rate calendar), /package/partners (approving partners) and /partners (the
 * partners' own page). Load after rates.js and package-core.js.
 *
 * B2B rates: one Firestore document per property, b2bRates/{village|resort}.
 * Only managers and approved partners can read it (firestore.rules), never the
 * website. It holds discounts off the public rate rather than rates, so a net
 * rate follows every change in the public rate calendar and can't end up above
 * the website's price:
 *   plan  JSON { disc, peakDisc, rooms: { <type>: disc }, pkg: { <tier>: disc } }
 *   days  map "YYYY-MM-DD" → JSON { peak?: true, disc?: n, closed?: true }
 * A date's discount (%) is its own `disc`, else `peakDisc` on a peak date, else
 * the room type's or package tier's, else `disc`. `closed`: not sold to
 * partners on that date. Sold out comes from the public calendar: there is one
 * inventory. Net rates are rounded to ₹10.
 *
 * Only an admin (a manager whose document has role "admin") changes `plan`;
 * managers mark dates for their properties. Until an admin first saves, there
 * is no document and partners see no rates.
 */
(function () {
  const P = window.PKG;
  const C = window.PACKAGE_CONFIG;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const json = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
  const headers = (idToken) => ({ "Content-Type": "application/json", Authorization: "Bearer " + idToken });
  const pct = (v, fallback) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Math.min(90, Math.max(0, Math.round(Number(v)))) : fallback);

  /* ---------- Room types and package tiers ---------- */
  const rateTypes = (prop) => prop.rateTypes || prop.rooms.map((r) => ({ id: P.typeOf(r), name: r.name }));
  const tiers = (prop) => [...new Set(prop.rooms.map((r) => r.tier))];
  const tierName = (prop, t) => (prop.tierNames && prop.tierNames[t]) || t;
  const hasAc = (prop, type) => prop.rooms.some((r) => P.typeOf(r) === type && r.ac);
  // Package table sizes for a tier: 2 up to the most adults its rooms take.
  const sizes = (prop, tier) => {
    const max = Math.max(2, ...prop.rooms.filter((r) => r.tier === tier).map((r) => r.max || r.adults));
    return Array.from({ length: max - 1 }, (_, i) => i + 2);
  };

  /* ---------- The plan ---------- */
  const DEFAULT_PLAN = { disc: 20, peakDisc: 10, rooms: {}, pkg: {} };

  function normPlan(p) {
    p = p || {};
    const own = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, pct(v, 0)]));
    return { disc: pct(p.disc, DEFAULT_PLAN.disc), peakDisc: pct(p.peakDisc, DEFAULT_PLAN.peakDisc), rooms: own(p.rooms), pkg: own(p.pkg) };
  }

  function parseB2B(f) {
    const days = {};
    const df = (f.days && f.days.mapValue && f.days.mapValue.fields) || {};
    Object.keys(df).forEach((d) => { if (DATE_RE.test(d)) days[d] = json(df[d].stringValue, {}); });
    return { plan: normPlan(json(P.str(f, "plan"), {})), days, updatedBy: P.str(f, "updatedBy"), updatedAt: (f.updatedAt && f.updatedAt.timestampValue) || "" };
  }

  // null = not set up yet. Throws with `status` 403 when this account can't see it.
  async function loadB2B(propKey, idToken) {
    const res = await fetch(`${P.API}/b2bRates/${propKey}`, { headers: { Authorization: "Bearer " + idToken }, cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw Object.assign(new Error("b2b load failed: " + res.status), { status: res.status });
    return parseB2B((await res.json()).fields || {});
  }

  // Starting values before the first save: the default discounts, with the
  // public calendar's named package dates (rates.js seasons before it is
  // switched on) marked peak.
  function seedB2B(prop) {
    const today = P.today();
    const days = {};
    (prop.seasons || []).forEach((s) => {
      for (let d = s.from > today ? s.from : today; d <= s.to; d = P.addDays(d, 1)) days[d] = { peak: true };
    });
    if (prop.calendar) {
      Object.entries(prop.calendar.days).forEach(([d, v]) => {
        if (d >= today && Object.values(v.pkg || {}).some((x) => x.label)) days[d] = { peak: true };
      });
    }
    return { plan: normPlan(DEFAULT_PLAN), days };
  }

  /*
   * Same as saveCalendar: `changes.plan` replaces the plan, `changes.days[date]`
   * that date's entry (null removes it), writing only those fields; `create`
   * writes the whole document the first time.
   */
  async function saveB2B(propKey, changes, idToken, phone, create) {
    const fields = { updatedBy: { stringValue: phone } };
    const mask = ["updatedBy"];
    if (changes.plan) { fields.plan = { stringValue: JSON.stringify(normPlan(changes.plan)) }; mask.push("plan"); }
    const days = Object.entries(changes.days || {});
    if (days.length || create) {
      const dayFields = {};
      days.forEach(([d, v]) => {
        if (!DATE_RE.test(d)) throw new Error("bad date " + d);
        mask.push("days.`" + d + "`");
        if (v) dayFields[d] = { stringValue: JSON.stringify(v) };
      });
      fields.days = { mapValue: { fields: dayFields } };
    }
    const write = { update: { name: `${P.DB}/b2bRates/${propKey}`, fields }, updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }] };
    if (create) write.currentDocument = { exists: false };
    else Object.assign(write, { updateMask: { fieldPaths: mask }, currentDocument: { exists: true } });
    const res = await fetch(P.API + ":commit", { method: "POST", headers: headers(idToken), body: JSON.stringify({ writes: [write] }) });
    if (!res.ok) throw Object.assign(new Error("b2b save failed: " + res.status), { status: res.status });
  }

  /* ---------- Rates on a date ---------- */
  function dayOf(b2b, date) {
    const d = b2b.days[date] || {};
    return { peak: !!d.peak, closed: !!d.closed, disc: d.disc != null ? d.disc : null };
  }

  // The discount (%) for a room type (kind "rooms") or package tier ("pkg").
  function discFor(b2b, kind, id, date) {
    const d = b2b.days[date] || {};
    if (d.disc != null) return d.disc;
    if (d.peak) return b2b.plan.peakDisc;
    const own = (b2b.plan[kind] || {})[id];
    return own != null ? own : b2b.plan.disc;
  }

  const net = (rate, disc) => (rate == null ? null : Math.round((rate * (100 - disc)) / 1000) * 10);
  const netTable = (table, disc) => (table ? Object.fromEntries(Object.entries(table).map(([n, v]) => [n, net(v, disc)])) : null);

  // A room type's public rates on a date (the calendar's once `prop.calendar`
  // is loaded, else rates.js), with AC where the type has it.
  function publicRoom(prop, type, date) {
    const room = prop.rooms.find((r) => P.typeOf(r) === type);
    if (!room) return { rate: null, ac: null, soldOut: false };
    const acRoom = prop.rooms.find((r) => P.typeOf(r) === type && r.ac);
    const n = P.nightlyRate(prop, room, false, date);
    let ac = null;
    if (acRoom) {
      ac = prop.calendar ? P.calRoom(prop.calendar, type, date).ac : P.nightlyRate(prop, acRoom, true, date).rate;
      if (ac == null) ac = acRoom.ac;
    }
    return { rate: n.rate, ac, soldOut: !!n.soldOut };
  }

  // A package tier's public per-adult tables on a date. No AC table when the
  // tier has none (never the Non-AC one in its place).
  function publicPackage(prop, tier, date) {
    const room = prop.rooms.find((r) => r.tier === tier);
    if (!room) return { nonac: null, ac: null, label: "" };
    const n = P.packageTable(prop, room, false, date);
    const a = P.packageTable(prop, room, true, date);
    return { nonac: n.table || null, ac: a.fallback ? null : a.table || null, label: n.season || "" };
  }

  // Net and public rates for a room type on a date.
  function roomOn(prop, b2b, type, date) {
    const pub = publicRoom(prop, type, date);
    const disc = discFor(b2b, "rooms", type, date);
    const day = dayOf(b2b, date);
    return { pub, disc, rate: net(pub.rate, disc), ac: net(pub.ac, disc), soldOut: pub.soldOut, closed: day.closed, peak: day.peak };
  }

  function packageOn(prop, b2b, tier, date) {
    const pub = publicPackage(prop, tier, date);
    const disc = discFor(b2b, "pkg", tier, date);
    const day = dayOf(b2b, date);
    return { pub, disc, nonac: netTable(pub.nonac, disc), ac: netTable(pub.ac, disc), label: pub.label, closed: day.closed, peak: day.peak };
  }

  /*
   * Travel partners: partners/{uid}, one per partner's Firebase account (email
   * and password, email verified). The partner creates it as "pending" with
   * their business details and the terms version they accepted; an admin
   * approves it (status "approved", `props` the properties they see) or
   * suspends it. firestore.rules: a partner reads only their own and can edit
   * their details only while pending; managers read all; only an admin changes
   * status or props. Nobody deletes one.
   */
  const PROFILE = ["agency", "contact", "phone", "city", "gstin", "web", "member"];

  function parsePartner(d) {
    const f = d.fields || {};
    const s = (k) => P.str(f, k);
    const t = (k) => (f[k] && f[k].timestampValue) || "";
    const out = { uid: d.name.split("/").pop(), email: s("email"), terms: s("terms"), status: s("status") || "pending", statusBy: s("statusBy"), statusAt: t("statusAt"), created: t("created"), lastSeenAt: t("lastSeenAt") };
    PROFILE.forEach((k) => (out[k] = s(k)));
    out.props = f.props && f.props.arrayValue ? (f.props.arrayValue.values || []).map((v) => v.stringValue) : null;
    return out;
  }

  const profileFields = (profile) => {
    const fields = {};
    PROFILE.forEach((k) => { const v = String(profile[k] || "").trim(); if (v) fields[k] = { stringValue: v }; });
    return fields;
  };

  // null = no partner document yet.
  async function loadPartner(uid, idToken) {
    const res = await fetch(`${P.API}/partners/${encodeURIComponent(uid)}`, { headers: { Authorization: "Bearer " + idToken }, cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw Object.assign(new Error("partner load failed: " + res.status), { status: res.status });
    return parsePartner(await res.json());
  }

  async function commit(idToken, write) {
    const res = await fetch(P.API + ":commit", { method: "POST", headers: headers(idToken), body: JSON.stringify({ writes: [write] }) });
    if (!res.ok) throw Object.assign(new Error("partner save failed: " + res.status), { status: res.status });
  }

  function createPartner(uid, profile, email, idToken) {
    const fields = { ...profileFields(profile), email: { stringValue: email }, terms: { stringValue: C.partners.termsVersion }, status: { stringValue: "pending" } };
    return commit(idToken, {
      update: { name: `${P.DB}/partners/${uid}`, fields },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: "created", setToServerValue: "REQUEST_TIME" }],
    });
  }

  // Empty optional fields are removed (in the mask, not in `fields`).
  function updateProfile(uid, profile, idToken) {
    return commit(idToken, {
      update: { name: `${P.DB}/partners/${uid}`, fields: profileFields(profile) },
      updateMask: { fieldPaths: PROFILE },
      currentDocument: { exists: true },
    });
  }

  // When the partner last opened their rates, for the managers' list.
  function markSeen(uid, idToken) {
    return commit(idToken, {
      transform: { document: `${P.DB}/partners/${uid}`, fieldTransforms: [{ fieldPath: "lastSeenAt", setToServerValue: "REQUEST_TIME" }] },
      currentDocument: { exists: true },
    });
  }

  async function listPartners(idToken, limit = 300) {
    const res = await fetch(P.API + ":runQuery", {
      method: "POST",
      headers: headers(idToken),
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "partners" }], orderBy: [{ field: { fieldPath: "created" }, direction: "DESCENDING" }], limit } }),
    });
    if (!res.ok) throw new Error("partners list failed: " + res.status);
    return (await res.json()).filter((r) => r.document).map((r) => parsePartner(r.document));
  }

  // Admins only: approve or suspend, and which properties' rates they see.
  function setPartner(uid, status, props, idToken, phone) {
    return commit(idToken, {
      update: {
        name: `${P.DB}/partners/${uid}`,
        fields: { status: { stringValue: status }, props: { arrayValue: { values: props.map((p) => ({ stringValue: p })) } }, statusBy: { stringValue: phone } },
      },
      updateMask: { fieldPaths: ["status", "props", "statusBy"] },
      currentDocument: { exists: true },
      updateTransforms: [{ fieldPath: "statusAt", setToServerValue: "REQUEST_TIME" }],
    });
  }

  window.B2B = {
    DEFAULT_PLAN, rateTypes, tiers, tierName, hasAc, sizes, normPlan, loadB2B, seedB2B, saveB2B, dayOf, discFor, net, netTable,
    publicRoom, publicPackage, roomOn, packageOn, PROFILE, loadPartner, createPartner, updateProfile, markSeen, listPartners, setPartner,
  };
})();
