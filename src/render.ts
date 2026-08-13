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
import { FONT, GLYPH_WEIGHT } from './fonts';

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
  /** stable variety seed for video frames (flat areas must not boil); omit for
   *  stills so the seed rotates and the letter mix is fresh every render */
  seed?: number;
}

export interface MosaicResult {
  canvas: HTMLCanvasElement;
  chars: string[][];
  cols: number;
  rows: number;
}

/** A3: warm the 64-level color atlas for a ramp+palette so the FIRST drop
 *  doesn't pay a synchronous ~13k-fillText build. Depends only on the ramp and
 *  palette, not on any pixels. */
export function warmColorAtlas(ramp: GlyphInfo[], paper: string, ink: string): void {
  colorAtlasFor(ramp, paper, ink);
}

export function renderMosaic(source: HTMLCanvasElement, ramp: GlyphInfo[], opts: RenderOpts): MosaicResult {
  const {
    cols: requestedCols,
    contrast = 1,
    invert = false,
    dither = 'scatter',
    edge = 0,
    paper = '#f3ecdd',
    ink = '#2a1a12',
    colorize = false,
    seed,
  } = opts;
  // Still renders rotate the variety seed (fresh flat-area letters each time);
  // video passes an explicit seed so the texture stays stable frame-to-frame.
  const varietySeed = seed ?? mosaicSeed++;
  const sW = source.width;
  const sH = source.height;

  // Cells are drawn SQUARE (cellPx × cellPx below), so the row count must be
  // plain source-aspect math — previously it was multiplied by the glyph advance
  // ratio, which made a square photo come out ~1.6:1 and a portrait near-landscape.
  let cols = requestedCols;
  let rows = Math.max(1, Math.round((sH / sW) * cols));

  // Adaptive cell size: keep the output canvas bounded at high column counts,
  // and cap the HEIGHT so tall portraits at high detail don't exceed the ~4096px
  // per-dimension canvas limit on older phones (which silently render blank).
  // M3: if even 3px cells would be too tall, reduce the column count FIRST so
  // rows*cellPx can never exceed MAX_H (the old Math.max(3, …) floor still let
  // a 4:1 source produce a 4800px-tall canvas that blanks on 4096px-limit phones).
  const MAX_H = 4000;
  const MIN_CELL = 3;
  let cellPx = Math.max(7, Math.min(14, Math.round(2800 / cols)));
  const maxRowsAtMinCell = Math.floor(MAX_H / MIN_CELL);
  if (rows > maxRowsAtMinCell) {
    cols = Math.max(1, Math.round((sW / sH) * maxRowsAtMinCell));
    rows = Math.max(1, Math.round((sH / sW) * cols));
    cellPx = Math.max(7, Math.min(14, Math.round(2800 / cols)));
  }
  cellPx = Math.min(cellPx, Math.floor(MAX_H / Math.max(1, rows)));
  cellPx = Math.max(1, cellPx);
  const out = document.createElement('canvas');
  out.width = cols * cellPx;
  out.height = rows * cellPx;
  const octx = out.getContext('2d')!;
  octx.fillStyle = paper;
  octx.fillRect(0, 0, out.width, out.height);
  octx.font = `${GLYPH_WEIGHT} ${cellPx}px ${FONT}`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';

  const dMin = ramp[0].density;
  const span = Math.max(1e-4, ramp[ramp.length - 1].density - dMin);

  // Source-dependent pass (per-cell luminance + average color + auto-contrast
  // stretch) is cached per (source, cols, rows), so mapping-only control changes
  // (contrast, edge, dither, palette, invert, colorize) reuse it instead of
  // re-sampling the image and re-sorting every time.
  const { cellRgb, stretched } = getSourcePass(source, cols, rows, sW, sH);

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
      gi[i] = pickNorm(ramp, key, buf.data[i] / 255, c, r, varietySeed);
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
        gi[i] = pickNorm(ramp, key, clamp01(work[i] + jitter), c, r, varietySeed);
      }
    }
  } else {
    // Floyd-Steinberg error diffusion — hand-rolled intentionally. The library's
    // diffusion kernels (@thi.ng/pixel-dither ditherWith/FLOYD_STEINBERG) only
    // reach ~2 levels, which cannot quantize to a non-uniform ~200-glyph density
    // ramp. This is the only error-diffusion path that maps to the ramp correctly.
    // (Variety-aware so flat areas don't collapse onto one glyph.)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const d = clamp01(work[i]);
        gi[i] = pickNorm(ramp, key, d, c, r, varietySeed);
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

  // Draw pass: mono blits from a glyph sprite atlas; colorize blits from a
  // per-color atlas (see colorAtlasFor) so the default colorful mode is equally
  // fast — per-cell fillText is what froze video mode on low-end devices.
  const chars: string[][] = [];
  if (colorize) {
    // A4: the atlas is now a FIXED 64-level index (one build per palette) and the
    // per-render cost is just the cheap cell→level lookup — no per-frame rebuild.
    const { atlas, tileW, tileH } = colorAtlasFor(ramp, paper, ink);
    const palette = cellPalette(cellRgb, ink);
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const g = ramp[gi[i]];
        row.push(g.ch);
        octx.drawImage(atlas, gi[i] * tileW, palette[i] * tileH, tileW, tileH, c * cellPx, r * cellPx, cellPx, cellPx);
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

/* ---------- per-source pass cache ---------- */
interface SourcePass {
  cellRgb: Uint8ClampedArray;
  stretched: Float32Array;
}
const sourceIds = new WeakMap<HTMLCanvasElement, number>();
let sourceIdCounter = 0;
const sourcePassCache = new Map<string, SourcePass>();

/** Invalidate cached source passes for a source — needed when a reused canvas's
 *  content changes (e.g. video frames drawn into the same frame canvas). */
export function invalidateSource(source: HTMLCanvasElement): void {
  const id = sourceIds.get(source);
  if (id === undefined) return;
  const prefix = `${id}:`;
  for (const k of Array.from(sourcePassCache.keys())) {
    if (k.startsWith(prefix)) sourcePassCache.delete(k);
  }
}

/** Compute (and cache) the source-dependent pass — per-cell luminance, average
 *  color, and the auto-contrast stretch — keyed by (source, cols, rows), so
 *  mapping-only control changes reuse it instead of re-sampling the image. */
function getSourcePass(source: HTMLCanvasElement, cols: number, rows: number, sW: number, sH: number): SourcePass {
  let id = sourceIds.get(source);
  if (id === undefined) {
    id = sourceIdCounter++;
    sourceIds.set(source, id);
  }
  const cacheKey = `${id}:${cols}:${rows}`;
  const hit = sourcePassCache.get(cacheKey);
  if (hit) return hit;

  // F-3: pre-downsample the source to ~2× the grid before the readback — the
  // full ≤1600px getImageData (~2.5M px) is far more than per-cell sampling
  // needs and blocks the main thread on the first drop.
  const sW2 = Math.max(1, Math.min(sW, cols * 2));
  const sH2 = Math.max(1, Math.min(sH, rows * 2));
  let sData: Uint8ClampedArray;
  if (sW2 === sW && sH2 === sH) {
    sData = source.getContext('2d')!.getImageData(0, 0, sW, sH).data;
  } else {
    const tmp = document.createElement('canvas');
    tmp.width = sW2;
    tmp.height = sH2;
    const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
    tctx.drawImage(source, 0, 0, sW2, sH2);
    sData = tctx.getImageData(0, 0, sW2, sH2).data;
  }

  const lum = new Float32Array(cols * rows);
  const cellRgb = new Uint8ClampedArray(cols * rows * 3);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x0 = Math.floor((c * sW2) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((c + 1) * sW2) / cols));
      const y0 = Math.floor((r * sH2) / rows);
      const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * sH2) / rows));
      let sum = 0;
      let n = 0;
      let rs = 0;
      let gs = 0;
      let bs = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const p = (y * sW2 + x) * 4;
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
  const sorted = Float32Array.from(lum).sort();
  const pLo = sorted[Math.floor(sorted.length * 0.01)];
  const pHi = sorted[Math.max(0, Math.floor(sorted.length * 0.99) - 1)];
  const stretch = pHi - pLo > 0.04 ? pHi - pLo : 1;
  const stretched = new Float32Array(cols * rows);
  for (let i = 0; i < stretched.length; i++) stretched[i] = clamp01((lum[i] - pLo) / stretch);

  const entry: SourcePass = { cellRgb, stretched };
  if (sourcePassCache.size > 12) sourcePassCache.clear(); // bound memory across many dropped images
  sourcePassCache.set(cacheKey, entry);
  return entry;
}

