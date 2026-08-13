// Font loading + per-glyph measurement + density ramp construction.
// The ramp is font-specific and MUST be built at runtime against the loaded font.

export const FONT = '"Noto Sans Ethiopic Variable","Noto Sans Ethiopic","Ebrima","Nyala",sans-serif';

/**
 * Glyph weight used for BOTH the density measurement and the render atlas —
 * the two MUST agree, or the ramp's density values stop describing what is
 * actually drawn. Bumped from 400 to 700 (F2/F6): regular-weight Ethiopic
 * strokes cover only ~1/3 of a cell, so even pure black rendered mid-beige and
 * the og-image read as a pale rectangle at feed size. Bold strokes roughly
 * double the ink coverage and give the output real contrast.
 */
export const GLYPH_WEIGHT = 700;

export interface GlyphInfo {
  cp: number;
  ch: string;
  /** fraction of the measured cell covered by ink, 0..1 */
  density: number;
}

const MEASURE_PX = 64;
const S = MEASURE_PX;

let fontReady: Promise<void> | null = null;

export function loadEthiopicFont(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      // CRITICAL: pass explicit fidel codepoints. `document.fonts.load` with no
      // text defaults to a single space, which unicode-range routing matches to
      // the LATIN subset — so the U+1200–1399 Ethiopic woff2 never downloads,
      // measurement reads fallback glyphs, and on macOS/iOS (no Ethiopic system
      // font) the ramp comes back empty: "Ready · 0 letters" tofu.
      const fidel = 'ሀለሐመሠረሰሸቀበቨተቸኀነኘአከኰኸወዐዘዠየደዸገጠጨጰጸፈፐ፩፪፫';
      await Promise.all([
        document.fonts.load(`${GLYPH_WEIGHT} ${MEASURE_PX}px "Noto Sans Ethiopic Variable"`, fidel),
        document.fonts.load(`${GLYPH_WEIGHT} ${MEASURE_PX}px "Noto Sans Ethiopic"`, fidel),
        document.fonts.load(`${MEASURE_PX}px "Noto Sans Ethiopic Variable"`, fidel),
        document.fonts.load(`${MEASURE_PX}px "Noto Sans Ethiopic"`, fidel),
      ]);
    })();
  }
  return fontReady;
}

let mcv: HTMLCanvasElement | null = null;
let mctx: CanvasRenderingContext2D | null = null;

function measureCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (!mcv || !mctx) {
    mcv = document.createElement('canvas');
    mcv.width = S;
    mcv.height = S;
    mctx = mcv.getContext('2d', { willReadFrequently: true });
    if (!mctx) throw new Error('Canvas 2D context unavailable');
  }
  return [mcv, mctx];
}

