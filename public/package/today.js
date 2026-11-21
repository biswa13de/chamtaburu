/*
 * /package/today — the day sheet for staff: who arrives, leaves and stays on
 * a date, which rooms, guests, meal plan, cars and extras, the balance to
 * collect, and the kitchen's meal counts. Built from packages marked
 * Confirmed in the Package Generator (their saved form has the rooms and
 * add-ons; the quote has the totals). Bookings made elsewhere aren't here.
 *
 * It also checks each package is counted in the rate calendar's rooms left
 * (package-core.js, "Availability"), and offers "Count it" when it isn't —
 * for packages confirmed before that existed.
 *
 * Sign-in is the Package Generator's (auth.js), managers only.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const page = (p) => (local ? `/package/${p}.html` : `/package/${p}`);
  const params = new URLSearchParams(location.search);

  let A = null;
  let manager = null;
  let propKey = "";
  let prop = null;
  let day = P.today();
  let all = []; // confirmed packages for this property: { code, q, form }
  let cal = null; // the property's rate calendar, for "counted in rooms left"
  let loading = 0;

  /* ---------- Sign-in ---------- */
  function lock(msg, showLink) {
    $("app").hidden = true;
    $("lock").hidden = false;
    $("lockMsg").textContent = msg;
    $("lockAct").hidden = !showLink;
    $("lockOutAct").hidden = true;
  }
  function notManager(user) {
    const partner = user.email && !/@managers\.chamtaburu\.in$/i.test(user.email);
    lock(partner
      ? `You're signed in as ${user.email}, a travel partner account. Sign out, then sign in on the Package Generator with your manager number.`
      : "This account isn't on the manager list.", false);
    $("lockOutAct").hidden = false;
  }
  $("lockOutBtn").addEventListener("click", async () => {
    $("lockOutBtn").disabled = true;
    try { await A.logout(); } catch (e) { console.error(e); location.reload(); }
    $("lockOutBtn").disabled = false;
  });
  $("signInLink").href = page("index");
  $("genLink").href = page("index");

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
    if (/^\d{4}-\d{2}-\d{2}$/.test(params.get("d") || "")) day = params.get("d");
    setProperty(allowed.includes(want) ? want : allowed[0]);
  }

  $("prop").addEventListener("change", (e) => setProperty(e.target.value));
  $("day").addEventListener("change", (e) => { if (e.target.value) { day = e.target.value; render(); } });
  $("dayChips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-shift]");
    if (!b) return;
    day = P.addDays(P.today(), Number(b.dataset.shift));
    render();
  });
  $("refresh").addEventListener("click", () => load());

  function setProperty(key) {
    propKey = key;
    prop = C.properties[key];
    $("prop").value = key;
    $("calLink").href = page("calendar") + "?p=" + key;
    load();
  }

  /* ---------- Data ---------- */
  async function load() {
    const key = propKey;
    const n = ++loading;
    $("loadErr").hidden = true;
    $("summary").innerHTML = `<li class="muted">Loading…</li>`;
    try {
      const t = demo ? "" : await A.token();
      const [list, c] = demo ? [demoData.list, demoData.cal] : await Promise.all([P.listConfirmed(t), P.loadCalendar(key)]);
      const mine = list.filter((x) => (x.p || x.q.p) === key && x.q.ci && x.q.co);
      // The saved form has the rooms, meal plan and add-ons; only for the ones near today.
      const near = mine.filter((x) => x.q.co >= P.addDays(P.today(), -3));
      const forms = await Promise.all(near.map((x) => (demo ? Promise.resolve(demoData.forms[x.code] || null) : P.loadForm(x.code, t).catch(() => null))));
      if (n !== loading || key !== propKey) return;
      all = near.map((x, i) => ({ ...x, form: forms[i] }));
      cal = c;
      render();
    } catch (e) {
      console.error(e);
      if (n !== loading) return;
      $("loadErr").hidden = false;
      $("loadErr").textContent = "Couldn't load the bookings. Check your connection and tap Refresh.";
      $("summary").innerHTML = "";
    }
  }

  /* ---------- One booking ---------- */
  const roomOf = (id) => prop.rooms.find((r) => r.id === id);
  const planOf = (b) => (b.form && b.form.f && b.form.f.meal) || "";
  const isPkg = (b) => planOf(b) === "pkg" || planOf(b) === "pkg-ac";
  const phoneOf = (b) => P.waNumber((b.form && b.form.f && b.form.f.gPhone) || "");
  const balanceOf = (b) => Math.max(0, (b.q.tot || 0) - (b.q.adv || 0));

  // "2 × Double Bedded (AC), 2 adults + 1 child each"
  function roomLines(b) {
    if (!b.form) return (b.q.l || []).filter((l) => !/^(Extra|Pickup|Drop|Day \d|Bonfire)/.test(l[0])).map((l) => l[0]);
    return (b.form.rooms || []).filter((r) => r.q).map((r) => {
      const room = roomOf(r.id);
      const name = room ? room.name : r.id;
      const who = [r.a && P.plural(r.a, "adult"), r.k && P.kids(r.k)].filter(Boolean).join(" + ");
      return `${r.q > 1 ? r.q + " × " : ""}${name}${r.ac && room && room.ac ? " (AC)" : ""}${who ? " · " + who + (r.q > 1 ? " each" : "") : ""}`;
    });
  }
  // Cars, sightseeing, bonfire, decoration and the manager's own items.
  function extrasOf(b) {
    if (!b.form) return [];
    const out = [];
    P.addonsFor(prop).forEach((a) => {
      const q = (b.form.addons || {})[a.id];
      if (!q) return;
      if (a.unit === "car") {
        const cars = Object.entries(P.carQty(q, b.form.f.car)).filter(([, n]) => n).map(([size, n]) => `${n > 1 ? n + " × " : ""}${size}-seater`);
        out.push(`${a.name}${cars.length ? " (" + cars.join(", ") + ")" : ""}`);
      } else if (a.unit === "kg") out.push(`${a.name} ${q} kg`);
      else if (a.unit === "person") out.push(`${a.name} × ${q} ${q === 1 ? "person" : "people"}`);
      else out.push(`${a.name}${q > 1 ? " × " + q : ""}`);
    });
    (b.form.custom || []).forEach((c) => { if (String(c.n || "").trim()) out.push(String(c.n).trim() + (Number(c.q) > 1 ? " × " + c.q : "")); });
    return out;
  }
  // Is it counted in the rate calendar's rooms left? null when it can't be (no form, no calendar).
  function counted(b) {
    if (!b.form || !cal) return null;
    const holds = P.holdsFromForm(prop, b.form);
    return Object.entries(holds).every(([d, types]) => d < P.today() || Object.entries(types).every(([t, n]) => ((((cal.days[d] || {}).rooms || {})[t] || {}).held || {})[b.code] === n));
  }

  function card(b, kind) {
    const q = b.q;
    const phone = phoneOf(b);
    const extras = extrasOf(b);
    const bal = balanceOf(b);
    const c = counted(b);
    const stayLine = `${P.fmtDate(q.ci).replace(/ \d{4}$/, "")} → ${P.fmtDate(q.co).replace(/ \d{4}$/, "")} · ${P.plural(q.n || P.nightsBetween(q.ci, q.co), "night")}`
      + (kind === "stay" ? ` · night ${P.nightsBetween(q.ci, day) + 1}` : "");
    return `<article class="bk">
      <div class="bkHead"><b>${P.esc(q.g || "Guest")}</b><span class="muted">${P.esc(q.id || b.code)}</span></div>
      <p class="bkLine">${P.esc(stayLine)} · ${P.esc([P.plural(q.a || 0, "adult"), q.k ? P.kids(q.k) : ""].filter(Boolean).join(", "))}</p>
      <ul class="bkRooms">${roomLines(b).map((r) => `<li>${P.esc(r)}</li>`).join("")}</ul>
      <p class="bkLine">${P.esc(P.PLANS[planOf(b)] || "Plan not recorded")}${extras.length ? " · " + P.esc(extras.join(" · ")) : ""}</p>
      ${q.note ? `<p class="bkLine note">${P.esc(q.note)}</p>` : ""}
      <p class="bkLine">${kind === "dep" ? "Total" : "Balance to collect"}: <b>${P.inr(kind === "dep" ? q.tot || 0 : bal)}</b>${kind !== "dep" && q.adv ? ` <span class="muted">(total ${P.inr(q.tot || 0)}, advance ${P.inr(q.adv)})</span>` : ""}</p>
      <p class="bkActs">
        ${phone ? `<a class="btn small" href="tel:+${phone}">Call</a><a class="btn small wa" href="https://wa.me/${phone}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        <a class="btn small" href="${P.esc(viewUrl(b.code))}" target="_blank" rel="noopener">Package</a>
        ${c === false && q.co > P.today() ? `<button class="btn small sold" type="button" data-count="${P.esc(b.code)}">Not in rooms left · Count it</button>` : ""}
      </p>
    </article>`;
  }
  function viewUrl(code) {
    if (/(^|\.)chamtaburu\.in$/.test(location.hostname)) return `https://${prop.domain}/p/${code}`;
    if (local) return `${location.origin}/package/view.html?c=${code}`;
    return `${location.origin}/p/${code}`;
  }

  /* ---------- The day ---------- */
  const inHouse = (b, d) => b.q.ci <= d && d < b.q.co; // staying the night of `d`
  function dayLists() {
    const arr = all.filter((b) => b.q.ci === day);
    const dep = all.filter((b) => b.q.co === day);
    const stay = all.filter((b) => b.q.ci < day && day < b.q.co);
    return { arr, dep, stay };
  }
  /*
   * Meal counts for `day`. A package is all meals per night: the night's
   * lunch, evening snacks and dinner, and breakfast the morning after. So
   * breakfast is everyone who stayed the night before; the rest, everyone
   * staying tonight. Where breakfast comes with every room (the Resort's
   * `roomBreakfast`), room-only guests have breakfast too.
   */
  function meals() {
    const prev = P.addDays(day, -1);
    const sum = (list) => list.reduce((s, b) => ({ a: s.a + (b.q.a || 0), k: s.k + (b.q.k || 0) }), { a: 0, k: 0 });
    const bf = sum(all.filter((b) => inHouse(b, prev) && (isPkg(b) || prop.roomBreakfast)));
    const rest = sum(all.filter((b) => inHouse(b, day) && isPkg(b)));
    return { bf, rest };
  }
  const who = (x) => x.a + x.k === 0 ? "0" : `${x.a + x.k}` + (x.k ? ` (${P.plural(x.a, "adult")}, ${P.kids(x.k)})` : "");

  function render() {
    $("day").value = day;
    document.querySelectorAll("#dayChips button").forEach((b) => b.setAttribute("aria-pressed", String(P.addDays(P.today(), Number(b.dataset.shift)) === day)));
    const { arr, dep, stay } = dayLists();
    const rooms = (list) => list.reduce((s, b) => s + ((b.form && b.form.rooms) || []).reduce((n, r) => n + (r.q || 0), 0), 0);
    const nice = new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    $("dayTitle").textContent = (day === P.today() ? "Today · " : "") + nice;
    $("summary").innerHTML = [
      `<li><b>${arr.length}</b> arriving${arr.length ? ` · ${P.plural(rooms(arr), "room")} to make ready by ${P.esc(prop.checkIn)}` : ""}</li>`,
      `<li><b>${dep.length}</b> leaving${dep.length ? ` · ${P.plural(rooms(dep), "room")} to clean after ${P.esc(prop.checkOut)}` : ""}</li>`,
      `<li><b>${stay.length}</b> staying on</li>`,
      arr.some((b) => balanceOf(b) > 0) ? `<li>Collect on arrival: <b>${P.inr(arr.reduce((s, b) => s + balanceOf(b), 0))}</b></li>` : "",
    ].join("");
    const m = meals();
    $("meals").innerHTML = [`Breakfast: <b>${who(m.bf)}</b>`, `Lunch: <b>${who(m.rest)}</b>`, `Evening snacks: <b>${who(m.rest)}</b>`, `Dinner: <b>${who(m.rest)}</b>`].map((x) => `<li>${x}</li>`).join("");
    $("mealsHint").textContent = "Package guests have all meals" + (prop.roomBreakfast ? "; breakfast comes with every room here." : ".") + " Breakfast is for guests who stayed last night.";
    const fill = (id, nId, list, kind, empty) => {
      $(nId).textContent = list.length ? `(${list.length})` : "";
      $(id).innerHTML = list.length ? list.map((b) => card(b, kind)).join("") : `<p class="hint" style="margin:0">${empty}</p>`;
    };
    fill("arrivals", "nArr", arr, "arr", "No arrivals.");
    fill("departures", "nDep", dep, "dep", "No departures.");
    fill("stays", "nStay", stay, "stay", "Nobody staying on.");
  }

  // "Count it": a confirmed package missing from rooms left (confirmed before that existed).
  document.getElementById("board").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-count]");
    if (!btn) return;
    const b = all.find((x) => x.code === btn.dataset.count);
    if (!b || !b.form) return;
    btn.disabled = true;
    try {
      if (demo) toast("Demo: not saved.");
      else {
        const r = await P.syncHolds(propKey, b.code, P.holdsFromForm(prop, b.form), await A.token(), manager.id);
        toast(r.over.length ? `Counted, but overbooked on ${P.fmtDate(r.over[0].date)}. Check the rate calendar's Availability.` : "Counted in rooms left.");
        cal = await P.loadCalendar(propKey);
      }
      render();
    } catch (err) {
      console.error(err);
      toast(err.status === 403 ? "You can't change this property's rate calendar." : "Couldn't save. Try again.");
      btn.disabled = false;
    }
  });

  /* ---------- Share ---------- */
  function message() {
    const { arr, dep, stay } = dayLists();
    const nice = new Date(day + "T00:00:00Z").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    const line = (b, kind) => {
      const parts = [b.q.g || "Guest", phoneOf(b) ? P.prettyPhone(phoneOf(b)) : "", roomLines(b).join(", "), `${b.q.a || 0}A${b.q.k ? "+" + b.q.k + "C" : ""}`];
      if (kind !== "dep") parts.push(P.PLANS[planOf(b)] || "");
      if (kind === "arr") parts.push(`till ${P.fmtDate(b.q.co).replace(/ \d{4}$/, "")}`, ...extrasOf(b));
      if (kind === "arr" && balanceOf(b)) parts.push(`collect ${P.inr(balanceOf(b))}`);
      if (kind === "arr" && b.q.note) parts.push(`note: ${b.q.note}`);
      return "• " + parts.filter(Boolean).join(" · ");
    };
    const m = meals();
    const out = [`*${prop.name} · ${nice}*`, ""];
    out.push(`*Arriving (${arr.length})*`, ...(arr.length ? arr.map((b) => line(b, "arr")) : ["—"]), "");
    out.push(`*Leaving (${dep.length})*`, ...(dep.length ? dep.map((b) => line(b, "dep")) : ["—"]), "");
    out.push(`*Staying on (${stay.length})*`, ...(stay.length ? stay.map((b) => line(b, "stay")) : ["—"]), "");
    out.push(`*Meals*: breakfast ${m.bf.a + m.bf.k} · lunch ${m.rest.a + m.rest.k} · snacks ${m.rest.a + m.rest.k} · dinner ${m.rest.a + m.rest.k}`);
    return out.join("\n");
  }
  $("share").addEventListener("click", () => {
    const w = window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, "_blank");
    if (w) w.opener = null;
  });
  $("copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(message()); toast("Copied. Paste it into the staff group."); }
    catch { toast("Couldn't copy. Use Send on WhatsApp instead."); }
  });

  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 4000);
  }

  /* ---------- Start ---------- */
  // Local only: ?demo shows made-up bookings without signing in.
  const demo = local && params.has("demo");
  let demoData = null;
  if (demo) {
    const t = P.today();
    const q = (id, g, ci, n, a, k, tot, adv, note) => ({ id, g, ci, co: P.addDays(t, ci + n), n, a, k, tot, adv, note, p: "village" });
    const fix = (x) => ({ ...x, ci: P.addDays(t, x.ci) });
    const list = [
      { code: "AAA111", p: "village", q: fix(q("CEV-AAA111", "Ananya Roy", 0, 2, 3, 1, 21000, 10500, "Anniversary: cake at dinner")) },
      { code: "BBB222", p: "village", q: fix(q("CEV-BBB222", "Rahul Sen", -2, 2, 2, 0, 11000, 5500, "")) },
      { code: "CCC333", p: "village", q: fix(q("CEV-CCC333", "Mitra family", -1, 3, 4, 2, 32000, 16000, "")) },
    ];
    const forms = {
      AAA111: { f: { gPhone: "9876543210", ci: list[0].q.ci, co: list[0].q.co, meal: "pkg", car: 5 }, rooms: [{ id: "shal-shanti", q: 1, a: 2, k: 1 }, { id: "floor-t2", q: 1, a: 1, k: 0 }], addons: { "pickup-purulia": { 5: 1 }, decor: 1 }, custom: [] },
      BBB222: { f: { gPhone: "9876543210", ci: list[1].q.ci, co: list[1].q.co, meal: "room" }, rooms: [{ id: "karam-kunja", q: 1, a: 2, k: 0, ac: true }], addons: { "drop-barabhum": { 5: 1 } }, custom: [] },
      CCC333: { f: { gPhone: "9876543210", ci: list[2].q.ci, co: list[2].q.co, meal: "pkg" }, rooms: [{ id: "pahari-chaya", q: 1, a: 2, k: 1 }, { id: "jharna-neer", q: 1, a: 2, k: 1 }], addons: { bonfire: 2 }, custom: [{ n: "Birthday decoration", q: 1, p: 800 }] },
    };
    demoData = { list, forms, cal: { base: { rooms: {}, pkg: {} }, days: {} } };
    start({ name: "Demo", id: "+910000000000" });
    return;
  }

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
      if (!m) return notManager(user);
      m.id = id;
      start(m);
    });
  }).catch((e) => {
    console.error(e);
    lock("Couldn't load sign-in. Check your connection and reload.", false);
  });
})();