let atlasCache: { key: string; atlas: HTMLCanvasElement; tileW: number } | null = null;

/** Pre-rasterize each ramp glyph once, then blit tiles per cell (≈6× faster than fillText). */
/** M1: stable fingerprint of a ramp's glyph set — Dense/Light halves of the same
 *  measured set can share a length but differ in letters; a length-only cache key
 *  rendered the wrong set. */
function rampKey(ramp: GlyphInfo[]): string {
  return ramp.map((g) => g.cp).join(',');
}

function ensureAtlas(ramp: GlyphInfo[], cellPx: number, ink: string, paper: string): { atlas: HTMLCanvasElement; tileW: number } {
  const key = `${rampKey(ramp)}:${cellPx}:${ink}:${paper}`; // M1: ramp identity, not length
  if (atlasCache && atlasCache.key === key) return atlasCache;
  const tileW = Math.ceil(cellPx * 1.3);
  const tileH = Math.ceil(cellPx * 1.5);
  const atlas = document.createElement('canvas');
  atlas.width = ramp.length * tileW;
  atlas.height = tileH;
  const ctx = atlas.getContext('2d')!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, atlas.width, atlas.height);
  ctx.font = `${GLYPH_WEIGHT} ${Math.round(cellPx * GLYPH_SCALE)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ink;
  for (let i = 0; i < ramp.length; i++) {
    ctx.fillText(ramp[i].ch, i * tileW + tileW / 2, tileH / 2 + cellPx * 0.02);
  }
  atlasCache = { key, atlas, tileW };
  return atlasCache;
}

// A4: the colorized atlas is a FIXED 64-level index (2 bits/channel), built once
// per (ramp, paper, ink). M1: it's now a real small LRU (4 slots) so the idle
// warm can pre-build every palette's atlas and a palette switch hits the cache
// instead of paying a synchronous ~16k-fillText rebuild (~0.5-1s on low-end).
interface ColorAtlas {
  atlas: HTMLCanvasElement;
  tileW: number;
  tileH: number;
}
const colorAtlasCache = new Map<string, ColorAtlas>();
const COLOR_ATLAS_MAX = 4;

const COLOR_REF_CELL = 16;

/**
 * M5: the ramp is measured at font-size = box (64px in a 64px cell, ratio 1.0),
 * but the atlas used to draw the glyph at font-size = cellPx inside a
 * 1.4x-cellPx tile — which the blit then compresses to the cell, so the rendered
 * glyph was ~0.71x its measured relative size and ink stayed ~1/3 of each cell.
 * Drawing at ~1.4x cellPx restores the measurement geometry: the densest glyph
 * now covers most of the cell and the default mosaic no longer reads
 * parchment-pale.
 */
const GLYPH_SCALE = 1.4;

/**
 * The colorized equivalent of ensureAtlas. The atlas has one row per possible
 * quantized level (64 — imperceptible on a letter mosaic) and one column per
 * glyph, so ANY frame's colorful mosaic is a pure blit from this static atlas.
 * The per-frame cost is just cellPalette() (a linear pass, no allocation churn).
 */
function colorAtlasFor(
  ramp: GlyphInfo[],
  paper: string,
  ink: string,
): { atlas: HTMLCanvasElement; tileW: number; tileH: number } {
  const key = `${rampKey(ramp)}:${paper}:${ink}`; // M1: ramp identity, not length
  const hit = colorAtlasCache.get(key);
  if (hit) return hit;
  const tileW = Math.ceil(COLOR_REF_CELL * 1.3);
  const tileH = Math.ceil(COLOR_REF_CELL * 1.5);
  const LEVELS = 64;
  const atlas = document.createElement('canvas');
  atlas.width = ramp.length * tileW;
  atlas.height = LEVELS * tileH;
  const ctx = atlas.getContext('2d')!;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, atlas.width, atlas.height);
  ctx.font = `${GLYPH_WEIGHT} ${Math.round(COLOR_REF_CELL * GLYPH_SCALE)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let level = 0; level < LEVELS; level++) {
    const r = ((level >> 4) & 3) * 64;
    const g = ((level >> 2) & 3) * 64;
    const b = (level & 3) * 64;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    for (let k = 0; k < ramp.length; k++) {
      ctx.fillText(ramp[k].ch, k * tileW + tileW / 2, level * tileH + tileH / 2 + COLOR_REF_CELL * 0.02);
    }
  }
  colorAtlasCache.set(key, { atlas, tileW, tileH });
  if (colorAtlasCache.size > COLOR_ATLAS_MAX) {
    const oldest = colorAtlasCache.keys().next().value;
    if (oldest !== undefined) colorAtlasCache.delete(oldest);
  }
  return { atlas, tileW, tileH };
}

