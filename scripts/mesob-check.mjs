// Verify the topbar layout: the logo (favicon ፊ on the mesob) sits beside the
// wordmark, and the gaze mesob sits beside the STATUS text and pulses while busy.
import { chromium } from '@playwright/test';
const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(800);
const layout = await page.evaluate(() => {
  const logo = document.querySelector('.brand-logo');
  const logoFidel = document.querySelector('.brand-logo .logo-fidel');
  const gaze = document.querySelector('.mesob-mark.gaze');
  const wm = document.querySelector('.wordmark-brand');
  const status = document.querySelector('#status');
  const gazeNextToStatus = gaze && status && gaze.parentElement === status.parentElement;
  const logoNextToWordmark = logo && wm && logo.parentElement === wm.parentElement;
  return {
    logoNextToWordmark,
    logoHasFidelOnMesob: !!logo && !!logo.querySelector('.mesob-mark') && logoFidel?.textContent === 'ፊ',
    gazeNextToStatus,
    brandText: wm?.textContent,
  };
});
// busy pulse check
await page.evaluate(() => { window.__stallPhotoDecode = true; });
await page.setInputFiles('#file', 'tests/fixtures/sample.png');
await page.waitForFunction(() => (document.querySelector('.mesob-mark.gaze'))?.classList.contains('pulse'), { timeout: 15000 });
await browser.close();
console.log('LAYOUT:', JSON.stringify(layout, null, 2));
console.log('GAZE PULSES DURING BUSY: true');
