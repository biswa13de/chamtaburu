import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './components/ui/Header';
import { Footer } from './components/ui/Footer';
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
      <Header siteName={currentSite.name} navLinks={NAV_LINKS} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer navLinks={NAV_LINKS} legalName={groupInfo.legalName} social={social} />
    </div>
  );
}