/** Quantized color level for one RGB channel (0..3). */
function quantLevel(v: number): number {
  const c = Math.round(v / 64);
  return c < 0 ? 0 : c > 3 ? 3 : c;
}

/**
 * Per-cell atlas-row index: each cell's blended color (a few stops toward the
 * palette ink — M7) quantizes to one of 64 levels, which IS the atlas row.
 */
function cellPalette(cellRgb: Uint8ClampedArray, ink: string): Uint32Array {
  const [ir, ig, ib] = hexToRgb(ink);
  const T = 0.14;
  const palette = new Uint32Array(cellRgb.length / 3);
  for (let i = 0; i < palette.length; i++) {
    const r = cellRgb[i * 3] * (1 - T) + ir * T;
    const g = cellRgb[i * 3 + 1] * (1 - T) + ig * T;
    const b = cellRgb[i * 3 + 2] * (1 - T) + ib * T;
    palette[i] = (quantLevel(r) << 4) | (quantLevel(g) << 2) | quantLevel(b);
  }
  return palette;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
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

/**
 * Density window (normalized) from which a cell's glyph is chosen — the
 * "don't collapse onto one letter" knob. Density-dependent: at a flat 0.05 the
 * dense end of the ramp offered so few distinct glyphs that dark areas mostly
 * kept the same heavy glyph across re-renders — the seed reshuffle was
 * imperceptible ("still ጨ"). Widening the window at the DENSE end surfaces more
 * distinctly-shaped candidates there (where the user wants visible variety),
 * while mid-tones stay tight so subject edges keep their tonal fidelity.
 */
function varietyWindowAt(d: number): number {
  return 0.05 + 0.04 * d; // light end 0.05 → dense end 0.09
}

/**
 * Per-render variety seed. The flat-area letter mix used to be hashed from the
 * cell position ONLY, so a uniform region froze one fixed set of glyphs forever
 * — and if that set was dominated by a visually heavy letter (e.g. ጨ), it
 * recurred on every render. Rotating the seed each STILL render gives flat
 * areas a fresh mix every time (the new one differs from the old); video frames
 * pass an explicit stable seed so the texture doesn't boil frame-to-frame.
 */
let mosaicSeed = 0;

/**
 * Variety-aware selection: instead of always taking the single nearest-density
 * glyph, pick among the glyphs within a small density window of the target,
 * chosen by a hash of (cell position, seed). Flat areas then show a MIX of
 * letters rather than the same glyph repeated — and that mix changes each render
 * because the seed rotates.
 */
function pickNorm(ramp: GlyphInfo[], key: (i: number) => number, d: number, x: number, y: number, seed: number): number {
  const idx = nearestNorm(ramp, key, d);
  const win = varietyWindowAt(d);
  let lo = idx;
  let hi = idx;
  while (lo > 0 && Math.abs(key(lo - 1) - d) < win) lo--;
  while (hi < ramp.length - 1 && Math.abs(key(hi + 1) - d) < win) hi++;
  if (hi - lo <= 0) return idx;
  const h = hashNoise(x * 0.1337 + seed * 0.37, y * 0.9517 + seed * 0.61);
  return lo + Math.min(hi - lo, Math.floor(h * (hi - lo + 1)));
}
