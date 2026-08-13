// Measure the DEFAULT-settings mosaic dark-ink + luminance distribution, for
// the M5 boldness gate. Loads ?demo=1, touches nothing (defaults), reads the
// mosaic.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(1000);
const out = await page.evaluate(() => {
  const c = document.getElementById('mosaic');
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let dark = 0, mid = 0, light = 0, n = 0, lumSum = 0;
  for (let i = 0; i < d.length; i += 4) {
    n++;
    const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    lumSum += L;
    if (L < 100) dark++;
    else if (L < 180) mid++;
    else light++;
  }
  return {
    size: c.width + 'x' + c.height,
    darkPct: +((100 * dark) / n).toFixed(1),
    midPct: +((100 * mid) / n).toFixed(1),
    lightPct: +((100 * light) / n).toFixed(1),
    meanLum: +(lumSum / n).toFixed(0),
  };
});
await browser.close();
console.log(JSON.stringify(out, null, 2));
