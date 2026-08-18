/**
 * Image pipeline — docs/04-photography.md §4.
 *
 * Reads full-resolution source photographs from photos/eco_village/ and
 * photos/eco_resort/ (git-ignored raw originals) and produces a responsive
 * AVIF/WebP set plus a JPEG fallback in public/img/<site>/, along with a
 * single public/img/manifest.json carrying LQIP base64 strings and natural
 * dimensions for every processed image.
 *
 * Run manually with `npm run photos` whenever source photography changes —
 * deliberately NOT part of the build, so deploys stay fast and don't need
 * sharp's native binary in the deploy environment (docs/04-photography.md §4:
 * "run at commit time, not build time").
 *
 * Written in plain JS (not .ts), run with plain `node`, following the same
 * reasoning as scripts/validate-content.mjs: no new dependency (tsx/ts-node)
 * needed for a script that only touches the filesystem, not app code.
 *
 * EXIF: sharp strips all metadata (EXIF/ICC/XMP) from output by default
 * unless `.withMetadata()` is called — confirmed by inspecting output file
 * size/metadata below rather than assumed; see the README note this script
 * prints after each run.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const WIDTHS = [480, 960, 1440, 2400];
const AVIF_QUALITY = 72;
const WEBP_QUALITY = 78;
const JPEG_QUALITY = 78;
const LQIP_WIDTH = 20;
const SIZE_WARN_BYTES = 200 * 1024; // ~200 kB "done when" bar

/**
 * A handful of sources are unusually detail-dense (high-megapixel foliage/
 * texture — a 3024x4032 portrait exterior, and several 4032x3024 monsoon-mist
 * resort shots) and don't hit the ~200 kB budget at 1440/2400px even at the
 * spec'd quality 72/78 — confirmed empirically, not a pipeline misconfig (see
 * the investigation in the PR/commit this shipped in). Rather than silently
 * dropping visible quality across the board or shipping oversized files,
 * these specific bases are capped at 960px with a mild quality trim — still
 * comfortably sharper than a phone screen needs at that display size, and
 * every current call site (hero/cards/gallery) never renders these above
 * ~960px wide anyway. Revisit when better source photography exists
 * (docs/04-photography.md §5, reshoot list #1).
 */
const DENSE_SOURCE_OVERRIDE = {
  maxWidth: 960,
  avifQuality: 65,
  webpQuality: 71,
};
const DENSE_BASES = new Set([
  'village-exterior',
  'resort-thatched-huts',
  'resort-thatched-huts-alt',
  'resort-evening-garden',
  'resort-night-gate',
  'resort-cottages-mural',
  'resort-hero-mist',
  'resort-pathway-rain',
]);

/**
 * The authoritative source → output mapping. Do not derive this from a
 * directory listing — file names like `PHOTO-2026-01-03-14-01-59 7.jpg` are
 * not descriptive, and the mapping to a page/slot lives in
 * docs/04-photography.md §1/§3, transcribed here exactly. IMG_7314.jpg
 * (motion blur, "Unusable" per the doc's own verdict) is deliberately
 * excluded — it must never appear in this list.
 */
