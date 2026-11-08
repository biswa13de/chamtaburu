import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Star, MapPin, Phone, Mail, Clock } from 'lucide-react';
import type { NavLink } from './Header';
import type { SiteConfig } from '../../content/types';

interface FooterProps {
  navLinks: NavLink[];
  legalName: string;
  site: SiteConfig;
}

// Props-driven so Layout.tsx supplies nav structure; no Junction links,
// no hotlinked TrustedSite badge (removed per docs/05-build-phases.md).
// Carries the property's contact details on every page, so a guest never
// has to hunt for a number or the address.
export function Footer({ navLinks, legalName, site }: FooterProps) {
  const { social, address } = site;
  const hasSocial = social.facebook || social.instagram || social.youtube || social.googleReview;
  const phone = site.phones[0];
  const fullAddress = `${address.street}, ${address.locality}, ${address.district}, ${address.region} ${address.postalCode}`;
  const linkClass = 'hover:text-forest';

  return (
    <footer className="border-stone/10 border-t bg-white pt-16 pb-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="text-stone grid w-full max-w-3xl gap-4 text-sm sm:grid-cols-2">
          <p className="flex gap-3">
            <MapPin size={18} className="text-forest mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="text-ink block font-semibold">{site.name}</span>
              {fullAddress}
              {site.mapsUrl && (
                <>
                  {' · '}
                  <a
                    href={site.mapsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-forest font-semibold"
                  >
                    Directions
                  </a>
                </>
              )}
            </span>
          </p>
          <div className="space-y-2">
            {phone && (
              <p className="flex gap-3">
                <Phone size={18} className="text-forest shrink-0" aria-hidden="true" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className={linkClass}>
                  {phone}
                </a>
              </p>
            )}
            <p className="flex gap-3">
              <Mail size={18} className="text-forest shrink-0" aria-hidden="true" />
              <a href={`mailto:${site.email}`} className={linkClass}>
                {site.email}
              </a>
            </p>
            <p className="flex gap-3">
              <Clock size={18} className="text-forest shrink-0" aria-hidden="true" />
              <span>
                Reception {site.receptionHours} · Check-in {site.checkIn} · Check-out{' '}
                {site.checkOut}
              </span>
            </p>
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="text-stone flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] font-semibold tracking-widest"
        >
          {navLinks.map((link) =>
            link.external ? (
              <a key={link.to} href={link.to} className={linkClass}>
                {link.label.toUpperCase()}
              </a>
            ) : (
              <Link key={link.to} to={link.to} className={linkClass}>
                {link.label.toUpperCase()}
              </Link>
            ),
          )}
          <Link to="/book" className="text-forest hover:text-forest-deep">
            BOOK
          </Link>
          <Link to="/legal" className={linkClass}>
            POLICIES
          </Link>
        </nav>

        {hasSocial && (
          <div className="text-stone flex gap-6">
            {social.facebook && (
              <a href={social.facebook} aria-label="Facebook" className={linkClass}>
                <Facebook size={20} />
              </a>
            )}
            {social.instagram && (
              <a href={social.instagram} aria-label="Instagram" className={linkClass}>
                <Instagram size={20} />
              </a>
            )}
            {social.youtube && (
              <a href={social.youtube} aria-label="YouTube" className={linkClass}>
                <Youtube size={20} />
              </a>
            )}
            {social.googleReview && (
              <a
                href={social.googleReview}
                aria-label="Write a Google review"
                className={linkClass}
              >
                <Star size={20} />
              </a>
            )}
          </div>
        )}

        <div className="space-y-2 text-center">
          <p className="text-stone text-[10px] tracking-widest uppercase">
            Copyright &copy; {new Date().getFullYear()} Chamtaburu Eco Village and Resort — All
            Rights Reserved.
          </p>
          <p className="text-stone text-[10px] font-bold tracking-widest uppercase">
            Business Legal Name: {legalName}
          </p>
        </div>
      </div>
    </footer>
  );
}
