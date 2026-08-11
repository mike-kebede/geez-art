// geez-art app bootstrap + wiring.
// Algorithmic, client-side, zero backend. Ethiopian classical-art design layer
// via src/palette.ts.

/// <reference types="vite/client" />

import '@fontsource-variable/noto-sans-ethiopic';
import '@fontsource-variable/inter';
import { loadEthiopicFont, buildRamp, getAllGlyphs, rampFromGlyphs, COMMON_AMHARIC, type GlyphInfo, type RampPreset } from './fonts';
import ethiopicWoffUrl from '@fontsource-variable/noto-sans-ethiopic/files/noto-sans-ethiopic-ethiopic-wght-normal.woff2';
import { renderMosaic, invalidateSource, type DitherMode } from './render';
import { imageFileToCanvas, setupPaste, setupDropZone, isHeic, isVideoFile } from './input';
import { downloadCanvasPNG, gridToText, selfContainedHTML, makeShareImage, shareCanvas, downscaleCanvas, paintBrandedCapture, triggerDownload } from './export';
import { RENDER_DEBOUNCE_MS, MAX_FILE_BYTES } from './limits';
import { PALETTES, DEFAULT_PALETTE, cssVars, type ArtPalette } from './palette';
import { getSamples } from './samples';
import { startVideoLoop, recordCanvas, recordGIF, canRecordVideo, type VideoHandle } from './video';
import { initAnalytics, trackEvent, analyticsEnabled } from './analytics';
import { setLang, getLang, t, type Lang, type I18nKey } from './i18n';

let ramp: GlyphInfo[] = [];
let source: HTMLCanvasElement | null = null;
let mosaicCanvas: HTMLCanvasElement | null = null;
let currentPalette: ArtPalette = DEFAULT_PALETTE;
let renderTimer: number | undefined;
let allGlyphs: GlyphInfo[] = [];
let selectedCps = new Set<number>();
let firstRenderDone = false;
/** H1: video mode throttles the per-frame stat/aria updates to ~1×/s. */
let lastStatUpdate = 0;
let videoHandle: VideoHandle | null = null;
let videoEl: HTMLVideoElement | null = null;
let lastResult: ReturnType<typeof renderMosaic> | null = null;
let zoom = 1;
let customTouched = false;
/** Track the currently-shown replay object URL so a new one replaces (revokes) the old. */
let replayUrl: string | null = null;
/** The source-video object URL, stored so it can be revoked by the STRING — not by
 *  reading videoEl.src after the video element has been torn down (M1: that read
 *  returns '' after removeAttribute('src'), making the revoke a silent no-op). */
let videoUrl: string | null = null;

/** Which guidance the empty state is showing — re-applied on language toggle. */
let emptyMode: 'default' | 'pick' = 'default';
/** Whether the video filter is paused — drives the Play/Pause label on toggle. */
let videoPaused = false;
/** F2: bumps each video load so a superseded metadata-wait can't orphan a loop. */
let videoGen = 0;
/** F2(b): bumps when the app is torn down so an in-flight recording is cancelled. */
let recordGen = 0;

/**
 * The URL stamped onto shared images + share text (M14). Derived from the live
 * origin so a custom-domain change propagates automatically to the band and
 * share text instead of silently breaking the referral loop; falls back to the
 * Cloudflare default in dev/file contexts. Keeps the scheme (https://) so
 * WhatsApp/Telegram auto-linkify it.
 */
const SITE_URL: string = (() => {
  const origin = window.location.origin;
  if (origin && origin.startsWith('http') && !origin.includes('localhost')) return origin;
  return 'https://geez-art.pages.dev';
})();

/** The share-sheet TEXT link carries a fresh per-share referral token (F10);
 *  the visible image band stays BARE (typable, no query friction — F21). Each
 *  share mints its own ?ref=share-XXXX so the funnel can be bucketed per share.
 */
function shareLink(): string {
  return `${SITE_URL}?ref=share-${Math.random().toString(36).slice(2, 8)}`;
}

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

/** M3: preload the 198KB Ethiopic woff2 as early as possible so the hero ፊደል
 *  and Amharic lines don't flash as tofu on iOS/macOS (no system Ethiopic font)
 *  during the cold viral visit. Runs before the font/ramp awaits in init. */
function preloadEthiopicFont(): void {
  if (document.querySelector('link[rel="preload"][as="font"]')) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = ethiopicWoffUrl;
  document.head.appendChild(link);
}

/** Reset everything and restore the idle empty state (also the "Clear" handler). */
function clearAll(): void {
  recordGen++; // F2(b): any Clear invalidates an in-flight recording
  clearReplay(); // a stale replay panel would keep playing across Clear (M15)
  stopVideo();
  source = null;
  zoom = 1;
  applyZoom();
  const chip = $('sourceChip');
  if (chip) chip.classList.remove('visible');
  const empty = $('emptyHint');
  if (empty) empty.style.display = '';
  const out = $('mosaic') as HTMLCanvasElement;
  out.width = 0;
  out.height = 0;
  delete out.dataset.distinct;
  out.setAttribute('aria-label', t('mosaicAriaEmpty')); // L22: no stale render label
  $('mosaicStat').textContent = '';
  mosaicCanvas = null;
  lastResult = null;
  setEmpty('default');
  $('clearBtn').hidden = true;
  const sh = document.getElementById('shareHint');
  if (sh) sh.hidden = true;
  const zc = document.getElementById('zoomControls');
  if (zc) zc.hidden = true;
  firstRenderDone = false;
  updateShareState();
}

function setSource(c: HTMLCanvasElement): void {
  clearAll();
  source = c;
  const empty = $('emptyHint');
  if (empty) empty.style.display = 'none';
  const chip = $('sourceChip');
  if (chip) chip.classList.add('visible');
  const srcEl = $('source') as HTMLCanvasElement;
  srcEl.width = c.width;
  srcEl.height = c.height;
  srcEl.getContext('2d')!.drawImage(c, 0, 0);
  $('clearBtn').hidden = false;
  queueRender();
}

