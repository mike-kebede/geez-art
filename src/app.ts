// geez-art app bootstrap + wiring.
// Algorithmic, client-side, zero backend. Ethiopian classical-art design layer
// via src/palette.ts.

import '@fontsource-variable/noto-sans-ethiopic';
import '@fontsource-variable/inter';
import { loadEthiopicFont, buildRamp, getAllGlyphs, rampFromGlyphs, COMMON_AMHARIC, type GlyphInfo, type RampPreset } from './fonts';
import { renderMosaic, invalidateSource, type DitherMode } from './render';
import { imageFileToCanvas, setupPaste, setupDropZone } from './input';
import { downloadCanvasPNG, gridToText, exportHTML, makeShareImage, shareCanvas } from './export';
import { PALETTES, DEFAULT_PALETTE, cssVars, type ArtPalette } from './palette';
import { getSamples } from './samples';
import { startVideoLoop, recordCanvas, type VideoHandle } from './video';

let ramp: GlyphInfo[] = [];
let source: HTMLCanvasElement | null = null;
let mosaicCanvas: HTMLCanvasElement | null = null;
let currentPalette: ArtPalette = DEFAULT_PALETTE;
let renderTimer: number | undefined;
let allGlyphs: GlyphInfo[] = [];
let selectedCps = new Set<number>();
let firstRenderDone = false;
let videoHandle: VideoHandle | null = null;
let videoEl: HTMLVideoElement | null = null;
let lastResult: ReturnType<typeof renderMosaic> | null = null;
let zoom = 1;
let customTouched = false;

const EMPTY_DEFAULT = {
  title: 'Drop a photo or video',
  sub: 'It becomes a mosaic of Ethiopian letters — a picture from far, letters up close. Free, and nothing is uploaded.',
};
const EMPTY_PICK = {
  title: 'Pick your letters',
  sub: 'Choose which letters appear — only the ones you tap will be used.',
};

// The deployed site URL stamped onto shared images.
// Cloudflare Pages default domain for project "geez-art"; swap for a custom domain later.
const SITE_URL = 'geez-art.pages.dev';

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

/** Reset everything and restore the idle empty state (also the "Clear" handler). */
function clearAll(): void {
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
  }
  const distinct = new Set<string>();
  for (const row of res.chars) for (const ch of row) distinct.add(ch);
  out.dataset.distinct = String(distinct.size);
  // Expose ramp + usage stats for diagnostics and tests.
  (window as unknown as { __ramp?: unknown; __lastChars?: string[] }).__ramp = ramp;
  (window as unknown as { __lastChars?: string[] }).__lastChars = Array.from(distinct);
  const stat = $('mosaicStat');
  stat.textContent = `${res.cols} × ${res.rows} · ${res.cols * res.rows} letters · ${distinct.size} distinct · ${currentPalette.name}`;
  out.setAttribute('aria-label', `Mosaic of Ethiopic letters, ${res.cols} × ${res.rows}, ${distinct.size} distinct letters, ${currentPalette.name}`);
  $('clearBtn').hidden = false;
}

