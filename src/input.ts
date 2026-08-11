// Image input: File / URL / clipboard-paste / drag-drop → opaque, EXIF-corrected canvas.

import { MAX_SOURCE_EDGE } from './limits';
//
// EXIF orientation is read from the raw bytes with exifr, while the pixels are
// decoded with `imageOrientation: 'none'` so the browser does NOT auto-rotate.
// We then draw the raw pixels through a manual orientation transform — that is
// deterministic, with no reliance on a browser's inconsistent auto-rotate
// behavior. If `imageOrientation: 'none'` is unsupported we fall back to the
// browser's default decode, which DOES apply EXIF rotation; decodeRaw reports
// that via `rotated`, and the manual pass is skipped so the image is never
// rotated twice. Transparency is composited onto white so the mosaic renderer
// always receives an opaque source.

/** True for Apple HEIC/HEIF files — which only a few browsers can decode. */
export function isHeic(file: File): boolean {
  return file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
}

/**
 * createImageBitmap resize options that cap the long edge at 1600px — decode
 * straight into the downscaled size so a 12MP phone photo never materializes at
 * full resolution (~48–60MB transient) on a low-end phone (L28).
 */
function resizeDims(
  size: { width?: number; height?: number } | undefined,
): { resizeWidth: number; resizeHeight: number } | undefined {
  const w = size?.width;
  const h = size?.height;
  if (!w || !h) return undefined;
  const k = Math.min(1, MAX_SOURCE_EDGE / Math.max(w, h));
  if (k >= 1) return undefined;
  // Resize applies to the SOURCE bitmap (pre-orientation). The 90°/270° EXIF
  // swaps w/h in the destination, but the long edge is unchanged, so the scale
  // factor is the same either way.
  return { resizeWidth: Math.max(1, Math.round(w * k)), resizeHeight: Math.max(1, Math.round(h * k)) };
}

/**
 * Read just enough of the file header to know its pixel dimensions (PNG, GIF,
 * WebP, JPEG). Returns undefined for unknown formats (e.g. HEIC) — the caller
 * then decodes without the memory-saving resize, which is still correct.
 * Intentionally tiny and dependency-free: this only feeds resizeDims, it never
 * touches the pixels.
 */
async function imageDimensions(
  blob: Blob,
): Promise<{ width?: number; height?: number } | undefined> {
  try {
    // 64KB probe: EXIF-heavy phone JPEGs carry 5–40KB of metadata/thumbnail
    // before the SOF marker — the old 4KB window missed it, silently skipping
    // the memory-saving decode-time resize (M4). The JPEG walk below grows the
    // probe in chunks up to 512KB so heavy EXIF still yields the dims (L9).
    let buf = new Uint8Array(await blob.slice(0, 65536).arrayBuffer());
    if (buf.length < 24) return undefined;

    // PNG: 8-byte signature, then IHDR width/height at offsets 16/20.
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
      return {
        width: (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19],
        height: (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23],
      };
    }

    // GIF: "GIF87a"/"GIF89a", width/height little-endian at offsets 6/8.
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
      return { width: buf[6] | (buf[7] << 8), height: buf[8] | (buf[9] << 8) };
    }

    // WebP: "RIFF"...."WEBP", then VP8 / VP8L chunk dims.
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45) {
      const fourcc = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
      if (fourcc === 'VP8 ' && buf.length >= 30) {
        return { width: buf[26] | ((buf[27] & 0x3f) << 8), height: buf[28] | ((buf[29] & 0x3f) << 8) };
      }
      if (fourcc === 'VP8L' && buf.length >= 26) {
        return {
          width: ((buf[21] | (buf[22] << 8) | (buf[23] << 16)) & 0x3fff) + 1,
          height: (((buf[23] >> 6) | (buf[24] << 2) | (buf[25] << 10)) & 0x3fff) + 1,
        };
      }
      return undefined;
    }

    // JPEG: walk the marker segments until an SOF (0xFFC0–0xFFCF, minus the
    // Huffman/quantization tables C4/C8/CC) which carries height/width. If the
    // window ends mid-segment (big EXIF/thumbnail before SOF), grow it and
    // re-walk — up to 512KB (L9).
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      const CHUNK = 65536;
      const MAX_PROBE = 8 * CHUNK;
      for (;;) {
        let o = 2;
        while (o + 9 < buf.length) {
          if (buf[o] !== 0xff) { o++; continue; }
          const marker = buf[o + 1];
          if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
            return { height: (buf[o + 5] << 8) | buf[o + 6], width: (buf[o + 7] << 8) | buf[o + 8] };
          }
          o += 2 + ((buf[o + 2] << 8) | buf[o + 3]);
        }
        const next = Math.min(blob.size, buf.length + CHUNK);
        if (buf.length >= MAX_PROBE || next === buf.length) return undefined;
        buf = new Uint8Array(await blob.slice(0, next).arrayBuffer());
      }
    }

    return undefined;
  } catch {
    return undefined; // never let dimension probing sink a decodable image
  }
}