function readRenderOpts(): { cols: number; contrast: number; invert: boolean; colorize: boolean; dither: DitherMode; edge: number } {
  return {
    // F3: the renderer is synchronous — clamp columns during video playback so
    // a 400-col frame can't freeze a low-end device.
    cols: Math.min(videoHandle ? 140 : 400, parseInt(($('width') as HTMLInputElement).value, 10)),
    contrast: 1 + parseInt(($('contrast') as HTMLInputElement).value, 10) / 100,
    edge: parseInt(($('edge') as HTMLInputElement).value, 10) / 100,
    invert: ($('invert') as HTMLInputElement).checked,
    colorize: ($('colorize') as HTMLInputElement).checked,
    dither: ($('dither') as HTMLSelectElement).value as DitherMode,
  };
}

function render(): void {
  if (source) renderSource(source, true);
  // Clear the M8 busy cue once the synchronous render has run.
  if ($('status').textContent === t('rendering')) $('status').textContent = t('ready');
}

/** Run one source image (photo frame or video frame) through the mosaic renderer. */
function renderSource(src: HTMLCanvasElement, fade = false): void {
  if (ramp.length === 0) return;
  const opts = readRenderOpts();
  const res = renderMosaic(src, ramp, {
    ...opts,
    paper: currentPalette.paper,
    ink: currentPalette.ink,
  });
  lastResult = res;
  const out = $('mosaic') as HTMLCanvasElement;
  out.width = res.canvas.width;
  out.height = res.canvas.height;
  out.getContext('2d')!.drawImage(res.canvas, 0, 0);
  mosaicCanvas = res.canvas;
  updateShareState();
  const firstRender = !firstRenderDone;
  if (!firstRenderDone) {
    firstRenderDone = true;
    const top = document.getElementById('shareTop');
    if (top) top.classList.add('pulse');
    const zc = document.getElementById('zoomControls');
    if (zc) zc.hidden = false;
    const sh = document.getElementById('shareHint');
    if (sh) sh.hidden = false;
  }
  if (fade) {
    out.style.opacity = '0';
    requestAnimationFrame(() => {
      out.style.opacity = '1';
    });
    // Announce on a fresh source render (not every slider tweak) so screen
    // readers get a live-region "ready" cue via the role=status line.
    if (firstRender) flash(t('pictureReady'));
  }
  // In video mode the stat/aria/distinct work is recomputed every frame; throttle
  // it to ~1×/s so 12fps playback doesn't churn DOM layout on low-end devices (H1).
  // Still photos (slider changes) always update immediately.
  const isVideoMode = videoHandle !== null;
  const now = performance.now();
  if (!isVideoMode || now - lastStatUpdate > 1000) {
    lastStatUpdate = now;
    const distinct = new Set<string>();
    for (const row of res.chars) for (const ch of row) distinct.add(ch);
    out.dataset.distinct = String(distinct.size);
    // Expose ramp + usage stats for diagnostics and tests (dev only — never shipped).
    if (import.meta.env.DEV) {
      (window as unknown as { __ramp?: unknown; __lastChars?: string[] }).__ramp = ramp;
      (window as unknown as { __lastChars?: string[] }).__lastChars = Array.from(distinct);
    }
    const stat = $('mosaicStat');
    stat.textContent = `${t('statPrefix')} ${(res.cols * res.rows).toLocaleString()} ${t('letters')} · ${t(('palette_' + currentPalette.id) as I18nKey)}`;
    // Readable sample of the actual fidel grid so the canvas isn't a silent
    // picture to screen-reader users.
    const sample = res.chars.map((row) => row.join('')).join('').slice(0, 200);
    out.setAttribute('aria-label', `${t('mosaicAriaStart')} ${res.cols} × ${res.rows}, ${distinct.size} ${t('mosaicAriaDistinct')} ${t(('palette_' + currentPalette.id) as I18nKey)}. ${t('mosaicAriaSample')} ${sample}`);
  }
  $('clearBtn').hidden = false;
}

function queueRender(): void {
  if (renderTimer) window.clearTimeout(renderTimer);
  // Busy cue (M8): show work in progress during the debounce window so a
  // multi-second synchronous render doesn't look frozen. render() restores
  // the idle status when it finishes.
  // I6: don't clobber an active flash message with the busy cue.
  if (flashTimer === undefined && $('status').textContent !== t('rendering')) $('status').textContent = t('rendering');
  renderTimer = window.setTimeout(render, RENDER_DEBOUNCE_MS); // debounce sliders
}

function applyPalette(p: ArtPalette): void {
  currentPalette = p;
  // The palette recolors the framed artifact (canvas paper/ink + frame accent),
  // not the dark gallery chrome around it.
  const frame = $('frame');
  const vars = cssVars(p);
  for (const [k, v] of Object.entries(vars)) frame.style.setProperty(k, v);
  queueRender();
}

function currentResult(): ReturnType<typeof renderMosaic> | null {
  return lastResult;
}

function copyText(): void {
  const res = currentResult();
  if (!res) return;
  const text = gridToText(res.chars);
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).then(
      () => flash(t('copied')),
      () => fallbackCopy(text),
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    flash(t('copied'));
  } catch {
    flash(t('copyFailed'));
  }
  document.body.removeChild(ta);
}

async function downloadHTML(): Promise<void> {
  const res = currentResult();
  if (!res) return;
  // Self-contained: embeds the Ethiopic font so the exported file renders on
  // macOS/iOS (which have no system Ethiopic font).
  const html = await selfContainedHTML(res.chars, { ink: currentPalette.ink, paper: currentPalette.paper });
  downloadTextFile('geez-art.html', html, 'text/html;charset=utf-8');
}

function downloadTextFile(name: string, text: string, type: string): void {
  triggerDownload(new Blob([text], { type }), name);
}

