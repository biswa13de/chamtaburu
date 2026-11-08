import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/ui/Header';
import { Footer } from './components/ui/Footer';
import { MobileContactBar } from './components/ui/MobileContactBar';
import { GoogleAnalytics, AnalyticsRouteTracker } from './components/ui/GoogleAnalytics';
import { groupInfo } from './content/shared';
import { currentSite } from './content/site';
import type { NavLink } from './components/ui/Header';

// Village and Resort have different route sets (docs/01-strategy.md §5), so
// the nav is site-specific rather than a single hardcoded array.
const VILLAGE_NAV: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Cottages', to: '/cottages' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Sightseeing', to: '/sightseeing' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Menu', to: '/menu', external: true },
  { label: 'Contact', to: '/contact' },
];

const RESORT_NAV: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Accommodation', to: '/accommodation' },
  { label: 'Sightseeing', to: '/sightseeing' },
  { label: 'Menu', to: '/menu', external: true },
  { label: 'Contact', to: '/contact' },
];

// The header's highlighted button: request to book (src/components/pages/Book.tsx).
const BOOK_CTA: NavLink = { label: 'Book', to: '/book' };

const NAV_LINKS = currentSite.key === 'resort' ? RESORT_NAV : VILLAGE_NAV;

// Scrolls to top on every route change — client-side navigations don't reset
// scroll position by default with react-router — or, for a link to a
// section (/legal#cancellation), to that section once it has rendered.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  return (
    <div className="selection:bg-forest flex min-h-screen flex-col selection:text-white">
      <ScrollToTop />
      <GoogleAnalytics />
      <AnalyticsRouteTracker />
      <Header siteName={currentSite.name} navLinks={NAV_LINKS} cta={BOOK_CTA} />
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* pb-[52px] on mobile reserves space below the footer's own content
          for the fixed MobileContactBar (py-3.5 text + icon ≈ 52px tall),
          so the bar never overlaps the footer's last line — the bar sits
          fixed to the viewport bottom regardless of document flow, so the
          padding has to live on whatever renders last (the footer), not on
          <main> which the footer follows. The bar itself is md:hidden, so
          this padding is removed at the same breakpoint. */}
      <div className="pb-[52px] md:pb-0">
        <Footer navLinks={NAV_LINKS} legalName={groupInfo.legalName} site={currentSite} />
      </div>
      <MobileContactBar />
    </div>
  );
}
