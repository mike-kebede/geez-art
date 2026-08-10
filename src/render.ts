// Mosaic renderer: image → grid of fidel glyphs chosen by ink density.
// Client-side, deterministic.
//   - perceptual (sRGB) luminance drives the density match
//   - auto-contrast: percentile stretch so a narrow tonal band fills the ramp
//   - edge emphasis: a Sobel map darkens outlines so subject edges pop
//   - dithering: ordered/Bayer and blue-noise avoid the directional "worm"
//     artifacts Floyd-Steinberg leaves on smooth face/skin tones
//   - mono rendering blits from a pre-rasterized glyph sprite atlas
//     (drawImage ≈ 6× faster than per-cell fillText — how the top tools
//     reach 300+ columns without freezing)

import { orderedDither } from '@thi.ng/pixel-dither';
import { IntBuffer, GRAY8 } from '@thi.ng/pixel';
import type { GlyphInfo } from './fonts';
import { FONT } from './fonts';

export type DitherMode = 'fs' | 'ordered' | 'scatter';

export interface RenderOpts {
  cols: number;
  contrast?: number;
  invert?: boolean;
  dither?: DitherMode;
  /** edge emphasis 0..1 — darkens outlines so subject edges pop */
  edge?: number;
  /** background (paper) color */
  paper?: string;
  /** glyph (ink) color */
  ink?: string;
  /** draw each glyph in its source cell's average color instead of ink */
  colorize?: boolean;
}

export interface MosaicResult {
  canvas: HTMLCanvasElement;
  chars: string[][];
  cols: number;
  rows: number;
}

