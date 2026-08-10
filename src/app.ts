// geez-art app bootstrap + wiring.
// Algorithmic, client-side, zero backend. Ethiopian classical-art design layer
// via src/palette.ts.

/// <reference types="vite/client" />

import '@fontsource-variable/noto-sans-ethiopic';
import '@fontsource-variable/inter';
import { loadEthiopicFont, buildRamp, getAllGlyphs, rampFromGlyphs, COMMON_AMHARIC, type GlyphInfo, type RampPreset } from './fonts';
import { renderMosaic, invalidateSource, type DitherMode } from './render';
import { imageFileToCanvas, setupPaste, setupDropZone, isHeic, isVideoFile } from './input';
import { downloadCanvasPNG, gridToText, selfContainedHTML, makeShareImage, shareCanvas, downscaleCanvas, paintBrandedCapture } from './export';
import { PALETTES, DEFAULT_PALETTE, cssVars, type ArtPalette } from './palette';
import { getSamples } from './samples';
import { startVideoLoop, recordCanvas, recordGIF, canRecordVideo, type VideoHandle } from './video';
import { initAnalytics, trackEvent } from './analytics';

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

const EMPTY_DEFAULT = {
  title: 'Choose a photo or video',
  sub: 'It becomes a mosaic of Ethiopian letters — a picture from far, letters up close. Free, and nothing is uploaded.',
  am: {
    title: 'ምስል ወይም ቪዲዮ ይምረጡ',
    sub: 'ወደ የኢትዮጵያ ፊደላት ሞዛይክ ይቀየራል። ነፃ ነው፣ ምንም አይሰቀልም።',
  },
};
const EMPTY_PICK = {
  title: 'Pick your letters',
  sub: 'Choose which letters appear — only the ones you tap will be used.',
  am: {
    title: 'ፊደሎችን ይምረጡ',
    sub: 'የሚመርጧቸው ፊደላት ብቻ ጥቅም ላይ ይውላሉ።',
  },
};

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

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

/** Reset everything and restore the idle empty state (also the "Clear" handler). */
function clearAll(): void {
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
  out.setAttribute('aria-label', 'Ethiopic letter mosaic — add a photo to create one.'); // L22: no stale render label
  $('mosaicStat').textContent = '';
  mosaicCanvas = null;
  lastResult = null;
  setEmpty(EMPTY_DEFAULT);
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
    cols: parseInt(($('width') as HTMLInputElement).value, 10),
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
  if ($('status').textContent === 'Rendering…') $('status').textContent = 'Ready';
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
    if (firstRender) flash('Your picture is ready!');
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
    stat.textContent = `Your picture — ${(res.cols * res.rows).toLocaleString()} letters · ${currentPalette.name}`;
    // Readable sample of the actual fidel grid so the canvas isn't a silent
    // picture to screen-reader users.
    const sample = res.chars.map((row) => row.join('')).join('').slice(0, 200);
    out.setAttribute('aria-label', `Mosaic of Ethiopic letters, ${res.cols} × ${res.rows}, ${distinct.size} distinct letters, ${currentPalette.name}. Fidel text sample: ${sample}`);
  }
  $('clearBtn').hidden = false;
}

function queueRender(): void {
  if (renderTimer) window.clearTimeout(renderTimer);
  // Busy cue (M8): show work in progress during the debounce window so a
  // multi-second synchronous render doesn't look frozen. render() restores
  // the idle status when it finishes.
  if ($('status').textContent !== 'Rendering…') $('status').textContent = 'Rendering…';
  renderTimer = window.setTimeout(render, 120); // debounce sliders
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
      () => flash('Copied'),
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
    flash('Copied');
  } catch {
    flash("Couldn't copy — try again.");
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
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    status.textContent = 'Ready';
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
  if (returnFocusTo) returnFocusTo.focus();
}

/** The viral action — branded PNG with the site URL, via native share sheet or download. */
async function doShare(): Promise<void> {
  if (!mosaicCanvas) return;
  trackEvent('share_started');
  // M1: downscale the mosaic FIRST, then stamp the band at final resolution —
  // stamping on the full-res canvas and shrinking the whole thing crushed the
  // URL band to ~4px after messenger recompression. The band must be legible:
  // it is the entire viral CTA.
  const compact = downscaleCanvas(mosaicCanvas, 1600);
  const branded = makeShareImage(compact, SITE_URL);
  const result = await shareCanvas(branded, `Turn your photo into Ethiopic letters — ${SITE_URL}`);
  // M6: track the OUTCOME so the viral loop's K-factor is observable (only
  // fires when a provider is configured — otherwise a no-op).
  trackEvent(result === 'shared' ? 'share_success' : result === 'cancelled' ? 'share_cancelled' : 'share_downloaded');
  // L7: a dismissed share sheet is not a "Saved" success.
  if (result === 'shared') flash('Shared — just the mosaic, not your original, and nothing is uploaded');
  else if (result === 'cancelled') flash('Share cancelled — nothing was sent.');
  else flash('Saved — only the mosaic is shared; your photo never leaves your device');
}

