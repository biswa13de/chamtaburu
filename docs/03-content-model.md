# 03 — Content Model

All site content lives in typed data files. Components read from them and contain no
hardcoded copy. This is what makes the site updatable without touching components.

## 1. Schema

```ts
// src/content/types.ts

export interface Cottage {
  slug: string             // URL: /cottages/shal-shanti — also the QR code target
  number: string           // '01'
  name: string             // 'Shal Shanti'
  tagline: string          // 'Where the forest whispers peace.'
  theme: string            // 'Forest & Peace'
  inspiration: string      // one paragraph — where the name comes from
  story: string            // the guest story card text (vision doc §3–9)
  interiorNotes: string[]  // 'Natural wooden elements', 'Green accents', …
  photoPoint?: string      // the outdoor photo opportunity for this cottage
  occupancy: { adults: number; children?: number }
  beds: string             // '1 King Bed'
  price: number            // per night, INR, before GST
  extraBedPrice?: number
  amenities: AmenityKey[]  // keys into a shared amenity dictionary
  images: ImageRef[]
  available: boolean       // false hides it from listings without deleting the data
}

export interface Experience {
  slug: string
  title: string
  description: string
  price?: number           // omit when included in the stay
  duration?: string
  images: ImageRef[]
}

export interface SiteConfig {
  key: 'village' | 'resort'
  name: string
  legalName: string
  tagline: string
  domain: string
  whatsapp: string         // digits only, with country code
  phones: string[]
  email: string
  address: PostalAddress
  geo: { lat: number; lng: number }
  mapsUrl: string
  gstin: string
  social: { facebook?: string; instagram?: string; youtube?: string }
}

export interface ImageRef {
  src: string              // path into the generated responsive image set
  alt: string              // REQUIRED — descriptive, location-bearing
  caption?: string
}
```

`available: boolean` matters operationally: when a cottage is closed for maintenance you
flip one boolean rather than deleting and later re-typing its content.

## 2. Site configuration — confirmed details

```ts
export const village: SiteConfig = {
  key: 'village',
  name: 'Chamtaburu Eco Village',
  legalName: 'Chamtaburu Eco Village & Resort Pvt. Ltd.',
  tagline: 'Nature, Tribal Culture & Modern Comfort in Harmony.',
  domain: 'chamtaburu.in',
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
  gstin: '19AAUFC4653K1ZR',
}

export const resort: SiteConfig = {
  key: 'resort',
  name: 'Chamtaburu Eco Resort',
  legalName: 'Chamtaburu Eco Village & Resort Pvt. Ltd.',
  domain: 'resort.chamtaburu.in',
  whatsapp: '918918550242',
  phones: ['+91 89185 50242'],
  email: 'info@chamtaburu.in',
  address: {
    street: 'Sankupi, Matha Forest',
    locality: 'Baghmundi',
    district: 'Purulia',
    region: 'West Bengal',
    postalCode: '723152',
    country: 'IN',
  },
  gstin: '19AAUFC4653K1ZR',
}
```

**Corrections applied from the current code:**

| Was | Now | Note |
|---|---|---|
| `info@chamtaburu.com` | `info@chamtaburu.in` | Domain mismatch fixed |
| `+91 700325792` | *removed* | 9 digits — not a valid Indian mobile number |
| `+91 8918550242` listed under Village | Resort | Per your assignment |
| Single shared address | Separate per property | Matha vs Sankupi |
| No GSTIN anywhere | `19AAUFC4653K1ZR` | Required on invoices and the legal page |

**Still needed:** `geo` coordinates for each property (see
[06-open-questions.md](06-open-questions.md) Q6) — required for `LodgingBusiness`
structured data and the map. Take them from the Google Maps pin for each property.

## 3. The seven cottages

Content transcribed from `CHAMTABURU ECO VILLAGE.docx`. **Prices, occupancy, and bed
configuration are not in that document and are marked `TBD`** — see
[06-open-questions.md](06-open-questions.md) Q2.

| # | Slug | Name | Tagline | Theme |
|---|---|---|---|---|
| 01 | `shal-shanti` | Shal Shanti | Where the forest whispers peace. | Forest & Peace |
| 02 | `mahua-ghar` | Mahua Ghar | A warm stay inspired by village life. | Village & Tradition |
| 03 | `palash-kunja` | Palash Kunja | Where Purulia blooms in colour. | Colour & Spring |
| 04 | `pahari-chaya` | Pahari Chaya | Rest in the shade of the hills. | Hills & Relaxation |
| 05 | `jharna-neer` | Jharna Neer | A refreshing escape into nature. | Streams & Freshness |
| 06 | `karam-kunja` | Karam Kunja | Rooted in culture, connected to nature. | Culture & Community |
| 07 | `adivasi-aangan` | Adivasi Aangan | A courtyard inspired by community and tradition. | Tribal Heritage |

