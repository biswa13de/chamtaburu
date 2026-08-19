/**
 * SEO helpers — per-route meta/OG/Twitter tag data and JSON-LD builders.
 *
 * Phase 6 (docs/05-build-phases.md). These are pure data-building functions;
 * the actual <head> injection happens via vite-react-ssg's <Head> component
 * (a react-helmet-async wrapper) in src/components/ui/Seo.tsx. Keeping the
 * "what goes in the tags" logic here, separate from "how it gets into the
 * DOM", makes it independently testable and keeps Seo.tsx a thin renderer.
 */
import type { Cottage, SiteConfig } from '../content/types';
import type { ResolvedImage } from '../content/manifest';

/** Absolute origin for the site currently being built — used to build canonical/OG URLs. */
export function siteOrigin(site: SiteConfig): string {
  return `https://${site.domain}`;
}

/** Joins the site origin with a route path ('/', '/cottages/shal-shanti', ...) into an absolute URL. */
export function absoluteUrl(site: SiteConfig, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Avoid a trailing slash on anything but the root, so canonical URLs are
  // consistent with how vite-react-ssg emits route files (…/index.html).
  const clean = normalized !== '/' && normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  return `${siteOrigin(site)}${clean}`;
}

export interface PageMeta {
  /** Page-specific title segment; the site name is appended by buildTitle(). */
  title: string;
  description: string;
  path: string; // route path, e.g. '/cottages/shal-shanti'
  /** Defaults to the site's chosen OG image when omitted. */
  image?: ResolvedImage;
  type?: 'website' | 'article';
  /** True for pages that should never appear in search results (e.g. /404). */
  noindex?: boolean;
}

export function buildTitle(site: SiteConfig, pageTitle: string): string {
  // Home page: just the site name (avoids "Chamtaburu Eco Village |
  // Chamtaburu Eco Village" — see Seo.tsx for how it's used for '/').
  return pageTitle ? `${pageTitle} | ${site.name}` : site.name;
}

/**
 * The best available existing photo to use as the default Open Graph /
 * Twitter card image for a site, until a dedicated 1200×630 social share
 * crop exists (docs/04-photography.md §5 reshoot list #14 — not yet shot).
 * Chosen per-site by the caller (see Seo.tsx's OG_IMAGE_BASE) from real
 * hero-quality photography already in the manifest — not invented.
 */
export type OgImage = ResolvedImage;

/**
 * LodgingBusiness JSON-LD for a property (village or resort), per
 * docs/02-architecture.md §7. Fields with no confirmed data
 * (docs/06-open-questions.md) are omitted rather than filled with
 * placeholders:
 *   - `geo`: omitted when site.geo is undefined (Q6 — coordinates not confirmed).
 *   - `priceRange`: omitted unless at least one cottage/room has a real
 *     numeric price (currently all are 'TBD' — Phase 2).
 *   - `amenityFeature`: omitted when no cottage/room has any confirmed
 *     amenities (currently all empty arrays — Phase 2).
 */
export function buildLodgingBusinessJsonLd(
  site: SiteConfig,
  units: Pick<Cottage, 'price' | 'amenities'>[],
  ogImage?: OgImage,
): Record<string, unknown> {
  const numericPrices = units.map((u) => u.price).filter((p): p is number => typeof p === 'number');

  const allAmenities = new Set<string>();
  for (const unit of units) {
    for (const amenity of unit.amenities) allAmenities.add(amenity);
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: site.name,
    legalName: site.legalName,
    description: site.tagline,
    url: siteOrigin(site),
    telephone: site.phones[0],
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
  };

  // Extra address detail (district) has no direct schema.org PostalAddress
  // field beyond addressLocality/addressRegion; fold it into the street line
  // isn't right either (it would misrepresent the postal address itself), so
  // it's simply not included here — locality + region + postalCode + country
  // is a complete, honest PostalAddress on its own.

  if (site.geo) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: site.geo.lat,
      longitude: site.geo.lng,
    };
  }

  if (site.mapsUrl) {
    jsonLd.hasMap = site.mapsUrl;
  }

  if (numericPrices.length > 0) {
    const min = Math.min(...numericPrices);
    const max = Math.max(...numericPrices);
    jsonLd.priceRange = min === max ? `₹${min}` : `₹${min} - ₹${max}`;
  }

  if (allAmenities.size > 0) {
    jsonLd.amenityFeature = [...allAmenities].map((key) => ({
      '@type': 'LocationFeatureSpecification',
      name: key,
      value: true,
    }));
  }

  if (ogImage) {
    jsonLd.image = `${siteOrigin(site)}${ogImage.fallbackSrc}`;
  }

  if (site.social.facebook || site.social.instagram || site.social.youtube) {
    jsonLd.sameAs = [site.social.facebook, site.social.instagram, site.social.youtube].filter(Boolean);
  }

  return jsonLd;
}

export interface BreadcrumbItem {
  name: string;
  path: string; // route path; the last item's path is the current page
}

/** BreadcrumbList JSON-LD, per docs/02-architecture.md §7 — used on cottage pages. */
export function buildBreadcrumbJsonLd(site: SiteConfig, items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(site, item.path),
    })),
  };
}
