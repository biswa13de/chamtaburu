# Chamtaburu Eco Village - Package details

## default package rate:

## 20-DEC 2026 to 1st-Jan 2027 - New Celebration Package

All packages are Non-AC Type
Pax - 2 |

# Chamtaburu Eco Resort - Package details

---

# Package Generator — spec (living, updated as decisions land)

_Last updated: 2026-10-26_

## Goal

A manager opens a page, unlocks it with a PIN, builds a package for a guest
(property, rooms, dates, pax, meal plan, add-ons, price), and shares it to the
guest on WhatsApp in one tap.

## Known constraints (from the existing repo)

- Site is static on Firebase Hosting — **no backend, no database** ([02-architecture.md](02-architecture.md) §4 cost rules).
- Two builds: Village (`chamtaburu.in`, WhatsApp 9242748100) and Resort
  (`resort.chamtaburu.in`, WhatsApp 8918550242).
- Precedent: `/menu` is a standalone page in `public/menu/` that picks
  Village/Resort data by hostname — the generator can follow the same pattern.
- Rates already in code: Resort room types in `src/content/resort.ts`
  (₹1,600–₹2,700, breakfast included, before GST). Village cottage prices are still `TBD`.

## Decisions

| #   | Topic               | Decision                                                                                                                                                                            | Date       |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | PIN security        | Browser-checked PIN (hashed, no backend). Keeps guests out; not hardened against a technical attacker — acceptable since the page holds no secret data.                             | 2026-10-26 |
| 2   | What guest receives | WhatsApp text summary **+ link** to a styled package page. Package details encoded in the link, so no database needed.                                                              | 2026-10-26 |
| 3   | Pricing             | Auto-calculated from a rate card, with manual override / discount by the manager.                                                                                                   | 2026-10-26 |
| 4   | Property            | Both. Manager picks **Village / Resort from a dropdown** in one generator; rooms, rates, branding and WhatsApp number switch with it. Dropdown defaults to the site it's opened on. | 2026-10-26 |
| 5   | Sending             | Manager enters the **guest's phone number**; tap opens WhatsApp (`wa.me/<guest>`) straight to that chat with the message pre-filled.                                                | 2026-10-26 |
| 6   | Package contents    | Rooms × nights, **meal plan**, **add-ons**, **extra bed / child charges**, free-text **inclusions / exclusions / notes**.                                                           | 2026-10-26 |
| 7   | Terms on package    | **GST line**, **advance amount** to confirm, **UPI / bank details**, **validity date**.                                                                                             | 2026-10-26 |
| 8   | Managers            | **PIN per manager**; that manager's name + number shown on the package as the contact person. PINs stored only as hashes in code.                                                   | 2026-10-26 |

## Build status — v1 built with placeholder prices (2026-10-26)

