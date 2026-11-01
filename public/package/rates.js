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
// What every Village cottage has; listed on the guest's page and in the message.
const COTTAGE_FEATURES = ["Private lawn with garden", "Stunning hill view", "Dedicated swing"];

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

  // The package menu, shown on the guest's page for package plans (all meals
  // included). Read live, so a change reaches packages already sent.
  menu: {
    meals: [
      { name: "Bed tea & biscuits", time: "7:00 – 8:00 AM only", items: [] },
      { name: "Breakfast", time: "8:30 – 10:30 AM", items: [
        "Luchi, aalur dum, boiled egg (1 pc), jalebi (1 pc) and tea",
        "or aloo / gobi / sattu paratha or chole bhature, boiled egg (1 pc), jalebi (1 pc) and tea",
      ] },
      { name: "Lunch", time: "1:00 – 3:00 PM", items: [
        "Veg thali: rice, dal, vaja, sabji, salad, doi, papad, paneer butter masala / kadai paneer, chutney",
        "Non-veg: rice, dal, vaja, sabji, salad, doi, papad, fish curry, chutney",
      ] },
      { name: "Evening snacks", time: "5:00 – 7:30 PM", items: ["Chicken pakoda / onion pakoda (5 pc) and tea / coffee"] },
      { name: "Dinner", time: "9:00 – 11:00 PM", items: [
        "Veg: rice / roti, paneer butter masala / kadai paneer, mix veg / dal fry, mishti",
        "Non-veg: rice / roti, mix veg / dal fry, chicken kosha, mishti",
      ] },
    ],
    note: "The menu will be modified if you stay more than two nights.",
  },

  // Add-ons offered at both properties, listed before each property's own.
  // No GST on add-ons (only the stay is taxed). unit "car": `price` by car
  // size, and the package's car choice (5- or 9-seater) picks one; quantity =
  // cars. unit "kg": `price` by kg up to the largest listed, then `perKg` more
  // for each kg above it.
  addons: [
    { id: "pickup-purulia", group: "Car hire", name: "Pickup from Purulia", unit: "car", price: { 5: 1700, 9: 2100 } },
    { id: "pickup-barabhum", group: "Car hire", name: "Pickup from Barabhum", unit: "car", price: { 5: 900, 9: 1100 } },
    { id: "day1", group: "Car hire", name: "Day 1 · Purulia local sightseeing", unit: "car", price: { 5: 2000, 9: 2400 },
      desc: "Pakhi Pahar, Matha Forest, Pardi Lake, Gorgaburu, Charida mask village, Khairabera Dam" },
    { id: "day2", group: "Car hire", name: "Day 2 · Ayodhya Hill tour", unit: "car", price: { 5: 2500, 9: 2800 },
      desc: "Ayodhya Hill, Bamni Falls, Upper & Lower Dam, Marble Lake, Turga Dam & Falls, Mayur Pahar, Lahoria Shiv Mandir" },
    { id: "day3", group: "Car hire", name: "Day 3 · Baranti tour", unit: "car", price: { 5: 4500, 9: 5000 },
      desc: "Panchakot Hill, Panchet Dam, Joychandi Pahar, Baranti Dam" },
    { id: "drop-purulia", group: "Car hire", name: "Drop to Purulia", unit: "car", price: { 5: 1700, 9: 2100 } },
    { id: "drop-barabhum", group: "Car hire", name: "Drop to Barabhum", unit: "car", price: { 5: 900, 9: 1100 } },
    { id: "bonfire", group: "Bonfire", name: "Bonfire", unit: "kg", price: { 1: 699, 2: 1099, 3: 1399, 4: 1699, 5: 1999 }, perKg: 199 },
  ],

  properties: {
    village: {
      name: "Chamtaburu Eco Village",
      domain: "chamtaburu.in",
      phone: "919242748100",
      // For now, Village packages give the guest two numbers to call, as
      // "Booking Manager 1" (the Resort's) and "Booking Manager 2" (the Village's),
      // in place of the manager's own. Remove to show only the manager's.
      // Read live, so it reaches sent packages too.
      bookingManagers: ["resort", "village"],
      address: "Matha, Matha Forest, Baghmundi, Purulia, West Bengal 723152",
      prefix: "CEV",
      // Per room per night. `tier` picks the Celebration price table; `adults` /
      // `children` are what the normal rate covers (more are charged as extras);
      // `max` is the most adults a room takes, with extra mattresses.
      // PLACEHOLDER — cottage `children`.
      rooms: [
        { id: "shal-shanti", name: "Shal Shanti", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "mahua-ghar", name: "Mahua Ghar", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "palash-kunja", name: "Palash Kunja", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "pahari-chaya", name: "Pahari Chaya", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "jharna-neer", name: "Jharna Neer", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "karam-kunja", name: "Karam Kunja", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "adivasi-aangan", name: "Adivasi Aangan", tier: "cottage", rate: 5000, adults: 2, children: 1, max: 5, features: COTTAGE_FEATURES },
        { id: "floor-t1", name: "First-floor room T1 (108 / 111)", tier: "room", rate: 2500, adults: 3, children: 1, max: 3 },
        { id: "floor-t2", name: "First-floor room T2 (109 / 110)", tier: "room", rate: 2000, adults: 2, children: 1, max: 2 },
      ],
      // Package plans: a price per adult per night with all meals included, by
      // how many adults share the room (a table per room `tier`). Fewer adults
      // than the smallest size listed pay as that size; children pay half.
      // `nonac` / `ac` are the two package plans. Not set = the manager types
      // the rate per adult; a missing `ac` falls back to `nonac` with a warning.
      // PLACEHOLDER — normal-season package rates aren't set yet.
      packages: { nonac: null, ac: null },
      // Nights from `from` to `to` (inclusive). `packages` replaces the
      // property's package rates on those nights. A season can also change the
      // Room only rate with `rates[roomId]` or an `uplift` (0.25 = +25%).
      // PLACEHOLDER — no AC package rates for the Celebration Package yet.
      seasons: [{
        name: "Celebration Package", from: "2026-12-20", to: "2027-01-01",
        packages: { nonac: { cottage: { 2: 3900, 3: 2500, 4: 2000, 5: 1700 }, room: { 2: 2000, 3: 1800 } } },
      }],
      // Room only plan, per night: each adult / child above what the room's rate
      // covers, and each extra bed. PLACEHOLDER.
      extras: { adult: 600, child: 300, bed: 500 },
      // Children this age pay; younger stay free.
      checkIn: "12:00 PM",
      checkOut: "10:00 AM",
      childAge: "5–10 yrs",
      // unit: "stay" = once, "person" = per person, "night" = per night. PLACEHOLDER prices.
      addons: [
        { id: "trail", group: "Extras", name: "Guided nature trail", price: 200, unit: "person" },
        { id: "decor", group: "Extras", name: "Room decoration", price: 1500, unit: "stay" },
        { id: "bbq", group: "Extras", name: "BBQ dinner", price: 400, unit: "person" },
      ],
      gst: 5, // PLACEHOLDER — confirm with your accountant
      advance: 50, // % to confirm the booking. PLACEHOLDER
      validDays: 3, // PLACEHOLDER
      // PLACEHOLDER — deliberately empty rather than a made-up ID, so no guest
      // can ever pay into the wrong account. Fill in e.g.
      // upi: { id: "name@bank", payee: "Chamtaburu Eco Village", qr: "/package/village-upi-qr.png" },
      // (`qr` optional: a scannable image of the property's UPI QR.)
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
        { id: "bamboo-cottage", name: "Bamboo Cottage", tier: "bamboo", rate: 2000, adults: 2, children: 1, max: 2 },
        { id: "double-bedded", name: "Double Bedded", tier: "room", rate: 1600, adults: 2, children: 1, max: 2 },
        { id: "triple-bedded", name: "Triple Bedded", tier: "room", rate: 1800, ac: 2200, adults: 3, children: 1, max: 3 },
        { id: "four-bedded", name: "Four Bedded", tier: "room", rate: 2100, ac: 2500, adults: 4, children: 0, max: 4 },
        { id: "six-bedded", name: "Six Bedded", tier: "room", rate: 2700, ac: 3300, adults: 6, children: 1, max: 6 },
      ],
      // Same rules as the Village packages and seasons above.
      packages: { nonac: null, ac: null }, // PLACEHOLDER
      seasons: [{
        name: "Celebration Package", from: "2026-12-20", to: "2027-01-01",
        packages: { nonac: { room: { 2: 1900, 3: 1900, 4: 1700, 5: 1700, 6: 1700 }, bamboo: { 2: 2000 } } },
      }],
      extras: { adult: 500, child: 250, bed: 400 }, // PLACEHOLDER
      checkIn: "11:00 AM",
      checkOut: "9:00 AM",
      childAge: "5–10 yrs",
      addons: [ // PLACEHOLDER prices
        { id: "decor", group: "Extras", name: "Room decoration", price: 1500, unit: "stay" },
        { id: "bbq", group: "Extras", name: "BBQ dinner", price: 400, unit: "person" },
      ],
      gst: 5, // PLACEHOLDER
      advance: 50, // PLACEHOLDER
      validDays: 3, // PLACEHOLDER
      // The resort's Paytm QR, cropped to the code (no phone number on it).
      upi: { id: "paytmqr5fsm78@ptys", payee: "Chamtaburu Eco Resort", qr: "/package/resort-upi-qr.png" },
      bank: null,
      inclusions: ["Accommodation as listed", "Daily breakfast", "Meals as per the selected plan", "Free parking"],
      exclusions: ["Personal expenses", "Anything not mentioned in inclusions"],
    },
  },
};
