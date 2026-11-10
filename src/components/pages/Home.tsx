import { Leaf, Users, Globe, MapPin, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Image } from '../ui/Image';
import { Seo } from '../ui/Seo';
import { RoomPrice } from '../ui/RoomPrice';
import { PhotoStrip } from '../ui/PhotoStrip';
import { currentSite } from '../../content/site';
import { cottages, experiences, village } from '../../content/village';
import { resort, accommodation as resortAccommodation } from '../../content/resort';
import { resolveImage } from '../../content/manifest';
import type { ImageRef } from '../../content/types';
import { buildLodgingBusinessJsonLd } from '../../lib/seo';
import { formatOccupancy } from '../../content/format';

const HERO_IMAGE = resolveImage({
  base: 'village/village-campus-aerial',
  alt: 'Aerial view of red-roofed cottages, lawns and lamp-lined paths at Chamtaburu Eco Village, Ajodhya Hills, Purulia',
});
const STORY_IMAGE = resolveImage({
  base: 'village/village-campus-overview',
  alt: 'Red-roofed cottages and gardens with forested hills beyond, seen from above at Chamtaburu Eco Village, Purulia',
});

// Resort-specific hero/story images — distinct from the Village's, which
// must never appear on resort.chamtaburu.in.
const RESORT_HERO_IMAGE = resolveImage({
  base: 'resort/resort-campus-umbrellas',
  alt: 'Garden tables under colourful umbrellas, thatched huts and cottages below a rocky hill at Chamtaburu Eco Resort, Ajodhya Hills',
});
const RESORT_STORY_IMAGE = resolveImage({
  base: 'resort/resort-campus-mural-cottage',
  alt: 'Cottage with a large wall mural and red steps below a rocky hill at Chamtaburu Eco Resort, Ajodhya Hills',
});

// A row of cards that swipes sideways on a phone and becomes a grid from
// tablet width up, so a list of rooms doesn't fill five phone screens.
const SWIPE_ROW =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden';
const SWIPE_CARD = 'w-[78%] shrink-0 snap-start sm:w-auto';

// The hero's second button, light so it reads on the photo.
const HERO_LINK =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white/90 px-6 py-3 text-xs font-bold tracking-[0.2em] text-ink uppercase transition-colors hover:bg-white';

// Resort campus photos for "Around the resort" — Resort-only images.
const RESORT_CAMPUS: ImageRef[] = [
  {
    base: 'resort/resort-campus-huts',
    alt: 'Thatched bamboo huts with painted steps among flowering shrubs, a hill behind, at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-campus-lawn',
    alt: 'Lawn with a garden table and umbrella in front of the cottages at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-campus-cottage-row',
    alt: 'Row of cottages with painted verandas behind trimmed hedges at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-campus-verandas',
    alt: 'Cottages with mural-painted walls and verandas along a hedged garden at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-campus-thatched-row',
    alt: 'Thatched-roof cottages with painted walls and a hedged garden at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-cottages-mural',
    alt: 'Row of mural-painted cottages in morning mist at Chamtaburu Eco Resort, Ajodhya Hills, Purulia',
  },
  {
    base: 'resort/resort-evening-garden',
    alt: 'Evening garden with thatched hut and swing set at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-pathway-rain',
    alt: 'Rain falling on the pathway between cottages at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    base: 'resort/resort-night-gate',
    alt: 'Night view of the garden, hedges and decorative gate at Chamtaburu Eco Resort, Ajodhya Hills',
  },
];

