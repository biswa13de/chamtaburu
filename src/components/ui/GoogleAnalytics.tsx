import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { GA_MEASUREMENT_ID, trackPageView } from '../../lib/analytics';

/**
 * GA4 gtag.js bootstrap, injected via vite-react-ssg's <Head> (see
 * src/components/ui/Seo.tsx's doc comment for how <Head> works under SSG)
 * rather than hardcoded into index.html.
 *
 * Why <Head> and not index.html directly: `vite-react-ssg build` prerenders
 * every route to its OWN static HTML file (dist/<site>/cottages/shal-shanti/
 * index.html etc.), each generated from Vite's root index.html template but
 * then augmented per-route with whatever <Head> tags that route's component
 * tree rendered. If the gtag script were hand-written only into the
 * repo-root index.html, it would still end up in every prerendered file
 * (they all derive from that template) — but rendering it through <Head>
 * here, mounted once in Layout.tsx (every route's shared shell), keeps ALL
 * <head>-injecting code going through one mechanism instead of splitting
 * "some tags via index.html, some via <Head>" across two systems that a
 * future edit could get out of sync. It also means this component could be
 * conditionally omitted per-build (e.g. disabled on preview channels) with
 * a one-line change, which a static index.html edit can't do.
 *
 * NOTE (privacy / cookie notice): GA4's gtag.js sets first-party cookies
 * (`_ga`, `_ga_<container-id>`) to distinguish sessions/users. This site
 * previously had a cookie-free footprint (docs/01-strategy.md §6, "No
 * cookies set, so no consent banner needed") — wiring in real GA4 reopens
 * that. The site owner has explicitly acknowledged this and decided to
 * revisit the cookie-notice question as a SEPARATE follow-up rather than
 * block Phase 6 on it (see Phase 6 build notes) — a cookie consent banner
 * is deliberately NOT added here. Flagging clearly so it isn't silently
 * forgotten: add one before this is treated as done-done on the privacy
 * front.
 */
export function GoogleAnalytics() {
  return (
    <Head>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <script>
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('set', 'allow_google_signals', false);
gtag('set', 'allow_ad_personalization_signals', false);
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </script>
    </Head>
  );
}

/**
 * Fires a GA4 page_view on every client-side route change (after the
 * initial load, which gtag.js's own `gtag('config', ...)` already reports
 * automatically — see src/lib/analytics.ts's trackPageView doc comment for
 * why both paths are needed). Mounted once in Layout.tsx, alongside the
 * existing ScrollToTop pattern this mirrors.
 */
export function AnalyticsRouteTracker() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the very first render: that page view is already counted by
    // gtag.js's automatic page_view fired from the bootstrap script above.
    // Firing again here would double-count the landing page.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // react-helmet-async (the page-level <Seo>'s <Head>) patches
    // document.title in its own effect, which isn't guaranteed to run
    // before this sibling effect on the same route change. A microtask
    // delay lets Helmet's DOM update land first, so the page_view's
    // page_title reflects the NEW route's title, not the previous one.
    queueMicrotask(() => trackPageView(location.pathname, document.title));
  }, [location.pathname]);

  return null;
}
