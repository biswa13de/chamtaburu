import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Image } from '../ui/Image';
import { village, cottages, experiences } from '../../content/village';
import type { Price } from '../../content/types';

// TODO(Phase 4): site selection should be driven by VITE_SITE, not a
// hardcoded import of the village content.
function formatPrice(price: Price): string {
  return price === 'TBD' ? 'Price to be announced' : `₹${price.toLocaleString('en-IN')} / night`;
}

export function Accommodations() {
  return (
    <div className="pb-24">
      <Hero
        image={{
          src: '/img/village/shared-pool/village-room-wide.jpg',
          alt: 'Cottage bedroom interior at Chamtaburu Eco Village, Ajodhya Hills',
          width: 1920,
          height: 400,
        }}
        heading="Cottages & Experiences"
        subheading={`Stays and experiences at ${village.name}.`}
        size="compact"
      />

      <Section className="mt-16">
        <h2 className="mb-8 font-serif text-3xl font-medium">The Seven Cottages</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cottages.map((cottage) => {
            // Build-time validation (src/content/validate.ts) guarantees every
            // cottage has a non-empty images array, so this fallback never
            // actually renders — it only satisfies noUncheckedIndexedAccess.
            const coverImage = cottage.images[0] ?? { src: '', alt: cottage.name };
            return (
              <Card key={cottage.slug}>
                <Image
                  src={coverImage.src}
                  alt={coverImage.alt}
                  width={800}
                  height={600}
                  className="h-64 w-full object-cover"
                />
                <div className="space-y-3 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-forest">
                    {cottage.number} · {cottage.theme}
                  </p>
                  <h3 className="text-lg font-bold">{cottage.name}</h3>
                  <p className="text-xs leading-relaxed text-stone">{cottage.tagline}</p>
                  {!cottage.available && (
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone/70">Opening soon</p>
                  )}
                  <div className="flex items-center justify-between pt-4">
                    <span className="font-bold text-ink">{formatPrice(cottage.price)}</span>
                    <Button to="/contact" variant="secondary" className="px-5 py-2 text-[10px]">
                      Enquire
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="mt-16">
        <h2 className="mb-8 font-serif text-3xl font-medium">Experiences</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => (
            <Card key={experience.slug}>
              <div className="space-y-3 p-6">
                <h3 className="text-lg font-bold">{experience.title}</h3>
                <p className="text-xs leading-relaxed text-stone">{experience.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
