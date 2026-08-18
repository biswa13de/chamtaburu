import { Phone, MessageCircle } from 'lucide-react';
import { currentSite } from '../../content/site';

/**
 * Fixed bottom call/WhatsApp bar — docs/02-architecture.md §8: "persistent
 * click-to-call and click-to-WhatsApp buttons ... a fixed bottom bar on
 * mobile, where most visitors are." Mobile-only (`md:hidden`); desktop
 * visitors already have the header/contact page.
 *
 * This is a lightweight, generic "I'd like to know more" message — not the
 * full pre-composed booking message EnquiryForm builds — since there's no
 * form data to draw on from a persistent site-wide bar.
 *
 * Rendered once in src/Layout.tsx so it's present on every page. Layout
 * adds matching bottom padding on mobile so this bar never overlaps footer
 * content.
 */
export function MobileContactBar() {
  const phone = currentSite.phones[0];
  const whatsappMessage = `Hi ${currentSite.name}, I'd like to know more.`;
  const whatsappHref = `https://wa.me/${currentSite.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-forest fixed inset-x-0 bottom-0 z-40 flex md:hidden" role="navigation" aria-label="Quick contact">
      {phone && (
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="flex flex-1 items-center justify-center gap-2 border-r border-white/15 py-3.5 text-xs font-bold tracking-widest text-white uppercase"
        >
          <Phone size={16} aria-hidden="true" />
          Call
        </a>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer noopener"
        className="flex flex-1 items-center justify-center gap-2 py-3.5 text-xs font-bold tracking-widest text-white uppercase"
      >
        <MessageCircle size={16} aria-hidden="true" />
        WhatsApp
      </a>
    </div>
  );
}
