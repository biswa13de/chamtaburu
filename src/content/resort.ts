/**
 * Content for resort.chamtaburu.in — Chamtaburu Eco Resort.
 *
 * Site config values are the confirmed values from docs/03-content-model.md §2.
 *
 * Accommodation: the current prototype room list in src/data/content.ts
 * (Special Bamboo Cottage ₹2,000, Double Bed ₹1,800, Quadruple ₹2,400,
 * Family ₹3,599) is explicitly documented as unverified prototype fiction
 * — docs/03-content-model.md §4 and docs/06-open-questions.md Q3. It is
 * NOT carried forward here. Rather than invent a "TBD-priced" placeholder
 * room list with room types/capacities that are equally unconfirmed, this
 * file omits resort accommodation entries entirely: an empty array is
 * honest, whereas fabricated room *types* (not just prices) would still be
 * presenting invented structure as fact. Phase 7 is explicitly
 * "content-blocked on confirmed rooms and prices" per
 * docs/05-build-phases.md — this array is populated then, from a real
 * rate card.
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
  // Not yet known — docs/06-open-questions.md Q6. Do not invent coordinates.
  geo: undefined,
  mapsUrl: undefined,
  gstin: '19AAUFC4653K1ZR',
  // No confirmed social URLs exist yet (docs/06-open-questions.md Q9).
  social: {},
};

// Intentionally empty — see file header. Typed as Cottage[] so the shape is
// ready for Phase 7's real room data without a type change; the Resort's
// accommodation units aren't cottages in the branded-identity sense the
// Village uses, but the schema (name, price, occupancy, images, available)
// fits equally well and avoids introducing a second near-duplicate type.
export const accommodation: Cottage[] = [];

// Build-time validation: throws at module load, failing the build/dev
// server immediately if any entry is malformed. See src/content/validate.ts.
// validateCottages() requires a non-empty array (Phase 7 will have real
// rows), so it's only invoked once `accommodation` actually has entries.
validateSiteConfig(resort);
if (accommodation.length > 0) {
  validateCottages(accommodation);
}
