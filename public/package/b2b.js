/*
 * /package/b2b — the B2B rate calendar: what approved travel partners pay.
 *
 * Partners pay the public rate (/package/calendar, else rates.js) less a
 * discount (see "B2B rates" in b2b-core.js). Here managers mark dates Peak
 * (the smaller peak discount), a custom discount, or Closed to partners, for
 * every room and package at the property; an admin also sets the discounts
 * themselves under Discounts. Saved to Firestore `b2bRates/{property}`, which
 * only managers and approved partners can read.
 *
 * Sign-in is the Package Generator's (auth.js), as on /package/calendar.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const B = window.B2B;
  const $ = (id) => document.getElementById(id);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const page = (p) => (local ? `/package/${p}.html` : `/package/${p}`);
  const params = new URLSearchParams(location.search);
  const MONTHS_AHEAD = 18;

  let A = null;
  let manager = null;
  let propKey = "";
  let prop = null;
  let b2b = null; // { plan, days }: saved, or the starting values
  let live = false;
  let view = "cal"; // cal | plan
  let pick = ""; // "rooms:<type>" or "pkg:<tier>": the net rate the calendar shows
  let month = "";
  const sel = new Set();
  let rangeStart = null;
  let saving = false;

  const today = P.today();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const num = (n) => Math.round(n).toLocaleString("en-IN");
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ---------- Sign-in ---------- */
  function lock(msg, showLink) {
    $("app").hidden = true;
    $("sheet").hidden = true;
    $("lock").hidden = false;
    $("lockMsg").textContent = msg;
    $("lockAct").hidden = !showLink;
  }
  $("signInLink").href = page("index");
  $("genLink").href = page("index");
  $("partnersLink").href = page("partners");

  function start(m) {
    manager = m;
    const allowed = m.admin ? Object.keys(C.properties) : (m.props || Object.keys(C.properties)).filter((k) => C.properties[k]);
    if (!allowed.length) return lock("Your manager account has no property to manage.", false);
    $("lock").hidden = true;
    $("app").hidden = false;
    $("who").textContent = m.name + (m.admin ? " · Admin" : "");
    $("prop").innerHTML = allowed.map((k) => `<option value="${k}">${P.esc(C.properties[k].name)}</option>`).join("");
    $("prop").disabled = allowed.length < 2;
    const want = params.get("p") || (location.hostname.indexOf("resort.") === 0 ? "resort" : "village");
    setProperty(allowed.includes(want) ? want : allowed[0]);
  }

  $("prop").addEventListener("change", (e) => setProperty(e.target.value));

  async function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    $("prop").value = key;
    $("pubLink").href = page("calendar") + "?p=" + key;
    pick = "rooms:" + B.rateTypes(prop)[0].id;
    month = today.slice(0, 7);
    sel.clear();
    rangeStart = null;
    b2b = null;
    render();
    await load();
  }

  async function load() {
    $("loadErr").hidden = true;
    $("grid").innerHTML = `<p class="hint" style="grid-column:1/-1">Loading rates…</p>`;
    const key = propKey;
    try {
      const [cal, got] = demo
        ? [null, demoB2B[key] || null]
        : await Promise.all([P.loadCalendar(key), A.token().then((t) => B.loadB2B(key, t))]);
      if (key !== propKey) return;
      C.properties[key].calendar = cal;
      live = !!got;
      b2b = got || B.seedB2B(prop);
    } catch (e) {
      console.error(e);
      $("loadErr").hidden = false;
      $("loadErr").textContent = e.status === 403
        ? "You can't see B2B rates. Check that the new Firestore rules are deployed."
        : "Couldn't load the rates. Check your connection and reload the page.";
      $("grid").innerHTML = "";
      return;
    }
    render();
  }

  /* ---------- Rendering ---------- */
  function render() {
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === view)));
    $("calView").hidden = view !== "cal";
    $("planView").hidden = view !== "plan";
    $("notLive").hidden = !b2b || live;
    if (b2b && !live) {
      $("notLive").innerHTML = manager.admin
        ? `<strong>Not switched on yet.</strong> Partners see no rates until you save. Starting values: ${b2b.plan.disc}% off on normal dates, ${b2b.plan.peakDisc}% off on peak dates (the public calendar's named package dates are marked peak). Check them under Discounts and save.`
        : `<strong>Not switched on yet.</strong> An admin saves the discounts first; until then partners see no rates.`;
    }
    $("updated").textContent = b2b && live && b2b.updatedAt
      ? `Last saved ${new Date(b2b.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
      : "";
    $("summary").textContent = b2b ? `Partners pay ${b2b.plan.disc}% off the public rate, ${b2b.plan.peakDisc}% off on peak dates.` : "";
    if (!b2b) return;
    if (view === "plan") renderPlan();
    else { renderChips(); renderGrid(); }
    renderSheet();
  }

  function items() {
    return B.rateTypes(prop).map((t) => ({ id: "rooms:" + t.id, name: t.name, note: t.note }))
      .concat(B.tiers(prop).map((t) => ({ id: "pkg:" + t, name: "Package · " + B.tierName(prop, t) })));
  }
  const pickKind = () => pick.split(":")[0];
  const pickId = () => pick.slice(pick.indexOf(":") + 1);

  function renderChips() {
    $("chips").innerHTML = items().map((x) => `<button type="button" data-id="${P.esc(x.id)}" aria-pressed="${x.id === pick}">${P.esc(x.name)}</button>`).join("");
    const cur = items().find((x) => x.id === pick) || {};
    $("typeNote").textContent = pickKind() === "rooms"
      ? [cur.note, "Net rate per room per night, Room only." + (B.hasAc(prop, pickId()) ? " Bottom number: AC." : "")].filter(Boolean).join(" · ")
      : `Net price per adult per night, all meals, Non-AC, ${B.sizes(prop, pickId())[0]} adults sharing.`;
  }

  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    pick = b.dataset.id;
    render();
  });

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-view]");
    if (!b || b.dataset.view === view) return;
    view = b.dataset.view;
    sel.clear();
    rangeStart = null;
    render();
  });

  const daysIn = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const shiftMonth = (ym, n) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
  const monthDates = (ym) => Array.from({ length: daysIn(ym) }, (_, i) => ym + "-" + String(i + 1).padStart(2, "0"));
  const dow = (d) => new Date(d + "T00:00:00Z").getUTCDay();
  const lastMonth = shiftMonth(today.slice(0, 7), MONTHS_AHEAD);

  function cellFor(d) {
    const day = B.dayOf(b2b, d);
    const tag = day.closed ? "Closed" : day.disc != null ? `−${day.disc}%` : day.peak ? `Peak −${b2b.plan.peakDisc}%` : "";
    const cls = day.closed ? "closed" : day.disc != null ? "custom" : day.peak ? "peak" : "";
    if (pickKind() === "rooms") {
      const r = B.roomOn(prop, b2b, pickId(), d);
      const ac = B.hasAc(prop, pickId()) ? r.ac : null;
      return {
        cls: [cls, r.soldOut && "sold"].filter(Boolean).join(" "),
        v: r.rate != null ? num(r.rate) : "—",
        v2: r.soldOut ? "" : ac != null ? num(ac) : "",
        tag: r.soldOut ? "" : tag,
        sold: r.soldOut,
        label: `net ${r.rate != null ? "₹" + num(r.rate) : "no rate"}${ac != null ? ", AC ₹" + num(ac) : ""} (${r.disc}% off ₹${r.pub.rate != null ? num(r.pub.rate) : "—"})${day.closed ? ", closed to partners" : ""}${r.soldOut ? ", sold out" : ""}`,
      };
    }
    const p = B.packageOn(prop, b2b, pickId(), d);
    const size = B.sizes(prop, pickId())[0];
    const v = p.nonac && p.nonac[size] != null ? p.nonac[size] : null;
    return { cls, v: v != null ? num(v) : "—", v2: "", tag, sold: false, label: `${v != null ? "net ₹" + num(v) + " per adult" : "no package rate"} (${p.disc}% off)${p.label ? ", " + p.label : ""}${day.closed ? ", closed to partners" : ""}` };
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
      const cls = ["day", c.cls, sel.has(d) && "sel", d === today && "today"].filter(Boolean).join(" ");
      return `<button type="button" class="${cls}" data-d="${d}"${d < today ? " disabled" : ""} aria-pressed="${sel.has(d)}" aria-label="${P.esc(P.fmtDate(d) + ": " + c.label)}">
        <span class="dn">${Number(d.slice(8))}</span>
        <span class="v">${c.v}</span>
        ${c.sold ? `<span class="so">Sold out</span>` : c.v2 ? `<span class="v2">${c.v2}</span>` : ""}
        ${c.tag ? `<span class="tag">${c.tag}</span>` : ""}
      </button>`;
    }).join("");
    $("grid").innerHTML = head + blanks + cells;
    $("legend").innerHTML = [
      `<li><i class="l-peak"></i>Peak −${b2b.plan.peakDisc}%</li>`,
      `<li><i class="l-custom"></i>Custom discount</li>`,
      `<li><i class="l-closed"></i>Closed to partners</li>`,
      `<li><i class="l-sold"></i>Sold out (public calendar)</li>`,
      `<li><i class="l-sel"></i>Selected</li>`,
    ].join("");
    $("calHint").textContent = sel.size ? "" : "Tap the dates to mark Peak, a custom discount, or Closed. It applies to every room and package here.";
  }

  $("prevMonth").addEventListener("click", () => { month = shiftMonth(month, -1); renderGrid(); });
  $("nextMonth").addEventListener("click", () => { month = shiftMonth(month, 1); renderGrid(); });

  $("grid").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b || b.disabled) return;
    const d = b.dataset.d;
    if ($("rangeMode").checked) {
      if (!rangeStart) { rangeStart = d; sel.add(d); }
      else {
        const [a, z] = rangeStart < d ? [rangeStart, d] : [d, rangeStart];
        for (let x = a; x <= z; x = P.addDays(x, 1)) if (x >= today) sel.add(x);
        rangeStart = null;
      }
    } else if (sel.has(d)) sel.delete(d);
    else sel.add(d);
    renderGrid();
    renderSheet();
  });

  document.querySelector(".quick").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-pick]");
    if (!b) return;
    const what = b.dataset.pick;
    rangeStart = null;
    if (what === "none") sel.clear();
    else {
      monthDates(month).filter((d) => d >= today).forEach((d) => {
        const w = dow(d);
        if (what === "month" || (what === "weekend" && (w === 5 || w === 6)) || (what === "weekday" && w !== 5 && w !== 6)) sel.add(d);
      });
    }
    renderGrid();
    renderSheet();
  });

  /* ---------- The selected dates ---------- */
  const sorted = () => [...sel].filter((d) => d >= today).sort();
  const modeOf = (d) => { const x = B.dayOf(b2b, d); return x.closed ? "closed" : x.disc != null ? "custom" : x.peak ? "peak" : "normal"; };

  function renderSheet() {
    const dates = sorted();
    const open = view === "cal" && !!b2b && dates.length > 0;
    $("sheet").hidden = !open;
    document.body.classList.toggle("selecting", open);
    if (!open) return;
    $("selCount").textContent = P.plural(dates.length, "date") + " selected";
    $("selRange").textContent = dates.length === 1 ? P.fmtDate(dates[0]) : `${P.fmtDate(dates[0])} – ${P.fmtDate(dates[dates.length - 1])}`;
    $("mNormal").textContent = `Normal: ${b2b.plan.disc}% off (or the room type's own)`;
    $("mPeak").textContent = `Peak: ${b2b.plan.peakDisc}% off`;
    const mode = modeOf(dates[0]);
    const mixed = dates.some((d) => modeOf(d) !== mode || !same(b2b.days[d] || null, b2b.days[dates[0]] || null));
    document.querySelector(`input[name=mode][value=${mode}]`).checked = true;
    $("mDisc").value = mode === "custom" ? B.dayOf(b2b, dates[0]).disc : "";
    const blocked = !live && !manager.admin;
    $("sSave").disabled = blocked || saving;
    $("sHint").textContent = blocked
      ? "An admin must save the discounts first."
      : (mixed ? `These dates are marked differently; shown is ${P.fmtDate(dates[0])}. Saving marks them all the same. ` : "")
        + `Applies to every room and package at ${prop.name}. Sold out comes from the public calendar.`;
  }

  $("mDisc").addEventListener("focus", () => (document.querySelector("input[name=mode][value=custom]").checked = true));
  $("sCancel").addEventListener("click", () => { sel.clear(); rangeStart = null; render(); });

  $("sSave").addEventListener("click", () => {
    const mode = (document.querySelector("input[name=mode]:checked") || {}).value || "normal";
    let entry = null;
    if (mode === "peak") entry = { peak: true };
    else if (mode === "closed") entry = { closed: true };
    else if (mode === "custom") {
      const n = Number($("mDisc").value);
      if ($("mDisc").value === "" || !Number.isInteger(n) || n < 0 || n > 90) return toast("Type a discount from 0 to 90 %.");
      entry = { disc: n };
    }
    const days = {};
    sorted().forEach((d) => (days[d] = entry));
    save({ days }).then((ok) => { if (ok) { sel.clear(); rangeStart = null; render(); } });
  });

  /*
   * Writes `changes` ({ plan?, days? }). The first save (an admin's) creates
   * the document from everything shown. Each save drops dates more than a
   * week past.
   */
  async function save(changes) {
    if (saving) return false;
    if (!live && !manager.admin) { toast("An admin must save the discounts first."); return false; }
    const next = clone(b2b);
    if (changes.plan) next.plan = B.normPlan(changes.plan);
    Object.entries(changes.days || {}).forEach(([d, v]) => { if (v) next.days[d] = v; else delete next.days[d]; });
    const old = P.addDays(today, -7);
    const out = { ...changes, days: { ...(changes.days || {}) } };
    Object.keys(next.days).forEach((d) => { if (d < old) { delete next.days[d]; out.days[d] = null; } });
    Object.keys(out.days).forEach((d) => { if (same(out.days[d], b2b.days[d] || null)) delete out.days[d]; });
    if (!out.plan && !Object.keys(out.days).length && live) { toast("Nothing changed."); return true; }

    saving = true;
    setBusy(true);
    try {
      if (demo) await new Promise((r) => setTimeout(r, 300));
      else if (live) await B.saveB2B(propKey, out, await A.token(), manager.id, false);
      else await B.saveB2B(propKey, { plan: next.plan, days: next.days }, await A.token(), manager.id, true);
      if (demo) demoB2B[propKey] = { ...next, updatedAt: new Date().toISOString() };
      b2b = { ...next, updatedAt: new Date().toISOString() };
      live = true;
      toast(demo ? "Demo: not saved." : "Saved. Partners see it now.");
      return true;
    } catch (e) {
      console.error(e);
      if (e.status === 403) toast(changes.plan ? "Only an admin can change the discounts." : "You can't change B2B rates for this property.");
      else if (e.status === 409 || e.status === 400) { toast("Someone else just saved. Reloading; try again."); await load(); }
      else toast("Couldn't save. Check your connection and try again.");
      return false;
    } finally {
      saving = false;
      setBusy(false);
    }
  }

  function setBusy(on) {
    $("sSave").disabled = on;
    $("savePlan").disabled = on || !manager.admin;
    $("sSave").textContent = on ? "Saving…" : "Save";
  }

  /* ---------- Discounts ---------- */
  const example = (rate, disc) => (rate != null ? `₹${num(rate)} → ₹${num(B.net(rate, disc))}` : "");

  function renderPlan() {
    const pl = b2b.plan;
    const ro = !manager.admin;
    $("planLocked").hidden = !ro;
    $("pDisc").value = pl.disc;
    $("pPeak").value = pl.peakDisc;
    const at = today;
    $("pRooms").innerHTML = B.rateTypes(prop).map((t) => {
      const pub = B.publicRoom(prop, t.id, at).rate;
      const own = pl.rooms[t.id];
      return `<div class="pctRow"><div class="nm">${P.esc(t.name)}<small>Today: ${example(pub, own != null ? own : pl.disc)}</small></div>
        <input type="number" inputmode="numeric" min="0" max="90" data-kind="rooms" data-id="${P.esc(t.id)}" value="${own != null ? own : ""}" placeholder="${pl.disc}" aria-label="${P.esc(t.name)}, discount %"></div>`;
    }).join("");
    $("pPkg").innerHTML = B.tiers(prop).map((t) => {
      const own = pl.pkg[t];
      return `<div class="pctRow"><div class="nm">${P.esc(B.tierName(prop, t))}<small>Per adult, all meals</small></div>
        <input type="number" inputmode="numeric" min="0" max="90" data-kind="pkg" data-id="${P.esc(t)}" value="${own != null ? own : ""}" placeholder="${pl.disc}" aria-label="${P.esc(B.tierName(prop, t))} package, discount %"></div>`;
    }).join("");
    document.querySelectorAll("#planView input").forEach((el) => (el.disabled = ro));
    $("savePlan").disabled = ro;
    $("undoPlan").disabled = ro;
  }

  $("undoPlan").addEventListener("click", renderPlan);
  $("savePlan").addEventListener("click", () => {
    const read = (el) => { const s = el.value.trim(); if (s === "") return null; const n = Number(s); return Number.isInteger(n) && n >= 0 && n <= 90 ? n : NaN; };
    const disc = read($("pDisc"));
    const peakDisc = read($("pPeak"));
    const plan = { disc, peakDisc, rooms: {}, pkg: {} };
    let bad = disc == null || peakDisc == null || Number.isNaN(disc) || Number.isNaN(peakDisc);
    document.querySelectorAll("#planView input[data-kind]").forEach((el) => {
      const v = read(el);
      if (Number.isNaN(v)) bad = true;
      else if (v != null) plan[el.dataset.kind][el.dataset.id] = v;
    });
    if (bad) return toast("Discounts are whole numbers from 0 to 90 %.");
    if (live && same(B.normPlan(plan), b2b.plan)) return toast("Nothing changed.");
    save({ plan }).then((ok) => ok && render());
  });

  /* ---------- Toast ---------- */
  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }

  /* ---------- Start ---------- */
  // Local only: ?demo shows the page as an admin without signing in or saving.
  const demo = local && params.has("demo");
  const demoB2B = {};
  if (demo) { start({ name: "Demo", id: "+910000000000", admin: !params.has("manager") }); return; }

  import("/package/auth.js").then((mod) => {
    A = mod;
    A.onUser(async (user) => {
      if (!user) return lock("Managers only. Sign in on the Package Generator first, then come back here.", true);
      const id = A.idOf(user);
      if (manager && manager.id === id) return;
      let m;
      try { m = id && (await P.loadManager(id)); }
      catch (e) { console.error(e); return lock("Couldn't reach the server. Check your connection and reload.", false); }
      if (m && !user.phoneNumber && m.uid !== user.uid) m = null;
      if (!m) return lock("This account isn't on the manager list.", false);
      m.id = id;
      start(m);
    });
  }).catch((e) => {
    console.error(e);
    lock("Couldn't load sign-in. Check your connection and reload.", false);
  });
})();
