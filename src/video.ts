// Video → fidel mosaic frame loop + recording/export helpers.

/// <reference types="vite/client" />

import { VIDEO_FRAME_EDGE } from './limits';


export interface VideoHandle {
  stop(): void;
  /** Returns the new paused state. */
  togglePlay(): boolean;
  /** Current effective frame interval (ms) — the loop backs off on slow devices. */
  getFrameMs(): number;
}

/**
 * Start the frame loop: draw each video frame to a hidden canvas and hand it
 * to `onFrame` at roughly `fps` frames per second.
 *
 * Two safeguards for low-end devices and pathological sources:
 * - Adaptive framerate: if a frame consistently takes most of its budget, the
 *   interval backs off toward a ~6fps floor so the tab doesn't jam up.
 * - Error recovery: a throw inside onFrame no longer silently kills the loop —
 *   the loop stops, the video pauses, and `onError` is called.
 */
export function startVideoLoop(
  video: HTMLVideoElement,
  onFrame: (c: HTMLCanvasElement) => void,
  fps = 12,
  onError?: (e: unknown) => void,
): VideoHandle {
  const srcCanvas = document.createElement('canvas');
  // F5: the renderer reads every frame back via getImageData — flag for CPU reads.
  void srcCanvas.getContext('2d', { willReadFrequently: true });
  let raf = 0;
  let last = 0;
  let paused = false;
  let stopped = false;
  let frameMs = 1000 / fps;
  const MIN_FRAME_MS = 1000 / 6;
  let slowFrames = 0;

  function fail(e: unknown): void {
    stopped = true;
    cancelAnimationFrame(raf);
    video.pause();
    onError?.(e);
  }

  function tick(t: number): void {
    if (stopped) return;
    if (!paused && t - last >= frameMs) {
      last = t;
      if (video.videoWidth > 0) {
        const t0 = performance.now();
        try {
          // Downscale the frame: cap the long edge so low-end phones don't
          // sample full 1080p/4K pixels every tick.
          // F6: cap the frame at the grid's needs (~512px), not the 1600px photo cap —
          // cuts the per-frame getImageData readback ~10× on low-end CPUs.
          const scale = Math.min(1, VIDEO_FRAME_EDGE / Math.max(video.videoWidth, video.videoHeight));
          const capW = Math.max(1, Math.round(video.videoWidth * scale));
          const capH = Math.max(1, Math.round(video.videoHeight * scale));
          // Only resize when the dimensions actually change, so the canvas isn't
          // cleared/reallocated on every frame.
          if (srcCanvas.width !== capW) srcCanvas.width = capW;
          if (srcCanvas.height !== capH) srcCanvas.height = capH;
          srcCanvas.getContext('2d')!.drawImage(video, 0, 0, capW, capH);
          onFrame(srcCanvas);
        } catch (e) {
          fail(e);
          return;
        }
        const cost = performance.now() - t0;
        if (cost > frameMs * 0.8 && frameMs < MIN_FRAME_MS) {
          if (++slowFrames >= 3) {
            frameMs = Math.min(frameMs * 1.5, MIN_FRAME_MS);
            slowFrames = 0;
          }
        } else if (cost <= frameMs * 0.5) {
          slowFrames = 0; // healthy frames — don't drift further
        }
      }
    }
    raf = requestAnimationFrame(tick);
  }

  void video.play().catch(() => {
    // L1: in-app browsers (WhatsApp/Instagram) reject unmuted autoplay — fall
    // back to muted so the filter at least animates.
    video.muted = true;
    void video.play().catch(() => {});
  });
  raf = requestAnimationFrame(tick);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
    togglePlay() {
      paused = !paused;
      if (paused) video.pause();
      else void video.play().catch(() => {});
      return paused;
    },
    getFrameMs: () => frameMs,
  };
}

/**
 * Can this browser record the animated canvas to a video file? iOS Safari lacks
 * `canvas.captureStream()`, so WebM/MP4 export is unavailable there — the GIF
 * export (pure JS via gifenc) works on every device.
 */
