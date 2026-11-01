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

| #   | Topic               | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Date       |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Sign-in             | **Phone OTP** (Firebase phone auth): manager enters their mobile number, gets a 6-digit SMS code. _2026-11-01:_ or **number + password** for managers given one (no SMS). Firestore rules only accept quotes from signed-in manager numbers. _Revised 2026-10-31:_ replaced the browser-checked PIN, which kept guests out but let anyone create quotes.                                                                                                             | 2026-10-31 |
| 2   | What guest receives | Short WhatsApp message **+ short link** (`chamtaburu.in/p/R6X6K2`) to a styled package page. _Revised 2026-10-26:_ the first version packed the quote into the link (~700 chars), which looked like spam to guests, so quotes are now saved in Firestore under a 6-character code.                                                                                                                                                                                   | 2026-10-26 |
| 3   | Pricing             | Auto-calculated from a rate card, with manual override / discount by the manager.                                                                                                                                                                                                                                                                                                                                                                                    | 2026-10-26 |
| 4   | Property            | Both. Manager picks **Village / Resort from a dropdown** in one generator; rooms, rates, branding and WhatsApp number switch with it. Dropdown defaults to the site it's opened on.                                                                                                                                                                                                                                                                                  | 2026-10-26 |
| 5   | Sending             | Manager enters the **guest's phone number**; tap opens WhatsApp (`wa.me/<guest>`) straight to that chat with the message pre-filled.                                                                                                                                                                                                                                                                                                                                 | 2026-10-26 |
| 6   | Package contents    | Rooms × nights, **meal plan**, **add-ons**, **extra bed / child charges**, free-text **inclusions / exclusions / notes**.                                                                                                                                                                                                                                                                                                                                            | 2026-10-26 |
| 7   | Terms on package    | **GST line**, **advance amount** to confirm, **UPI / bank details**, **validity date**.                                                                                                                                                                                                                                                                                                                                                                              | 2026-10-26 |
| 8   | Managers            | Each manager signs in with **their own mobile number**. Managers live in **Firestore** (`managers` collection), not in the repo, so their numbers never reach git or a public file. Their name + an approved contact number are shown on the package.                                                                                                                                                                                                                | 2026-10-31 |
| 9   | Quote storage       | **Firestore**, project `chamtaburu-webapp`. Exception to the "no database" rule in 02-architecture.md, accepted for short links + quote history. Firestore ₹0 at this volume; phone sign-in needs the Blaze plan and each SMS is billed.                                                                                                                                                                                                                             | 2026-10-26 |
| 10  | Meal plans          | **Room only** (room rate; extra guests / beds charged as extras), **Package (AC)**, **Package (Non-AC)**: a price **per adult per night with all four meals**, by how many adults share the room; children 5–10 half, under 5 free, a lone adult pays for 2. Packages are offered all year; the manager can type the rate per adult for any room. 20 Dec – 1 Jan uses the Celebration Package rates (Non-AC).                                                        | 2026-10-31 |
| 11  | Rooms & guests      | Each room row has its own **adults / children per room**; guests are totalled from the rows. Guests above what a room's normal rate covers are charged as extras automatically on normal nights.                                                                                                                                                                                                                                                                     | 2026-10-31 |
| 12  | Add-ons             | **Car hire** (pickup / drop Purulia or Barabhum, Day 1–3 tours; 5- or 9-seater) and **bonfire by kg**, at both properties. **No GST on add-ons**, only on the stay. Each add-on's price can be typed over in its row.                                                                                                                                                                                                                                                | 2026-10-31 |
| 13  | Editing & tracking  | Any line's price can be typed over (guest sees "special price"). Every quote records **who made it** and a **status** (Sent / Confirmed / Cancelled) that any manager can change; all managers see all packages. _Revised 2026-11-01:_ **Edit** reopens a sent package in the form; saving updates the same link (who edited is recorded). The form behind each quote is kept in `quoteForms`, readable only by managers. Packages made before this can't be edited. | 2026-10-31 |
| 14  | GST & navigation    | **GST on these prices** dropdown, Exclusive (default) / Inclusive: with Inclusive, GST is shown as included instead of added. After Send / Copy, a bar offers **Start a new package**; Preview shows **Back to Package Generator**.                                                                                                                                                                                                                                  | 2026-10-31 |
| 15  | Check-in / out      | **Village** check-in 12:00 PM, check-out 10:00 AM. **Resort** check-in 11:00 AM, check-out 9:00 AM. Shown in the WhatsApp message and on the guest page (read from `rates.js`, so a change reaches sent quotes).                                                                                                                                                                                                                                                     | 2026-10-31 |
| 16  | Cottage features    | All 7 Village cottages: **private lawn with garden, stunning hill view, dedicated swing** (`features` in `rates.js`). Listed under "Your cottage" on the guest page and in the WhatsApp message; also shown as the cottages' amenities on chamtaburu.in.                                                                                                                                                                                                             | 2026-10-31 |

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
- `phone` (string, optional): contact number shown to the guest, e.g. `919242748100`. It must be a property's number or listed in `contacts` in `rates.js`, otherwise the property's number is shown. Leave it out to use the property's. _2026-11-01:_ for now, Village packages show **Call Booking Manager 1** (the Resort's number) and **Call Booking Manager 2** (the Village's) in place of the manager's Call button, and both numbers in the WhatsApp message (`bookingManagers: ["resort", "village"]` on the Village in `rates.js`).
- `props` (array, optional): `village`, `resort` or both. Leave it out for both.
- `uid` (string, only for password sign-in): the UID of the manager's password account (below).

Adding or removing a manager takes effect straight away: no code change, no deploy. Anyone can check whether one exact number is a manager (the page does this before sending an SMS), but nobody can list them.

### Password sign-in (instead of SMS, per manager)

For managers whose SMS codes don't arrive or get rate-limited. They type their mobile number and a password; no SMS, no robot check.

1. One-time: Authentication → Sign-in method → **Add new provider → Email/Password** → enable (leave "Email link" off).
2. Authentication → Users → **Add user**: email = the number without `+` at `managers.chamtaburu.in`, e.g. `919876543210@managers.chamtaburu.in`, and a password (at least 6 characters; longer is better). Nothing is ever emailed to it.
3. Copy that user's **User UID** from the list into the manager's Firestore document as `uid` (string).
4. Give the manager the password. They can still use SMS too.

To change a password: delete the user, add it again with the new password, and update `uid`. To stop someone: delete the user (or the manager document). If Authentication → Settings → **User actions** is offered, untick "Enable create (sign-up)". The rules already ignore accounts that don't match `uid`, so this is extra safety.

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
3. Guest name, guest WhatsApp number, check-in / check-out (nights auto).
4. Meal plan (Room only / Package AC / Package Non-AC). Rooms: type × number of rooms × **adults and children (5–10) per room**, plus **₹ per adult** for packages (blank = rate card, shown greyed) or an AC toggle for Room only. Then extra beds (Room only), car size and add-ons (car hire, bonfire by kg, extras).
5. Live breakdown. Nights inside a season (Celebration Package, 20 Dec – 1 Jan) are priced on their own line, per adult. **Every line's price can be typed over**; clear it to go back to the rate card. Warnings if a room has more adults than it takes.
6. Discount (₹ or %) **or** a special final price incl. GST; advance %; valid-until date; inclusions / exclusions / note.
7. **Send on WhatsApp** → saves the quote (code like `R6X6K2`, Ref `CER-R6X6K2`) and opens `wa.me/<guest>` with a short message + link. Send / Copy / Preview reuse one code; any edit afterwards makes a new one. The work-in-progress survives a page reload.
   **Packages** at the bottom lists the latest 60 quotes from all managers (or only yours): Ref, guest, date, total, who made it, and a **status** dropdown (Sent / Confirmed / Cancelled) showing who last changed it.
8. Guest page: totals, advance, UPI "Pay" button + copy and a scannable UPI QR (where set), **Confirm on WhatsApp** / Ask / Call the manager, **Save as PDF**.

### Known limits (by design)

- Only signed-in managers can change a quote (its status, or its contents with Edit, recording who), and nobody can delete one. Only signed-in managers can list quotes; anyone else needs the code. Codes are 6 characters from 31 (887 million combinations), so guessing one is impractical.
- Only signed-in manager numbers can create quotes. The guest page only shows UPI details and contact numbers from `rates.js`, so even a bad quote can't redirect payment.
- Old long `#q=` links sent before v2 still open.
- Scripts in `public/package` and `public/menu` are served `no-cache`, so an edit to `rates.js` reaches every phone on its next visit. (Before 2026-10-26 they were cached for a year; the `?v=2` on the script tags got phones holding those old copies onto the new files.)
- The Packages list shows the latest 60. Any older quote still opens at `/p/<code>` from its Ref.

### Celebration Package rates (20 Dec 2026 – 1 Jan 2027, Package (Non-AC), per adult per night, all meals)

| Property | Room                          | 2 adults | 3      | 4      | 5      | 6      |
| -------- | ----------------------------- | -------- | ------ | ------ | ------ | ------ |
| Village  | Cottage (7), mattress for 4–5 | ₹3,900   | ₹2,500 | ₹2,000 | ₹1,700 |        |
| Village  | First-floor room (T1 / T2)    | ₹2,000   | ₹1,800 |        |        |        |
| Resort   | Double / Triple / Four / Six  | ₹1,900   | ₹1,900 | ₹1,700 | ₹1,700 | ₹1,700 |
| Resort   | Bamboo Cottage                | ₹2,000   |        |        |        |        |

Children 5–10 pay half the adult price for their room; under 5 free. One adult alone pays for two. The night of 1 Jan is a Celebration night. The guest's page shows the package menu (`menu` in `rates.js`) for packages with Celebration nights.

**Special Cultural Programme (20 – 31 Dec 2026, both properties):** Chhau and Santhali dance every evening. A stay with any night from 20 to 31 Dec gets it in Inclusions by default (the manager can delete the line), a 🎭 line in the WhatsApp message and a card on the guest's page. Set in `events` in `rates.js`.

### Placeholders currently in `rates.js` (replace with real values)

- Cottage child capacity at the normal rate (1 assumed).
- **Package rates outside 20 Dec – 1 Jan, and all AC package rates**: not set. Managers type the rate per adult; Package (AC) without a rate shows the Non-AC one with a warning.
- Extras on normal nights: Village adult ₹600 · child ₹300 · bed ₹500; Resort ₹500 · ₹250 · ₹400.
- Extras add-ons: nature trail ₹200 pp, decoration ₹1,500, BBQ ₹400 pp.
- GST 5% · advance 50% · valid 3 days.
- **Payment:** Village has bank details, no UPI yet. Resort has its Paytm UPI ID and QR (`public/package/resort-upi-qr.png`, cropped from the standee so its phone number isn't published). Never fill in a made-up UPI ID: it could send real money to a stranger.

## Data needed (please fill in)

**Normal rates per room per night (before GST)** — confirmed.

| Property | Room / cottage                                                                                                  | Normal rate | Max adults |
| -------- | --------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| Village  | 7 cottages: Shal Shanti / Mahua Ghar / Palash Kunja / Pahari Chaya / Jharna Neer / Karam Kunja / Adivasi Aangan | ₹5,000      | 5          |
| Village  | First-floor T1 (rooms 108, 111)                                                                                 | ₹2,500      | 3          |
| Village  | First-floor T2 (rooms 109, 110)                                                                                 | ₹2,000      | 2          |
| Resort   | Bamboo ₹2,000 · Double ₹1,600 · Triple ₹1,800 (AC ₹2,200) · Four ₹2,100 (AC ₹2,500) · Six ₹2,700 (AC ₹3,300)    | ✔           | ✔          |

**Package rates** (per adult per night, all meals, by adults per room): normal season Non-AC = ? · AC = ? · Celebration AC = ?

**Add-ons** (name → price): car hire and bonfire ✔ · Nature trail = ? · Decoration = ? · BBQ = ? · …

**Extra charges**: extra adult = ? · child (age ?–?) = ? · extra bed = ?

**Terms**: GST % = ? · Advance % = ? · Default validity = ? days

**Payment per property**: Village UPI ID + QR = ? · Resort bank = ?

**Managers**: name · sign-in mobile number · contact WhatsApp number · property (or both). Share sign-in numbers privately and enter them in Firestore — not here, this file is in git.

## Open questions

9. ~~Celebration Package~~ — answered 2026-10-31: per-adult pricing with all meals (decision 10).
10. Should the generator offer **ready-made package templates** (e.g. "Celebration Package
    – 2 pax – 2N") that pre-fill everything, which the manager then tweaks?
