/**
 * Build-time content validation.
 *
 * These functions are called at module load time from village.ts / resort.ts,
 * immediately after each array/object literal is defined. Throwing here fails
 * `vite build` (and the dev server) the moment the module graph is evaluated,
 * so a malformed content entry fails the build rather than the site.
 *
 * Deliberately dependency-free: a handful of explicit assertions covers what
 * this content set needs without pulling in a schema-validation library.
 */

import type { Cottage, Experience, SiteConfig } from './types';

class ContentValidationError extends Error {
  constructor(message: string) {
    super(`[content validation] ${message}`);
    this.name = 'ContentValidationError';
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ContentValidationError(message);
  }
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Digits only, with country code — e.g. 919242748100. See docs/03-content-model.md §2.
const WHATSAPP_RE = /^\d{11,15}$/;
// A valid Indian mobile number in international format: +91 followed by a
// 10-digit number starting 6-9, conventionally space-split as 5+5.
const INDIA_PHONE_RE = /^\+91 [6-9]\d{4} \d{5}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// '<site>/<name>' — must match a key scripts/photos.mjs actually wrote to
// public/img/manifest.json. See src/content/manifest.ts.
const IMAGE_BASE_RE = /^[a-z]+\/[a-z0-9]+(-[a-z0-9]+)*$/;

function assertImageRef(image: unknown, context: string): void {
  assert(image && typeof image === 'object', `${context}: image must be an object`);
  const img = image as Record<string, unknown>;
  assert(
    typeof img.base === 'string' && IMAGE_BASE_RE.test(img.base),
    `${context}: image.base is required and must look like '<site>/<name>', got ${JSON.stringify(img.base)}`,
  );
  assert(
    typeof img.alt === 'string' && img.alt.trim().length >= 10,
    `${context}: image.alt is required and must be descriptive (>= 10 chars), got ${JSON.stringify(img.alt)}`,
  );
}

export function validateCottages(cottages: Cottage[]): void {
  assert(Array.isArray(cottages) && cottages.length > 0, 'cottages must be a non-empty array');

  const seenSlugs = new Set<string>();
  const seenNumbers = new Set<string>();

  for (const cottage of cottages) {
    const ctx = `cottage ${cottage?.slug ?? '(no slug)'}`;

    assert(typeof cottage.slug === 'string' && SLUG_RE.test(cottage.slug), `${ctx}: slug must be lowercase-hyphenated`);
    assert(!seenSlugs.has(cottage.slug), `${ctx}: duplicate slug`);
    seenSlugs.add(cottage.slug);

    assert(/^\d{2}$/.test(cottage.number), `${ctx}: number must be a two-digit string like '01'`);
    assert(!seenNumbers.has(cottage.number), `${ctx}: duplicate number`);
    seenNumbers.add(cottage.number);

    assert(typeof cottage.name === 'string' && cottage.name.length > 0, `${ctx}: name is required`);
    assert(typeof cottage.tagline === 'string' && cottage.tagline.length > 0, `${ctx}: tagline is required`);
    assert(typeof cottage.theme === 'string' && cottage.theme.length > 0, `${ctx}: theme is required`);
    assert(typeof cottage.inspiration === 'string' && cottage.inspiration.length > 0, `${ctx}: inspiration is required`);
    assert(typeof cottage.story === 'string' && cottage.story.length > 0, `${ctx}: story is required`);
    assert(
      Array.isArray(cottage.interiorNotes) && cottage.interiorNotes.length > 0,
      `${ctx}: interiorNotes must be a non-empty array`,
    );

    assert(
      cottage.price === 'TBD' || typeof cottage.price === 'number',
      `${ctx}: price must be a number or 'TBD'`,
    );
    if (typeof cottage.price === 'number') {
      assert(cottage.price > 0, `${ctx}: price, if a number, must be positive`);
    }

    assert(
      cottage.extraBedPrice === undefined || cottage.extraBedPrice === 'TBD' || typeof cottage.extraBedPrice === 'number',
      `${ctx}: extraBedPrice must be a number, 'TBD', or omitted`,
    );

    assert(
      cottage.beds === 'TBD' || (typeof cottage.beds === 'string' && cottage.beds.length > 0),
      `${ctx}: beds is required (string or 'TBD')`,
    );

    assert(
      cottage.occupancy && (cottage.occupancy.adults === 'TBD' || typeof cottage.occupancy.adults === 'number'),
      `${ctx}: occupancy.adults must be a number or 'TBD'`,
    );

    assert(Array.isArray(cottage.amenities), `${ctx}: amenities must be an array`);
    assert(Array.isArray(cottage.images) && cottage.images.length > 0, `${ctx}: images must be a non-empty array`);
    cottage.images.forEach((image, i) => assertImageRef(image, `${ctx} image[${i}]`));

    assert(typeof cottage.available === 'boolean', `${ctx}: available must be a boolean`);
  }
}

export function validateExperiences(experiences: Experience[]): void {
  assert(Array.isArray(experiences), 'experiences must be an array');

  const seenSlugs = new Set<string>();

  for (const experience of experiences) {
    const ctx = `experience ${experience?.slug ?? '(no slug)'}`;

    assert(typeof experience.slug === 'string' && SLUG_RE.test(experience.slug), `${ctx}: slug must be lowercase-hyphenated`);
    assert(!seenSlugs.has(experience.slug), `${ctx}: duplicate slug`);
    seenSlugs.add(experience.slug);

    assert(typeof experience.title === 'string' && experience.title.length > 0, `${ctx}: title is required`);
    assert(
      typeof experience.description === 'string' && experience.description.length > 0,
      `${ctx}: description is required`,
    );
    assert(
      experience.price === undefined || experience.price === 'TBD' || typeof experience.price === 'number',
      `${ctx}: price must be a number, 'TBD', or omitted`,
    );
    assert(Array.isArray(experience.images), `${ctx}: images must be an array`);
    experience.images.forEach((image, i) => assertImageRef(image, `${ctx} image[${i}]`));
  }
}

export function validateSiteConfig(site: SiteConfig): void {
  const ctx = `site ${site?.key ?? '(no key)'}`;

  assert(site.key === 'village' || site.key === 'resort', `${ctx}: key must be 'village' or 'resort'`);
  assert(typeof site.name === 'string' && site.name.length > 0, `${ctx}: name is required`);
  assert(typeof site.legalName === 'string' && site.legalName.length > 0, `${ctx}: legalName is required`);
  assert(typeof site.domain === 'string' && site.domain.length > 0, `${ctx}: domain is required`);

  assert(WHATSAPP_RE.test(site.whatsapp), `${ctx}: whatsapp must be digits only with country code, got ${JSON.stringify(site.whatsapp)}`);

  assert(Array.isArray(site.phones) && site.phones.length > 0, `${ctx}: phones must be a non-empty array`);
  for (const phone of site.phones) {
    assert(INDIA_PHONE_RE.test(phone), `${ctx}: phone ${JSON.stringify(phone)} is not a valid +91 mobile number (must be 10 digits, formatted '+91 XXXXX XXXXX')`);
  }

  assert(/^\S+@\S+\.\S+$/.test(site.email), `${ctx}: email is not a valid address`);
  assert(!site.email.endsWith('.com'), `${ctx}: email must be on the .in domain, not .com (see docs/03-content-model.md corrections table)`);

  assert(site.address && typeof site.address.street === 'string' && site.address.street.length > 0, `${ctx}: address.street is required`);
  assert(typeof site.address.postalCode === 'string' && /^\d{6}$/.test(site.address.postalCode), `${ctx}: address.postalCode must be 6 digits`);
  assert(site.address.country === 'IN', `${ctx}: address.country must be 'IN'`);

  assert(GSTIN_RE.test(site.gstin), `${ctx}: gstin ${JSON.stringify(site.gstin)} does not match the GSTIN format`);

  if (site.geo !== undefined) {
    assert(typeof site.geo.lat === 'number' && typeof site.geo.lng === 'number', `${ctx}: geo, if present, must have numeric lat/lng`);
  }
}
