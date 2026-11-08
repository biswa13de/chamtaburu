import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Seo } from '../ui/Seo';
import { StayDates } from '../ui/StayDates';
import { currentSite } from '../../content/site';
import { bookables, type Bookable } from '../../content/bookable';
import { resolveImage } from '../../content/manifest';
import {
  nightsBetween,
  stayRate,
  todayIso,
  useLiveRates,
  type LiveRates,
} from '../../lib/liveRates';
import { useStayDates } from '../../lib/stayDates';
import { normalizePhone } from '../../lib/phone';
import { saveBookingRequest } from '../../lib/bookingRequest';

// Each site uses its own photo: Village photos never appear on the Resort.
const HERO_IMAGE = resolveImage(
  currentSite.key === 'resort'
    ? {
        base: 'resort/resort-room-bamboo-cottage',
        alt: 'Thatched-roof bamboo cottages with colourful painted steps at Chamtaburu Eco Resort, Ajodhya Hills',
      }
    : {
        base: 'village/village-campus-cottage-swing',
        alt: 'White cottage with red tile roof, garden swing and lawn at Chamtaburu Eco Village, Ajodhya Hills',
      },
);

const PRICE_NOTE =
  currentSite.key === 'resort'
    ? 'Room only, with breakfast, before GST.'
    : 'Room only, before GST. Want meals included? Say so in the note.';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/meajprwj';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const longDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

interface Quote {
  nights: number;
  total: number | null;
  soldOutDates: string[];
}

// The room-only price for the stay: the rate calendar's when loaded, else the
// content price (null when there's none, e.g. "Price to be announced").
function quoteFor(
  unit: Bookable,
  ac: boolean,
  checkIn: string,
  checkOut: string,
  rates: LiveRates | null,
): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  const useAc = ac && unit.acPrice !== undefined;
  if (rates) {
    const s = stayRate(rates, unit.type, checkIn, checkOut);
    const total = useAc ? s.acTotal : s.total;
    if (total != null || s.soldOutDates.length)
      return { nights, total, soldOutDates: s.soldOutDates };
  }
  const per = useAc ? unit.acPrice : unit.price;
  return { nights, total: typeof per === 'number' ? per * nights : null, soldOutDates: [] };
}

const labelClass = 'mb-1.5 block text-[10px] font-bold tracking-widest text-stone uppercase';
const inputClass =
  'w-full rounded-lg border border-stone/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none';
const errorClass = 'mt-1 text-xs text-palash';

const FIELD_IDS = {
  dates: 'stay-in',
  room: 'book-room',
  adults: 'book-adults',
  name: 'book-name',
  phone: 'book-phone',
} as const;

type Errors = Partial<Record<'room' | 'dates' | 'adults' | 'name' | 'phone', string>>;

/**
 * /book — "Request to book". The guest picks a room and dates, sees the live
 * price and sold-out dates (src/lib/liveRates.ts), and sends a request. No
 * payment here: rooms are also sold on Booking.com and by phone, so a manager
 * checks availability and replies on WhatsApp with a package and its payment
 * link (the Package Generator lists these requests). Saved to Firestore
 * (src/lib/bookingRequest.ts), with an email copy through Formspree and an
 * optional WhatsApp message from the guest.
 */
