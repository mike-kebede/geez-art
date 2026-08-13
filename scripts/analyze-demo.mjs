// Analyze a candidate demo image: dims, mean luminance, % pixels above
// luminance 40, % near-black, and a coarse brightness histogram. Used to
// gate demo.png replacement (the previous one was 97% black).
import { chromium } from '@playwright/test';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node analyze-demo.mjs <image>'); process.exit(1); }
const abs = path.resolve(SRC);

import fs from 'node:fs';
const b64 = fs.readFileSync(abs).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async (b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  URL.revokeObjectURL(url);
  const max = 800;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  let n = w * h, lum = 0, above40 = 0, nearBlack = 0, white = 0;
  const hist = new Array(10).fill(0);
  for (let i = 0; i < d.length; i += 4) {
    const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    lum += L;
    if (L > 40) above40++;
    if (L < 24) nearBlack++;
    if (L > 235) white++;
    hist[Math.min(9, Math.floor(L / 25.6))]++;
  }
  return {
    size: { w: img.width, h: img.height, sampled: { w, h } },
    meanLum: +(lum / n).toFixed(1),
    pctAbove40: +((100 * above40) / n).toFixed(1),
    pctNearBlack: +((100 * nearBlack) / n).toFixed(1),
    pctWhite: +((100 * white) / n).toFixed(1),
    hist: hist.map((v) => +((100 * v) / n).toFixed(1)),
  };
}, b64);
await browser.close();
console.log(JSON.stringify(out, null, 2));
