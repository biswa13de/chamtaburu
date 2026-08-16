import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Image } from '../ui/Image';
import { pageHeroImages, villageRooms, villageActivities } from '../../data/content';

// Simplified stub — real content (typed schema, verified prices) is Phase 2.
export function Accommodations() {
  const items = [...villageRooms, ...villageActivities];

  return (
    <div className="pb-24">
      <Hero
        image={{ src: pageHeroImages.accommodations, alt: 'Cottages at Chamtaburu Eco Village', width: 1920, height: 400 }}
        heading="Accommodations & Experiences"
        subheading="Stays and activities at Chamtaburu Eco Village."
        size="compact"
      />

      <Section className="mt-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <Image
                src={item.img}
                alt={item.title}
                width={800}
                height={600}
                className="h-64 w-full object-cover"
              />
              <div className="space-y-3 p-6">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-xs leading-relaxed text-stone">{item.desc}</p>
                <div className="flex items-center justify-between pt-4">
                  <span className="font-bold text-ink">{item.price}</span>
                  <Button to="/contact" variant="secondary" className="px-5 py-2 text-[10px]">
                    Enquire
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