let flashTimer: number | undefined;
function flash(msg: string, ms = 1500): void {
  const status = $('status');
  // Only the LATEST message owns the status line — a stale "Ready" timer from a
  // longer flash (e.g. the 5s HEIC notice) must not clobber a newer message (M18).
  if (flashTimer !== undefined) window.clearTimeout(flashTimer);
  status.textContent = msg;
  flashTimer = window.setTimeout(() => {
    flashTimer = undefined;
    status.textContent = t('ready');
  }, ms);
}

/** Hide + tear down the in-app replay: pause, and revoke its blob URL (M15).
 *  Pass the closing control so focus returns to it (L24, WCAG 2.4.3). */
function clearReplay(returnFocusTo?: HTMLElement | null): void {
  const panel = document.getElementById('replay');
  const vid = document.getElementById('replayVideo') as HTMLVideoElement | null;
  if (panel) panel.hidden = true;
  if (vid) vid.pause();
  if (replayUrl) {
    URL.revokeObjectURL(replayUrl);
    replayUrl = null;
  }
  // #5: focus() on a just-hidden element is a no-op — defer one frame so the
  // panel is display:none when focus lands on the (still-live) Close button.
  if (returnFocusTo) requestAnimationFrame(() => returnFocusTo.focus());
}

/** The viral action — branded PNG with the site URL, via native share sheet or download. */
async function doShare(): Promise<void> {
  if (!mosaicCanvas) return;
  trackEvent('share_started');
  // L10: downscale + brand + toBlob is ~300–500ms of silent async work — show
  // progress and disable the CTA so the tap doesn't feel dead.
  const shareBtns: HTMLButtonElement[] = [];
  for (const id of ['share', 'shareTop']) {
    const b = document.getElementById(id) as HTMLButtonElement | null;
    if (b) shareBtns.push(b);
  }
  for (const b of shareBtns) b.disabled = true;
  flash(t('preparingShare'), 3000);
  try {
    // M1: downscale the mosaic FIRST, then stamp the band at final resolution —
    // stamping on the full-res canvas and shrinking the whole thing crushed the
    // URL band to ~4px after messenger recompression. The band must be legible:
    // it is the entire viral CTA.
    const compact = downscaleCanvas(mosaicCanvas, 1600);
    // F21: the visible image band shows the BARE domain (no ?ref — typable, no
    // query friction); the referral token rides the share-sheet TEXT link, which
    // is tapped, not typed.
    const branded = makeShareImage(compact, SITE_URL);
    const result = await shareCanvas(branded, `${t('shareText')} ${shareLink()}`);
    // M6: track the OUTCOME so the viral loop's K-factor is observable (only
    // fires when a provider is configured — otherwise a no-op).
    trackEvent(result === 'shared' ? 'share_success' : result === 'cancelled' ? 'share_cancelled' : 'share_downloaded');
    // L7: a dismissed share sheet is not a "Saved" success.
    if (result === 'shared') flash(t('shared'));
    else if (result === 'cancelled') flash(t('shareCancelled'));
    else flash(t('saved'));
  } finally {
    for (const b of shareBtns) b.disabled = false;
  }
}

/** Keep every Share control honest: disabled until a mosaic exists. */
function updateShareState(): void {
  const ready = mosaicCanvas !== null;
  for (const id of ['share', 'shareTop']) {
    const b = document.getElementById(id);
    if (b) (b as HTMLButtonElement).disabled = !ready;
  }
}

/** Swap the idle frame's guidance (choose-a-photo vs pick-letters), in the
 *  CURRENT language — the whole UI is single-language via the toggle. */
function setEmpty(mode: 'default' | 'pick'): void {
  emptyMode = mode;
  const tEl = document.getElementById('emptyTitle');
  const sEl = document.getElementById('emptySub');
  if (tEl) tEl.textContent = t(mode === 'pick' ? 'pickerTitle' : 'emptyTitle');
  if (sEl) sEl.textContent = t(mode === 'pick' ? 'pickerSub' : 'emptySub');
}

/** Re-render every [data-i18n] element for the active language (language toggle). */
function applyLang(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key as I18nKey);
  }
  // F6: ARIA names/titles follow the language too, so AT users don't hear
  // English labels with an Amharic voice.
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    const key = el.dataset.i18nAria;
    if (key) el.setAttribute('aria-label', t(key as I18nKey));
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const key = el.dataset.i18nTitle;
    if (key) el.setAttribute('title', t(key as I18nKey));
  }
  setEmpty(emptyMode);
  applyZoom(); // #4: zoom-pan aria follows the language
  updatePickerUI(); // #4: picker tile/letter titles follow the language
  // F8: palette option names follow the language too.
  const palSel = document.getElementById('palette') as HTMLSelectElement | null;
  if (palSel) {
    for (const opt of palSel.options) {
      opt.textContent = t(('palette_' + opt.value) as I18nKey);
    }
  }
  // F6: re-render the dynamic mosaic aria-label in the new language.
  if (lastResult) {
    const out = $('mosaic') as HTMLCanvasElement;
    const distinct = new Set<string>();
    for (const row of lastResult.chars) for (const ch of row) distinct.add(ch);
    const sample = lastResult.chars.map((r) => r.join('')).join('').slice(0, 200);
    out.setAttribute('aria-label', `${t('mosaicAriaStart')} ${lastResult.cols} × ${lastResult.rows}, ${distinct.size} ${t('mosaicAriaDistinct')} ${t(('palette_' + currentPalette.id) as I18nKey)}. ${t('mosaicAriaSample')} ${sample}`);
  }
  const status = $('status');
  if (status.textContent === 'Ready' || status.textContent === 'ዝግጁ') status.textContent = t('ready');
  const pb = $('playBtn') as HTMLButtonElement;
  if (!pb.hidden) pb.textContent = videoPaused ? t('play') : t('pause');
  // F24: the language re-render wipes the analytics disclosure — re-append it.
  if (analyticsEnabled()) {
    const body = document.getElementById('privacyBody');
    if (body && !body.textContent.endsWith(t('analyticsDisclosure'))) body.textContent += ' ' + t('analyticsDisclosure');
  }
}

