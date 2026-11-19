/*
 * /package/partners — travel partners who signed up at /partners.
 *
 * Every manager sees the list; an admin (role "admin" on their manager
 * document) approves a partner for one or both properties, changes which, or
 * suspends them. Approved partners see the B2B rates (/package/b2b) for those
 * properties. See "Travel partners" in b2b-core.js and firestore.rules.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const B = window.B2B;
  const $ = (id) => document.getElementById(id);
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const page = (p) => (local ? `/package/${p}.html` : `/package/${p}`);
  const params = new URLSearchParams(location.search);
  const STATUS = { pending: "Waiting", approved: "Approved", suspended: "Suspended" };

  let A = null;
  let manager = null;
  let partners = null;
  let filter = "pending";
  let busy = false;

  $("signInLink").href = page("index");
  $("genLink").href = page("index");
  $("b2bLink").href = page("b2b");
  $("portal").href = local ? "/partners/index.html" : "/partners";

  function lock(msg, showLink) {
    $("app").hidden = true;
    $("lock").hidden = false;
    $("lockMsg").textContent = msg;
    $("lockAct").hidden = !showLink;
  }

  function start(m) {
    manager = m;
    $("lock").hidden = true;
    $("app").hidden = false;
    $("who").textContent = m.name + (m.admin ? " · Admin" : "");
    $("ro").hidden = m.admin;
    load();
  }

  async function load() {
    $("loadErr").hidden = true;
    try {
      partners = demo ? demoPartners : await B.listPartners(await A.token());
      // Waiting first, then the newest.
      if (!partners.some((x) => x.status === filter) && filter === "pending") filter = "approved";
    } catch (e) {
      console.error(e);
      $("loadErr").hidden = false;
      $("loadErr").textContent = "Couldn't load partners. Check your connection, and that the new Firestore rules are deployed.";
      partners = [];
    }
    render();
  }
  $("refresh").addEventListener("click", load);

  const when = (t) => (t ? new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");
  const link = (href, text) => `<a href="${P.esc(href)}" target="_blank" rel="noopener">${P.esc(text)}</a>`;
  const webHref = (w) => (/^https?:\/\//i.test(w) ? w : "https://" + w);

  function render() {
    const count = (s) => partners.filter((x) => s === "all" || x.status === s).length;
    $("filter").innerHTML = ["pending", "approved", "suspended", "all"].map((s) =>
      `<button type="button" data-f="${s}" aria-pressed="${s === filter}">${s === "all" ? "All" : STATUS[s]} (${count(s)})</button>`).join("");
    const shown = partners.filter((x) => filter === "all" || x.status === filter);
    if (!shown.length) { $("list").innerHTML = `<li class="muted">No partners here.</li>`; return; }
    $("list").innerHTML = shown.map((x) => {
      const props = x.props || Object.keys(C.properties);
      const wa = P.waNumber(x.phone);
      const rows = [
        ["Contact", P.esc(x.contact)],
        ["Phone", wa ? `${link("https://wa.me/" + wa, P.prettyPhone(wa))} · <a href="tel:+${wa}">Call</a>` : P.esc(x.phone)],
        ["Email", `<a href="mailto:${P.esc(x.email)}">${P.esc(x.email)}</a>`],
        ["City", P.esc(x.city)],
        x.gstin && ["GSTIN", P.esc(x.gstin)],
        x.web && ["Website", link(webHref(x.web), x.web)],
        x.member && ["Member of", P.esc(x.member)],
        ["Signed up", when(x.created)],
        ["Last opened rates", when(x.lastSeenAt) || "Not yet"],
      ].filter(Boolean);
      const ctl = manager.admin ? `<div class="ctl">
          ${Object.keys(C.properties).map((k) => `<label><input type="checkbox" data-p="${k}" ${props.includes(k) ? "checked" : ""}> ${P.esc(C.properties[k].name.replace("Chamtaburu ", ""))}</label>`).join("")}
          <span class="btns">
            ${x.status === "approved" ? `<button class="btn small" type="button" data-act="approved">Save properties</button><button class="btn small" type="button" data-act="suspended">Suspend</button>`
              : `<button class="btn small primary" type="button" data-act="approved">Approve</button>${x.status === "pending" ? `<button class="btn small" type="button" data-act="suspended">Decline</button>` : ""}`}
          </span>
        </div>` : "";
      const by = x.statusBy ? `<p class="by">${STATUS[x.status] || x.status} by ${P.esc(x.statusBy)}${x.statusAt ? ", " + when(x.statusAt) : ""}</p>` : "";
      return `<li data-uid="${P.esc(x.uid)}">
        <div class="hd"><h3>${P.esc(x.agency || "(no name)")}</h3><span class="st ${P.esc(x.status)}">${P.esc(STATUS[x.status] || x.status)}</span></div>
        <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        ${by}${ctl}
      </li>`;
    }).join("");
  }

  $("filter").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-f]");
    if (!b) return;
    filter = b.dataset.f;
    render();
  });

  $("list").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act]");
    if (!b || busy) return;
    const li = b.closest("li[data-uid]");
    const x = partners.find((p) => p.uid === li.dataset.uid);
    const status = b.dataset.act;
    const props = [...li.querySelectorAll("input[data-p]:checked")].map((el) => el.dataset.p);
    if (status === "approved" && !props.length) return toast("Tick at least one property.");
    busy = true;
    b.disabled = true;
    try {
      if (!demo) await B.setPartner(x.uid, status, status === "approved" ? props : x.props || Object.keys(C.properties), await A.token(), manager.id);
      Object.assign(x, { status, props: status === "approved" ? props : x.props, statusBy: manager.id, statusAt: new Date().toISOString() });
      toast(status === "approved" ? `${x.agency} can see B2B rates now.` : `${x.agency} can't see B2B rates any more.`);
      render();
    } catch (err) {
      console.error(err);
      toast(err.status === 403 ? "Only an admin can do that." : "Couldn't save. Check your connection and try again.");
      b.disabled = false;
    } finally {
      busy = false;
    }
  });

  let toastTimer = 0;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }

  // Local only: ?demo shows made-up partners without signing in or saving.
  const demo = local && params.has("demo");
  const demoPartners = [
    { uid: "demo1", agency: "Hill Trails Holidays", contact: "Demo Contact", phone: "919876543210", email: "trips@example.com", city: "Kolkata", gstin: "19ABCDE1234F1Z5", web: "example.com", member: "TAAI", status: "pending", created: new Date().toISOString(), props: null },
    { uid: "demo2", agency: "Weekend Escapes", contact: "Demo Contact 2", phone: "919876543210", email: "hello@example.com", city: "Durgapur", status: "approved", props: ["resort"], statusBy: "+910000000000", created: new Date(Date.now() - 864e6).toISOString(), lastSeenAt: new Date().toISOString() },
  ];
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
