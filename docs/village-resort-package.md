# Chamtaburu Eco Village - Package details

## default package rate:

## 20-DEC 2026 to 1st-Jan 2027 - New Celebration Package

All packages are Non-AC Type
Pax - 2 |

# Chamtaburu Eco Resort - Package details

---

# Package Generator — spec (living, updated as decisions land)

_Last updated: 2026-10-31_

## Goal

A manager opens a page, signs in with an SMS code, builds a package for a guest
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

| #   | Topic               | Decision                                                                                                                                                                                                                                                                           | Date       |
| --- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Sign-in             | **Phone OTP** (Firebase phone auth): manager enters their mobile number, gets a 6-digit SMS code. Firestore rules only accept quotes from signed-in manager numbers. _Revised 2026-10-31:_ replaced the browser-checked PIN, which kept guests out but let anyone create quotes.   | 2026-10-31 |
| 2   | What guest receives | Short WhatsApp message **+ short link** (`chamtaburu.in/p/R6X6K2`) to a styled package page. _Revised 2026-10-26:_ the first version packed the quote into the link (~700 chars), which looked like spam to guests, so quotes are now saved in Firestore under a 6-character code. | 2026-10-26 |
| 3   | Pricing             | Auto-calculated from a rate card, with manual override / discount by the manager.                                                                                                                                                                                                  | 2026-10-26 |
| 4   | Property            | Both. Manager picks **Village / Resort from a dropdown** in one generator; rooms, rates, branding and WhatsApp number switch with it. Dropdown defaults to the site it's opened on.                                                                                                | 2026-10-26 |
| 5   | Sending             | Manager enters the **guest's phone number**; tap opens WhatsApp (`wa.me/<guest>`) straight to that chat with the message pre-filled.                                                                                                                                               | 2026-10-26 |
| 6   | Package contents    | Rooms × nights, **meal plan**, **add-ons**, **extra bed / child charges**, free-text **inclusions / exclusions / notes**.                                                                                                                                                          | 2026-10-26 |
| 7   | Terms on package    | **GST line**, **advance amount** to confirm, **UPI / bank details**, **validity date**.                                                                                                                                                                                            | 2026-10-26 |
| 8   | Managers            | Each manager signs in with **their own mobile number**. Managers live in **Firestore** (`managers` collection), not in the repo, so their numbers never reach git or a public file. Their name + an approved contact number are shown on the package.                              | 2026-10-31 |
| 9   | Quote storage       | **Firestore**, project `chamtaburu-webapp`. Exception to the "no database" rule in 02-architecture.md, accepted for short links + quote history. Firestore ₹0 at this volume; phone sign-in needs the Blaze plan and each SMS is billed.                                           | 2026-10-26 |

## Build status — v2: short links (2026-10-26)

| Piece                                                    | What it is                                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `/package` → `public/package/index.html`, `generator.js` | Manager page: SMS sign-in, form, live price, Copy / Preview / Send on WhatsApp                           |
| `public/package/auth.js`                                 | Firebase phone sign-in (SDK from gstatic, invisible reCAPTCHA)                                           |
| `/p/<code>` → `view.html`, `view.js`                     | Guest page the WhatsApp link opens: breakdown, inclusions, pay + confirm buttons                         |
| `public/package/rates.js`                                | **The one file to edit** for prices — rates, meals, add-ons, GST, advance, UPI, approved contact numbers |
| Firestore `managers` collection                          | Who may sign in (Firebase console, not in the repo)                                                      |
| `public/package/package-core.js`                         | Shared price maths + saving / loading quotes                                                             |
| `firestore.rules`                                        | Who may do what with saved quotes (read one by code; managers create; no more)                           |

Also: `/package` and `/p/` are `Disallow`ed in `robots.txt` and both pages are `noindex`. The guest page has a WhatsApp preview card (property photo + "Your stay package").

**Managers (2026-10-31):** Demo Manager, Nirmal, Khushi, Shyam (both properties, contact number 92427 48100). They are added in Firestore, not in the repo. The demo login is kept on purpose, as a Firebase test number (fixed code, no SMS).

### Managers

Managers are **not** in the repo, so their phone numbers never reach git or any public file. Each is one document in the Firestore `managers` collection (Firebase console → Firestore Database):

