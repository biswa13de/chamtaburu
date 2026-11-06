import { useEffect, useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { addDays, nightsBetween, todayIso } from '../../lib/liveRates';
import { useStayDates } from '../../lib/stayDates';

function shortDate(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

const labelClass = 'mb-1.5 block text-[10px] font-bold tracking-widest text-stone uppercase';
const inputClass =
  'w-full rounded-lg border border-stone/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none';

/** Check-in / check-out picker above a room list. `note` says what the prices cover. */
export function StayDates({ note }: { note: string }) {
  const { checkIn, checkOut, rawIn, rawOut, mounted, setDates } = useStayDates();
  const today = mounted ? todayIso() : undefined;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  // What the boxes show. Typing a date by keyboard passes through partial
  // years ("0002-12-27"); those stay here and only a whole date goes to the
  // URL, or the re-render would reset the box mid-typing.
  const [draftIn, setDraftIn] = useState(rawIn);
  const [draftOut, setDraftOut] = useState(rawOut);
  useEffect(() => setDraftIn(rawIn), [rawIn]);
  useEffect(() => setDraftOut(rawOut), [rawOut]);
  const complete = (v: string) => v === '' || v >= '2000-01-01';

  function onCheckIn(value: string) {
    setDraftIn(value);
    if (!complete(value)) return;
    // Keep check-out after check-in, defaulting to one night.
    const out = value && (!rawOut || rawOut <= value) ? addDays(value, 1) : rawOut;
    setDates(value, value ? out : rawOut);
  }

  function onCheckOut(value: string) {
    setDraftOut(value);
    if (complete(value)) setDates(rawIn, value);
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="stay-in" className={labelClass}>
            Check-in
          </label>
          <input
            id="stay-in"
            type="date"
            className={inputClass}
            min={today}
            value={draftIn}
            onChange={(e) => onCheckIn(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="stay-out" className={labelClass}>
            Check-out
          </label>
          <input
            id="stay-out"
            type="date"
            className={inputClass}
            min={rawIn ? addDays(rawIn, 1) : today && addDays(today, 1)}
            value={draftOut}
            onChange={(e) => onCheckOut(e.target.value)}
          />
        </div>
        <div className="flex min-h-[42px] items-center gap-3 sm:justify-end">
          {nights > 0 && checkIn && checkOut ? (
            <>
              <p className="text-ink flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} className="text-forest shrink-0" aria-hidden="true" />
                {nights} night{nights === 1 ? '' : 's'} · {shortDate(checkIn)} –{' '}
                {shortDate(checkOut)}
              </p>
              <button
                type="button"
                onClick={() => setDates('', '')}
                className="text-stone hover:text-forest inline-flex items-center gap-1 text-xs font-semibold"
                aria-label="Clear dates"
              >
                <X size={14} aria-hidden="true" />
                Clear
              </button>
            </>
          ) : (
            <p className="text-stone text-sm">Pick your dates to see the price of your stay.</p>
          )}
        </div>
      </div>
      <p className="text-stone mt-3 text-xs">{note}</p>
    </div>
  );
}
