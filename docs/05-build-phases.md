# 05 — Build Phases

Eight phases. Each ends in a working, deployable state — nothing is left half-migrated.
Phases 0–3 need nothing from you and can start immediately.

Estimates assume focused work; they are sequencing guidance, not commitments.

---

## Phase 0 — Cleanup & foundation

*No dependencies. Deletes ~700 lines and every unused dependency.*

- [x] Delete AI Studio scaffold: `metadata.json`, the templated `README.md` with the
      stranger's banner image
- [x] Remove the entire `GEMINI_API_KEY` path — [vite.config.ts:11](../vite.config.ts#L11),
      [Dockerfile:12](../Dockerfile#L12), [cloudbuild.yaml:6](../cloudbuild.yaml#L6),
      [.env.example](../.env.example). **Rotate the key if it is real** — it may already
      be published in a deployed bundle
- [x] Drop unused dependencies: `@google/genai`, `express`, `dotenv`, `@types/express`,
      `tsx`, `autoprefixer` — none appear anywhere in `src/`
- [x] Delete the two duplicate 344 kB poster files at repo root (byte-identical, unrelated
      to the app)
- [x] Delete Cloud Run artifacts: `Dockerfile`, `nginx.conf`, `cloudbuild.yaml`,
      `.dockerignore`, `.gcloudignore`
- [x] Rename package from `react-example`; write a real `README.md`
- [x] Add ESLint + Prettier; extend `lint` beyond bare `tsc --noEmit`
- [x] `.gitignore`: raw `photos/`, `dist/`, editor files
- [x] Add `.nvmrc`, `engines` field

**Done when:** `npm ci && npm run lint && npm run build` is clean, `node_modules` is
smaller, and no secret-shaped value exists anywhere in the repo.

> Note: `npm run lint`/`typecheck` still surface unused-import errors in `App.tsx` and
> `Resort.tsx` — the duplicate-design files Phase 1 deletes outright. Not worth cleaning
> up here since that code is being removed, not kept.

---

## Phase 1 — Design system & shared components

*The consolidation. Two conflicting designs become one.*

- [x] Define the palette from [01-strategy.md](01-strategy.md) §4 as Tailwind `@theme`
      tokens; verify AA contrast for every text/background pair
- [x] Self-host Inter + Cormorant Garamond as subset WOFF2; remove the render-blocking
      Google Fonts `@import` at [index.css:1](../src/index.css#L1)
- [x] Build the shared component library: `Header`, `Footer`, `Section`, `Hero`,
      `Button`, `Card`, `Gallery`, `Lightbox`, `Prose`, `Breadcrumbs`
- [x] Build the `Image` component: `srcset`, AVIF/WebP, LQIP, explicit dimensions,
      required `alt`
- [x] Mobile navigation — keyboard accessible, focus-trapped, `prefers-reduced-motion`
      respected
- [x] **Delete the duplicate implementation.** [Home.tsx](../src/components/Home.tsx),
      [Resort.tsx](../src/components/Resort.tsx), [Village.tsx](../src/components/Village.tsx)
      and the page components inside [App.tsx](../src/App.tsx) are two different designs
      for the same properties; one survives
- [x] Delete the cookie banner ([App.tsx:93](../src/App.tsx#L93)) — it sets no cookie and
      stores no consent
- [x] Strip decorative entry animations; keep motion for menu and lightbox only

**Done when:** one visual language, a Storybook-less but documented component set, and
`App.tsx` is under 100 lines.

> Note: `Image.tsx` accepts `srcSet`/`sizes` props but real AVIF/WebP/LQIP generation is
> Phase 3 (the `sharp` pipeline doesn't exist yet). `Home`/`Accommodations`/`Contact`/
> `Legal` under `src/components/pages/` are placeholder compositions proving the design
> system renders end to end — real routing, content, and site-specific pages are Phase 2/4.

---

## Phase 2 — Content layer

*Everything editable becomes data.*

- [x] `src/content/types.ts` — the schema from [03-content-model.md](03-content-model.md)
- [x] `src/content/village.ts` — site config, all seven cottages with stories transcribed
      from the vision doc, experiences
- [x] `src/content/resort.ts` — site config, accommodation (prices flagged `TBD`)
- [x] `src/content/shared.ts` — legal text, group info, social links
- [x] Apply the contact corrections: `info@chamtaburu.in`, remove the invalid 9-digit
      phone, split addresses by property, add GSTIN
- [x] Build-time validation so a malformed entry fails the build rather than the site

**Done when:** no user-visible string is hardcoded in a component, and changing a price
is a one-line edit.

> Note: `Cottage.price`/`occupancy`/`beds` use a `number | 'TBD'`-style union rather than
> inventing figures — none exist yet ([06-open-questions.md](06-open-questions.md) Q2).
> Resort `accommodation` is an empty array, not a TBD-priced placeholder list — the room
> *types* themselves are unverified prototype fiction (Q3), and empty is more honest than
> invented structure. All seven cottages are `available: false` pending Q1. Cottage images
> reference a shared placeholder pool at `/img/village/shared-pool/...` (Phase 3's sharp
> pipeline will populate real files at that convention) since no per-cottage photography
> exists yet. Validation runs via `npm run prebuild` using Vite's `ssrLoadModule`, since
> `vite build` alone never executes application code (SSR/prerendering is Phase 4) — a
> plain throw-at-import in the content files would otherwise be invisible to the build.

---

## Phase 3 — Image pipeline

*Depends on nothing; unblocks all page work.*

- [x] `scripts/photos.mjs` using `sharp` — responsive AVIF/WebP at 480/960/1440/2400,
      LQIP generation, EXIF stripping
- [x] `npm run photos` script
- [x] Process the 18 existing photographs; rename descriptively
- [x] Write `alt` text for every image
- [x] Branded placeholder component for unfilled slots

**Done when:** every source photo has an optimized set, and the largest served image is
under ~200 kB.

> Note: 17 of the 18 photos are processed — `IMG_7314.jpg` (eco_resort) is excluded, it's
> motion-blurred and unusable per [04-photography.md](04-photography.md) §1. Eight sources
> (one very high-resolution portrait exterior, seven resort shots) are detail-dense enough
> that they don't clear the 200 kB budget at 1440/2400px even at the spec'd quality
> 72/78 — confirmed empirically, not a pipeline bug. Those eight are capped at 960px with
> a mild quality trim (AVIF 65, WebP 71, JPEG 68) rather than shipping oversized files or
> visibly degrading quality further; every current call site displays them well under
> 960px wide anyway. Revisit the cap once better source photography exists (§5, reshoot
> list #1). `ImageRef` now stores a `base` key into `public/img/manifest.json` (built by
> the pipeline) rather than a flat `src` — `src/content/manifest.ts`'s `resolveImage()`
> expands it into AVIF/WebP srcsets, a JPEG fallback, dimensions, and the LQIP data URI.
> `Image.tsx` renders a real `<picture>` with AVIF → WebP → JPEG fallback and an
> LQIP blur-up transition.

---

## Phase 4 — Eco Village site

*The flagship. The biggest phase.*

- [x] `vite-react-ssg` integration; two build targets (`VITE_SITE=village|resort`)
- [x] Home — hero, seven-cottage grid, story, experiences, location, properties, enquiry
- [x] `/cottages` — all seven with price and capacity
- [x] `/cottages/[slug]` ×7 — the full page structure from
      [03-content-model.md](03-content-model.md) §3
- [x] `/experiences` — bonfire, nature trail, tribal art, local sightseeing
- [x] `/gallery`
- [x] `/contact` — directions, click-to-call
- [x] `/legal` — pending-status data layer wired (see note)
- [x] `/404`
- [x] **Remove Junction entirely** — routes, components, nav links, footer links (done in
      Phase 1)

**Done when:** every Village route renders as prerendered HTML with correct content.

> Note: `vite-react-ssg` doesn't actually work against react-router-dom v7 — it imports
> `react-router-dom/server`, an export path v7 restructured, and fails at build time with
> `ERR_PACKAGE_PATH_NOT_EXPORTED` (confirmed by running it, not just reading the peer-dep
> warning). React Router v8's own Framework Mode SSG was considered and rejected — it
> requires a Node server runtime, RSC plugins, and a Cloudflare `wrangler` CLI as peer
> deps even for static-only output, far heavier than this project's "no backend, no
> server" principle warrants. `react-router-dom` was downgraded to `^6.30.6`, which
> `vite-react-ssg` is actually built and tested against; verified working end to end.
> No real map embed exists — `/contact` links out to a Google Maps search by address
> (no API key, no coordinates needed) rather than an embed, since geo coordinates aren't
> confirmed yet ([06-open-questions.md](06-open-questions.md) Q6). Drive times are not
> shown (Q8, not yet known). `/legal` still shows "pending" status per policy — no
> lawyer-reviewed text exists to draft from yet; the *garbled* AI-Studio placeholder text
> the original checklist item referred to was already removed in Phase 2.

---

## Phase 5 — Enquiry flow & QR codes

- [ ] `EnquiryForm` — dates, cottage, guests, name, phone; client-side validation
- [ ] WhatsApp deep link with pre-composed message, routed per property
      (Village `919242748100`, Resort `918918550242`)
- [ ] Web3Forms email fallback to `info@chamtaburu.in`
- [ ] Fixed mobile call/WhatsApp bar
- [ ] **Remove the fake checkout** ([App.tsx:693](../src/App.tsx#L693)) — hardcoded
      dates, hardcoded ₹21,240, a button that does nothing
- [ ] **Remove the false payment claims** — Visa/Mastercard/RuPay logos and "all
      transactions are encrypted" ([App.tsx:534-540](../src/App.tsx#L534-L540)); no
      payments are processed
- [ ] **Remove the hotlinked TrustedSite badge** ([App.tsx:81](../src/App.tsx#L81)) —
      used without a subscription
- [ ] Wire the social icons to real URLs, or remove them
      ([App.tsx:65-67](../src/App.tsx#L65-L67) — currently `cursor-pointer` with no href)
- [ ] **Generate printable QR codes** for the seven cottage URLs — SVG and PDF, sized for
      the story cards in vision doc §19

**Done when:** an enquiry arrives on your WhatsApp with all details filled in, and the
QR codes resolve to the right pages.

---

## Phase 6 — SEO, analytics & deployment

- [ ] Per-route meta, Open Graph, Twitter cards; verify the WhatsApp share preview on a
      real device
- [ ] `LodgingBusiness` JSON-LD per property; `BreadcrumbList` on cottage pages
- [ ] `sitemap.xml`, `robots.txt`, canonical URLs — generated per site
- [ ] Firebase project, two hosting sites, `firebase.json` with security headers
- [ ] Custom domains + auto SSL; DNS cutover from Cloud Run
- [ ] GitHub Actions: typecheck → lint → build both → deploy; preview channels on PRs
- [ ] Cookieless analytics; Google Search Console verified, sitemaps submitted
- [ ] Google Business Profile aligned to identical NAP data
- [ ] **`CONTENT-GUIDE.md`** — plain-language instructions for updating prices, photos,
      and text without a developer
- [ ] Delete old Artifact Registry images to stop the storage charge

**Done when:** both domains serve from Firebase, pushing to `main` deploys automatically,
and Search Console has accepted the sitemaps.

---

## Phase 7 — Eco Resort site

*Deliberately after the Village. Content-blocked on confirmed rooms and prices.*

- [ ] Resort home — hero, story, cottages, garden, evenings
- [ ] `/accommodation` with verified room data
- [ ] `/contact`, `/legal`, `/404`
- [ ] Cross-links between properties

**Done when:** `resort.chamtaburu.in` is live and consistent with the Village site.

---

## Phase 8 — Polish & verification

- [ ] Lighthouse ≥ 90 performance, ≥ 95 accessibility, 100 SEO on key routes
- [ ] Manual accessibility pass: keyboard-only navigation, screen reader, focus order,
      contrast
- [ ] Real-device testing — mid-range Android on 4G is the target, not a MacBook
- [ ] Cross-browser: Chrome, Safari, Firefox, Samsung Internet
- [ ] Broken-link check
- [ ] Verify NAP consistency across site, Google Business Profile, and directories
- [ ] Favicon and app icons
- [ ] Print stylesheet for the legal page

---

## Sequencing

```
Phase 0 ─→ 1 ─→ 2 ─┬─→ 4 ─→ 5 ─→ 6 ─→ 8
          Phase 3 ─┘         └─→ 7 ─┘

Phases 0–3: no input needed from you — can start now
Phase 4:    needs cottage prices and capacity (Q2)
Phase 5:    needs nothing further
Phase 6:    needs domain/DNS access and Firebase project access
Phase 7:    needs confirmed Resort rooms and prices (Q3)
```

**Recommended first milestone:** Phases 0–6 shipped as the Eco Village site with a
"Resort — details coming soon" link. A live, correct, fast Village site earns more than
two half-finished ones.
