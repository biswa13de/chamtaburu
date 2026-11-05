import { Info, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Seo } from '../ui/Seo';
import { currentSite } from '../../content/site';
import { resolveImage } from '../../content/manifest';
import { sightseeingDays, sightseeingFacts, sightseeingTips } from '../../content/sightseeing';
import { siteOrigin } from '../../lib/seo';

const HERO_IMAGE = resolveImage({
  base: 'resort/resort-hero-mist',
  alt: 'Monsoon mist over the forested hills behind the cottages at Chamtaburu Eco Resort, Ajodhya Hills, Purulia',
});

// One accent per day, cycling through the brand palette (src/index.css).
// Full class strings, not built ones, so Tailwind can see them.
const DEFAULT_ACCENT = { bar: 'bg-terracotta', pill: 'bg-terracotta' };
const DAY_ACCENTS = [
  DEFAULT_ACCENT,
  { bar: 'bg-forest', pill: 'bg-forest' },
  { bar: 'bg-palash', pill: 'bg-palash' },
];

function buildTouristTripJsonLd(): Record<string, unknown> {
  const { address } = currentSite;
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: `3-Day Purulia Sightseeing from ${currentSite.name}`,
    description:
      'A relaxed 3-day itinerary covering Ajodhya Pahar, Marble Lake, Bamni and Turga Falls, Charida Chhau mask village, Joychandi Pahar, Garh Panchakot, Panchet and Baranti.',
    touristType: ['Nature lovers', 'Families', 'Photographers'],
    provider: {
      '@type': 'LodgingBusiness',
      name: currentSite.name,
      url: siteOrigin(currentSite),
      address: {
        '@type': 'PostalAddress',
        addressLocality: address.locality,
        addressRegion: address.region,
        addressCountry: address.country,
      },
    },
    itinerary: {
      '@type': 'ItemList',
      itemListElement: sightseeingDays.map((day, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `Day ${i + 1}: ${day.slots.flatMap((slot) => slot.stops.map((stop) => stop.name)).join(', ')}`,
      })),
    },
  };
}

export function Sightseeing() {
  const phone = currentSite.phones[0];
  const whatsappMessage = `Hi ${currentSite.name}, I'd like to book the Purulia sightseeing trip.`;
  const whatsappHref = `https://wa.me/${currentSite.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="pb-24">
      <Seo
        title="Purulia Sightseeing Plan"
        description={`A relaxed 3-day Purulia sightseeing plan from ${currentSite.name} — Ajodhya Pahar, Marble Lake, Turga Falls, Charida Chhau masks, Garh Panchakot and Baranti.`}
        path="/sightseeing"
        jsonLd={[buildTouristTripJsonLd()]}
      />
      <Hero
        image={HERO_IMAGE}
        heading="Purulia Sightseeing"
        subheading="3 days from the resort"
        size="compact"
      />

      <Section className="mt-16" narrow>
        <span className="bg-forest/10 text-forest inline-block rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.15em] uppercase">
          3 days · From {currentSite.name}, {currentSite.address.locality}
        </span>
        <h2 className="mt-4 mb-3 font-serif text-4xl leading-tight font-medium md:text-5xl">
          Purulia, <em className="text-terracotta not-italic">at an easy pace</em>
        </h2>
        <p className="text-stone max-w-2xl leading-relaxed">
          Red-soil roads, sal forests, quiet dams and the hills of Ajodhya. Here&rsquo;s the plan
          our guests enjoy most. We&rsquo;re happy to slow it down, swap stops or stretch it into a
          longer stay.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {sightseeingFacts.map((fact) => (
            <div
              key={fact.value}
              className="rounded-xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <dt className="font-serif text-xl font-semibold">{fact.value}</dt>
              <dd className="text-stone mt-0.5 text-xs leading-snug">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section className="mt-12 space-y-6" narrow>
        {sightseeingDays.map((day, i) => {
          const accent = DAY_ACCENTS[i % DAY_ACCENTS.length] ?? DEFAULT_ACCENT;
          return (
            <Card key={day.title} className="relative p-6 pl-8 md:p-8 md:pl-10">
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1.5 ${accent.bar}`}
              />
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span
                  className={`${accent.pill} rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.15em] text-white uppercase`}
                >
                  Day {i + 1}
                </span>
                <h3 className="font-serif text-2xl leading-tight font-medium md:text-3xl">
                  {day.title}
                </h3>
              </div>
              <p className="text-stone mt-3 text-sm leading-relaxed">{day.intro}</p>

              {day.slots.map((slot) => (
                <div key={slot.label} className="mt-6">
                  <h4 className="text-stone mb-3 flex items-center gap-3 text-[11px] font-bold tracking-[0.15em] uppercase after:h-px after:flex-1 after:bg-black/10">
                    {slot.label}
                  </h4>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {slot.stops.map((stop) => (
                      <li key={stop.name} className="bg-sand flex gap-3 rounded-lg p-3.5">
                        <MapPin
                          size={16}
                          className="text-forest mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-sm font-semibold">{stop.name}</p>
                          <p className="text-stone mt-0.5 text-xs leading-relaxed">
                            {stop.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {day.note && (
                <p className="border-terracotta/40 bg-terracotta/5 text-ink mt-6 flex gap-3 rounded-lg border border-dashed p-3.5 text-sm leading-relaxed">
                  <Info size={16} className="text-terracotta mt-0.5 shrink-0" aria-hidden="true" />
                  {day.note}
                </p>
              )}
            </Card>
          );
        })}
      </Section>

      <Section className="mt-16" narrow>
        <h2 className="mb-6 font-serif text-3xl font-medium">Good to know</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sightseeingTips.map((tip) => (
            <div key={tip.title} className="bg-forest/10 rounded-xl p-5">
              <h3 className="text-forest-deep mb-1 font-semibold">{tip.title}</h3>
              <p className="text-ink/80 text-sm leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="mt-16" narrow>
        <div className="bg-forest-deep flex flex-col gap-6 rounded-2xl p-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium md:text-3xl">
              Want this trip planned for your dates?
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Message us and we&rsquo;ll arrange your stay, car and route.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer noopener"
              className="text-forest-deep inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:bg-white/90"
            >
              <MessageCircle size={16} aria-hidden="true" />
              WhatsApp us
            </a>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase transition-colors hover:bg-white/10"
              >
                <Phone size={16} aria-hidden="true" />
                Call us
              </a>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
