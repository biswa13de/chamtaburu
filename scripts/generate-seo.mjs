/**
 * Postbuild step — generates sitemap.xml and robots.txt into dist/<site>/,
 * per docs/05-build-phases.md Phase 6 ("sitemap.xml, robots.txt, canonical
 * URLs — generated per site").
 *
 * Runs AFTER `vite-react-ssg build` (wired as `npm run build`'s final step —
 * see package.json), reading the same content modules the app itself uses so
 * the route list can never drift from what's actually prerendered: the
 * Village's seven cottage slugs, for instance, come from the same
 * `cottages` array src/main.tsx's `getStaticPaths` uses, not a hand-maintained
 * duplicate list here.
 *
 * Written in plain JS run with plain `node`, using Vite's `createServer` +
 * `ssrLoadModule` to import the real TypeScript content modules under
 * Node — the same technique scripts/validate-content.mjs already uses, for
 * the same reason (no tsx/ts-node dependency, full TS+alias resolution via
 * Vite itself).
 *
 * Deliberately excludes: /404 and the catch-all 404 route (never indexed —
 * see the `noindex` meta on NotFound.tsx). Not a full crawl of the built
 * HTML — the route list is derived from content data, matching how
 * src/main.tsx itself defines VILLAGE_ROUTES / RESORT_ROUTES, so keeping this
 * script's route list in sync with main.tsx when routes change is a
 * conscious edit, not automatic — see the ROUTES_NOTE below.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SITES = ['village', 'resort'];

async function loadContent(server) {
  const { village, cottages } = await server.ssrLoadModule('/src/content/village.ts');
  const { resort } = await server.ssrLoadModule('/src/content/resort.ts');
  return { village, cottages, resort };
}

// ROUTES_NOTE: mirrors src/main.tsx's VILLAGE_ROUTES / RESORT_ROUTES path
// list. If a route is added/removed there, update it here too — there is no
// automatic reflection between the two (see file header).
function routesForSite(site, { cottages }) {
  if (site === 'village') {
    return [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/cottages', changefreq: 'weekly', priority: '0.9' },
      ...cottages.map((c) => ({ path: `/cottages/${c.slug}`, changefreq: 'monthly', priority: '0.8' })),
      { path: '/experiences', changefreq: 'monthly', priority: '0.7' },
      { path: '/gallery', changefreq: 'monthly', priority: '0.6' },
      { path: '/contact', changefreq: 'monthly', priority: '0.6' },
      { path: '/legal', changefreq: 'yearly', priority: '0.3' },
    ];
  }
  return [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/accommodation', changefreq: 'weekly', priority: '0.9' },
    { path: '/contact', changefreq: 'monthly', priority: '0.6' },
    { path: '/legal', changefreq: 'yearly', priority: '0.3' },
  ];
}

function buildSitemap(origin, routes) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots(origin) {
  return `User-agent: *
Allow: /
Disallow: /404

Sitemap: ${origin}/sitemap.xml
`;
}

async function main() {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  });

  let content;
  try {
    content = await loadContent(server);
  } finally {
    await server.close();
  }

  // Only generate for the site that was actually just built (VITE_SITE),
  // matching how vite.config.ts picks a single outDir per invocation — this
  // script runs once per `npm run build` call, same as the build itself.
  const site = SITES.includes(process.env.VITE_SITE) ? process.env.VITE_SITE : 'village';
  const siteConfig = site === 'resort' ? content.resort : content.village;
  const origin = `https://${siteConfig.domain}`;
  const routes = routesForSite(site, content);
  const outDir = path.join(ROOT, 'dist', site);

  await writeFile(path.join(outDir, 'sitemap.xml'), buildSitemap(origin, routes), 'utf8');
  await writeFile(path.join(outDir, 'robots.txt'), buildRobots(origin), 'utf8');

  console.log(`[generate-seo] Wrote sitemap.xml (${routes.length} URLs) and robots.txt to dist/${site}/`);
}

main().catch((err) => {
  console.error('[generate-seo] Failed:', err);
  process.exitCode = 1;
});
