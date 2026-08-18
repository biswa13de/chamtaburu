import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Image } from '../ui/Image';
import { resort, accommodation } from '../../content/resort';
import { resolveImage } from '../../content/manifest';
import { formatPrice, formatAdults } from '../../content/format';

const HERO_IMAGE = resolveImage({
  base: 'village/village-room-wide',
  alt: 'Wide cottage bedroom interior showing bed, desk area and wood floor at Chamtaburu Eco Village, Ajodhya Hills',
});

// resort.chamtaburu.in's /accommodation — room types and prices. The
// underlying `accommodation` array is intentionally empty until Phase 7
// (docs/06-open-questions.md Q3: the old prototype's room list/prices are
// unverified and not carried forward). This page renders real rows once
// they exist and an honest "coming soon" note while the array is empty —
// never fabricated room types or prices.
export function Accommodation() {
  return (
    <div className="pb-24">
      <Hero image={HERO_IMAGE} heading="Accommodation" subheading={resort.name} size="compact" />

      <Section className="mt-16">
        {accommodation.length === 0 ? (
          <Card className="p-10 text-center">
            <h2 className="mb-2 font-serif text-2xl font-medium">Room details coming soon</h2>
            <p className="text-stone mx-auto max-w-xl text-sm leading-relaxed">
              Confirmed room types, capacity and pricing for {resort.name} are being finalized. In
              the meantime, reach out and we&rsquo;ll help with availability.
            </p>
            <Button to="/contact" variant="primary" className="mt-6">
              Enquire Now
            </Button>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {accommodation.map((room) => {
              const coverImageRef = room.images[0] ?? {
                base: 'village/village-exterior',
                alt: room.name,
              };
              const coverImage = resolveImage(coverImageRef);
              return (
                <Card key={room.slug}>
                  <Image
                    src={coverImage.fallbackSrc}
                    avifSrcSet={coverImage.avifSrcSet}
                    webpSrcSet={coverImage.webpSrcSet}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    lqip={coverImage.lqip}
                    alt={coverImage.alt}
                    width={coverImage.width}
                    height={coverImage.height}
                    className="h-64 w-full object-cover"
                  />
                  <div className="space-y-3 p-6">
                    <h3 className="text-lg font-bold">{room.name}</h3>
                    <p className="text-stone text-xs leading-relaxed">{room.tagline}</p>
                    <div className="text-stone flex items-center justify-between pt-2 text-xs">
                      <span>{formatAdults(room.occupancy.adults)}</span>
                      <span>{room.beds === 'TBD' ? 'Beds TBD' : room.beds}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-ink font-bold">{formatPrice(room.price)}</span>
                      <Button to="/contact" variant="secondary" className="px-5 py-2 text-[10px]">
                        Enquire
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
