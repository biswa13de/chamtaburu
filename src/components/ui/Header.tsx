import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface NavLink {
  label: string;
  to: string;
}

interface HeaderProps {
  siteName: string;
  navLinks: NavLink[];
  cta?: NavLink;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Site header/nav, props-driven so Layout.tsx (each site's composition
// root) supplies the nav structure rather than this component sniffing a
// subdomain. Mobile menu is keyboard accessible and focus-trapped.
export function Header({ siteName, navLinks, cta }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const transition = reduceMotion ? { duration: 0 } : undefined;

  return (
    <header className="sticky top-0 z-50 border-b border-stone/10 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-serif text-3xl font-medium tracking-tight text-forest">
          {siteName}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-[11px] font-semibold tracking-widest transition-colors hover:text-forest ${
                location.pathname === link.to ? 'border-b-2 border-forest pb-1 text-forest' : 'text-stone'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {cta && (
            <Link
              to={cta.to}
              className="rounded-full bg-forest/10 px-4 py-2 text-[11px] font-bold tracking-widest text-forest transition-all hover:bg-forest hover:text-white"
            >
              {cta.label}
            </Link>
          )}
        </nav>

        <button
          ref={menuButtonRef}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="text-stone md:hidden"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav"
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition}
            className="overflow-hidden border-t border-stone/10 bg-white md:hidden"
          >
            <nav aria-label="Mobile" className="space-y-4 px-4 pb-6 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-[11px] font-semibold tracking-widest text-stone hover:text-forest"
                >
                  {link.label}
                </Link>
              ))}
              {cta && (
                <Link
                  to={cta.to}
                  className="block text-[11px] font-semibold tracking-widest text-forest hover:text-forest-deep"
                >
                  {cta.label}
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
