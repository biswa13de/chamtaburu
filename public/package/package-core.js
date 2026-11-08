/*
 * Shared helpers for the package generator and the guest view: price
 * calculation, formatting, and saving/loading quotes.
 *
 * A sent quote is a snapshot — the line items and totals are computed once in
 * the generator and stored as-is. Changing rates.js later never changes a
 * quote already sent.
 */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  // Dates are plain "YYYY-MM-DD" strings, handled in UTC so a night never shifts by a day.
  const toUTC = (d) => { const [y, m, dd] = d.split("-").map(Number); return Date.UTC(y, m - 1, dd); };
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const addDays = (d, n) => iso(toUTC(d) + n * 864e5);
  const nightsBetween = (a, b) => (a && b ? Math.round((toUTC(b) - toUTC(a)) / 864e5) : 0);
  const fmtDate = (d) => new Date(toUTC(d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const today = () => { const n = new Date(); return iso(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };
  const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
  const kids = (n) => n + (n === 1 ? " child" : " children");

  function seasonFor(prop, date) {
    return (prop.seasons || []).find((s) => date >= s.from && date <= s.to) || null;
  }

  // rates.js `events` on any night of a stay (check-in up to the night before check-out).
  function eventsFor(ci, co) {
    if (!ci || !co || co <= ci) return [];
    return (window.PACKAGE_CONFIG.events || []).filter((e) => ci <= e.to && co > e.from);
  }

  /*
   * Rate calendar (/package/calendar): one Firestore document per property,
   * rates/{village|resort}, also read by the website's room pages. `base`
   * (JSON) is the normal rates; `days` maps "YYYY-MM-DD" to that date's
   * changes (JSON):
   *   base { rooms: { <type>: { rate, ac } }, pkg: { <tier>: { nonac, ac } } }
   *   day  { rooms: { <type>: { rate?, ac?, soldOut? } }, pkg: { <tier>: { label?, nonac?, ac? } } }
   * `nonac` / `ac` are package tables (adults sharing → price per adult). A
   * date's package entry replaces the tier's normal tables on that date, as a
   * rates.js season did; `label` names it on the package ("Celebration
   * Package"). A room's type is its rates.js `type`, else its `id`.
   *
   * Once loaded into `prop.calendar` it replaces rates.js `rate` / `ac`,
   * `packages` and `seasons`. Until a manager first saves the calendar there
   * is no document, and rates.js applies as before.
   */
  const typeOf = (room) => room.type || room.id;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function parseCalendar(f) {
    const json = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; } };
    const days = {};
    const df = (f.days && f.days.mapValue && f.days.mapValue.fields) || {};
    Object.keys(df).forEach((d) => { if (DATE_RE.test(d)) days[d] = json(df[d].stringValue, {}); });
    const base = json(str(f, "base"), {});
    return { base: { rooms: base.rooms || {}, pkg: base.pkg || {} }, days, updatedBy: str(f, "updatedBy"), updatedAt: (f.updatedAt && f.updatedAt.timestampValue) || "" };
  }

  // null = not set up yet (no document).
  async function loadCalendar(propKey) {
    const res = await fetch(`${API}/rates/${propKey}`, { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("calendar load failed: " + res.status);
    return parseCalendar((await res.json()).fields || {});
  }

  // A room type on one date. `rate` / `ac` null = not set in the calendar.
  function calRoom(cal, type, date) {
    const b = (cal.base.rooms || {})[type] || {};
    const d = (((cal.days[date] || {}).rooms) || {})[type] || {};
    return { rate: d.rate ?? b.rate ?? null, ac: d.ac ?? b.ac ?? null, soldOut: !!d.soldOut, changed: d.rate != null || d.ac != null };
  }

  // A package tier's tables on one date: the date's own, else the normal ones.
  function calPackage(cal, tier, date) {
    const d = (((cal.days[date] || {}).pkg) || {})[tier];
    if (d) return { nonac: d.nonac || null, ac: d.ac || null, label: d.label || "", changed: true };
    const b = (cal.base.pkg || {})[tier] || {};
    return { nonac: b.nonac || null, ac: b.ac || null, label: "", changed: false };
  }

  /*
   * Saves calendar changes. `changes.base` replaces the normal rates;
   * `changes.days[date]` replaces that date's changes, or null removes them.
   * Only those fields are written, so two managers editing different dates
   * don't overwrite each other. `create` writes the whole document, the first
   * time (`changes` must then hold the full base and every date).
   */
  async function saveCalendar(propKey, changes, idToken, phone, create) {
    const fields = { updatedBy: { stringValue: phone } };
    const mask = ["updatedBy"];
    if (changes.base) { fields.base = { stringValue: JSON.stringify(changes.base) }; mask.push("base"); }
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
    const write = { update: { name: `${DB}/rates/${propKey}`, fields }, updateTransforms: [{ fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" }] };
    if (create) write.currentDocument = { exists: false };
    else Object.assign(write, { updateMask: { fieldPaths: mask }, currentDocument: { exists: true } });
    const res = await fetch(API + ":commit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({ writes: [write] }),
    });
    if (!res.ok) throw Object.assign(new Error("calendar save failed: " + res.status), { status: res.status });
  }

  function nightlyRate(prop, room, ac, date) {
    if (prop.calendar) {
      const c = calRoom(prop.calendar, typeOf(room), date);
      const rate = ac && room.ac && c.ac ? c.ac : c.rate;
      return { rate: rate ?? (ac && room.ac ? room.ac : room.rate), season: null, soldOut: c.soldOut };
    }
    const base = ac && room.ac ? room.ac : room.rate;
    const s = seasonFor(prop, date);
    // A season that only sets package rates leaves the Room only rate alone.
    if (!s || (!s.rates && !s.uplift)) return { rate: base, season: null };
    const key = room.id + (ac ? "-ac" : "");
    const rate = s.rates && s.rates[key] != null ? s.rates[key] : Math.round(base * (1 + (s.uplift || 0)));
    return { rate, season: s.name };
  }

  // Per-adult price for `a` adults sharing a room, from a size → price table.
  // Fewer than the smallest size pay as that size (`billed`); a size between
  // two listed ones takes the smaller one's price.
  function perAdult(table, a) {
    const sizes = Object.keys(table).map(Number).sort((x, y) => x - y);
    const billed = Math.max(a, sizes[0]);
    return { rate: table[sizes.filter((n) => n <= billed).pop()], billed };
  }

  // Price for `kg` of an add-on priced by weight.
  function kgPrice(a, kg) {
    const sizes = Object.keys(a.price).map(Number).sort((x, y) => x - y);
    const top = sizes[sizes.length - 1];
    if (kg > top) return a.price[top] + (kg - top) * (a.perKg || 0);
    return a.price[sizes.find((n) => n >= kg)];
  }

  // A car add-on's quantity as cars by size. Older drafts and saved forms hold
  // a number of cars, all of the one size the form had then (`car`).
  function carQty(q, car) {
    if (q && typeof q === "object") return q;
    return { [String(car || 5)]: Number(q) || 0 };
  }

  // Add-ons for both properties first, then the property's own.
  const addonsFor = (prop) => (window.PACKAGE_CONFIG.addons || []).concat(prop.addons || []);

  // Meal plans. A package is a price per adult per night with all meals.
  const PLANS = { room: "Room only", "pkg-ac": "Package (AC)", pkg: "Package (Non-AC)" };

  // The package rate table for a room on one night: the season's if it has
  // one, else the property's; AC falls back to Non-AC (`fallback` set).
  function packageTable(prop, room, ac, date) {
    if (prop.calendar) {
      const c = calPackage(prop.calendar, room.tier, date);
      const season = c.label || null;
      if (ac && c.ac) return { table: c.ac, season };
      return { table: c.nonac, season, fallback: ac && !!c.nonac };
    }
    const s = seasonFor(prop, date);
    const src = s && s.packages ? s.packages : prop.packages || {};
    const pick = (kind) => src[kind] && src[kind][room.tier];
    if (ac && pick("ac")) return { table: pick("ac"), season: s && s.packages ? s.name : null };
    return { table: pick("nonac") || null, season: s && s.packages ? s.name : null, fallback: ac && !!pick("nonac") };
  }

  /*
   * state: { ci, co, meal (a PLANS key), rooms:[{id, ac, q, a, k, pr, rr}] (q
   *          rooms, each with a adults and k children; pr = the manager's
   *          package rate per adult, rr = their Room only rate per room per
   *          night, blank for the rate card), extraBed, addons:{id:qty} (a car
   *          add-on's qty is cars by size, {5: n, 9: n}; a plain number is
   *          that many of the size in `car`, from before sizes were per
   *          add-on), custom:[{n, q, p}] (the manager's own items: name,
   *          quantity, price each), edits:{lineKey:amount}, discount,
   *          discountType ("amt"|"pct"), override, gst, gstIncl, advancePct }
   * Returns line items and totals. Each item is { key, label, detail, amount,
   * rateCard, tax }: `key` identifies the line for a manager's price edit, and
   * changes whenever what the line covers changes, so an edit never sticks to
   * a different stay. `lines` is the same as [label, detail, amount] for the
   * saved quote. GST applies to the stay (rooms, extras), not add-ons or the
   * manager's own items; with
   * `gstIncl` the prices already include it. `rowRates[i]` is row i's rate
   * card price per adult (first night), for showing beside the manager's box.
   */
  function calculate(prop, st) {
    const nights = Math.max(0, nightsBetween(st.ci, st.co));
    const pkg = st.meal === "pkg" || st.meal === "pkg-ac";
    const ac = st.meal === "pkg-ac";
    const items = [];
    const warnings = [];
    const rowRates = [];
    const add = (label, qty, rate, amount, tax, note) => {
      const detail = [qty, rate].filter(Boolean).join(" × ") + (note ? " · " + note : "");
      items.push({ key: label + "|" + detail, label, qty, note, detail, amount, rateCard: amount, tax });
    };
    const plus = (a, k, rateA, rateK) => [a && plural(a, "adult") + " × " + inr(rateA), k && kids(k) + " × " + inr(rateK)].filter(Boolean).join(" + ");

    let adults = 0, children = 0, extraA = 0, extraK = 0;
    const noRate = [], acFallback = [], soldOut = {};
    st.rooms.forEach((r, ri) => {
      const room = prop.rooms.find((x) => x.id === r.id);
      if (!room || !r.q) return;
      const a = r.a || 0, k = r.k || 0;
      adults += r.q * a;
      children += r.q * k;
      extraA += r.q * Math.max(0, a - room.adults);
      extraK += r.q * Math.max(0, k - (room.children || 0));
      if (!a) warnings.push(room.name + ": each room needs at least 1 adult.");
      if (a > (room.max || room.adults)) warnings.push(`${room.name} takes at most ${room.max || room.adults} adults per room.`);
      const own = Number(r.pr) > 0 ? Math.round(Number(r.pr)) : null;
      const ownRoom = Number(r.rr) > 0 ? Math.round(Number(r.rr)) : null;

      // Group consecutive nights priced the same, so a stay that crosses into a season shows two lines.
      const groups = [];
      for (let i = 0; i < nights; i++) {
        const date = addDays(st.ci, i);
        if (prop.calendar && calRoom(prop.calendar, typeOf(room), date).soldOut) (soldOut[room.name] = soldOut[room.name] || new Set()).add(date);
        let g;
        if (pkg) {
          const t = packageTable(prop, room, ac, date);
          if (i === 0) rowRates[ri] = t.table ? perAdult(t.table, a).rate : null;
          if (t.fallback && !own) acFallback.push(t.season || "normal nights");
          const pa = own ? { rate: own, billed: Math.max(a, t.table ? perAdult(t.table, a).billed : 2) } : t.table ? perAdult(t.table, a) : null;
          if (!pa) noRate.push(room.name);
          const rate = pa ? pa.rate : 0;
          const child = Math.round(rate / 2);
          g = { season: t.season, per: pa ? pa.billed * rate + k * child : 0, rate, child, billed: pa ? pa.billed : a };
        } else {
          const nr = nightlyRate(prop, room, r.ac, date);
          if (i === 0) rowRates[ri] = nr.rate;
          // The manager's own rate covers every night, so the stay is one line.
          g = ownRoom ? { season: null, per: ownRoom } : { season: nr.season, per: nr.rate };
        }
        const last = groups[groups.length - 1];
        if (last && last.per === g.per && last.season === g.season) last.n++;
        else groups.push({ ...g, n: 1 });
      }
      const qty = (n) => r.q + " room" + (r.q > 1 ? "s" : "") + " × " + plural(n, "night");
      groups.forEach((g) => {
        if (pkg) {
          // "(3 adults × ₹2,500 + 1 child × ₹1,250)", or "1 adult, charged as 2".
          const who = g.billed > a ? `${plural(a, "adult")}, charged as ${g.billed}, × ${inr(g.rate)}` + (k ? " + " + kids(k) + " × " + inr(g.child) : "") : plus(a, k, g.rate, g.child);
          add(room.name + " · " + (g.season || "Package") + (ac ? " (AC)" : " (Non-AC)"), qty(g.n), "(" + who + ")", r.q * g.n * g.per, true);
        } else {
          const label = room.name + (r.ac && room.ac ? " (AC)" : room.ac ? " (Non-AC)" : "") + (g.season ? " · " + g.season : "");
          add(label, qty(g.n), inr(g.per), r.q * g.n * g.per, true);
        }
      });
    });
    [...new Set(noRate)].forEach((name) => warnings.push(`${name}: no package rate for these dates. Type the rate per adult in the room row.`));
    [...new Set(acFallback)].forEach((when) => warnings.push(`No AC package rate set for ${when}, so the Non-AC rate is shown. Check the price.`));
    Object.entries(soldOut).forEach(([name, dates]) => warnings.push(`${name} is marked sold out on ${[...dates].map(fmtDate).join(", ")} in the rate calendar.`));

    // Room only: guests above what the room rates cover, and extra beds. A package covers them.
    if (!pkg) {
      [[extraA, "Extra adult", "adult"], [extraK, "Extra child (" + prop.childAge + ")", "child"], [st.extraBed || 0, "Extra bed", "bed"]].forEach(([q, name, x]) => {
        if (q && nights) add(name, q + " × " + plural(nights, "night"), inr(prop.extras[x]), q * nights * prop.extras[x], true);
      });
    }

    addonsFor(prop).forEach((a) => {
      const q = st.addons[a.id] || 0;
      if (!q) return;
      if (a.unit === "car") {
        // A line per car size, so a group can have, say, a 9-seater and a 5-seater.
        Object.entries(carQty(q, st.car)).forEach(([size, n]) => {
          const price = a.price[size];
          if (!n || price == null) return;
          add(a.name, (n > 1 ? n + " cars · " : "") + size + "-seater", n > 1 ? inr(price) : "", n * price, false, a.desc);
          Object.assign(items[items.length - 1], { addon: a.id, size });
        });
        return;
      } else if (a.unit === "kg") {
        add(a.name, q + " kg", "", kgPrice(a, q), false);
      } else if (a.unit === "person") {
        add(a.name, q + (q === 1 ? " person" : " people"), inr(a.price), q * a.price, false);
      } else if (a.unit === "night") {
        add(a.name, q + " × " + plural(nights, "night"), inr(a.price), q * nights * a.price, false);
      } else {
        add(a.name, q > 1 ? String(q) : "", q > 1 ? inr(a.price) : "", q * a.price, false);
      }
      items[items.length - 1].addon = a.id;
    });

    // The manager's own items: anything else, at their price. No GST, like add-ons.
    (st.custom || []).forEach((c, i) => {
      const name = String(c.n || "").trim();
      const q = Math.max(1, parseInt(c.q, 10) || 1);
      const p = Math.round(Number(c.p));
      if (!name || !(p > 0)) return;
      add(name, q > 1 ? String(q) : "", q > 1 ? inr(p) : "", q * p, false);
      items[items.length - 1].custom = i;
    });

    // A manager's own price for a line replaces the rate card. The guest sees
    // "special price" instead of a sum that no longer adds up.
    const edits = st.edits || {};
    items.forEach((it) => {
      const v = edits[it.key];
      if (v == null || v === "" || !Number.isFinite(Number(v))) return;
      it.amount = Math.max(0, Math.round(Number(v)));
      it.edited = it.amount !== it.rateCard;
      if (it.edited) it.detail = (it.qty ? it.qty + " · " : "") + "special price" + (it.note ? " · " + it.note : "");
    });

    if (st.ci && st.co && nights <= 0) warnings.push("Check-out must be after check-in.");

    const subtotal = items.reduce((s, l) => s + l.amount, 0);
    const exempt = items.filter((l) => !l.tax).reduce((s, l) => s + l.amount, 0);
    const gstPct = Number(st.gst) || 0;
    const gstIncl = !!st.gstIncl;
    let discount = st.discountType === "pct" ? Math.round((subtotal * (Number(st.discount) || 0)) / 100) : Math.round(Number(st.discount) || 0);
    discount = Math.min(Math.max(discount, 0), subtotal);
    // The discount comes off the stay first, so GST is charged on what the guest pays for it.
    const stay = Math.max(0, subtotal - exempt - discount);
    // GST-inclusive prices already contain it: show the part that is GST, add nothing.
    let gst = gstIncl ? stay - Math.round(stay / (1 + gstPct / 100)) : Math.round((stay * gstPct) / 100);
    let total = subtotal - discount + (gstIncl ? 0 : gst);
    const override = Number(st.override) > 0;
    if (override) {
      // The manager's final figure includes GST on the stay; work the stay amount back out of it.
      total = Math.round(Number(st.override));
      const net = Math.max(0, Math.round((total - exempt) / (1 + gstPct / 100)));
      gst = Math.max(0, total - exempt - net);
      discount = subtotal - (gstIncl ? total : total - gst); // negative when the special price is above the rate card
    }
    const advance = Math.round((total * (Number(st.advancePct) || 0)) / 100);
    const lines = items.map((l) => [l.label, l.detail, l.amount]);
    return { nights, pkg, adults, children, items, lines, rowRates, subtotal, discount, gstPct, gstIncl, gst, total, advance, override, warnings };
  }

  /*
   * Quotes are saved to Firestore under a 6-character code, so the guest gets
   * a short link (/p/R6X6K2). Plain REST calls rather than the Firebase SDK —
   * a few requests don't justify ~100 kB of library. firestore.rules lets
   * anyone read one quote by its code; signed-in managers (hence the ID token)
   * can create quotes, list them, and change a quote's status — never its
   * contents, so a sent link always shows what was sent. Each quote records
   * who made it (`by`, their sign-in number) and its `status`.
   */
  const DB = "projects/chamtaburu-webapp/databases/(default)/documents";
  const API = "https://firestore.googleapis.com/v1/" + DB;
  // No 0/O, 1/I/L, so a code read aloud over the phone can't be mistyped.
  const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const CODE_RE = /^[2-9A-HJKMNP-Z]{6}$/;

  function newCode() {
    return Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
  }

  // `build(code)` returns the quote to store; called again with a fresh code on the rare collision.
  // `idToken` and `phone` are the signed-in manager's (auth.js).
  // The generator's form behind a quote, so a manager can open it again with
  // Edit. Kept in `quoteForms`, which only managers can read: it has the
  // guest's phone number, and the guest's link reads `quotes`.
  const formWrite = (code, form) => ({
    update: { name: `${DB}/quoteForms/${code}`, fields: { f: { stringValue: JSON.stringify(form) } } },
  });

  async function saveQuote(property, build, form, idToken, phone) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = newCode();
      const res = await fetch(API + ":commit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
        body: JSON.stringify({
          writes: [{
            update: {
              name: `${DB}/quotes/${code}`,
              fields: {
                q: { stringValue: JSON.stringify(build(code)) }, p: { stringValue: property },
                by: { stringValue: phone }, status: { stringValue: "sent" },
              },
            },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: "created", setToServerValue: "REQUEST_TIME" }],
          }, formWrite(code, form)],
        }),
      });
      if (res.ok) return code;
      // FAILED_PRECONDITION / ALREADY_EXISTS = that code is taken; anything else is a real failure.
      if (res.status !== 400 && res.status !== 409) throw new Error("save failed: " + res.status);
    }
    throw new Error("save failed: no free code");
  }

  /*
   * Managers live in Firestore, not in this repo, so their numbers are never in
   * git or in a public file: one document per manager in `managers`, its ID the
   * sign-in number ("+919876543210"), with `name`, optional `phone` (contact on
   * the package; defaults to the property's), optional `props` (defaults to
   * both) and, for password sign-in, `uid` (their Firebase account's UID). Added in the Firebase console. firestore.rules lets anyone fetch one
   * by its exact number — so the generator can check before sending an SMS —
   * but never list them.
   */
  async function loadManager(phone) {
    const res = await fetch(`${API}/managers/${encodeURIComponent(phone)}`);
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error("manager lookup failed: " + res.status);
    const f = (await res.json()).fields || {};
    const str = (k) => (f[k] && f[k].stringValue) || "";
    const props = f.props && f.props.arrayValue ? (f.props.arrayValue.values || []).map((v) => v.stringValue) : null;
    return { name: str("name") || "Manager", phone: str("phone").replace(/\D/g, ""), props, uid: str("uid") };
  }

  // The number a package shows the guest: the manager's own if it is an approved
  // contact in rates.js, otherwise the property's.
  function contactFor(phone, propKey) {
    const C = window.PACKAGE_CONFIG;
    const known = (C.contacts || []).concat(Object.values(C.properties).map((x) => x.phone));
    return known.includes(String(phone)) ? String(phone) : C.properties[propKey].phone;
  }

  const str = (f, k) => (f[k] && f[k].stringValue) || "";

  // The latest quotes from every manager, newest first.
  async function listQuotes(idToken, limit = 60) {
    const res = await fetch(API + ":runQuery", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({
        structuredQuery: { from: [{ collectionId: "quotes" }], orderBy: [{ field: { fieldPath: "created" }, direction: "DESCENDING" }], limit },
      }),
    });
    if (!res.ok) throw new Error("list failed: " + res.status);
    return (await res.json()).filter((r) => r.document).map(({ document: d }) => {
      const f = d.fields || {};
      let q = {};
      try { q = JSON.parse(str(f, "q")); } catch { /* unreadable quote: list it without details */ }
      // Quotes from before statuses existed count as sent.
      return { code: d.name.split("/").pop(), q, by: str(f, "by"), status: str(f, "status") || "sent", statusBy: str(f, "statusBy"), editedBy: str(f, "editedBy") };
    });
  }

  async function setStatus(code, status, idToken, phone) {
    if (!CODE_RE.test(code)) throw new Error("bad code");
    const res = await fetch(API + ":commit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({
        writes: [{
          update: { name: `${DB}/quotes/${code}`, fields: { status: { stringValue: status }, statusBy: { stringValue: phone } } },
          updateMask: { fieldPaths: ["status", "statusBy"] },
          currentDocument: { exists: true },
          updateTransforms: [{ fieldPath: "statusAt", setToServerValue: "REQUEST_TIME" }],
        }],
      }),
    });
    if (!res.ok) throw new Error("status failed: " + res.status);
  }

  // An edited package keeps its code, so the link the guest already has shows
  // the new version. Records who edited it last.
  async function updateQuote(code, data, form, idToken, phone) {
    if (!CODE_RE.test(code)) throw new Error("bad code");
    const res = await fetch(API + ":commit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({
        writes: [{
          update: { name: `${DB}/quotes/${code}`, fields: { q: { stringValue: JSON.stringify(data) }, editedBy: { stringValue: phone } } },
          updateMask: { fieldPaths: ["q", "editedBy"] },
          currentDocument: { exists: true },
          updateTransforms: [{ fieldPath: "editedAt", setToServerValue: "REQUEST_TIME" }],
        }, formWrite(code, form)],
      }),
    });
    if (!res.ok) throw new Error("update failed: " + res.status);
  }

  /*
   * Booking requests from the website's /book page (src/lib/bookingRequest.ts),
   * newest first. Only managers can read them (firestore.rules): they hold
   * the guest's name and number. `status` is new, quoted (a package was
   * sent; `quote` is its code), booked or declined.
   */
  async function listRequests(idToken, limit = 40) {
    const res = await fetch(API + ":runQuery", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({
        structuredQuery: { from: [{ collectionId: "bookingRequests" }], orderBy: [{ field: { fieldPath: "created" }, direction: "DESCENDING" }], limit },
      }),
    });
    if (!res.ok) throw new Error("requests failed: " + res.status);
    const int = (f, k) => Number((f[k] && f[k].integerValue) || 0);
    return (await res.json()).filter((r) => r.document).map(({ document: d }) => {
      const f = d.fields || {};
      return {
        code: d.name.split("/").pop(), p: str(f, "p"), room: str(f, "room"), roomName: str(f, "roomName"),
        ac: !!(f.ac && f.ac.booleanValue), ci: str(f, "ci"), co: str(f, "co"), a: int(f, "a"), k: int(f, "k"),
        name: str(f, "name"), phone: str(f, "phone"), note: str(f, "note"), est: int(f, "est"),
        status: str(f, "status") || "new", quote: str(f, "quote"), statusBy: str(f, "statusBy"),
        created: (f.created && f.created.timestampValue) || "",
      };
    });
  }

  // `quote`: the package made from it, when there is one.
  async function setRequestStatus(code, status, idToken, phone, quote) {
    if (!CODE_RE.test(code)) throw new Error("bad code");
    const fields = { status: { stringValue: status }, statusBy: { stringValue: phone } };
    const mask = ["status", "statusBy"];
    if (quote) { fields.quote = { stringValue: quote }; mask.push("quote"); }
    const res = await fetch(API + ":commit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({
        writes: [{
          update: { name: `${DB}/bookingRequests/${code}`, fields },
          updateMask: { fieldPaths: mask },
          currentDocument: { exists: true },
          updateTransforms: [{ fieldPath: "statusAt", setToServerValue: "REQUEST_TIME" }],
        }],
      }),
    });
    if (!res.ok) throw new Error("request status failed: " + res.status);
  }

  // null for packages saved before Edit existed (no form was kept).
  async function loadForm(code, idToken) {
    if (!CODE_RE.test(code)) return null;
    const res = await fetch(`${API}/quoteForms/${code}`, { headers: { Authorization: "Bearer " + idToken } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("form load failed: " + res.status);
    return JSON.parse(str((await res.json()).fields || {}, "f"));
  }

  async function loadQuote(code) {
    if (!CODE_RE.test(code)) return null;
    const res = await fetch(`${API}/quotes/${code}`);
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error("load failed: " + res.status);
    const doc = await res.json();
    return JSON.parse(doc.fields.q.stringValue);
  }

  // Unicode-safe base64url. Only for reading the long #q= links sent before
  // short codes existed — new quotes are never encoded this way.
  function encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function decode(str) {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  }

  // "98765 43210", "098765 43210" and "+91 98765 43210" all become "919876543210" for wa.me.
  function waNumber(raw) {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.length === 11 && d[0] === "0") d = d.slice(1);
    if (d.length === 10) d = "91" + d;
    return d.length >= 11 && d.length <= 15 ? d : "";
  }
  const prettyPhone = (d) => (d.length === 12 && d.startsWith("91") ? "+91 " + d.slice(2, 7) + " " + d.slice(7) : "+" + d);

  // A property's `bookingManagers` as numbers to call: "Booking Manager 1", 2, …
  // Empty if it lists none (the manager's own number is used instead).
  function bookingCalls(prop) {
    const all = window.PACKAGE_CONFIG.properties;
    return (prop.bookingManagers || []).filter((k) => all[k]).map((k, i) => ({ name: `Booking Manager ${i + 1}`, phone: all[k].phone }));
  }

  // rates.js `menu` as a day of meals, each dish with the /menu veg / egg /
  // non-veg marker. Shared by the guest page and /package/menu (package.css).
  const DISH_TYPES = { veg: "Veg", egg: "Contains egg", nonveg: "Non-veg" };
  function mealsHtml(menu) {
    const dish = (it) => {
      const [name, desc, type] = Array.isArray(it) ? it : [it, "", ""];
      const dot = DISH_TYPES[type] ? `<span class="dot" role="img" aria-label="${DISH_TYPES[type]}"></span>` : `<span class="dot none"></span>`;
      return `<li class="${DISH_TYPES[type] ? type : ""}">${dot}<div><b>${esc(name)}</b>${desc ? `<p>${esc(desc)}</p>` : ""}</div></li>`;
    };
    return `<ol class="day">${menu.meals.map((m) => `<li>
      <div class="when">${esc(m.time)}</div>
      <div><h3>${esc(m.name)}</h3>${m.items.length ? `<ul class="dishes">${m.items.map(dish).join("")}</ul>` : ""}</div>
    </li>`).join("")}</ol>`;
  }
  const legendHtml = () => `<ul class="legend" aria-label="Legend">${Object.entries(DISH_TYPES).map(([k, v]) => `<li class="${k}"><span class="dot"></span>${v}</li>`).join("")}</ul>`;

  window.PKG = { listRequests, setRequestStatus, carQty, typeOf, loadCalendar, calRoom, calPackage, saveCalendar, nightlyRate, esc, inr, addDays, nightsBetween, fmtDate, today, plural, kids, eventsFor, bookingCalls, mealsHtml, legendHtml, calculate, saveQuote, updateQuote, loadForm, listQuotes, setStatus, loadManager, contactFor, loadQuote, addonsFor, PLANS, encode, decode, waNumber, prettyPhone };
})();
