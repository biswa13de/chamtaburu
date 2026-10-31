/*
 * /p/<code> (and /package/view) — the guest's package page. The quote is
 * loaded from Firestore by its short code; links sent before short codes
 * existed carry it in #q= instead, and still work. Only the property's
 * address and payment details are read from rates.js, so a corrected UPI ID
 * reaches quotes that were already sent.
 */
(async function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
  const main = $("main");

  // /p/R6X6K2 on the live sites; /package/view.html?c=R6X6K2 in local dev.
  const code = ((location.pathname.match(/^\/p\/([^/]+)\/?$/) || [])[1] || new URLSearchParams(location.search).get("c") || "").toUpperCase();
  const legacy = new URLSearchParams(location.hash.slice(1)).get("q");

  let q = null;
  let failed = false;
  try {
    if (code) q = clean(await P.loadQuote(code));
    else if (legacy) q = clean(P.decode(legacy));
  } catch (err) {
    failed = /load failed/.test(err.message);
    q = null;
  }
  const prop = q && C.properties[q.p];

  // Anyone can create a quote document or hand-edit an old link, so coerce every
  // field to the type it should be before it gets near the page. Numbers and
  // dates are inserted unescaped below. The contact number must be an approved
  // one from rates.js (P.contactFor), so a doctored quote can't send guests
  // (or their advance) to a stranger.
  function clean(d) {
    if (!d || typeof d !== "object") return null;
    const n =(v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
    const s = (v) => (v == null ? "" : String(v).slice(0, 2000));
    const date = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
    const arr = (v) => (Array.isArray(v) ? v.slice(0, 60) : []);
    const p = C.properties[d.p] ? d.p : "";
    if (!p || !date(d.ci) || !date(d.co)) return null;
    const ph = P.contactFor(d.m && d.m.ph, p);
    return {
      id: s(d.id).replace(/[^A-Z0-9-]/gi, ""), p, cd: date(d.cd), vu: date(d.vu),
      m: { n: s(d.m && d.m.n) || "our team", ph },
      g: s(d.g), ci: d.ci, co: d.co, n: n(d.n), a: n(d.a), k: n(d.k),
      l: arr(d.l).map((l) => [s(l[0]), s(l[1]), n(l[2])]),
      sub: n(d.sub), dis: n(d.dis), ov: d.ov ? 1 : 0, gp: Number(d.gp) || 0, gst: n(d.gst),
      tot: n(d.tot), ap: n(d.ap), adv: n(d.adv),
      inc: arr(d.inc).map(s), exc: arr(d.exc).map(s), note: s(d.note), mn: d.mn ? 1 : 0,
    };
  }

  if (!q || !prop) {
    main.innerHTML = failed
      ? `<div class="empty"><h2>Couldn't load your package</h2>
          <p class="muted">Please check your internet connection and open the link again.</p></div>`
      : `<div class="empty"><h2>We couldn't find this package</h2>
          <p class="muted">Please open the full link from your WhatsApp message, or ask us to send it again.</p></div>`;
    return;
  }

  document.title = `Your Package · ${prop.name}`;
  $("propName").textContent = prop.name;
  $("guestLine").textContent = q.g ? `Prepared for ${q.g}` : "";

  const expired = q.vu && q.vu < P.today();
  const guests = P.plural(q.a, "adult") + (q.k ? ", " + P.kids(q.k) : "");
  const row = (label, amt, cls = "sum") => `<tr class="${cls}"><td>${label}</td><td class="amt">${amt}</td></tr>`;
  const list = (items) => `<ul class="list">${items.map((i) => `<li>${P.esc(i)}</li>`).join("")}</ul>`;

  let totals = row("Subtotal", P.inr(q.sub));
  if (q.dis > 0) totals += row(q.ov ? "Special price discount" : "Discount", "− " + P.inr(q.dis));
  if (q.dis < 0) totals += row("Adjustment", "+ " + P.inr(-q.dis));
  if (q.gp) totals += row(`GST ${q.gp}%`, P.inr(q.gst));
  totals += row("Total", P.inr(q.tot), "total");
  if (q.adv) totals += row(`Advance to confirm (${q.ap}%)`, P.inr(q.adv), "adv");

  function menuCard(m) {
    const meals = m.meals.map((x) => `<div class="meal"><h3>${P.esc(x.name)} <span class="muted">${P.esc(x.time)}</span></h3>${x.items.length ? list(x.items) : ""}</div>`).join("");
    return `<div class="card"><h2>Your meals</h2>${meals}${m.note ? `<p class="muted" style="margin:12px 0 0">${P.esc(m.note)}</p>` : ""}</div>`;
  }

  const confirmText = encodeURIComponent(`Hi ${q.m.n}, I'd like to confirm my package ${q.id} at ${prop.name} (${P.fmtDate(q.ci)} → ${P.fmtDate(q.co)}).`);
  const askText = encodeURIComponent(`Hi ${q.m.n}, I have a question about package ${q.id}.`);

  main.innerHTML = `
    <p class="ref">Ref ${P.esc(q.id)}${q.cd ? " · " + P.fmtDate(q.cd) : ""}
      ${q.vu ? `· <span class="status${expired ? " expired" : ""}">${expired ? "Expired" : "Valid until"} ${P.fmtDate(q.vu)}</span>` : ""}</p>

    <div class="card meta">
      <div><b>${P.fmtDate(q.ci)}</b><span>Check-in</span></div>
      <div><b>${P.fmtDate(q.co)}</b><span>Check-out · ${P.plural(q.n, "night")}</span></div>
      <div><b>${guests}</b><span>Guests</span></div>
    </div>

    <div class="card">
      <h2>Your package</h2>
      <table class="lines">
        ${q.l.map((l) => `<tr><td>${P.esc(l[0])}${l[1] ? `<span class="d">${P.esc(l[1])}</span>` : ""}</td><td class="amt">${P.inr(l[2])}</td></tr>`).join("")}
        ${totals}
      </table>
    </div>

    ${q.note ? `<div class="card"><h2>A note for you</h2><p style="margin:0;white-space:pre-line">${P.esc(q.note)}</p></div>` : ""}
    ${q.inc.length ? `<div class="card"><h2>Included</h2>${list(q.inc)}</div>` : ""}
    ${q.mn && C.menu ? menuCard(C.menu) : ""}
    ${q.exc.length ? `<div class="card"><h2>Not included</h2>${list(q.exc)}</div>` : ""}

    <div class="card">
      <h2>Confirm your booking</h2>
      ${payment()}
    </div>

    <div class="actions">
      <a class="btn wa" href="https://wa.me/${q.m.ph}?text=${confirmText}" target="_blank" rel="noopener">Confirm on WhatsApp</a>
      <a class="btn" href="https://wa.me/${q.m.ph}?text=${askText}" target="_blank" rel="noopener">Ask a question</a>
      <a class="btn" href="tel:+${q.m.ph}">Call ${P.esc(q.m.n)}</a>
      <button class="btn" type="button" id="print">Save as PDF</button>
    </div>`;

  function payment() {
    const steps = q.adv
      ? `<p style="margin:0">Pay the advance of <strong>${P.inr(q.adv)}</strong> to confirm, then send us the payment screenshot on WhatsApp.</p>`
      : `<p style="margin:0">Reply on WhatsApp to confirm your booking.</p>`;
    if (!prop.upi && !prop.bank) {
      return steps + `<p class="muted" style="margin:8px 0 0">${P.esc(q.m.n)} will share payment details with you on WhatsApp.</p>`;
    }
    let h = `<div class="pay">${steps}`;
    if (prop.upi) {
      const upiLink = `upi://pay?pa=${encodeURIComponent(prop.upi.id)}&pn=${encodeURIComponent(prop.upi.payee)}&am=${q.adv || q.tot}&cu=INR&tn=${encodeURIComponent(q.id)}`;
      h += `<div class="upi"><div><span class="muted" style="font-size:.85rem">UPI ID</span><br><strong id="upiId">${P.esc(prop.upi.id)}</strong></div>
        <span style="display:flex;gap:8px"><button class="btn small" type="button" id="copyUpi">Copy</button><a class="btn small primary" href="${upiLink}">Pay with UPI app</a></span></div>`;
    }
    if (prop.bank) {
      const b = prop.bank;
      h += `<dl><dt>Account name</dt><dd>${P.esc(b.holder)}</dd><dt>Bank</dt><dd>${P.esc(b.name)}</dd><dt>Account no.</dt><dd>${P.esc(b.account)}</dd><dt>IFSC</dt><dd>${P.esc(b.ifsc)}</dd></dl>`;
    }
    return h + `<p class="muted" style="margin:0;font-size:.85rem">Please add <strong>${P.esc(q.id)}</strong> as the payment note.</p></div>`;
  }

  $("print").addEventListener("click", () => window.print());
  const copyUpi = $("copyUpi");
  if (copyUpi) copyUpi.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(prop.upi.id); copyUpi.textContent = "Copied"; }
    catch { copyUpi.textContent = "Copy failed"; }
  });

  $("foot").hidden = false;
  $("footName").textContent = prop.name;
  $("footAddr").textContent = prop.address;
  $("footSite").href = "https://" + prop.domain;
  $("footSite").textContent = prop.domain;
  $("footLegal").textContent = `Prepared by ${q.m.n} · Prices in Indian Rupees${q.gp ? " · GST as shown" : ""}`;
})();
