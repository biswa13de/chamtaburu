import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { currentSite } from '../../content/site';
import { cottages, rooms } from '../../content/village';
import { Button } from './Button';
import { normalizePhone } from '../../lib/phone';
import { saveBookingRequest } from '../../lib/bookingRequest';

/**
 * Enquiry form — docs/02-architecture.md §8 and docs/05-build-phases.md
 * Phase 5. Two outputs on submit:
 *
 * 1. Primary — a `wa.me` deep link with the exact pre-composed message
 *    format from the architecture doc, opened in a new tab/window. This is
 *    a real `<a href>` (rendered only once validation passes and the
 *    message is built), not a JS-only `window.open`, so it's long-press/
 *    right-click-able on mobile and works even if popup-blocking interferes
 *    with a script-triggered `window.open`.
 * 2. Secondary — a fire-and-forget save to Firestore `bookingRequests`
 *    (src/lib/bookingRequest.ts, marked as from the Contact page) so nothing
 *    is lost if a guest is on desktop without WhatsApp, or WhatsApp fails to
 *    open. It shows under Booking requests in the Package Generator, and the
 *    office gets an email about it (scripts/request-alerts). Never blocks the
 *    WhatsApp link — a failed save is swallowed silently.
 *
 * `currentSite.whatsapp`/`currentSite.name` make this component work
 * unmodified on both Village and Resort builds — never hardcode a number
 * or greeting here.
 */

