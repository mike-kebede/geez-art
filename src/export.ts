// Export module: PNG download, plain-text rendering, and standalone HTML export.
// Uses toBlob (async, memory-friendly) rather than toDataURL where possible.

import { FONT } from './fonts';
import ethiopicWoffUrl from '@fontsource-variable/noto-sans-ethiopic/files/noto-sans-ethiopic-ethiopic-wght-normal.woff2';
import { MAX_SOURCE_EDGE } from './limits';

const DEFAULT_FILENAME = 'geez-art.png';

/** Share-card colors — SUBTLE: parchment footer, thin gold hairline, muted
 *  umber brand text, madder CTA. The mosaic is the hero; the card is quiet. */
const BRAND = {
  card: '#F5E9D1',   // parchment-300
  gold: '#C9962E',   // gold-500 hairline
  text: '#573928',   // umber-700 brand
  accent: '#8A2B1D', // madder CTA
};

/* ---------- share card (html-to-image) ---------- */

let shareCardEl: HTMLDivElement | null = null;
let shareCardWrap: HTMLDivElement | null = null;

/** Build (once) a hidden share-card DOM element: the mosaic + a subtle parchment
 *  footer with the bilingual brand and the CTA. Captured with html-to-image
 *  (toBlob) - the exchange.et-style in-app card. */
function getShareCard(mosaic: HTMLCanvasElement, siteUrl: string): HTMLDivElement {
  if (!shareCardEl) {
    // The card is built at fixed 0,0 so html-to-image can paint it, but it is
    // CLIPPED by a zero-size overflow:hidden wrapper: a negative z-index alone
    // still paints above the canvas backdrop and bleeds through the app's
    // transparent gaps (the mosaic showed behind the chrome on Share).
    shareCardWrap = document.createElement('div');
    shareCardWrap.style.position = 'fixed';
    shareCardWrap.style.left = '0';
    shareCardWrap.style.top = '0';
    shareCardWrap.style.width = '0';
    shareCardWrap.style.height = '0';
    shareCardWrap.style.overflow = 'hidden';
    shareCardWrap.style.pointerEvents = 'none';
    document.body.appendChild(shareCardWrap);
    shareCardEl = document.createElement('div');
    shareCardEl.style.width = '1200px';
    shareCardEl.style.background = '#F5E9D1';
    shareCardEl.style.fontFamily = '"Noto Sans Ethiopic Variable","Noto Sans Ethiopic",sans-serif';
    shareCardWrap.appendChild(shareCardEl);
    const foot = document.createElement('div');
    foot.style.display = 'flex';
    foot.style.justifyContent = 'space-between';
    foot.style.alignItems = 'center';
    foot.style.padding = '16px 20px';
    foot.style.borderTop = '2px solid #C9962E';
    const brand = document.createElement('span');
    brand.style.fontSize = '22px';
    brand.style.fontWeight = '600';
    brand.style.color = '#573928';
    const cta = document.createElement('span');
    cta.style.fontSize = '19px';
    cta.style.fontWeight = '600';
    cta.style.color = '#8A2B1D';
    foot.append(brand, cta);
    shareCardEl.appendChild(foot);
  }
  // Mosaic image (downscaled to the card width). Explicit height: html-to-image
  // clones the node, and height:auto can resolve to 0 there.
  let img = shareCardEl.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    img.style.display = 'block';
    img.style.width = '1200px';
    shareCardEl.insertBefore(img, shareCardEl.lastElementChild);
  }
  const scale = Math.min(1, 1200 / mosaic.width);
  const w = Math.max(1, Math.round(mosaic.width * scale));
  const h = Math.max(1, Math.round(mosaic.height * scale));
  img.style.height = h + 'px';
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  tmp.getContext('2d')!.drawImage(mosaic, 0, 0, w, h);
  img.src = tmp.toDataURL('image/png');
  // Footer text (bilingual brand + CTA).
  const [brand, cta] = Array.from(shareCardEl.lastElementChild!.children) as [HTMLSpanElement, HTMLSpanElement];
  brand.textContent = 'ግዕዝ ጥበብ · geez art';
  cta.textContent = 'make yours at ' + siteUrl;
  return shareCardEl;
}