/** Apply the mosaic zoom (CSS scale via width) so letters can be seen up close. */
function applyZoom(): void {
  const c = document.getElementById('mosaic') as HTMLCanvasElement | null;
  if (c) c.style.width = `${100 * zoom}%`;
  const v = document.getElementById('zoomVal');
  if (v) v.textContent = `${Math.round(zoom * 100)}%`;
  // M16 (WCAG 2.1.1): at zoom > 100% the artwork overflows .zoom-wrap; make it
  // focusable so keyboard users can pan it with the arrow keys.
  const zw = document.querySelector<HTMLElement>('.zoom-wrap');
  if (zw) {
    if (zoom > 1) {
      zw.setAttribute('tabindex', '0');
      zw.setAttribute('role', 'region');
      zw.setAttribute('aria-label', t('zoomPanAria'));
    } else {
      zw.removeAttribute('tabindex');
      zw.removeAttribute('role');
      zw.removeAttribute('aria-label');
    }
  }
}

/* ---------- video (the fidel filter) ---------- */

/** Route a picked file to photo or video mode. */
function handlePickedFile(file: File): void {
  // L7: guard BEFORE createObjectURL — a multi-GB file would pin memory and hang
  // the tab for no gain (nothing is uploaded, but it's still wasted work).
  if (file.size > MAX_FILE_BYTES) {
    flash(t('tooLarge'), 5000);
    return;
  }
  if (isVideoFile(file)) {
    void handleVideoFile(file).catch(() => flash(t('videoReadFailed')));
  } else {
    stopVideo();
    void imageFileToCanvas(file)
      .then((c) => {
        setSource(c);
        trackEvent('source', { kind: 'image' });
      })
      .catch(() => {
        // HEIC is decodable on iPhone but not most other devices — say so
        // plainly instead of a generic "couldn't read that picture".
        flash(isHeic(file) ? t('heicFailed') : t('pictureFailed'), isHeic(file) ? 5000 : 1500);
      });
  }
}

/** Load a video, then run it through the mosaic filter live. */
async function handleVideoFile(file: File): Promise<void> {
  clearAll();
  const gen = ++videoGen; // F2: supersede any earlier in-flight video load
  const url = URL.createObjectURL(file);
  videoUrl = url; // M1: revoke by this stored string, never videoEl.src
  const v = document.createElement('video');
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'metadata';
  v.src = url;
  // A stalled/blocked file must not hang the UI forever after clearAll() already
  // tore the page back to the empty state — give metadata 15s, then bail.
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('timed out waiting for the video to load')), 15000);
      v.addEventListener('loadedmetadata', () => {
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
      v.addEventListener('error', () => {
        window.clearTimeout(timer);
        reject(new Error('video failed to load'));
      }, { once: true });
    });
  } catch (e) {
    // F1: if a newer action superseded this load, revoke quietly and let the
    // fresh state stand — the old clearAll() here clobbered a photo the user
    // had just picked while a stale video's error/timeout was settling.
    if (gen !== videoGen) {
      URL.revokeObjectURL(videoUrl ?? url);
      videoUrl = null;
      return;
    }
    URL.revokeObjectURL(videoUrl ?? url);
    videoUrl = null;
    clearAll(); // restore the empty state the load was supposed to leave
    throw e;
  }
  // A6 e2e seam: hold the load open so the supersede race can be tested.
  if (import.meta.env.DEV && (window as unknown as { __stallVideoLoad?: boolean }).__stallVideoLoad) {
    await new Promise((r) => setTimeout(r, 2500));
  }
  // F2: a newer video was chosen while this one was still loading — abandon it
  // (revoke + don't start a loop that would clobber the newer one).
  if (gen !== videoGen) {
    URL.revokeObjectURL(videoUrl ?? url);
    videoUrl = null;
    return;
  }
  videoEl = v;
  videoHandle = startVideoLoop(
    v,
    (c) => {
      invalidateSource(c); // the video canvas is reused; its pixels change every frame
      renderSource(c);
    },
    12,
    // M9: a throw inside a frame used to kill the loop silently — the loop now
    // stops itself and reports so the user isn't staring at a frozen Pause.
    () => flash(t('interrupted'), 4000),
  );
  zoom = 1;
  applyZoom();
  $('emptyHint').style.display = 'none';
  $('playBtn').hidden = false;
  videoPaused = false;
  ($('playBtn') as HTMLButtonElement).textContent = t('pause');
  // L5/#10: respect prefers-reduced-motion — show ONE static frame and let the
  // user resume on demand instead of auto-animating at up to 12fps. Pause AFTER
  // the loop's first tick (rAF callbacks run in order) so a frame is visible.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    requestAnimationFrame(() => {
      videoHandle?.togglePlay();
      videoPaused = true;
      ($('playBtn') as HTMLButtonElement).textContent = t('play');
      (document.getElementById('dlVideo') as HTMLButtonElement).disabled = true;
      (document.getElementById('dlGif') as HTMLButtonElement).disabled = true;
    });
  }
  // iOS Safari can't captureStream the canvas, so video export is unavailable
  // there — swap the button for a hint pointing at GIF (which works everywhere).
  const canRecord = canRecordVideo();
  $('dlVideo').hidden = !canRecord;
  $('dlGif').hidden = false;
  const capHint = document.getElementById('videoCapHint');
  if (capHint) capHint.hidden = canRecord;
  trackEvent('source', { kind: 'video' });
  const chip = $('sourceChip');
  if (chip) chip.classList.add('visible');
  $('clearBtn').hidden = false;
  const srcEl = $('source') as HTMLCanvasElement;
  srcEl.width = v.videoWidth || 1;
  srcEl.height = v.videoHeight || 1;
  // The poster frame may not exist yet (InvalidStateError); the frame loop paints
  // the first frame a moment later, so a missing frame is not a failure.
  if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    try {
      srcEl.getContext('2d')!.drawImage(v, 0, 0);
    } catch {
      /* no decoded frame yet — the video loop handles it */
    }
  }
  flash(t('playing'));
}

