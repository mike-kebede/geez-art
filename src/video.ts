// Video → fidel mosaic: runs a <video> through the mosaic renderer frame by
// frame at a throttled rate (so the filter stays smooth without melting the
// CPU), and can record the animated output canvas to WebM.

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

/**
 * Record the animated canvas to a video blob via MediaRecorder.
 * Prefers WebM where supported; otherwise falls back to the platform default
 * (MP4 on iOS/Safari). The canvas must be animating (e.g. the mosaic output
 * during playback).
 */
export async function recordCanvas(
  canvas: HTMLCanvasElement,
  seconds = 4,
  fps = 12,
): Promise<{ blob: Blob | null; ext: 'webm' | 'mp4' }> {
  try {
    const stream = canvas.captureStream(fps);
    const mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
    const ext: 'webm' | 'mp4' = mime === 'video/webm' ? 'webm' : 'mp4';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const done = new Promise<Blob | null>((resolve) => {
      rec.onstop = () =>
        resolve(chunks.length ? new Blob(chunks, { type: ext === 'webm' ? 'video/webm' : 'video/mp4' }) : null);
    });
    rec.start(250);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    rec.stop();
    return { blob: await done, ext };
  } catch {
    return { blob: null, ext: 'mp4' };
  }
}
