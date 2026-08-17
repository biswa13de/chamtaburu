/**
 * Content schema — the shapes every entry in src/content/*.ts must satisfy.
 * Mirrors docs/03-content-model.md §1, with one deliberate deviation
 * documented below (Cottage.price).
 */

// Keys into a shared amenity dictionary. Extend as real amenities are confirmed.
export type AmenityKey =
  | 'wifi'
  | 'ac'
  | 'geyser'
  | 'breakfast'
  | 'attached-bathroom'
  | 'balcony'
  | 'parking';

export interface ImageRef {
  src: string; // path into the generated responsive image set
  alt: string; // REQUIRED — descriptive, location-bearing
  caption?: string;
}

/**
 * Price representation for a Cottage.
 *
 * docs/03-content-model.md's schema has `price: number`, but per
 * docs/06-open-questions.md Q2 no real prices exist yet for any of the
 * seven cottages — they are invented in the current prototype data and
 * must not be carried forward as fact.
 *
 * Chosen shape: `price: number | 'TBD'`.
 *
 * Why this over `number | null`: a naive call site that does
 * `${price}` or `formatPrice(price)` renders the literal string "TBD"
 * instead of silently producing "₹0", "₹null", or an empty string — the
 * failure mode is visible in the UI, not just at the type level. `null`
 * would require every call site to remember to special-case it in a
 * template string; forgetting produces "₹null", which reads as a bug
 * you didn't notice. `'TBD'` is copy-safe by construction; you can
 * `{typeof price === 'number' ? formatINR(price) : price}` and get a
 * reasonable label either way. Discriminated-union callers still get a
 * compile error if they do arithmetic on `price` without narrowing, since
 * TypeScript won't let you add a `number | 'TBD'` to anything.
 *
 * Applied consistently to `extraBedPrice` and `Experience.price` too.
 */
export type Price = number | 'TBD';

export interface Cottage {
  slug: string; // URL: /cottages/shal-shanti — also the QR code target. FROZEN, see docs/03-content-model.md §3.
  number: string; // '01'
  name: string; // 'Shal Shanti'
  tagline: string; // 'Where the forest whispers peace.'
  theme: string; // 'Forest & Peace'
  inspiration: string; // one paragraph — where the name comes from
  story: string; // the guest story card text (vision doc §3–9), verbatim
  interiorNotes: string[]; // 'Natural wooden elements', 'Green accents', …
  photoPoint?: string; // the outdoor photo opportunity for this cottage
  // Occupancy, beds and price are not in the vision doc (docs/06-open-questions.md
  // Q2) — represented as 'TBD' rather than invented numbers. See the `Price`
  // comment above for why 'TBD' rather than `null`.
  occupancy: { adults: number | 'TBD'; children?: number };
  beds: string | 'TBD'; // '1 King Bed', or 'TBD' until confirmed
  price: Price; // per night, INR, before GST
  extraBedPrice?: Price;
  amenities: AmenityKey[]; // keys into a shared amenity dictionary
  images: ImageRef[];
  // false hides it from listings without deleting the data. All seven start
  // false until docs/06-open-questions.md Q1 (which cottages are actually
  // built and bookable) is answered — see docs/06-open-questions.md Q1.
  available: boolean;
}

export interface Experience {
  slug: string;
  title: string;
  description: string;
  price?: Price; // omit when included in the stay
  duration?: string;
  images: ImageRef[];
}

export interface PostalAddress {
  street: string;
  locality: string;
  district: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface SiteConfig {
  key: 'village' | 'resort';
  name: string;
  legalName: string;
  tagline: string;
  domain: string;
  whatsapp: string; // digits only, with country code
  phones: string[];
  email: string;
  address: PostalAddress;
  // Not yet known — docs/06-open-questions.md Q6. Do not invent coordinates;
  // components must treat a missing geo as "no map pin available" rather
  // than defaulting to 0,0 (which would silently plot null island).
  geo?: { lat: number; lng: number };
  mapsUrl?: string;
  gstin: string;
  // No confirmed social URLs exist yet (docs/06-open-questions.md Q9).
  // Omit keys rather than inventing URLs — Footer only renders icons for
  // keys that are present.
  social: { facebook?: string; instagram?: string; youtube?: string };
}