/** Map an EXIF orientation (1-8) to a canvas transform. Source is w×h; for 5-8 the destination is h×w. */
function applyOrientation(ctx: CanvasRenderingContext2D, o: number, w: number, h: number): void {
  switch (o) {
    case 2: ctx.transform(-1, 0, 0, 1, w, 0); break; // mirrored horizontally
    case 3: ctx.transform(-1, 0, 0, -1, w, h); break; // 180°
    case 4: ctx.transform(1, 0, 0, -1, 0, h); break; // mirrored vertically
    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break; // transpose (mirror across main diagonal)
    case 6: ctx.transform(0, 1, -1, 0, h, 0); break; // 90° CW
    case 7: ctx.transform(0, -1, -1, 0, h, w); break; // transverse (mirror across anti-diagonal)
    case 8: ctx.transform(0, -1, 1, 0, 0, w); break; // 270° CW
    default: break; // 1 (and unknown values) → identity, no transform
  }
}

/** Draw raw pixels onto a white canvas, EXIF-oriented, long edge capped at 1600px. */
function orientAndComposite(src: Decoded, orientation: number | undefined): HTMLCanvasElement {
  const o = orientation ?? 1;
  const w = src.width;
  const h = src.height;
  const swapped = o >= 5 && o <= 8; // 90°/270° orientations exchange width and height

  // Downscale the output canvas so the long edge is capped at 1600px (never
  // upscale). The mosaic's source pass samples every source pixel, so a phone
  // photo at natural resolution (e.g. 4000×3000) costs ~10-25× more per render
  // than the downscaled 1600×1200 — the mosaic grid itself only needs detail
  // up to the cell count, so the extra resolution is pure waste.
  const MAX_EDGE = MAX_SOURCE_EDGE;
  let outW = swapped ? h : w;
  let outH = swapped ? w : h;
  const longEdge = Math.max(outW, outH);
  if (longEdge > MAX_EDGE) {
    const scale = MAX_EDGE / longEdge;
    outW = Math.max(1, Math.round(outW * scale));
    outH = Math.max(1, Math.round(outH * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  // F5: the mosaic renderer reads this canvas back via getImageData every render
  // — flag it so the canvas doesn't stay GPU-accelerated and stall on readback.
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high'; // keep downscaled photos crisp
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height); // composite alpha onto white
  applyOrientation(ctx, o, w, h);
  ctx.drawImage(src, 0, 0, outW, outH);
  return canvas;
}

type Decoded = ImageBitmap | HTMLImageElement;

interface DecodedSource {
  src: Decoded;
  /** True when the browser already applied its default EXIF auto-rotation
   *  during a fallback decode, so the manual orientation pass must be skipped
   *  — applying it on top would rotate the image twice. */
  rotated: boolean;
}

/**
 * Decode an image blob. The primary path uses `imageOrientation: 'none'` so the
 * manual EXIF pass is the single source of truth for orientation — and it
 * decodes straight into the capped size (L28) so big phone photos never occupy
 * full-resolution memory. The fallback paths (an encoding `createImageBitmap`
 * rejects, or a browser that ignores `imageOrientation`) use the browser's
 * default decode, which auto-rotates per EXIF — reported via `rotated` so the
 * caller can skip the manual pass.
 */
async function decodeRaw(
  blob: Blob,
  resize?: { resizeWidth: number; resizeHeight: number },
): Promise<DecodedSource> {
  try {
    return {
      src: await createImageBitmap(blob, {
        imageOrientation: 'none',
        resizeWidth: resize?.resizeWidth,
        resizeHeight: resize?.resizeHeight,
        resizeQuality: 'high',
      }),
      rotated: false,
    };
  } catch {
    try {
      return { src: await createImageBitmap(blob), rotated: true };
    } catch {
      return { src: await loadViaImg(blob), rotated: true };
    }
  }
}

function loadViaImg(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image'));
    };
    img.src = url;
  });
}

