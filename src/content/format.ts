/**
 * Shared TBD-safe formatting helpers for Price / occupancy fields. Centralized
 * so every page (cottage grid, cottage detail, resort accommodation) renders
 * the same "TBD" copy instead of each re-deriving its own string.
 */
import type { Price } from './types';

export function formatPrice(price: Price): string {
  return price === 'TBD' ? 'Price to be announced' : `₹${price.toLocaleString('en-IN')} / night`;
}

export function formatAdults(adults: number | 'TBD'): string {
  return adults === 'TBD' ? 'TBD' : `${adults} adult${adults === 1 ? '' : 's'}`;
}
