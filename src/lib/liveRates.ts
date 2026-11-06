/**
 * Live room rates from the manager's rate calendar (/package/calendar).
 *
 * The calendar is one public Firestore document per property, rates/village
 * and rates/resort, which managers edit (firestore.rules). This reads it with
 * a plain REST call rather than the Firebase SDK, as public/package does; the
 * site's CSP already allows firestore.googleapis.com.
 *
 * Document shape (see "Rate calendar" in public/package/package-core.js):
 *   base: JSON { rooms: { <type>: { rate, ac } }, … }  the normal rates
 *   days: map "YYYY-MM-DD" → JSON { rooms: { <type>: { rate?, ac?, soldOut? } }, … }
 * A room's type is its content `rateType`, else its slug.
 *
 * Pages are prerendered, so the first paint shows the content files' price;
 * the live rates replace it once loaded in the browser. Until a manager first
 * saves the calendar there is no document, and the content price stays.
 */
import { useEffect, useState } from 'react';
import { currentSite } from '../content/site';

// VITE_RATES_URL: a stand-in document (same JSON) for trying the room pages
// locally without touching Firestore.
const DOC_URL =
  (import.meta.env.VITE_RATES_URL as string | undefined) ??
  `https://firestore.googleapis.com/v1/projects/chamtaburu-webapp/databases/(default)/documents/rates/${currentSite.key}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface RoomEntry {
  rate?: number | null;
  ac?: number | null;
  soldOut?: boolean;
}

export interface LiveRates {
  base: Record<string, RoomEntry>;
  days: Record<string, Record<string, RoomEntry>>;
}

interface FirestoreDoc {
  fields?: {
    base?: { stringValue?: string };
    days?: { mapValue?: { fields?: Record<string, { stringValue?: string }> } };
  };
}

function roomsOf(json: string | undefined): Record<string, RoomEntry> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as { rooms?: Record<string, RoomEntry> };
    return parsed.rooms ?? {};
  } catch {
    return {};
  }
}

function parse(doc: FirestoreDoc): LiveRates {
  const days: LiveRates['days'] = {};
  for (const [date, value] of Object.entries(doc.fields?.days?.mapValue?.fields ?? {})) {
    if (DATE_RE.test(date)) days[date] = roomsOf(value.stringValue);
  }
  return { base: roomsOf(doc.fields?.base?.stringValue), days };
}

// One request per page load, shared by every price on the page. null = no
// calendar yet, or it couldn't be read: show the content price.
let request: Promise<LiveRates | null> | null = null;
function loadLiveRates(): Promise<LiveRates | null> {
  request ??= fetch(DOC_URL, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((doc: FirestoreDoc | null) => (doc ? parse(doc) : null))
    .catch(() => null);
  return request;
}

/** The live rates once loaded; null before then and when there are none. */
export function useLiveRates(): LiveRates | null {
  const [rates, setRates] = useState<LiveRates | null>(null);
  useEffect(() => {
    let alive = true;
    void loadLiveRates().then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, []);
  return rates;
}

/* ---------- Dates: plain "YYYY-MM-DD", in UTC so a night never shifts. ---------- */

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's date where the guest is. */
export function todayIso(): string {
  const n = new Date();
  return isoDate(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
}

export function addDays(date: string, n: number): string {
  return isoDate(new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round(
    (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 864e5,
  );
}

export function isDate(s: string | null | undefined): s is string {
  return !!s && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

/* ---------- Rates ---------- */

export interface NightRate {
  rate: number | null;
  ac: number | null;
  soldOut: boolean;
}

export function nightRate(rates: LiveRates, type: string, date: string): NightRate {
  const base = rates.base[type] ?? {};
  const day = rates.days[date]?.[type] ?? {};
  return {
    rate: day.rate ?? base.rate ?? null,
    ac: day.ac ?? base.ac ?? null,
    soldOut: !!day.soldOut,
  };
}

export interface StayRate {
  nights: number;
  /** Sum of each night's rate; null if any night has no rate. */
  total: number | null;
  acTotal: number | null;
  /** True when every night costs the same. */
  flat: boolean;
  soldOutDates: string[];
}

export function stayRate(
  rates: LiveRates,
  type: string,
  checkIn: string,
  checkOut: string,
): StayRate {
  const nights = Math.max(0, nightsBetween(checkIn, checkOut));
  let total: number | null = 0;
  let acTotal: number | null = 0;
  const seen = new Set<number | null>();
  const soldOutDates: string[] = [];
  for (let i = 0; i < nights; i++) {
    const date = addDays(checkIn, i);
    const n = nightRate(rates, type, date);
    seen.add(n.rate);
    if (n.soldOut) soldOutDates.push(date);
    total = total != null && n.rate != null ? total + n.rate : null;
    acTotal = acTotal != null && n.ac != null ? acTotal + n.ac : null;
  }
  return { nights, total, acTotal, flat: seen.size <= 1, soldOutDates };
}
