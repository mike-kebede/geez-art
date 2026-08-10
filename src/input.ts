// Image input: File / URL / clipboard-paste / drag-drop → opaque, EXIF-corrected canvas.
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

export interface SourceImage {
  canvas: HTMLCanvasElement;
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
  const MAX_EDGE = 1600;
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
  const ctx = canvas.getContext('2d');
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
 * manual EXIF pass is the single source of truth for orientation. The fallback
 * paths (an encoding `createImageBitmap` rejects, or a browser that ignores
 * `imageOrientation`) use the browser's default decode, which auto-rotates per
 * EXIF — reported via `rotated` so the caller can skip the manual pass.
 */
async function decodeRaw(blob: Blob): Promise<DecodedSource> {
  try {
    return { src: await createImageBitmap(blob, { imageOrientation: 'none' }), rotated: false };
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
    const [orientation, decoded] = await Promise.all([
      exifr.orientation(file).catch(() => undefined),
      decodeRaw(file),
    ]);
    // Skip the manual EXIF transform when the browser already auto-rotated the
    // pixels during a fallback decode — applying it again double-rotates.
    return orientAndComposite(decoded.src, decoded.rotated ? undefined : orientation);
  } catch (e) {
    throw new Error(`Could not read image "${file.name}": ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Load a bundled/demo image from a URL and run it through the same pipeline. */
export async function imageURLToCanvas(url: string): Promise<HTMLCanvasElement> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image "${url}": HTTP ${resp.status}`);
  const blob = await resp.blob();
  const name = url.split('/').pop() ?? 'image';
  return imageFileToCanvas(new File([blob], name, { type: blob.type }));
}

/** Paste handler scoped to `el` (pass the app root for app-wide coverage): reads the first image/video item. */
export function setupPaste(el: HTMLElement, onFile: (file: File) => void): void {
  el.addEventListener('paste', (ev: ClipboardEvent) => {
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (!file || !(file.type.startsWith('image/') || file.type.startsWith('video/'))) continue;
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
      if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) continue;
      onFile(file);
      break;
    }
  });
}
