// Font loading + per-glyph measurement + density ramp construction.
// The ramp is font-specific and MUST be built at runtime against the loaded font.

export const FONT = '"Noto Sans Ethiopic Variable","Noto Sans Ethiopic","Ebrima","Nyala",sans-serif';

export interface GlyphInfo {
  cp: number;
  ch: string;
  /** fraction of the measured cell covered by ink, 0..1 */
  density: number;
  /** advance width in px at measurement size */
  width: number;
}

const MEASURE_PX = 64;
const S = MEASURE_PX;

let fontReady: Promise<void> | null = null;

export function loadEthiopicFont(): Promise<void> {
  if (!fontReady) {
    fontReady = (async () => {
      // Targeted load: document.fonts.ready alone can miss async faces.
      await Promise.all([
        document.fonts.load(`${MEASURE_PX}px "Noto Sans Ethiopic Variable"`),
        document.fonts.load(`${MEASURE_PX}px "Noto Sans Ethiopic"`),
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
  ctx.font = `${MEASURE_PX}px "Noto Sans Ethiopic Variable"`;
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
  const [, ctx] = measureCanvas();
  ctx.font = `${MEASURE_PX}px "Noto Sans Ethiopic Variable"`;
  const width = ctx.measureText(ch).width || MEASURE_PX;
  return { cp, ch, density, width };
}

/** Codepoints to skip outright: unassigned slots + standalone combining marks. */
const SKIP = new Set([0x135b, 0x135c, 0x135d, 0x135e, 0x135f]);

/**
 * Build the density ramp for the full Ethiopic set: U+1200–U+135A syllabary
 * (incl. interleaved labiovelars) + punctuation U+1360–U+1368 + digits/numbers
 * U+1369–U+137C. Sorted ascending by measured ink density (lightest first).
 */
export type RampPreset = 'all' | 'common' | 'dense' | 'light';

/** Labiovelar forms (ቈ ኈ ኰ ዀ …) — not part of the standard Amharic syllabary. */
const LABIOVELARS = new Set([
  0x1248, 0x124a, 0x124b, 0x124c, 0x124d,
  0x1258, 0x125a, 0x125b, 0x125c, 0x125d,
  0x1288, 0x128a, 0x128b, 0x128c, 0x128d,
  0x12b0, 0x12b2, 0x12b3, 0x12b4, 0x12b5,
  0x12c0, 0x12c2, 0x12c3, 0x12c4, 0x12c5,
  0x1310, 0x1312, 0x1313, 0x1314, 0x1315,
]);

let fullSet: GlyphInfo[] | null = null;

/** Measure the full Ethiopic set once, cache it, then slice per preset. */
async function ensureMeasured(): Promise<GlyphInfo[]> {
  if (fullSet) return fullSet;
  await loadEthiopicFont();
  const infos: GlyphInfo[] = [];
  for (let cp = 0x1200; cp <= 0x135a; cp++) {
    if (SKIP.has(cp)) continue;
    const g = measureGlyph(cp);
    if (g) infos.push(g);
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
    base = all.filter((g) => !LABIOVELARS.has(g.cp) && g.cp < 0x1360);
  } else if (preset === 'dense') {
    const med = all[Math.floor(all.length / 2)].density;
    base = all.filter((g) => g.density >= med);
  } else if (preset === 'light') {
    const med = all[Math.floor(all.length / 2)].density;
    base = all.filter((g) => g.density <= med);
  }
  return evenRamp(base);
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
