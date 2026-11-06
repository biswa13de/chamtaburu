import { formatPrice } from '../../content/format';
import type { Price } from '../../content/types';
import { nightRate, stayRate, todayIso, useLiveRates } from '../../lib/liveRates';
import { useStayDates } from '../../lib/stayDates';

interface RoomPriceProps {
  /** The room's row in the rate calendar (content `rateType`, else its slug). */
  type: string;
  /** The content file's price: shown until the live rates load, and when there are none. */
  price: Price;
  /** The content file's AC price, for rooms with an AC version. */
  acPrice?: Price;
  large?: boolean;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function shortDate(d: string): string {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * A room's price from the manager's rate calendar (src/lib/liveRates.ts): for
 * the guest's dates when picked (StayDates), else tonight's rate per night.
 * Dates the manager marked sold out show "Sold out" instead of a price.
 */
export function RoomPrice({ type, price, acPrice, large = false }: RoomPriceProps) {
  const rates = useLiveRates();
  const { checkIn, checkOut } = useStayDates();
  const main = large ? 'text-ink text-2xl font-bold' : 'text-ink font-bold';
  const sub = 'text-stone text-[11px] leading-snug';

  const fallback = (
    <div>
      <p className={main}>{formatPrice(price)}</p>
      {acPrice !== undefined && acPrice !== 'TBD' && (
        <p className={sub}>AC: {inr(acPrice)} / night</p>
      )}
    </div>
  );
  if (!rates) return fallback;

  if (checkIn && checkOut) {
    const stay = stayRate(rates, type, checkIn, checkOut);
    if (stay.soldOutDates.length) {
      const shown = stay.soldOutDates.slice(0, 3).map(shortDate).join(', ');
      return (
        <div>
          <p className={`${large ? 'text-2xl' : ''} text-palash font-bold`}>Sold out</p>
          <p className={sub}>
            on {shown}
            {stay.soldOutDates.length > 3 ? ' and more' : ''}
          </p>
        </div>
      );
    }
    if (stay.total == null) return fallback;
    const nightsLabel = `for ${stay.nights} night${stay.nights === 1 ? '' : 's'}`;
    return (
      <div>
        <p className={main}>
          {inr(stay.total)} <span className="text-stone text-xs font-normal">{nightsLabel}</span>
        </p>
        <p className={sub}>
          {stay.flat
            ? `${inr(Math.round(stay.total / stay.nights))} / night`
            : 'Rate varies by night'}
        </p>
        {acPrice !== undefined && stay.acTotal != null && (
          <p className={sub}>
            AC: {inr(stay.acTotal)} {nightsLabel}
          </p>
        )}
      </div>
    );
  }

  const tonight = nightRate(rates, type, todayIso());
  if (tonight.rate == null) return fallback;
  return (
    <div>
      <p className={main}>{inr(tonight.rate)} / night</p>
      {acPrice !== undefined && tonight.ac != null && (
        <p className={sub}>AC: {inr(tonight.ac)} / night</p>
      )}
    </div>
  );
}
