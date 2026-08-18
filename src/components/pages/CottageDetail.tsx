import { useParams, Navigate, Link } from 'react-router-dom';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Image } from '../ui/Image';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Prose } from '../ui/Prose';
import { cottages } from '../../content/village';
import { resolveImage } from '../../content/manifest';
import { formatPrice, formatAdults } from '../../content/format';
import type { Cottage } from '../../content/types';

function CottageGallery({ cottage }: { cottage: Cottage }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cottage.images.map((ref) => {
        const image = resolveImage(ref);
        return (
          <Image
            key={ref.base}
            src={image.fallbackSrc}
            avifSrcSet={image.avifSrcSet}
            webpSrcSet={image.webpSrcSet}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            lqip={image.lqip}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        );
      })}
    </div>
  );
}

export function CottageDetail() {
  const { slug } = useParams<{ slug: string }>();
  const cottage = cottages.find((c) => c.slug === slug);

  if (!cottage) {
    return <Navigate to="/404" replace />;
  }

  const heroImageRef = cottage.images[0] ?? { base: 'village/village-exterior', alt: cottage.name };
  const heroImage = resolveImage(heroImageRef);
  const otherCottages = cottages.filter((c) => c.slug !== cottage.slug);

  return (
    <div className="pb-24">
      {/* 1. Hero — cottage photo, name, number, tagline */}
      <Hero image={heroImage} heading={cottage.name} subheading={cottage.tagline} size="compact" />

      <Section className="mt-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Cottages', to: '/cottages' },
            { label: cottage.name },
          ]}
        />
      </Section>

      <Section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-forest text-[10px] font-bold tracking-widest uppercase">
            Cottage {cottage.number} · {cottage.theme}
          </span>
          {!cottage.available && (
            <span className="bg-stone/10 text-stone rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest uppercase">
              Opening soon
            </span>
          )}
        </div>
      </Section>

      {/* 2. The Story — guest story card text, verbatim */}
      <Section className="mt-12">
        <h2 className="mb-6 font-serif text-3xl font-medium">The Story</h2>
        <Prose className="max-w-3xl text-base whitespace-pre-line">{cottage.story}</Prose>
      </Section>

      {/* 3. Inspiration */}
      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">Inspiration</h2>
        <Prose className="max-w-3xl text-base">{cottage.inspiration}</Prose>
      </Section>

      {/* 4. The Cottage — gallery, occupancy, beds, amenities */}
      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">The Cottage</h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <p className="text-stone text-[10px] font-bold tracking-widest uppercase">Occupancy</p>
            <p className="mt-1 text-lg font-semibold">{formatAdults(cottage.occupancy.adults)}</p>
            {cottage.occupancy.children !== undefined && (
              <p className="text-stone text-xs">+ {cottage.occupancy.children} children</p>
            )}
          </Card>
          <Card className="p-6">
            <p className="text-stone text-[10px] font-bold tracking-widest uppercase">Beds</p>
            <p className="mt-1 text-lg font-semibold">
              {cottage.beds === 'TBD' ? 'TBD' : cottage.beds}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-stone text-[10px] font-bold tracking-widest uppercase">Amenities</p>
            <p className="mt-1 text-lg font-semibold">
              {cottage.amenities.length > 0 ? cottage.amenities.join(', ') : 'To be confirmed'}
            </p>
          </Card>
        </div>
        <CottageGallery cottage={cottage} />
      </Section>

      {/* 5. Interior character */}
      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">Interior Character</h2>
        <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
          {cottage.interiorNotes.map((note) => (
            <li key={note} className="text-stone flex items-center gap-3 text-sm">
              <span className="bg-forest h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true" />
              {note}
            </li>
          ))}
        </ul>
      </Section>

      {/* 6. Your photo point (optional) */}
      {cottage.photoPoint && (
        <Section className="mt-16">
          <h2 className="mb-6 font-serif text-3xl font-medium">Your Photo Point</h2>
          <p className="text-stone max-w-3xl text-sm leading-relaxed">{cottage.photoPoint}</p>
        </Section>
      )}

      {/* 7. Price + Enquire CTA */}
      <Section className="mt-16">
        <Card className="flex flex-col items-center gap-4 p-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-stone text-[10px] font-bold tracking-widest uppercase">Price</p>
            <p className="text-ink text-2xl font-bold">{formatPrice(cottage.price)}</p>
          </div>
          <Button to="/contact" variant="primary">
            Enquire About {cottage.name}
          </Button>
        </Card>
      </Section>

      {/* 8. Nearby — links to Experiences */}
      <Section className="mt-16">
        <h2 className="mb-4 font-serif text-3xl font-medium">Nearby</h2>
        <p className="text-stone mb-6 max-w-3xl text-sm leading-relaxed">
          Just steps from {cottage.name}: the evening bonfire, the nature trail and the rest of the
          property&rsquo;s experiences.
        </p>
        <Button to="/experiences" variant="secondary">
          Explore Experiences
        </Button>
      </Section>

      {/* 9. Other cottages — cross-links to the remaining six */}
      <Section className="mt-16">
        <h2 className="mb-6 font-serif text-3xl font-medium">Other Cottages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherCottages.map((other) => (
            <Link
              key={other.slug}
              to={`/cottages/${other.slug}`}
              className="block rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
                {other.number}
              </p>
              <p className="text-sm font-bold">{other.name}</p>
              <p className="text-stone text-xs">{other.tagline}</p>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
