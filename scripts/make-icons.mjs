// Generate PWA + apple-touch icons: the ፊ fidel in ivory on the brick accent,
// with a gold halo ring. Uses the dev server so the Ethiopic font is LOADED
// before drawing (the previous version rendered black tiles because the font
// hadn't loaded — the fidel never painted).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 5198);
const SIZES = [192, 512, 180];
const OUT = path.resolve('public');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/`);
await page.waitForFunction(() => /Ready|ዝግጁ|Setup error/.test(document.getElementById('status')?.textContent || ''), { timeout: 30000 });
// Ensure the Ethiopic face is actually loaded before drawing.
await page.evaluate(() => document.fonts.load('700 62px "Noto Sans Ethiopic Variable"', 'ፊ'));

const pngs = await page.evaluate(async (sizes) => {
  const draw = (size) => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const x = c.getContext('2d');
    x.fillStyle = '#A62F1E'; // madder ground (Maleda ox-500)
    x.fillRect(0, 0, size, size);
    const r = size * 0.38;
    x.strokeStyle = 'rgba(201, 150, 46, 0.6)'; // gold halo ring (Maleda gold-500)
    x.lineWidth = Math.max(2, size * 0.02);
    x.beginPath();
    x.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = '#FCF9F3'; // parchment fidel
    x.font = `700 ${size * 0.62}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('ፊ', size / 2, size / 2 + size * 0.02);
    return c.toDataURL('image/png').split(',')[1];
  };
  const out = {};
  for (const s of sizes) out[s] = draw(s);
  return out;
}, SIZES);
await browser.close();

for (const s of SIZES) {
  const name = s === 180 ? 'apple-touch-icon.png' : `icon-${s}.png`;
  fs.writeFileSync(path.join(OUT, name), Buffer.from(pngs[s], 'base64'));
  console.log(`wrote public/${name} (${s}x${s})`);
}
