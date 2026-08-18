/// <reference types="vite/client" />

/**
 * Injected via `define` in vite.config.ts from the VITE_SITE env var —
 * selects which property's content/routes a given build produces. See
 * src/content/site.ts.
 */
declare const __SITE__: 'village' | 'resort';
