import { Link } from 'react-router-dom';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Image } from '../ui/Image';
import { Seo } from '../ui/Seo';
import { village, cottages } from '../../content/village';
import { resolveImage } from '../../content/manifest';
import { formatPrice, formatAdults } from '../../content/format';

const HERO_IMAGE = resolveImage({
  base: 'village/village-room-wide',
  alt: 'Wide cottage bedroom interior showing bed, desk area and wood floor at Chamtaburu Eco Village, Ajodhya Hills',
});

// /cottages — grid of all seven, with price and capacity. Village-only route
// (docs/01-strategy.md §3): the Resort has no cottages, so this page and
// component are never wired into the Resort route tree.
export function Cottages() {
  return (
    <div className="pb-24">
      <Seo
        title="The Seven Cottages"
        description={`Seven named cottages, each with its own story and character, at ${village.name} in the Ajodhya Hills, Purulia.`}
        path="/cottages"
      />
      <Hero
        image={HERO_IMAGE}
        heading="The Seven Cottages"
        subheading={village.name}
        size="compact"
      />

      <Section className="mt-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {cottages.map((cottage) => {
            // Build-time validation (src/content/validate.ts) guarantees every
            // cottage has a non-empty images array, so the fallback ImageRef
            // below never actually resolves — it only satisfies
            // noUncheckedIndexedAccess.
            const coverImageRef = cottage.images[0] ?? {
              base: 'village/village-exterior',
              alt: cottage.name,
            };
            const coverImage = resolveImage(coverImageRef);
            return (
              <Card key={cottage.slug}>
                <Link to={`/cottages/${cottage.slug}`}>
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
                </Link>
                <div className="space-y-3 p-6">
                  <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
                    {cottage.number} · {cottage.theme}
                  </p>
                  <Link to={`/cottages/${cottage.slug}`} className="hover:text-forest block">
                    <h3 className="text-lg font-bold">{cottage.name}</h3>
                  </Link>
                  <p className="text-stone text-xs leading-relaxed">{cottage.tagline}</p>
                  {!cottage.available && (
                    <p className="text-stone/70 text-[10px] font-semibold tracking-widest uppercase">
                      Opening soon
                    </p>
                  )}
                  <div className="text-stone flex items-center justify-between pt-2 text-xs">
                    <span>{formatAdults(cottage.occupancy.adults)}</span>
                    <span>{cottage.beds === 'TBD' ? 'Beds TBD' : cottage.beds}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-ink font-bold">{formatPrice(cottage.price)}</span>
                    <Link
                      to={`/cottages/${cottage.slug}`}
                      className="bg-forest/10 text-forest hover:bg-forest inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors hover:text-white"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