function stopVideo(): void {
  // #1: any teardown (Clear, photo-pick, new video) supersedes an in-flight
  // video metadata-wait — without this, a pending load could clobber fresh state.
  videoGen++;
  if (videoHandle) {
    videoHandle.stop();
    videoHandle = null;
  }
  if (videoEl) videoEl = null;
  // M1: revoke the STORED URL. Reading videoEl.src here would return '' because
  // videoHandle.stop() already removed the attribute — a silent no-op leak.
  if (videoUrl) {
    URL.revokeObjectURL(videoUrl);
    videoUrl = null;
  }
  videoPaused = false;
  $('playBtn').hidden = true;
  $('dlVideo').hidden = true;
  $('dlGif').hidden = true;
  const capHint = document.getElementById('videoCapHint');
  if (capHint) capHint.hidden = true;
}

function downloadBlob(name: string, blob: Blob): void {
  triggerDownload(blob, name);
}

/** Show the converted video back in-app so the user can replay it there and then. */
function showReplay(blob: Blob): void {
  const panel = document.getElementById('replay');
  const vid = document.getElementById('replayVideo') as HTMLVideoElement | null;
  const dl = document.getElementById('dlReplay') as HTMLButtonElement | null;
  const close = document.getElementById('closeReplay') as HTMLButtonElement | null;
  if (!panel || !vid || !dl || !close) return;
  // Each replay gets a fresh object URL; revoke the previous one so repeated
  // downloads don't leak blob URLs.
  if (replayUrl) URL.revokeObjectURL(replayUrl);
  replayUrl = URL.createObjectURL(blob);
  vid.src = replayUrl;
  void vid.play().catch(() => {});
  dl.onclick = () => {
    downloadBlob('geez-art-video.' + (blob.type.includes('webm') ? 'webm' : 'mp4'), blob);
  };
  close.onclick = () => clearReplay(close);
  panel.hidden = false;
}

/* ---------- custom letter picker ---------- */

let pickerBuilt = false;
/** Build the ~300-button picker lazily, on first open of the letter picker
 *  (L29) — it used to be constructed on the critical "Ready" path. */
function ensurePickerBuilt(): void {
  if (pickerBuilt) return;
  pickerBuilt = true;
  buildPicker();
  updatePickerUI();
}

function buildPicker(): void {
  const grid = $('pickerGrid');
  grid.innerHTML = '';
  // Group by radical family: each fidel family spans an 8-codepoint block.
  const groups = new Map<number, GlyphInfo[]>();
  for (const g of allGlyphs) {
    const fam = Math.floor(g.cp / 8);
    const arr = groups.get(fam);
    if (arr) arr.push(g);
    else groups.set(fam, [g]);
  }
  const fams = [...groups.keys()].sort((a, b) => a - b);
  for (const fam of fams) {
    const members = groups.get(fam)!.slice().sort((a, b) => a.cp - b.cp);
    const head = members[0];

    // Tile cell: big letter toggles the whole family, small + opens individual letters.
    const cell = document.createElement('div');
    cell.className = 'fam';
    cell.dataset.fam = String(fam);
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'fam-tile';
    tile.title = t('toggleFamily');
    tile.textContent = head.ch;
    tile.setAttribute('aria-pressed', 'false');
    tile.addEventListener('click', () => toggleFamily(members));
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'fam-expand';
    expand.textContent = '+';
    expand.title = t('pickIndividual');
    expand.dataset.fam = String(fam);
    expand.setAttribute('aria-expanded', 'false');
    expand.addEventListener('click', () => {
      const detail = grid.querySelector(`.fam-detail[data-fam="${fam}"]`) as HTMLElement | null;
      if (!detail) return;
      const show = detail.hasAttribute('hidden');
      detail.hidden = !show;
      expand.textContent = show ? '−' : '+';
      expand.setAttribute('aria-expanded', String(show));
    });
    cell.append(tile, expand);
    grid.appendChild(cell);

    // Detail row (full-width, hidden until expanded): individual letter toggles.
    const detail = document.createElement('div');
    detail.className = 'fam-detail';
    detail.dataset.fam = String(fam);
    detail.hidden = true;
    for (const m of members) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'letter';
      b.textContent = m.ch;
      b.dataset.cp = m.cp.toString(16);
      b.title = `U+${m.cp.toString(16).toUpperCase()}`;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `${t('letterName')}${m.cp.toString(16).toUpperCase()}`);
      b.addEventListener('click', () => toggleLetter(m.cp));
      detail.appendChild(b);
    }
    grid.appendChild(detail);
  }
}

function toggleFamily(members: GlyphInfo[]): void {
  customTouched = true;
  const allIn = members.every((m) => selectedCps.has(m.cp));
  for (const m of members) {
    if (allIn) selectedCps.delete(m.cp);
    else selectedCps.add(m.cp);
  }
  updatePickerUI();
  void applyCustomRamp();
}

function toggleLetter(cp: number): void {
  customTouched = true;
  if (selectedCps.has(cp)) selectedCps.delete(cp);
  else selectedCps.add(cp);
  updatePickerUI();
  void applyCustomRamp();
}