function queueRender(): void {
  if (renderTimer) window.clearTimeout(renderTimer);
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

function downloadHTML(): void {
  const res = currentResult();
  if (!res) return;
  const html = exportHTML(res.chars, { ink: currentPalette.ink, paper: currentPalette.paper });
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

function flash(msg: string): void {
  const status = $('status');
  status.textContent = msg;
  window.setTimeout(() => (status.textContent = 'Ready'), 1500);
}

/** The viral action — branded PNG with the site URL, via native share sheet or download. */
async function doShare(): Promise<void> {
  if (!mosaicCanvas) return;
  const branded = makeShareImage(mosaicCanvas, SITE_URL);
  const result = await shareCanvas(branded, `Turn your photo into Ethiopic letters — ${SITE_URL}`);
  flash(result === 'shared' ? 'Shared' : 'Saved — send it on WhatsApp or Telegram');
}

/** Keep every Share control honest: disabled until a mosaic exists. */
function updateShareState(): void {
  const ready = mosaicCanvas !== null;
  for (const id of ['share', 'shareTop']) {
    const b = document.getElementById(id);
    if (b) (b as HTMLButtonElement).disabled = !ready;
  }
}

/** Swap the idle frame's guidance text (e.g. point users at the letter picker). */
function setEmpty(t: { title: string; sub: string }): void {
  const tEl = document.getElementById('emptyTitle');
  const sEl = document.getElementById('emptySub');
  if (tEl) tEl.textContent = t.title;
  if (sEl) sEl.textContent = t.sub;
}

/** Apply the mosaic zoom (CSS scale via width) so letters can be seen up close. */
function applyZoom(): void {
  const c = document.getElementById('mosaic') as HTMLCanvasElement | null;
  if (c) c.style.width = `${100 * zoom}%`;
  const v = document.getElementById('zoomVal');
  if (v) v.textContent = `${Math.round(zoom * 100)}%`;
}

/* ---------- video (the fidel filter) ---------- */

/** Route a picked file to photo or video mode. */
function handlePickedFile(file: File): void {
  if (file.type.startsWith('video/')) {
    void handleVideoFile(file).catch(() => flash("We couldn't read that video — try another one."));
  } else {
    stopVideo();
    void imageFileToCanvas(file)
      .then(setSource)
      .catch(() => flash("We couldn't read that picture — try another one."));
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
  await new Promise<void>((resolve, reject) => {
    v.addEventListener('loadedmetadata', () => resolve(), { once: true });
    v.addEventListener('error', () => reject(new Error('video failed to load')), { once: true });
  });
  videoEl = v;
  videoHandle = startVideoLoop(v, (c) => {
    invalidateSource(c); // the video canvas is reused; its pixels change every frame
    renderSource(c);
  });
  zoom = 1;
  applyZoom();
  $('emptyHint').style.display = 'none';
  $('playBtn').hidden = false;
  ($('playBtn') as HTMLButtonElement).textContent = 'Pause';
  $('dlVideo').hidden = false;
  const chip = $('sourceChip');
  if (chip) chip.classList.add('visible');
  $('clearBtn').hidden = false;
  const srcEl = $('source') as HTMLCanvasElement;
  srcEl.width = v.videoWidth || 1;
  srcEl.height = v.videoHeight || 1;
  srcEl.getContext('2d')!.drawImage(v, 0, 0);
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

/* ---------- custom letter picker ---------- */

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
    letters.forEach((b) => b.classList.toggle('selected', selectedCps.has(parseInt(b.dataset.cp!, 16))));
    const on = letters.filter((b) => selectedCps.has(parseInt(b.dataset.cp!, 16))).length;
    tile.classList.toggle('on', letters.length > 0 && on === letters.length);
    tile.classList.toggle('off', on === 0);
    tile.classList.toggle('partial', on > 0 && on < letters.length);
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
  (window as unknown as { __ramp?: unknown; __selectedCps?: number[] }).__ramp = ramp;
  (window as unknown as { __selectedCps?: number[] }).__selectedCps = selected.map((g) => g.cp);
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
  try {
    await loadEthiopicFont();
    status.textContent = 'Preparing the letters…';
    ramp = await buildRamp('common');
    allGlyphs = await getAllGlyphs();
    selectedCps = new Set(allGlyphs.map((g) => g.cp));
    buildPicker();
    updatePickerUI();
    (window as unknown as { __commonSet?: number[] }).__commonSet = Array.from(COMMON_AMHARIC);
    status.textContent = `Ready · ${ramp.length} letters`;
  } catch {
    status.textContent = 'Something went wrong — try reloading.';
    return;
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
  $('dropzone').addEventListener('click', () => file.click());
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
    if (mosaicCanvas) downloadCanvasPNG(mosaicCanvas);
  });
  $('share').addEventListener('click', () => void doShare());
  $('shareTop').addEventListener('click', () => void doShare());
  $('copyText').addEventListener('click', copyText);
  $('dlHtml').addEventListener('click', downloadHTML);
  $('mixBtn').addEventListener('click', mixItUp);
  $('exampleBtn').addEventListener('click', () => {
    // First-run demo: show the effect in 3 seconds. Uses the icon-classical
    // sample; swap in real user photos whenever available.
    const demos = getSamples();
    const sample = demos.find((s) => s.name === 'icon') ?? demos[0];
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
    flash('Recording a few seconds…');
    // Capture the on-page canvas (repainted every video frame) — captureStream
    // needs changing frames; the offscreen render canvas is static each frame.
    const rec = await recordCanvas(out, 4, 12);
    if (rec.blob) downloadBlob('geez-art-video.' + rec.ext, rec.blob);
    flash('Video saved');
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
