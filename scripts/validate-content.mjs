/**
 * Build-time content validation entry point.
 *
 * `vite build` (no SSR/prerendering yet — that's Phase 4) only bundles
 * client code; it never *executes* application modules, so a plain
 * "throw at import time" inside src/content/village.ts is invisible to
 * `vite build` itself — it would only fire once a browser actually loads
 * the page. To make a malformed content entry fail the build (not just
 * the browser), this script uses Vite's own dev server module runner
 * (`ssrLoadModule`) to actually import and execute village.ts / resort.ts
 * under Node, with full TS + alias resolution, so the validation calls at
 * the bottom of each content file run for real, before `vite build` starts.
 *
 * Wired in as `npm run prebuild`, so `npm run build` fails before Vite's
 * bundling step even starts if content is malformed. Also runnable
 * directly as `npm run validate:content`.
 *
 * Written in plain JS (not .ts) and run with plain `node`: this repo's
 * documented minimum is Node 20 (.nvmrc / engines), and Node's native
 * TypeScript type-stripping isn't reliably available until much later
 * Node versions. Vite — already a devDependency — does the TypeScript
 * transpilation of the *content* files internally via ssrLoadModule, so
 * no new dependency (e.g. tsx, ts-node) and no Node-version assumption
 * beyond what the rest of this project already requires.
 */
import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  });

  try {
    await server.ssrLoadModule('/src/content/village.ts');
    await server.ssrLoadModule('/src/content/resort.ts');
    console.log('[validate-content] OK — village.ts and resort.ts loaded and validated.');
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error('[validate-content] FAILED');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
