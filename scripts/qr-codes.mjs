/**
 * Printable QR codes for the seven cottage story cards —
 * docs/05-build-phases.md Phase 5, docs/Chamtaburu_Eco_Village_Seven_Cottage_Plan.md
 * §19 ("Guest Story Card" — a small card placed inside each cottage, front:
 * "YOUR COTTAGE / {NAME}", back: "THE STORY / ... / Scan to learn more.").
 *
 * Outputs, per cottage slug:
 *   - public/qr/<slug>.svg — vector QR code, ideal for print at any size.
 *   - public/qr/<slug>.png — raster fallback, used to embed into the PDF
 *     below (pdf-lib has no SVG renderer).
 * Plus one combined:
 *   - public/qr/cottage-story-cards.pdf — all seven cards laid out for
 *     printing, one card per page (front + back).
 *
 * Encodes `https://<village.domain>/cottages/<slug>` — the real production
 * URL (docs/01-strategy.md), not localhost or a placeholder, read from
 * src/content/village.ts's `village.domain` so the host isn't hardcoded
 * twice. Fine to bake in the production domain even though the site isn't
 * deployed there yet (Phase 6) — that's correct URL construction, not a
 * deployment claim.
 *
 * public/qr/ (not .gitignored): committed like public/img/ (Phase 3) —
 * these outputs are tiny (a few KB each) and stable (they only change if a
 * cottage slug changes, which is explicitly frozen per village.ts's header
 * comment), so there's no build-time regeneration cost being saved by
 * ignoring them, and committing means the site can serve/link the SVGs
 * directly if useful later without a build step.
 *
 * Card size: the vision doc's §19 does not give physical dimensions for
 * this story card (unlike the room nameplate, spec'd at 18"x10" in §10) —
 * it only says "small card". ASSUMPTION (not sourced from the doc): a
 * postcard-style 4in x 6in (102mm x 152mm) card, a standard, cheaply
 * printable size for a small room card, at 300 DPI. Revisit if a real
 * print-shop spec appears.
 *
 * Run manually via `npm run qr-codes` — a one-off generation step (only
 * needs re-running if a cottage's slug or name/tagline changes), not part
 * of the build/prebuild chain, matching `npm run photos`.
 *
 * Written in plain JS (not .ts) and run with plain `node`, same reasoning
 * as scripts/photos.mjs and scripts/validate-content.mjs: filesystem/
 * generation script, not application code, no TS build step needed.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'qr');

// 4in x 6in postcard at 72pt/inch (pdf-lib's native unit).
const CARD_WIDTH_PT = 4 * 72;
const CARD_HEIGHT_PT = 6 * 72;
const QR_PNG_PX = 900; // ~300 DPI at a 3in on-page QR size

async function loadContent() {
  // Same ssrLoadModule approach as scripts/validate-content.mjs: village.ts
  // is a TS module with build-time validation side effects, so it needs
  // real TS/alias resolution under Node, not a hand-rolled parser.
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  });
  try {
    const villageMod = await server.ssrLoadModule('/src/content/village.ts');
    return { village: villageMod.village, cottages: villageMod.cottages };
  } finally {
    await server.close();
  }
}

async function generateQrAssets(cottages, domain) {
  await mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const cottage of cottages) {
    const url = `https://${domain}/cottages/${cottage.slug}`;

    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
    });
    const svgPath = path.join(OUT_DIR, `${cottage.slug}.svg`);
    await writeFile(svgPath, svg, 'utf8');

    const png = await QRCode.toBuffer(url, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: QR_PNG_PX,
    });
    const pngPath = path.join(OUT_DIR, `${cottage.slug}.png`);
    await writeFile(pngPath, png);

    results.push({ cottage, url, svgPath, pngPath, png });
  }
  return results;
}

async function buildPdf(assets) {
  const pdf = await PDFDocument.create();
  const serifBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.12, 0.13, 0.12); // approximates --color-ink
  const forest = rgb(0.29, 0.42, 0.31); // approximates --color-forest
  const stone = rgb(0.42, 0.44, 0.41); // approximates --color-stone

  function centeredText(page, text, font, size, y, color) {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (CARD_WIDTH_PT - width) / 2, y, size, font, color });
  }

  for (const { cottage, url, png } of assets) {
    // --- Front: "YOUR COTTAGE / {NAME}" ---
    const front = pdf.addPage([CARD_WIDTH_PT, CARD_HEIGHT_PT]);
    centeredText(front, 'YOUR COTTAGE', serifBold, 12, CARD_HEIGHT_PT - 90, stone);
    const nameSize = cottage.name.length > 14 ? 22 : 26;
    centeredText(front, cottage.name.toUpperCase(), serifBold, nameSize, CARD_HEIGHT_PT - 130, forest);
    centeredText(front, cottage.tagline, serif, 10, CARD_HEIGHT_PT - 155, ink);
    centeredText(front, `Cottage ${cottage.number}`, serif, 9, 40, stone);

    // --- Back: "THE STORY / ... / Scan to learn more." + QR code ---
    const back = pdf.addPage([CARD_WIDTH_PT, CARD_HEIGHT_PT]);
    centeredText(back, 'THE STORY', serifBold, 12, CARD_HEIGHT_PT - 90, stone);

    const bodyLines = [
      'Discover the story behind',
      'your cottage name and its',
      'connection with Purulia.',
    ];
    let y = CARD_HEIGHT_PT - 120;
    for (const line of bodyLines) {
      centeredText(back, line, serif, 11, y, ink);
      y -= 16;
    }

    const qrImage = await pdf.embedPng(png);
    const qrSizePt = 3 * 72; // 3in on the page
    const qrX = (CARD_WIDTH_PT - qrSizePt) / 2;
    const qrY = 110;
    back.drawImage(qrImage, { x: qrX, y: qrY, width: qrSizePt, height: qrSizePt });

    centeredText(back, 'Scan to learn more.', serifBold, 11, qrY - 20, forest);
    centeredText(back, url.replace('https://', ''), serif, 7, 30, stone);
  }

  return pdf.save();
}

async function main() {
  const { village, cottages } = await loadContent();
  const assets = await generateQrAssets(cottages, village.domain);

  const pdfBytes = await buildPdf(assets);
  const pdfPath = path.join(OUT_DIR, 'cottage-story-cards.pdf');
  await writeFile(pdfPath, pdfBytes);

  console.log(`[qr-codes] Generated ${assets.length} QR code SVG+PNG pairs in ${path.relative(ROOT, OUT_DIR)}/`);
  for (const { cottage, url } of assets) {
    console.log(`  ${cottage.slug}.svg  ->  ${url}`);
  }
  console.log(`[qr-codes] Printable PDF: ${path.relative(ROOT, pdfPath)} (${assets.length} cards, 4in x 6in each, front+back)`);
}

main().catch((err) => {
  console.error('[qr-codes] Failed:', err);
  process.exitCode = 1;
});
