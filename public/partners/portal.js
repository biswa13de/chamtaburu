/*
 * /partners — the travel partners' own page: sign up, wait for approval, then
 * see the B2B net rates.
 *
 * 1. Create an account with email and password (auth.js); Firebase emails a
 *    link to confirm the address.
 * 2. Business details and the B2B terms (rates.js `partners`) → their
 *    partners/{uid} document, status "pending" (b2b-core.js).
 * 3. An admin approves them at /package/partners, for one or both properties.
 * 4. Rates: each property's public rate calendar less its B2B discounts
 *    (b2bRates/{property}, which firestore.rules only lets approved partners
 *    and managers read), with sold-out and closed dates. Bookings are asked
 *    for on WhatsApp.
 *
 * The rules, not this page, keep rates from anyone else: this page only shows
 * what Firestore hands over.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const B = window.B2B;
  const $ = (id) => document.getElementById(id);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const params = new URLSearchParams(location.search);
  const MONTHS_AHEAD = 12;
  const MANAGER_DOMAIN = /@managers\.chamtaburu\.in$/i;
  const siteKey = location.hostname.indexOf("resort.") === 0 ? "resort" : "village";

  let A = null;
  let user = null;
  let partner = null;
  let authMode = "in"; // in | up
  let propKey = "";
  let prop = null;
  let b2b = null;
  const b2bs = {}; // propKey → plan, or null (not set up)
  let view = "rooms"; // rooms | pkg | terms
  let pick = "";
  let month = "";
  let picked = ""; // the date tapped

  const today = P.today();
  const num = (n) => Math.round(n).toLocaleString("en-IN");
  const inr = (n) => (n == null ? "—" : "₹" + num(n));

  /* ---------- Screens ---------- */
  const SCREENS = ["sAuth", "sVerify", "sProfile", "sPending", "sStop", "sRates"];
  function show(id) {
    $("booting").hidden = true;
    SCREENS.forEach((s) => ($(s).hidden = s !== id));
    $("whoBox").hidden = !user;
    if (user) $("who").textContent = partner && partner.agency ? partner.agency : user.email || "";
  }
  function fatal(msg) {
    $("booting").hidden = true;
    $("fatal").hidden = false;
    $("fatal").textContent = msg;
  }

  // Who partners message: the property's first booking manager, else the property.
  function contactOf(key) {
    const p = C.properties[key];
    const calls = P.bookingCalls(p);
    return calls.length ? calls[0].phone : p.phone;
  }
  const waLink = (key, text) => `https://wa.me/${contactOf(key)}?text=${encodeURIComponent(text)}`;

  const termsHtml = () => C.partners.terms.map((t) => `<li>${P.esc(t)}</li>`).join("");
  $("termsList").innerHTML = termsHtml();
  $("termsList2").innerHTML = termsHtml();

  /* ---------- Sign in / create account ---------- */
  document.querySelector("#sAuth .tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (!b) return;
    authMode = b.dataset.mode;
    document.querySelectorAll("#sAuth .tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    $("pw2Lbl").hidden = authMode !== "up";
    $("pw").autocomplete = authMode === "up" ? "new-password" : "current-password";
    $("authBtn").textContent = authMode === "up" ? "Create account" : "Sign in";
    $("forgot").hidden = authMode === "up";
    $("authErr").textContent = "";
  });

  const AUTH_ERRORS = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/email-already-in-use": "There's already an account with this email. Sign in instead.",
    "auth/weak-password": "Choose a longer password: at least 8 characters.",
    "auth/too-many-requests": "Too many tries. Wait a few minutes and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/operation-not-allowed": "Sign-up is switched off just now. Please message us on WhatsApp.",
    "auth/admin-restricted-operation": "Sign-up is switched off just now. Please message us on WhatsApp.",
  };
  const authMsg = (e) => AUTH_ERRORS[e && e.code] || "Something went wrong. Try again.";

  $("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const pw = $("pw").value;
    const err = $("authErr");
    err.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (err.textContent = "Type your email address.");
    if (MANAGER_DOMAIN.test(email)) return (err.textContent = "Managers sign in on the Package Generator.");
    if (pw.length < 8) return (err.textContent = "Passwords are at least 8 characters.");
    if (authMode === "up" && pw !== $("pw2").value) return (err.textContent = "The two passwords don't match.");
    $("authBtn").disabled = true;
    try {
      if (authMode === "up") {
        await A.signUpPartner(email, pw);
        holdSend(RESEND_GAP); // the first email just went
      } else await A.signInPartner(email, pw);
    } catch (x) {
      console.error(x);
      err.textContent = authMsg(x);
    } finally {
      $("authBtn").disabled = false;
    }
  });

  $("forgot").addEventListener("click", async () => {
    const email = $("email").value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ($("authErr").textContent = "Type your email above, then tap Forgot password.");
    try {
      await A.resetPassword(email);
      toast("If there's an account, we've emailed a link to set a new password.");
    } catch (x) {
      console.error(x);
      $("authErr").textContent = authMsg(x);
    }
  });

  $("logout").addEventListener("click", async () => {
    if (A) await A.logout();
    location.reload();
  });

  /* ---------- Verify email ---------- */
  // Firebase refuses confirmation emails sent too close together, so:
  // "Send again" waits 60 s after any send (10 min after Firebase says no),
  // remembered across reloads; both buttons lock while busy; and the page
  // checks by itself (every 10 s, and on coming back to the tab), so there
  // is nothing to keep pressing.
  const RESEND_GAP = 60e3;
  const BLOCKED_GAP = 10 * 60e3;
  const sentKey = () => "partnerVerifySent:" + ((user && user.email) || $("email").value.trim()).toLowerCase();
  function nextSendAt() {
    try { return Number(localStorage.getItem(sentKey())) || 0; } catch { return 0; }
  }
  function holdSend(ms) {
    try { localStorage.setItem(sentKey(), String(Date.now() + ms)); } catch { /* private mode */ }
    tickResend();
  }
  let resendTimer = 0;
  let resending = false;
  function tickResend() {
    clearTimeout(resendTimer);
    const left = Math.ceil((nextSendAt() - Date.now()) / 1000);
    const btn = $("vResend");
    btn.disabled = resending || left > 0;
    btn.textContent = resending ? "Sending…" : left > 0 ? `Send again in ${left > 90 ? Math.ceil(left / 60) + " min" : left + "s"}` : "Send again";
    if (left > 0 && !$("sVerify").hidden) resendTimer = setTimeout(tickResend, 1000);
  }

  let checking = false;
  async function checkVerified(byHand) {
    if (checking || !user || user.emailVerified) return;
    checking = true;
    if (byHand) { $("vDone").disabled = true; $("vDone").textContent = "Checking…"; $("vErr").textContent = ""; }
    try {
      user = await A.refreshUser();
      if (user.emailVerified) { stopWatch(); return route(); }
      if (byHand) $("vErr").textContent = "Not confirmed yet. Tap the link in the email first, then come back here.";
    } catch (x) {
      console.error(x);
      if (byHand) $("vErr").textContent = authMsg(x);
    } finally {
      checking = false;
      $("vDone").disabled = false;
      $("vDone").textContent = "I've confirmed it";
    }
  }
  let watchTimer = 0;
  const onBack = () => { if (!document.hidden) checkVerified(false); };
  function startWatch() {
    stopWatch();
    watchTimer = setInterval(() => { if (!document.hidden) checkVerified(false); }, 10e3);
    document.addEventListener("visibilitychange", onBack);
    window.addEventListener("focus", onBack);
  }
  function stopWatch() {
    clearInterval(watchTimer);
    document.removeEventListener("visibilitychange", onBack);
    window.removeEventListener("focus", onBack);
  }

  $("vDone").addEventListener("click", () => checkVerified(true));
  $("vResend").addEventListener("click", async () => {
    if (resending || nextSendAt() > Date.now()) return;
    resending = true;
    $("vErr").textContent = "";
    tickResend();
    try {
      await A.resendVerification();
      toast("Sent. Check your inbox and spam.");
      holdSend(RESEND_GAP);
    } catch (x) {
      console.error(x);
      if (x && x.code === "auth/too-many-requests") {
        $("vErr").textContent = "We've already sent you a few emails. Use the link in the latest one. If none arrived, check spam or try again in 10 minutes.";
        holdSend(BLOCKED_GAP);
      } else {
        $("vErr").textContent = authMsg(x);
      }
    } finally {
      resending = false;
      tickResend();
    }
  });

  /* ---------- Business details ---------- */
  const FIELDS = { agency: "fAgency", contact: "fContact", phone: "fPhone", city: "fCity", gstin: "fGstin", web: "fWeb", member: "fMember" };
  let editing = false;

  function openProfile(edit) {
    editing = edit;
    $("pTitle").textContent = edit ? "Edit your details" : "Your agency";
    $("pTerms").hidden = edit;
    $("pBtn").textContent = edit ? "Save" : "Send for approval";
    $("pCancel").hidden = !edit;
    $("pErr").textContent = "";
    Object.entries(FIELDS).forEach(([k, id]) => ($(id).value = partner ? (k === "phone" ? partner.phone.replace(/^91/, "") : partner[k] || "") : ""));
    show("sProfile");
  }
  $("pCancel").addEventListener("click", () => route());
  $("pendingEdit").addEventListener("click", () => openProfile(true));

  function readProfile() {
    const v = Object.fromEntries(Object.entries(FIELDS).map(([k, id]) => [k, $(id).value.trim().replace(/\s+/g, " ")]));
    v.gstin = v.gstin.toUpperCase().replace(/\s/g, "");
    if (v.agency.length < 2) return "Type your agency's name.";
    if (v.contact.length < 2) return "Type your name.";
    const wa = P.waNumber(v.phone);
    if (!/^91[6-9]\d{9}$/.test(wa)) return "Type a 10-digit Indian mobile number.";
    v.phone = wa;
    if (v.city.length < 2) return "Type your city.";
    if (v.gstin && !/^\d{2}[A-Z0-9]{13}$/.test(v.gstin)) return "A GSTIN is 15 characters, starting with 2 digits. Leave it empty if you don't have one.";
    return v;
  }

  $("pForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = readProfile();
    if (typeof v === "string") return ($("pErr").textContent = v);
    if (!editing && !$("fTerms").checked) return ($("pErr").textContent = "Please accept the B2B terms.");
    $("pBtn").disabled = true;
    try {
      const t = await A.token();
      if (editing) await B.updateProfile(user.uid, v, t);
      else await B.createPartner(user.uid, v, user.email, t);
      partner = await B.loadPartner(user.uid, t);
      route();
    } catch (x) {
      console.error(x);
      $("pErr").textContent = x.status === 403
        ? "Couldn't save. Confirm your email first, or sign out and in again."
        : "Couldn't save. Check your connection and try again.";
    } finally {
      $("pBtn").disabled = false;
    }
  });

  /* ---------- Where the account stands ---------- */
  async function route() {
    if (!user) return show("sAuth");
    if (user.phoneNumber || MANAGER_DOMAIN.test(user.email || "")) {
      $("stopTitle").textContent = "This is a manager account";
      $("stopText").textContent = "This page is for travel partners. Sign out to use a partner account.";
      $("stopWa").hidden = true;
      return show("sStop");
    }
    if (!user.emailVerified) {
      $("vEmail").textContent = user.email;
      show("sVerify");
      tickResend();
      return startWatch();
    }
    stopWatch();
    if (partner === undefined || partner === null) {
      try { partner = await B.loadPartner(user.uid, await A.token()); }
      catch (x) { console.error(x); return fatal("Couldn't reach the server. Check your connection and reload."); }
    }
    if (!partner) return openProfile(false);
    if (partner.status === "approved") return startRates();
    if (partner.status === "suspended") {
      $("stopTitle").textContent = "Account paused";
      $("stopText").textContent = "Your partner account is paused, so rates aren't shown. Message us if you think this is a mistake.";
      $("stopWa").hidden = false;
      $("stopWa").href = waLink(siteKey, `Hello, this is ${partner.agency} (travel partner account ${user.email}). Our account shows as paused.`);
      return show("sStop");
    }
    $("pendingSum").innerHTML = [["Agency", partner.agency], ["Contact", partner.contact], ["Mobile", P.prettyPhone(partner.phone)], ["City", partner.city], ["Email", partner.email]]
      .map(([k, v]) => `<div><b>${k}:</b> ${P.esc(v)}</div>`).join("");
    $("pendingWa").href = waLink(siteKey, `Hello, this is ${partner.contact} from ${partner.agency}, ${partner.city}. We've signed up as a travel partner (${user.email}). Please approve our account.`);
    show("sPending");
  }

  /* ---------- Rates ---------- */
  function allowedProps() {
    return (partner.props || Object.keys(C.properties)).filter((k) => C.properties[k]);
  }

  function startRates() {
    show("sRates");
    const allowed = allowedProps();
    $("propSwitch").hidden = allowed.length < 2;
    $("propSwitch").innerHTML = allowed.map((k) => `<a href="#" data-p="${k}">${P.esc(C.properties[k].name.replace("Chamtaburu ", ""))}</a>`).join("");
    $("termsAccepted").textContent = partner.terms ? `Accepted when you signed up (version ${partner.terms}).` : "";
    if (!demo) {
      // When the partner last looked, for the managers' list; once per visit.
      let seen = false;
      try { seen = sessionStorage.getItem("partnerSeen") === user.uid; sessionStorage.setItem("partnerSeen", user.uid); } catch { /* private mode */ }
      if (!seen) A.token().then((t) => B.markSeen(user.uid, t)).catch((e) => console.warn(e));
    }
    const want = params.get("p");
    setProperty(allowed.includes(want) ? want : allowed.includes(siteKey) ? siteKey : allowed[0]);
  }

  $("propSwitch").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-p]");
    if (!a) return;
    e.preventDefault();
    if (a.dataset.p !== propKey) setProperty(a.dataset.p);
  });

  async function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    document.querySelectorAll("#propSwitch a").forEach((a) => (a.dataset.p === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    $("policies").href = `https://${prop.domain}/legal`;
    pick = B.rateTypes(prop)[0].id;
    if (view === "pkg") pick = B.tiers(prop)[0];
    month = today.slice(0, 7);
    picked = "";
    b2b = null;
    $("rateErr").hidden = true;
    $("grid").innerHTML = `<p class="hint" style="grid-column:1/-1">Loading rates…</p>`;
    $("detail").hidden = true;
    try {
      if (!(key in b2bs)) {
        const [cal, got] = demo
          ? [null, { plan: B.normPlan(B.DEFAULT_PLAN), days: B.seedB2B(prop).days }]
          : await Promise.all([P.loadCalendar(key), A.token().then((t) => B.loadB2B(key, t))]);
        C.properties[key].calendar = cal;
        b2bs[key] = got;
      }
      if (key !== propKey) return;
      b2b = b2bs[key];
    } catch (x) {
      console.error(x);
      $("rateErr").hidden = false;
      $("rateErr").textContent = x.status === 403
        ? "Your account can't see these rates. Sign out and in again, or message us."
        : "Couldn't load the rates. Check your connection and reload.";
      $("grid").innerHTML = "";
      return;
    }
    if (!b2b) {
      $("rateErr").hidden = false;
      $("rateErr").textContent = `B2B rates for ${prop.name} aren't ready yet. Message us on WhatsApp for a rate.`;
      $("grid").innerHTML = "";
      return;
    }
    render();
  }

  document.querySelector("#rateTabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-view]");
    if (!b || b.dataset.view === view) return;
    view = b.dataset.view;
    if (prop) pick = view === "pkg" ? B.tiers(prop)[0] : B.rateTypes(prop)[0].id;
    render();
  });

  function render() {
    document.querySelectorAll("#rateTabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === view)));
    $("calView").hidden = view === "terms";
    $("termsView").hidden = view !== "terms";
    if (view === "terms" || !b2b) return;
    renderChips();
    renderGrid();
    renderDetail();
  }

  function renderChips() {
    const list = view === "rooms"
      ? B.rateTypes(prop).map((t) => ({ id: t.id, name: t.name, note: t.note }))
      : B.tiers(prop).map((t) => ({ id: t, name: B.tierName(prop, t) }));
    $("chips").innerHTML = list.map((x) => `<button type="button" data-id="${P.esc(x.id)}" aria-pressed="${x.id === pick}">${P.esc(x.name)}</button>`).join("");
    const cur = list.find((x) => x.id === pick) || {};
    $("typeNote").textContent = view === "rooms"
      ? [cur.note, "Net rate per room per night, before GST." + (B.hasAc(prop, pick) ? " Bottom number: AC." : "")].filter(Boolean).join(" · ")
      : `Net price per adult per night, all meals, before GST. Calendar shows Non-AC, ${B.sizes(prop, pick)[0]} adults sharing; tap a date for every size. Children (${prop.childAge}) pay half.`;
  }

  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    pick = b.dataset.id;
    render();
  });

  const daysIn = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const shiftMonth = (ym, n) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
  const monthDates = (ym) => Array.from({ length: daysIn(ym) }, (_, i) => ym + "-" + String(i + 1).padStart(2, "0"));
  const dow = (d) => new Date(d + "T00:00:00Z").getUTCDay();
  const lastMonth = shiftMonth(today.slice(0, 7), MONTHS_AHEAD);

  function cellFor(d) {
    if (view === "rooms") {
      const r = B.roomOn(prop, b2b, pick, d);
      const ac = B.hasAc(prop, pick) ? r.ac : null;
      const off = r.closed || r.soldOut;
      return {
        cls: r.closed ? "closed" : r.soldOut ? "sold" : "",
        v: off ? "—" : r.rate != null ? num(r.rate) : "—",
        v2: off ? "" : ac != null ? num(ac) : "",
        tag: r.soldOut ? "Sold out" : r.closed ? "On request" : "",
        label: r.soldOut ? "sold out" : r.closed ? "on request, message us" : `net ${inr(r.rate)}${ac != null ? ", AC " + inr(ac) : ""}`,
      };
    }
    const p = B.packageOn(prop, b2b, pick, d);
    const size = B.sizes(prop, pick)[0];
    const v = p.nonac && p.nonac[size] != null ? p.nonac[size] : null;
    return {
      cls: p.closed ? "closed" : "",
      v: p.closed ? "—" : v != null ? num(v) : "—",
      v2: p.closed ? "" : p.label,
      tag: p.closed ? "On request" : "",
      label: p.closed ? "on request, message us" : v != null ? `net ${inr(v)} per adult${p.label ? ", " + p.label : ""}` : "no package rate, message us",
    };
  }

  function renderGrid() {
    const [y, m] = month.split("-").map(Number);
    $("monthName").textContent = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
    $("prevMonth").disabled = month <= today.slice(0, 7);
    $("nextMonth").disabled = month >= lastMonth;
    const lead = (dow(month + "-01") + 6) % 7;
    const head = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => `<div class="wd" aria-hidden="true">${w}</div>`).join("");
    const blanks = Array.from({ length: lead }, () => `<span class="day blank" aria-hidden="true"></span>`).join("");
    const cells = monthDates(month).map((d) => {
      const c = cellFor(d);
      const cls = ["day", c.cls, d === picked && "sel", d === today && "today"].filter(Boolean).join(" ");
      return `<button type="button" class="${cls}" data-d="${d}"${d < today ? " disabled" : ""} aria-pressed="${d === picked}" aria-label="${P.esc(P.fmtDate(d) + ": " + c.label)}">
        <span class="dn">${Number(d.slice(8))}</span>
        <span class="v">${c.v}</span>
        ${c.v2 ? `<span class="v2">${P.esc(c.v2)}</span>` : ""}
        ${c.tag ? `<span class="${c.cls === "sold" ? "so" : "tag"}">${c.tag}</span>` : ""}
      </button>`;
    }).join("");
    $("grid").innerHTML = head + blanks + cells;
    $("legend").innerHTML = [
      view === "rooms" ? `<li><i class="l-sold"></i>Sold out</li>` : "",
      `<li><i class="l-closed"></i>On request: message us</li>`,
      `<li><i class="l-sel"></i>Selected</li>`,
    ].join("");
  }

  $("prevMonth").addEventListener("click", () => { month = shiftMonth(month, -1); renderGrid(); });
  $("nextMonth").addEventListener("click", () => { month = shiftMonth(month, 1); renderGrid(); });

  $("grid").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b || b.disabled) return;
    picked = picked === b.dataset.d ? "" : b.dataset.d;
    renderGrid();
    renderDetail();
    if (picked) $("detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // Every room type (or every package size) on the tapped date.
  function renderDetail() {
    const box = $("detail");
    box.hidden = !picked;
    $("calHint").hidden = !!picked;
    if (!picked) return;
    const d = picked;
    const day = B.dayOf(b2b, d);
    let body;
    let ask;
    if (view === "rooms") {
      const rows = B.rateTypes(prop).map((t) => {
        const r = B.roomOn(prop, b2b, t.id, d);
        const ac = B.hasAc(prop, t.id);
        const cell = (n, pub) => (r.soldOut ? `<span class="off">Sold out</span>` : r.closed ? `<span class="status">On request</span>` : n == null ? "—" : `<span class="net">${inr(n)}</span> <span class="pub">${inr(pub)}</span>`);
        return `<tr><td>${P.esc(t.name)}${t.note ? `<small>${P.esc(t.note)}</small>` : ""}</td><td>${cell(r.rate, r.pub.rate)}</td><td>${ac ? cell(r.ac, r.pub.ac) : "—"}</td></tr>`;
      }).join("");
      body = `<table><thead><tr><th>Room</th><th>Net / night</th><th>AC</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="hint">Net rate, then the public rate on our website. Before GST. Room only: extra adults ${inr(prop.extras.adult)}, children ${prop.childAge} ${inr(prop.extras.child)} per night at the public rate.</p>`;
      ask = (B.rateTypes(prop).find((t) => t.id === pick) || {}).name;
    } else {
      const p = B.packageOn(prop, b2b, pick, d);
      const rows = B.sizes(prop, pick).map((n) => {
        const cell = (tb, pub) => (p.closed ? `<span class="status">On request</span>` : tb && tb[n] != null ? `<span class="net">${inr(tb[n])}</span> <span class="pub">${inr(pub && pub[n])}</span>` : "—");
        return `<tr><td>${n} adults</td><td>${cell(p.nonac, p.pub.nonac)}</td><td>${cell(p.ac, p.pub.ac)}</td></tr>`;
      }).join("");
      const rooms = prop.rooms.filter((r) => r.tier === pick).map((r) => r.name);
      body = `${p.label ? `<p style="margin:0 0 6px"><b>${P.esc(p.label)}</b></p>` : ""}
        <table><thead><tr><th>Adults sharing a room</th><th>Non-AC / adult</th><th>AC / adult</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="hint">Per adult per night, all meals, before GST. Net, then the public price. Children (${prop.childAge}) pay half. One adult pays as ${B.sizes(prop, pick)[0]}.${rooms.length > 1 ? " For " + P.esc(rooms.join(", ")) + "." : ""}</p>`;
      ask = "Package · " + B.tierName(prop, pick);
    }
    const msg = `Hello, this is ${partner.contact} from ${partner.agency} (travel partner). B2B booking enquiry for ${prop.name}: ${ask}, check-in ${P.fmtDate(d)}. Nights: , rooms: , adults: , children: .`;
    box.innerHTML = `<h2>${new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</h2>
      ${day.closed ? `<p class="banner" style="margin:0 0 10px">This date is on request for partners. Message us for availability and a rate.</p>` : ""}
      ${body}
      <div class="row"><a class="btn wa" href="${P.esc(waLink(propKey, msg))}" target="_blank" rel="noopener">Ask to book on WhatsApp</a></div>
      <p class="hint">We confirm availability first. 50% advance to confirm, the balance before check-in.</p>`;
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 4000);
  }

  /* ---------- Start ---------- */
  // Local only: ?demo shows an approved partner's rates (the default
  // discounts) without signing in; ?demo=pending, ?demo=new the other screens.
  const demo = local && params.has("demo");
  if (demo) {
    const d = params.get("demo");
    user = { uid: "demo", email: "trips@example.com", emailVerified: d !== "verify" };
    partner = d === "new" || d === "verify" ? null : { agency: "Hill Trails Holidays", contact: "Demo Contact", phone: "919876543210", city: "Kolkata", email: user.email, status: d === "pending" ? "pending" : "approved", terms: C.partners.termsVersion, props: null };
    A = { logout: async () => {}, token: async () => "", refreshUser: async () => user, resendVerification: async () => {} };
    let saved = partner;
    B.loadPartner = async () => saved;
    B.createPartner = async (uid, v, email) => { saved = { ...v, email, status: "pending", terms: C.partners.termsVersion, props: null }; };
    B.updateProfile = async (uid, v) => { saved = { ...saved, ...v }; };
    route();
    return;
  }

  import("/package/auth.js").then((mod) => {
    A = mod;
    A.onUser(async (u) => {
      user = u;
      partner = undefined;
      if (!u) return route();
      // Back from the email link: the saved account still says unverified.
      if (!u.emailVerified && u.email) {
        try { user = await A.refreshUser(); } catch (e) { console.warn(e); }
      }
      route();
    });
  }).catch((e) => {
    console.error(e);
    fatal("Couldn't load sign-in. Check your connection and reload.");
  });
})();
