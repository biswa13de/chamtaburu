# 02 — Technical Architecture

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 6** | Already in place, fast, well-supported |
| UI | **React 19** + TypeScript | Already in place; existing components are reusable |
| Styling | **Tailwind CSS 4** | Already in place; design tokens via `@theme` |
| Routing | **react-router 6** | Downgraded from 7 in Phase 4 — see note below |
| Static generation | **`vite-react-ssg`** | Prerenders every route to real HTML — the critical SEO fix |
| Animation | **motion** | Already in place; keep, but reduce usage (see §7) |
| Icons | **lucide-react** | Already in place |
| Images | **sharp** via a prebuild script *(new)* | Responsive AVIF/WebP generation |
| Hosting | **Firebase Hosting** | Free tier, global CDN, atomic deploys |
| CI/CD | **GitHub Actions** | Free for public repos; deploys on push to `main` |

**No backend. No database. No server.** The entire site is static files on a CDN.

### On static generation

This is the most important technical change and worth justifying. Today the site is a
client-rendered SPA: every URL returns the same near-empty `index.html`, and content
appears only after React boots. Consequences:

- All routes share one `<title>` and no meta description.
- Social shares to WhatsApp and Facebook render a blank card — significant in this
  market, where a shared link *is* the marketing.
- Per-cottage pages cannot rank individually in search.
- First paint waits on a JS download over a rural mobile connection.

`vite-react-ssg` prerenders each route to a complete HTML file at build time, then
hydrates. Same React components, same developer experience; each URL becomes a real
document with its own title, description, Open Graph tags, and structured data. Roughly
a day of work and it is the difference between ranking and not ranking.

> **Alternative considered:** rewriting in Astro would give marginally better results
> (less JS shipped) but discards the existing component work. Not worth it at this size.
> Revisit only if page weight becomes a measured problem.

> **React Router version note (Phase 4):** this doc originally planned `vite-react-ssg`
> against react-router 7, which was "already in place" at the time of writing. In
> practice `vite-react-ssg` imports `react-router-dom/server`, an export path react-router
> 7 restructured, and the build fails outright (`ERR_PACKAGE_PATH_NOT_EXPORTED`) — not a
> soft peer-dependency warning, a real crash, confirmed by running it. React Router 8's
> own Framework Mode SSG was evaluated as the alternative and rejected: it requires a Node
> server runtime, React Server Components plugins, and a Cloudflare `wrangler` CLI as peer
> dependencies even when configured for fully static output — far more than a static
> seven-page brochure site needs, and in tension with the "no backend, no server"
> principle above. `react-router-dom` was downgraded to `^6.30.6`, which `vite-react-ssg`
> is actually built and tested against. Revisit if `vite-react-ssg` ever ships real v7+
> support, or if React Router's static-only Framework Mode configuration turns out to be
> lighter than it currently appears.

## 2. Multi-site build

One codebase, two deployed sites, distinguished by a build-time environment variable.

```
VITE_SITE=village  npm run build   →  dist/village   →  chamtaburu.in
VITE_SITE=resort   npm run build   →  dist/resort    →  resort.chamtaburu.in
```

