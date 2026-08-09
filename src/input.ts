// Image input: File / URL / clipboard-paste / drag-drop → opaque, EXIF-corrected canvas.
//
// EXIF orientation is read from the raw bytes with exifr, while the pixels are
// decoded with `imageOrientation: 'none'` so the browser never auto-rotates.
// We then draw the raw pixels through a manual orientation transform. That is
// deterministic — no reliance on a browser's inconsistent auto-rotate behavior,
// so there is no risk of the double-rotation quirk iOS Safari 13.4+ / Chrome 81+
// are known for. Transparency is composited onto white so the mosaic renderer
// always receives an opaque source.

import exifr from 'exifr';

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

/** Draw raw pixels onto a white canvas at natural resolution, EXIF-oriented. */
function orientAndComposite(src: ImageBitmap, orientation: number | undefined): HTMLCanvasElement {
  const o = orientation ?? 1;
  const w = src.width;
  const h = src.height;
  const swapped = o >= 5 && o <= 8; // 90°/270° orientations exchange width and height
  const canvas = document.createElement('canvas');
  canvas.width = swapped ? h : w;
  canvas.height = swapped ? w : h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height); // composite alpha onto white
  applyOrientation(ctx, o, w, h);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

/**
 * Decode an image blob WITHOUT browser auto-rotation, so the manual EXIF pass
 * is the single source of truth for orientation.
 */
async function decodeRaw(blob: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(blob, { imageOrientation: 'none' });
  } catch {
    // Browsers without `imageOrientation` support are old enough that they also
    // don't auto-rotate canvas draws, so the manual orientation pass stays correct.
    return createImageBitmap(blob);
  }
}

/** Read a local image file, apply EXIF orientation, composite alpha onto white. */
export async function imageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  try {
    const [orientation, bitmap] = await Promise.all([exifr.orientation(file), decodeRaw(file)]);
    return orientAndComposite(bitmap, orientation);
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

/** Paste handler scoped to `el` (pass the app root for app-wide coverage): reads the first image item. */
export function setupPaste(el: HTMLElement, onImage: (c: HTMLCanvasElement) => void): void {
  el.addEventListener('paste', (ev: ClipboardEvent) => {
    const items = ev.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (!file || !file.type.startsWith('image/')) continue;
      ev.preventDefault();
      imageFileToCanvas(file)
        .then(onImage)
        .catch((e: unknown) => console.error('Paste failed:', e));
      break;
    }
  });
}

/** Drag-and-drop zone: visual 'dragover' class + first dropped image file. */
export function setupDropZone(el: HTMLElement, onImage: (c: HTMLCanvasElement) => void): void {
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
      if (!file.type.startsWith('image/')) continue;
      imageFileToCanvas(file)
        .then(onImage)
        .catch((e: unknown) => console.error('Drop failed:', e));
      break;
    }
  });
}
