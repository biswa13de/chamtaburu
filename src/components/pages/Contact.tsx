import { useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Navigation, Car, Train } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { EnquiryForm } from '../ui/EnquiryForm';
import { Seo } from '../ui/Seo';
import { currentSite } from '../../content/site';
import { resolveImage } from '../../content/manifest';
import { isDate } from '../../lib/liveRates';

// The map is Google's embed of each property's own pin (`mapEmbedUrl` in
// src/content/village.ts / resort.ts), which needs no API key; the CSP
// allows www.google.com frames. Drive times are the owner's (2026-11-08).
//
// Each site uses its own photo: Village photos must never appear on
// resort.chamtaburu.in and vice versa.
const HERO_IMAGE = resolveImage(
  currentSite.key === 'resort'
    ? {
        base: 'resort/resort-thatched-huts',
        alt: 'Two thatched bamboo huts framed by hedge and hills at Chamtaburu Eco Resort, Ajodhya Hills',
      }
    : {
        base: 'village/village-campus-main-building',
        alt: 'Main building, lawns and red-roofed cottages under a blue sky at Chamtaburu Eco Village, Ajodhya Hills',
      },
);

const DRIVE_TIMES: [string, string][] = [
  ['Ranchi', 'about 3 hrs'],
  ['Durgapur', 'about 4½ hrs'],
  ['Kolkata', '6–7 hrs'],
];

export function Contact() {
  const { address } = currentSite;
  const fullAddress = `${address.street}, ${address.locality}, ${address.district}, ${address.region} ${address.postalCode}, India`;
  // Prefer the confirmed pin (docs/06-open-questions.md Q6) when available;
  // fall back to an address search for sites without one yet.
  const mapsSearchUrl =
    currentSite.mapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Arriving from a cottage detail page's "Enquire" button — see
  // src/components/pages/CottageDetail.tsx — preselects the cottage in the
  // form below via ?cottage=<slug> rather than making the guest re-select
  // what they already told us they were interested in.
  const [searchParams] = useSearchParams();
  const initialCottage = searchParams.get('cottage') ?? undefined;
  // And the dates picked on the room list (src/components/ui/StayDates.tsx).
  const initialCheckIn = isDate(searchParams.get('in'))
    ? (searchParams.get('in') ?? undefined)
    : undefined;
  const initialCheckOut = isDate(searchParams.get('out'))
    ? (searchParams.get('out') ?? undefined)
    : undefined;

  return (
    <div className="pb-24">
      <Seo
        title="Contact Us"
        description={`Get in touch with ${currentSite.name} — phone, WhatsApp and enquiry form. ${fullAddress}.`}
        path="/contact"
      />
      <Hero image={HERO_IMAGE} heading="Contact Us" subheading={currentSite.name} size="compact" />

      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">Send an Enquiry</h2>
        <Card className="max-w-2xl p-8">
          <EnquiryForm
            initialCottage={initialCottage}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
          />
        </Card>
      </Section>

      <Section className="mt-16">
        <div className="grid gap-16 md:grid-cols-2">
          <div className="space-y-8">
            <div className="flex gap-4">
              <MapPin className="text-forest shrink-0" size={20} aria-hidden="true" />
              <div>
                <h2 className="text-stone mb-1 text-[10px] font-bold tracking-widest uppercase">
                  Our Location
                </h2>
                <p className="text-stone text-sm leading-relaxed">{fullAddress}</p>
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-forest hover:text-forest-deep mt-2 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase"
                >
                  <Navigation size={14} aria-hidden="true" />
                  Get Directions
                </a>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="text-forest shrink-0" size={20} aria-hidden="true" />
              <div>
                <h2 className="text-stone mb-1 text-[10px] font-bold tracking-widest uppercase">
                  Phone
                </h2>
                {currentSite.phones.map((phone) => (
                  <p key={phone} className="text-stone text-sm">
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-forest">
                      {phone}
                    </a>
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="text-forest shrink-0" size={20} aria-hidden="true" />
              <div>
                <h2 className="text-stone mb-1 text-[10px] font-bold tracking-widest uppercase">
                  Email
                </h2>
                <p className="text-stone text-sm">
                  <a href={`mailto:${currentSite.email}`} className="hover:text-forest">
                    {currentSite.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="text-forest shrink-0" size={20} aria-hidden="true" />
              <div>
                <h2 className="text-stone mb-1 text-[10px] font-bold tracking-widest uppercase">
                  Reception &amp; Timings
                </h2>
                <p className="text-stone text-sm">Reception: {currentSite.receptionHours}</p>
                <p className="text-stone text-sm">
                  Check-in: {currentSite.checkIn} · Check-out: {currentSite.checkOut}
                </p>
              </div>
            </div>
          </div>

          {currentSite.mapEmbedUrl ? (
            <iframe
              src={currentSite.mapEmbedUrl}
              title={`Map showing ${currentSite.name}`}
              className="h-[400px] w-full rounded-2xl border-0 bg-white shadow-sm"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-2xl bg-white shadow-sm">
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-forest/10 text-forest hover:bg-forest inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:text-white"
              >
                <Navigation size={14} aria-hidden="true" />
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </Section>

      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">Getting Here</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <p className="text-ink mb-3 flex items-center gap-2 text-sm font-semibold">
              <Car size={18} className="text-forest" aria-hidden="true" /> By road
            </p>
            <ul className="text-stone space-y-1.5 text-sm">
              {DRIVE_TIMES.map(([from, time]) => (
                <li key={from} className="flex justify-between gap-4">
                  <span>From {from}</span>
                  <span className="text-ink font-semibold">{time}</span>
                </li>
              ))}
            </ul>
            <p className="text-stone mt-3 text-xs">Approximate driving times.</p>
          </Card>
          <Card className="p-6">
            <p className="text-ink mb-3 flex items-center gap-2 text-sm font-semibold">
              <Train size={18} className="text-forest" aria-hidden="true" /> By train
            </p>
            <p className="text-stone text-sm leading-relaxed">
              The nearest stations are Purulia and Barabhum. We can pick you up and drop you back by
              car: tick it when you{' '}
              <Link to="/book" className="text-forest font-semibold">
                request to book
              </Link>
              .
            </p>
          </Card>
        </div>
      </Section>
    </div>
  );
}