export function Book() {
  const [params] = useSearchParams();
  const { checkIn, checkOut, mounted } = useStayDates();
  const rates = useLiveRates();

  const [room, setRoom] = useState('');
  const [ac, setAc] = useState(false);
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: people never see it, bots fill it
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [code, setCode] = useState('');
  const [whatsappHref, setWhatsappHref] = useState('');

  // The room from the link (?room=<slug>), once in the browser: the page is
  // prerendered without it.
  useEffect(() => {
    if (!mounted) return;
    const wanted = params.get('room');
    if (wanted && bookables.some((b) => b.slug === wanted)) setRoom(wanted);
    if (params.get('ac') === '1') setAc(true);
    // Only on arrival; the select takes over from there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // "Request sent" replaces the form: show it from the top.
  useEffect(() => {
    if (state === 'sent') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state]);

  const unit = bookables.find((b) => b.slug === room);
  const quote = unit && checkIn && checkOut ? quoteFor(unit, ac, checkIn, checkOut, rates) : null;
  const soldOut = !!quote && quote.soldOutDates.length > 0;
  const groups = [...new Set(bookables.map((b) => b.group))];

  function validate(): { errors: Errors; phone: string | null } {
    const next: Errors = {};
    if (!unit) next.room = 'Pick a room.';
    if (!checkIn || !checkOut) next.dates = 'Pick your check-in and check-out dates.';
    else if (checkIn < todayIso()) next.dates = 'Pick dates from today onwards.';
    else if (soldOut)
      next.dates = 'Some of these dates are sold out. Try other dates or another room.';
    const a = Number(adults);
    const k = Number(children || 0);
    if (!(Number.isInteger(a) && a >= 1 && a <= 30)) next.adults = 'Between 1 and 30 adults.';
    else if (!(Number.isInteger(k) && k >= 0 && k <= 30)) next.adults = 'Up to 30 children.';
    if (!name.trim()) next.name = 'Your name, please.';
    const normalized = normalizePhone(phone);
    if (!normalized) next.phone = 'A 10-digit Indian mobile number, please.';
    return { errors: next, phone: normalized };
  }

  function message(ref: string, normalizedPhone: string): string {
    if (!unit || !checkIn || !checkOut || !quote) return '';
    const k = Number(children) || 0;
    return [
      `Hi ${currentSite.name}! I'd like to book${ref ? ` (request ${ref})` : ''}.`,
      '',
      `Room: ${unit.name}${ac && unit.acPrice !== undefined ? ' (AC)' : ''}`,
      `Check-in: ${longDate(checkIn)}`,
      `Check-out: ${longDate(checkOut)} (${quote.nights} night${quote.nights === 1 ? '' : 's'})`,
      `Guests: ${adults} adult${adults === '1' ? '' : 's'}${k ? `, ${k} child${k === 1 ? '' : 'ren'}` : ''}`,
      `Name: ${name.trim()}`,
      `Phone: ${normalizedPhone}`,
      ...(note.trim() ? [`Note: ${note.trim()}`] : []),
      ...(quote.total != null ? [`Price shown: ${inr(quote.total)} (${PRICE_NOTE})`] : []),
    ].join('\n');
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { errors: next, phone: normalizedPhone } = validate();
    setErrors(next);
    // Take the guest to the first thing to fix: on a phone it may be off screen.
    const first = (['dates', 'room', 'adults', 'name', 'phone'] as const).find((k) => next[k]);
    if (first) {
      // After React has drawn the messages, so the dates' one exists to scroll to.
      setTimeout(() => {
        const el = document.getElementById(FIELD_IDS[first]);
        // The dates' message sits under the whole date card: show that.
        const target = first === 'dates' ? document.getElementById('book-dates-error') : el;
        // Focus first: focusing after would cancel the smooth scroll.
        el?.focus({ preventScroll: true });
        (target ?? el)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
    if (Object.keys(next).length || !normalizedPhone || !unit || !checkIn || !checkOut || !quote)
      return;
    if (website) {
      setState('sent'); // a bot: look done, save nothing
      return;
    }
    setState('sending');
    let ref = '';
    try {
      ref = await saveBookingRequest({
        room: unit.slug,
        roomName: unit.name,
        ac: ac && unit.acPrice !== undefined,
        checkIn,
        checkOut,
        adults: Math.round(Number(adults)),
        children: Math.max(0, Math.round(Number(children) || 0)),
        name: name.trim(),
        phone: normalizedPhone.replace(/\D/g, ''),
        note: note.trim(),
        estimate: quote.total ?? 0,
      });
    } catch {
      // Not saved: the WhatsApp message below is then the request.
    }
    const text = message(ref, normalizedPhone);
    setWhatsappHref(`https://wa.me/${currentSite.whatsapp}?text=${encodeURIComponent(text)}`);
    setCode(ref);
    setState(ref ? 'sent' : 'failed');
    void fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Booking request${ref ? ` ${ref}` : ''} — ${currentSite.name}`,
        name: name.trim(),
        phone: normalizedPhone,
        message: text,
      }),
    }).catch(() => {
      // Email is a copy; the request (or WhatsApp) is the record.
    });
  }

  return (
    <div className="pb-24">
      <Seo
        title="Request to Book"
        description={`Pick your room and dates at ${currentSite.name}, see the price, and send a booking request. We confirm availability on WhatsApp.`}
        path="/book"
      />
      <Hero
        image={HERO_IMAGE}
        heading="Request to Book"
        subheading={currentSite.name}
        size="compact"
      />

      {state === 'sent' ? (
        <Section className="mt-16">
          <Card className="mx-auto max-w-2xl p-8 text-center sm:p-10">
            <CheckCircle2 className="text-forest mx-auto mb-4" size={40} aria-hidden="true" />
            <h2 className="mb-2 font-serif text-3xl font-medium">Request sent</h2>
            {code && (
              <p className="text-ink mb-4 text-sm">
                Your request number is <strong className="tracking-widest">{code}</strong>.
              </p>
            )}
            <p className="text-stone mx-auto max-w-lg text-sm leading-relaxed">
              We&rsquo;ll check availability and message you on WhatsApp with your package: the
              total with GST and a link to pay the advance. Nothing to pay now.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {whatsappHref && (
                <Button
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  Message us on WhatsApp
                </Button>
              )}
              <Button to="/" variant="secondary">
                Back to home
              </Button>
            </div>
            {whatsappHref && (
              <p className="text-stone mt-4 text-xs">
                Optional: a message on WhatsApp gets you a reply sooner.
              </p>
            )}
          </Card>
        </Section>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Section className="mt-16">
            <StayDates note={`Prices are per room per night. ${PRICE_NOTE}`} />
            {errors.dates && (
              <p id="book-dates-error" className={`${errorClass} mt-2`} role="alert">
                {errors.dates}
              </p>
            )}
          </Section>

          <Section className="mt-8">
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
              <Card className="space-y-6 p-6 sm:p-8">
                <div>
                  <label htmlFor="book-room" className={labelClass}>
                    Room
                  </label>
                  <select
                    id="book-room"
                    className={inputClass}
                    value={room}
                    onChange={(e) => {
                      setRoom(e.target.value);
                      setAc(false);
                    }}
                    aria-invalid={Boolean(errors.room)}
                  >
                    <option value="">Pick a room</option>
                    {groups.map((g) => (
                      <optgroup key={g} label={g}>
                        {bookables
                          .filter((b) => b.group === g)
                          .map((b) => (
                            <option key={b.slug} value={b.slug}>
                              {b.name}
                              {b.ac ? ' · AC' : ''}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.room && (
                    <p className={errorClass} role="alert">
                      {errors.room}
                    </p>
                  )}
                  {unit?.acPrice !== undefined && (
                    <label className="text-ink mt-3 flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={ac}
                        onChange={(e) => setAc(e.target.checked)}
                        className="accent-forest h-4 w-4"
                      />
                      AC room
                    </label>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="book-adults" className={labelClass}>
                      Adults
                    </label>
                    <input
                      id="book-adults"
                      type="number"
                      min={1}
                      max={30}
                      inputMode="numeric"
                      className={inputClass}
                      value={adults}
                      onChange={(e) => setAdults(e.target.value)}
                      aria-invalid={Boolean(errors.adults)}
                    />
                    {errors.adults && (
                      <p className={errorClass} role="alert">
                        {errors.adults}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="book-children" className={labelClass}>
                      Children
                    </label>
                    <input
                      id="book-children"
                      type="number"
                      min={0}
                      max={30}
                      inputMode="numeric"
                      className={inputClass}
                      value={children}
                      onChange={(e) => setChildren(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="book-name" className={labelClass}>
                      Your name
                    </label>
                    <input
                      id="book-name"
                      autoComplete="name"
                      maxLength={80}
                      className={inputClass}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name && (
                      <p className={errorClass} role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="book-phone" className={labelClass}>
                      WhatsApp number
                    </label>
                    <input
                      id="book-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      className={inputClass}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && (
                      <p className={errorClass} role="alert">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="book-note" className={labelClass}>
                    Note <span className="text-stone/70 normal-case">(optional)</span>
                  </label>
                  <textarea
                    id="book-note"
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. meals included, arriving late, a birthday"
                    className={inputClass}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Honeypot: hidden from people, filled in by bots. */}
                <div className="hidden" aria-hidden="true">
                  <label>
                    Website
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </label>
                </div>
              </Card>

              <Card className="space-y-4 p-6 sm:p-8 lg:sticky lg:top-24">
                <h2 className="font-serif text-2xl font-medium">Your stay</h2>
                {unit && quote && checkIn && checkOut ? (
                  <>
                    <p className="text-ink text-sm font-semibold">
                      {unit.name}
                      {ac && unit.acPrice !== undefined ? ' (AC)' : ''}
                    </p>
                    <p className="text-stone text-sm">
                      {longDate(checkIn)} – {longDate(checkOut)} · {quote.nights} night
                      {quote.nights === 1 ? '' : 's'}
                    </p>
                    {soldOut ? (
                      <p className="text-palash text-sm font-semibold">
                        Sold out on {quote.soldOutDates.map(longDate).join(', ')}.
                      </p>
                    ) : quote.total != null ? (
                      <div>
                        <p className="text-ink text-2xl font-bold">{inr(quote.total)}</p>
                        <p className="text-stone text-xs">{PRICE_NOTE}</p>
                      </div>
                    ) : (
                      <p className="text-stone text-sm">We&rsquo;ll send you the price.</p>
                    )}
                  </>
                ) : (
                  <p className="text-stone text-sm">Pick a room and your dates to see the price.</p>
                )}

                <ol className="text-stone list-decimal space-y-1 pl-5 text-xs leading-relaxed">
                  <li>Send your request. Nothing to pay now.</li>
                  <li>We check availability and message you on WhatsApp with your package.</li>
                  <li>Pay the advance online to confirm.</li>
                </ol>

                {state === 'failed' && (
                  <div className="bg-palash/10 rounded-lg p-4 text-sm">
                    <p className="text-ink mb-3">
                      We couldn&rsquo;t send your request just now. Send it on WhatsApp instead:
                    </p>
                    <Button
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      Send on WhatsApp
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={state === 'sending' || soldOut}
                >
                  {state === 'sending' ? 'Sending…' : 'Send booking request'}
                </Button>
              </Card>
            </div>
          </Section>
        </form>
      )}
    </div>
  );
}
