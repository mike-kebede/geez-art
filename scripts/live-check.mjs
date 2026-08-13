// Verify the LIVE deployment: boots to Ready, renders the demo mosaic, no
// console/page/CSP errors, and the bold-glyph renderer is what shipped.
import { chromium } from '@playwright/test';

const URL = process.env.LIVE || 'https://geez-art.mike-kebede.workers.dev/?demo=1';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
const log = [];
page.on('console', (m) => { if (m.type() === 'error') log.push('console: ' + m.text()); });
page.on('pageerror', (e) => log.push('pageerror: ' + e.message));
page.on('requestfailed', (r) => log.push('reqfail: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
await page.goto(URL, { waitUntil: 'load', timeout: 30000 });

let state = null;
try {
  await page.waitForFunction(() => /Ready|ዝግጁ/.test(document.getElementById('status')?.textContent || ''), { timeout: 30000 });
  await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
  await page.waitForTimeout(1200);
  state = await page.evaluate(() => {
    const mos = document.getElementById('mosaic');
    const x = mos.getContext('2d');
    const d = x.getImageData(0, 0, mos.width, mos.height).data;
    let dark = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      n++;
      if (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] < 100) dark++;
    }
    return {
      status: document.getElementById('status')?.textContent?.trim(),
      mosaic: mos.width + 'x' + mos.height,
      darkPct: +((100 * dark) / n).toFixed(1),
      url: location.href,
    };
  });
} catch (e) {
  state = { error: String(e).slice(0, 200) };
  await page.screenshot({ path: 'live-error.png' });
}
await browser.close();
console.log('STATE:', JSON.stringify(state, null, 2));
console.log('ERRORS:', log.length ? log : 'none');
