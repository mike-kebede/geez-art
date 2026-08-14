// Diagnose the zoom controls: does zoom-out work from an enlarged state?
import { chromium } from '@playwright/test';
const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(800);
const state = async () => page.evaluate(() => ({
  val: document.getElementById('zoomVal')?.textContent,
  widthPct: (document.getElementById('mosaic')).style.width,
  controlsHidden: document.getElementById('zoomControls')?.hidden,
}));
console.log('initial:', JSON.stringify(await state()));
await page.click('#zoomIn'); await page.waitForTimeout(200);
console.log('after zoomIn:', JSON.stringify(await state()));
await page.click('#zoomOut'); await page.waitForTimeout(200);
console.log('after zoomOut:', JSON.stringify(await state()));
await page.click('#zoomOut'); await page.waitForTimeout(200);
console.log('after zoomOut again (should clamp at 100):', JSON.stringify(await state()));
await page.click('#zoomOut'); await page.waitForTimeout(200);
console.log('after zoomOut again (100):', JSON.stringify(await state()));
await browser.close();
