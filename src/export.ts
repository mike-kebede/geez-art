// Export module: PNG download, plain-text rendering, and standalone HTML export.
// Uses toBlob (async, memory-friendly) rather than toDataURL where possible.

import { FONT } from './fonts';
import ethiopicWoffUrl from '@fontsource-variable/noto-sans-ethiopic/files/noto-sans-ethiopic-ethiopic-wght-normal.woff2';

const DEFAULT_FILENAME = 'geez-art.png';

/** Brand-band colors for shared images — dark band with gold accents, matching the chrome. */
const BRAND = { band: '#15110d', gold: '#d9a441', text: '#f1e9d9' };

/** Promise wrapper around canvas.toBlob("image/png"). Rejects if the blob is null. */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      },
      'image/png',
    );
  });
}

/**
 * Trigger a browser download of the canvas as a PNG.
 * Uses a Blob URL (smaller than a data URL) and revokes it after the
 * download has a chance to start.
 */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string = DEFAULT_FILENAME): void {
  void canvasToBlob(canvas).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

/**
 * Build a shareable PNG: the mosaic with a brand band (wordmark + site URL)
 * beneath it, so anyone who receives the image can find the app and make
 * their own. The band scales with the mosaic width.
 */
export function makeShareImage(mosaic: HTMLCanvasElement, siteUrl: string): HTMLCanvasElement {
  const bandH = Math.min(84, Math.max(44, Math.round(mosaic.width * 0.045)));
  const out = document.createElement('canvas');
  out.width = mosaic.width;
  out.height = mosaic.height + bandH;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = BRAND.band;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(mosaic, 0, 0);
  drawBrandBand(ctx, mosaic.width, mosaic.height, bandH, siteUrl);
  return out;
}

/**
 * Draw the brand band (gold hairline + fidel wordmark + "make yours at" CTA)
 * BELOW the mosaic area on an already-sized context. Shared by the static PNG
 * path and the video/GIF capture path so every shared artifact carries the URL.
 */
export function drawBrandBand(
  ctx: CanvasRenderingContext2D,
  mosaicW: number,
  mosaicH: number,
  bandH: number,
  siteUrl: string,
): void {
  ctx.fillStyle = BRAND.band;
  ctx.fillRect(0, mosaicH, mosaicW, bandH);
  ctx.fillStyle = BRAND.gold;
  ctx.fillRect(0, mosaicH, mosaicW, 2); // gold hairline
  const mid = mosaicH + bandH / 2;
  ctx.textBaseline = 'middle';

  const PAD = 16; // horizontal padding on each side of the band
  const STEP = Math.round(bandH * 0.62); // gap between the fidel and the latin wordmark
  const GAP = 24; // minimum clearance between wordmark and CTA

  // wordmark: fidel + latin (left-anchored)
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.round(bandH * 0.5)}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",serif`;
  ctx.fillStyle = BRAND.gold;
  ctx.fillText('ግዕዝ', PAD, mid);
  const fidelW = ctx.measureText('ግዕዝ').width;
  ctx.font = `600 ${Math.round(bandH * 0.42)}px "Inter Variable","Inter",sans-serif`;
  ctx.fillStyle = BRAND.text;
  ctx.fillText('geez·art', PAD + STEP, mid);
  const latinW = ctx.measureText('geez·art').width;
  // Occupied width of the wordmark (fidel and latin may overlap, so use the wider edge).
  const wordmarkRight = Math.max(PAD + fidelW, PAD + STEP + latinW);

  // Viral CTA on the right. On narrow mosaics the monospace URL collides with
  // the wordmark; shrink it until it fits, and if it still can't, drop the
  // "make yours at " prefix and show the bare URL (still findable as the CTA).
  const right = mosaicW - PAD;
  const full = 'make yours at ' + siteUrl;
  const bare = siteUrl;
  const minSize = 10;
  const fitsCta = (label: string, px: number): boolean => {
    ctx.font = `${px}px ui-monospace,Menlo,monospace`;
    return wordmarkRight + GAP <= right - ctx.measureText(label).width;
  };
  let label = full;
  let size = Math.round(bandH * 0.32);
  if (!fitsCta(label, size)) {
    while (size > minSize && !fitsCta(label, size)) size -= 1;
    if (!fitsCta(label, size)) {
      label = bare; // the prefix doesn't fit — the URL alone still carries the app
      size = Math.round(bandH * 0.32);
      while (size > minSize && !fitsCta(label, size)) size -= 1;
    }
  }
  ctx.font = `${size}px ui-monospace,Menlo,monospace`;
  ctx.fillStyle = BRAND.gold;
  ctx.textAlign = 'right';
  ctx.fillText(label, right, mid);
}

/**
 * Paint the live mosaic + URL band onto `target` at a capture-friendly size
 * (long edge ≤ maxEdge). Call this every frame during recording so the exported
 * video/GIF animates AND carries the loop URL (M2), downscaled for low-end
 * encoding (M10).
 */
