# Content Guide

**For anyone updating prices, photos, or text on the Chamtaburu website — no coding
experience needed.**

This site is built from plain data files. You don't need to install anything or run any
commands on your computer to make most changes — you can do it from a phone or any
computer with a web browser, directly on GitHub.

---

## How updates work (read this first)

1. You edit a file on GitHub, in your browser.
2. You click "Commit changes."
3. A robot (GitHub Actions) automatically rebuilds the whole website and publishes it.
4. About 2 minutes later, your change is live on the real site.

You never touch a server. You never need to "upload" anything by FTP. If you make a
typing mistake that breaks the file's structure, the robot will refuse to publish and
the live site stays exactly as it was — so you can't accidentally break the site by
editing text.

---

## Before you start: finding the right file

There are two content files, one per property:

| Property | File |
|---|---|
| Chamtaburu Eco Village (chamtaburu.in) | `src/content/village.ts` |
| Chamtaburu Eco Resort (resort.chamtaburu.in) | `src/content/resort.ts` |

To open one on GitHub:

1. Go to the repository on github.com.
2. Click into the `src` folder, then `content`.
3. Click `village.ts` or `resort.ts`.
4. Click the pencil icon (✏️) in the top-right of the file — this opens the editor.

You're now looking at the real content that appears on the live site. It looks a bit
like code, but you only ever need to change the parts described below — text inside
quote marks, and numbers.

---

## Example 1 — Changing a cottage's price

Open `src/content/village.ts`. Search the page (Ctrl+F / Cmd+F) for the cottage's name,
e.g. `Shal Shanti`. You'll see a block like this:

```ts
{
    slug: 'shal-shanti',
    number: '01',
    name: 'Shal Shanti',
    tagline: 'Where the forest whispers peace.',
    theme: 'Forest & Peace',
    ...
    occupancy: { adults: 'TBD' },
    beds: 'TBD',
    price: 'TBD',
    ...
    available: false,
},
```

To set a real price of ₹2,200 per night, change the `price` line **only**:

```diff
-    price: 'TBD',
+    price: 2200,
```

Rules:
- No commas, no ₹ symbol, no quote marks around the number — just `2200`.
- Keep the comma at the end of the line (`2200,`), exactly as `'TBD',` had one.
- If you don't yet have a confirmed price, leave it as `'TBD'` (with the quote marks) —
  the site will automatically show "Price to be announced" instead of a number. Never
  guess a number just to fill the field in.

The same pattern applies to `extraBedPrice` if that cottage has one.

---

## Example 2 — Marking a cottage as available for booking

Every cottage currently has `available: false`, which shows an "Opening soon" badge and
hides it from being bookable. Once a cottage is actually ready for guests, find its
block (same way as above) and change:

```diff
-    available: false,
+    available: true,
```

That's it — no quote marks needed, `true` and `false` are used exactly as written (no
capital letters, no quotes).

---

## Example 3 — Updating contact info (phone, email, address)

Near the top of `village.ts` (or `resort.ts` for the Resort), you'll find the site's
contact block:

```ts
export const village: SiteConfig = {
  key: 'village',
  name: 'Chamtaburu Eco Village',
  ...
  whatsapp: '919242748100',
  phones: ['+91 92427 48100'],
  email: 'info@chamtaburu.in',
  address: {
    street: 'Matha, Matha Forest',
    locality: 'Baghmundi',
    district: 'Purulia',
    region: 'West Bengal',
    postalCode: '723152',
    country: 'IN',
  },
  ...
};
```

**Important — two different phone number formats appear together, and they must match:**

- `whatsapp` is digits only, no spaces, no `+`, starting with the country code: `91` for
  India. Example: a number `98765 43210` becomes `919876543210`.
- `phones` is the human-readable version shown on the Contact page, WITH the `+` and
  spaces: `'+91 98765 43210'`. You can list more than one by adding another entry inside
  the square brackets: `phones: ['+91 92427 48100', '+91 98765 43210']`.

Keep both in sync — `whatsapp` is what the "Chat on WhatsApp" buttons actually dial, so
if you change the number, update both fields, not just one.

To change the email, edit the `email` line the same way — keep the quote marks:

```diff
-  email: 'info@chamtaburu.in',
+  email: 'newaddress@chamtaburu.in',
```

**Do NOT change `gstin`** without checking with whoever handles the company's tax
filings — it's the registered GST number and must stay accurate and consistent with
official documents.

---

## Example 4 — Adding new photos

Photos are not edited as text — you add real image files, then run one command that
processes them.

1. **Get the raw photos onto your computer.** These live in the git-ignored `photos/`
   folder, organized as `photos/eco_village/` and `photos/eco_resort/`. (This step needs
   a computer with the project checked out — not doable from a phone/browser alone.)
2. Add your new `.jpg`/`.png` files into the right folder.
3. Open a terminal in the project folder and run:

   ```
   npm run photos
   ```

   This automatically creates all the resized, web-optimized versions (different sizes,
   AVIF/WebP formats, blurry loading placeholders) and updates
   `public/img/manifest.json` — the index every page uses to find images. You do not
   need to resize or convert anything yourself.
4. Reference the new photo from content by its manifest key. Check the printed output of
   `npm run photos`, or open `public/img/manifest.json` and look for an entry like
   `"village/my-new-photo"` — that string (without the size number) is what you use in
   `village.ts` / `resort.ts`, e.g.:

   ```ts
   {
     base: 'village/my-new-photo',
     alt: 'Description of what is in the photo, mentioning the location',
   }
   ```

   The `alt` text is not optional — it's read aloud by screen readers for visually
   impaired visitors and used by search engines. Describe what's actually in the photo
   (e.g. "Wooden cottage exterior with red tile roof at Chamtaburu Eco Village, Ajodhya
   Hills" — not just "Photo" or "Cottage 3").
5. Commit both the new files under `public/img/` and your content edit together, so the
   site never references a photo that doesn't exist yet.

---

## A few things that will make the build fail (on purpose — this is a safety net)

The site double-checks your edits before publishing. If you:

- Remove a required field entirely (e.g. delete the `name:` line for a cottage)
- Leave a text field without its surrounding quote marks
- Forget a comma between entries
- Reference a photo (`base:`) that doesn't exist in `public/img/manifest.json`

...the automatic rebuild will fail with an error, and the **live site stays unchanged**
— nothing broken ever goes live. If a build fails after your edit, the safest fix is to
revert your change (GitHub shows you the "before" version) and try again more carefully,
or ask for help.

## What NOT to touch without asking a developer

- Any file under `src/components/`, `src/lib/`, or `src/main.tsx` — this is the site's
  code, not its content.
- `slug:` values on cottages (e.g. `'shal-shanti'`) — these are frozen. They're printed
  on physical QR codes at the property; changing one breaks that QR code.
- `src/content/types.ts` and `src/content/validate.ts` — these define what "valid"
  content looks like; changing them changes the safety net itself.

If you're ever unsure whether an edit is safe, it's always fine to ask before
committing.