function formatDateForMessage(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

interface FormState {
  checkIn: string;
  checkOut: string;
  cottage: string;
  adults: string;
  children: string;
  name: string;
  phone: string;
}

const INITIAL_STATE: FormState = {
  checkIn: '',
  checkOut: '',
  cottage: '',
  adults: '2',
  children: '',
  name: '',
  phone: '',
};

type Errors = Partial<Record<keyof FormState, string>>;

// firestore.rules allows up to 30 adults and 30 children on a request.
const MAX_GUESTS = 30;

interface EnquiryFormProps {
  /** Preselect a cottage (e.g. arriving from a cottage detail page's "Enquire" button). */
  initialCottage?: string;
  /** Preselect the stay dates ("YYYY-MM-DD"), e.g. from the room list's date picker. */
  initialCheckIn?: string;
  initialCheckOut?: string;
  className?: string;
}

export function EnquiryForm({
  initialCottage,
  initialCheckIn,
  initialCheckOut,
  className = '',
}: EnquiryFormProps) {
  const idPrefix = useId();
  const isVillage = currentSite.key === 'village';
  const [values, setValues] = useState<FormState>({
    ...INITIAL_STATE,
    cottage: initialCottage ?? '',
    checkIn: initialCheckIn ?? '',
    checkOut: initialCheckOut ?? '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [whatsappHref, setWhatsappHref] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: people never see it, bots fill it

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setWhatsappHref(null);
    setSubmitted(false);
  }

  function validate(): { errors: Errors; normalizedPhone: string | null } {
    const next: Errors = {};

    if (!values.checkIn) next.checkIn = 'Check-in date is required.';
    if (!values.checkOut) next.checkOut = 'Check-out date is required.';
    if (values.checkIn && values.checkOut && values.checkOut <= values.checkIn) {
      next.checkOut = 'Check-out must be after check-in.';
    }

    if (isVillage && !values.cottage) {
      next.cottage = 'Please select a cottage or room.';
    }

    const adultsNum = Number(values.adults);
    if (!values.adults || !Number.isInteger(adultsNum) || adultsNum < 1) {
      next.adults = 'At least 1 adult is required.';
    } else if (adultsNum > MAX_GUESTS) {
      next.adults = `For more than ${MAX_GUESTS} adults, please call or WhatsApp us.`;
    }
    if (values.children) {
      const childrenNum = Number(values.children);
      if (!Number.isInteger(childrenNum) || childrenNum < 0) {
        next.children = 'Number of children must be 0 or more.';
      } else if (childrenNum > MAX_GUESTS) {
        next.children = `For more than ${MAX_GUESTS} children, please call or WhatsApp us.`;
      }
    }

    if (!values.name.trim()) next.name = 'Name is required.';

    const normalizedPhone = normalizePhone(values.phone);
    if (!values.phone.trim()) {
      next.phone = 'Phone number is required.';
    } else if (!normalizedPhone) {
      next.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    return { errors: next, normalizedPhone };
  }

  function buildMessage(normalizedPhone: string): string {
    const cottageName = isVillage
      ? ([...cottages, ...rooms].find((c) => c.slug === values.cottage)?.name ?? values.cottage)
      : values.cottage || undefined;

    const lines = [
      `Hi ${currentSite.name}! I'd like to enquire about a booking.`,
      '',
      ...(cottageName
        ? [`${rooms.some((r) => r.slug === values.cottage) ? 'Room' : 'Cottage'}: ${cottageName}`]
        : []),
      `Check-in: ${formatDateForMessage(values.checkIn)}`,
      `Check-out: ${formatDateForMessage(values.checkOut)}`,
      `Guests: ${values.adults} adult${values.adults === '1' ? '' : 's'}${
        values.children && values.children !== '0' ? `, ${values.children} child${values.children === '1' ? '' : 'ren'}` : ''
      }`,
      `Name: ${values.name.trim()}`,
      `Phone: ${normalizedPhone}`,
    ];
    return lines.join('\n');
  }

  // The enquiry as a booking request, so managers see it with the others and
  // can make a package from it. On the Resort the guest types what they're
  // interested in: that goes in the note, with no room picked.
  function saveEnquiry(normalizedPhone: string) {
    const unit = isVillage ? [...cottages, ...rooms].find((c) => c.slug === values.cottage) : undefined;
    const room = unit?.slug ?? 'any';
    const roomName = unit?.name ?? 'Any room';
    const interest = !isVillage && values.cottage.trim() ? `Interested in: ${values.cottage.trim()}` : '';
    saveBookingRequest({
      room,
      roomName,
      ac: false,
      items: [{ room, name: roomName, qty: 1, ac: false }],
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      adults: Number(values.adults),
      children: Number(values.children) || 0,
      name: values.name.trim(),
      phone: normalizedPhone.replace(/\D/g, ''),
      note: interest,
      estimate: 0,
      extras: [],
      source: 'contact',
    }).catch(() => {
      // Fire-and-forget: WhatsApp is the path of record, so a failed save is
      // not surfaced to the guest as an error.
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { errors: nextErrors, normalizedPhone } = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !normalizedPhone) {
      setWhatsappHref(null);
      setSubmitted(false);
      return;
    }

    const message = buildMessage(normalizedPhone);
    const href = `https://wa.me/${currentSite.whatsapp}?text=${encodeURIComponent(message)}`;
    setWhatsappHref(href);
    setSubmitted(true);
    if (!website) saveEnquiry(normalizedPhone); // a bot: WhatsApp link only, save nothing
  }

  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const errorId = (name: string) => `${idPrefix}-${name}-error`;

  const labelClass = 'block text-[10px] font-bold tracking-widest uppercase text-stone mb-1.5';
  const inputClass =
    'w-full rounded-lg border border-stone/20 bg-white px-4 py-2.5 text-sm text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20';
  const errorClass = 'mt-1 text-xs text-palash';

  return (
    <form
      className={`space-y-6 ${className}`}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldId('checkIn')} className={labelClass}>
            Check-in
          </label>
          <input
            id={fieldId('checkIn')}
            type="date"
            className={inputClass}
            value={values.checkIn}
            onChange={(e) => setField('checkIn', e.target.value)}
            aria-invalid={Boolean(errors.checkIn)}
            aria-describedby={errors.checkIn ? errorId('checkIn') : undefined}
          />
          {errors.checkIn && (
            <p id={errorId('checkIn')} className={errorClass} role="alert">
              {errors.checkIn}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('checkOut')} className={labelClass}>
            Check-out
          </label>
          <input
            id={fieldId('checkOut')}
            type="date"
            className={inputClass}
            value={values.checkOut}
            onChange={(e) => setField('checkOut', e.target.value)}
            aria-invalid={Boolean(errors.checkOut)}
            aria-describedby={errors.checkOut ? errorId('checkOut') : undefined}
          />
          {errors.checkOut && (
            <p id={errorId('checkOut')} className={errorClass} role="alert">
              {errors.checkOut}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={fieldId('cottage')} className={labelClass}>
          {isVillage ? 'Cottage or room' : 'What are you interested in?'}
        </label>
        {isVillage ? (
          <select
            id={fieldId('cottage')}
            className={inputClass}
            value={values.cottage}
            onChange={(e) => setField('cottage', e.target.value)}
            aria-invalid={Boolean(errors.cottage)}
            aria-describedby={errors.cottage ? errorId('cottage') : undefined}
          >
            <option value="">Select a cottage or room</option>
            <optgroup label="Cottages">
              {cottages.map((cottage) => (
                <option key={cottage.slug} value={cottage.slug}>
                  {cottage.number} · {cottage.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="First-floor rooms">
              {rooms.map((room) => (
                <option key={room.slug} value={room.slug}>
                  {room.name}
                </option>
              ))}
            </optgroup>
          </select>
        ) : (
          <input
            id={fieldId('cottage')}
            type="text"
            className={inputClass}
            placeholder="e.g. a room for 2 adults, a garden-view stay…"
            value={values.cottage}
            onChange={(e) => setField('cottage', e.target.value)}
          />
        )}
        {errors.cottage && (
          <p id={errorId('cottage')} className={errorClass} role="alert">
            {errors.cottage}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={fieldId('adults')} className={labelClass}>
            Adults
          </label>
          <input
            id={fieldId('adults')}
            type="number"
            min={1}
            className={inputClass}
            value={values.adults}
            onChange={(e) => setField('adults', e.target.value)}
            aria-invalid={Boolean(errors.adults)}
            aria-describedby={errors.adults ? errorId('adults') : undefined}
          />
          {errors.adults && (
            <p id={errorId('adults')} className={errorClass} role="alert">
              {errors.adults}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={fieldId('children')} className={labelClass}>
            Children <span className="normal-case text-stone">(optional)</span>
          </label>
          <input
            id={fieldId('children')}
            type="number"
            min={0}
            className={inputClass}
            value={values.children}
            onChange={(e) => setField('children', e.target.value)}
            aria-invalid={Boolean(errors.children)}
            aria-describedby={errors.children ? errorId('children') : undefined}
          />
          {errors.children && (
            <p id={errorId('children')} className={errorClass} role="alert">
              {errors.children}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={fieldId('name')} className={labelClass}>
          Name
        </label>
        <input
          id={fieldId('name')}
          type="text"
          autoComplete="name"
          className={inputClass}
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? errorId('name') : undefined}
        />
        {errors.name && (
          <p id={errorId('name')} className={errorClass} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={fieldId('phone')} className={labelClass}>
          Phone
        </label>
        <input
          id={fieldId('phone')}
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className={inputClass}
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? errorId('phone') : undefined}
        />
        {errors.phone && (
          <p id={errorId('phone')} className={errorClass} role="alert">
            {errors.phone}
          </p>
        )}
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

      <div className="flex flex-col items-start gap-4">
        <Button type="submit" variant="primary">
          Send Enquiry on WhatsApp
        </Button>

        {submitted && whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer noopener"
            className="text-forest hover:text-forest-deep text-sm font-semibold underline underline-offset-4"
          >
            Didn&rsquo;t open automatically? Tap here to continue on WhatsApp →
          </a>
        )}
      </div>

      {/* Auto-open WhatsApp the moment a valid link is built. A real <a>
          click (not window.open) so it's the same trusted-navigation path
          a manual click would take, and the visible link above remains as
          a fallback if the browser blocks the programmatic click. */}
      {submitted && whatsappHref && <AutoOpen href={whatsappHref} />}
    </form>
  );
}

// Clicks a hidden anchor once (in an effect, after commit — not during
// render) to hand off to WhatsApp. See the comment above. Keyed by href via
// the parent's conditional render, so a fresh click fires once per
// successful submission.
function AutoOpen({ href }: { href: string }) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer noopener';
    anchor.click();
  }, [href]);
  return null;
}
