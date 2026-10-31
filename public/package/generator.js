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
  let edits = {}; // a manager's own price per line, by line key (P.calculate)

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
    // Also what Firebase returns when the SMS region policy doesn't allow India.
    "auth/operation-not-allowed": "Phone sign-in or SMS to India isn't switched on in Firebase yet.",
    "auth/configuration-not-found": "Sign-in isn't set up in Firebase yet (Authentication → Get started).",
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
    loadPackages();
  }

  function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    $("prop").value = key;
    rooms = [newRoom(prop.rooms[0])];
    addons = {};
    edits = {};
    $("meal").innerHTML = prop.meals.map((m) => {
      const price = m.adult ? ` — ${P.inr(m.adult)}/adult/night` : "";
      return `<option value="${m.id}">${P.esc(m.name + price)}</option>`;
    }).join("");
    $("gst").value = prop.gst;
    $("advancePct").value = prop.advance;
    $("validUntil").value = P.addDays(P.today(), prop.validDays);
    $("inclusions").value = prop.inclusions.join("\n");
    $("exclusions").value = prop.exclusions.join("\n");
    renderRooms();
    renderAddons();
  }

  /* ---------- Rooms & add-ons ---------- */
  // A row is `q` rooms of one type, each with `a` adults and `k` children.
  const newRoom = (room) => ({ id: room.id, ac: false, q: 1, a: room.adults, k: 0 });

  function renderRooms() {
    $("rooms").innerHTML = rooms.map((r, i) => {
      const room = prop.rooms.find((x) => x.id === r.id) || prop.rooms[0];
      const opts = prop.rooms.map((x) => {
        const cap = "up to " + (x.max || x.adults) + " adults";
        return `<option value="${x.id}"${x.id === room.id ? " selected" : ""}>${P.esc(x.name)} — ${P.inr(x.rate)} · ${cap}</option>`;
      }).join("");
      return `<div class="row" data-i="${i}">
        <select data-k="id" aria-label="Room type">${opts}</select>
        <label class="mini">Rooms<input type="number" min="1" max="20" value="${r.q}" data-k="q"></label>
        <label class="mini">Adults / room<input type="number" min="1" max="${room.max || room.adults}" value="${r.a}" data-k="a"></label>
        <label class="mini">Children ${P.esc(prop.childAge)}<input type="number" min="0" max="6" value="${r.k}" data-k="k"></label>
        <label class="ac${room.ac ? "" : " off"}"><input type="checkbox" data-k="ac"${r.ac ? " checked" : ""}> AC</label>
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
  function addonPrice(a) {
    if (a.unit === "car") return `${P.inr(a.price[$("car").value])} per car`;
    if (a.unit === "kg") return `${P.inr(Object.values(a.price)[0])} for 1 kg`;
    return `${P.inr(a.price)} ${unitLabel[a.unit]}`;
  }
  function renderAddons() {
    let group = null;
    $("addons").innerHTML = P.addonsFor(prop).map((a) => {
      const q = addons[a.id] || 0;
      const head = a.group && a.group !== group ? `<p class="grp">${P.esc((group = a.group))}</p>` : "";
      return `${head}<label class="addon" data-id="${a.id}">
        <input type="checkbox"${q ? " checked" : ""} data-k="on">
        <span>${P.esc(a.name)}${a.desc ? `<small>${P.esc(a.desc)}</small>` : ""}</span>
        <span class="p">${addonPrice(a)}</span>
        <input type="number" min="1" max="60" value="${q || defaultAddonQty(a)}" data-k="q" aria-label="${P.esc(a.name)} ${qtyLabel[a.unit] || "quantity"}"${q ? "" : " disabled"}>
      </label>`;
    }).join("");
  }
  function defaultAddonQty(a) {
    return a.unit === "person" && result ? Math.max(1, result.adults + result.children) : 1;
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
      ci: $("ci").value, co: $("co").value,
      rooms, meal: $("meal").value, addons, edits, car: $("car").value, extraBed: num("extraBed"),
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

    $("guestsHint").textContent = `Guests: ${P.plural(r.adults, "adult")}` + (r.children ? `, ${P.kids(r.children)} (${prop.childAge})` : "") + ". Younger children stay free.";
    const season = r.nights > r.mealNights ? (prop.seasons || []).find((x) => x.meals) : null;
    $("mealHint").textContent = !season ? ""
      : r.mealNights ? `${season.name} nights include all meals; the meal plan and extra beds apply to the other ${P.plural(r.mealNights, "night")}.`
      : `${season.name}: all meals included, so no meal plan or extra beds needed.`;

    renderLines(r);
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
    if (r.gstPct) h += row(`GST ${r.gstPct}%`, P.inr(r.gst));
    h += row("Total", P.inr(r.total), "total");
    if (r.advance) h += row(`Advance to confirm (${$("advancePct").value}%)`, P.inr(r.advance), "adv");
    return h;
  }

  // The whole form, so a reload or an accidental back-swipe keeps the work.
  const FIELDS = ["gName", "gPhone", "ci", "co", "meal", "extraBed", "car", "discount", "discountType", "override", "gst", "advancePct", "validUntil", "inclusions", "exclusions", "note"];
  function snapshotForm() {
    const f = {};
    FIELDS.forEach((id) => (f[id] = $(id).value));
    return { propKey, rooms, addons, edits, f };
  }
  function restore(d) {
    setProperty(d.propKey);
    // Drafts from before rooms had guests get the room's normal occupancy.
    rooms = d.rooms.map((r) => ("a" in r ? r : { ...newRoom(prop.rooms.find((x) => x.id === r.id) || prop.rooms[0]), ...r }));
    addons = d.addons;
    edits = d.edits || {};
    FIELDS.forEach((id) => { if (d.f[id] != null) $(id).value = d.f[id]; });
    renderRooms();
    renderAddons();
  }

  $("form").addEventListener("input", (e) => {
    if (e.target.closest("#rooms, #addons, #lineRows")) return;
    if (e.target.id === "prop") setProperty(e.target.value);
    if (e.target.id === "car") renderAddons();
    if (e.target.id === "ci" && $("ci").value) {
      $("co").min = P.addDays($("ci").value, 1);
      if (!$("co").value || $("co").value <= $("ci").value) $("co").value = P.addDays($("ci").value, 1);
    }
    update();
  });
  $("form").addEventListener("submit", (e) => e.preventDefault());

  $("reset").addEventListener("click", () => {
    ["gName", "gPhone", "ci", "co", "note", "override"].forEach((id) => ($(id).value = ""));
    ["extraBed", "discount"].forEach((id) => ($(id).value = 0));
    $("car").value = "5";
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
      g: $("gName").value.trim(), ci: st.ci, co: st.co, n: r.nights, a: r.adults, k: r.children,
      l: r.lines, sub: r.subtotal, dis: r.discount, ov: r.override ? 1 : 0, gp: r.gstPct, gst: r.gst,
      tot: r.total, ap: Number(st.advancePct) || 0, adv: r.advance,
      mn: r.nights > r.mealNights ? 1 : 0, // has all-meals nights, so the guest page shows the menu
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
    const code = await P.saveQuote(propKey, (c) => ({ ...data, id: `${prop.prefix}-${c}` }), await A.token(), A.phone());
    saved = { key, data, ref: `${prop.prefix}-${code}`, url: viewUrl(code) };
    loadPackages();
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
    const meal = result.mealNights ? prop.meals.find((m) => m.id === $("meal").value) : null;
    const season = result.nights > result.mealNights ? (prop.seasons || []).find((x) => x.meals) : null;
    const out = [
      `*${prop.name}*`,
      `Hello ${d.g}, here is your stay package 🌿`,
      "",
      `📅 ${from} – ${P.fmtDate(d.co)} · ${P.plural(d.n, "night")}`,
      `👥 ${P.plural(d.a, "adult")}${d.k ? ", " + P.kids(d.k) : ""}`,
      `🏡 ${roomText}`,
    ];
    if (season) out.push(`🎉 ${season.name} · all meals included`);
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
      packages = await P.listQuotes(await A.token());
      await Promise.all(packages.filter((x) => x.statusBy).map(async (x) => (x.statusByName = await managerName(x.statusBy))));
      renderPackages();
    } catch (e) {
      console.error(e);
      $("pkgHint").textContent = "Couldn't load packages. Check the internet and tap Refresh.";
    }
  }

  function renderPackages() {
    const mine = $("pkgFilter").value === "mine";
    const list = packages.filter((x) => !mine || x.by === A.phone());
    $("pkgHint").textContent = list.length
      ? `Latest ${list.length}. Tap a Ref to open the guest's page.`
      : mine ? "You haven't made any packages yet." : "No packages yet.";
    $("pkgList").innerHTML = list.map((x) => {
      const d = x.q;
      const ref = d.id || x.code;
      const url = viewUrl(x.code);
      const opts = Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === x.status ? " selected" : ""}>${v}</option>`).join("");
      const changed = x.statusByName ? ` · ${STATUS[x.status] || x.status} by ${P.esc(x.statusByName)}` : "";
      return `<li data-code="${P.esc(x.code)}">
        <a href="${P.esc(url)}" target="_blank" rel="noopener">${P.esc(ref)}</a>
        <span class="muted">${P.esc(d.g || "—")} · ${d.ci ? P.fmtDate(d.ci) : ""} · ${P.inr(d.tot || 0)} · by ${P.esc((d.m && d.m.n) || "?")}${changed}</span>
        <select class="st-${P.esc(x.status)}" data-k="status" aria-label="Status of ${P.esc(ref)}">${opts}</select>
        <button class="btn small" type="button" data-url="${P.esc(url)}">Copy link</button>
      </li>`;
    }).join("");
  }

  $("pkgFilter").addEventListener("change", renderPackages);
  $("pkgRefresh").addEventListener("click", loadPackages);
  $("pkgList").addEventListener("click", async (e) => {
    const url = e.target.dataset.url;
    if (!url) return;
    try { await navigator.clipboard.writeText(url); toast("Link copied."); }
    catch { toast("Couldn't copy the link."); }
  });
  $("pkgList").addEventListener("change", async (e) => {
    if (e.target.dataset.k !== "status") return;
    const code = e.target.closest("li").dataset.code;
    const x = packages.find((p) => p.code === code);
    const status = e.target.value;
    e.target.disabled = true;
    try {
      await P.setStatus(code, status, await A.token(), A.phone());
      Object.assign(x, { status, statusBy: A.phone(), statusByName: manager.name });
      toast(`${x.q.id || code} marked ${STATUS[status].toLowerCase()}.`);
    } catch (err) {
      console.error(err);
      toast("Couldn't change the status. Try again.");
    }
    renderPackages();
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
