# 01 — Strategy, Brand & Site Map

## 1. Business goals

Ranked, because they conflict at the margins and the ranking decides tie-breaks.

1. **Generate direct bookings** that bypass OTA commission (MakeMyTrip, Booking.com,
   Agoda typically take 15–25%). Every ₹ booked direct is a ₹ saved.
2. **Be findable on Google** for the searches guests actually run — "resort in Ajodhya
   Hills", "Purulia homestay", "Matha forest stay", "eco resort Purulia".
3. **Establish the seven-cottage identity** as the thing people remember and repeat.
   Per the vision doc: guests should say *"we stayed at Karam Kunja"*, not *"room 106"*.
4. **Cost effectively nothing to run** — target ₹0/month hosting.
5. **Be updatable by you in minutes**, without a developer.

## 2. Positioning

From the vision doc, §25:

> Chamtaburu Eco Village should not compete with conventional hotels by trying to look
> luxurious through expensive decoration. Its strongest differentiator is: **Modern
> cottages + Purulia nature + local culture + personalized cottage identities.**

The website must carry this honestly. The property is **new, clean, and comfortable**,
set in genuinely beautiful country, with a cultural story attached. It is *not* a
five-star resort and should not pretend to be — that mismatch between web promise and
arrival reality is what generates bad reviews.

**Brand line:** *Nature, Tribal Culture & Modern Comfort in Harmony.*

### Target guest

| Segment | Why they come | What they need from the site |
|---|---|---|
| Kolkata weekenders (primary) | 5–6 hr drive, 2 nights, nature break | Photos, price, road directions, instant WhatsApp booking |
| Families with children | Safe outdoors, space to run | Family cottage options, food details, safety cues |
| Couples / photographers | Ajodhya Hills, Palash season, monsoon mist | Atmosphere shots, the Instagram points, seasonal guidance |
| Small groups / offsites | Bonfire, whole-property bookings | Capacity, group pricing, a phone number that answers |

Almost all of them arrive on a **phone**, over a **patchy mobile connection**, from
**Google or WhatsApp**. That dictates every technical decision in
[02-architecture.md](02-architecture.md): small pages, static HTML, aggressive image
optimization, WhatsApp-first contact, share cards that render correctly.

## 3. Property structure

**Eco Village is the parent brand.**

| Property | Domain | Character | Status |
|---|---|---|---|
| **Chamtaburu Eco Village** | `chamtaburu.in` | Seven named modern cottages, village & tribal theme, Matha | Live — flagship |
| **Chamtaburu Eco Resort** | `resort.chamtaburu.in` | Bamboo & thatch cottages, garden, rustic, Sankupi | Live — sister property |
| **Chamtaburu Junction** | — | Future development | **Hidden until real** |

`chamtaburu.in` is the Eco Village site *and* carries a compact "Our Properties" section
linking to the Resort. This gives one strong SEO domain and one bookable landing page,
while preserving the group identity.

Junction is removed from navigation, sitemaps, and the codebase entirely — not merely
hidden with CSS. A "coming soon" page for a thing with no date is a dead end that leaks
visitors and adds nothing to search ranking. It comes back when there is something to
show.

## 4. Brand system

The property's own materials are white walls, red clay-tile roofs, wood flooring, green
foliage, bamboo and thatch. The palette should agree with the photographs rather than
fight them.

```
--color-forest      #4A6B4F   Primary. Sal-forest green. Headers, buttons, links.
--color-forest-deep #2F4435   Hover states, dark sections, footer.
--color-palash      #E0552B   Accent. The Palash flower — Purulia's signature colour.
                              Used sparingly: CTAs, active states, highlights.
--color-terracotta  #A8613C   Secondary warm. Earth, pottery, roof tile.
--color-sand        #F7F4EE   Page background. Warm off-white.
--color-ink         #1F211E   Body text.
--color-stone       #6B6F68   Muted text, borders.
```

The existing sage `#7a9470` is close in spirit but too pale and washed out to hold up
against photography; `#4A6B4F` is the same hue with the contrast a hotel site needs
(and passes WCAG AA on sand for body text, which the sage does not).