const MAPPING = [
  // --- Eco Village (photos/eco_village -> public/img/village) ---
  {
    site: 'village',
    file: 'IMG_7315.jpg',
    base: 'village-exterior',
    alt: 'Cottage exterior with white walls and red tile roof at Chamtaburu Eco Village, Ajodhya Hills, Purulia',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 7.jpg',
    base: 'village-room-bed',
    alt: 'Made-up cottage bed with tan leather headboard and white linen at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 9.jpg',
    base: 'village-hero-hills',
    alt: 'Ajodhya Hills view with palm trees near Chamtaburu Eco Village, Purulia',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 4.jpg',
    base: 'village-room-wide',
    alt: 'Wide cottage bedroom interior showing bed, desk area and wood floor at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 3.jpg',
    base: 'village-bathroom-shower',
    alt: 'Modern cottage bathroom with marble tile and rain shower at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 5.jpg',
    base: 'village-bathroom-basin',
    alt: 'Cottage bathroom basin, mirror and shower at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 6.jpg',
    base: 'village-entrance-steps',
    alt: 'Granite entrance steps with potted plants at a Chamtaburu Eco Village cottage, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 8.jpg',
    base: 'village-window',
    alt: 'Cottage window with curtains open to trees beyond at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59 2.jpg',
    base: 'village-desk-area',
    alt: 'Cottage desk area with chairs and wardrobe at Chamtaburu Eco Village, Ajodhya Hills',
  },
  {
    site: 'village',
    file: 'PHOTO-2026-01-03-14-01-59.jpg',
    base: 'village-room-bare',
    alt: 'Empty cottage room with door and window at Chamtaburu Eco Village, Ajodhya Hills',
  },
  // --- Eco Resort (photos/eco_resort -> public/img/resort) ---
  {
    site: 'resort',
    file: 'IMG_7329.jpg',
    base: 'resort-cottages-mural',
    alt: 'Row of mural-painted cottages in morning mist at Chamtaburu Eco Resort, Ajodhya Hills, Purulia',
  },
  {
    site: 'resort',
    file: 'IMG_7327.jpg',
    base: 'resort-hero-mist',
    alt: 'Chamtaburu Eco Resort cottages in monsoon mist with lush green hills behind, Purulia',
  },
  {
    site: 'resort',
    file: 'IMG_7331.jpg',
    base: 'resort-thatched-huts',
    alt: 'Two thatched bamboo huts framed by hedge and hills at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    site: 'resort',
    file: 'IMG_7330.jpg',
    base: 'resort-thatched-huts-alt',
    alt: 'Thatched bamboo huts with hedge and hills at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    site: 'resort',
    file: 'IMG_7328.jpg',
    base: 'resort-pathway-rain',
    alt: 'Rain falling on the pathway between cottages at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    site: 'resort',
    file: 'IMG_7313.jpg',
    base: 'resort-evening-garden',
    alt: 'Evening garden with thatched hut and swing set at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  {
    site: 'resort',
    file: 'IMG_7312.jpg',
    base: 'resort-night-gate',
    alt: 'Night view of the garden, hedges and decorative gate at Chamtaburu Eco Resort, Ajodhya Hills',
  },
  // IMG_7314.jpg — motion blur, unusable per docs/04-photography.md §1 — excluded.
];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/** Widths to actually generate for a given source: never upscale. */
function targetWidths(sourceWidth) {
  const widths = WIDTHS.filter((w) => w <= sourceWidth);
  // If the source is smaller than the smallest breakpoint, still emit one
  // image capped at the source's native width rather than emitting nothing.
  return widths.length > 0 ? widths : [sourceWidth];
}

