/**
 * Build-time site selection.
 *
 * `__SITE__` is a Vite `define` global (see vite.config.ts) set from the
 * `VITE_SITE` env var at build time — 'village' by default, 'resort' when
 * built with `VITE_SITE=resort`. Each build only ever bakes in ONE site's
 * config and route tree; there is no runtime hostname sniffing.
 *
 * Components/pages that need "the current property's config" (name,
 * tagline, phones, address, ...) should import `currentSite` from here
 * rather than hardcoding `village` — except where content is genuinely
 * Village-only (the seven cottages), which stay direct imports from
 * src/content/village.ts.
 */
import { village } from './village';
import { resort } from './resort';
import type { SiteConfig } from './types';

export const currentSite: SiteConfig = __SITE__ === 'resort' ? resort : village;
