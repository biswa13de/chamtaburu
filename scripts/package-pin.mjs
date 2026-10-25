/**
 * Prints the hash to paste into a manager's `pin` in public/package/rates.js.
 *
 *   npm run package-pin -- 4821
 *
 * Only the hash goes into the repo, never the PIN. The salt must match the
 * one in public/package/generator.js. Warns if another manager already has
 * this PIN, since the PIN alone decides who is logged in.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const pin = process.argv[2];
if (!pin || !/^\d{4,12}$/.test(pin)) {
  console.error('Usage: npm run package-pin -- <4-12 digit PIN>');
  process.exit(1);
}

const hash = createHash('sha256').update(`chamtaburu-package:${pin}`).digest('hex');
const rates = await readFile(new URL('../public/package/rates.js', import.meta.url), 'utf8');
if (rates.includes(hash)) {
  console.warn('Warning: a manager in rates.js already uses this PIN. Pick a different one.');
}
console.log(hash);
