import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

/**
 * One codebase, two deployed sites.
 *
 *   VITE_SITE=village npm run build  ->  dist/village  ->  chamtaburu.in
 *   VITE_SITE=resort  npm run build  ->  dist/resort   ->  resort.chamtaburu.in
 *
 * The site is chosen at build time rather than sniffed from the hostname at
 * runtime, so each property gets its own prerendered HTML, meta tags, sitemap
 * and robots.txt. See docs/02-architecture.md.
 */
const SITES = ['village', 'resort'] as const;
type Site = (typeof SITES)[number];

function resolveSite(): Site {
  const value = process.env.VITE_SITE ?? 'village';
  if (!SITES.includes(value as Site)) {
    throw new Error(`VITE_SITE must be one of ${SITES.join(' | ')} — received "${value}"`);
  }
  return value as Site;
}

export default defineConfig(() => {
  const site = resolveSite();

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __SITE__: JSON.stringify(site),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: `dist/${site}`,
      emptyOutDir: true,
      target: 'es2022',
    },
    server: {
      port: 3000,
    },
  };
});