/** Capture the share card (mosaic + footer + CTA) as a PNG blob via html-to-image. */
export async function captureShareCard(mosaic: HTMLCanvasElement, siteUrl: string): Promise<Blob> {
  const { toBlob } = await import('html-to-image'); // lazy - keeps it out of the eager bundle
  const card = getShareCard(mosaic, siteUrl);
  // Override the clone's offscreen positioning - a fixed element at
  // left:-10000px paints nothing in the foreignObject clone.
  const blob = await toBlob(card, {
    width: 1200,
    pixelRatio: 1,
    cacheBust: true,
    style: { position: 'fixed', left: '0', top: '0', margin: '0' },
  });
  if (!blob) throw new Error('share-card capture failed');
  return blob;
}

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
 * Trigger a browser download of a blob via a temporary anchor, revoking the
 * object URL once the download has had a chance to start. Single helper used by
 * every download path (L23) — was duplicated across app.ts and export.ts.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Trigger a browser download of the canvas as a PNG.
 * Uses a Blob URL (smaller than a data URL) and revokes it after the
 * download has a chance to start.
 */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string = DEFAULT_FILENAME): void {
  void canvasToBlob(canvas)
    .then((blob) => triggerDownload(blob, filename))
    // L1: a failed toBlob must not surface as an unhandled rejection.
    .catch(() => {});
}

/**
 * Build a shareable PNG: the mosaic with a SUBTLE share-card footer beneath it
 * (thin gold hairline, small bilingual brand lockup, and a CTA), so anyone who
 * receives the image can find the app and make their own. The mosaic is the
 * hero; the footer is a quiet caption, not a banner.
 */
export function makeShareImage(mosaic: HTMLCanvasElement, siteUrl: string): HTMLCanvasElement {
  const bandH = Math.min(56, Math.max(36, Math.round(mosaic.width * 0.035)));
  const out = document.createElement('canvas');
  out.width = mosaic.width;
  out.height = mosaic.height + bandH;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = BRAND.card;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(mosaic, 0, 0);
  drawBrandBand(ctx, mosaic.width, mosaic.height, bandH, siteUrl);
  return out;
}

/**
 * Draw the share-card footer (gold hairline + bilingual brand lockup + CTA)
 * BELOW the mosaic area on an already-sized context. Shared by the static PNG
 * path and the video/GIF capture path so every shared artifact carries the URL.
 * Subtle on purpose: parchment, muted umber text, one thin gold line.
 */
export function drawBrandBand(
  ctx: CanvasRenderingContext2D,
  mosaicW: number,
  mosaicH: number,
  bandH: number,
  siteUrl: string,
): void {
  ctx.fillStyle = BRAND.card;
  ctx.fillRect(0, mosaicH, mosaicW, bandH);
  ctx.fillStyle = BRAND.gold;
  ctx.fillRect(0, mosaicH, mosaicW, 2); // one thin gold hairline
  const mid = mosaicH + bandH / 2;
  ctx.textBaseline = 'middle';

  const PAD = 16; // horizontal padding on each side of the card
  const GAP = 24; // minimum clearance between brand and CTA

  // Brand lockup (left): bilingual, small and muted.
  ctx.textAlign = 'left';
  const brandPx = Math.round(bandH * 0.34);
  ctx.font = `600 ${brandPx}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",sans-serif`;
  ctx.fillStyle = BRAND.text;
  ctx.fillText('ግዕዝ ጥበብ · geez art', PAD, mid);
  const brandW = ctx.measureText('ግዕዝ ጥበብ · geez art').width;
  const brandRight = PAD + brandW;

  // Viral CTA (right): "make yours at <url>". Shrink until it fits; if it
  // still can't, drop the prefix and show the bare URL.
  const right = mosaicW - PAD;
  const full = 'make yours at ' + siteUrl;
  const bare = siteUrl;
  const minSize = 11;
  const fitsCta = (label: string, px: number): boolean => {
    ctx.font = `${px}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",monospace`;
    return brandRight + GAP <= right - ctx.measureText(label).width;
  };
  let label = full;
  let size = Math.round(bandH * 0.3);
  if (!fitsCta(label, size)) {
    while (size > minSize && !fitsCta(label, size)) size -= 1;
    if (!fitsCta(label, size)) {
      label = bare;
      size = Math.round(bandH * 0.3);
      while (size > minSize && !fitsCta(label, size)) size -= 1;
    }
  }
  ctx.font = `${size}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",monospace`;
  ctx.fillStyle = BRAND.accent;
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
  // VP8/VP9 (Chromium WebM) and H.264 (Safari MP4) require EVEN dimensions —
  // MediaRecorder throws on odd canvas sizes (M2). Snap to even, not just round.
  const w = (Math.max(2, Math.round(mosaic.width * scale)) & ~1);
  const h = (Math.max(2, Math.round(mosaic.height * scale)) & ~1);
  // #6: snap the band height to EVEN so h+bandH never hands MediaRecorder an odd canvas.
  const bandH = Math.max(32, Math.min(64, Math.round(w * 0.05))) & ~1;
  if (target.width !== w || target.height !== h + bandH) {
    target.width = w;
    target.height = h + bandH;
  }
  const ctx = target.getContext('2d')!;
  ctx.fillStyle = BRAND.card;
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(mosaic, 0, 0, w, h);
  // Video/GIF watermark: a single English URL, sized to fit — the full wordmark
  // + CTA band overflows on the narrower capture canvas (the ?ref= suffix plus
  // wordmark collided). The URL alone is the whole viral CTA.
  drawUrlBand(ctx, w, h, bandH, siteUrl);
}

