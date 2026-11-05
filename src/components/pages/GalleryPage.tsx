import { Hero } from '../ui/Hero';
import { Section } from '../ui/Section';
import { Gallery } from '../ui/Gallery';
import { Seo } from '../ui/Seo';
import { village, cottages } from '../../content/village';
import { resolveImage } from '../../content/manifest';
import type { ImageRef } from '../../content/types';

const HERO_IMAGE = resolveImage({
  base: 'village/village-campus-garden-path',
  alt: 'Cottages and palm trees beside a lamp-lined garden path at Chamtaburu Eco Village, Ajodhya Hills',
});

// Campus photos (2026-11) lead the gallery, ahead of the cottage interiors.
const CAMPUS_IMAGES: ImageRef[] = [
  {
    base: 'village/village-campus-aerial',
    alt: 'Aerial view of red-roofed cottages, lawns and lamp-lined paths at Chamtaburu Eco Village, Ajodhya Hills, Purulia',
  },
  {
    base: 'village/village-campus-overview',
    alt: 'Red-roofed cottages and gardens with forested hills beyond, seen from above at Chamtaburu Eco Village, Purulia',
  },
  {
    base: 'village/village-campus-main-building',
    alt: 'Main building, lawns and red-roofed cottages under a blue sky at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-cottage-swing',
    alt: 'White cottage with red tile roof, garden swing and lawn at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-pathway',
    alt: 'Paved pathway between cottage verandas lined with young palms at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-garden-path',
    alt: 'Cottages and palm trees beside a lamp-lined garden path at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-hill',
    alt: 'Forested hill rising behind the campus wall and palms at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-hill-palm',
    alt: 'Young palm and garden gazebo with a forested hill behind at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    base: 'village/village-campus-night',
    alt: 'Cottages, lawn and main building lit up at night at Chamtaburu Eco Village, Ajodhya Hills',
  },
];

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
  for (const ref of CAMPUS_IMAGES) seen.set(ref.base, ref);
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
      <Seo
        title="Gallery"
        description={`Photos of the cottages, rooms and grounds at ${village.name} in the Ajodhya Hills, Purulia.`}
        path="/gallery"
      />
      <Hero image={HERO_IMAGE} heading="Gallery" subheading={village.name} size="compact" />

      <Section className="mt-16">
        <Gallery images={images} />
      </Section>
    </div>
  );
}