/** Read a local image file, apply EXIF orientation, composite alpha onto white. */
export async function imageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  try {
    // EXIF read must never sink a valid image: if it fails, treat as upright.
    const { default: exifr } = await import('exifr'); // lazy — keeps exifr out of the eager bundle
    const orientation = await exifr.orientation(file).catch(() => undefined);
    const size = await imageDimensions(file);
    // Decode straight into the capped size (L28) so a 12MP photo never occupies
    // full-resolution memory on a low-end phone.
    const decoded = await decodeRaw(file, resizeDims(size));
    // Skip the manual EXIF transform when the browser already auto-rotated the
    // pixels during a fallback decode — applying it again double-rotates.
    return orientAndComposite(decoded.src, decoded.rotated ? undefined : orientation);
  } catch (e) {
    throw new Error(`Could not read image "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Accept a file as photo/video input — including .heic/.heif and other camera
 *  files whose MIME type is empty on some platforms (L6: they were silently
 *  skipped before the friendly HEIC error path could fire). */
function isMediaFile(f: File): boolean {
  return (
    f.type.startsWith('image/') ||
    f.type.startsWith('video/') ||
    isHeic(f) ||
    /\.(png|jpe?g|gif|webp|avif|bmp|mp4|webm|mov|ogg|ogv)$/i.test(f.name)
  );
}

/** True when a file should route to the VIDEO pipeline (extension fallback covers empty-MIME files). */
export function isVideoFile(f: File): boolean {
  return f.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|ogv)$/i.test(f.name);
}

/** Paste handler scoped to `el` (pass the app root for app-wide coverage): reads the first image/video item. */
export function setupPaste(el: HTMLElement, onFile: (file: File) => void): void {
  el.addEventListener('paste', (ev: ClipboardEvent) => {
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (!file || !isMediaFile(file)) continue;
      ev.preventDefault();
      onFile(file);
      break;
    }
  });
}

/** Drag-and-drop zone: visual 'dragover' class + first dropped image/video file. */
export function setupDropZone(el: HTMLElement, onFile: (file: File) => void): void {
  let depth = 0; // counts nested dragenter/dragleave so the class doesn't flicker over children

  el.addEventListener('dragenter', (ev: DragEvent) => {
    ev.preventDefault();
    depth++;
    el.classList.add('dragover');
  });

  el.addEventListener('dragover', (ev: DragEvent) => {
    ev.preventDefault(); // required to signal that dropping is allowed
  });

  el.addEventListener('dragleave', () => {
    depth--;
    if (depth <= 0) {
      depth = 0;
      el.classList.remove('dragover');
    }
  });

  el.addEventListener('drop', (ev: DragEvent) => {
    ev.preventDefault();
    depth = 0;
    el.classList.remove('dragover');
    const files = ev.dataTransfer?.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!isMediaFile(file)) continue;
      onFile(file);
      break;
    }
  });
}
