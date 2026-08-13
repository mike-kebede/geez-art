// Regenerate public/og-image.png from an ACTUAL fidel-mosaic render. Uses the
// MONO palette at boosted contrast/edge so the share card has real dark ink
// (the previous asset read as a pale rectangle at feed size — F6). A minimum
// dark-ink assertion makes the script fail loudly if the render ever drifts
// back to pale, so the asset can't silently degrade again.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 5198);
const OUT = path.resolve('public', 'og-image.png');
// Dark-ink floor for the MONO mosaic (bold weight, 1.7x contrast): the current
// demo image lands ~7.4%; the old regular-weight render landed ~2.7%. A drift
// back below 5% means the boldness lever regressed — fail loudly, don't ship a
// pale card (F6).
const MIN_DARK_PCT = 5;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => /Ready|ዝግጁ|Setup error/.test(document.getElementById('status')?.textContent || ''), { timeout: 30000 });
await page.click('#exampleBtn'); // the user's demo photo
await page.waitForFunction(() => (document.getElementById('mosaic')).width > 10, { timeout: 30000 });
await page.waitForTimeout(800); // let the first render settle

// Punch it up: mono ink on white paper, boosted contrast + edge emphasis.
await page.evaluate(() => {
  const set = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const pal = document.getElementById('palette');
  pal.value = 'mono';
  pal.dispatchEvent(new Event('change'));
  set('width', '200');
  set('contrast', '70'); // → 1.7×
  set('edge', '40');     // → 0.40
});
await page.waitForTimeout(1600); // debounce (250ms) + render + settle

const check = await page.evaluate(() => {
  const c = document.getElementById('mosaic');
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let dark = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    n++;
    if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 100) dark++;
  }
  return { darkPct: +((100 * dark) / n).toFixed(1), w: c.width, h: c.height };
});
if (check.darkPct < MIN_DARK_PCT) {
  console.error(`og-image mosaic too pale: dark ${check.darkPct}% < ${MIN_DARK_PCT}% — fix the render, not the asset`);
  process.exit(1);
}
console.log(`mosaic ${check.w}x${check.h}, dark ink ${check.darkPct}%`);

const mosaicB64 = await page.evaluate(() => document.getElementById('mosaic').toDataURL('image/png'));
await browser.close();

// Compose the 1200×630 card in a fresh page.
const browser2 = await chromium.launch();
const page2 = await browser2.newPage();
await page2.setContent('<canvas id="og" width="1200" height="630"></canvas>');
const outB64 = await page2.evaluate(async (mosaicB64) => {
  const c = document.getElementById('og');
  const x = c.getContext('2d');
  // Deep-ink ground: the card reads as bold at feed size even though the
  // mosaic is inherently letters-on-paper. The bright mosaic panel pops
  // against it (F6).
  x.fillStyle = '#15110d';
  x.fillRect(0, 0, 1200, 630);
  // gold hairline top
  x.fillStyle = '#d9a441';
  x.fillRect(0, 0, 1200, 4);
  // the mosaic fills the card
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = mosaicB64; });
  const scale = Math.min(1200 / img.width, 600 / img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  x.drawImage(img, (1200 - w) / 2, 8, w, h);
  // brand band
  const bandY = 600;
  x.fillStyle = '#15110d';
  x.fillRect(0, bandY, 1200, 30);
  x.fillStyle = '#d9a441';
  x.fillRect(0, bandY, 1200, 2);
  x.textBaseline = 'middle';
  x.fillStyle = '#d9a441';
  x.font = '700 18px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",serif';
  x.textAlign = 'left';
  x.fillText('ግዕዝ', 24, bandY + 15);
  x.fillStyle = '#f1e9d9';
  x.font = '600 16px "Inter Variable","Inter",sans-serif';
  x.fillText('geez·art', 90, bandY + 15);
  x.fillStyle = '#d9a441';
  x.font = '14px ui-monospace,Menlo,monospace';
  x.textAlign = 'right';
  x.fillText('geez-art.pages.dev', 1176, bandY + 15);
  return c.toDataURL('image/png').split(',')[1];
}, mosaicB64);
await browser2.close();

fs.writeFileSync(OUT, Buffer.from(outB64, 'base64'));
console.log('wrote', OUT, fs.statSync(OUT).size, 'bytes');
