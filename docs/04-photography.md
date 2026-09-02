# 04 — Photography Audit & Plan

Photography is the highest-leverage element of a hotel website. Guests decide from
photos before they read a word. This document audits what exists, maps it to pages, and
lists what is missing.

## 1. Inventory — 18 photographs

### `photos/eco_village/` — 10 images

| File | Size | Subject | Verdict |
|---|---|---|---|
| `IMG_7315.jpg` | 3024×4032 **portrait** | Cottage exteriors — white walls, red tile roofs, palms, hazy sky | **Best village exterior.** High-res but portrait; usable as a tall feature image, not a wide hero |
| `PHOTO-…-59 7.jpg` | 1280×960 | Made-up bed, tan leather headboard, white linen, twin bedside tables | **Best room shot.** Clean and inviting |
| `PHOTO-…-59 9.jpg` | 1280×960 | Ajodhya hill, palms, blue sky | **Best destination shot.** Sells the location |
| `PHOTO-…-59 4.jpg` | 1280×960 | Wide room interior — bed, desk area, wood floor | Good, shows scale. Slight clutter |
| `PHOTO-…-59 3.jpg` | 960×1280 portrait | Bathroom — marble tile, rain shower, geyser | Good. Modern bathrooms are a real selling point here |
| `PHOTO-…-59 5.jpg` | 1280×960 | Bathroom — basin, mirror, shower | Usable. Slightly cramped framing |
| `PHOTO-…-59 6.jpg` | 1280×960 | Entrance steps, granite treads, potted plants | Usable detail shot |
| `PHOTO-…-59 8.jpg` | 1280×960 | Window with curtains, trees beyond | Usable atmosphere detail |
| `PHOTO-…-59 2.jpg` | 1280×960 | Desk, chairs, wardrobe, kettle | Weak — plastic chairs, exposed wire, taped surface |
| `PHOTO-…-59.jpg` | 1280×960 | Empty room, door, window | Weak — bare, blue mop bucket visible |

### `photos/eco_resort/` — 8 images

| File | Size | Subject | Verdict |
|---|---|---|---|
| `IMG_7329.jpg` | 4032×3024 | Row of mural-painted cottages, mist, hill behind | **Best resort image.** Atmospheric and distinctive |
| `IMG_7327.jpg` | 4032×3024 | Cottages in monsoon mist, hill, lush green | **Strong.** Good hero candidate |
| `IMG_7331.jpg` | 4032×3024 | Two thatched huts, hedge, hill, tree framing | Good. Bamboo huts are the Resort's signature |
| `IMG_7330.jpg` | 4032×3024 | Thatched huts, hedge, hill | Near-duplicate of 7331 |
| `IMG_7328.jpg` | 4032×3024 | Rain, pathway between cottages | Moody, usable |
| `IMG_7313.jpg` | 4032×3024 | Night — garden, thatched hut, swing set, table | Usable for an "evenings" section |
| `IMG_7312.jpg` | 4032×3024 | Night — garden, hedges, decorative gate, floodlight | Weak — harsh floodlight |
| `IMG_7314.jpg` | 4032×3024 | Night — cottage exterior | **Unusable** — motion blur |

## 2. Honest assessment

**What you have is enough to launch the Eco Village, and thin for the Eco Resort.**

Specific problems, stated plainly so they can be fixed:

1. **Village images are WhatsApp-compressed.** Nine of ten are 1280×960 — the signature
   of images sent through WhatsApp, which strips resolution and adds compression
   artefacts. They are fine for cards and gallery thumbnails but **too small for a
   full-width hero**, which needs ≥2000 px. Please send the originals from the camera or
   phone gallery — via Google Drive, AirDrop, or email as "actual size" — not through
   WhatsApp. The full-resolution versions almost certainly exist.

2. **No daylight Resort photographs in good weather.** All eight are either night shots
   or heavy monsoon. The mist images are genuinely atmospheric and I want to use them —
   but a guest also needs to see the property on a clear day. Right now there is no
   image showing what the Resort looks like in ordinary sunshine.

3. **No Resort interiors at all.** Zero. The site will have to sell resort rooms with
   exterior shots only, which materially reduces conversion. This is the biggest gap.

4. **Visible clutter in several frames** — construction debris, a blue mop bucket, red
   plastic chairs, exposed wiring, plastic sheeting on a desk. The vision doc itself
   says *"avoid too much plastic furniture in the main photographable areas"* (§13). Two
   minutes of tidying before shooting changes these from weak to good.

5. **No people, no food, no activities, no evening ambience as designed.** The vision
   doc describes bonfires, lantern paths, warm 2700K lighting, a tribal art zone, a
   nature trail. None of it is photographed. These are the emotional images that
   actually drive bookings — a room photo says "adequate", a bonfire photo says "I want
   to be there."

6. **No 1200×630 social share card**, which is what appears when the link is sent on
   WhatsApp — likely your highest-volume sharing channel.

None of this blocks a launch. It shapes the reshoot list in §5.

## 3. Image → page mapping (launch)

### Eco Village — `chamtaburu.in`

| Page / slot | Image | Note |
|---|---|---|
| Home hero | `PHOTO-…-59 9.jpg` (hill + palms) | Best wide option available. Only 1280 px — **upgrade with the original** |
| Home — story section | `IMG_7315.jpg` (cottages, portrait) | Portrait works well beside text |
| Home — cottages teaser | `PHOTO-…-59 7.jpg` (bed) | |
| Home — location | `PHOTO-…-59 9.jpg` | |
| Cottage pages ×7 | Shared pool: bed, room wide, bathroom ×2, window, steps | **All seven currently share the same photos** — see below |
| Gallery | All 10 | |
| Contact | `PHOTO-…-59 6.jpg` (entrance steps) | |

