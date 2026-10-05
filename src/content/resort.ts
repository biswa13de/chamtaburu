/**
 * Content for resort.chamtaburu.in — Chamtaburu Eco Resort.
 *
 * Site config values are the confirmed values from docs/03-content-model.md §2.
 *
 * Accommodation: docs/06-open-questions.md Q3 is now answered — the owner
 * confirmed the five real room types, prices (breakfast included), and
 * occupancy directly (2026-10-05), replacing the old unverified prototype
 * list (Special Bamboo Cottage ₹2,000, Double Bed ₹1,800, Quadruple ₹2,400,
 * Family ₹3,599) that docs/03-content-model.md §4 flagged as fiction.
 *
 * Several room types (Triple/Four/Six Bedded) also have a pricier AC
 * variant at the same bed configuration and occupancy — noted in each
 * room's `tagline` rather than as a separate listing, per the owner's
 * choice, since `Cottage` has no dedicated field for a second price.
 *
 * `slug` here is NOT frozen the way village.ts cottage slugs are (no QR
 * codes point at these yet) — safe to rename later if needed.
 */

import type { Cottage, SiteConfig } from './types';
import { validateCottages, validateSiteConfig } from './validate';

export const resort: SiteConfig = {
  key: 'resort',
  name: 'Chamtaburu Eco Resort',
  legalName: 'Chamtaburu Eco Village & Resort Pvt. Ltd.',
  // No confirmed resort-specific tagline exists yet; reuse the group brand
  // line rather than inventing resort positioning copy (needs your input
  // per docs/03-content-model.md §7).
  tagline: 'Nature, Tribal Culture & Modern Comfort in Harmony.',
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
  // docs/06-open-questions.md Q6 — confirmed 2026-10-05 from the owner's
  // Google Maps pin (https://maps.app.goo.gl/xusbRPjFKgWUqywf9), resolved to
  // the place's lat/lng via the link's redirect target. Resort-only — the
  // Village's coordinates are still unconfirmed, see village.ts.
  geo: { lat: 23.1339437, lng: 86.0721545 },
  mapsUrl: 'https://maps.app.goo.gl/xusbRPjFKgWUqywf9',
  gstin: '19AAUFC4653K1ZR',
  // docs/06-open-questions.md Q9 — confirmed 2026-10-05.
  social: {
    facebook: 'https://www.facebook.com/chamtaburu',
    instagram: 'https://www.instagram.com/chamtaburuecoresort',
    googleReview: 'https://g.page/r/CaSxfj5udxADEAE/review',
  },
};

