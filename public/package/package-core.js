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

  function nightlyRate(prop, room, ac, date) {
    const base = ac && room.ac ? room.ac : room.rate;
    const s = seasonFor(prop, date);
    if (!s) return { rate: base, season: null };
    const key = room.id + (ac ? "-ac" : "");
    const rate = s.rates && s.rates[key] != null ? s.rates[key] : Math.round(base * (1 + (s.uplift || 0)));
    return { rate, season: s.name };
  }

  /*
   * state: { ci, co, adults, children, rooms:[{id,ac,q}], meal, extraAdult,
   *          extraChild, extraBed, addons:{id:qty}, discount, discountType ("amt"|"pct"),
   *          override, gst, advancePct }
   * Returns line items ([label, detail, amount]) and totals.
   */
  function calculate(prop, st) {
    const nights = Math.max(0, nightsBetween(st.ci, st.co));
    const lines = [];
    const warnings = [];
    let capA = 0, capK = 0;

    st.rooms.forEach((r) => {
      const room = prop.rooms.find((x) => x.id === r.id);
      if (!room || !r.q) return;
      capA += room.adults * r.q;
      capK += (room.children || 0) * r.q;
      // Group consecutive nights by rate so a stay that crosses into a season shows two lines.
      const groups = [];
      for (let i = 0; i < nights; i++) {
        const nr = nightlyRate(prop, room, r.ac, addDays(st.ci, i));
        const last = groups[groups.length - 1];
        if (last && last.rate === nr.rate && last.season === nr.season) last.n++;
        else groups.push({ ...nr, n: 1 });
      }
      const label = room.name + (r.ac && room.ac ? " (AC)" : room.ac ? " (Non-AC)" : "");
      groups.forEach((g) => {
        lines.push([
          label + (g.season ? " · " + g.season : ""),
          r.q + " room" + (r.q > 1 ? "s" : "") + " × " + plural(g.n, "night") + " × " + inr(g.rate),
          r.q * g.n * g.rate,
        ]);
      });
    });

    const meal = prop.meals.find((m) => m.id === st.meal);
    if (meal && (meal.adult || meal.child) && nights) {
      const amt = (st.adults * meal.adult + st.children * meal.child) * nights;
      const who = [st.adults && plural(st.adults, "adult") + " × " + inr(meal.adult), st.children && kids(st.children) + " × " + inr(meal.child)].filter(Boolean);
      if (amt) lines.push([meal.name, (who.length > 1 ? "(" + who.join(" + ") + ")" : who[0]) + " × " + plural(nights, "night"), amt]);
    }

    [["extraAdult", "Extra adult", "adult"], ["extraChild", "Extra child (" + prop.childAge + ")", "child"], ["extraBed", "Extra bed", "bed"]].forEach(([k, name, x]) => {
      const q = st[k] || 0;
      if (q && nights) lines.push([name, q + " × " + plural(nights, "night") + " × " + inr(prop.extras[x]), q * nights * prop.extras[x]]);
    });

    prop.addons.forEach((a) => {
      const q = st.addons[a.id] || 0;
      if (!q) return;
      const detail = a.unit === "person" ? q + (q === 1 ? " person" : " people") + " × " + inr(a.price)
        : a.unit === "night" ? q + " × " + plural(nights, "night") + " × " + inr(a.price)
        : q > 1 ? q + " × " + inr(a.price) : "";
      lines.push([a.name, detail, q * (a.unit === "night" ? nights : 1) * a.price]);
    });

    const guests = st.adults + st.children;
    const capacity = capA + capK + (st.extraAdult || 0) + (st.extraChild || 0) + (st.extraBed || 0);
    if (st.rooms.some((r) => r.q) && guests > capacity) warnings.push(guests + " guests but the selected rooms + extras sleep " + capacity + ".");
    if (st.adults > capA + (st.extraAdult || 0) + (st.extraBed || 0) && capA) warnings.push("More adults than the rooms allow — add an extra adult/bed or another room.");
    if (st.ci && st.co && nights <= 0) warnings.push("Check-out must be after check-in.");

    const subtotal = lines.reduce((s, l) => s + l[2], 0);
    const gstPct = Number(st.gst) || 0;
    let discount = st.discountType === "pct" ? Math.round((subtotal * (Number(st.discount) || 0)) / 100) : Math.round(Number(st.discount) || 0);
    discount = Math.min(Math.max(discount, 0), subtotal);
    let taxable = subtotal - discount;
    let gst = Math.round((taxable * gstPct) / 100);
    let total = taxable + gst;
    const override = Number(st.override) > 0;
    if (override) {
      // The manager's final figure includes GST; work the taxable amount back out of it.
      total = Math.round(Number(st.override));
      taxable = Math.round(total / (1 + gstPct / 100));
      gst = total - taxable;
      discount = subtotal - taxable; // negative when the special price is above the rate card
    }
    const advance = Math.round((total * (Number(st.advancePct) || 0)) / 100);
    return { nights, lines, subtotal, discount, taxable, gstPct, gst, total, advance, override, warnings };
  }

  /*
   * Quotes are saved to Firestore under a 6-character code, so the guest gets
   * a short link (/p/R6X6K2). Plain REST calls rather than the Firebase SDK —
   * two requests don't justify ~100 kB of library. firestore.rules allows
   * reading one quote by its code and creating new ones (signed-in managers
   * only, hence the ID token), nothing else: no listing, no edits, no
   * deletes. A sent quote never changes.
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
  // `idToken` is the manager's Firebase sign-in token (auth.js).
  async function saveQuote(property, build, idToken) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = newCode();
      const res = await fetch(API + ":commit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
        body: JSON.stringify({
          writes: [{
            update: {
              name: `${DB}/quotes/${code}`,
              fields: { q: { stringValue: JSON.stringify(build(code)) }, p: { stringValue: property } },
            },
            currentDocument: { exists: false },
            updateTransforms: [{ fieldPath: "created", setToServerValue: "REQUEST_TIME" }],
          }],
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
   * the package; defaults to the property's) and optional `props` (defaults to
   * both). Added in the Firebase console. firestore.rules lets anyone fetch one
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
    return { name: str("name") || "Manager", phone: str("phone").replace(/\D/g, ""), props };
  }

  // The number a package shows the guest: the manager's own if it is an approved
  // contact in rates.js, otherwise the property's.
  function contactFor(phone, propKey) {
    const C = window.PACKAGE_CONFIG;
    const known = (C.contacts || []).concat(Object.values(C.properties).map((x) => x.phone));
    return known.includes(String(phone)) ? String(phone) : C.properties[propKey].phone;
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

  window.PKG = { esc, inr, addDays, nightsBetween, fmtDate, today, plural, kids, calculate, saveQuote, loadManager, contactFor, loadQuote, encode, decode, waNumber, prettyPhone };
})();
