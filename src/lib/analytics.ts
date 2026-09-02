/**
 * GA4 analytics — Phase 6 (docs/05-build-phases.md). Measurement ID chosen
 * and provided by the site owner.
 *
 * Config choices, most-privacy-conservative-reasonable within GA4's own
 * settings (this is NOT a cookieless setup — see the comment on
 * GA_MEASUREMENT_ID's usage in src/components/ui/GoogleAnalytics.tsx for why
 * that reopens docs/01-strategy.md §6's "no cookie banner" note, explicitly
 * deferred by the site owner to a separate follow-up):
 *   - `allow_google_signals: false` — disables Google Signals (cross-device/
 *     cross-site ads reporting via DoubleClick cookies). No ads product is
 *     used on this site; there is no reason to opt into ads-network data
 *     sharing.
 *   - `allow_ad_personalization_signals: false` — disables using this site's
 *     GA4 data for ad personalization elsewhere in Google's ad products.
 *   - `anonymize_ip` is not passed: it's a Universal Analytics (GA3) concept
 *     that GA4 does not support as a config field (GA4 never logs full IP
 *     addresses in the first place — IP is used transiently for geolocation
 *     then discarded). Passing it would be a silent no-op dressed up as a
 *     privacy control, which is worse than omitting it.
 */
export const GA_MEASUREMENT_ID = 'G-8VYR8NESE3';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Fires a GA4 page_view for a client-side route change.
 *
 * Why this is needed on top of gtag.js's own automatic page_view: gtag.js's
 * `gtag('config', ID)` call (in index.html, see GoogleAnalytics.tsx) fires
 * exactly one automatic page_view — for whatever URL was current the moment
 * that script executes. That's correct for the very first page load
 * (including the prerendered HTML case: the script tag is baked into every
 * route's static HTML by vite-react-ssg, so the automatic page_view always
 * reports the real route the visitor actually landed on, not a fixed
 * index.html).
 *
 * But this is an SSG site that hydrates into a client-side router
 * (react-router 6). After hydration, navigating between routes (Home ->
 * Cottages -> a cottage detail page) does NOT reload the page or re-execute
 * the gtag bootstrap script — it's a history.pushState-driven DOM swap, which
 * GA4 has no way to observe on its own. Without an explicit call here, every
 * page after the first one in a session would be invisible to GA4 entirely.
 * So: rely on gtag.js's built-in automatic page_view for the first/hard load
 * of any route (including every prerendered route being a valid direct
 * landing page), and fire this explicit `event: page_view` on every
 * subsequent client-side route change.
 */
export function trackPageView(path: string, title: string): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}
