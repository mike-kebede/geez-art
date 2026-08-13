// Verify the Maleda restyle boots clean: theme toggle, eye-dot, weave loader,
// tibeb spine, Bela display font, mosaic render, no console/CSP errors.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5199';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(BASE + '/?demo=1', { waitUntil: 'load', timeout: 30000 });
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 40000 });
await page.waitForTimeout(1000);

const before = await page.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme') || '(system)',
  themeBtn: document.getElementById('themeToggle')?.textContent,
  eyedot: !!document.getElementById('eyedot'),
  weaveHidden: document.getElementById('weaveLoader')?.hidden,
  tibeb: !!document.querySelector('.tibeb-spine'),
  wmFidel: document.querySelector('.wm-fidel')?.textContent,
  belaLoaded: document.fonts.check('700 64px "Bela Bereka"', 'ግዕዝ'),
  mosaic: (document.getElementById('mosaic'))?.width,
  status: document.getElementById('status')?.textContent?.trim(),
}));

// Toggle the theme to dark.
await page.click('#themeToggle');
await page.waitForTimeout(300);
const dark = await page.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme'),
  themeBtn: document.getElementById('themeToggle')?.textContent,
  bodyBg: getComputedStyle(document.body).backgroundColor,
}));
// Toggle back to light.
await page.click('#themeToggle');
await page.waitForTimeout(300);
const light = await page.evaluate(() => ({
  theme: document.documentElement.getAttribute('data-theme'),
  bodyBg: getComputedStyle(document.body).backgroundColor,
}));

await browser.close();
console.log('BEFORE:', JSON.stringify(before, null, 2));
console.log('DARK:', JSON.stringify(dark, null, 2));
console.log('LIGHT:', JSON.stringify(light, null, 2));
console.log('ERRORS:', errors.length ? errors : 'none');
