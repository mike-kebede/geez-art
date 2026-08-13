// Verify the variety seed rotates: two consecutive renders of the SAME photo
// with NO setting change must produce DIFFERENT mosaics (fresh flat-area
// letters each time — the "always ጨ" fix).
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(800);

const grab = () =>
  page.evaluate(() => {
    const c = document.getElementById('mosaic');
    // Cheap fingerprint: hash the downsampled canvas.
    const t = document.createElement('canvas');
    t.width = 32; t.height = 21;
    const x = t.getContext('2d');
    x.drawImage(c, 0, 0, 32, 21);
    const d = x.getImageData(0, 0, 32, 21).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] + d[i + 2]) | 0;
    return h;
  });

const a = await grab();
// Re-render with NO setting change: dispatch a no-op input on the contrast slider.
await page.evaluate(() => {
  const el = document.getElementById('contrast');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(900); // debounce 250ms + render
const b = await grab();
await browser.close();
console.log('render A fingerprint:', a);
console.log('render B fingerprint:', b);
console.log('DIFFERENT (seed rotated):', a !== b);