Build-time rather than the current runtime hostname sniffing
([App.tsx:783](../src/App.tsx#L783)), because runtime detection cannot produce
per-property static HTML, meta tags, sitemaps, or robots files — and it lets anyone
force any variant with `?subdomain=`.

```
src/
  sites/
    village/          routes, page composition, site config
    resort/           routes, page composition, site config
  components/         shared UI — Header, Footer, CottageCard, EnquiryForm, Gallery…
  content/
    village.ts        all Eco Village content
    resort.ts         all Eco Resort content
    shared.ts         legal text, group info, social links
  lib/                seo.ts, whatsapp.ts, images.ts
```

The current duplicate implementations — [App.tsx](../src/App.tsx) versus
[Village.tsx](../src/components/Village.tsx) / [Resort.tsx](../src/components/Resort.tsx),
two different designs for the same properties — collapse into this single structure.

## 3. Hosting & deployment

**Firebase Hosting**, two sites in one Firebase project (`chamtaburu`):

```
firebase.json
  hosting:
    - target: village   public: dist/village   site: chamtaburu-village
    - target: resort    public: dist/resort    site: chamtaburu-resort
```

Custom domains `chamtaburu.in` and `resort.chamtaburu.in`, each with free
auto-provisioned and auto-renewed SSL.

**GitHub Actions** on push to `main`: install → typecheck → lint → build both targets →
deploy both. Pull requests deploy to a preview channel with a temporary URL, so changes
can be reviewed before going live.

### Why not Cloud Run

The current setup ([Dockerfile](../Dockerfile), [nginx.conf](../nginx.conf),
[cloudbuild.yaml](../cloudbuild.yaml)) is the wrong tool for static files:

| | Cloud Run (current) | Firebase Hosting (proposed) |
|---|---|---|
| Monthly cost | ~₹40–100 (Artifact Registry storage, growing with every revision) | **₹0** |
| Cold start | 2–5 s for the first visitor after idle | None — CDN edge |
| CDN | None configured | Global, included |
| Deploy | Build image → push → **manual `gcloud run deploy`** (the current `cloudbuild.yaml` has no deploy step at all) | One command / automatic |
| Rollback | Redeploy a previous revision | One click, atomic |
| Preview envs | None | Per-PR channels |
| Files to maintain | Dockerfile, nginx.conf, cloudbuild.yaml, .dockerignore, .gcloudignore | `firebase.json` |

Firebase Hosting is part of Google Cloud and bills to the same account, so this does not
abandon your GCP decision — it picks the correct GCP product.

**To be deleted:** `Dockerfile`, `nginx.conf`, `cloudbuild.yaml`, `.dockerignore`,
`.gcloudignore`. Old Artifact Registry images should be purged to stop the storage
charge.

## 4. Cost model

| Item | Provider | Cost |
|---|---|---|
| Hosting + CDN + SSL | Firebase Hosting Spark (free) | **₹0** — 10 GB/mo transfer, 360 MB storage |
| CI/CD | GitHub Actions | **₹0** |
| Enquiry email fallback | Web3Forms free tier | **₹0** — 250 submissions/mo |
| Analytics | GA4 or Cloudflare Web Analytics | **₹0** |
| Search Console | Google | **₹0** |
| Domain | existing `chamtaburu.in` | ~₹900/yr (already paid) |
| **Total recurring** | | **₹0/month** |

Headroom check: the built site should be ~2–4 MB total including optimized images. At
10 GB/month free transfer that supports roughly **3,000–5,000 visits/month** before any
charge, and the first paid tier (Blaze) is ~₹1.30/GB beyond it. You will not hit this
for a long time, and if you do, it means the site is working.

**Cost discipline rules:**
1. No paid SaaS without an explicit decision.
2. No server-side anything — the moment a backend exists, so does a monthly bill.
3. Images optimized at commit time, not request time.
4. Keep the total build under ~5 MB.

## 5. Content updates

Everything editable lives in `src/content/*.ts` as typed data. No component edits needed
for routine changes.

```ts
// src/content/village.ts
export const cottages: Cottage[] = [
  {
    slug: 'shal-shanti',
    number: '01',
    name: 'Shal Shanti',
    tagline: 'Where the forest whispers peace.',
    price: 2200,                       // ← change a price: one number, one line
    ...
  },
]
```

**To update the site:**
1. Edit the file on GitHub in the browser (no local setup, works from a phone).
2. Commit.
3. GitHub Actions rebuilds and deploys — live in about two minutes.

TypeScript catches structural mistakes (a missing price, a malformed cottage) at build
time, so a typo fails the build rather than breaking the live site.

A `CONTENT-GUIDE.md` written in plain language — no jargon — ships in Phase 6 so someone
other than you can do this.

> If editing a file ever proves too awkward in practice, the fallback is Decap CMS: a
> login page with forms and image upload, still free, still no server, committing to the
> same repo. Not built now — added only if the simple approach fails in real use.

## 6. Performance budget

Targets, measured on Lighthouse mobile with 4G throttling:

| Metric | Target |
|---|---|
| Performance score | ≥ 90 |
| Largest Contentful Paint | < 2.5 s |
| Cumulative Layout Shift | < 0.1 |
| Total page weight (home) | < 1.2 MB |
| JS bundle (gzipped) | < 150 kB |

How we get there:

- **Images**: AVIF with WebP fallback, responsive `srcset` at 480/960/1440/2400 px,
  `loading="lazy"` below the fold, explicit `width`/`height` on every image to prevent
  layout shift, and a tiny blurred LQIP placeholder. This is the single biggest lever —
  the source photos are up to 4.4 MB each and must never be served raw.
- **Fonts**: self-hosted WOFF2, subset to Latin, `font-display: swap`, preloaded.
  Replaces the render-blocking Google Fonts `@import` at
  [index.css:1](../src/index.css#L1), which also removes a third-party request that
  carries GDPR implications.
- **JS**: route-level code splitting; drop unused dependencies
  (`@google/genai`, `express`, `dotenv`, `@types/express` — none are referenced anywhere
  in `src/`).
- **Animation**: `motion` is currently used for decorative fade-ins on almost every
  element. Keep it for the mobile menu and the lightbox; remove the rest. Entry
  animations delay perceived content and hurt LCP. Respect
  `prefers-reduced-motion` throughout.

## 7. SEO implementation

| Item | Detail |
|---|---|
| Per-route `<title>`, description | Generated at build from content data |
| Open Graph + Twitter cards | 1200×630 image per property; verified against WhatsApp preview |
| `Hotel` / `LodgingBusiness` JSON-LD | Name, address, geo, phone, price range, amenities, images — per property |
| `BreadcrumbList` JSON-LD | On cottage pages |
| `sitemap.xml`, `robots.txt` | Generated per site at build |
| Canonical URLs | Absolute, per page |
| Semantic HTML | One `<h1>` per page, correct heading order, real `<nav>`/`<main>`/`<footer>` |
| Image `alt` text | Descriptive and location-bearing, written per image — not "Hero" |
| Google Business Profile | Linked and kept consistent with site NAP data |
| Google Search Console | Verified, sitemap submitted |

**Target keywords** (Purulia/Ajodhya cluster): *resort in Ajodhya Hills · Purulia
resort booking · Matha forest resort · eco resort Purulia · cottage stay Purulia ·
Baghmundi resort · places to stay near Ajodhya Hills · Purulia Palash season stay*.

Name/Address/Phone must be **byte-identical** across the site, Google Business Profile,
and every directory listing. Inconsistent NAP is the most common local-SEO failure.

## 8. Enquiry & booking flow

No payment processing. Two paths, both free:

**Primary — WhatsApp.** An enquiry form (dates, cottage, guests, name, phone) validates
client-side, then opens `wa.me` with the message pre-composed:

```
Hi Chamtaburu Eco Village! I'd like to enquire about a booking.

Cottage: Karam Kunja
Check-in: 12 Mar 2026
Check-out: 14 Mar 2026
Guests: 2 adults, 1 child
Name: ...
Phone: ...
```

Routed by property — Village → **9242748100**, Resort → **8918550242**. Arriving with
full details means fewer round-trips before a confirmed booking.

**Secondary — email.** The same form also posts to Web3Forms (free) so nothing is lost
if WhatsApp fails or the guest is on desktop. Delivered to **info@chamtaburu.in**.

Plus persistent click-to-call and click-to-WhatsApp buttons — a fixed bottom bar on
mobile, where most visitors are.

## 9. Security & privacy

- No secrets in the client bundle. The `GEMINI_API_KEY` currently baked in via
  [vite.config.ts:11](../vite.config.ts#L11) → [Dockerfile:12](../Dockerfile#L12) →
  [cloudbuild.yaml:6](../cloudbuild.yaml#L6) is unused and gets removed entirely. If
  that key is real, **rotate it** — it may already be in a published bundle.
- Security headers via `firebase.json`: CSP, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
- No cookies set, so no consent banner needed. The current banner
  ([App.tsx:93](../src/App.tsx#L93)) sets nothing, stores no consent, and reappears on
  every load — it gets deleted.
- Cookieless analytics.
- Enquiry data goes only to WhatsApp and your email; nothing is stored on the site.
- Remove the hotlinked TrustedSite trustmark ([App.tsx:81](../src/App.tsx#L81)) — used
  without a subscription — and the Visa/Mastercard/RuPay logos with the "all
  transactions are encrypted" claim ([App.tsx:534-540](../src/App.tsx#L534-L540)), which
  is untrue: no payments are processed.

## 10. Quality gates

Every push to `main` must pass:

- `tsc --noEmit` — no type errors
- ESLint — no errors (added; currently the `lint` script is only `tsc`)
- Build succeeds for both site targets
- Lighthouse CI ≥ 90 performance, ≥ 95 accessibility, 100 SEO on key routes
- No broken internal links

Accessibility is a hard requirement, not a nice-to-have: labelled form inputs, `aria-label`
on icon-only buttons, visible focus states, AA contrast, keyboard-operable lightbox and
menu. The current code fails most of these.
