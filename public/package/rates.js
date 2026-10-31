/*
 * Package generator config: rates, meal plans, add-ons, terms and contact numbers
 * for both properties. Read by /package (generator) and /package/view (guest page).
 *
 * Anything marked PLACEHOLDER is a stand-in until the owner confirms it —
 * see docs/village-resort-package.md, "Data needed". Room rates are per
 * night, before GST. Resort rates are the confirmed ones from
 * src/content/resort.ts; Village rates are not known yet.
 *
 * Managers are not in this file, so their phone numbers stay out of git and
 * out of public files: they live in Firestore. See "Managers" in
 * docs/village-resort-package.md for how to add one.
 */
window.PACKAGE_CONFIG = {
  // Shows the "placeholder prices" banner in the generator. Set to false once
  // every PLACEHOLDER below has a real value.
  placeholder: true,

  // Contact numbers a package may show the guest, besides each property's own
  // `phone`. A manager's contact `phone` (set in Firestore) must be one of
  // these, or the property's number is shown instead, so a doctored link can't
  // send guests — or their advance — to a stranger. Guests see these numbers,
  // so only list ones meant to be public.
  contacts: [],

  properties: {
    village: {
      name: "Chamtaburu Eco Village",
      domain: "chamtaburu.in",
      phone: "919242748100",
      address: "Matha, Matha Forest, Baghmundi, Purulia, West Bengal 723152",
      prefix: "CEV",
      // PLACEHOLDER — Village cottage rates and occupancy are still TBD.
      rooms: [
        { id: "shal-shanti", name: "Shal Shanti", rate: 5000, adults: 2, children: 1 },
        { id: "mahua-ghar", name: "Mahua Ghar", rate: 5000, adults: 2, children: 1 },
        { id: "palash-kunja", name: "Palash Kunja", rate: 5000, adults: 2, children: 1 },
        { id: "pahari-chaya", name: "Pahari Chaya", rate: 5000, adults: 2, children: 1 },
        { id: "jharna-neer", name: "Jharna Neer", rate: 5000, adults: 2, children: 1 },
        { id: "karam-kunja", name: "Karam Kunja", rate: 5000, adults: 2, children: 1 },
        { id: "adivasi-aangan", name: "Adivasi Aangan", rate: 5000, adults: 2, children: 1 },
      ],
      // Nights from `from` to `to` (inclusive) use `rates[roomId]` if given,
      // otherwise the normal rate raised by `uplift` (0.25 = +25%).
      // PLACEHOLDER — Celebration Package rates not confirmed.
      seasons: [{ name: "Celebration", from: "2026-12-20", to: "2027-01-01", uplift: 0.25 }],
      // Per person per night. The two meal packages are the real prices from /menu.
      meals: [
        { id: "room", name: "Room only", adult: 0, child: 0 },
        { id: "veg", name: "Veg meal package (all meals)", adult: 550, child: 275 },
        { id: "nonveg", name: "Non-veg meal package (all meals)", adult: 650, child: 325 },
      ],
      // Per night. PLACEHOLDER.
      extras: { adult: 600, child: 300, bed: 500 },
      childAge: "5–10 yrs", // PLACEHOLDER
      // unit: "stay" = once, "person" = per person, "night" = per night. PLACEHOLDER prices.
      addons: [
        { id: "bonfire", name: "Evening bonfire", price: 500, unit: "stay" },
        { id: "trail", name: "Guided nature trail", price: 200, unit: "person" },
        { id: "decor", name: "Room decoration", price: 1500, unit: "stay" },
        { id: "bbq", name: "BBQ dinner", price: 400, unit: "person" },
        { id: "pickup", name: "Purulia station pickup & drop", price: 2500, unit: "stay" },
      ],
      gst: 5, // PLACEHOLDER — confirm with your accountant
      advance: 50, // % to confirm the booking. PLACEHOLDER
      validDays: 3, // PLACEHOLDER
      // PLACEHOLDER — deliberately empty rather than a made-up ID, so no guest
      // can ever pay into the wrong account. Fill in e.g.
      // upi: { id: "name@bank", payee: "Chamtaburu Eco Village" },
      // bank: { name: "...", account: "...", ifsc: "...", holder: "..." },
      upi: null,
      bank: { name: "Axis Bank", account: "925020051130088", ifsc: "UTIB0000397", holder: "CHAMTABURU ECO VILLAGE" },
      inclusions: ["Accommodation as listed", "Meals as per the selected plan", "Free parking", "Access to the central garden"],
      exclusions: ["Personal expenses", "Anything not mentioned in inclusions"],
    },

    resort: {
      name: "Chamtaburu Eco Resort",
      domain: "resort.chamtaburu.in",
      phone: "918918550242",
      address: "Sankupi, Matha Forest, Baghmundi, Purulia, West Bengal 723152",
      prefix: "CER",
      // Confirmed rates (src/content/resort.ts), breakfast included.
      rooms: [
        { id: "bamboo-cottage", name: "Bamboo Cottage", rate: 2000, adults: 2, children: 1 },
        { id: "double-bedded", name: "Double Bedded", rate: 1600, adults: 2, children: 1 },
        { id: "triple-bedded", name: "Triple Bedded", rate: 1800, ac: 2200, adults: 3, children: 1 },
        { id: "four-bedded", name: "Four Bedded", rate: 2100, ac: 2500, adults: 4, children: 0 },
        { id: "six-bedded", name: "Six Bedded", rate: 2700, ac: 3300, adults: 6, children: 1 },
      ],
      seasons: [{ name: "Celebration", from: "2026-12-20", to: "2027-01-01", uplift: 0.25 }], // PLACEHOLDER
      meals: [
        { id: "room", name: "Breakfast only (included)", adult: 0, child: 0 },
        { id: "veg", name: "Veg meal package (all meals)", adult: 550, child: 275 },
        { id: "nonveg", name: "Non-veg meal package (all meals)", adult: 650, child: 325 },
      ],
      extras: { adult: 500, child: 250, bed: 400 }, // PLACEHOLDER
      childAge: "5–10 yrs", // PLACEHOLDER
      addons: [ // PLACEHOLDER prices
        { id: "bonfire", name: "Evening bonfire", price: 500, unit: "stay" },
        { id: "decor", name: "Room decoration", price: 1500, unit: "stay" },
        { id: "bbq", name: "BBQ dinner", price: 400, unit: "person" },
        { id: "sightseeing", name: "Ajodhya Hills sightseeing car", price: 3000, unit: "stay" },
        { id: "pickup", name: "Purulia station pickup & drop", price: 2500, unit: "stay" },
      ],
      gst: 5, // PLACEHOLDER
      advance: 50, // PLACEHOLDER
      validDays: 3, // PLACEHOLDER
      upi: { id: "paytmqr5fsm78@ptys", payee: "Chamtaburu Eco Resort" }, // PLACEHOLDER — see the Village note above
      bank: null,
      inclusions: ["Accommodation as listed", "Daily breakfast", "Meals as per the selected plan", "Free parking"],
      exclusions: ["Personal expenses", "Anything not mentioned in inclusions"],
    },
  },
};