Each cottage page renders:

1. **Hero** — cottage photograph, name, number, tagline
2. **The Story** — the guest story card text, verbatim from the vision doc, so the
   printed card in the room and the web page tell the same story
3. **Inspiration** — where the name comes from
4. **The Cottage** — photo gallery, occupancy, beds, amenities
5. **Interior character** — the themed details list
6. **Your photo point** — the outdoor element for this cottage (vision doc §12C)
7. **Price + Enquire on WhatsApp** — message pre-filled with this cottage's name
8. **Nearby** — links to Experiences, the nature trail, the bonfire
9. **Other cottages** — cross-links to the remaining six

### Slug stability

Once a QR code is printed and placed in a room, its URL is **permanent**. Changing a
slug invalidates every printed card. Slugs are therefore frozen at the values above; if
a cottage is ever renamed, the old slug must redirect rather than disappear. This is
recorded here because it is easy to forget a year from now.

### Bengali transliteration

The names are Bengali/Sanskritic. Cottage pages should carry the Bengali script
alongside the Latin (e.g. **শাল শান্তি**) — it is authentic, it looks good, and it helps
Bengali-language search. Needs your confirmation of correct spellings
([06-open-questions.md](06-open-questions.md) Q7).

## 4. Eco Resort accommodation

The existing room list in [content.ts](../src/data/content.ts) — Special Bamboo Cottage
(₹2,000), Double Bed Cottage (₹1,800), Quadruple Cottage (₹2,400), Family Cottage
(₹3,599) — was written for the prototype and **must be verified against reality** before
launch. The resort photographs do show bamboo and thatch structures, so the Bamboo
Cottage is plausible; the rest is unconfirmed. See
[06-open-questions.md](06-open-questions.md) Q3.

The Resort has no equivalent brand document. It needs, at minimum: a one-paragraph
story, a confirmed room list with real prices and capacity, and its own positioning
relative to the Village. Until then it launches as a simpler site — hero, story,
accommodation, contact — and grows later.

## 5. Experiences

From the vision doc, these are real and photographable:

| Experience | Source | Notes |
|---|---|---|
| Evening bonfire | §18 | *"Stories • Stars • Togetherness"* — strong emotional hook |
| Nature trail with labelled trees | §17 | Sal, Palash, Mahua signs — genuinely distinctive |
| Tribal art zone | §16 | Chhau-inspired motifs, terracotta, bamboo craft |
| Central garden & fire pit | §13 | Common social space |
| Instagram points | §12 | Worth a page — guests search for photogenic stays |
| Local food | — | Needs content; see Q4 |

Local sightseeing is worth its own section for SEO — people search the attraction, not
the hotel. Marble Lake, Bamni Falls, Turga Falls, Khairabera Lake, Upper Dam,
Charida mask village, Ajodhya Pahar. Each with distance and drive time from the
property.

## 6. Legal content

The current text at [App.tsx:662](../src/App.tsx#L662) is machine-garbled placeholder —
*"protects your data in collection only from how solo, contact via-or industry, and
resorts via your information"* — and cannot ship. It will be replaced with proper
India-appropriate drafts:

| Policy | Contents |
|---|---|
| Privacy Policy | What is collected (enquiry form fields only), why, retention, no sale of data, analytics disclosure, contact for requests |
| Terms & Conditions | Booking and confirmation process, check-in/out times, ID requirements, house rules, liability, governing law and jurisdiction |
| Refund & Cancellation | Cancellation windows and refund percentages, no-show policy, how to request — **needs your actual policy**, Q5 |
| Guest Information | Children policy, extra beds, pets, smoking, alcohol, quiet hours |
| Business details | Legal name, GSTIN `19AAUFC4653K1ZR`, registered address, contact |

I will draft these. **They are drafts for your review, not legal advice** — have a CA or
lawyer confirm the GST treatment and cancellation terms before publishing.

## 7. Copy to be written

| Where | Length | Status |
|---|---|---|
| Village home hero | 1 line + 2 lines | Draft from brand line |
| Village "our story" | 150–200 words | **Needs your input** — why you built it |
| Seven cottage stories | ~80 words each | ✅ Complete, from vision doc |
| Experience descriptions | 60–100 words each | Draft from vision doc, needs your review |
| Food & dining | 100 words | **Needs your input** — Q4 |
| Directions | 150 words | **Needs your input** — Q8 |
| Resort story | 150 words | **Needs your input** |
| Legal policies | ~1,200 words | I draft, you and a professional confirm |
| Meta descriptions | 155 chars × ~15 pages | I write |
| Image alt text | 1 line × ~40 images | I write |

I can draft everything marked "needs your input" from a few bullet points or a voice
note — it is faster to correct a draft than to write from blank.
