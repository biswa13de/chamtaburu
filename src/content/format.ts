/**
 * Shared TBD-safe formatting helpers for Price / occupancy fields. Centralized
 * so every page (cottage grid, cottage detail, resort accommodation) renders
 * the same "TBD" copy instead of each re-deriving its own string.
 */
import type { AmenityKey, Price } from './types';

export function formatPrice(price: Price): string {
  return price === 'TBD' ? 'Price to be announced' : `₹${price.toLocaleString('en-IN')} / night`;
}

export function formatAdults(adults: number | 'TBD'): string {
  return adults === 'TBD' ? 'TBD' : `${adults} adult${adults === 1 ? '' : 's'}`;
}

// The shared amenity dictionary AmenityKey points into: what guests read.
export const AMENITY_LABELS: Record<AmenityKey, string> = {
  wifi: 'Wi-Fi',
  ac: 'Air conditioning',
  geyser: 'Hot water',
  breakfast: 'Breakfast',
  'attached-bathroom': 'Attached bathroom',
  balcony: 'Balcony',
  parking: 'Parking',
  'private-lawn': 'Private lawn with garden',
  'hill-view': 'Stunning hill view',
  swing: 'Dedicated swing',
};
