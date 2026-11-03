/*
 * /package/menu — the package menu (rates.js `menu`) as a page to share:
 * Share (the phone's share sheet, else WhatsApp), Copy menu as text (for a
 * WhatsApp chat) and Save as PDF (one A4 page). The property comes from
 * ?p=village|resort, else the site it is opened on, as on /menu.
 */
(function () {
  const C = window.PACKAGE_CONFIG;
  const P = window.PKG;
  const $ = (id) => document.getElementById(id);

  const asked = new URLSearchParams(location.search).get("p");
  const key = C.properties[asked] ? asked : location.hostname.indexOf("resort.") === 0 ? "resort" : "village";
  const prop = C.properties[key];
  const menu = C.menu;

  document.title = `Package Menu · ${prop.name}`;
  $("propTag").textContent = `${prop.name} · home-style food, cooked fresh in our kitchen.`;
  $("menu").innerHTML = P.legendHtml() + P.mealsHtml(menu);
  $("note").textContent = menu.note || "";
  $("note").hidden = !menu.note;

  $("footName").textContent = prop.name;
  $("footAddr").textContent = prop.address;
  $("footSite").href = "https://" + prop.domain;
  $("footSite").textContent = prop.domain;
  const calls = P.bookingCalls(prop);
  if (!calls.length) calls.push({ name: "us", phone: prop.phone });
  $("calls").innerHTML = calls.map((c) => `<a href="tel:+${c.phone}">Call ${P.esc(c.name)} · ${P.prettyPhone(c.phone)}</a>`).join("");

  // The link to share: this page for this property, without anything after #.
  const url = location.origin + location.pathname + `?p=${key}`;
  const names = menu.meals.map((m, i) => (i ? m.name.toLowerCase() : m.name));
  const summary = names.slice(0, -1).join(", ") + " & " + names[names.length - 1] + ", all included in your stay package.";

  // WhatsApp text: *bold* meal names, and a coloured marker for each dish.
  const MARK = { veg: "🟢", egg: "🟡", nonveg: "🔴" };
  function menuText() {
    const out = [`*${prop.name} · Package Menu*`, "🟢 veg · 🟡 egg · 🔴 non-veg"];
    menu.meals.forEach((m) => {
      out.push("", `*${m.name}* · ${m.time}`);
      m.items.forEach((it) => {
        const [name, desc, type] = Array.isArray(it) ? it : [it, "", ""];
        out.push(`${MARK[type] || "•"} ${name}${desc ? (/^with /.test(desc) ? " " : ": ") + desc : ""}`);
      });
    });
    if (menu.note) out.push("", `_${menu.note}_`);
    out.push("", url);
    return out.join("\n");
  }

  let toastTimer;
  function toast(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").hidden = true), 2400);
  }

  $("share").addEventListener("click", async () => {
    const title = `Package Menu · ${prop.name}`;
    if (navigator.share) {
      try { await navigator.share({ title, text: `${title}\n${summary}`, url }); }
      catch (e) { if (e.name !== "AbortError") toast("Couldn't share. Try Copy menu as text."); }
      return;
    }
    const w = window.open(`https://wa.me/?text=${encodeURIComponent(`*${title}*\n${summary}\n${url}`)}`, "_blank");
    if (w) w.opener = null;
  });
  $("copyText").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(menuText()); toast("Menu copied. Paste it in WhatsApp."); }
    catch { toast("Couldn't copy. Use Share instead."); }
  });
  $("print").addEventListener("click", () => window.print());
})();
