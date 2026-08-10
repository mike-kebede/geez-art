// Export module: PNG download, plain-text rendering, and standalone HTML export.
// Uses toBlob (async, memory-friendly) rather than toDataURL where possible.

import { FONT } from './fonts';

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
  // brand band
  ctx.fillStyle = BRAND.band;
  ctx.fillRect(0, mosaic.height, out.width, bandH);
  ctx.fillStyle = BRAND.gold;
  ctx.fillRect(0, mosaic.height, out.width, 2); // gold hairline
  const mid = mosaic.height + bandH / 2;
  ctx.textBaseline = 'middle';
  // wordmark: fidel + latin
  ctx.font = `700 ${Math.round(bandH * 0.5)}px "Noto Sans Ethiopic Variable","Noto Sans Ethiopic",serif`;
  ctx.fillStyle = BRAND.gold;
  ctx.textAlign = 'left';
  ctx.fillText('ግዕዝ', 16, mid);
  ctx.font = `600 ${Math.round(bandH * 0.42)}px "Inter Variable","Inter",sans-serif`;
  ctx.fillStyle = BRAND.text;
  ctx.fillText('geez·art', 16 + Math.round(bandH * 0.62), mid);
  // url on the right — the "make yours" viral CTA
  ctx.font = `${Math.round(bandH * 0.32)}px ui-monospace,Menlo,monospace`;
  ctx.fillStyle = BRAND.gold;
  ctx.textAlign = 'right';
  ctx.fillText('make yours at ' + siteUrl, out.width - 16, mid);
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
): Promise<'shared' | 'downloaded'> {
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
      return 'shared'; // user cancelled the sheet — not an error
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

/**
 * Build a fully self-contained HTML string: a <pre> with inline styles
 * (paper/ink colors, Ethiopic font stack, font size) plus a minimal <head>.
 * Valid standalone HTML the user can save and open in any browser.
 */
export function exportHTML(
  chars: string[][],
  opts?: { ink?: string; paper?: string; fontSize?: string },
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
    '</head>',
    `<body style="margin:0;padding:16px;background:${paper};color:${ink};">`,
    `<pre style="font-family:${FONT};font-size:${fontSize};line-height:1.1;margin:0;letter-spacing:0;">${body}</pre>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** Escape the few characters that are special in HTML text content. */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
