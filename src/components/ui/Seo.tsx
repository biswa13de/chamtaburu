import { Head } from 'vite-react-ssg';
import { currentSite } from '../../content/site';
import { resolveImage } from '../../content/manifest';
import { absoluteUrl, buildTitle, siteOrigin, type PageMeta } from '../../lib/seo';

/**
 * Default Open Graph / Twitter card image per site — the best available
 * *existing* hero-quality photo, chosen from the real image manifest
 * (src/content/manifest.ts), NOT a dedicated 1200x630 social share crop.
 * docs/04-photography.md §5 reshoot list item #14 ("Social share card,
 * 1200x630 exactly") is still on the outstanding reshoot list — once that
 * asset exists, swap these `base` keys for it. Until then, an existing wide
 * exterior/hero shot is a materially better WhatsApp/Facebook preview than
 * no image at all, and these already have generous native resolution
 * (Image pipeline generates up to 2400px-wide variants) so they crop
 * reasonably at the ~1.91:1 OG aspect ratio most platforms use.
 */
const OG_IMAGE_BASE: Record<'village' | 'resort', string> = {
  village: 'village/village-hero-hills',
  resort: 'resort/resort-hero-mist',
};

function defaultOgImage() {
  return resolveImage({
    base: OG_IMAGE_BASE[currentSite.key],
    alt: `${currentSite.name}, Ajodhya Hills, Purulia`,
  });
}

interface SeoProps extends PageMeta {
  /** Extra JSON-LD objects to emit as additional <script type="application/ld+json"> tags. */
  jsonLd?: Record<string, unknown>[];
}

/**
 * Renders per-route <title>, meta description, canonical link, Open Graph,
 * Twitter card and JSON-LD tags via vite-react-ssg's <Head> (a
 * react-helmet-async wrapper — see node_modules/vite-react-ssg README
 * "Document head"). This works correctly under SSG because:
 *
 *   1. At build time, vite-react-ssg renders each route to a string on the
 *      server and collects everything rendered inside <Head> into the
 *      actual prerendered HTML's real <head> — so each static HTML file on
 *      disk gets its own distinct <title>/<meta>/JSON-LD, not a shared one
 *      from index.html.
 *   2. In the browser, react-helmet-async re-renders on every route change
 *      (it's a normal React component, mounted per-page by each page
 *      component below) and imperatively patches document.head — so
 *      client-side navigations after hydration also update the tags
 *      correctly, not just the initial prerendered load.
 *
 * One <Seo> is rendered per page component (Home, Cottages, CottageDetail,
 * ...), not once globally in Layout — meta must differ per route, and
 * react-helmet-async merges nested <Head> instances outer-to-inner
 * (deepest/last-rendered wins per tag), so a page-level <Seo> naturally
 * overrides nothing global-only needs to declare.
 */
export function Seo({ title, description, path, image, type = 'website', jsonLd = [], noindex = false }: SeoProps) {
  const site = currentSite;
  const ogImage = image ?? defaultOgImage();
  const canonical = absoluteUrl(site, path);
  const fullTitle = buildTitle(site, title);
  const imageUrl = `${siteOrigin(site)}${ogImage.fallbackSrc}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content={String(ogImage.width)} />
      <meta property="og:image:height" content={String(ogImage.height)} />
      <meta property="og:image:alt" content={ogImage.alt} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter card — "summary_large_image" renders the same OG image
          large; no Twitter-specific asset needed. */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Keyed by @type — jsonLd is a short, static, order-stable list built
          fresh on every render (never reordered by user interaction), so an
          identity derived from content is enough and avoids a fragile
          array-index key. */}
      {jsonLd.map((entry) => (
        <script key={String(entry['@type'])} type="application/ld+json">
          {JSON.stringify(entry)}
        </script>
      ))}
    </Head>
  );
}