**Typography** — keep the existing pairing, it is good:
- Display / headings: **Cormorant Garamond** — editorial, warm, not corporate.
- Body / UI: **Inter** — legible at small sizes on cheap Android screens.

Self-hosted, not loaded from Google Fonts (see [02-architecture.md](02-architecture.md) §6).

**Design language**, from the vision doc §23 — four principles that apply to the website
as much as the property:

> 🌿 Nature · 🪵 Natural materials · 🛖 Local character · ✨ Modern comfort
>
> Avoid making the property look like a theme park. The cultural elements should feel
> authentic, tasteful and understated.

Practically, for the site: generous whitespace, large photographs, restrained use of the
Palash orange, no tribal-pattern wallpaper backgrounds, no ornamental borders, no
stock-photo "luxury" clichés.

## 5. Site map

### chamtaburu.in — Eco Village (primary)

```
/                          Home
                             ├ Hero + brand line
                             ├ The seven cottages (grid, links to each)
                             ├ Our story / the eco-village idea
                             ├ Experiences (bonfire, nature trail, tribal art, food)
                             ├ Where we are (map, drive times from Kolkata/Purulia)
                             ├ Our properties (→ Eco Resort)
                             └ Enquiry CTA
/cottages                  All seven cottages, with prices and capacity
/cottages/shal-shanti      ─┐
/cottages/mahua-ghar        │
/cottages/palash-kunja      │  One page per cottage.
/cottages/pahari-chaya      ├─ Name, tagline, story, photos, amenities,
/cottages/jharna-neer       │  price, "Enquire on WhatsApp".
/cottages/karam-kunja       │  THIS IS THE QR CODE TARGET (vision doc §19).
/cottages/adivasi-aangan   ─┘
/experiences               Bonfire, nature trail, tribal art zone, local sightseeing
/gallery                   Photo grid
/contact                   Address, map, directions, phones, WhatsApp, enquiry form
/legal                     Privacy · Terms · Refund & Cancellation · GST details
/404                       Proper not-found page
```

### resort.chamtaburu.in — Eco Resort

```
/                          Home — hero, story, cottages, garden, enquiry
/accommodation             Room types and prices
/contact                   Address, map, directions, WhatsApp
/legal                     Shared policy content, Resort contact details
/404
```

Both sites share one component library, one design system, one build.

### The QR code loop

This is worth calling out because it connects the physical property to the website, and
it is the single most distinctive thing on this site:

```
Guest checks into Karam Kunja
   └→ finds the printed story card in the room (vision doc §19)
        └→ scans the QR code
             └→ chamtaburu.in/cottages/karam-kunja
                  ├→ the full story of the Karam tree and festival
                  ├→ photos of this specific cottage
                  ├→ the nature trail and tribal art zone nearby
                  ├→ "Share your Chamtaburu moment" — social links
                  └→ "Book this cottage again" → WhatsApp
```

The same URLs serve prospective guests browsing from Google. One page, two audiences,
no extra work. I'll generate the printable QR codes as part of Phase 5.

## 6. What we are deliberately NOT building

Recorded so these don't creep back in later:

- **No online payment.** No Razorpay, no card fields, no gateway. WhatsApp enquiry and
  phone booking only. This avoids merchant onboarding, PCI scope, refund-dispute
  handling, and per-transaction fees. Revisit when volume justifies it.
- **No availability calendar or inventory system.** Seven cottages managed over
  WhatsApp does not need a database. A booking engine that shows stale availability is
  worse than none.
- **No user accounts, no login, no CMS server.** Nothing to breach, nothing to patch.
- **No blog** at launch. It is a real SEO asset but only if actually written; an
  abandoned blog with two 2026 posts signals a dead business.
- **No chatbot, no AI features.** The `@google/genai` dependency is unused and gets
  deleted.
- **No cookie banner** — because we will set no tracking cookies that require one.
  Analytics will be configured cookieless. Fewer dark patterns, faster page, no
  compliance surface.