/** Keep every Share control honest: disabled until a mosaic exists. */
function updateShareState(): void {
  const ready = mosaicCanvas !== null;
  for (const id of ['share', 'shareTop']) {
    const b = document.getElementById(id);
    if (b) (b as HTMLButtonElement).disabled = !ready;
  }
}

/** Swap the idle frame's guidance text (EN + the matching Amharic line, M4). */
function setEmpty(t: { title: string; sub: string; am?: { title: string; sub: string } }): void {
  const tEl = document.getElementById('emptyTitle');
  const sEl = document.getElementById('emptySub');
  if (tEl) tEl.textContent = t.title;
  if (sEl) sEl.textContent = t.sub;
  if (t.am) {
    const taEl = document.getElementById('emptyTitleAm');
    const saEl = document.getElementById('emptySubAm');
    if (taEl) taEl.textContent = t.am.title;
    if (saEl) saEl.textContent = t.am.sub;
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
      zw.setAttribute('aria-label', 'Zoomed artwork — use the arrow keys to pan');
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
  if (isVideoFile(file)) {
    void handleVideoFile(file).catch(() => flash("We couldn't read that video — try another one."));
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
        if (isHeic(file)) {
          flash("That's a HEIC photo — your browser can't open it. Convert it to JPG or PNG (or screenshot it) and drop it again.", 5000);
        } else {
          flash("We couldn't read that picture — try another one.");
        }
      });
  }
}

/** Load a video, then run it through the mosaic filter live. */
async function handleVideoFile(file: File): Promise<void> {
  clearAll();
  const url = URL.createObjectURL(file);
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
    URL.revokeObjectURL(url);
    clearAll(); // restore the empty state the load was supposed to leave
    throw e;
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
    () => flash('Something interrupted the filter — try the video again.', 4000),
  );
  zoom = 1;
  applyZoom();
  $('emptyHint').style.display = 'none';
  $('playBtn').hidden = false;
  ($('playBtn') as HTMLButtonElement).textContent = 'Pause';
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
  flash('Playing — the filter is live');
}

function stopVideo(): void {
  if (videoHandle) {
    videoHandle.stop();
    videoHandle = null;
  }
  if (videoEl) {
    URL.revokeObjectURL(videoEl.src);
    videoEl = null;
  }
  $('playBtn').hidden = true;
  $('dlVideo').hidden = true;
  $('dlGif').hidden = true;
  const capHint = document.getElementById('videoCapHint');
  if (capHint) capHint.hidden = true;
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    tile.title = 'Toggle this family';
    tile.textContent = head.ch;
    tile.setAttribute('aria-pressed', 'false');
    tile.addEventListener('click', () => toggleFamily(members));
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'fam-expand';
    expand.textContent = '+';
    expand.title = 'Pick individual letters';
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
      b.setAttribute('aria-label', `Letter U+${m.cp.toString(16).toUpperCase()}`);
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
    });
    const on = letters.filter((b) => selectedCps.has(parseInt(b.dataset.cp!, 16))).length;
    tile.classList.toggle('on', letters.length > 0 && on === letters.length);
    tile.classList.toggle('off', on === 0);
    tile.classList.toggle('partial', on > 0 && on < letters.length);
    tile.setAttribute('aria-pressed', letters.length > 0 && on === letters.length ? 'true' : on > 0 ? 'mixed' : 'false');
  });
  const total = allGlyphs.length;
  const used = allGlyphs.filter((g) => selectedCps.has(g.cp)).length;
  const sum = $('pickSummary');
  if (sum) {
    const base = used === total ? 'All letters' : `${used} of ${total} letters`;
    sum.textContent = source ? base : `${base} — add a photo to see them`;
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
  flash('Randomized');
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
    out.removeAttribute('aria-label');
    $('mosaicStat').textContent = '';
    updateShareState();
    $('status').textContent = 'No letters selected — tap some in the picker.';
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
  $('status').textContent = `Custom · ${ramp.length} letters in use`;
  queueRender();
}

