// Regenerate public/og-image.png from an ACTUAL fidel-mosaic render (the old asset
// was a near-blank idle-page screenshot). Renders the icon-classical sample in a
// browser, composes it onto a 1200×630 parchment card with the brand band.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 5198;
const OUT = path.resolve('public', 'og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => /Ready|ዝግጁ|Setup error/.test(document.getElementById('status')?.textContent || ''), { timeout: 30000 });
await page.click('#exampleBtn'); // icon-classical sample
await page.waitForFunction(() => (document.getElementById('mosaic')).width > 10, { timeout: 30000 });
await page.waitForTimeout(800); // let the render settle

const mosaicB64 = await page.evaluate(() => {
  const c = document.getElementById('mosaic');
  return c.toDataURL('image/png');
});
await browser.close();

// Compose the 1200×630 card in a fresh page.
const browser2 = await chromium.launch();
const page2 = await browser2.newPage();
await page2.setContent('<canvas id="og" width="1200" height="630"></canvas>');
const outB64 = await page2.evaluate(async (mosaicB64) => {
  const c = document.getElementById('og');
  const x = c.getContext('2d');
  // parchment ground
  x.fillStyle = '#efe6d2';
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