function alphaMask(ch: string): Uint8Array {
  const [, ctx] = measureCanvas();
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = '#000';
  ctx.font = `${GLYPH_WEIGHT} ${MEASURE_PX}px "Noto Sans Ethiopic Variable"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, S / 2, S / 2);
  const img = ctx.getImageData(0, 0, S, S);
  const mask = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) mask[i] = img.data[i * 4 + 3];
  return mask;
}

const CENTER_AREA = 26 * 26;
const BORDER_AREA = S * S - 44 * 44;

interface MaskStats {
  density: number;
  borderDensity: number;
  centerDensity: number;
}

function stats(mask: Uint8Array): MaskStats {
  let ink = 0;
  let center = 0;
  let border = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dark = mask[y * S + x] > 60;
      if (!dark) continue;
      ink++;
      const inCenter = x >= 19 && x <= 44 && y >= 19 && y <= 44;
      const onBorder = x <= 8 || x >= 55 || y <= 8 || y >= 55;
      if (inCenter) center++;
      if (onBorder) border++;
    }
  }
  return {
    density: ink / (S * S),
    borderDensity: border / BORDER_AREA,
    centerDensity: center / CENTER_AREA,
  };
}

// A guaranteed-missing glyph renders the .notdef box; we compare candidates against it.
const TOFU_REF = alphaMask('');

function isTofu(mask: Uint8Array): boolean {
  const { density, borderDensity, centerDensity } = stats(mask);
  if (density < 0.008) return true; // nothing rendered (unassigned in some fonts)
  if (borderDensity > 0.45 && centerDensity < 0.06) return true; // hollow box signature
  let diff = 0;
  for (let i = 0; i < mask.length; i++) {
    if ((mask[i] > 60) !== (TOFU_REF[i] > 60)) diff++;
  }
  return diff / mask.length < 0.06; // essentially identical to the .notdef box
}

function measureGlyph(cp: number): GlyphInfo | null {
  const ch = String.fromCodePoint(cp);
  const mask = alphaMask(ch);
  if (isTofu(mask)) return null;
  const { density } = stats(mask);
  return { cp, ch, density };
}

/** Codepoints to skip outright: unassigned slots + standalone combining marks. */
const SKIP = new Set([0x135b, 0x135c, 0x135d, 0x135e, 0x135f]);

/**
 * Build the density ramp for the full Ethiopic set: U+1200–U+135A syllabary
 * (incl. interleaved labiovelars) + punctuation U+1360–U+1368 + digits/numbers
 * U+1369–U+137C. Sorted ascending by measured ink density (lightest first).
 */
export type RampPreset = 'all' | 'common' | 'dense' | 'light';

/**
 * The EXACT standard Amharic fidel: 34 radicals × 7 vowel orders = 238
 * codepoints. The 1st-order (base) of each radical, in traditional order —
 * each spans 7 consecutive codepoints. Nothing outside this set is "common
 * Amharic": no labiovelars (ቈ ኈ ኰ …), no digits/punctuation, no stray slots.
 */
export const FIDEL_BASES = [
  0x1200, 0x1208, 0x1210, 0x1218, 0x1220, 0x1228, 0x1230, 0x1238,
  0x1240, 0x1260, 0x1268, 0x1270, 0x1278, 0x1280, 0x1290, 0x1298,
  0x12a0, 0x12a8, 0x12b8, 0x12c8, 0x12d0, 0x12d8, 0x12e0, 0x12e8,
  0x12f0, 0x1300, 0x1308, 0x1320, 0x1328, 0x1330, 0x1338, 0x1340,
  0x1348, 0x1350,
];

/** Export the set so the app can expose it for diagnostics/tests. */
export const COMMON_AMHARIC: ReadonlySet<number> = (() => {
  const s = new Set<number>();
  for (const base of FIDEL_BASES) for (let i = 0; i < 7; i++) s.add(base + i);
  return s;
})();

let fullSet: GlyphInfo[] | null = null;

/** Measure the full Ethiopic set once, cache it, then slice per preset. */
async function ensureMeasured(): Promise<GlyphInfo[]> {
  if (fullSet) return fullSet;
  await loadEthiopicFont();
  const infos: GlyphInfo[] = [];
  let measured = 0;
  for (let cp = 0x1200; cp <= 0x135a; cp++) {
    if (SKIP.has(cp)) continue;
    const g = measureGlyph(cp);
    if (g) infos.push(g);
    // M5: ~371 glyphs × (fillText + getImageData) is a long main-thread block on
    // cold visits — yield to the event loop every 32 so the page stays responsive.
    if (++measured % 32 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  for (let cp = 0x1360; cp <= 0x137c; cp++) {
    const g = measureGlyph(cp);
    if (g) infos.push(g);
  }
  infos.sort((a, b) => a.density - b.density);
  fullSet = infos;
  return infos;
}

/** Build a density ramp for the chosen letter set, even-spaced across tones. */
export async function buildRamp(preset: RampPreset = 'all'): Promise<GlyphInfo[]> {
  const all = await ensureMeasured();
  let base = all;
  if (preset === 'common') {
    base = all.filter((g) => COMMON_AMHARIC.has(g.cp));
  } else if (preset === 'dense') {
    const med = all[Math.floor(all.length / 2)].density;
    base = all.filter((g) => g.density >= med);
  } else if (preset === 'light') {
    const med = all[Math.floor(all.length / 2)].density;
    base = all.filter((g) => g.density <= med);
  }
  return evenRamp(base);
}

/** The full measured Ethiopic set (everything that passed tofu filtering). */
export async function getAllGlyphs(): Promise<GlyphInfo[]> {
  return ensureMeasured();
}

/** Build an even-spaced density ramp from a chosen subset of glyphs. */
export function rampFromGlyphs(glyphs: GlyphInfo[]): GlyphInfo[] {
  const sorted = glyphs.slice().sort((a, b) => a.density - b.density);
  return evenRamp(sorted);
}

/**
 * Resample the density-sorted ramp to roughly EVEN density steps with DISTINCT
 * glyphs. Naive nearest-density selection over-clusters: glyphs whose measured
 * densities coincide all map to the same shape, so one glyph (e.g. ጨ) gets
 * repeated across wide tonal bands. Even spacing spreads usage across shapes.
 */
function evenRamp(sorted: GlyphInfo[]): GlyphInfo[] {
  if (sorted.length <= 1) return sorted;
  const lo = sorted[0].density;
  const hi = sorted[sorted.length - 1].density;
  const span = Math.max(1e-4, hi - lo);
  const maxN = Math.min(sorted.length, 256);
  const picked: GlyphInfo[] = [sorted[0]];
  for (let k = 1; k < maxN - 1; k++) {
    const target = lo + (span * k) / (maxN - 1);
    picked.push(sorted[nearestDensity(sorted, target)]);
  }
  picked.push(sorted[sorted.length - 1]);
  // De-duplicate by glyph so repeated shapes can't dominate; first (density-sorted) occurrence wins.
  const seen = new Set<string>();
  const out: GlyphInfo[] = [];
  for (const g of picked) {
    if (!seen.has(g.ch)) {
      seen.add(g.ch);
      out.push(g);
    }
  }
  return out;
}

function nearestDensity(sorted: GlyphInfo[], d: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].density < d) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0) {
    return Math.abs(sorted[lo - 1].density - d) < Math.abs(sorted[lo].density - d) ? lo - 1 : lo;
  }
  return lo;
}
