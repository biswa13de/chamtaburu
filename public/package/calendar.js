/*
 * /package/calendar — the manager's rate calendar.
 *
 * Room rates (per room type), package rates (per package tier) and sold-out
 * dates, saved to Firestore `rates/{property}` (see "Rate calendar" in
 * package-core.js for the document's shape). The website's room pages and the
 * Package Generator read that document, so a saved change shows there at once.
 *
 * Sign-in is the Package Generator's (auth.js): Firebase keeps a manager
 * signed in per site, so a manager signed in there is signed in here.
 * firestore.rules lets a manager save only the properties their manager
 * document lists in `props` (all, when it lists none).
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // no clean URLs in local dev
  const params = new URLSearchParams(location.search);
  const MONTHS_AHEAD = 18;
  const MAX_RATE = 1000000;

  let A = null; // auth.js
  let manager = null;
  let propKey = "";
  let prop = null;
  let cal = null; // { base, days }: the saved calendar, or the rates.js starting values
  let live = false; // the calendar document exists
  let view = "rooms"; // rooms | pkg | base
  let type = ""; // room type shown under Room rates
  let tier = ""; // package tier shown under Package rates
  let month = ""; // "YYYY-MM"
  let sel = new Set(); // selected dates
  let rangeStart = null;
  let saving = false;

  const today = P.today();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const num = (n) => Math.round(n).toLocaleString("en-IN");

  /* ---------- Property set-up ---------- */
  const typesOf = (p) => p.rateTypes || p.rooms.map((r) => ({ id: P.typeOf(r), name: r.name }));
  const tiersOf = (p) => [...new Set(p.rooms.map((r) => r.tier))];
  const roomOfType = (t) => prop.rooms.find((r) => P.typeOf(r) === t);
  const hasAc = (t) => prop.rooms.some((r) => P.typeOf(r) === t && r.ac);
  const tierName = (t) => (prop.tierNames && prop.tierNames[t]) || t;

  // Package table sizes for a tier: 2 up to the most adults its rooms take,
  // plus any size a saved table already has.
  function sizesOf(t) {
    const max = Math.max(2, ...prop.rooms.filter((r) => r.tier === t).map((r) => r.max || r.adults));
    const s = new Set();
    for (let n = 2; n <= max; n++) s.add(n);
    const add = (tb) => tb && Object.keys(tb).forEach((k) => s.add(Number(k)));
    const b = cal.base.pkg[t] || {};
    add(b.nonac); add(b.ac);
    Object.values(cal.days).forEach((d) => { const x = d.pkg && d.pkg[t]; if (x) { add(x.nonac); add(x.ac); } });
    return [...s].sort((a, b) => a - b);
  }

  // The calendar as it would be from rates.js, for a property that hasn't
  // saved one yet: its room rates, package rates and seasons.
  function seed(p) {
    const base = { rooms: {}, pkg: {} };
    typesOf(p).forEach((t) => {
      const r = p.rooms.find((x) => P.typeOf(x) === t.id);
      base.rooms[t.id] = { rate: r ? r.rate : null, ac: r && r.ac ? r.ac : null };
    });
    const pk = p.packages || {};
    tiersOf(p).forEach((t) => (base.pkg[t] = { nonac: (pk.nonac || {})[t] || null, ac: (pk.ac || {})[t] || null }));
    const days = {};
    (p.seasons || []).forEach((s) => {
      for (let d = s.from > today ? s.from : today; d <= s.to; d = P.addDays(d, 1)) {
        const day = (days[d] = days[d] || {});
        if (s.packages) {
          tiersOf(p).forEach((t) => {
            const nonac = (s.packages.nonac || {})[t] || null;
            const ac = (s.packages.ac || {})[t] || null;
            if (nonac || ac) (day.pkg = day.pkg || {})[t] = { label: s.name, nonac, ac };
          });
        }
        if (s.rates || s.uplift) {
          typesOf(p).forEach((t) => {
            const r = p.rooms.find((x) => P.typeOf(x) === t.id);
            if (!r) return;
            const up = (key, v) => (s.rates && s.rates[key] != null ? s.rates[key] : Math.round(v * (1 + (s.uplift || 0))));
            const e = { rate: up(r.id, r.rate) };
            if (r.ac) e.ac = up(r.id + "-ac", r.ac);
            (day.rooms = day.rooms || {})[t.id] = e;
          });
        }
        if (!day.pkg && !day.rooms) delete days[d];
      }
    });
    return { base, days };
  }

  /* ---------- Sign-in ---------- */
  function lock(msg, showLink) {
    $("app").hidden = true;
    $("sheet").hidden = true;
    $("lock").hidden = false;
    $("lockMsg").textContent = msg;
    $("lockAct").hidden = !showLink;
  }
  $("signInLink").href = (local ? "/package/index.html" : "/package");
  $("genLink").href = (local ? "/package/index.html" : "/package");

  function start(m) {
    manager = m;
    const allowed = (m.props || Object.keys(C.properties)).filter((k) => C.properties[k]);
    if (!allowed.length) return lock("Your manager account has no property to manage.", false);
    $("lock").hidden = true;
    $("app").hidden = false;
    $("who").textContent = m.name;
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
    type = typesOf(prop)[0].id;
    tier = tiersOf(prop)[0];
    month = today.slice(0, 7);
    sel.clear();
    rangeStart = null;
    cal = null;
    render();
    await load();
  }

  async function load() {
    $("loadErr").hidden = true;
    $("grid").innerHTML = `<p class="hint" style="grid-column:1/-1">Loading rates…</p>`;
    const key = propKey;
    try {
      const got = demo ? demoCal[key] || null : await P.loadCalendar(key);
      if (key !== propKey) return;
      live = !!got;
      cal = got || seed(prop);
    } catch (e) {
      console.error(e);
      $("loadErr").hidden = false;
      $("loadErr").textContent = "Couldn't load the rates. Check your connection and reload the page.";
      $("grid").innerHTML = "";
      return;
    }
    render();
  }

  /* ---------- Rendering ---------- */
  function render() {
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === view)));
    $("calView").hidden = view === "base";
    $("baseView").hidden = view !== "base";
    $("notLive").hidden = !cal || live;
    $("updated").textContent = cal && live && cal.updatedAt
      ? `Last saved ${new Date(cal.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}`
      : "";
    if (!cal) return;
    if (view === "base") renderBase();
    else { renderChips(); renderGrid(); }
    renderSheet();
  }

  function renderChips() {
    const list = view === "rooms"
      ? typesOf(prop).map((t) => ({ id: t.id, name: t.name, note: t.note }))
      : tiersOf(prop).map((t) => ({ id: t, name: tierName(t) }));
    const cur = view === "rooms" ? type : tier;
    $("chips").innerHTML = list.map((x) => `<button type="button" data-id="${P.esc(x.id)}" aria-pressed="${x.id === cur}">${P.esc(x.name)}</button>`).join("");
    const curItem = list.find((x) => x.id === cur) || {};
    const rooms = view === "pkg" ? prop.rooms.filter((r) => r.tier === tier).map((r) => r.name) : [];
    $("typeNote").textContent = view === "rooms"
      ? [curItem.note, "Rates per room per night." + (hasAc(type) ? " Bottom number: AC." : "")].filter(Boolean).join(" · ")
      : `Price per adult per night, all meals. Calendar shows Non-AC, ${Math.min(...sizesOf(tier))} adults sharing.` + (rooms.length > 1 ? ` For: ${rooms.join(", ")}.` : "");
  }

  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    if (view === "rooms") type = b.dataset.id;
    else tier = b.dataset.id;
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

  const monthStart = (ym) => ym + "-01";
  const daysIn = (ym) => { const [y, m] = ym.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  const shiftMonth = (ym, n) => { const [y, m] = ym.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };
  const monthDates = (ym) => Array.from({ length: daysIn(ym) }, (_, i) => ym + "-" + String(i + 1).padStart(2, "0"));
  const dow = (d) => new Date(d + "T00:00:00Z").getUTCDay(); // 0 = Sunday
  const lastMonth = shiftMonth(today.slice(0, 7), MONTHS_AHEAD);

  // What a cell shows for one date in the current view.
  function cellFor(d) {
    if (view === "rooms") {
      const c = P.calRoom(cal, type, d);
      const ac = hasAc(type) ? c.ac : null;
      return {
        v: c.rate != null ? num(c.rate) : "—",
        v2: ac != null ? num(ac) : "",
        sold: c.soldOut,
        changed: c.changed,
        label: `${c.rate != null ? "₹" + num(c.rate) : "no rate"}${ac != null ? ", AC ₹" + num(ac) : ""}${c.soldOut ? ", sold out" : ""}`,
      };
    }
    const c = P.calPackage(cal, tier, d);
    const size = Math.min(...sizesOf(tier));
    const v = c.nonac && c.nonac[size] != null ? c.nonac[size] : null;
    return { v: v != null ? num(v) : "—", v2: c.label || "", sold: false, changed: c.changed, label: `${v != null ? "₹" + num(v) + " per adult" : "no package rate"}${c.label ? ", " + c.label : ""}` };
  }

  function renderGrid() {
    const [y, m] = month.split("-").map(Number);
    $("monthName").textContent = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
    $("prevMonth").disabled = month <= today.slice(0, 7);
    $("nextMonth").disabled = month >= lastMonth;
    const lead = (dow(monthStart(month)) + 6) % 7; // Monday first
    const head = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => `<div class="wd" aria-hidden="true">${w}</div>`).join("");
    const blanks = Array.from({ length: lead }, () => `<span class="day blank" aria-hidden="true"></span>`).join("");
    const cells = monthDates(month).map((d) => {
      const past = d < today;
      const c = cellFor(d);
      const cls = ["day", c.changed && "changed", c.sold && "sold", sel.has(d) && "sel", d === today && "today"].filter(Boolean).join(" ");
      const full = P.fmtDate(d) + ": " + c.label;
      return `<button type="button" class="${cls}" data-d="${d}"${past ? " disabled" : ""} aria-pressed="${sel.has(d)}" aria-label="${P.esc(full)}">
        <span class="dn">${Number(d.slice(8))}</span>
        <span class="v">${c.v}</span>
        ${c.sold ? `<span class="so">Sold out</span>` : c.v2 ? `<span class="v2">${P.esc(c.v2)}</span>` : ""}
      </button>`;
    }).join("");
    $("grid").innerHTML = head + blanks + cells;
    $("legend").innerHTML = [
      `<li><i class="l-changed"></i>Changed from normal</li>`,
      view === "rooms" ? `<li><i class="l-sold"></i>Sold out</li>` : "",
      `<li><i class="l-sel"></i>Selected</li>`,
    ].join("");
    $("calHint").textContent = sel.size ? "" : "Tap the dates you want to change, then set the rate below.";
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
    const pick = b.dataset.pick;
    rangeStart = null;
    if (pick === "none") sel.clear();
    else {
      monthDates(month).filter((d) => d >= today).forEach((d) => {
        const w = dow(d);
        if (pick === "month" || (pick === "weekend" && (w === 5 || w === 6)) || (pick === "weekday" && w !== 5 && w !== 6)) sel.add(d);
      });
    }
    renderGrid();
    renderSheet();
  });

  /* ---------- The selected dates ---------- */
  const sorted = () => [...sel].filter((d) => d >= today).sort();
  const intOrNull = (v) => {
    const s = String(v).trim();
    if (s === "") return null;
    const n = Math.round(Number(s));
    return Number.isFinite(n) && n > 0 && n < MAX_RATE ? n : NaN;
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function renderSheet() {
    const dates = sorted();
    const open = view !== "base" && !!cal && dates.length > 0;
    $("sheet").hidden = !open;
    document.body.classList.toggle("selecting", open);
    if (!open) return;
    $("selCount").textContent = P.plural(dates.length, "date") + " selected";
    $("selRange").textContent = dates.length === 1 ? P.fmtDate(dates[0]) : `${P.fmtDate(dates[0])} – ${P.fmtDate(dates[dates.length - 1])}`;
    $("sheetRooms").hidden = view !== "rooms";
    $("sheetPkg").hidden = view !== "pkg";
    const first = dates[0];
    let mixed = false;
    if (view === "rooms") {
      const name = (typesOf(prop).find((t) => t.id === type) || {}).name;
      const c = P.calRoom(cal, type, first);
      mixed = dates.some((d) => !same(P.calRoom(cal, type, d), c));
      $("sRate").value = c.rate ?? "";
      $("sAcLbl").hidden = !hasAc(type);
      $("sAc").value = hasAc(type) ? c.ac ?? "" : "";
      $("sSold").checked = c.soldOut;
      $("sReset").textContent = "Back to normal rate";
      $("sHint").textContent = (mixed ? `These dates have different rates; shown are ${P.fmtDate(first)}'s. Saving gives them all the rates above. ` : "") + `${name}: leave a box empty for the normal rate.`;
    } else {
      const c = P.calPackage(cal, tier, first);
      mixed = dates.some((d) => !same(P.calPackage(cal, tier, d), c));
      $("sLabel").value = c.label || "";
      $("sTable").innerHTML = sizesOf(tier).map((n) => `<tr><td>${n} adults</td>
        <td><input type="number" inputmode="numeric" min="1" data-kind="nonac" data-n="${n}" value="${c.nonac && c.nonac[n] != null ? c.nonac[n] : ""}" aria-label="Non-AC, ${n} adults"></td>
        <td><input type="number" inputmode="numeric" min="1" data-kind="ac" data-n="${n}" value="${c.ac && c.ac[n] != null ? c.ac[n] : ""}" aria-label="AC, ${n} adults"></td></tr>`).join("");
      $("sReset").textContent = "Back to normal package rate";
      $("sHint").textContent = (mixed ? `These dates have different package rates; shown are ${P.fmtDate(first)}'s. Saving gives them all the rates above. ` : "")
        + `${tierName(tier)}. Children pay half. One adult pays as ${Math.min(...sizesOf(tier))}. Leave AC empty to use the Non-AC rate.`;
    }
  }

  $("sCancel").addEventListener("click", () => { sel.clear(); rangeStart = null; render(); });

  // A date's changes with this view's entry replaced by `entry` (null removes it).
  function withEntry(d, entry) {
    const day = clone(cal.days[d] || {});
    const key = view === "rooms" ? "rooms" : "pkg";
    const id = view === "rooms" ? type : tier;
    const group = day[key] || {};
    if (entry) group[id] = entry;
    else delete group[id];
    if (Object.keys(group).length) day[key] = group;
    else delete day[key];
    return Object.keys(day).length ? day : null;
  }

  function readTable(kind) {
    const t = {};
    let bad = false;
    document.querySelectorAll(`#sTable input[data-kind=${kind}]`).forEach((el) => {
      const v = intOrNull(el.value);
      if (Number.isNaN(v)) bad = true;
      else if (v != null) t[el.dataset.n] = v;
    });
    return bad ? NaN : Object.keys(t).length ? t : null;
  }

  // The entry for this view from the sheet, or a string saying what's wrong.
  function entryFromSheet() {
    if (view === "rooms") {
      const b = cal.base.rooms[type] || {};
      const rate = intOrNull($("sRate").value);
      const ac = hasAc(type) ? intOrNull($("sAc").value) : null;
      if (Number.isNaN(rate) || Number.isNaN(ac)) return "Rates must be whole rupees, more than 0.";
      if (rate == null && b.rate == null) return "Type a rate: this room has no normal rate yet.";
      const e = {};
      if (rate != null && rate !== b.rate) e.rate = rate;
      if (ac != null && ac !== b.ac) e.ac = ac;
      if ($("sSold").checked) e.soldOut = true;
      return Object.keys(e).length ? e : null;
    }
    const nonac = readTable("nonac");
    const ac = readTable("ac");
    if (Number.isNaN(nonac) || Number.isNaN(ac)) return "Rates must be whole rupees, more than 0.";
    const label = $("sLabel").value.trim().slice(0, 60);
    const b = cal.base.pkg[tier] || {};
    // The same as the normal rates, with no name: nothing to keep.
    if (!label && same(nonac, b.nonac || null) && same(ac, b.ac || null)) return null;
    if (!nonac && !ac && !label) return null;
    const e = { nonac, ac };
    if (label) e.label = label;
    return e;
  }

  $("sSave").addEventListener("click", () => {
    const e = entryFromSheet();
    if (typeof e === "string") return toast(e);
    saveDays(sorted(), e);
  });
  $("sReset").addEventListener("click", () => saveDays(sorted(), null));

  async function saveDays(dates, entry) {
    const days = {};
    dates.forEach((d) => (days[d] = withEntry(d, entry)));
    if (await save({ days })) {
      sel.clear();
      rangeStart = null;
      render();
    }
  }

  /*
   * Writes `changes` ({ base?, days? }) and applies them here. The first save
   * creates the document from everything shown (the rates.js starting values
   * plus this change). Each save also drops dates more than a week past, so
   * the document doesn't grow forever.
   */
  async function save(changes) {
    if (saving) return false;
    const next = clone(cal);
    if (changes.base) next.base = changes.base;
    Object.entries(changes.days || {}).forEach(([d, v]) => { if (v) next.days[d] = v; else delete next.days[d]; });
    const old = P.addDays(today, -7);
    const out = { ...changes, days: { ...(changes.days || {}) } };
    Object.keys(next.days).forEach((d) => { if (d < old) { delete next.days[d]; out.days[d] = null; } });
    // Only send dates that change.
    Object.keys(out.days).forEach((d) => { if (same(out.days[d], cal.days[d] || null)) delete out.days[d]; });
    if (!out.base && !Object.keys(out.days).length && live) { toast("Nothing changed."); return true; }

    saving = true;
    setBusy(true);
    try {
      if (demo) await new Promise((r) => setTimeout(r, 300));
      else if (live) await P.saveCalendar(propKey, out, await A.token(), manager.id, false);
      else await P.saveCalendar(propKey, { base: next.base, days: next.days }, await A.token(), manager.id, true);
      if (demo) demoCal[propKey] = { ...next, updatedAt: new Date().toISOString() };
      cal = { ...next, updatedAt: new Date().toISOString() };
      live = true;
      toast(demo ? "Demo: not saved." : "Saved. The website and Package Generator show it now.");
      return true;
    } catch (e) {
      console.error(e);
      if (e.status === 403) toast("You can't change rates for this property.");
      else if (e.status === 409 || e.status === 400) { toast("Someone else just saved. Reloading their rates; try again."); await load(); }
      else toast("Couldn't save. Check your connection and try again.");
      return false;
    } finally {
      saving = false;
      setBusy(false);
    }
  }

  function setBusy(on) {
    ["sSave", "sReset", "saveBase"].forEach((id) => ($(id).disabled = on));
    $("sSave").textContent = on ? "Saving…" : "Save";
  }

  /* ---------- Normal rates ---------- */
  function renderBase() {
    const b = cal.base;
    $("baseRooms").innerHTML = typesOf(prop).map((t) => {
      const r = b.rooms[t.id] || {};
      return `<div class="baseRow">
        <div class="nm">${P.esc(t.name)}${t.note ? `<small>${P.esc(t.note)}</small>` : ""}</div>
        <label class="f">Rate (₹)<input type="number" inputmode="numeric" min="1" data-room="${P.esc(t.id)}" data-kind="rate" value="${r.rate ?? ""}"></label>
        ${hasAc(t.id) ? `<label class="f">AC rate (₹)<input type="number" inputmode="numeric" min="1" data-room="${P.esc(t.id)}" data-kind="ac" value="${r.ac ?? ""}"></label>` : "<span></span>"}
      </div>`;
    }).join("");
    $("basePkg").innerHTML = tiersOf(prop).map((t) => {
      const pk = b.pkg[t] || {};
      const rooms = prop.rooms.filter((r) => r.tier === t).map((r) => r.name);
      return `<h3 class="tierH">Package rates · ${P.esc(tierName(t))}</h3>
        <p class="hint" style="margin:0 0 6px">Per adult per night, all meals.${rooms.length > 1 ? " For " + P.esc(rooms.join(", ")) + "." : ""} Leave empty if you don't sell this package.</p>
        <table class="pt"><thead><tr><th>Adults in the room</th><th>Non-AC ₹ / adult</th><th>AC ₹ / adult</th></tr></thead><tbody>
        ${sizesOf(t).map((n) => `<tr><td>${n} adults</td>
          <td><input type="number" inputmode="numeric" min="1" data-tier="${P.esc(t)}" data-kind="nonac" data-n="${n}" value="${pk.nonac && pk.nonac[n] != null ? pk.nonac[n] : ""}" aria-label="${P.esc(tierName(t))}, Non-AC, ${n} adults"></td>
          <td><input type="number" inputmode="numeric" min="1" data-tier="${P.esc(t)}" data-kind="ac" data-n="${n}" value="${pk.ac && pk.ac[n] != null ? pk.ac[n] : ""}" aria-label="${P.esc(tierName(t))}, AC, ${n} adults"></td></tr>`).join("")}
        </tbody></table>`;
    }).join("");
  }

  $("undoBase").addEventListener("click", renderBase);
  $("saveBase").addEventListener("click", () => {
    const base = { rooms: {}, pkg: {} };
    let bad = false;
    typesOf(prop).forEach((t) => {
      const get = (k) => { const el = document.querySelector(`#baseRooms input[data-room="${t.id}"][data-kind=${k}]`); const v = el ? intOrNull(el.value) : null; if (Number.isNaN(v)) bad = true; return Number.isNaN(v) ? null : v; };
      base.rooms[t.id] = { rate: get("rate"), ac: hasAc(t.id) ? get("ac") : null };
    });
    tiersOf(prop).forEach((t) => {
      const table = (k) => {
        const o = {};
        document.querySelectorAll(`#basePkg input[data-tier="${t}"][data-kind=${k}]`).forEach((el) => { const v = intOrNull(el.value); if (Number.isNaN(v)) bad = true; else if (v != null) o[el.dataset.n] = v; });
        return Object.keys(o).length ? o : null;
      };
      base.pkg[t] = { nonac: table("nonac"), ac: table("ac") };
    });
    if (bad) return toast("Rates must be whole rupees, more than 0.");
    const missing = typesOf(prop).filter((t) => base.rooms[t.id].rate == null).map((t) => t.name);
    if (missing.length) return toast(`Type a normal rate for ${missing.join(", ")}.`);
    if (live && same(base, cal.base)) return toast("Nothing changed.");
    save({ base }).then((ok) => ok && render());
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
  // Local only: ?demo shows the calendar without signing in or saving, to try the layout.
  const demo = local && params.has("demo");
  const demoCal = {};
  if (demo) { start({ name: "Demo", id: "+910000000000" }); return; }

  import("/package/auth.js").then((mod) => {
    A = mod;
    A.onUser(async (user) => {
      if (!user) return lock("Managers only. Sign in on the Package Generator first, then come back here.", true);
      const id = A.idOf(user);
      if (manager && manager.id === id) return;
      let m;
      try { m = id && (await P.loadManager(id)); }
      catch (e) { console.error(e); return lock("Couldn't reach the server. Check your connection and reload.", false); }
      // A password account only counts if the manager's document names it.
      if (m && !user.phoneNumber && m.uid !== user.uid) m = null;
      if (!m) return lock("This number isn't on the manager list.", false);
      m.id = id;
      start(m);
    });
  }).catch((e) => {
    console.error(e);
    lock("Couldn't load sign-in. Check your connection and reload.", false);
  });
})();
