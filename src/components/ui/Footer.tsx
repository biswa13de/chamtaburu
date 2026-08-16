import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import type { NavLink } from './Header';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

interface FooterProps {
  navLinks: NavLink[];
  legalName: string;
  social?: SocialLinks;
}

// Props-driven so App.tsx supplies nav structure; no Junction links,
// no hotlinked TrustedSite badge (removed per docs/05-build-phases.md).
export function Footer({ navLinks, legalName, social }: FooterProps) {
  const hasSocial = social && (social.facebook || social.instagram || social.youtube);

  return (
    <footer className="border-t border-stone/10 bg-white pb-8 pt-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center space-y-8 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] font-semibold tracking-widest text-stone">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-forest">
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        {hasSocial && (
          <div className="flex gap-6 text-stone/60">
            {social?.facebook && (
              <a href={social.facebook} aria-label="Facebook" className="hover:text-forest">
                <Facebook size={20} />
              </a>
            )}
            {social?.instagram && (
              <a href={social.instagram} aria-label="Instagram" className="hover:text-forest">
                <Instagram size={20} />
              </a>
            )}
            {social?.youtube && (
              <a href={social.youtube} aria-label="YouTube" className="hover:text-forest">
                <Youtube size={20} />
              </a>
            )}
          </div>
        )}

        <div className="space-y-2 text-center">
          <p className="text-[10px] uppercase tracking-widest text-stone/70">
            Copyright &copy; {new Date().getFullYear()} Chamtaburu Eco Village and Resort — All Rights Reserved.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone">Business Legal Name: {legalName}</p>
        </div>
      </div>
    </footer>
  );
}
