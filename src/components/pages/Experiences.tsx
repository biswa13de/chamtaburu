import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Seo } from '../ui/Seo';
import { village, experiences } from '../../content/village';
import { resolveImage } from '../../content/manifest';

const HERO_IMAGE = resolveImage({
  base: 'village/village-window',
  alt: 'Cottage window with curtains open to trees beyond at Chamtaburu Eco Village, Ajodhya Hills',
});

// Only the four real, photographable experiences from
// docs/03-content-model.md §5 are rendered here. Local sightseeing (Marble
// Lake, Bamni Falls, etc.) has its own page, /sightseeing, linked below.
export function Experiences() {
  return (
    <div className="pb-24">
      <Seo
        title="Experiences"
        description={`Evening bonfires, a nature trail and a tribal art zone at ${village.name} in the Ajodhya Hills, Purulia.`}
        path="/experiences"
      />
      <Hero image={HERO_IMAGE} heading="Experiences" subheading={village.name} size="compact" />

      <Section className="mt-16">
        <div className="grid gap-8 sm:grid-cols-2">
          {experiences.map((experience) => (
            <Card key={experience.slug} className="p-8">
              <h2 className="mb-3 font-serif text-2xl font-medium">{experience.title}</h2>
              <p className="text-stone text-sm leading-relaxed">{experience.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="mt-16">
        <Card className="p-8 text-center">
          <h2 className="mb-2 font-serif text-xl font-medium">Local Sightseeing</h2>
          <p className="text-stone mx-auto max-w-xl text-sm leading-relaxed">
            Marble Lake, Bamni and Turga Falls, the Chhau mask village of Charida, Garh Panchakot
            and more: our relaxed 3-day plan for exploring Purulia in your own car.
          </p>
          <Button to="/sightseeing" variant="secondary" className="mt-6">
            See the 3-day plan
          </Button>
        </Card>
      </Section>
    </div>
  );
}