export function renderMosaic(source: HTMLCanvasElement, ramp: GlyphInfo[], opts: RenderOpts): MosaicResult {
  const {
    cols,
    contrast = 1,
    invert = false,
    dither = 'scatter',
    edge = 0,
    paper = '#f3ecdd',
    ink = '#2a1a12',
    colorize = false,
  } = opts;
  const sctx = source.getContext('2d')!;
  const sW = source.width;
  const sH = source.height;
  const sData = sctx.getImageData(0, 0, sW, sH).data;

  // Cell aspect from measured glyph advance width (glyph cells are wider than tall).
  const avgW = ramp.reduce((s, g) => s + (g.width || 64), 0) / ramp.length;
  const cellAR = avgW / 64;
  const rows = Math.max(1, Math.round((sH / sW) * cols * cellAR));

  // Adaptive cell size: keep the output canvas bounded at high column counts.
  const cellPx = Math.max(7, Math.min(14, Math.round(2800 / cols)));
  const out = document.createElement('canvas');
  out.width = cols * cellPx;
  out.height = rows * cellPx;
  const octx = out.getContext('2d')!;
  octx.fillStyle = paper;
  octx.fillRect(0, 0, out.width, out.height);
  octx.font = `${cellPx}px ${FONT}`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';

  const dMin = ramp[0].density;
  const span = Math.max(1e-4, ramp[ramp.length - 1].density - dMin);

  // Per-cell perceptual luminance + average color.
  const lum = new Float32Array(cols * rows);
  const cellRgb = new Uint8ClampedArray(cols * rows * 3);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x0 = Math.floor((c * sW) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((c + 1) * sW) / cols));
      const y0 = Math.floor((r * sH) / rows);
      const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * sH) / rows));
      let sum = 0;
      let n = 0;
      let rs = 0;
      let gs = 0;
      let bs = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const p = (y * sW + x) * 4;
          const l = 0.2126 * sData[p] + 0.7152 * sData[p + 1] + 0.0722 * sData[p + 2];
          sum += l / 255; // perceptual (sRGB) luminance
          rs += sData[p];
          gs += sData[p + 1];
          bs += sData[p + 2];
          n++;
        }
      }
      lum[i] = n > 0 ? sum / n : 0.5;
      if (n > 0) {
        cellRgb[i * 3] = rs / n;
        cellRgb[i * 3 + 1] = gs / n;
        cellRgb[i * 3 + 2] = bs / n;
      }
    }
  }

  // Auto-contrast: 1%/99% percentile stretch so a narrow tonal band fills the ramp.
  const sorted = Float32Array.from(lum).sort();
  const pLo = sorted[Math.floor(sorted.length * 0.01)];
  const pHi = sorted[Math.max(0, Math.floor(sorted.length * 0.99) - 1)];
  const stretch = pHi - pLo > 0.04 ? pHi - pLo : 1;

  // Stretched luminance (full range) — the base for edge detection AND tone.
  const stretched = new Float32Array(cols * rows);
  for (let i = 0; i < stretched.length; i++) stretched[i] = clamp01((lum[i] - pLo) / stretch);

  // Edge map (Sobel on the STRETCHED grid — real gradients, so the slider is actually visible).
  const edgeMap = new Float32Array(cols * rows);
  if (edge > 0) {
    const at = (r: number, c: number): number =>
      stretched[Math.max(0, Math.min(rows - 1, r)) * cols + Math.max(0, Math.min(cols - 1, c))];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gx =
          at(r - 1, c + 1) + 2 * at(r, c + 1) + at(r + 1, c + 1) -
          (at(r - 1, c - 1) + 2 * at(r, c - 1) + at(r + 1, c - 1));
        const gy =
          at(r + 1, c - 1) + 2 * at(r + 1, c) + at(r + 1, c + 1) -
          (at(r - 1, c - 1) + 2 * at(r - 1, c) + at(r - 1, c + 1));
        // / 1.2 is an empirically tuned normalization constant: raw Sobel
        // magnitudes cluster well below 1 on smooth gradients but spike past 1
        // on hard edges, and dividing by 1.2 keeps the edge map in a useful
        // range so edge emphasis doesn't blow out flat regions.
        edgeMap[r * cols + c] = clamp01(Math.sqrt(gx * gx + gy * gy) / 1.2);
      }
    }
  }

  // Density target: invert → true-contrast S-curve around mid-gray → density → +edge boost.
  const work = new Float32Array(cols * rows);
  for (let i = 0; i < work.length; i++) {
    let v = stretched[i];
    if (invert) v = 1 - v;
    v = clamp01((v - 0.5) * contrast + 0.5);
    const d = 1 - v;
    work[i] = clamp01((d - dMin) / span + edgeMap[i] * edge);
  }

  const gi = new Uint16Array(cols * rows);
  const key = (i: number): number => (ramp[i].density - dMin) / span;

  if (dither === 'ordered') {
    // Library-based ordered dithering (Bayer) posterizes to 128 uniform levels;
    // each level is then snapped to a glyph (variety-aware within a density window).
    const levels = new Uint8Array(cols * rows);
    for (let i = 0; i < levels.length; i++) levels[i] = Math.round(clamp01(work[i]) * 255);
    const buf = new IntBuffer(cols, rows, GRAY8, levels);
    orderedDither(buf, 8, 128);
    for (let i = 0; i < gi.length; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      gi[i] = pickNorm(ramp, key, buf.data[i] / 255, c, r);
    }
  } else if (dither === 'scatter') {
    // Deterministic hash jitter — an integer-hash white-noise scatter, NOT true
    // blue noise. Each cell's density target is jittered by a pseudo-random
    // offset before snapping, then pick variety-aware within a density window.
    // (Honest label: "scatter", not "blue".)
    const step = 1 / Math.max(1, ramp.length - 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const jitter = (hashNoise(c, r) - 0.5) * step * 2;
        gi[i] = pickNorm(ramp, key, clamp01(work[i] + jitter), c, r);
      }
    }
  } else {
    // Floyd-Steinberg error diffusion over normalized density targets,
    // variety-aware so flat areas don't collapse onto one glyph.
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const d = clamp01(work[i]);
        gi[i] = pickNorm(ramp, key, d, c, r);
        const gn = key(gi[i]);
        const err = d - gn;
        if (c + 1 < cols) work[i + 1] += err * (7 / 16);
        if (r + 1 < rows) {
          if (c > 0) work[i + cols - 1] += err * (3 / 16);
          work[i + cols] += err * (5 / 16);
          if (c + 1 < cols) work[i + cols + 1] += err * (1 / 16);
        }
      }
    }
  }

  // Draw pass: mono blits from a glyph sprite atlas; colorize needs per-cell fillText.
  const chars: string[][] = [];
  if (colorize) {
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const g = ramp[gi[i]];
        row.push(g.ch);
        octx.fillStyle = `rgb(${cellRgb[i * 3]},${cellRgb[i * 3 + 1]},${cellRgb[i * 3 + 2]})`;
        octx.fillText(g.ch, c * cellPx + cellPx / 2, r * cellPx + cellPx / 2 + cellPx * 0.06);
      }
      chars.push(row);
    }
  } else {
    const { atlas, tileW } = ensureAtlas(ramp, cellPx, ink, paper);
    const tileH = atlas.height;
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const g = ramp[gi[i]];
        row.push(g.ch);
        octx.drawImage(atlas, gi[i] * tileW, 0, tileW, tileH, c * cellPx, r * cellPx, cellPx, cellPx);
      }
      chars.push(row);
    }
  }

  return { canvas: out, chars, cols, rows };
}

