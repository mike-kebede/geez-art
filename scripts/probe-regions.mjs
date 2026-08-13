// Compare two renders region-by-region to see WHERE the seed actually changes
// glyphs. The user reports the DENSE (dark) areas don't reshuffle like the
// light ones. Measures pixel-diff% per horizontal band of the mosaic.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(900);

const grab = () =>
  page.evaluate(() => {
    const c = document.getElementById('mosaic');
    // Downsample to the cell grid (~14px cells at width 100 → 100x~66 cells).
    const cols = 100;
    const rows = Math.round((c.height / c.width) * cols);
    const t = document.createElement('canvas');
    t.width = cols; t.height = rows;
    const x = t.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(c, 0, 0, cols, rows);
    return { rows, data: x.getImageData(0, 0, cols, rows).data };
  });

const a = await grab();
await page.evaluate(() => {
  const el = document.getElementById('contrast');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(900);
const b = await grab();

const rows = a.rows;
// Compare band-by-band (10 bands top→bottom).
const bands = [];
for (let band = 0; band < 10; band++) {
  const r0 = Math.floor((rows * band) / 10);
  const r1 = Math.floor((rows * (band + 1)) / 10);
  let changed = 0, n = 0;
  for (let r = r0; r < r1; r++) {
    for (let col = 0; col < 100; col++) {
      const i = (r * 100 + col) * 4;
      n++;
      if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) changed++;
    }
  }
  bands.push({ band, changePct: +((100 * changed) / n).toFixed(1) });
}
await browser.close();
console.log('mosaic rows:', rows);
console.table(bands);