// Food — both sites. The menu is the static page at /menu (public/menu),
// hence a plain link, not a router one.
function FoodSection({ unit }: { unit: string }) {
  return (
    <Section>
      <div className="rounded-2xl bg-white p-8 shadow-sm md:flex md:items-center md:justify-between md:gap-10 md:p-10">
        <div className="flex gap-5">
          <UtensilsCrossed
            className="text-forest mt-1 hidden shrink-0 sm:block"
            size={32}
            aria-hidden="true"
          />
          <div>
            <h2 className="mb-3 font-serif text-3xl font-medium">Food &amp; Dining</h2>
            <p className="text-stone max-w-2xl text-sm leading-relaxed">
              Home-style meals in our dining hall, or in your {unit} on request: breakfasts, thalis,
              Bengali posto specials, starters and more, with veg, egg and non-veg dishes. Prefer it
              all taken care of? Choose a package with all meals included when you request to book.
            </p>
          </div>
        </div>
        <div className="mt-6 flex shrink-0 flex-wrap gap-3 md:mt-0">
          <a
            href="/menu"
            className="bg-forest hover:bg-forest-deep inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold tracking-[0.2em] text-white uppercase transition-colors"
          >
            See the menu
          </a>
        </div>
      </div>
    </Section>
  );
}