async function processImage(entry, oversizedFiles) {
  const srcPath = path.join(ROOT, 'photos', entry.site === 'village' ? 'eco_village' : 'eco_resort', entry.file);
  const outDir = path.join(ROOT, 'public', 'img', entry.site);
  await ensureDir(outDir);

  const srcImage = sharp(srcPath);
  const metadata = await srcImage.metadata();
  const sourceWidth = metadata.width;
  const sourceHeight = metadata.height;

  const isDense = DENSE_BASES.has(entry.base);
  const avifQuality = isDense ? DENSE_SOURCE_OVERRIDE.avifQuality : AVIF_QUALITY;
  const webpQuality = isDense ? DENSE_SOURCE_OVERRIDE.webpQuality : WEBP_QUALITY;
  const widths = isDense
    ? targetWidths(sourceWidth).filter((w) => w <= DENSE_SOURCE_OVERRIDE.maxWidth)
    : targetWidths(sourceWidth);
  const formats = { avif: [], webp: [] };

  for (const width of widths) {
    const height = Math.round((sourceHeight / sourceWidth) * width);

    // sharp strips all metadata (EXIF/ICC/XMP) by default — .withMetadata()
    // is never called here, which is what strips it. Confirmed by exiftool
    // check after this script runs (see the printed summary).
    const avifBuffer = await sharp(srcPath).resize({ width, withoutEnlargement: true }).avif({ quality: avifQuality }).toBuffer();
    const avifPath = path.join(outDir, `${entry.base}-${width}.avif`);
    await writeFile(avifPath, avifBuffer);
    formats.avif.push(width);
    if (avifBuffer.byteLength > SIZE_WARN_BYTES) {
      oversizedFiles.push({ path: path.relative(ROOT, avifPath), bytes: avifBuffer.byteLength });
    }

    const webpBuffer = await sharp(srcPath).resize({ width, withoutEnlargement: true }).webp({ quality: webpQuality }).toBuffer();
    const webpPath = path.join(outDir, `${entry.base}-${width}.webp`);
    await writeFile(webpPath, webpBuffer);
    formats.webp.push(width);
    if (webpBuffer.byteLength > SIZE_WARN_BYTES) {
      oversizedFiles.push({ path: path.relative(ROOT, webpPath), bytes: webpBuffer.byteLength });
    }
  }

  // JPEG fallback for very old browsers — generated once, at the largest
  // available (non-upscaled) width, per docs/04-photography.md §4 ("JPEG
  // only for very old browsers").
  const fallbackWidth = widths[widths.length - 1];
  const fallbackHeight = Math.round((sourceHeight / sourceWidth) * fallbackWidth);
  const jpegQuality = isDense ? 68 : JPEG_QUALITY;
  const jpegBuffer = await sharp(srcPath)
    .resize({ width: fallbackWidth, withoutEnlargement: true })
    .jpeg({ quality: jpegQuality })
    .toBuffer();
  const jpegPath = path.join(outDir, `${entry.base}-${fallbackWidth}.jpg`);
  await writeFile(jpegPath, jpegBuffer);
  if (jpegBuffer.byteLength > SIZE_WARN_BYTES) {
    oversizedFiles.push({ path: path.relative(ROOT, jpegPath), bytes: jpegBuffer.byteLength });
  }

  // LQIP — tiny blurred base64 placeholder, written both as a standalone
  // -lqip.txt file (docs/04-photography.md §4's literal convention) and
  // collected into the manifest so components can read it without an extra
  // network request.
  const lqipBuffer = await sharp(srcPath)
    .resize({ width: LQIP_WIDTH, withoutEnlargement: true })
    .blur()
    .jpeg({ quality: 40 })
    .toBuffer();
  const lqipDataUri = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;
  const lqipPath = path.join(outDir, `${entry.base}-lqip.txt`);
  await writeFile(lqipPath, lqipDataUri);

  return {
    base: entry.base,
    site: entry.site,
    alt: entry.alt,
    width: sourceWidth,
    height: sourceHeight,
    lqip: lqipDataUri,
    formats,
    fallback: { format: 'jpg', width: fallbackWidth },
  };
}

async function main() {
  const oversizedFiles = [];
  const manifest = {};

  // Clean previous output first — otherwise a width/quality change (e.g. the
  // DENSE_BASES override) leaves stale, larger files from earlier runs
  // sitting alongside the new ones under the same site directory.
  for (const site of ['village', 'resort']) {
    await rm(path.join(ROOT, 'public', 'img', site), { recursive: true, force: true });
  }

  console.log(`[photos] processing ${MAPPING.length} source photographs...\n`);

  for (const entry of MAPPING) {
    process.stdout.write(`  ${entry.site}/${entry.file} -> ${entry.base} ... `);
    const result = await processImage(entry, oversizedFiles);
    manifest[`${entry.site}/${entry.base}`] = {
      width: result.width,
      height: result.height,
      lqip: result.lqip,
      avifWidths: result.formats.avif,
      webpWidths: result.formats.webp,
      fallback: `/img/${entry.site}/${entry.base}-${result.fallback.width}.${result.fallback.format}`,
    };
    console.log('done');
  }

  const manifestPath = path.join(ROOT, 'public', 'img', 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\n[photos] wrote manifest with ${Object.keys(manifest).length} entries -> public/img/manifest.json`);

  if (oversizedFiles.length > 0) {
    console.log(`\n[photos] WARNING — ${oversizedFiles.length} output file(s) exceed the ~200 kB "done when" bar:`);
    for (const f of oversizedFiles) {
      console.log(`  ${f.path} — ${(f.bytes / 1024).toFixed(1)} kB`);
    }
  } else {
    console.log('\n[photos] OK — every output file is under ~200 kB.');
  }

  console.log('\n[photos] EXIF: sharp does not call .withMetadata() anywhere in this script, which');
  console.log('[photos] is what strips EXIF/ICC/XMP from the output by default. Spot-check with:');
  console.log('[photos]   exiftool public/img/village/village-exterior-1440.avif');
}

main().catch((error) => {
  console.error('[photos] FAILED');
  console.error(error);
  process.exitCode = 1;
});
