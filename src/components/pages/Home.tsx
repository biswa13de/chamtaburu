import { Leaf, Users, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Image } from '../ui/Image';
import { Seo } from '../ui/Seo';
import { currentSite } from '../../content/site';
import { cottages, experiences } from '../../content/village';
import { resort, accommodation as resortAccommodation } from '../../content/resort';
import { resolveImage } from '../../content/manifest';
import { buildLodgingBusinessJsonLd } from '../../lib/seo';

const HERO_IMAGE = resolveImage({
  base: 'village/village-hero-hills',
  alt: 'Ajodhya Hills view with palm trees near Chamtaburu Eco Village, Purulia',
});
const STORY_IMAGE = resolveImage({
  base: 'village/village-exterior',
  alt: 'Cottage exterior with white walls and red tile roof at Chamtaburu Eco Village, Ajodhya Hills, Purulia',
});

function VillageHome() {
  const { address } = currentSite;

  return (
    <div className="space-y-24 pb-24">
      <Seo
        title=""
        description={`${currentSite.tagline} Seven named cottages in the Ajodhya Hills, ${address.district}, ${address.region}.`}
        path="/"
        jsonLd={[buildLodgingBusinessJsonLd(currentSite, cottages, HERO_IMAGE)]}
      />
      <Hero
        image={HERO_IMAGE}
        heading={currentSite.name}
        subheading={currentSite.tagline}
        cta={
          <Button to="/cottages" variant="primary">
            Explore Cottages
          </Button>
        }
      />

      <Section>
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl font-medium">Our Story</h2>
            <div className="text-stone space-y-4 text-sm leading-relaxed">
              <p>
                {currentSite.name} is nestled in the Ajodhya Hills of {address.district},{' '}
                {address.region} — {currentSite.tagline.toLowerCase()}
              </p>
              <p>
                Seven named cottages, each with its own character. Read each cottage&rsquo;s story
                below.
              </p>
            </div>
          </div>
          <Image
            src={STORY_IMAGE.fallbackSrc}
            avifSrcSet={STORY_IMAGE.avifSrcSet}
            webpSrcSet={STORY_IMAGE.webpSrcSet}
            sizes="(min-width: 768px) 50vw, 100vw"
            lqip={STORY_IMAGE.lqip}
            alt={STORY_IMAGE.alt}
            width={STORY_IMAGE.width}
            height={STORY_IMAGE.height}
            className="w-full rounded-2xl shadow-xl"
          />
        </div>
      </Section>

      <Section>
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl font-medium">The Seven Cottages</h2>
          <Button to="/cottages" variant="ghost" className="hidden shrink-0 sm:inline-flex">
            View All
          </Button>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {cottages.map((cottage) => {
            const coverImageRef = cottage.images[0] ?? {
              base: 'village/village-exterior',
              alt: cottage.name,
            };
            const coverImage = resolveImage(coverImageRef);
            return (
              <Card key={cottage.slug} className="group">
                <Link to={`/cottages/${cottage.slug}`} className="block">
                  <Image
                    src={coverImage.fallbackSrc}
                    avifSrcSet={coverImage.avifSrcSet}
                    webpSrcSet={coverImage.webpSrcSet}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    lqip={coverImage.lqip}
                    alt={coverImage.alt}
                    width={coverImage.width}
                    height={coverImage.height}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="space-y-1 p-5">
                    <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
                      {cottage.number}
                    </p>
                    <h3 className="text-base font-bold">{cottage.name}</h3>
                    <p className="text-stone text-xs leading-relaxed">{cottage.tagline}</p>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Button to="/cottages" variant="ghost">
            View All Cottages
          </Button>
        </div>
      </Section>

      <Section className="bg-white py-24" as="div">
        <div className="mb-16 flex items-center justify-center gap-4">
          <div className="bg-stone/20 h-px flex-1" />
          <h2 className="font-serif text-3xl font-medium whitespace-nowrap">Our Mission</h2>
          <div className="bg-stone/20 h-px flex-1" />
        </div>
        <div className="grid gap-12 text-center md:grid-cols-3">
          <div className="space-y-4">
            <Leaf className="text-forest mx-auto" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Eco-conservation</h3>
            <p className="text-stone text-sm leading-relaxed">
              Preserving the natural beauty of the Ajodhya Hills through sustainable practices.
            </p>
          </div>
          <div className="space-y-4">
            <Users className="text-forest mx-auto" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Community support</h3>
            <p className="text-stone text-sm leading-relaxed">
              Working with local tribal communities on education, employment and cultural
              preservation.
            </p>
          </div>
          <div className="space-y-4">
            <Globe className="text-forest mx-auto" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Immersive experiences</h3>
            <p className="text-stone text-sm leading-relaxed">
              A chance to connect with nature and authentic local culture.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="mb-8 font-serif text-4xl font-medium">Experiences</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {experiences.map((experience) => (
            <Card key={experience.slug}>
              <div className="space-y-3 p-6">
                <h3 className="text-lg font-bold">{experience.title}</h3>
                <p className="text-stone text-xs leading-relaxed">{experience.description}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button to="/experiences" variant="ghost">
            All Experiences
          </Button>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 rounded-2xl bg-white p-10 shadow-sm md:grid-cols-[auto_1fr] md:items-center">
          <MapPin className="text-forest mx-auto md:mx-0" size={40} aria-hidden="true" />
          <div className="space-y-2 text-center md:text-left">
            <h2 className="font-serif text-2xl font-medium">Where We Are</h2>
            <p className="text-stone text-sm leading-relaxed">
              {address.street}, {address.locality}, {address.district}, {address.region}{' '}
              {address.postalCode}, India
            </p>
            <Button to="/contact" variant="secondary" className="mt-2">
              Get Directions
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        <div className="border-forest/20 bg-forest/5 grid gap-8 rounded-2xl border p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
              Our Properties
            </p>
            <h2 className="font-serif text-2xl font-medium">Also part of the Chamtaburu group</h2>
            <p className="text-stone text-sm leading-relaxed">
              {resort.name} — {resort.tagline}
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <a
              href={`https://${resort.domain}`}
              className="bg-forest hover:bg-forest-deep inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold tracking-[0.2em] text-white uppercase transition-colors"
            >
              Visit {resort.name}
            </a>
          </div>
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium">Plan Your Stay</h2>
        <p className="text-stone mx-auto mb-8 max-w-xl text-sm leading-relaxed">
          Have a question about a cottage or want to check availability? Reach out and we&rsquo;ll
          help you plan your visit.
        </p>
        <Button to="/contact" variant="primary">
          Enquire Now
        </Button>
      </Section>
    </div>
  );
}

function ResortHome() {
  const { address } = currentSite;

  return (
    <div className="space-y-24 pb-24">
      <Seo
        title=""
        description={`${currentSite.tagline} In the Ajodhya Hills, ${address.district}, ${address.region}.`}
        path="/"
        jsonLd={[buildLodgingBusinessJsonLd(currentSite, resortAccommodation, HERO_IMAGE)]}
      />
      <Hero
        image={HERO_IMAGE}
        heading={currentSite.name}
        subheading={currentSite.tagline}
        cta={
          <Button to="/accommodation" variant="primary">
            View Accommodation
          </Button>
        }
      />

      <Section>
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl font-medium">Our Story</h2>
            <div className="text-stone space-y-4 text-sm leading-relaxed">
              <p>
                {currentSite.name} is nestled in the Ajodhya Hills of {address.district},{' '}
                {address.region} — {currentSite.tagline.toLowerCase()}
              </p>
            </div>
          </div>
          <Image
            src={STORY_IMAGE.fallbackSrc}
            avifSrcSet={STORY_IMAGE.avifSrcSet}
            webpSrcSet={STORY_IMAGE.webpSrcSet}
            sizes="(min-width: 768px) 50vw, 100vw"
            lqip={STORY_IMAGE.lqip}
            alt={STORY_IMAGE.alt}
            width={STORY_IMAGE.width}
            height={STORY_IMAGE.height}
            className="w-full rounded-2xl shadow-xl"
          />
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium">Plan Your Stay</h2>
        <p className="text-stone mx-auto mb-8 max-w-xl text-sm leading-relaxed">
          Have a question or want to check availability? Reach out and we&rsquo;ll help you plan
          your visit.
        </p>
        <Button to="/contact" variant="primary">
          Enquire Now
        </Button>
      </Section>
    </div>
  );
}

export function Home() {
  return currentSite.key === 'resort' ? <ResortHome /> : <VillageHome />;
}