export function canRecordVideo(): boolean {
  // e2e seam: force the unsupported path so the fallback UI is exercised.
  if (import.meta.env.DEV && (window as unknown as { __forceNoVideoCapture?: boolean }).__forceNoVideoCapture) {
    return false;
  }
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream === 'function'
  );
}

export interface RecordResult {
  blob: Blob | null;
  ext: 'webm' | 'mp4';
}

/**
 * Record the animated canvas to a WebM (Chromium) or MP4 (Safari) blob via
 * MediaRecorder. Optionally mix in an audio stream (e.g. the source video's
 * audio track) so the converted clip isn't silent.
 */
export async function recordCanvas(
  canvas: HTMLCanvasElement,
  seconds = 4,
  fps = 12,
  audio: MediaStream | null = null,
): Promise<RecordResult> {
  // #2: stop ONLY the video tracks this function creates — the audio track is
  // the caller's SHARED MediaStreamDestination; stopping it kills every later export.
  let videoTracks: MediaStreamTrack[] = [];
  try {
    videoTracks = canvas.captureStream(fps).getVideoTracks();
    const audioTracks = audio ? audio.getAudioTracks() : [];
    const stream = new MediaStream([...videoTracks, ...audioTracks]);
    // M4: prefer MP4/H.264 so iPhone WhatsApp users can play the clip — WebM is
    // not previewable in-chat on iOS. Fall back to WebM only when MP4 is unsupported.
    const mime = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';
    // Bound quality/size so encoding stays real-time on budget phones instead of
    // dropping frames on a large canvas (M10). The bitrate cap applies on the
    // mp4 path too, not just WebM.
    const rec = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: 2_500_000 });
    // F27: the extension/type must match what the recorder ACTUALLY produced.
    // When both mime types are unsupported, `mime` is '' and MediaRecorder falls
    // back to its container default (WebM on Chromium) — the ternary above would
    // have named a '.mp4' holding WebM bytes.
    const actual = rec.mimeType || mime;
    const ext: 'webm' | 'mp4' = /webm/i.test(actual) ? 'webm' : 'mp4';
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const done = new Promise<Blob | null>((resolve, reject) => {
      rec.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: actual || 'video/mp4' }) : null);
      // M1: a recorder error must reject — never hang the caller (and strand
      // the export buttons in the caller's finally).
      rec.onerror = () => reject(new Error('MediaRecorder error'));
    });
    rec.start(250);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    rec.stop();
    // M1: never await `done` forever — a stalled recorder resolves to null.
    const guard = new Promise<Blob | null>((resolve) => setTimeout(() => resolve(null), 5000));
    return { blob: await Promise.race([done, guard]), ext };
  } catch {
    return { blob: null, ext: 'mp4' };
  } finally {
    // M15: never leak the captureStream's video tracks.
    for (const t of videoTracks) t.stop();
  }
}

/**
 * Record the animated canvas to an animated GIF — downscaled to ≤480px wide so
 * the file stays shareable on WhatsApp/Telegram/Instagram.
 */
export async function recordGIF(canvas: HTMLCanvasElement, seconds = 3, fps = 8): Promise<Uint8Array | null> {
  try {
    // gifenc is click-gated, so import it only when GIF export is actually used
    // — keeps its weight out of the eager main bundle (L35).
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const gif = GIFEncoder();
    // Cap the LONG edge at 480px (width-only let tall portraits through at 480×852).
    const scale = Math.min(1, 480 / Math.max(1, canvas.width, canvas.height));
    const w = Math.max(1, Math.round(canvas.width * scale));
    const h = Math.max(1, Math.round(canvas.height * scale));
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d', { willReadFrequently: true })!;
    const delay = 1000 / fps;
    const frames = Math.max(1, Math.round(seconds * fps));
    for (let i = 0; i < frames; i++) {
      tctx.drawImage(canvas, 0, 0, w, h);
      const data = tctx.getImageData(0, 0, w, h).data;
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, w, h, { palette, delay });
      await new Promise((r) => setTimeout(r, delay));
    }
    gif.finish();
    return gif.bytes();
  } catch {
    return null;
  }
}
