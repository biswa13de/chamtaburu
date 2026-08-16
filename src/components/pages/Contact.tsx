import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { pageHeroImages } from '../../data/content';

// Simplified stub — real per-property contact details (§2 of the content
// model), embedded map, and enquiry form wiring are Phase 2/4/5 work.
export function Contact() {
  return (
    <div className="pb-24">
      <Hero
        image={{ src: pageHeroImages.contact, alt: 'Chamtaburu Eco Village entrance', width: 1920, height: 400 }}
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
                <p className="text-sm leading-relaxed text-stone">
                  Matha, Matha Forest, Baghmundi, Purulia, West Bengal 723152, India
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Phone</h2>
                <p className="text-sm text-stone">+91 92427 48100</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Email</h2>
                <p className="text-sm text-stone">info@chamtaburu.in</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="shrink-0 text-forest" size={20} aria-hidden="true" />
              <div>
                <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone">Front Desk Hours</h2>
                <p className="text-sm text-stone">Monday – Sunday: 9:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>

          {/* TODO(Phase 4): real embedded map, directions, drive times */}
          <div className="flex h-[400px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <p className="text-sm text-stone">Map coming soon</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