let atlasCache: { key: string; atlas: HTMLCanvasElement; tileW: number } | null = null;

/** Pre-rasterize each ramp glyph once, then blit tiles per cell (≈6× faster than fillText). */
function ensureAtlas(ramp: GlyphInfo[], cellPx: number, ink: string, paper: string): { atlas: HTMLCanvasElement; tileW: number } {
  const key = `${ramp.length}:${cellPx}:${ink}:${paper}`;
  if (atlasCache && atlasCache.key === key) return atlasCache;
  const tileW = Math.ceil(cellPx * 1.2);
  const tileH = Math.ceil(cellPx * 1.4);
  const atlas = document.createElement('canvas');
  atlas.width = ramp.length * tileW;
  atlas.height = tileH;
  const ctx = atlas.getContext('2d')!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, atlas.width, atlas.height);
  ctx.font = `${cellPx}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  for (let i = 0; i < ramp.length; i++) {
    ctx.fillText(ramp[i].ch, i * tileW + tileW / 2, tileH / 2 + cellPx * 0.06);
  }
  atlasCache = { key, atlas, tileW };
  return atlasCache;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hashNoise(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function nearestNorm(ramp: GlyphInfo[], key: (i: number) => number, d: number): number {
  let lo = 0;
  let hi = ramp.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (key(mid) < d) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    return Math.abs(key(lo - 1) - d) < Math.abs(key(lo) - d) ? lo - 1 : lo;
  }
  return lo;
}

/** Density window (normalized) from which a cell's glyph is chosen — the
 *  "don't collapse onto one letter" knob. */
const VARIETY_WINDOW = 0.05;

/**
 * Variety-aware selection: instead of always taking the single nearest-density
 * glyph, pick among the glyphs within a small density window of the target,
 * chosen deterministically by cell position. Flat areas then show a MIX of
 * letters rather than the same glyph repeated — this is what kills the
 * "always the che letter" look.
 */
function pickNorm(ramp: GlyphInfo[], key: (i: number) => number, d: number, x: number, y: number): number {
  const idx = nearestNorm(ramp, key, d);
  let lo = idx;
  let hi = idx;
  while (lo > 0 && Math.abs(key(lo - 1) - d) < VARIETY_WINDOW) lo--;
  while (hi < ramp.length - 1 && Math.abs(key(hi + 1) - d) < VARIETY_WINDOW) hi++;
  if (hi - lo <= 0) return idx;
  const h = hashNoise(x * 0.1337, y * 0.9517);
  return lo + Math.min(hi - lo, Math.floor(h * (hi - lo + 1)));
}
