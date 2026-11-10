/*
 * /package — manager-only package generator.
 *
 * Managers sign in with a code sent by SMS (auth.js). Their number picks the
 * manager from Firestore (P.loadManager), and firestore.rules only lets those
 * numbers save quotes (docs/village-resort-package.md, decision 1).
 *
 * A manager signed in on this phone is remembered (MANAGER_KEY), so the form
 * shows at once instead of after the sign-in code and manager check load;
 * those finish in the background, and saving waits for them.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
  const DRAFT_KEY = "pkg-draft";
  const MANAGER_KEY = "pkg-manager";
  const storage = (s) => ({
    get(k) { try { return JSON.parse(s().getItem(k)); } catch { return null; } },
    set(k, v) { try { s().setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
    del(k) { try { s().removeItem(k); } catch { /* private mode */ } },
  });
  const store = storage(() => sessionStorage); // the draft: this tab only
  const kept = storage(() => localStorage); // the signed-in manager: until Sign out

  let manager = null;
  let prop = null;
  let propKey = "";
  let rooms = [];
  let addons = {};
  let custom = []; // the manager's own items: [{ n: name, q: quantity, p: price each }]
  let edits = {}; // a manager's own price per line, by line key (P.calculate)
  let fromReq = null; // the booking request this package answers, until it's saved

  /* ---------- Sign-in ---------- */
  let A = null; // auth.js, once loaded
  const loginErr = $("loginErr");
  // Resolves once Firebase confirms who is signed in; anything that needs
  // their ID token waits for it.
  let authReady;
  const authed = new Promise((r) => (authReady = r));
  const token = async () => { await authed; return A.token(); };

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
    // Also what Firebase returns when the SMS region policy doesn't allow India.
    "auth/operation-not-allowed": "Phone sign-in or SMS to India isn't switched on in Firebase yet.",
    "auth/configuration-not-found": "Sign-in isn't set up in Firebase yet (Authentication → Get started).",
    "auth/invalid-api-key": "Sign-in isn't set up yet (Firebase key missing in auth.js).",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Sign-in isn't set up yet (Firebase key missing in auth.js).",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    // Google's robot check (reCAPTCHA) failed or expired; common in apps' built-in browsers.
    "auth/invalid-app-credential": "Google's robot check failed. Open this page in Chrome or Safari (not inside WhatsApp), reload, and try again.",
    "auth/captcha-check-failed": "Google's robot check failed. Open this page in Chrome or Safari (not inside WhatsApp), reload, and try again.",
    "auth/missing-app-credential": "Google's robot check didn't load. Reload the page and try again.",
    "auth/web-storage-unsupported": "This browser blocks sign-in. Open the page in Chrome or Safari, not a private tab or an app's built-in browser.",
    "auth/unauthorized-domain": "This web address isn't allowed to sign in yet (Firebase → Authentication → Settings → Authorized domains).",
    "auth/timeout": "Google took too long to answer. Try again.",
    // Google holds back SMS it thinks is abuse, for a while.
    "auth/error-code:-39": "Google has paused SMS to this number for now. Try again in a few hours.",
    "auth/missing-verification-code": "Enter the 6-digit code from the SMS.",
    "auth/invalid-verification-id": "That code request has expired. Send a new code.",
    "auth/session-expired": "That code has expired. Send a new one.",
  };

  function showStep(step) {
    $("phoneForm").hidden = step !== "phone";
    $("codeForm").hidden = step !== "code";
    $(step === "phone" ? "loginPhone" : "loginCode").focus();
  }

  // Password sign-in has its own meaning for some codes.
  const PASSWORD_ERRORS = {
    "auth/invalid-credential": "Wrong number or password. No password yet? Use Send SMS code.",
    "auth/wrong-password": "Wrong number or password. No password yet? Use Send SMS code.",
    "auth/user-not-found": "Wrong number or password. No password yet? Use Send SMS code.",
    "auth/invalid-email": "That doesn't look like a mobile number.",
    "auth/user-disabled": "This sign-in has been switched off.",
    "auth/operation-not-allowed": "Password sign-in isn't switched on in Firebase yet (Sign-in method → Email/Password).",
  };

  async function signInStep(btn, label, fn, errors = {}) {
    const text = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    loginErr.textContent = "";
    try { await fn(); }
    catch (e) {
      console.error(e);
      // Unknown errors show their code, so it can be looked up.
      loginErr.textContent = errors[e && e.code] || AUTH_ERRORS[e && e.code] || `Couldn't sign in (${(e && (e.code || e.message)) || "unknown error"}). Try again.`;
    }
    finally { btn.disabled = false; btn.textContent = text; }
  }

  // Sign in (the form's submit) uses the password; Send SMS code the OTP.
  $("phoneForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const phone = e164($("loginPhone").value);
    if (!phone) { loginErr.textContent = "Enter your 10-digit mobile number."; return; }
    const pass = $("loginPass").value;
    if (!pass) { loginErr.textContent = "Enter your password, or use Send SMS code."; $("loginPass").focus(); return; }
    signInStep($("passBtn"), "Signing in…", () => A.signInWithPassword(phone, pass), PASSWORD_ERRORS);
  });

  $("sendBtn").addEventListener("click", () => {
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
    kept.del(MANAGER_KEY);
    if (A) await A.logout();
    location.reload();
  });

  // Back to the sign-in screen: signed out elsewhere, or removed as a manager.
  function lockOut(msg) {
    manager = null;
    kept.del(MANAGER_KEY);
    $("app").hidden = true;
    $("lock").hidden = false;
    $("loginWait").hidden = true;
    showStep("phone");
    loginErr.textContent = msg || "";
  }

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
    loadPackages();
    loadRequests();
  }

  function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    $("prop").value = key;
    rooms = [newRoom(prop.rooms[0])];
    addons = {};
    custom = [];
    edits = {};
    $("addonsCard").open = false;
    $("meal").innerHTML = Object.entries(P.PLANS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    $("meal").value = "pkg";
    $("gst").value = prop.gst;
    $("advancePct").value = prop.advance;
    $("validUntil").value = P.addDays(P.today(), prop.validDays);
    $("inclusions").value = prop.inclusions.join("\n");
    $("exclusions").value = prop.exclusions.join("\n");
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // no clean URLs in local dev
    // On the live sites, the property's own domain, so the shared link's
    // preview shows that property's photo and name (scripts/generate-seo.mjs).
    const menuHost = /(^|\.)chamtaburu\.in$/.test(location.hostname) ? `https://${prop.domain}` : "";
    $("menuLink").href = `${menuHost}/package/menu${local ? ".html" : ""}?p=${key}`;
    $("calLink").href = `/package/calendar${local ? ".html" : ""}?p=${key}`;
    syncEvents();
    renderRooms();
    renderAddons();
    renderCustom();
    loadCalendar(key);
  }

  // The rate calendar's rates replace rates.js once it exists (P.loadCalendar).
  // Until it loads, or if it can't, the rates.js rates show.
  const calendars = {};
  function loadCalendar(key) {
    if (!calendars[key]) calendars[key] = P.loadCalendar(key).catch((e) => { console.error(e); delete calendars[key]; return null; });
    calendars[key].then((cal) => {
      C.properties[key].calendar = cal;
      if (key !== propKey) return;
      renderRooms();
      update();
    });
  }

  /* ---------- Rooms & add-ons ---------- */
  // A row is `q` rooms of one type, each with `a` adults and `k` children; `pr`
  // is the manager's package rate per adult and `rr` their Room only rate per
  // room per night (blank = rate card).
  const newRoom = (room) => ({ id: room.id, ac: false, q: 1, a: room.adults, k: 0, pr: "", rr: "" });
  const isPackage = () => $("meal").value !== "room";

  function renderRooms() {
    $("rooms").innerHTML = rooms.map((r, i) => {
      const room = prop.rooms.find((x) => x.id === r.id) || prop.rooms[0];
      const opts = prop.rooms.map((x) => {
        const cap = "up to " + (x.max || x.adults) + " adults";
        const rate = P.nightlyRate(prop, x, false, $("ci").value || P.today()).rate;
        return `<option value="${x.id}"${x.id === room.id ? " selected" : ""}>${P.esc(x.name)} — ${P.inr(rate)} · ${cap}</option>`;
      }).join("");
      return `<div class="row" data-i="${i}">
        <select data-k="id" aria-label="Room type">${opts}</select>
        <label class="mini">Rooms<input type="number" min="1" max="20" value="${r.q}" data-k="q"></label>
        <label class="mini">Adults / room<input type="number" min="1" max="${room.max || room.adults}" value="${r.a}" data-k="a"></label>
        <label class="mini">Children ${P.esc(prop.childAge)}<input type="number" min="0" max="6" value="${r.k}" data-k="k"></label>
        ${isPackage()
          ? `<label class="mini">₹ per adult<input type="number" min="0" step="50" inputmode="numeric" value="${P.esc(r.pr || "")}" data-k="pr"></label>`
          : `<label class="mini">₹ per night<input type="number" min="0" step="50" inputmode="numeric" value="${P.esc(r.rr || "")}" data-k="rr"></label>
             <label class="ac${room.ac ? "" : " off"}"><input type="checkbox" data-k="ac"${r.ac ? " checked" : ""}> AC</label>`}
        <button class="btn small" type="button" data-k="del" aria-label="Remove room"${rooms.length < 2 ? " disabled" : ""}>✕</button>
      </div>`;
    }).join("");
  }
  $("rooms").addEventListener("input", (e) => {
    const row = e.target.closest(".row");
    if (!row) return;
    const r = rooms[row.dataset.i];
    const k = e.target.dataset.k;
    const n = Math.max(0, parseInt(e.target.value, 10) || 0);
    if (k === "id") { Object.assign(r, newRoom(prop.rooms.find((x) => x.id === e.target.value)), { q: r.q }); renderRooms(); }
    if (k === "ac") r.ac = e.target.checked;
    if (k === "q" || k === "a" || k === "k") r[k] = n;
    if (k === "pr") r.pr = e.target.value;
    if (k === "rr") r.rr = e.target.value;
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
    rooms.push(newRoom(next));
    renderRooms();
    update();
  });

  const unitLabel = { stay: "per stay", person: "per person", night: "per night", car: "per car" };
  const qtyLabel = { car: "cars", kg: "kg", person: "people" };
  const CAR_SIZES = ["5", "9"];
  function addonPrice(a) {
    if (a.unit === "kg") return `${P.inr(Object.values(a.price)[0])} for 1 kg`;
    return `${P.inr(a.price)} ${unitLabel[a.unit]}`;
  }
  // Each add-on has its own price box, the same edit as its line in the price
  // table (P.calculate's `edits`), so it can be changed in either place.
  function renderAddons() {
    let group = null;
    const list = P.addonsFor(prop);
    $("addons").innerHTML = (list.length ? `<div class="addon-head"><span></span><span>Qty</span><span>₹ price</span></div>` : "") + list.map((a) => {
      const q = addons[a.id] || 0;
      const head = a.group && a.group !== group ? `<p class="grp">${P.esc((group = a.group))}</p>` : "";
      // Car hire: a number of cars for each size, so a group can mix them.
      if (a.unit === "car") {
        const cars = q ? P.carQty(q) : { 5: 1 };
        const sizes = CAR_SIZES.filter((sz) => a.price[sz] != null);
        return `${head}<label class="addon carHead" data-id="${a.id}">
          <input type="checkbox"${q ? " checked" : ""} data-k="on">
          <span>${P.esc(a.name)}${a.desc ? `<small>${P.esc(a.desc)}</small>` : ""}</span>
        </label>` + sizes.map((sz, i) => `<label class="addon sub${i === sizes.length - 1 ? " last" : ""}" data-id="${a.id}" data-size="${sz}">
          <span></span>
          <span>${sz}-seater<small>${P.inr(a.price[sz])} per car</small></span>
          <input type="number" min="0" max="20" value="${cars[sz] || 0}" data-k="q" aria-label="${P.esc(a.name)}, ${sz}-seater cars"${q ? "" : " disabled"}>
          <input type="number" min="0" step="1" inputmode="numeric" data-k="pr" aria-label="${P.esc(a.name)}, ${sz}-seater price"${q && cars[sz] ? "" : " disabled"}>
        </label>`).join("");
      }
      return `${head}<label class="addon" data-id="${a.id}">
        <input type="checkbox"${q ? " checked" : ""} data-k="on">
        <span>${P.esc(a.name)}<small>${addonPrice(a)}${a.desc ? " · " + P.esc(a.desc) : ""}</small></span>
        <input type="number" min="1" max="60" value="${q || defaultAddonQty(a)}" data-k="q" aria-label="${P.esc(a.name)} ${qtyLabel[a.unit] || "quantity"}"${q ? "" : " disabled"}>
        <input type="number" min="0" step="1" inputmode="numeric" data-k="pr" aria-label="${P.esc(a.name)} price"${q ? "" : " disabled"}>
      </label>`;
    }).join("");
    if (result) syncAddonPrices(result);
  }
  // Rate card price as the placeholder; the box shows a number only once changed.
  function syncAddonPrices(r) {
    $("addons").querySelectorAll(".addon").forEach((row) => {
      const input = row.querySelector("[data-k=pr]");
      if (!input) return;
      const it = r.items.find((x) => x.addon === row.dataset.id && (!row.dataset.size || x.size === row.dataset.size));
      input.placeholder = it ? String(it.rateCard) : "";
      if (document.activeElement !== input) input.value = it && it.edited ? it.amount : "";
    });
  }
  function defaultAddonQty(a) {
    return a.unit === "person" && result ? Math.max(1, result.adults + result.children) : 1;
  }
  $("addons").addEventListener("input", (e) => {
    const row = e.target.closest(".addon");
    if (!row) return;
    if (e.target.dataset.k === "pr") {
      const it = result.items.find((x) => x.addon === row.dataset.id && (!row.dataset.size || x.size === row.dataset.size));
      if (!it) return;
      if (e.target.value === "") delete edits[it.key];
      else edits[it.key] = e.target.value;
      update();
      return;
    }
    const id = row.dataset.id;
    const subs = [...$("addons").querySelectorAll(`.addon.sub[data-id="${id}"]`)];
    if (subs.length) {
      // Car hire: cars by size. Ticking it with no cars yet starts with one of the first size.
      const on = $("addons").querySelector(`.carHead[data-id="${id}"] [data-k=on]`).checked;
      const cars = {};
      subs.forEach((sr) => (cars[sr.dataset.size] = Math.max(0, parseInt(sr.querySelector("[data-k=q]").value, 10) || 0)));
      if (on && e.target.dataset.k === "on" && !Object.values(cars).some(Boolean)) {
        cars[subs[0].dataset.size] = 1;
        subs[0].querySelector("[data-k=q]").value = 1;
      }
      subs.forEach((sr) => {
        sr.querySelector("[data-k=q]").disabled = !on;
        sr.querySelector("[data-k=pr]").disabled = !on || !cars[sr.dataset.size];
      });
      if (on) addons[id] = cars;
      else delete addons[id];
      update();
      return;
    }
    const qty = row.querySelector("[data-k=q]");
    const on = row.querySelector("[data-k=on]").checked;
    qty.disabled = row.querySelector("[data-k=pr]").disabled = !on;
    if (on) addons[row.dataset.id] = Math.max(1, parseInt(qty.value, 10) || 1);
    else delete addons[row.dataset.id];
    update();
  });

  // The manager's own items, under Add-ons. Rows are rebuilt only when one is
  // added or removed, so typing doesn't lose the cursor.
  function renderCustom() {
    $("custom").innerHTML = custom.map((c, i) => `<div class="crow" data-i="${i}">
      <input data-k="n" maxlength="80" placeholder="Item, e.g. Birthday cake" value="${P.esc(c.n || "")}" aria-label="Item">
      <input type="number" min="1" max="99" inputmode="numeric" data-k="q" value="${P.esc(c.q || 1)}" aria-label="Quantity">
      <input type="number" min="0" step="1" inputmode="numeric" data-k="p" placeholder="₹ each" value="${P.esc(c.p || "")}" aria-label="Price each">
      <button class="btn small" type="button" data-k="del" aria-label="Remove item">✕</button>
    </div>`).join("");
  }
  $("custom").addEventListener("input", (e) => {
    const row = e.target.closest(".crow");
    if (!row) return;
    custom[row.dataset.i][e.target.dataset.k] = e.target.value;
    update();
  });
  $("custom").addEventListener("click", (e) => {
    if (e.target.dataset.k !== "del") return;
    custom.splice(e.target.closest(".crow").dataset.i, 1);
    renderCustom();
    update();
  });
  $("addCustom").addEventListener("click", () => {
    custom.push({ n: "", q: 1, p: "" });
    renderCustom();
    update();
    $("custom").querySelector(".crow:last-child [data-k=n]").focus();
  });

  /* ---------- State, calculation, rendering ---------- */
  const num = (id) => Math.max(0, parseInt($(id).value, 10) || 0);
  const lines = (id) => $(id).value.split("\n").map((s) => s.trim()).filter(Boolean);

  function state() {
    return {
      ci: $("ci").value, co: $("co").value,
      rooms, meal: $("meal").value, addons, custom, edits, extraBed: num("extraBed"), gstIncl: $("gstIncl").value === "1",
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
      ? `${P.plural(r.nights, "night")} · ${P.fmtDate(st.ci)} ${prop.checkIn} → ${P.fmtDate(st.co)} ${prop.checkOut}`
      : "";

    $("guestsHint").textContent = `Guests: ${P.plural(r.adults, "adult")}` + (r.children ? `, ${P.kids(r.children)} (${prop.childAge})` : "") + ". Younger children stay free.";
    $("mealHint").textContent = r.pkg
      ? `Price per adult per night with breakfast, lunch, evening snacks and dinner; children ${prop.childAge} half. Type a rate in "₹ per adult" to change it.`
      : `Room rate only. Guests above a room's normal capacity are charged as extras. Type a rate in "₹ per night" to change it.`;
    $("extraBedLbl").hidden = r.pkg;
    // Rate card price beside each package rate box, so the manager sees what they're changing.
    document.querySelectorAll('#rooms [data-k="pr"], #rooms [data-k="rr"]').forEach((el, i) => {
      el.placeholder = r.rowRates[i] ? String(r.rowRates[i]) : "rate";
    });

    renderLines(r);
    syncAddonPrices(r);
    const picked = r.items.filter((it) => it.addon || it.custom != null);
    const count = new Set(picked.map((it) => it.addon || "custom-" + it.custom)).size;
    $("addonsSum").textContent = count
      ? `${count} selected · ${P.inr(picked.reduce((s, it) => s + it.amount, 0))}`
      : "Car hire, bonfire & more";
    $("sumRows").innerHTML = sumRows(r);
    $("warnings").innerHTML = r.warnings.map((w) => `<li>${P.esc(w)}</li>`).join("");

    $("barTotal").textContent = P.inr(r.total);
    $("barSub").textContent = r.advance ? `Advance ${P.inr(r.advance)}` : "Total incl. GST";

    store.set(DRAFT_KEY, snapshotForm());
  }

  // The price column is editable. Rows are rebuilt only when the lines change,
  // so typing a price doesn't lose the cursor; otherwise just their text.
  let lineKeys = "";
  function renderLines(r) {
    const keys = r.items.map((it) => it.key).join("\n");
    if (keys !== lineKeys) {
      lineKeys = keys;
      // Drop edits for lines that no longer exist (dates, rooms or guests changed).
      edits = Object.fromEntries(Object.entries(edits).filter(([k]) => r.items.some((it) => it.key === k)));
      $("lineRows").innerHTML = r.items.length
        ? r.items.map((it, i) => `<tr data-i="${i}"><td>${P.esc(it.label)}<span class="d"></span><span class="d was"></span></td>
            <td class="amt"><input type="number" min="0" step="1" inputmode="numeric" aria-label="Price for ${P.esc(it.label)}"></td></tr>`).join("")
        : `<tr><td class="muted">Pick dates and rooms to see the price.</td><td></td></tr>`;
    }
    r.items.forEach((it, i) => {
      const tr = $("lineRows").querySelector(`tr[data-i="${i}"]`);
      tr.querySelector(".d").textContent = it.detail;
      tr.querySelector(".was").textContent = it.edited ? "Rate card " + P.inr(it.rateCard) : "";
      const input = tr.querySelector("input");
      if (document.activeElement !== input) input.value = it.amount;
    });
  }
  $("lineRows").addEventListener("input", (e) => {
    const tr = e.target.closest("tr[data-i]");
    if (!tr) return;
    const it = result.items[tr.dataset.i];
    if (e.target.value === "") delete edits[it.key];
    else edits[it.key] = e.target.value;
    update();
  });
  // Leaving an emptied price shows the rate card figure again.
  $("lineRows").addEventListener("focusout", () => update());

  function sumRows(r) {
    const row = (label, amt, cls = "sum") => `<tr class="${cls}"><td>${label}</td><td class="amt">${amt}</td></tr>`;
    let h = row("Subtotal", P.inr(r.subtotal));
    if (r.discount > 0) h += row(r.override ? "Special price discount" : "Discount", "− " + P.inr(r.discount));
    if (r.discount < 0) h += row("Adjustment", "+ " + P.inr(-r.discount));
    if (r.gstPct) h += row(r.gstIncl ? `Includes GST ${r.gstPct}%` : `GST ${r.gstPct}%`, P.inr(r.gst));
    h += row("Total", P.inr(r.total), "total");
    if (r.advance) h += row(`Advance to confirm (${$("advancePct").value}%)`, P.inr(r.advance), "adv");
    return h;
  }

  // The whole form, so a reload or an accidental back-swipe keeps the work.
  const FIELDS = ["gName", "gPhone", "ci", "co", "meal", "extraBed", "discount", "discountType", "override", "gst", "advancePct", "validUntil", "inclusions", "exclusions", "note"];
  function snapshotForm() {
    const f = {};
    FIELDS.forEach((id) => (f[id] = $(id).value));
    f.gstIncl = $("gstIncl").value === "1";
    return { propKey, rooms, addons, custom, edits, fromReq, f, editing: saved && { code: saved.code, ref: saved.ref, url: saved.url } };
  }
  function restore(d) {
    setProperty(d.propKey);
    // Drafts from before rooms had guests get the room's normal occupancy.
    rooms = d.rooms.map((r) => ("a" in r ? r : { ...newRoom(prop.rooms.find((x) => x.id === r.id) || prop.rooms[0]), ...r }));
    // Car hire from before sizes were per add-on: a number of cars of the form's one size.
    addons = Object.fromEntries(Object.entries(d.addons || {}).map(([id, q]) => {
      const a = P.addonsFor(prop).find((x) => x.id === id);
      return [id, a && a.unit === "car" ? P.carQty(q, d.f.car) : q];
    }));
    custom = d.custom || [];
    edits = d.edits || {};
    fromReq = d.fromReq || null;
    $("addonsCard").open = Object.keys(addons).length > 0 || custom.length > 0;
    FIELDS.forEach((id) => { if (d.f[id] != null) $(id).value = d.f[id]; });
    $("gstIncl").value = d.f.gstIncl ? "1" : "";
    if (!(d.f.meal in P.PLANS)) $("meal").value = "pkg"; // drafts from the old Veg / Non-veg plans
    renderRooms();
    renderAddons();
    renderCustom();
    saved = d.editing ? { ...d.editing, key: null } : null;
    showEditing();
  }

  $("form").addEventListener("input", (e) => {
    if (e.target.closest("#rooms, #addons, #custom, #lineRows")) return;
    if (e.target.id === "prop") { saved = null; showEditing(); setProperty(e.target.value); }
    if (e.target.id === "meal") renderRooms();
    $("done").hidden = true;
    if (e.target.id === "ci" && $("ci").value) {
      $("co").min = P.addDays($("ci").value, 1);
      if (!$("co").value || $("co").value <= $("ci").value) $("co").value = P.addDays($("ci").value, 1);
    }
    if (e.target.id === "ci" || e.target.id === "co") syncEvents();
    if (e.target.id === "ci") renderRooms(); // the room list shows each room's rate on the check-in date
    update();
  });
  $("form").addEventListener("submit", (e) => e.preventDefault());

  function newPackage() {
    ["gName", "gPhone", "ci", "co", "note", "override"].forEach((id) => ($(id).value = ""));
    ["extraBed", "discount"].forEach((id) => ($(id).value = 0));
    $("gstIncl").value = "";
    $("done").hidden = true;
    saved = null;
    fromReq = null;
    showEditing();
    setProperty(propKey);
    update();
    window.scrollTo(0, 0);
  }
  $("reset").addEventListener("click", newPackage);
  $("doneNew").addEventListener("click", newPackage);
  $("editNew").addEventListener("click", newPackage);
  $("doneClose").addEventListener("click", () => ($("done").hidden = true));

  // Adds each rates.js event on the stay's nights to Inclusions, and takes it
  // out again when the dates move off it. The manager can still delete it.
  function syncEvents() {
    const on = P.eventsFor($("ci").value, $("co").value);
    let inc = lines("inclusions");
    (C.events || []).forEach((ev) => {
      const has = inc.includes(ev.inclusion);
      if (on.includes(ev) && !has) inc.push(ev.inclusion);
      if (!on.includes(ev) && has) inc = inc.filter((x) => x !== ev.inclusion);
    });
    $("inclusions").value = inc.join("\n");
  }
  // The events this package includes: on its nights and still in Inclusions.
  const events = () => P.eventsFor($("ci").value, $("co").value).filter((ev) => lines("inclusions").includes(ev.inclusion));

  /* ---------- Output ---------- */
  // Features of the rooms chosen (rates.js `features`), each listed once.
  function features() {
    return [...new Set(rooms.filter((r) => r.q).flatMap((r) => (prop.rooms.find((x) => x.id === r.id) || {}).features || []))];
  }

  function quoteData() {
    const st = state();
    const r = result;
    return {
      v: 1, p: propKey, cd: P.today(), vu: $("validUntil").value,
      m: { n: manager.name, ph: P.contactFor(manager.phone, propKey) },
      g: $("gName").value.trim(), ci: st.ci, co: st.co, n: r.nights, a: r.adults, k: r.children,
      l: r.lines, sub: r.subtotal, dis: r.discount, ov: r.override ? 1 : 0, gp: r.gstPct, gst: r.gst,
      tot: r.total, ap: Number(st.advancePct) || 0, adv: r.advance, gi: r.gstIncl ? 1 : 0,
      mn: r.pkg ? 1 : 0, // a package plan, so the guest page shows the menu
      ft: features(),
      ev: events().map((ev) => ev.id), // the guest page shows each one's card
      inc: lines("inclusions"), exc: lines("exclusions"), note: $("note").value.trim(),
    };
  }

  // Send, Copy and Preview on the same package share one saved quote and code.
  // Once saved (or opened with Edit), changes update that same quote, so the
  // link the guest already has shows the new version; "Start a new package"
  // or switching property begins a new one.
  let saved = null; // { code, ref, url, key, data }
  async function ensureSaved() {
    const data = quoteData();
    const key = JSON.stringify(data);
    if (saved && saved.key === key) return saved;
    const form = snapshotForm();
    if (saved) {
      await P.updateQuote(saved.code, { ...data, id: saved.ref }, form, await token(), manager.id);
      Object.assign(saved, { key, data });
    } else {
      const code = await P.saveQuote(propKey, (c) => ({ ...data, id: `${prop.prefix}-${c}` }), form, await token(), manager.id);
      saved = { code, key, data, ref: `${prop.prefix}-${code}`, url: viewUrl(code) };
      if (fromReq) {
        const req = fromReq;
        fromReq = null;
        P.setRequestStatus(req, "quoted", await token(), manager.id, code).then(loadRequests).catch((e) => console.error(e));
      }
    }
    showEditing();
    store.set(DRAFT_KEY, snapshotForm());
    loadPackages();
    return saved;
  }

  // The banner over the form while it holds a saved package.
  function showEditing() {
    $("editing").hidden = !saved;
    if (saved) $("editingRef").textContent = saved.ref;
  }

  function viewUrl(code, key = propKey) {
    // Live sites link to the property's own domain. Firebase previews keep
    // their own host. Local dev has no /p/ rewrite, so it uses the file directly.
    if (/(^|\.)chamtaburu\.in$/.test(location.hostname)) return `https://${C.properties[key].domain}/p/${code}`;
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

    const out = [
      `*${prop.name}*`,
      `Hello ${d.g}, here is your stay package 🌿`,
      "",
      `📅 ${from} – ${P.fmtDate(d.co)} · ${P.plural(d.n, "night")}`,
      `🕛 Check-in ${prop.checkIn} · Check-out ${prop.checkOut}`,
      `👥 ${P.plural(d.a, "adult")}${d.k ? ", " + P.kids(d.k) : ""}`,
      `🏡 ${roomText}`,
    ];
    if (d.ft.length) out.push(`🌳 ${d.ft.join(" · ")}`);
    events().forEach((ev) => out.push(ev.message));
    if (result.pkg) out.push(`🍽 ${P.PLANS[$("meal").value]}: breakfast, lunch, evening snacks & dinner`);
    out.push(`💰 Total *${P.inr(d.tot)}*${d.gp ? " (incl. GST)" : ""}`);
    if (d.adv) out.push(`✅ Advance to confirm: *${P.inr(d.adv)}*`);
    if (prop.payLink) out.push(`💳 Pay online: ${prop.payLink}`);
    out.push("", "Full details & confirm here:", s.url, "");
    out.push(`Ref ${s.ref}${d.vu ? " · valid till " + P.fmtDate(d.vu) : ""}`);
    // Same numbers as the guest page's Call buttons (view.js).
    const calls = P.bookingCalls(prop);
    if (!calls.length) out.push(`${manager.name} · ${P.prettyPhone(P.contactFor(manager.phone, propKey))}`);
    else {
      out.push(manager.name);
      calls.forEach((c) => out.push(`📞 ${c.name} · ${P.prettyPhone(c.phone)}`));
    }
    return out.join("\n");
  }

  function problems(needPhone) {
    if (!$("gName").value.trim()) return ["gName", "Add the guest's name."];
    if (needPhone && !P.waNumber($("gPhone").value)) return ["gPhone", "Check the guest's WhatsApp number."];
    if (!(result.nights > 0)) return ["ci", "Pick check-in and check-out dates."];
    if (!result.lines.length || !rooms.some((r) => r.q)) return ["addRoom", "Add at least one room."];
    if (result.items.some((it) => it.tax && !it.amount)) return ["rooms", "A room has no price yet. Type the rate per adult."];
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
      $("send").innerHTML = 'Send<span class="wide"> on WhatsApp</span>';
    }
  }

  // Not window.open(url, "_blank", "noopener"): that always returns null, which
  // would look like a blocked popup and send this tab to the same URL as well.
  function openTab(url) {
    const w = window.open(url, "_blank");
    if (w) w.opener = null;
    else location.href = url;
  }

  // After Send or Copy: the saved Ref, and a way to start the next package.
  function done(s, what) {
    $("doneText").textContent = `${s.ref} ${what}.`;
    $("done").hidden = false;
  }

  $("send").addEventListener("click", () => {
    if (!guard()) return;
    withSaved((s) => {
      openTab(`https://wa.me/${P.waNumber($("gPhone").value)}?text=${encodeURIComponent(message(s))}`);
      done(s, "saved and opened in WhatsApp");
    });
  });
  $("preview").addEventListener("click", () => {
    if (!guard(false)) return;
    // #preview shows a "Back to Package Generator" button there; the link sent to guests never has it.
    withSaved((s) => openTab(s.url + "#preview"));
  });
  $("copy").addEventListener("click", () => {
    if (!guard(false)) return;
    withSaved(async (s) => {
      try { await navigator.clipboard.writeText(message(s)); done(s, "saved, message copied"); }
      catch { toast("Couldn't copy. Use Send on WhatsApp instead."); }
    });
  });

  /* ---------- Packages: every manager's quotes, with status ---------- */
  const STATUS = { sent: "Sent", confirmed: "Confirmed", cancelled: "Cancelled" };
  const names = {}; // manager phone → name, for "confirmed by"
  let packages = [];

  async function managerName(phone) {
    if (!(phone in names)) names[phone] = P.loadManager(phone).then((m) => (m ? m.name : phone)).catch(() => phone);
    return names[phone];
  }

  async function loadPackages() {
    $("pkgHint").textContent = "Loading…";
    try {
      packages = await P.listQuotes(await token());
      await Promise.all(packages.map(async (x) => {
        if (x.statusBy) x.statusByName = await managerName(x.statusBy);
        if (x.editedBy) x.editedByName = await managerName(x.editedBy);
      }));
      renderPackages();
    } catch (e) {
      console.error(e);
      $("pkgHint").textContent = "Couldn't load packages. Check the internet and tap Refresh.";
    }
  }

  function renderPackages() {
    const mine = $("pkgFilter").value === "mine";
    const list = packages.filter((x) => !mine || x.by === manager.id);
    $("pkgHint").textContent = list.length
      ? `Latest ${list.length}. Tap a Ref to open the guest's page.`
      : mine ? "You haven't made any packages yet." : "No packages yet.";
    $("pkgList").innerHTML = list.map((x) => {
      const d = x.q;
      const ref = d.id || x.code;
      const url = viewUrl(x.code, C.properties[d.p] ? d.p : propKey);
      const opts = Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === x.status ? " selected" : ""}>${v}</option>`).join("");
      const changed = (x.editedByName ? ` · edited by ${P.esc(x.editedByName)}` : "")
        + (x.statusByName ? ` · ${STATUS[x.status] || x.status} by ${P.esc(x.statusByName)}` : "");
      return `<li data-code="${P.esc(x.code)}">
        <a href="${P.esc(url)}" target="_blank" rel="noopener">${P.esc(ref)}</a>
        <span class="muted">${P.esc(d.g || "—")} · ${d.ci ? P.fmtDate(d.ci) : ""} · ${P.inr(d.tot || 0)} · by ${P.esc((d.m && d.m.n) || "?")}${changed}</span>
        <select class="st-${P.esc(x.status)}" data-k="status" aria-label="Status of ${P.esc(ref)}">${opts}</select>
        <span class="acts"><button class="btn small" type="button" data-edit="${P.esc(x.code)}">Edit</button><button class="btn small" type="button" data-url="${P.esc(url)}">Copy link</button></span>
      </li>`;
    }).join("");
  }

  $("pkgFilter").addEventListener("change", renderPackages);
  $("pkgRefresh").addEventListener("click", loadPackages);
  $("pkgList").addEventListener("click", async (e) => {
    if (e.target.dataset.edit) return editPackage(e.target);
    const url = e.target.dataset.url;
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast("Link copied."); }
    catch { toast("Couldn't copy the link."); }
  });
  // Opens a saved package in the form. Saving then updates it in place.
  async function editPackage(btn) {
    const code = btn.dataset.edit;
    const x = packages.find((p) => p.code === code);
    btn.disabled = true;
    try {
      const form = await P.loadForm(code, await token());
      if (!form) return toast("This package was made before editing was added. Make a new one instead.");
      if (!manager.props.includes(form.propKey)) return toast("You can't make packages for this property.");
      restore({ ...form, editing: { code, ref: (x && x.q.id) || code, url: viewUrl(code, form.propKey) } });
      $("done").hidden = true;
      update();
      window.scrollTo(0, 0);
      toast(`Editing ${saved.ref}.`);
    } catch (err) {
      console.error(err);
      toast("Couldn't open the package. Try again.");
    } finally {
      btn.disabled = false;
    }
  }

  $("pkgList").addEventListener("change", async (e) => {
    if (e.target.dataset.k !== "status") return;
    const code = e.target.closest("li").dataset.code;
    const x = packages.find((p) => p.code === code);
    const status = e.target.value;
    e.target.disabled = true;
    try {
      await P.setStatus(code, status, await token(), manager.id);
      Object.assign(x, { status, statusBy: manager.id, statusByName: manager.name });
      toast(`${x.q.id || code} marked ${STATUS[status].toLowerCase()}.`);
    } catch (err) {
      console.error(err);
      toast("Couldn't change the status. Try again.");
    }
    renderPackages();
  });

  /* ---------- Booking requests from the website (/book) ---------- */
  const REQ_STATUS = { new: "New", quoted: "Package sent", booked: "Booked", declined: "Declined" };
  // The extras a guest ticked (src/content/extras.ts): add-on ids, plus "meals".
  const extraName = (p, id) => id === "meals" ? "All meals"
    : ((P.addonsFor(C.properties[p] || prop).find((a) => a.id === id) || {}).name || id).replace(/^Day \d · /, "");
  // A car big enough for the guests: up to 4 in a 5-seater, up to 8 in a 9-seater.
  const carsFor = (people) => (people <= 4 ? { 5: 1, 9: 0 } : { 5: 0, 9: Math.ceil(people / 8) });
  let requests = [];

  async function loadRequests() {
    $("reqHint").textContent = "Loading…";
    try {
      requests = (await P.listRequests(await token())).filter((x) => manager.props.includes(x.p));
      renderRequests();
    } catch (e) {
      console.error(e);
      $("reqSum").textContent = "";
      $("reqHint").textContent = "Couldn't load requests. Check the internet and tap Refresh.";
    }
  }

  function renderRequests() {
    const open = $("reqFilter").value === "open";
    const waiting = requests.filter((x) => x.status === "new");
    const list = open ? waiting : requests;
    $("reqSum").textContent = waiting.length ? `${waiting.length} waiting` : "None waiting";
    $("reqSum").classList.toggle("has", waiting.length > 0);
    if (waiting.length && !$("reqCard").dataset.seen) { $("reqCard").open = true; $("reqCard").dataset.seen = "1"; }
    $("reqHint").textContent = list.length
      ? "Check availability (Booking.com too), then Make package: it fills in the form."
      : open ? "No requests waiting." : "No requests yet.";
    $("reqList").innerHTML = list.map((x) => {
      const opts = Object.entries(REQ_STATUS).map(([k, v]) => `<option value="${k}"${k === x.status ? " selected" : ""}>${v}</option>`).join("");
      const both = Object.keys(C.properties).filter((k) => manager.props.includes(k)).length > 1;
      const nights = P.nightsBetween(x.ci, x.co);
      const roomsText = reqItems(x).map((it) => (it.q > 1 ? it.q + " × " : "") + it.name + (it.ac ? " (AC)" : "")).join(", ");
      const what = [
        (both ? C.properties[x.p].name.replace("Chamtaburu ", "") + " · " : "") + roomsText,
        `${P.fmtDate(x.ci)} → ${P.fmtDate(x.co)} · ${P.plural(nights, "night")}`,
        P.plural(x.a, "adult") + (x.k ? ", " + P.kids(x.k) : ""),
        x.est ? "shown " + P.inr(x.est) : "",
      ].filter(Boolean).join(" · ");
      return `<li data-code="${P.esc(x.code)}">
        <span class="who">${P.esc(x.name)} <a href="https://wa.me/${P.esc(x.phone)}" target="_blank" rel="noopener">${P.esc(P.prettyPhone(x.phone))}</a></span>
        <span class="what">${P.esc(what)} · ${P.esc(x.code)}${x.quote ? " · package " + P.esc(x.quote) : ""}</span>
        ${x.extras.length ? `<span class="what">Also: ${P.esc(x.extras.map((id) => extraName(x.p, id)).join(", "))}</span>` : ""}
        ${x.note ? `<span class="note">“${P.esc(x.note)}”</span>` : ""}
        <select class="st-${P.esc(x.status)}" data-k="status" aria-label="Status of request ${P.esc(x.code)}">${opts}</select>
        <span class="acts"><button class="btn small primary" type="button" data-make="${P.esc(x.code)}">Make package</button></span>
      </li>`;
    }).join("");
  }

  // The rooms a request asks for; older requests have just one.
  const reqItems = (x) => (x.items && x.items.length ? x.items : [{ room: x.room, name: x.roomName, q: 1, ac: x.ac }]);

  // Starts a new package from a request: property, guest, dates and rooms filled in.
  function makeFromRequest(code) {
    const x = requests.find((r) => r.code === code);
    if (!x) return;
    if (!manager.props.includes(x.p)) return toast("You can't make packages for this property.");
    newPackage();
    if (x.p !== propKey) setProperty(x.p);
    $("gName").value = x.name;
    $("gPhone").value = P.prettyPhone(x.phone);
    $("ci").value = x.ci;
    $("co").value = x.co;
    $("co").min = P.addDays(x.ci, 1);
    // Room only, as the website priced it, unless they asked for all meals.
    $("meal").value = x.extras.includes("meals") ? "pkg" : "room";
    // A row per room type. The guests are for the whole booking: share the
    // adults out over the rooms, as evenly as each room allows, and put the
    // children with the first. The manager checks it against the request.
    const items = reqItems(x).map((it) => ({ it, room: prop.rooms.find((r) => r.id === it.room) })).filter((y) => y.room);
    if (!items.length) items.push({ it: { q: 1, ac: false }, room: prop.rooms[0] });
    let adultsLeft = x.a || 1;
    let roomsLeft = items.reduce((n, y) => n + y.it.q, 0);
    rooms = items.map(({ it, room }, i) => {
      const per = Math.max(1, Math.min(room.max || room.adults, Math.ceil(adultsLeft / roomsLeft)));
      adultsLeft = Math.max(0, adultsLeft - per * it.q);
      roomsLeft -= it.q;
      return { ...newRoom(room), q: it.q, a: per, k: i === 0 ? x.k || 0 : 0, ac: !!(it.ac && room.ac) };
    });
    // The extras they ticked, as add-ons: cars sized for the group.
    const list = P.addonsFor(prop);
    x.extras.forEach((id) => {
      const a = list.find((y) => y.id === id);
      if (a) addons[id] = a.unit === "car" ? carsFor((x.a || 1) + (x.k || 0)) : 1;
    });
    $("addonsCard").open = Object.keys(addons).length > 0;
    fromReq = x.code;
    syncEvents();
    renderRooms();
    renderAddons();
    update();
    window.scrollTo(0, 0);
    const cars = x.extras.some((id) => (list.find((y) => y.id === id) || {}).unit === "car");
    const several = rooms.length > 1 || rooms[0].q > 1;
    toast(`Package started for ${x.name}.${several ? " Check the guests per room." : ""}${cars ? " Check the car size." : ""} Sending it marks the request.`);
  }

  $("reqFilter").addEventListener("change", renderRequests);
  $("reqRefresh").addEventListener("click", loadRequests);
  $("reqList").addEventListener("click", (e) => { if (e.target.dataset.make) makeFromRequest(e.target.dataset.make); });
  $("reqList").addEventListener("change", async (e) => {
    if (e.target.dataset.k !== "status") return;
    const code = e.target.closest("li").dataset.code;
    const x = requests.find((r) => r.code === code);
    const status = e.target.value;
    e.target.disabled = true;
    try {
      await P.setRequestStatus(code, status, await token(), manager.id);
      Object.assign(x, { status, statusBy: manager.id });
      toast(`Request ${code}: ${REQ_STATUS[status].toLowerCase()}.`);
    } catch (err) {
      console.error(err);
      toast("Couldn't change the status. Try again.");
    }
    renderRequests();
  });

  /* ---------- Start: resume a sign-in, or ask for the number ---------- */
  const remembered = kept.get(MANAGER_KEY);
  if (remembered && remembered.id) start(remembered);

  import("/package/auth.js").then((mod) => {
    A = mod;
    A.onUser(async (user) => {
      if (!user) {
        if (manager) lockOut(); // signed out on this phone since it was remembered
        $("loginWait").hidden = true;
        showStep("phone");
        return;
      }
      const id = A.idOf(user);
      // Someone else signed in on this phone since: start again as them.
      if (manager && manager.id !== id) { kept.del(MANAGER_KEY); location.reload(); return; }
      authReady();
      let m;
      try { m = id && (await P.loadManager(id)); }
      catch (e) {
        console.error(e);
        // Already showing the form from the remembered manager: carry on.
        if (!manager) $("loginWait").textContent = "Couldn't reach the server. Check your connection and reload.";
        return;
      }
      // A password account only counts if the manager's document names it.
      if (m && !user.phoneNumber && m.uid !== user.uid) m = null;
      if (!m) {
        // Signed in on this phone, but since removed from the manager list.
        A.logout();
        lockOut("This number isn't on the manager list.");
        return;
      }
      m.id = id;
      kept.set(MANAGER_KEY, m);
      $("loginWait").hidden = true;
      if (!manager) start(m);
      else if (m.name !== manager.name) { manager.name = m.name; $("who").textContent = m.name; }
    });
  }).catch((e) => {
    console.error(e);
    $("loginWait").textContent = "Couldn't load sign-in. Check your connection and reload.";
  });
})();
