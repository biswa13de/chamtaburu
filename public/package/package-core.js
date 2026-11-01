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

  function nightlyRate(prop, room, ac, date) {
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

  // Add-ons for both properties first, then the property's own.
  const addonsFor = (prop) => (window.PACKAGE_CONFIG.addons || []).concat(prop.addons || []);

  // Meal plans. A package is a price per adult per night with all meals.
  const PLANS = { room: "Room only", "pkg-ac": "Package (AC)", pkg: "Package (Non-AC)" };

  // The package rate table for a room on one night: the season's if it has
  // one, else the property's; AC falls back to Non-AC (`fallback` set).
  function packageTable(prop, room, ac, date) {
    const s = seasonFor(prop, date);
    const src = s && s.packages ? s.packages : prop.packages || {};
    const pick = (kind) => src[kind] && src[kind][room.tier];
    if (ac && pick("ac")) return { table: pick("ac"), season: s && s.packages ? s.name : null };
    return { table: pick("nonac") || null, season: s && s.packages ? s.name : null, fallback: ac && !!pick("nonac") };
  }

  /*
   * state: { ci, co, meal (a PLANS key), rooms:[{id, ac, q, a, k, pr}] (q rooms,
   *          each with a adults and k children; pr = the manager's package rate
   *          per adult, blank for the rate card), extraBed, car ("5"|"9"),
   *          addons:{id:qty}, edits:{lineKey:amount}, discount, discountType
   *          ("amt"|"pct"), override, gst, gstIncl, advancePct }
   * Returns line items and totals. Each item is { key, label, detail, amount,
   * rateCard, tax }: `key` identifies the line for a manager's price edit, and
   * changes whenever what the line covers changes, so an edit never sticks to
   * a different stay. `lines` is the same as [label, detail, amount] for the
   * saved quote. GST applies to the stay (rooms, extras), not add-ons; with
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
    const noRate = [], acFallback = [];
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

      // Group consecutive nights priced the same, so a stay that crosses into a season shows two lines.
      const groups = [];
      for (let i = 0; i < nights; i++) {
        const date = addDays(st.ci, i);
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
          g = { season: nr.season, per: nr.rate };
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

    // Room only: guests above what the room rates cover, and extra beds. A package covers them.
    if (!pkg) {
      [[extraA, "Extra adult", "adult"], [extraK, "Extra child (" + prop.childAge + ")", "child"], [st.extraBed || 0, "Extra bed", "bed"]].forEach(([q, name, x]) => {
        if (q && nights) add(name, q + " × " + plural(nights, "night"), inr(prop.extras[x]), q * nights * prop.extras[x], true);
      });
    }

    const car = String(st.car || 5);
    addonsFor(prop).forEach((a) => {
      const q = st.addons[a.id] || 0;
      if (!q) return;
      if (a.unit === "car") {
        const price = a.price[car];
        add(a.name, (q > 1 ? q + " cars · " : "") + car + "-seater", q > 1 ? inr(price) : "", q * price, false, a.desc);
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

  window.PKG = { esc, inr, addDays, nightsBetween, fmtDate, today, plural, kids, eventsFor, calculate, saveQuote, updateQuote, loadForm, listQuotes, setStatus, loadManager, contactFor, loadQuote, addonsFor, PLANS, encode, decode, waNumber, prettyPhone };
})();
