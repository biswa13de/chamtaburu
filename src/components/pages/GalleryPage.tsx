import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Gallery } from '../ui/Gallery';
import { village, cottages } from '../../content/village';
import { resolveImage } from '../../content/manifest';
import type { ImageRef } from '../../content/types';

const HERO_IMAGE = resolveImage({
  base: 'village/village-hero-hills',
  alt: 'Ajodhya Hills view with palm trees near Chamtaburu Eco Village, Purulia',
});

// The seven cottages currently all reference the same SHARED_GALLERY pool
// (docs/04-photography.md §3, "the seven-cottage problem"), so collecting
// `cottage.images` across all seven and de-duping by manifest `base` yields
// the same set once, plus a couple of extra hero/exterior shots not used on
// any cottage page.
const EXTRA_IMAGES: ImageRef[] = [
  {
    base: 'village/village-hero-hills',
    alt: 'Ajodhya Hills view with palm trees near Chamtaburu Eco Village, Purulia',
  },
  {
    base: 'village/village-desk-area',
    alt: 'Cottage desk and work area at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-room-bare',
    alt: 'Simply furnished cottage room at Chamtaburu Eco Village, Ajodhya Hills',
  },
];

function collectGalleryImages(): ImageRef[] {
  const seen = new Map<string, ImageRef>();
  for (const cottage of cottages) {
    for (const ref of cottage.images) {
      if (!seen.has(ref.base)) seen.set(ref.base, ref);
    }
  }
  for (const ref of EXTRA_IMAGES) {
    if (!seen.has(ref.base)) seen.set(ref.base, ref);
  }
  return [...seen.values()];
}

export function GalleryPage() {
  const images = collectGalleryImages().map((ref) => {
    const resolved = resolveImage(ref);
    return {
      src: resolved.fallbackSrc,
      alt: resolved.alt,
      width: resolved.width,
      height: resolved.height,
    };
  });

  return (
    <div className="pb-24">
      <Hero image={HERO_IMAGE} heading="Gallery" subheading={village.name} size="compact" />

      <Section className="mt-16">
        <Gallery images={images} />
      </Section>
    </div>
  );
}
