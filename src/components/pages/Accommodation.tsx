import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Seo } from '../ui/Seo';
import { RoomPrice } from '../ui/RoomPrice';
import { PhotoStrip } from '../ui/PhotoStrip';
import { StayDates } from '../ui/StayDates';
import { stayQuery, useStayDates } from '../../lib/stayDates';
import { resort, accommodation } from '../../content/resort';
import { resolveImage } from '../../content/manifest';
import { formatOccupancy } from '../../content/format';

const HERO_IMAGE = resolveImage({
  base: 'resort/resort-room-bamboo-cottage',
  alt: 'Thatched-roof bamboo cottages with colourful painted steps and hills behind at Chamtaburu Eco Resort, Ajodhya Hills',
});

// resort.chamtaburu.in's /accommodation — room types and prices. The
// underlying `accommodation` array is intentionally empty until Phase 7
// (docs/06-open-questions.md Q3: the old prototype's room list/prices are
// unverified and not carried forward). This page renders real rows once
// they exist and an honest "coming soon" note while the array is empty —
// never fabricated room types or prices.
export function Accommodation() {
  const { checkIn, checkOut } = useStayDates();
  return (
    <div className="pb-24">
      <Seo
        title="Accommodation"
        description={`Room types and pricing at ${resort.name} in the Ajodhya Hills, Purulia.`}
        path="/accommodation"
      />
      <Hero image={HERO_IMAGE} heading="Accommodation" subheading={resort.name} size="compact" />

      {accommodation.length > 0 && (
        <Section className="mt-16">
          <StayDates note="Prices are per room per night, with breakfast, before GST." />
        </Section>
      )}

      <Section className={accommodation.length > 0 ? 'mt-8' : 'mt-16'}>
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
            <h2 className="sr-only">Our rooms</h2>
            {accommodation.map((room) => {
              return (
                <Card key={room.slug}>
                  <PhotoStrip images={room.images} />
                  <div className="space-y-3 p-6">
                    <h3 className="text-lg font-bold">{room.name}</h3>
                    <p className="text-stone text-xs leading-relaxed">{room.tagline}</p>
                    <div className="text-stone flex items-center justify-between pt-2 text-xs">
                      <span>{formatOccupancy(room.occupancy)}</span>
                      <span>{room.beds === 'TBD' ? 'Beds TBD' : room.beds}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <RoomPrice
                        type={room.rateType ?? room.slug}
                        price={room.price}
                        acPrice={room.acPrice}
                      />
                      <Button
                        to={`/book${stayQuery(checkIn, checkOut, { room: room.slug })}`}
                        variant="secondary"
                        className="shrink-0 px-5 py-2 text-[10px]"
                      >
                        Request to book
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