> **The seven-cottage problem.** The whole concept is that each cottage has its own
> identity — but every available photo appears to be of the same one. Showing identical
> photos on seven pages undermines the idea and looks evasive.
>
> **Launch approach:** cottage pages lead with the *story and character*, and share a
> clearly-labelled "representative photographs — all cottages share the same modern
> interior" gallery. This is honest and consistent with the vision doc's own guidance
> that the base room stays uniform and identity comes from small details (§11).
>
> **Then:** as each cottage gets its nameplate, themed artwork, and outdoor photo point,
> shoot it and drop the images in. The pages are built to accept per-cottage photos from
> day one — adding them is a data edit, no code change.

### Eco Resort — `resort.chamtaburu.in`

| Page / slot | Image |
|---|---|
| Home hero | `IMG_7327.jpg` (mist over cottages) |
| Home — story | `IMG_7329.jpg` (mural cottages) |
| Accommodation — bamboo cottage | `IMG_7331.jpg` (thatched huts) |
| Home — evenings | `IMG_7313.jpg` (night garden, swing) |
| Home — monsoon | `IMG_7328.jpg` (rain, pathway) |
| Gallery | 7 of 8 — excluding blurred `IMG_7314.jpg` |
| Room interiors | **Placeholder** — none exist |

Unfilled slots use a tasteful branded placeholder with a "photograph coming soon" note
rather than stock imagery. Stock photos of someone else's resort are worse than an
honest gap.

## 4. Technical pipeline

```
photos/                        source — full resolution, git-ignored after processing
  eco_village/
  eco_resort/
        │
        │  npm run photos      (sharp script, run manually when photos change)
        ▼
public/img/
  village/
    hero-hills-2400.avif   hero-hills-2400.webp
    hero-hills-1440.avif   hero-hills-1440.webp
    hero-hills-960.avif    hero-hills-960.webp
    hero-hills-480.avif    hero-hills-480.webp
    hero-hills-lqip.txt    (base64 blur placeholder, ~200 bytes, inlined)
```

- **AVIF** primary, **WebP** fallback, JPEG only for very old browsers.
- Widths 480 / 960 / 1440 / 2400; the browser picks via `srcset`.
- Quality 72 AVIF / 78 WebP — visually lossless at these sizes.
- LQIP blur placeholder inlined to prevent layout shift.
- Every image gets explicit `width`/`height`.
- Descriptive, keyword-bearing filenames: `village-cottage-exterior-ajodhya.avif`, not
  `PHOTO-2026-01-03-14-01-59 7.jpg`.
- Run at commit time, not build time — the results are committed, so deploys stay fast
  and free.

Expected result: a 4.4 MB source photo becomes ~180 kB at 1440 px AVIF. That is the
difference between a site that loads on rural 4G and one that does not.

**Also:** strip EXIF (removes GPS coordinates and device details from published files),
and add `photos/` to `.gitignore` for the raw originals once processed — 60 MB of source
images should not live in git history.

## 5. Reshoot list

Ranked by impact on bookings. Nothing here blocks launch; all of it improves it.

### Priority 1 — do before or soon after launch

| # | Shot | Why |
|---|---|---|
| 1 | **Full-resolution originals of the 10 Village photos** | Free. Costs one file transfer and fixes the hero resolution problem |
| 2 | **Village hero, landscape, golden hour** — cottages with the hills behind | The single most important image on the site. Keep the centre uncluttered for the headline overlay |
| 3 | **Resort in daylight, clear weather** — 4–5 wide shots | Currently unrepresented |
| 4 | **Resort room interiors** — 3 per room type | Biggest conversion gap on the Resort site |
| 5 | **Evening ambience as designed** — bonfire lit, lantern path, warm lighting | The emotional sell. Vision doc §14, §15, §18 |
| 6 | **Food** — 4–5 shots: breakfast, a local thali, the dining area | Consistently among the highest-engagement images on hotel sites |

### Priority 2 — as the property develops

| # | Shot | Why |
|---|---|---|
| 7 | **Each cottage individually**, once its nameplate and photo point exist | Makes the seven-cottage concept real on the site |
| 8 | **The nameplates themselves**, close-up | Distinctive, highly shareable |
| 9 | **Nature trail signs** (Sal, Palash, Mahua) | Vision doc §17 — a genuine differentiator |
| 10 | **Tribal art zone** | Vision doc §16 |
| 11 | **Guests enjoying the property** — get written consent | Human presence lifts conversion measurably |
| 12 | **Palash bloom season** (roughly Feb–Mar) | Purulia's signature. A seasonal hero worth waiting for |
| 13 | **Drone / elevated shot** | Shows the property in its landscape |
| 14 | **Social share card, 1200×630 exactly** | Controls how every WhatsApp share looks |

### Shooting notes

- **Format:** largest JPEG the camera produces, no compression, **never sent through
  WhatsApp**. Use Drive, AirDrop, or email at actual size.
- **Time:** the hour after sunrise and the hour before sunset. Avoid midday — harsh
  overhead light flattens everything.
- **Tidy first.** Remove plastic chairs, buckets, hoses, debris, loose wiring. Make beds
  properly, square the pillows, open the curtains.
- **Rooms:** stand in a corner, shoot toward the opposite corner. Lights on *and*
  curtains open. Level the camera — tilted verticals read as amateur.
- **Consistency** across the set matters more than any single photo being perfect. Same
  time of day, same white balance, same editing.
- **Landscape orientation** for anything used as a hero; portrait is fine for room
  details and the tall feature slots.
- **Aim for 40–50 usable images** in total, across both properties.
