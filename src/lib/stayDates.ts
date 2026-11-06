import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isDate, nightsBetween } from './liveRates';

/**
 * The guest's stay dates, kept in the URL (?in=2026-12-20&out=2026-12-22) so
 * a room's "View" / "Enquire" link can carry them on, and a shared link
 * shows the same prices. Both null until the guest picks valid dates.
 */
export function useStayDates() {
  const [params, setParams] = useSearchParams();
  // Pages are prerendered without dates. Read the URL's only once in the
  // browser, so the first render matches the prerendered HTML (React keeps
  // the server's attributes, such as a link's href, on a mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const rawIn = mounted ? params.get('in') : null;
  const rawOut = mounted ? params.get('out') : null;
  const valid = isDate(rawIn) && isDate(rawOut) && nightsBetween(rawIn, rawOut) > 0;
  const checkIn = valid ? rawIn : null;
  const checkOut = valid ? rawOut : null;

  function setDates(nextIn: string, nextOut: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextIn) next.set('in', nextIn);
        else next.delete('in');
        if (nextOut) next.set('out', nextOut);
        else next.delete('out');
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  return { checkIn, checkOut, rawIn: rawIn ?? '', rawOut: rawOut ?? '', mounted, setDates };
}

/** "?in=…&out=…" for links, or "" without dates. `extra` params go first. */
export function stayQuery(
  checkIn: string | null,
  checkOut: string | null,
  extra: Record<string, string> = {},
): string {
  const q = new URLSearchParams(extra);
  if (checkIn && checkOut) {
    q.set('in', checkIn);
    q.set('out', checkOut);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}
