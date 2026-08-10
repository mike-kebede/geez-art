// Video → fidel mosaic frame loop + recording/export helpers.

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface VideoHandle {
  stop(): void;
  /** Returns the new paused state. */
  togglePlay(): boolean;
}

/**
 * Start the frame loop: draw each video frame to a hidden canvas and hand it
 * to `onFrame` at roughly `fps` frames per second.
 */
export function startVideoLoop(
  video: HTMLVideoElement,
  onFrame: (c: HTMLCanvasElement) => void,
  fps = 12,
): VideoHandle {
  const srcCanvas = document.createElement('canvas');
  let raf = 0;
  let last = 0;
  let paused = false;

  function tick(t: number): void {
    if (!paused && t - last >= 1000 / fps) {
      last = t;
      if (video.videoWidth > 0) {
        srcCanvas.width = video.videoWidth;
        srcCanvas.height = video.videoHeight;
        srcCanvas.getContext('2d')!.drawImage(video, 0, 0);
        onFrame(srcCanvas);
      }
    }
    raf = requestAnimationFrame(tick);
  }

  void video.play().catch(() => {});
  raf = requestAnimationFrame(tick);

  return {
    stop() {
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
  };
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
  try {
    const videoTracks = canvas.captureStream(fps).getVideoTracks();
    const audioTracks = audio ? audio.getAudioTracks() : [];
    const stream = new MediaStream([...videoTracks, ...audioTracks]);
    const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
    const ext: 'webm' | 'mp4' = mime === 'video/webm' ? 'webm' : 'mp4';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const done = new Promise<Blob | null>((resolve) => {
      rec.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: mime || 'video/mp4' }) : null);
    });
    rec.start(250);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    rec.stop();
    return { blob: await done, ext };
  } catch {
    return { blob: null, ext: 'mp4' };
  }
}

/**
 * Record the animated canvas to an animated GIF — downscaled to ≤480px wide so
 * the file stays shareable on WhatsApp/Telegram/Instagram.
 */
export async function recordGIF(canvas: HTMLCanvasElement, seconds = 3, fps = 8): Promise<Uint8Array | null> {
  try {
    const gif = GIFEncoder();
    const scale = Math.min(1, 480 / Math.max(1, canvas.width));
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
