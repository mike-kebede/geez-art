// Verify the colorize mosaic paints ONLY in the Maleda pigments (no arbitrary
// source colors — no pinks/blues/purples). Samples glyph pixels, finds each
// pixel's nearest pigment, and reports the worst-case distance + the count of
// out-of-theory colors. Anti-aliased edge pixels blend pigment↔paper, so a
// small tolerance is expected; big distances mean the mapping leaked.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE || 'http://localhost:5199';
const PIGMENTS = [
  '#FCF9F3', '#F5E9D1', '#F0DFBD', '#E8A33D', '#E46F30', '#C9962E',
  '#A62F1E', '#651E15', '#1E8A5E', '#1A5039', '#6C523D', '#573928',
  '#3A2016', '#15090B',
].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const PAPER = [0xF5, 0xE9, 0xD1];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE + '/?demo=1');
await page.waitForFunction(() => (document.getElementById('mosaic'))?.width > 10, { timeout: 30000 });
await page.waitForTimeout(1200);

const result = await page.evaluate(({ PIGMENTS, PAPER }) => {
  const c = document.getElementById('mosaic');
  const x = c.getContext('2d');
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const dist = (r, g, b, [pr, pg, pb]) => (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
  const distinct = new Map(); // key -> {count, maxDistToPigment}
  let worst = 0, worstKey = '', outOfTheory = 0, blueDominant = 0, ink = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // Skip near-paper pixels (the ground between glyphs).
    const paperD = dist(r, g, b, PAPER);
    if (paperD < 600) continue;
    ink++;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    let minD = Infinity;
    for (const p of PIGMENTS) { const dd = dist(r, g, b, p); if (dd < minD) minD = dd; }
    if (minD > worst) { worst = minD; worstKey = key; }
    // Anti-aliased glyph edges blend pigment↔paper and sit a few dozen units off
    // the pure pigment — allow dist 90. Beyond that is a genuine out-of-theory
    // leak. Also flag blue-dominant pixels (B clearly above both R and G).
    if (minD > 90 * 90) outOfTheory++;
    if (b > 1.4 * Math.max(r, g)) blueDominant++;
    const e = distinct.get(key) || { n: 0, maxD: 0 };
    e.n++; if (minD > e.maxD) e.maxD = minD;
    distinct.set(key, e);
  }
  const sorted = [...distinct.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 12);
  return {
    inkedPixels: ink,
    outOfTheory: outOfTheory,
    outOfTheoryPct: +((100 * outOfTheory) / Math.max(1, ink)).toFixed(2),
    blueDominantPct: +((100 * blueDominant) / Math.max(1, ink)).toFixed(2),
    worstDist: Math.round(Math.sqrt(worst)),
    worstColorHex: '#' + worstKey.toString(16).padStart(6, '0'),
    topDistinctColors: sorted.map(([k, v]) => ({
      hex: '#' + k.toString(16).padStart(6, '0'),
      count: v.n,
      nearestPigmentDist: Math.round(Math.sqrt(v.maxD)),
    })),
  };
}, { PIGMENTS, PAPER });
await browser.close();
console.log(JSON.stringify(result, null, 2));
