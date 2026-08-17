import { Leaf, Users, Globe } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { Image } from '../ui/Image';
import { village } from '../../content/village';

// TODO(Phase 4): site selection should be driven by VITE_SITE, not a
// hardcoded import of the village content. Defaulting to village here is
// deliberate for Phase 2 — Phase 4 builds real per-site routing.
export function Home() {
  return (
    <div className="space-y-24 pb-24">
      <Hero
        image={{
          src: '/img/village/shared-pool/village-hero-hills.jpg',
          alt: 'Ajodhya Hills at Chamtaburu Eco Village, Purulia',
          width: 1920,
          height: 1080,
        }}
        heading={village.name}
        subheading={village.tagline}
        cta={
          <Button to="/accommodations" variant="primary">
            Explore Stays
          </Button>
        }
      />

      <Section>
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl font-medium">Our Story</h2>
            <div className="space-y-4 text-sm leading-relaxed text-stone">
              <p>
                {village.name} is nestled in the Ajodhya Hills of {village.address.district}, {village.address.region}
                {' '}— {village.tagline.toLowerCase()}
              </p>
              <p>Seven named cottages, each with its own character. Read each cottage&rsquo;s story below.</p>
            </div>
          </div>
          <Image
            src="/img/village/shared-pool/village-exterior.jpg"
            alt="Cottage exterior with white walls and red tile roof at Chamtaburu Eco Village, Ajodhya Hills, Purulia"
            width={800}
            height={600}
            className="w-full rounded-2xl shadow-xl"
          />
        </div>
      </Section>

      <Section className="bg-white py-24" as="div">
        <div className="mb-16 flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-stone/20" />
          <h2 className="whitespace-nowrap font-serif text-3xl font-medium">Our Mission</h2>
          <div className="h-px flex-1 bg-stone/20" />
        </div>
        <div className="grid gap-12 text-center md:grid-cols-3">
          <div className="space-y-4">
            <Leaf className="mx-auto text-forest" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Eco-conservation</h3>
            <p className="text-sm leading-relaxed text-stone">
              Preserving the natural beauty of the Ajodhya Hills through sustainable practices.
            </p>
          </div>
          <div className="space-y-4">
            <Users className="mx-auto text-forest" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Community support</h3>
            <p className="text-sm leading-relaxed text-stone">
              Working with local tribal communities on education, employment and cultural preservation.
            </p>
          </div>
          <div className="space-y-4">
            <Globe className="mx-auto text-forest" size={40} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Immersive experiences</h3>
            <p className="text-sm leading-relaxed text-stone">
              A chance to connect with nature and authentic local culture.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