// Typed as Cottage[] — the Resort's accommodation units aren't cottages in
// the branded-identity sense the Village uses (no per-room name/story), but
// the schema (name, price, occupancy, images, available) fits equally well
// and avoids introducing a second near-duplicate type. `theme`, `inspiration`
// and `story` are required by the shared type but not meaningful for a plain
// room category, so they hold short factual room-category copy instead of
// village-style narrative flavor text.
export const accommodation: Cottage[] = [
  {
    slug: 'bamboo-cottage',
    number: '01',
    name: 'Bamboo Cottage',
    tagline: 'A round thatched-roof cottage built from bamboo.',
    theme: 'Bamboo Cottage',
    inspiration:
      'A traditional round bamboo-and-thatch cottage, built in the style of the resort’s original huts.',
    story:
      'Our signature room: a circular bamboo cottage with a thatched roof, queen-size bed and attached bathroom, set among the resort’s painted garden steps.',
    interiorNotes: ['Bamboo-woven walls', 'Thatched roof', 'Queen-size bed', 'Attached bathroom'],
    occupancy: { adults: 2, children: 1 },
    beds: '1 Queen Bed',
    price: 2000,
    amenities: ['attached-bathroom', 'breakfast'],
    images: [
      {
        base: 'resort/resort-room-bamboo-cottage',
        alt: 'Thatched-roof bamboo cottages with colourful painted steps at Chamtaburu Eco Resort, Ajodhya Hills',
      },
      {
        base: 'resort/resort-room-bamboo-cottage-interior',
        alt: 'Bamboo cottage bedroom with double bed, bedside cooler and wooden floor at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-bamboo-cottage-bathroom',
        alt: 'Floral-tiled attached bathroom with sink and Western toilet in the Bamboo Cottage at Chamtaburu Eco Resort',
      },
    ],
    available: true,
  },
  {
    slug: 'double-bedded',
    number: '02',
    name: 'Double Bedded',
    tagline: 'A simple double room with an attached bathroom.',
    theme: 'Double Bedded',
    inspiration: 'A compact, comfortable room for couples or solo travellers.',
    story: 'A double room with a king-size bed and an attached bathroom.',
    interiorNotes: ['King-size bed', 'Attached bathroom'],
    occupancy: { adults: 2, children: 1 },
    beds: '1 King Bed',
    price: 1600,
    amenities: ['attached-bathroom', 'breakfast'],
    images: [
      {
        base: 'resort/resort-room-double-bedded',
        alt: 'Double-bedded room with made-up bed and folded towel at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-double-bedded-bathroom',
        alt: 'Attached bathroom with sink and Western toilet for the Double Bedded room at Chamtaburu Eco Resort',
      },
    ],
    available: true,
  },
  {
    slug: 'triple-bedded',
    number: '03',
    name: 'Triple Bedded',
    tagline: 'A three-bed room for small families or groups. AC available for ₹2,200 / night.',
    theme: 'Triple Bedded',
    inspiration: 'A larger room for three guests travelling together.',
    story:
      'A triple room with two queen-size beds and an attached bathroom. An air-conditioned version of this room is also available.',
    interiorNotes: ['Two queen-size beds', 'Attached bathroom', 'AC variant available'],
    occupancy: { adults: 3, children: 1 },
    beds: '2 Queen Beds',
    price: 1800,
    amenities: ['attached-bathroom', 'breakfast'],
    images: [
      {
        base: 'resort/resort-room-triple-bedded',
        alt: 'Triple Bedded room with one double bed and one single bed, wall fan, at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-triple-bedded-interior',
        alt: 'Triple Bedded room interior with two beds and bedside table at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-triple-bedded-bathroom',
        alt: 'Attached bathroom with geyser and Western toilet for the Triple Bedded room at Chamtaburu Eco Resort',
      },
    ],
    available: true,
  },
  {
    slug: 'four-bedded',
    number: '04',
    name: 'Four Bedded',
    tagline: 'A four-bed room for groups or larger families. AC available for ₹2,500 / night.',
    theme: 'Four Bedded',
    inspiration: 'A spacious room for four guests travelling together.',
    story:
      'A four-bed room with two queen-size beds and an attached bathroom. An air-conditioned version of this room is also available.',
    interiorNotes: ['Two queen-size beds', 'Attached bathroom', 'AC variant available'],
    occupancy: { adults: 4 },
    beds: '2 Queen Beds',
    price: 2100,
    amenities: ['attached-bathroom', 'breakfast'],
    images: [
      {
        base: 'resort/resort-room-four-bedded',
        alt: 'Four Bedded room with two double beds and decorative wall shelf at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-four-bedded-interior',
        alt: 'Four Bedded room interior showing beds, air conditioner and work table at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-four-bedded-bathroom',
        alt: 'Attached bathroom with geyser and Western toilet for the Four Bedded room at Chamtaburu Eco Resort',
      },
    ],
    available: true,
  },
  {
    slug: 'six-bedded',
    number: '05',
    name: 'Six Bedded',
    tagline: 'Our largest room, for bigger groups. AC available for ₹3,300 / night.',
    theme: 'Six Bedded',
    inspiration: 'The resort’s largest room, built for groups travelling together.',
    story:
      'A six-bed room with two king-size beds and an attached bathroom. An air-conditioned version of this room is also available.',
    interiorNotes: ['Two king-size beds', 'Attached bathroom', 'AC variant available'],
    occupancy: { adults: 6, children: 1 },
    beds: '2 King Beds',
    price: 2700,
    amenities: ['attached-bathroom', 'breakfast'],
    images: [
      {
        base: 'resort/resort-room-six-bedded',
        alt: 'Six Bedded room with multiple beds, wall-mounted air conditioner and work table at Chamtaburu Eco Resort',
      },
      {
        base: 'resort/resort-room-six-bedded-interior',
        alt: 'Six Bedded room interior with cushioned beds and bedside table at Chamtaburu Eco Resort',
      },
    ],
    available: true,
  },
];

// Build-time validation: throws at module load, failing the build/dev
// server immediately if any entry is malformed. See src/content/validate.ts.
validateSiteConfig(resort);
validateCottages(accommodation);