| Piece                                                    | What it is                                                                       |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/package` → `public/package/index.html`, `generator.js` | Manager page: PIN lock, form, live price, Copy / Preview / Send on WhatsApp      |
| `/package/view` → `view.html`, `view.js`                 | Guest page the WhatsApp link opens: breakdown, inclusions, pay + confirm buttons |
| `public/package/rates.js`                                | **The one file to edit** — managers, rates, meals, add-ons, GST, advance, UPI    |
| `public/package/package-core.js`                         | Shared price maths + link encoding                                               |
| `npm run package-pin -- <PIN>`                           | Prints the hash to paste into a manager's `pin`                                  |

Also: `/package` is `Disallow`ed in `robots.txt` and both pages are `noindex`.

**Managers (2026-10-26):** Nirmal, Khushi, Shyam (both properties, contact number 92427 48100). The demo login (PIN `1234`) is kept on purpose.

### How it works

1. Open `/package` → enter PIN → manager identified (stays unlocked until the tab closes or **Lock**).
2. Pick **Property** (dropdown; only properties that manager is allowed) → rooms, meals, add-ons, GST, advance, inclusions reset for that property.
3. Guest name, guest WhatsApp number, check-in / check-out (nights auto), adults, children.
4. Rooms (type × qty, AC toggle where the room has an AC rate), meal plan, extra adult / child / bed, add-ons.
5. Live breakdown. Nights inside a season (e.g. Celebration 20 Dec – 1 Jan) are priced on their own line. Capacity warnings if guests exceed the rooms.
6. Discount (₹ or %) **or** a special final price incl. GST; advance %; valid-until date; inclusions / exclusions / note.
7. **Send on WhatsApp** → opens `wa.me/<guest>` with the message + link. The work-in-progress survives a page reload.
8. Guest page: totals, advance, UPI "Pay" button + copy (once a UPI ID is set), **Confirm on WhatsApp** / Ask / Call the manager, **Save as PDF**.

### Known limits (by design, no backend)

- The quote lives inside the link. A technical guest could edit the link and change the numbers shown _on their own screen_. The WhatsApp message the manager sent stays the record. The guest page only ever shows UPI details and contact numbers from `rates.js`, so a doctored link can't redirect payment.
- PIN is checked in the browser (decision 1).
- Links are ~1,000 characters; WhatsApp handles that fine.

### Placeholders currently in `rates.js` (replace with real values)

- Village cottage rates: ₹2,200 each, 2 adults + 1 child.
- Celebration season, both properties: normal rate **+25%**, 20 Dec 2026 – 1 Jan 2027.
- Meal plans: Room only / Veg ₹550 / Non-veg ₹650 per adult per night (prices from `/menu`), children half.
- Extras: Village adult ₹600 · child ₹300 · bed ₹500; Resort ₹500 · ₹250 · ₹400.
- Add-ons: bonfire ₹500, nature trail ₹200 pp, decoration ₹1,500, BBQ ₹400 pp, sightseeing car ₹3,000, station pickup ₹2,500.
- GST 5% · advance 50% · valid 3 days.
- **UPI / bank: deliberately empty.** The guest page says the manager will share payment details. A made-up UPI ID could send real money to a stranger.

## Data needed (please fill in)

**Rates per night (before GST)** — Resort is already in code; Village cottages are `TBD`.

| Property | Room / cottage                                                                                               | Normal rate | 20 Dec – 1 Jan rate | Max pax |
| -------- | ------------------------------------------------------------------------------------------------------------ | ----------- | ------------------- | ------- |
| Village  | Shal Shanti / Mahua Ghar / Palash Kunja / Pahari Chaya / Jharna Neer / Karam Kunja / Adivasi Aangan          | ?           | ?                   | ?       |
| Resort   | Bamboo ₹2,000 · Double ₹1,600 · Triple ₹1,800 (AC ₹2,200) · Four ₹2,100 (AC ₹2,500) · Six ₹2,700 (AC ₹3,300) | ✔           | ?                   | ✔       |

**Meal plans** (per person per day): Breakfast only = included? · Breakfast + Dinner = ? · All meals = ? (currently the `/menu` veg ₹550 / non-veg ₹650 day packages)

**Add-ons** (name → price): Bonfire = ? · Nature trail = ? · Decoration = ? · BBQ = ? · Pickup/drop = ? · …

**Extra charges**: extra adult = ? · child (age ?–?) = ? · extra bed = ?

**Terms**: GST % = ? · Advance % = ? · Default validity = ? days

**Payment per property**: Village UPI ID / bank = ? · Resort UPI ID / bank = ?

**Managers**: name · WhatsApp number · property (or both). PINs are shared privately, not written here.

## Open questions

9. **Celebration Package (20 Dec – 1 Jan)**: is it just a seasonal room rate, or a fixed
   bundle (e.g. per-couple price incl. meals, gala dinner, bonfire)? Minimum nights?
   _Built for now as a seasonal rate (placeholder +25%). A fixed bundle would need templates (Q10)._
10. Should the generator offer **ready-made package templates** (e.g. "Celebration Package
    – 2 pax – 2N") that pre-fill everything, which the manager then tweaks?