- **Document ID**: the sign-in number with `+91`, e.g. `+919876543210` (no spaces).
- `name` (string): shown on the package as the contact person.
- `phone` (string, optional): contact number shown to the guest, e.g. `919242748100`. It must be a property's number or listed in `contacts` in `rates.js`, otherwise the property's number is shown. Leave it out to use the property's.
- `props` (array, optional): `village`, `resort` or both. Leave it out for both.

Adding or removing a manager takes effect straight away: no code change, no deploy. Anyone can check whether one exact number is a manager (the page does this before sending an SMS), but nobody can list them.

### Phone sign-in setup (one-time, Firebase console, project `chamtaburu-webapp`)

1. Upgrade to the **Blaze** plan (phone sign-in sends real SMS, billed per message).
2. Authentication → Sign-in method → enable **Phone**. Under Settings → SMS region policy, allow **India**.
3. Authentication → Settings → **Authorized domains**: add `chamtaburu.in` and `resort.chamtaburu.in`.
4. Project settings → General → add a **Web app** if there isn't one, copy its `apiKey` into `public/package/auth.js`.
5. Phone → **Phone numbers for testing**: add the Demo Manager's number with a fixed code.
6. Firestore → create the `managers` documents (above), including the demo number.
7. Deploy hosting (merge to main), then `firebase deploy --only firestore:rules`. Rules last: until they're deployed, the old rules still accept quotes, so nothing breaks in between.

### How it works

1. Open `/package` → enter mobile number → enter the SMS code → manager identified. Stays signed in on that phone until **Sign out**, so the SMS is only needed once per device.
2. Pick **Property** (dropdown; only properties that manager is allowed) → rooms, meals, add-ons, GST, advance, inclusions reset for that property.
3. Guest name, guest WhatsApp number, check-in / check-out (nights auto), adults, children.
4. Rooms (type × qty, AC toggle where the room has an AC rate), meal plan, extra adult / child / bed, add-ons.
5. Live breakdown. Nights inside a season (e.g. Celebration 20 Dec – 1 Jan) are priced on their own line. Capacity warnings if guests exceed the rooms.
6. Discount (₹ or %) **or** a special final price incl. GST; advance %; valid-until date; inclusions / exclusions / note.
7. **Send on WhatsApp** → saves the quote (code like `R6X6K2`, Ref `CER-R6X6K2`) and opens `wa.me/<guest>` with a short message + link. Send / Copy / Preview reuse one code; any edit afterwards makes a new one. The work-in-progress survives a page reload.
   **Recent packages** at the bottom lists the last 30 quotes made on that phone, with Copy link.
8. Guest page: totals, advance, UPI "Pay" button + copy (once a UPI ID is set), **Confirm on WhatsApp** / Ask / Call the manager, **Save as PDF**.

### Known limits (by design)

- A saved quote can never be edited or deleted, so a link always shows what was sent. Nobody can list quotes; you need the code. Codes are 6 characters from 31 (887 million combinations), so guessing one is impractical.
- Only signed-in manager numbers can create quotes. The guest page only shows UPI details and contact numbers from `rates.js`, so even a bad quote can't redirect payment.
- Old long `#q=` links sent before v2 still open.
- Scripts in `public/package` and `public/menu` are served `no-cache`, so an edit to `rates.js` reaches every phone on its next visit. (Before 2026-10-26 they were cached for a year; the `?v=2` on the script tags got phones holding those old copies onto the new files.)
- "Recent packages" is per phone. Staff can always open any quote at `/p/<code>` from its Ref.

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

**Managers**: name · sign-in mobile number · contact WhatsApp number · property (or both). Share sign-in numbers privately and enter them in Firestore — not here, this file is in git.

## Open questions

9. **Celebration Package (20 Dec – 1 Jan)**: is it just a seasonal room rate, or a fixed
   bundle (e.g. per-couple price incl. meals, gala dinner, bonfire)? Minimum nights?
   _Built for now as a seasonal rate (placeholder +25%). A fixed bundle would need templates (Q10)._
10. Should the generator offer **ready-made package templates** (e.g. "Celebration Package
    – 2 pax – 2N") that pre-fill everything, which the manager then tweaks?