// Links to /sightseeing — shown on both sites' home pages.
function SightseeingTeaser() {
  return (
    <Section>
      <div className="rounded-2xl bg-white p-8 shadow-sm md:flex md:items-center md:justify-between md:gap-10 md:p-10">
        <div>
          <h2 className="mb-2 font-serif text-3xl font-medium">Purulia, at an easy pace</h2>
          <p className="text-stone max-w-xl text-sm leading-relaxed">
            Ajodhya Pahar, Marble Lake, Turga Falls, the Chhau mask village of Charida and Garh
            Panchakot: our 3-day sightseeing plan for guests who come in their own car.
          </p>
        </div>
        <Button to="/sightseeing" variant="secondary" className="mt-6 shrink-0 md:mt-0">
          See the 3-day plan
        </Button>
      </div>
    </Section>
  );
}

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
          <>
            <Button to="/book" variant="primary">
              Request to Book
            </Button>
            <Link to="/cottages" className={HERO_LINK}>
              Explore Cottages
            </Link>
          </>
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
                Seven named cottages, each with its own character: 300 sq ft, an extra-large king
                bed, TV, Wi-Fi and an attached bathroom, a private lawn with a swing, and a hill
                view from the balcony. Three are air-conditioned. For a simpler stay, two
                first-floor rooms sit above reception.
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
        <div className={SWIPE_ROW}>
          {cottages.map((cottage) => {
            const coverImageRef = cottage.images[0] ?? {
              base: 'village/village-exterior',
              alt: cottage.name,
            };
            const coverImage = resolveImage(coverImageRef);
            return (
              <Card key={cottage.slug} className={`group ${SWIPE_CARD}`}>
                <Link to={`/cottages/${cottage.slug}`} className="block">
                  <Image
                    src={coverImage.fallbackSrc}
                    avifSrcSet={coverImage.avifSrcSet}
                    webpSrcSet={coverImage.webpSrcSet}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
                    lqip={coverImage.lqip}
                    alt={coverImage.alt}
                    width={coverImage.width}
                    height={coverImage.height}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="space-y-1 p-5">
                    <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
                      {cottage.number}
                      {cottage.amenities.includes('ac') ? ' · AC' : ''}
                    </p>
                    <h3 className="text-base font-bold">{cottage.name}</h3>
                    <p className="text-stone text-xs leading-relaxed">{cottage.tagline}</p>
                    <div className="pt-2">
                      <RoomPrice type={cottage.rateType ?? cottage.slug} price={cottage.price} />
                    </div>
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

      <FoodSection unit="cottage" />

      <SightseeingTeaser />

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
          Pick your cottage and dates, see the price and send a booking request. We&rsquo;ll confirm
          availability on WhatsApp. Questions first? Get in touch.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button to="/book" variant="primary">
            Request to Book
          </Button>
          <Button to="/contact" variant="secondary">
            Enquire
          </Button>
        </div>
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
        jsonLd={[buildLodgingBusinessJsonLd(currentSite, resortAccommodation, RESORT_HERO_IMAGE)]}
      />
      <Hero
        image={RESORT_HERO_IMAGE}
        heading={currentSite.name}
        subheading={currentSite.tagline}
        cta={
          <>
            <Button to="/book" variant="primary">
              Request to Book
            </Button>
            <Link to="/accommodation" className={HERO_LINK}>
              See the Rooms
            </Link>
          </>
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
                Five kinds of room, from our round bamboo-and-thatch cottage to six-bed rooms for
                bigger groups, three of them with an AC option. Breakfast is included in every room
                rate.
              </p>
            </div>
          </div>
          <Image
            src={RESORT_STORY_IMAGE.fallbackSrc}
            avifSrcSet={RESORT_STORY_IMAGE.avifSrcSet}
            webpSrcSet={RESORT_STORY_IMAGE.webpSrcSet}
            sizes="(min-width: 768px) 50vw, 100vw"
            lqip={RESORT_STORY_IMAGE.lqip}
            alt={RESORT_STORY_IMAGE.alt}
            width={RESORT_STORY_IMAGE.width}
            height={RESORT_STORY_IMAGE.height}
            className="w-full rounded-2xl shadow-xl"
          />
        </div>
      </Section>

      <Section>
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl font-medium">Our Rooms</h2>
          <Button to="/accommodation" variant="ghost" className="shrink-0">
            All rooms
          </Button>
        </div>
        <div className={`${SWIPE_ROW} lg:grid-cols-5`}>
          {resortAccommodation.map((room) => {
            const cover = resolveImage(
              room.images[0] ?? { base: 'resort/resort-hero-mist', alt: room.name },
            );
            return (
              <Card key={room.slug} className={`group ${SWIPE_CARD}`}>
                <Link to={`/book?room=${room.slug}`} className="block">
                  <Image
                    src={cover.fallbackSrc}
                    avifSrcSet={cover.avifSrcSet}
                    webpSrcSet={cover.webpSrcSet}
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 80vw"
                    lqip={cover.lqip}
                    alt={cover.alt}
                    width={cover.width}
                    height={cover.height}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="space-y-1 p-5">
                    <h3 className="text-base font-bold">{room.name}</h3>
                    <p className="text-stone text-xs">{formatOccupancy(room.occupancy)}</p>
                    <div className="pt-2">
                      <RoomPrice
                        type={room.rateType ?? room.slug}
                        price={room.price}
                        acPrice={room.acPrice}
                      />
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section>
        <h2 className="mb-6 font-serif text-4xl font-medium">Around the Resort</h2>
        <PhotoStrip images={RESORT_CAMPUS} className="h-72 overflow-hidden rounded-2xl sm:h-96" />
      </Section>

      <FoodSection unit="room" />

      <SightseeingTeaser />

      <Section>
        <div className="border-forest/20 bg-forest/5 grid gap-8 rounded-2xl border p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-forest text-[10px] font-bold tracking-widest uppercase">
              Our Properties
            </p>
            <h2 className="font-serif text-2xl font-medium">Also part of the Chamtaburu group</h2>
            <p className="text-stone text-sm leading-relaxed">
              {village.name}: seven named cottages, each with its own lawn and hill view, nearby in
              Matha Forest.
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <a
              href={`https://${village.domain}`}
              className="bg-forest hover:bg-forest-deep inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold tracking-[0.2em] text-white uppercase transition-colors"
            >
              Visit {village.name}
            </a>
          </div>
        </div>
      </Section>

      <Section className="text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium">Plan Your Stay</h2>
        <p className="text-stone mx-auto mb-8 max-w-xl text-sm leading-relaxed">
          Pick your room and dates, see the price and send a booking request. We&rsquo;ll confirm
          availability on WhatsApp. Questions first? Get in touch.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button to="/book" variant="primary">
            Request to Book
          </Button>
          <Button to="/contact" variant="secondary">
            Enquire
          </Button>
        </div>
      </Section>
    </div>
  );
}

export function Home() {
  return currentSite.key === 'resort' ? <ResortHome /> : <VillageHome />;
}