async function init(): Promise<void> {
  const status = $('status');
  initAnalytics(); // opt-in: a no-op unless a provider meta tag is present
  try {
    await loadEthiopicFont();
    status.textContent = 'Preparing the letters…';
    ramp = await buildRamp('common');
    allGlyphs = await getAllGlyphs();
    selectedCps = new Set(allGlyphs.map((g) => g.cp));
    if (import.meta.env.DEV) {
      (window as unknown as { __commonSet?: number[] }).__commonSet = Array.from(COMMON_AMHARIC);
    }
    status.textContent = `Ready · ${ramp.length} letters`;
  } catch {
    status.textContent = 'Something went wrong — try reloading.';
    return;
  }

  // Share privacy: only the rendered mosaic leaves the device — never the source
  // photo, and nothing goes to geez·art's servers (this page is fully client-side).
  // Update ONLY the leading English text node: shareHint.textContent would wipe
  // the embedded Amharic <span> on every load (M3).
  const shareHint = document.getElementById('shareHint');
  if (shareHint) {
    const en = shareHint.childNodes[0];
    if (en && en.nodeType === Node.TEXT_NODE) {
      en.textContent = "Ready — hit Share. Only the mosaic is shared — not your original — and nothing goes to geez·art's servers.";
    } else {
      shareHint.textContent = "Ready — hit Share. Only the mosaic is shared — not your original — and nothing goes to geez·art's servers.";
    }
  }

  // Palette selector — guarded so a missing element can never kill the wiring.
  const palSel = document.getElementById('palette') as HTMLSelectElement | null;
  if (palSel) {
    for (const p of PALETTES) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      palSel.appendChild(o);
    }
    palSel.value = DEFAULT_PALETTE.id;
    palSel.addEventListener('change', () => {
      const p = PALETTES.find((x) => x.id === palSel.value) ?? DEFAULT_PALETTE;
      applyPalette(p);
    });
  }
  applyPalette(DEFAULT_PALETTE);

  // Input: file picker via the dropzone, drag-drop, paste.
  const file = $('file') as HTMLInputElement;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (f) handlePickedFile(f);
    file.value = '';
  });
  $('dropzone').addEventListener('click', () => {
    trackEvent('dropzone_opened'); // M6 funnel — opt-in analytics only
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
  $('clearBtn').addEventListener('click', clearAll);


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
      if (!source && !videoEl) setEmpty(EMPTY_PICK);
      await applyCustomRamp();
    } else {
      $('picker').hidden = true;
      setEmpty(EMPTY_DEFAULT);
      try {
        ramp = await buildRamp(preset);
        status.textContent = `Ready · ${ramp.length} letters`;
        queueRender();
      } catch {
        status.textContent = "Couldn't build that letter set.";
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
    void downloadHTML();
    trackEvent('export', { kind: 'html' });
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
      ($('playBtn') as HTMLButtonElement).textContent = paused ? 'Play' : 'Pause';
      (document.getElementById('dlVideo') as HTMLButtonElement).disabled = paused;
    }
  });
  $('dlVideo').addEventListener('click', async () => {
    const out = document.getElementById('mosaic') as HTMLCanvasElement | null;
    if (!out || out.width === 0) return;
    if (!canRecordVideo()) {
      flash("Video export isn't supported on this device — grab a GIF instead.", 4000);
      return;
    }
    trackEvent('export', { kind: 'video' });
    flash('Recording a few seconds…');
    // M2+M10: record from a downscaled, URL-branded copy of the LIVE mosaic so
    // video shares carry the loop URL and encode fast on budget phones. The copy
    // is repainted every frame — captureStream needs changing frames.
    const recCanvas = document.createElement('canvas');
    let recRaf = 0;
    const paint = () => {
      paintBrandedCapture(recCanvas, out, SITE_URL);
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
      const rec = await recordCanvas(recCanvas, 4, 12, audio);
      if (rec.blob) {
        downloadBlob('geez-art-video.' + rec.ext, rec.blob);
        showReplay(rec.blob);
      }
      flash(rec.blob ? 'Video saved' : "Couldn't record the video.");
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
    flash('Making a GIF…');
    // M2: brand the GIF with the URL band too. The copy is repainted on rAF —
    // recordGIF awaits between its frame captures, so the animation survives.
    const recCanvas = document.createElement('canvas');
    let recRaf = 0;
    const paint = () => {
      paintBrandedCapture(recCanvas, out, SITE_URL);
      recRaf = requestAnimationFrame(paint);
    };
    paint();
    try {
      const bytes = await recordGIF(recCanvas, 3, 8);
      if (bytes) {
        downloadBlob('geez-art.gif', new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' }));
        flash('GIF saved');
      } else {
        // recordGIF collapses failures to null — don't claim success (M5).
        flash("Couldn't make the GIF — try again.", 4000);
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
  if (s) s.textContent = 'Setup error: ' + (e instanceof Error ? e.message : String(e));
});
