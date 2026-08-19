import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/ui/Header';
import { Footer } from './components/ui/Footer';
import { MobileContactBar } from './components/ui/MobileContactBar';
import { GoogleAnalytics, AnalyticsRouteTracker } from './components/ui/GoogleAnalytics';
import { groupInfo, social } from './content/shared';
import { currentSite } from './content/site';
import type { NavLink } from './components/ui/Header';

// Village and Resort have different route sets (docs/01-strategy.md §5), so
// the nav is site-specific rather than a single hardcoded array.
const VILLAGE_NAV: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Cottages', to: '/cottages' },
  { label: 'Experiences', to: '/experiences' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Contact', to: '/contact' },
];

const RESORT_NAV: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Accommodation', to: '/accommodation' },
  { label: 'Contact', to: '/contact' },
];

const NAV_LINKS = currentSite.key === 'resort' ? RESORT_NAV : VILLAGE_NAV;

// Scrolls to top on every route change — client-side navigations don't reset
// scroll position by default with react-router.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function Layout() {
  return (
    <div className="selection:bg-forest flex min-h-screen flex-col selection:text-white">
      <ScrollToTop />
      <GoogleAnalytics />
      <AnalyticsRouteTracker />
      <Header siteName={currentSite.name} navLinks={NAV_LINKS} />
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
        <Footer navLinks={NAV_LINKS} legalName={groupInfo.legalName} social={social} />
      </div>
      <MobileContactBar />
    </div>
  );
}
