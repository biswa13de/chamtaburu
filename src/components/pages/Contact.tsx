import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { village } from '../../content/village';

// TODO(Phase 4): site selection should be driven by VITE_SITE, not a
// hardcoded import of the village content.
// TODO(Phase 4): real embedded map, directions, drive times, front-desk
// hours are not yet confirmed (docs/06-open-questions.md Q8) so this page
// omits them rather than inventing them.
export function Contact() {
  const { address } = village;
  const fullAddress = `${address.street}, ${address.locality}, ${address.district}, ${address.region} ${address.postalCode}, India`;

  return (
    <div className="pb-24">
      <Hero
        image={{
          src: '/img/village/shared-pool/village-entrance-steps.jpg',
          alt: 'Entrance to Chamtaburu Eco Village, Ajodhya Hills, Purulia',
          width: 1920,
          height: 400,
        }}
        heading="Contact Us"
        size="compact"
      />

      <Section className="mt-16">
        <div className="grid gap-16 md:grid-cols-2">
          <div className="space-y-8">
            <div className="flex gap-4">
              <MapPin className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Our Location</h2>
                <p className="text-sm leading-relaxed text-stone">{fullAddress}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Phone</h2>
                {village.phones.map((phone) => (
                  <p key={phone} className="text-sm text-stone">
                    {phone}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Email</h2>
                <p className="text-sm text-stone">{village.email}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Front Desk Hours</h2>
                <p className="text-sm text-stone">Hours to be confirmed</p>
              </div>
            </div>
          </div>

          {/* TODO(Phase 4): real embedded map, directions, drive times — needs geo (Q6) */}
          <div className="flex h-[400px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <p className="text-sm text-stone">Map coming soon</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