/** Minimal watermark for video/GIF exports: the site URL centered on the subtle
 *  parchment card, umber, shrunk until it fits on one line. No overflow. */
function drawUrlBand(ctx: CanvasRenderingContext2D, mosaicW: number, mosaicH: number, bandH: number, siteUrl: string): void {
  ctx.fillStyle = BRAND.card;
  ctx.fillRect(0, mosaicH, mosaicW, bandH);
  ctx.fillStyle = BRAND.gold;
  ctx.fillRect(0, mosaicH, mosaicW, 2); // gold hairline
  const PAD = 12;
  const maxW = Math.max(40, mosaicW - PAD * 2);
  let size = Math.round(bandH * 0.42);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (; size >= 9; size--) {
    ctx.font = `${size}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",monospace`;
    if (ctx.measureText(siteUrl).width <= maxW) break;
  }
  ctx.fillStyle = BRAND.text;
  ctx.fillText(siteUrl, mosaicW / 2, mosaicH + bandH / 2);
}

/**
 * Downscale a canvas so its long edge ≤ maxEdge, returning the SAME canvas when
 * it already fits. Share sheets on budget phones choke on multi-MB PNGs, and
 * WhatsApp/Telegram recompress anyway — so the shared image is capped (M13).
 */
export function downscaleCanvas(canvas: HTMLCanvasElement, maxEdge = MAX_SOURCE_EDGE): HTMLCanvasElement {
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
  // #5: iOS Web Share has no file support — share the TEXT link natively AND
  // download the PNG, so the referral token + native sheet both fire.
  if (nav.canShare && nav.share && nav.canShare({ text })) {
    try { await nav.share({ text }); } catch (err) { if ((err as Error).name === 'AbortError') return 'cancelled'; }
    downloadCanvasPNG(canvas, filename);
    return 'shared';
  }
  downloadCanvasPNG(canvas, filename);
  return 'downloaded';
}

/**
 * Share a BLOB (e.g. a recorded video) with the share-sheet text — same
 * fallback ladder as shareCanvas: file-share where supported, else text-share +
 * download, else download. Used so the Share button can hand off the actual
 * video file (not just a still frame) for video sources.
 */
export async function shareBlob(
  blob: Blob,
  filename: string,
  text: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
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
        triggerDownload(blob, filename);
        return 'downloaded';
      }
      return 'cancelled';
    }
  }
  // iOS Web Share has no file support — share the TEXT link natively AND
  // download the video, so the referral token + native sheet both fire.
  if (nav.canShare && nav.share && nav.canShare({ text })) {
    try { await nav.share({ text }); } catch (err) { if ((err as Error).name === 'AbortError') return 'cancelled'; }
    triggerDownload(blob, filename);
    return 'shared';
  }
  triggerDownload(blob, filename);
  return 'downloaded';
}

/**
 * Share MULTIPLE files (e.g. the recorded video AND the share-card PNG) with
 * the share-sheet text — same fallback ladder as shareCanvas/shareBlob. Used so
 * the Share button can hand over the moving mosaic AND the card together.
 */
export async function shareFiles(files: File[], text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };
  if (nav.canShare && nav.share && nav.canShare({ files })) {
    try {
      await nav.share({ files, text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        for (const f of files) triggerDownload(f, f.name);
        return 'downloaded';
      }
      return 'cancelled';
    }
  }
  // No file-sharing support: share the TEXT link natively AND download the files.
  if (nav.canShare && nav.share && nav.canShare({ text })) {
    try { await nav.share({ text }); } catch (err) { if ((err as Error).name === 'AbortError') return 'cancelled'; }
    for (const f of files) triggerDownload(f, f.name);
    return 'shared';
  }
  for (const f of files) triggerDownload(f, f.name);
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
  opts: { ink?: string; paper?: string; fontSize?: string; siteUrl?: string } | undefined,
  fontFamily: string,
  extraHead: readonly string[],
): string {
  const { ink = '#2a1a12', paper = '#f3ecdd', fontSize = '13px', siteUrl } = opts ?? {};
  const body = escapeHTML(gridToText(chars));
  // #1: the one export that carried no attribution — a credit line under the pre.
  const credit = siteUrl
    ? `<p style="font-family:'Fidel',sans-serif;font-size:12px;color:#8a6d2f;margin:18px 0 0;">made with ግዕዝ geez art — ${escapeHTML(siteUrl)}</p>`
    : '';
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
    credit,
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
  opts?: { ink?: string; paper?: string; fontSize?: string; siteUrl?: string },
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
