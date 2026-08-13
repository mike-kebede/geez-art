// Objective fidelity check for a mosaic render: the mosaic's coarse luminance
// and edge structure must track the source photo's. A smudge/blank render
// correlates ~0. Runs for the default Parchment preset AND the Mono preset
// (which maps luminance directly, so it's the cleanest signal).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5180';
const SRC = path.resolve('public/demo.png');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(1000);

async function gridData(label) {
  // Downsample mosaic canvas; returns { coarse (16x12) lum, fine (48x36) lum }
  const out = await page.evaluate(async ({ srcB64, label }) => {
    const lumGrid = (img, w, h) => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h).data;
      const g = [];
      for (let i = 0; i < d.length; i += 4) g.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      return g;
    };
    if (label === 'source') {
      const bin = atob(srcB64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = URL.createObjectURL(new Blob([bytes])); });
      return { coarse: lumGrid(img, 16, 12), fine: lumGrid(img, 48, 36) };
    }
    const mosaic = document.getElementById('mosaic');
    return { coarse: lumGrid(mosaic, 16, 12), fine: lumGrid(mosaic, 48, 36) };
  }, { srcB64: fs.readFileSync(SRC).toString('base64'), label });
  return out;
}

function stats(a, b) {
  const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length;
  const corr = (x, y) => {
    const mx = mean(x), my = mean(y);
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < x.length; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) ** 2;
      dy += (y[i] - my) ** 2;
    }
    return num / Math.sqrt(dx * dy);
  };
  // Edge structure: magnitude of horizontal luminance deltas, correlated.
  const edges = (x, w) => {
    const e = [];
    for (let r = 0; r < x.length / w; r++) {
      for (let c = 0; c < w - 1; c++) e.push(Math.abs(x[r * w + c + 1] - x[r * w + c]));
    }
    return e;
  };
  return {
    corrCoarse: +corr(a.coarse, b.coarse).toFixed(3),
    corrFine: +corr(a.fine, b.fine).toFixed(3),
    corrEdges: +corr(edges(a.fine, 48), edges(b.fine, 48)).toFixed(3),
  };
}

const source = await gridData('source');
const results = {};
for (const [id, label] of [['manuscript', 'Parchment (default)'], ['mono', 'Mono']]) {
  await page.evaluate((palId) => {
    const sel = document.getElementById('palette');
    sel.value = palId;
    sel.dispatchEvent(new Event('change'));
  }, id);
  // Wait for the re-render to land (debounce ~250ms + render + settle).
  await page.waitForTimeout(1600);
  const mosaic = await gridData('mosaic');
  results[label] = stats(source, mosaic);
}
await browser.close();
console.log(JSON.stringify({ source, results }, null, 2));
