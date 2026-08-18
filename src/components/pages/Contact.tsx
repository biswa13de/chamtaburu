import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { currentSite } from '../../content/site';
import { resolveImage } from '../../content/manifest';

// Real embedded map / drive times need a Maps API key and confirmed geo
// coordinates, neither of which exist yet (docs/06-open-questions.md Q6,
// Q8) — see src/content/village.ts's `geo: undefined`. Rather than invent
// coordinates or drive times, this page links out to a Google Maps search
// by address, which needs no API key and no coordinates.
const HERO_IMAGE = resolveImage({
  base: 'village/village-entrance-steps',
  alt: 'Granite entrance steps with potted plants at a Chamtaburu Eco Village cottage, Ajodhya Hills',
});

export function Contact() {
  const { address } = currentSite;
  const fullAddress = `${address.street}, ${address.locality}, ${address.district}, ${address.region} ${address.postalCode}, India`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="pb-24">
      <Hero image={HERO_IMAGE} heading="Contact Us" subheading={currentSite.name} size="compact" />

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
                  Front Desk Hours
                </h2>
                <p className="text-stone text-sm">Hours to be confirmed</p>
              </div>
            </div>
          </div>

          {/* No Maps API key / confirmed geo coordinates exist yet — an
              honest placeholder plus a directions link, not a fake embed. */}
          <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-2xl bg-white shadow-sm">
            <p className="text-stone text-sm">Map coming soon</p>
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
        </div>
      </Section>
    </div>
  );
}
