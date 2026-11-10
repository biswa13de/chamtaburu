/**
 * What a guest can request to book on this site (src/components/pages/Book.tsx):
 * the Village's seven cottages and two first-floor rooms, or the Resort's
 * five room types. `slug` is also the room's `id` in public/package/rates.js,
 * so the Package Generator can turn a request into a package; `type` is its
 * row in the rate calendar (src/lib/liveRates.ts).
 */
import { cottages, rooms } from './village';
import { accommodation } from './resort';
import type { Price } from './types';

export interface Bookable {
  slug: string;
  name: string;
  group: string;
  type: string;
  price: Price;
  /** Set when the room also comes as an AC version (Resort rooms). */
  acPrice?: Price;
  ac: boolean; // the room itself is air-conditioned (Village cottages 02–04)
  /** How many of this a guest can ask for in one request. */
  maxQty: number;
}

export const bookables: Bookable[] =
  __SITE__ === 'resort'
    ? accommodation.map((r) => ({
        slug: r.slug,
        name: r.name,
        group: 'Rooms',
        type: r.rateType ?? r.slug,
        price: r.price,
        acPrice: r.acPrice,
        ac: false,
        // Room counts per type aren't in the content; a manager confirms.
        maxQty: 5,
      }))
    : [
        ...cottages.map((c) => ({
          slug: c.slug,
          name: `${c.number} · ${c.name}`,
          group: 'Cottages',
          type: c.rateType ?? c.slug,
          price: c.price,
          ac: c.amenities.includes('ac'),
          maxQty: 1, // each cottage is one named cottage
        })),
        ...rooms.map((r) => ({
          slug: r.slug,
          name: r.name,
          group: 'First-floor rooms',
          type: r.slug,
          price: r.price,
          ac: false,
          maxQty: 2, // T1 is rooms 108 / 111, T2 rooms 109 / 110
        })),
      ];
