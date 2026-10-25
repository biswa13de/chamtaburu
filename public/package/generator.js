/*
 * /package — manager-only package generator.
 *
 * The PIN is checked in the browser against SHA-256 hashes in rates.js. That
 * keeps guests and casual visitors out, but it is not real security: the page
 * holds no secrets (only the rate card), which is why that trade-off was
 * accepted (docs/village-resort-package.md, decision 1).
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
  const SESSION_KEY = "pkg-manager";
  const DRAFT_KEY = "pkg-draft";
  const store = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch { /* private mode */ } },
  };

  let manager = null;
  let prop = null;
  let propKey = "";
  let rooms = [];
  let addons = {};
  let quoteId = "";

  /* ---------- PIN ---------- */
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let failures = 0, lockedUntil = 0;

  $("lockForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("pinErr");
    if (Date.now() < lockedUntil) { err.textContent = "Too many tries. Wait a few seconds."; return; }
    if (!window.crypto || !crypto.subtle) { err.textContent = "Open this page over https to log in."; return; }
    const hash = await sha256("chamtaburu-package:" + $("pin").value.trim());
    const m = C.managers.find((x) => x.pin === hash);
    $("pin").value = "";
    if (!m) {
      failures++;
      if (failures >= 5) { lockedUntil = Date.now() + 30000; failures = 0; }
      err.textContent = "Wrong PIN.";
      return;
    }
    err.textContent = "";
    store.set(SESSION_KEY, hash);
    start(m);
  });

  $("logout").addEventListener("click", () => {
    store.del(SESSION_KEY);
    store.del(DRAFT_KEY);
    location.reload();
  });

  /* ---------- Setup ---------- */
  function start(m) {
    manager = m;
    $("lock").hidden = true;
    $("app").hidden = false;
    $("who").textContent = m.name;
    $("placeholderBanner").hidden = !C.placeholder;

    const allowed = m.props.filter((k) => C.properties[k]);
    $("prop").innerHTML = allowed.map((k) => `<option value="${k}">${P.esc(C.properties[k].name)}</option>`).join("");
    $("prop").disabled = allowed.length < 2;
    const siteKey = location.hostname.indexOf("resort.") === 0 ? "resort" : "village";

    const draft = store.get(DRAFT_KEY);
    if (draft && allowed.includes(draft.propKey)) {
      restore(draft);
    } else {
      setProperty(allowed.includes(siteKey) ? siteKey : allowed[0]);
      newQuote();
    }
    update();
  }

  function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    $("prop").value = key;
    rooms = [{ id: prop.rooms[0].id, ac: false, q: 1 }];
    addons = {};
    $("meal").innerHTML = prop.meals.map((m) => {
      const price = m.adult ? ` — ${P.inr(m.adult)}/adult/night` : "";
      return `<option value="${m.id}">${P.esc(m.name + price)}</option>`;
    }).join("");
    $("extraChildLbl").firstChild.textContent = `Extra children ${prop.childAge} (per night)`;
    $("gst").value = prop.gst;
    $("advancePct").value = prop.advance;
    $("validUntil").value = P.addDays(P.today(), prop.validDays);
    $("inclusions").value = prop.inclusions.join("\n");
    $("exclusions").value = prop.exclusions.join("\n");
    renderRooms();
    renderAddons();
  }

  function newQuote() {
    const d = P.today().replace(/-/g, "").slice(2);
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    quoteId = `${prop.prefix}-${d}-${rand}`;
  }

  /* ---------- Rooms & add-ons ---------- */
  function renderRooms() {
    $("rooms").innerHTML = rooms.map((r, i) => {
      const room = prop.rooms.find((x) => x.id === r.id) || prop.rooms[0];
      const opts = prop.rooms.map((x) => {
        const cap = x.adults + " adults" + (x.children ? " + " + x.children + " child" : "");
        return `<option value="${x.id}"${x.id === room.id ? " selected" : ""}>${P.esc(x.name)} — ${P.inr(x.rate)} · ${cap}</option>`;
      }).join("");
      return `<div class="row" data-i="${i}">
        <select data-k="id" aria-label="Room type">${opts}</select>
        <label class="ac${room.ac ? "" : " off"}"><input type="checkbox" data-k="ac"${r.ac ? " checked" : ""}> AC ${room.ac ? P.inr(room.ac) : ""}</label>
        <input type="number" min="1" max="20" value="${r.q}" data-k="q" aria-label="Number of rooms">
        <button class="btn small" type="button" data-k="del" aria-label="Remove room"${rooms.length < 2 ? " disabled" : ""}>✕</button>
      </div>`;
    }).join("");
  }
  $("rooms").addEventListener("input", (e) => {
    const row = e.target.closest(".row");
    if (!row) return;
    const r = rooms[row.dataset.i];
    const k = e.target.dataset.k;
    if (k === "id") { r.id = e.target.value; r.ac = false; renderRooms(); }
    if (k === "ac") r.ac = e.target.checked;
    if (k === "q") r.q = Math.max(0, parseInt(e.target.value, 10) || 0);
    update();
  });
  $("rooms").addEventListener("click", (e) => {
    if (e.target.dataset.k !== "del") return;
    rooms.splice(e.target.closest(".row").dataset.i, 1);
    renderRooms();
    update();
  });
  $("addRoom").addEventListener("click", () => {
    const used = rooms.map((r) => r.id);
    const next = prop.rooms.find((x) => !used.includes(x.id)) || prop.rooms[0];
    rooms.push({ id: next.id, ac: false, q: 1 });
    renderRooms();
    update();
  });

  const unitLabel = { stay: "per stay", person: "per person", night: "per night" };
  function renderAddons() {
    $("addons").innerHTML = prop.addons.map((a) => {
      const q = addons[a.id] || 0;
      return `<label class="addon" data-id="${a.id}">
        <input type="checkbox"${q ? " checked" : ""} data-k="on">
        <span>${P.esc(a.name)}</span>
        <span class="p">${P.inr(a.price)} ${unitLabel[a.unit]}</span>
        <input type="number" min="1" max="60" value="${q || defaultAddonQty(a)}" data-k="q" aria-label="${P.esc(a.name)} quantity"${q ? "" : " disabled"}>
      </label>`;
    }).join("");
  }
  function defaultAddonQty(a) {
    return a.unit === "person" ? Math.max(1, num("adults") + num("children")) : 1;
  }
  $("addons").addEventListener("input", (e) => {
    const row = e.target.closest(".addon");
    const qty = row.querySelector("[data-k=q]");
    const on = row.querySelector("[data-k=on]").checked;
    qty.disabled = !on;
    if (on) addons[row.dataset.id] = Math.max(1, parseInt(qty.value, 10) || 1);
    else delete addons[row.dataset.id];
    update();
  });

  /* ---------- State, calculation, rendering ---------- */
  const num = (id) => Math.max(0, parseInt($(id).value, 10) || 0);
  const lines = (id) => $(id).value.split("\n").map((s) => s.trim()).filter(Boolean);

  function state() {
    return {
      ci: $("ci").value, co: $("co").value, adults: num("adults"), children: num("children"),
      rooms, meal: $("meal").value, addons,
      extraAdult: num("extraAdult"), extraChild: num("extraChild"), extraBed: num("extraBed"),
      discount: $("discount").value, discountType: $("discountType").value,
      override: $("override").value, gst: $("gst").value, advancePct: $("advancePct").value,
    };
  }

  let result = null;
  function update() {
    const st = state();
    result = P.calculate(prop, st);
    const r = result;

    $("nightsHint").textContent = r.nights > 0
      ? `${P.plural(r.nights, "night")} · ${P.fmtDate(st.ci)} → ${P.fmtDate(st.co)}`
      : "";

    let html = r.lines.map((l) => `<tr><td>${P.esc(l[0])}${l[1] ? `<span class="d">${P.esc(l[1])}</span>` : ""}</td><td class="amt">${P.inr(l[2])}</td></tr>`).join("");
    if (!r.lines.length) html = `<tr><td class="muted">Pick dates and rooms to see the price.</td><td></td></tr>`;
    html += sumRows(r);
    $("breakdown").innerHTML = html;
    $("warnings").innerHTML = r.warnings.map((w) => `<li>${P.esc(w)}</li>`).join("");

    $("barTotal").textContent = P.inr(r.total);
    $("barSub").textContent = r.advance ? `Advance ${P.inr(r.advance)}` : "Total incl. GST";

    store.set(DRAFT_KEY, snapshotForm());
  }

  function sumRows(r) {
    const row = (label, amt, cls = "sum") => `<tr class="${cls}"><td>${label}</td><td class="amt">${amt}</td></tr>`;
    let h = row("Subtotal", P.inr(r.subtotal));
    if (r.discount > 0) h += row(r.override ? "Special price discount" : "Discount", "− " + P.inr(r.discount));
    if (r.discount < 0) h += row("Adjustment", "+ " + P.inr(-r.discount));
    if (r.gstPct) h += row(`GST ${r.gstPct}%`, P.inr(r.gst));
    h += row("Total", P.inr(r.total), "total");
    if (r.advance) h += row(`Advance to confirm (${$("advancePct").value}%)`, P.inr(r.advance), "adv");
    return h;
  }

  // Everything except the PIN, so a reload or an accidental back-swipe keeps the work.
  const FIELDS = ["gName", "gPhone", "ci", "co", "adults", "children", "meal", "extraAdult", "extraChild", "extraBed", "discount", "discountType", "override", "gst", "advancePct", "validUntil", "inclusions", "exclusions", "note"];
  function snapshotForm() {
    const f = {};
    FIELDS.forEach((id) => (f[id] = $(id).value));
    return { propKey, rooms, addons, quoteId, f };
  }
  function restore(d) {
    setProperty(d.propKey);
    rooms = d.rooms;
    addons = d.addons;
    quoteId = d.quoteId;
    FIELDS.forEach((id) => { if (d.f[id] != null) $(id).value = d.f[id]; });
    renderRooms();
    renderAddons();
  }

  $("form").addEventListener("input", (e) => {
    if (e.target.closest("#rooms, #addons")) return;
    if (e.target.id === "prop") { setProperty(e.target.value); newQuote(); }
    if (e.target.id === "ci" && $("ci").value) {
      $("co").min = P.addDays($("ci").value, 1);
      if (!$("co").value || $("co").value <= $("ci").value) $("co").value = P.addDays($("ci").value, 1);
    }
    update();
  });
  $("form").addEventListener("submit", (e) => e.preventDefault());

  $("reset").addEventListener("click", () => {
    ["gName", "gPhone", "ci", "co", "note", "override"].forEach((id) => ($(id).value = ""));
    $("adults").value = 2;
    ["children", "extraAdult", "extraChild", "extraBed", "discount"].forEach((id) => ($(id).value = 0));
    setProperty(propKey);
    newQuote();
    update();
    window.scrollTo(0, 0);
  });

  /* ---------- Output ---------- */
  function quoteData() {
    const st = state();
    const r = result;
    return {
      v: 1, id: quoteId, p: propKey, cd: P.today(), vu: $("validUntil").value,
      m: { n: manager.name, ph: manager.phone },
      g: $("gName").value.trim(), ci: st.ci, co: st.co, n: r.nights, a: st.adults, k: st.children,
      l: r.lines, sub: r.subtotal, dis: r.discount, ov: r.override ? 1 : 0, gp: r.gstPct, gst: r.gst,
      tot: r.total, ap: Number(st.advancePct) || 0, adv: r.advance,
      inc: lines("inclusions"), exc: lines("exclusions"), note: $("note").value.trim(),
    };
  }

  function viewUrl() {
    // On the live sites, link to the chosen property's own domain so the guest sees
    // that property's address bar. Anywhere else (local dev, previews) stay on this host.
    const live = /(^|\.)chamtaburu\.in$/.test(location.hostname);
    const base = live ? `https://${prop.domain}/package/view` : `${location.origin}/package/view.html`;
    return base + "#q=" + P.encode(quoteData());
  }

  function message() {
    const d = quoteData();
    const guests = P.plural(d.a, "adult") + (d.k ? ", " + P.kids(d.k) : "");
    const out = [
      `*${prop.name} · Package Quote*`,
      `Ref: ${d.id}`,
      "",
      `Dear ${d.g},`,
      "Thank you for choosing us! Here is your package:",
      "",
      `📅 ${P.fmtDate(d.ci)} → ${P.fmtDate(d.co)} (${P.plural(d.n, "night")})`,
      `👥 ${guests}`,
      "",
      ...d.l.map((l) => `• ${l[0]}: ${P.inr(l[2])}`),
      "",
    ];
    if (d.dis > 0) out.push(`Discount: −${P.inr(d.dis)}`);
    if (d.gp) out.push(`GST ${d.gp}%: ${P.inr(d.gst)}`);
    out.push(`*Total: ${P.inr(d.tot)}*`);
    if (d.adv) out.push(`Advance to confirm: *${P.inr(d.adv)}*`);
    out.push("", "Full details and payment:", viewUrl(), "");
    if (d.vu) out.push(`Valid until ${P.fmtDate(d.vu)}.`);
    out.push(`${manager.name}, ${prop.name}`, `📞 ${P.prettyPhone(manager.phone)}`);
    return out.join("\n");
  }

  function problems() {
    if (!$("gName").value.trim()) return ["gName", "Add the guest's name."];
    if (!P.waNumber($("gPhone").value)) return ["gPhone", "Check the guest's WhatsApp number."];
    if (!(result.nights > 0)) return ["ci", "Pick check-in and check-out dates."];
    if (!result.lines.length || !rooms.some((r) => r.q)) return ["addRoom", "Add at least one room."];
    return null;
  }
  function guard() {
    const p = problems();
    if (!p) return true;
    toast(p[1]);
    $(p[0]).focus();
    return false;
  }

  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  $("send").addEventListener("click", () => {
    if (!guard()) return;
    const url = `https://wa.me/${P.waNumber($("gPhone").value)}?text=${encodeURIComponent(message())}`;
    if (!window.open(url, "_blank", "noopener")) location.href = url;
  });
  $("preview").addEventListener("click", () => {
    if (!result.lines.length) { toast("Add dates and a room first."); return; }
    window.open(viewUrl(), "_blank", "noopener");
  });
  $("copy").addEventListener("click", async () => {
    if (!guard()) return;
    try { await navigator.clipboard.writeText(message()); toast("Message copied."); }
    catch { toast("Couldn't copy. Use Send on WhatsApp instead."); }
  });

  /* ---------- Resume a session ---------- */
  const saved = store.get(SESSION_KEY);
  const m = saved && C.managers.find((x) => x.pin === saved);
  if (m) start(m);
  else $("pin").focus();
})();
