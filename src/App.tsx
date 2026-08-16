/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/ui/Header';
import { Footer } from './components/ui/Footer';
import { Home } from './components/pages/Home';
import { Accommodations } from './components/pages/Accommodations';
import { Contact } from './components/pages/Contact';
import { Legal } from './components/pages/Legal';

// TODO(Phase 4): real per-site routing via vite-react-ssg and VITE_SITE-driven
// site config/content. This is a single placeholder route tree that proves
// the design system compiles and renders end to end.
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Accommodations', to: '/accommodations' },
  { label: 'Contact', to: '/contact' },
  { label: 'Legal', to: '/legal' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col selection:bg-forest selection:text-white">
        <Header siteName="Chamtaburu" navLinks={NAV_LINKS} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/accommodations" element={<Accommodations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer navLinks={NAV_LINKS} legalName="Chamtaburu Eco Village & Resort Pvt. Ltd." />
      </div>
    </Router>
  );
}