function updatePickerUI(): void {
  document.querySelectorAll<HTMLElement>('.fam').forEach((cell) => {
    const fam = parseInt(cell.dataset.fam!, 10);
    const tile = cell.querySelector('.fam-tile');
    const detail = document.querySelector(`.fam-detail[data-fam="${fam}"]`);
    if (!tile || !detail) return;
    const letters = Array.from(detail.querySelectorAll<HTMLElement>('.letter'));
    letters.forEach((b) => {
      const sel = selectedCps.has(parseInt(b.dataset.cp!, 16));
      b.classList.toggle('selected', sel);
      b.setAttribute('aria-pressed', String(sel));
      // A8: keep the per-letter aria-label in the CURRENT language (buildPicker
      // froze it at build time — this re-applies on every toggle).
      b.setAttribute('aria-label', `${t('letterName')}${b.dataset.cp!.toUpperCase()}`);
    });
    const on = letters.filter((b) => selectedCps.has(parseInt(b.dataset.cp!, 16))).length;
    tile.classList.toggle('on', letters.length > 0 && on === letters.length);
    tile.classList.toggle('off', on === 0);
    tile.classList.toggle('partial', on > 0 && on < letters.length);
    // L2: aria-pressed accepts only true/false (WAI-ARIA 1.2). Partial state is
    // conveyed by the .partial class + an explicit label, not an invalid 'mixed'.
    tile.setAttribute('aria-pressed', letters.length > 0 && on === letters.length ? 'true' : 'false');
    if (on > 0 && on < letters.length) tile.setAttribute('aria-label', t('familyPartial'));
    else tile.removeAttribute('aria-label');
  });
  const total = allGlyphs.length;
  const used = allGlyphs.filter((g) => selectedCps.has(g.cp)).length;
  const sum = $('pickSummary');
  if (sum) {
    const base = used === total ? t('allLetters') : `${used} ${t('of')} ${total} ${t('letters')}`;
    sum.textContent = source ? base : `${base} — ${t('addPhotoToSee')}`;
  }
}

/** "Randomize letters": pick a fresh random subset of the alphabet each click. */
function mixItUp(): void {
  customTouched = true;
  const next = new Set<number>();
  for (const g of allGlyphs) {
    if (Math.random() < 0.6) next.add(g.cp);
  }
  if (next.size < 12) {
    for (const g of allGlyphs) {
      if (next.size >= 12) break;
      next.add(g.cp);
    }
  }
  selectedCps = next;
  const charsetSel = $('charset') as HTMLSelectElement;
  charsetSel.value = 'custom';
  ensurePickerBuilt(); // lazy build may not have happened yet (L29)
  $('picker').hidden = false;
  updatePickerUI();
  void applyCustomRamp();
  flash(t('randomized'));
}

async function applyCustomRamp(): Promise<void> {
  // Even-space the selection so no single letter dominates mid-tones (density
  // clustering is real — without this, one glyph floods every large area).
  const selected = allGlyphs.filter((g) => selectedCps.has(g.cp));
  ramp = rampFromGlyphs(selected);
  // Dev hooks reflect the CURRENT selection even when empty — tests poll these,
  // so they must not be skipped by the empty-ramp early return below.
  if (import.meta.env.DEV) {
    (window as unknown as { __ramp?: unknown; __selectedCps?: number[] }).__ramp = ramp;
    (window as unknown as { __selectedCps?: number[] }).__selectedCps = selected.map((g) => g.cp);
  }
  if (ramp.length === 0) {
    // "Use none": don't leave the previous mosaic, stat, or aria-label on screen (L31).
    const out = $('mosaic') as HTMLCanvasElement;
    out.width = 0;
    out.height = 0;
    mosaicCanvas = null;
    lastResult = null;
    out.setAttribute('aria-label', t('noLettersAria')); // L3: role=img must keep a name
    $('mosaicStat').textContent = '';
    updateShareState();
    $('status').textContent = t('noLetters');
    return;
  }
  // Live strip: the letters actually in use — instant feedback per tap.
  const preview = document.getElementById('rampPreview');
  if (preview) {
    preview.textContent = '';
    for (const g of ramp) {
      const s = document.createElement('span');
      s.textContent = g.ch;
      preview.appendChild(s);
    }
  }
  $('status').textContent = t('customReady');
  queueRender();
}

/**
 * Wire the file picker, dropzone, paste, empty-state, and Clear listeners.
 * Called FIRST in init() so the primary CTA (dropzone / giant ፊደል) is live at
 * DOM-interactive — it used to wait for font download + full glyph-ramp
 * measurement, leaving the page's only call-to-action dead for seconds on a
 * cold visit (M4). Dropping a photo before the ramp is ready just sets the
 * source; the render is gated on ramp.length and init re-renders afterwards.
 */
function wireInput(): void {
  const file = $('file') as HTMLInputElement;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (f) handlePickedFile(f);
    file.value = '';
  });
  $('dropzone').addEventListener('click', () => {
    trackEvent('dropzone_opened'); // opt-in analytics only
    file.click();
  });
  $('dropzone').addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      file.click();
    }
  });
  setupDropZone($('dropzone'), handlePickedFile);
  setupPaste(document.body, handlePickedFile);
  // The giant ፊደል empty state IS the drop target — click it to choose a photo.
  const emptyState = $('emptyHint');
  emptyState.addEventListener('click', () => file.click());
  emptyState.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      file.click();
    }
  });
  $('clearBtn').addEventListener('click', () => {
    clearAll();
    $('emptyHint').focus(); // L4: return focus to the restored empty state
  });
}

