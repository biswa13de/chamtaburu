/*
 * /package — manager-only package generator.
 *
 * Managers sign in with a code sent by SMS (auth.js). Their number picks the
 * manager from Firestore (P.loadManager), and firestore.rules only lets those
 * numbers save quotes (docs/village-resort-package.md, decision 1).
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
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

  /* ---------- Sign-in ---------- */
  let A = null; // auth.js, once loaded
  const loginErr = $("loginErr");

  // "98765 43210", "098765 43210" or "+91 98765 43210" → "+919876543210".
  function e164(s) {
    const d = s.replace(/\D/g, "");
    if (d.length === 10) return "+91" + d;
    if (d.length === 11 && d[0] === "0") return "+91" + d.slice(1);
    if (d.length === 12 && d.startsWith("91")) return "+" + d;
    return null;
  }

  const AUTH_ERRORS = {
    "auth/invalid-phone-number": "That doesn't look like a mobile number.",
    "auth/too-many-requests": "Too many tries. Wait a while and try again.",
    "auth/invalid-verification-code": "Wrong code. Check the SMS and try again.",
    "auth/code-expired": "That code has expired. Send a new one.",
    "auth/quota-exceeded": "Too many SMS sent today. Try again tomorrow.",
    "auth/operation-not-allowed": "Phone sign-in isn't switched on yet.",
    "auth/invalid-api-key": "Sign-in isn't set up yet (Firebase key missing in auth.js).",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Sign-in isn't set up yet (Firebase key missing in auth.js).",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
  };

  function showStep(step) {
    $("phoneForm").hidden = step !== "phone";
    $("codeForm").hidden = step !== "code";
    $(step === "phone" ? "loginPhone" : "loginCode").focus();
  }

  async function signInStep(btn, label, fn) {
    const text = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    loginErr.textContent = "";
    try { await fn(); }
    catch (e) {
      console.error(e);
      loginErr.textContent = AUTH_ERRORS[e && e.code] || "Couldn't sign in. Try again.";
    }
    finally { btn.disabled = false; btn.textContent = text; }
  }

  $("phoneForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = e164($("loginPhone").value);
    if (!phone) { loginErr.textContent = "Enter your 10-digit mobile number."; return; }
    signInStep($("sendBtn"), "Sending…", async () => {
      // Checked before sending, so an SMS never goes to a number that can't sign in.
      if (!(await P.loadManager(phone))) { loginErr.textContent = "This number isn't on the manager list."; return; }
      await A.sendCode(phone);
      $("codeSentTo").textContent = `Enter the 6-digit code sent by SMS to ${P.prettyPhone(phone.slice(1)).replace(/ /g, " ")}.`;
      $("loginCode").value = "";
      showStep("code");
    });
  });

  $("codeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    signInStep($("codeBtn"), "Checking…", () => A.confirmCode($("loginCode").value.trim()));
  });

  $("changeNumber").addEventListener("click", () => {
    loginErr.textContent = "";
    showStep("phone");
  });

  $("logout").addEventListener("click", async () => {
    store.del(DRAFT_KEY);
    await A.logout();
    location.reload();
  });

  /* ---------- Setup ---------- */
  function start(m) {
    manager = m;
    m.props = m.props || Object.keys(C.properties);
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
    }
    update();
    renderRecent();
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

  // The whole form, so a reload or an accidental back-swipe keeps the work.
  const FIELDS = ["gName", "gPhone", "ci", "co", "adults", "children", "meal", "extraAdult", "extraChild", "extraBed", "discount", "discountType", "override", "gst", "advancePct", "validUntil", "inclusions", "exclusions", "note"];
  function snapshotForm() {
    const f = {};
    FIELDS.forEach((id) => (f[id] = $(id).value));
    return { propKey, rooms, addons, f };
  }
  function restore(d) {
    setProperty(d.propKey);
    rooms = d.rooms;
    addons = d.addons;
    FIELDS.forEach((id) => { if (d.f[id] != null) $(id).value = d.f[id]; });
    renderRooms();
    renderAddons();
  }

  $("form").addEventListener("input", (e) => {
    if (e.target.closest("#rooms, #addons")) return;
    if (e.target.id === "prop") setProperty(e.target.value);
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
    update();
    window.scrollTo(0, 0);
  });

  /* ---------- Output ---------- */
  function quoteData() {
    const st = state();
    const r = result;
    return {
      v: 1, p: propKey, cd: P.today(), vu: $("validUntil").value,
      m: { n: manager.name, ph: P.contactFor(manager.phone, propKey) },
      g: $("gName").value.trim(), ci: st.ci, co: st.co, n: r.nights, a: st.adults, k: st.children,
      l: r.lines, sub: r.subtotal, dis: r.discount, ov: r.override ? 1 : 0, gp: r.gstPct, gst: r.gst,
      tot: r.total, ap: Number(st.advancePct) || 0, adv: r.advance,
      inc: lines("inclusions"), exc: lines("exclusions"), note: $("note").value.trim(),
    };
  }

  // Send, Copy and Preview on the same package share one saved quote and code.
  // Any edit after that saves a new quote (and code) on the next tap, so a
  // link already sent always shows exactly what was sent.
  let saved = null;
  async function ensureSaved() {
    const data = quoteData();
    const key = JSON.stringify(data);
    if (saved && saved.key === key) return saved;
    const code = await P.saveQuote(propKey, (c) => ({ ...data, id: `${prop.prefix}-${c}` }), await A.token());
    saved = { key, data, ref: `${prop.prefix}-${code}`, url: viewUrl(code) };
    remember(saved);
    return saved;
  }

  function viewUrl(code) {
    // Live sites link to the chosen property's own domain. Firebase previews keep
    // their own host. Local dev has no /p/ rewrite, so it uses the file directly.
    if (/(^|\.)chamtaburu\.in$/.test(location.hostname)) return `https://${prop.domain}/p/${code}`;
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return `${location.origin}/package/view.html?c=${code}`;
    return `${location.origin}/p/${code}`;
  }

  // Short on purpose: the guest reads it on a phone, and the link has the full breakdown.
  function message(s) {
    const d = s.data;
    const sameYear = d.ci.slice(0, 4) === d.co.slice(0, 4);
    const from = sameYear ? P.fmtDate(d.ci).replace(/ \d{4}$/, "") : P.fmtDate(d.ci);
    const roomText = rooms.filter((r) => r.q).map((r) => {
      const room = prop.rooms.find((x) => x.id === r.id);
      return (r.q > 1 ? r.q + " × " : "") + room.name + (r.ac && room.ac ? " (AC)" : "");
    }).join(", ");
    const meal = prop.meals.find((m) => m.id === $("meal").value);
    const out = [
      `*${prop.name}*`,
      `Hello ${d.g}, here is your stay package 🌿`,
      "",
      `📅 ${from} – ${P.fmtDate(d.co)} · ${P.plural(d.n, "night")}`,
      `👥 ${P.plural(d.a, "adult")}${d.k ? ", " + P.kids(d.k) : ""}`,
      `🏡 ${roomText}`,
    ];
    if (meal && (meal.adult || meal.child)) out.push(`🍽 ${meal.name}`);
    out.push(`💰 Total *${P.inr(d.tot)}*${d.gp ? " (incl. GST)" : ""}`);
    if (d.adv) out.push(`✅ Advance to confirm: *${P.inr(d.adv)}*`);
    out.push("", "Full details & confirm here:", s.url, "");
    out.push(`Ref ${s.ref}${d.vu ? " · valid till " + P.fmtDate(d.vu) : ""}`);
    out.push(`${manager.name} · ${P.prettyPhone(P.contactFor(manager.phone, propKey))}`);
    return out.join("\n");
  }

  function problems(needPhone) {
    if (!$("gName").value.trim()) return ["gName", "Add the guest's name."];
    if (needPhone && !P.waNumber($("gPhone").value)) return ["gPhone", "Check the guest's WhatsApp number."];
    if (!(result.nights > 0)) return ["ci", "Pick check-in and check-out dates."];
    if (!result.lines.length || !rooms.some((r) => r.q)) return ["addRoom", "Add at least one room."];
    return null;
  }
  function guard(needPhone = true) {
    const p = problems(needPhone);
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

  let busy = false;
  async function withSaved(fn) {
    if (busy) return;
    busy = true;
    ["send", "copy", "preview"].forEach((id) => ($(id).disabled = true));
    $("send").textContent = "Saving…";
    try {
      await fn(await ensureSaved());
    } catch {
      toast("Couldn't save the package. Check the internet and try again.");
    } finally {
      busy = false;
      ["send", "copy", "preview"].forEach((id) => ($(id).disabled = false));
      $("send").textContent = "Send on WhatsApp";
    }
  }

  // Not window.open(url, "_blank", "noopener"): that always returns null, which
  // would look like a blocked popup and send this tab to the same URL as well.
  function openTab(url) {
    const w = window.open(url, "_blank");
    if (w) w.opener = null;
    else location.href = url;
  }

  $("send").addEventListener("click", () => {
    if (!guard()) return;
    withSaved((s) => openTab(`https://wa.me/${P.waNumber($("gPhone").value)}?text=${encodeURIComponent(message(s))}`));
  });
  $("preview").addEventListener("click", () => {
    if (!guard(false)) return;
    withSaved((s) => openTab(s.url));
  });
  $("copy").addEventListener("click", () => {
    if (!guard(false)) return;
    withSaved(async (s) => {
      try { await navigator.clipboard.writeText(message(s)); toast("Message copied."); }
      catch { toast("Couldn't copy. Use Send on WhatsApp instead."); }
    });
  });

  /* ---------- Recent packages (this device only) ---------- */
  const RECENT_KEY = "pkg-recent";
  function recent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; }
  }
  function remember(s) {
    const item = { ref: s.ref, url: s.url, g: s.data.g, ci: s.data.ci, tot: s.data.tot, by: manager.name };
    const list = [item, ...recent().filter((x) => x.ref !== s.ref)].slice(0, 30);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* private mode */ }
    renderRecent();
  }
  function renderRecent() {
    const list = recent();
    $("recentCard").hidden = !list.length;
    $("recent").innerHTML = list.map((x) => `<li>
        <a href="${P.esc(x.url)}" target="_blank" rel="noopener">${P.esc(x.ref)}</a>
        <span class="muted">${P.esc(x.g)} · ${P.fmtDate(x.ci)} · ${P.inr(x.tot)} · ${P.esc(x.by)}</span>
        <button class="btn small" type="button" data-url="${P.esc(x.url)}">Copy link</button>
      </li>`).join("");
  }
  $("recent").addEventListener("click", async (e) => {
    const url = e.target.dataset.url;
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast("Link copied."); }
    catch { toast("Couldn't copy the link."); }
  });

  /* ---------- Start: resume a sign-in, or ask for the number ---------- */
  import("/package/auth.js").then((mod) => {
    A = mod;
    A.onUser(async (user) => {
      if (!user) { $("loginWait").hidden = true; showStep("phone"); return; }
      let m;
      try { m = await P.loadManager(user.phoneNumber); }
      catch (e) { console.error(e); $("loginWait").textContent = "Couldn't reach the server. Check your connection and reload."; return; }
      $("loginWait").hidden = true;
      if (m) { if (!manager) start(m); return; }
      // Signed in on this phone, but since removed from the manager list.
      loginErr.textContent = "This number isn't on the manager list.";
      A.logout();
    });
  }).catch((e) => {
    console.error(e);
    $("loginWait").textContent = "Couldn't load sign-in. Check your connection and reload.";
  });
})();