export function paintBrandedCapture(
  target: HTMLCanvasElement,
  mosaic: HTMLCanvasElement,
  siteUrl: string,
  maxEdge = 1280,
): void {
  const scale = Math.min(1, maxEdge / Math.max(1, mosaic.width, mosaic.height));
  const w = Math.max(1, Math.round(mosaic.width * scale));
  const h = Math.max(1, Math.round(mosaic.height * scale));
  const bandH = Math.max(32, Math.min(64, Math.round(w * 0.05)));
  if (target.width !== w || target.height !== h + bandH) {
    target.width = w;
    target.height = h + bandH;
  }
  const ctx = target.getContext('2d')!;
  ctx.fillStyle = BRAND.band;
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(mosaic, 0, 0, w, h);
  drawBrandBand(ctx, w, h, bandH, siteUrl);
}

/**
 * Downscale a canvas so its long edge ≤ maxEdge, returning the SAME canvas when
 * it already fits. Share sheets on budget phones choke on multi-MB PNGs, and
 * WhatsApp/Telegram recompress anyway — so the shared image is capped (M13).
 */
export function downscaleCanvas(canvas: HTMLCanvasElement, maxEdge = 1600): HTMLCanvasElement {
  const long = Math.max(canvas.width, canvas.height);
  if (long <= maxEdge) return canvas;
  const k = maxEdge / long;
  const w = Math.max(1, Math.round(canvas.width * k));
  const h = Math.max(1, Math.round(canvas.height * k));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, w, h);
  return out;
}

/**
 * Share the branded image via the native share sheet when available (on mobile
 * that surfaces WhatsApp/Telegram/Facebook in the sheet); otherwise fall back
 * to downloading the PNG.
 */
export async function shareCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  filename = 'geez-art.png',
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        downloadCanvasPNG(canvas, filename);
        return 'downloaded';
      }
      return 'cancelled'; // user dismissed the sheet — not an error, but trackable (M6)
    }
  }
  downloadCanvasPNG(canvas, filename);
  return 'downloaded';
}

/**
 * Render the mosaic grid as plain text: rows joined by "\n", cells within a
 * row joined with the empty string so the picture holds. Best-effort — glyph
 * advance widths vary, so alignment is approximate. Meant for a <pre> element
 * rendered with the Ethiopic font.
 */
export function gridToText(chars: string[][]): string {
  return chars.map((row) => row.join('')).join('\n');
}

/** Shared shell for the exported HTML document; `extraHead` adds <head> lines (e.g. an embedded @font-face style). */
function htmlDocument(
  chars: string[][],
  opts: { ink?: string; paper?: string; fontSize?: string } | undefined,
  fontFamily: string,
  extraHead: readonly string[],
): string {
  const { ink = '#2a1a12', paper = '#f3ecdd', fontSize = '13px' } = opts ?? {};
  const body = escapeHTML(gridToText(chars));
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <title>Geez Art Mosaic</title>',
    ...extraHead,
    '</head>',
    `<body style="margin:0;padding:16px;background:${paper};color:${ink};">`,
    `<pre style="font-family:${fontFamily};font-size:${fontSize};line-height:1.1;margin:0;letter-spacing:0;">${body}</pre>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/**
 * "Save as HTML" with the font baked in: embeds the Noto Ethiopic woff2 as a
 * base64 data URL inside an inline @font-face ("Fidel") so the exported file
 * renders Ge'ez correctly everywhere — including macOS/iOS, which have no
 * default Ethiopic font. The result is a single self-contained string; the
 * system Ethiopic stack is kept as a fallback behind the embedded face.
 *
 * Async because the bundled woff2 must be fetched and base64-encoded. Callers
 * (app.ts downloadHTML) must `await` this instead of the sync exportHTML to
 * actually embed the font.
 */
export async function selfContainedHTML(
  chars: string[][],
  opts?: { ink?: string; paper?: string; fontSize?: string },
): Promise<string> {
  const face = await embeddedFidelFontFace();
  const fontFamily = `"Fidel",${FONT}`;
  return htmlDocument(chars, opts, fontFamily, [`  <style>${face}</style>`]);
}

/** Fetch the bundled Ethiopic woff2 and render a @font-face rule embedding it as a data URL. */
async function embeddedFidelFontFace(): Promise<string> {
  const resp = await fetch(ethiopicWoffUrl);
  if (!resp.ok) throw new Error(`Failed to fetch embedded font (HTTP ${resp.status})`);
  const b64 = bytesToBase64(new Uint8Array(await resp.arrayBuffer()));
  return `@font-face{font-family:"Fidel";src:url("data:font/woff2;base64,${b64}") format("woff2");font-display:block;}`;
}

/** Base64-encode raw bytes without relying on btoa's input-size limits. */
function bytesToBase64(bytes: Uint8Array): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += CHARS[b0 >> 2];
    out += CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? CHARS[b2 & 63] : '=';
  }
  return out;
}

/** Escape the few characters that are special in HTML text content. */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