async function init(): Promise<void> {
  const status = $('status');
  initAnalytics(); // opt-in: a no-op unless a provider meta tag is present
  preloadEthiopicFont(); // M3: start the woff2 fetch before anything blocks
  wireInput(); // M4: primary CTA live at DOM-interactive, not after ramp setup
  // Language toggle: the entire UI is English-only or Amharic-only. F19:
  // remember the choice, and default Amharic-first visitors to Amharic.
  let storedLang: Lang | null = null;
  try {
    const s = localStorage.getItem('geez-art.lang');
    if (s === 'en' || s === 'am') storedLang = s;
  } catch { /* private mode — no persistence */ }
  const detectedLang: Lang = (navigator.language || '').toLowerCase().startsWith('am') ? 'am' : 'en';
  setLang(storedLang ?? detectedLang);
  const langSel = $('lang') as HTMLSelectElement;
  langSel.value = getLang();
  langSel.addEventListener('change', () => {
    setLang(langSel.value === 'am' ? 'am' : 'en');
    try { localStorage.setItem('geez-art.lang', getLang()); } catch { /* private mode */ }
    applyLang();
  });
  applyLang(); // render data-i18n for the initial language
  // F5: Amharic-first visitors see a localized boot status (the HTML default is
  // English and would otherwise show for the whole font+ramp window).
  status.textContent = t('statusLoading');
  // M5: on coarse-pointer / low-memory devices, lower the default detail so the
  // synchronous renderer doesn't freeze them before they can touch a slider.
  {
    // A3: every touch device gets the bounded default — the old <=4GB guard
    // missed 6-8GB Androids (Chromium reports deviceMemory=8), which can still
    // hit a 1-3s synchronous render at 400 cols.
    if (window.matchMedia('(pointer: coarse)').matches) {
      const w = $('width') as HTMLInputElement;
      w.value = '120';
      w.max = '240'; // bound the still-render cost too
    }
  }
  // L20/F24: the analytics disclosure is appended by applyLang() (called below),
  // so it survives language toggles — not appended here.
  try {
    await loadEthiopicFont();
    status.textContent = t('preparing');
    ramp = await buildRamp('common');
    allGlyphs = await getAllGlyphs();
    selectedCps = new Set(allGlyphs.map((g) => g.cp));
    if (import.meta.env.DEV) {
      (window as unknown as { __commonSet?: number[] }).__commonSet = Array.from(COMMON_AMHARIC);
    }
    status.textContent = t('ready');
    // M4: repaint anything the user dropped while the ramp was still loading.
    if (source) render();
  } catch {
    status.textContent = t('somethingWrong');
    return;
  }

  // Share hint text comes from the i18n dictionary (data-i18n="shareHint") — no
  // JS overwrite needed, and it re-renders on the language toggle.

  // Palette selector — guarded so a missing element can never kill the wiring.
  const palSel = document.getElementById('palette') as HTMLSelectElement | null;
  if (palSel) {
    for (const p of PALETTES) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = t(('palette_' + p.id) as I18nKey); // F8: localized palette names
      palSel.appendChild(o);
    }
    // F19: remember the palette across visits.
    let storedPal = DEFAULT_PALETTE.id;
    try { storedPal = localStorage.getItem('geez-art.palette') ?? DEFAULT_PALETTE.id; } catch { /* private mode */ }
    palSel.value = PALETTES.some((p) => p.id === storedPal) ? storedPal : DEFAULT_PALETTE.id;
    palSel.addEventListener('change', () => {
      const p = PALETTES.find((x) => x.id === palSel.value) ?? DEFAULT_PALETTE;
      try { localStorage.setItem('geez-art.palette', p.id); } catch { /* private mode */ }
      applyPalette(p);
    });
  }
  applyPalette(PALETTES.find((p) => p.id === (palSel ? palSel.value : DEFAULT_PALETTE.id)) ?? DEFAULT_PALETTE);

  // Input listeners are wired at the top of init() via wireInput() so the
  // primary CTA is live at DOM-interactive (M4), not after font + ramp setup.
  // (wireInput is called before the font awaits — see init below.)

  // Controls
  const updateWidthVal = () => ($('widthVal')).textContent = ($('width') as HTMLInputElement).value;
  const updateContrastVal = () => ($('contrastVal')).textContent = (1 + parseInt(($('contrast') as HTMLInputElement).value, 10) / 100).toFixed(2) + '×';
  const updateEdgeVal = () => ($('edgeVal')).textContent = (parseInt(($('edge') as HTMLInputElement).value, 10) / 100).toFixed(2);
  updateWidthVal();
  updateContrastVal();
  updateEdgeVal();
  ['width', 'contrast', 'edge'].forEach((id) => {
    ($(id) as HTMLInputElement).addEventListener('input', () => {
      updateWidthVal();
      updateContrastVal();
      updateEdgeVal();
      queueRender();
    });
  });
  (['invert', 'colorize'] as const).forEach((id) => {
    ($(id) as HTMLInputElement).addEventListener('change', queueRender);
  });
  ($('dither') as HTMLSelectElement).addEventListener('change', queueRender);

  // Letter-set selector: presets rebuild the ramp; 'custom' opens the picker.
  const charsetSel = $('charset') as HTMLSelectElement;
  charsetSel.addEventListener('change', async () => {
    const preset = charsetSel.value as RampPreset | 'custom';
    if (preset === 'custom') {
      ensurePickerBuilt(); // lazy: build the ~300-button grid on first open (L29)
      $('picker').hidden = false;
      // Start from a clean slate the first time: ONLY the letters you tap get used.
      if (!customTouched) {
        selectedCps = new Set();
        updatePickerUI();
      }
      if (!source && !videoEl) setEmpty('pick');
      await applyCustomRamp();
    } else {
      $('picker').hidden = true;
      setEmpty('default');
      try {
        ramp = await buildRamp(preset);
        status.textContent = t('ready');
        queueRender();
      } catch {
        status.textContent = t('buildLetterSetFailed');
      }
    }
  });

  // Custom picker: select-all / none.
  $('pickAll').addEventListener('click', () => {
    customTouched = true;
    selectedCps = new Set(allGlyphs.map((g) => g.cp));
    updatePickerUI();
    void applyCustomRamp();
  });
  $('pickNone').addEventListener('click', () => {
    customTouched = true;
    selectedCps.clear();
    updatePickerUI();
    void applyCustomRamp();
  });

  // Export
  $('dlPng').addEventListener('click', () => {
    if (mosaicCanvas) {
      downloadCanvasPNG(mosaicCanvas);
      trackEvent('export', { kind: 'png' });
    }
  });
  $('share').addEventListener('click', () => void doShare());
  $('shareTop').addEventListener('click', () => void doShare());
  $('copyText').addEventListener('click', () => {
    copyText();
    trackEvent('export', { kind: 'text' });
  });
  $('dlHtml').addEventListener('click', () => {
    trackEvent('export', { kind: 'html' });
    // L1: the embedded-font fetch can fail (offline / file://) — don't let
    // 'Save as HTML' fail silently.
    void downloadHTML().catch(() => flash(t('buildFailed'), 4000));
  });
  $('mixBtn').addEventListener('click', mixItUp);
  $('exampleBtn').addEventListener('click', () => {
    // First-run demo: show the effect in 3 seconds. Uses the icon-classical
    // sample; swap in real user photos whenever available. (L32: the sample's
    // real name is 'icon-classical', not 'icon' — the old lookup silently fell
    // through to the 'face' sample.)
    const demos = getSamples();
    const sample = demos.find((s) => s.name === 'icon-classical') ?? demos[0];
    trackEvent('example_used'); // M6 funnel — opt-in analytics only
    if (import.meta.env.DEV) {
      (window as unknown as { __currentSample?: string }).__currentSample = sample.name;
    }
    setSource(sample.render());
  });
  $('playBtn').addEventListener('click', () => {
    if (videoHandle) {
      const paused = videoHandle.togglePlay();
      videoPaused = paused;
      ($('playBtn') as HTMLButtonElement).textContent = paused ? t('play') : t('pause');
      // L28: a paused source would yield a static GIF — disable both exports.
      (document.getElementById('dlVideo') as HTMLButtonElement).disabled = paused;
      (document.getElementById('dlGif') as HTMLButtonElement).disabled = paused;
    }
  });
  $('dlVideo').addEventListener('click', async () => {
    const out = document.getElementById('mosaic') as HTMLCanvasElement | null;
    if (!out || out.width === 0) return;
    if (!canRecordVideo()) {
      flash(t('videoCapHint'), 4000);
      return;
    }
    trackEvent('export', { kind: 'video' });
    flash(t('recording'));
    const gen = recordGen; // F2(b): cancelled by Clear/teardown mid-recording
    // M2+M10: record from a downscaled, URL-branded copy of the LIVE mosaic so
    // video shares carry the loop URL and encode fast on budget phones. The copy
    // is repainted every frame — captureStream needs changing frames.
    const recCanvas = document.createElement('canvas');
    let recRaf = 0;
    const paint = () => {
      paintBrandedCapture(recCanvas, out, SITE_URL) // F21: bare domain on the visible band;
      recRaf = requestAnimationFrame(paint);
    };
    paint();
    let audio: MediaStream | null = null;
    let prevVolume = 1;
    try {
      // Mix in the source video's audio so the clip isn't silent. The source
      // <video> is muted for silent playback, but a muted element yields a
      // silent captureStream audio track — so unmute (volume 0 keeps playback
      // inaudible) and KEEP it unmuted for the whole recording window. The
      // restore happens in finally, AFTER recordCanvas resolves (M9: re-muting
      // before the 4s window silenced the captured track).
      if (videoEl) {
        prevVolume = videoEl.volume;
        videoEl.muted = false;
        videoEl.volume = 0;
        try {
          const withStream = videoEl as HTMLVideoElement & { captureStream?: () => MediaStream };
          audio = withStream.captureStream ? withStream.captureStream() : null;
        } catch {
          audio = null;
        }
      }
      // F8: export at the loop's EFFECTIVE rate (it backs off to ~6fps on slow
      // devices — a fixed 12 would duplicate frames and play back at half speed).
      const effFps = Math.max(6, Math.min(12, Math.round(1000 / (videoHandle?.getFrameMs() ?? 83))));
      const rec = await recordCanvas(recCanvas, 4, effFps, audio);
      // F2(b): Clear/teardown during the recording → don't surface a stale file.
      if (gen !== recordGen) return;
      if (rec.blob) {
        downloadBlob('geez-art-video.' + rec.ext, rec.blob);
        showReplay(rec.blob);
      }
      flash(rec.blob ? t('videoSaved') : t('videoFailed'));
    } finally {
      cancelAnimationFrame(recRaf);
      if (videoEl) {
        videoEl.muted = true;
        videoEl.volume = prevVolume;
      }
    }
  });
  $('dlGif').addEventListener('click', async () => {
    const out = document.getElementById('mosaic') as HTMLCanvasElement | null;
    if (!out || out.width === 0) return;
    trackEvent('export', { kind: 'gif' });
    flash(t('makingGif'));
    const gen = recordGen; // F2(b): cancelled by Clear/teardown mid-recording
    // M2: brand the GIF with the URL band too. The copy is repainted on rAF —
    // recordGIF awaits between its frame captures, so the animation survives.
    const recCanvas = document.createElement('canvas');
    let recRaf = 0;
    const paint = () => {
      paintBrandedCapture(recCanvas, out, SITE_URL) // F21: bare domain on the visible band;
      recRaf = requestAnimationFrame(paint);
    };
    paint();
    try {
      const bytes = await recordGIF(recCanvas, 3, Math.max(4, Math.min(8, Math.round(1000 / (videoHandle?.getFrameMs() ?? 125)))));
      if (gen !== recordGen) return; // F2(b): superseded → drop the stale file
      if (bytes) {
        downloadBlob('geez-art.gif', new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' }));
        flash(t('gifSaved'));
      } else {
        // recordGIF collapses failures to null — don't claim success (M5).
        flash(t('gifFailed'), 4000);
      }
    } finally {
      cancelAnimationFrame(recRaf);
    }
  });
  $('zoomIn').addEventListener('click', () => {
    zoom = Math.min(4, Math.round((zoom + 0.25) * 100) / 100);
    applyZoom();
  });
  $('zoomOut').addEventListener('click', () => {
    zoom = Math.max(1, Math.round((zoom - 0.25) * 100) / 100);
    applyZoom();
  });
  $('zoomReset').addEventListener('click', () => {
    zoom = 1;
    applyZoom();
  });
}

// If ANY part of setup fails, say so on the status line instead of leaving a
// silently dead page (which is what happened when an element went missing).
void init().catch((e) => {
  const s = document.getElementById('status');
  if (s) s.textContent = `${t('setupError')} ${e instanceof Error ? e.message : String(e)}`;
});
