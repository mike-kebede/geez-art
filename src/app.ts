// geez-art app bootstrap + wiring.
// Algorithmic, client-side, zero backend. Ethiopian classical-art design layer
// via src/palette.ts.

import '@fontsource-variable/noto-sans-ethiopic';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono';
import { loadEthiopicFont, buildRamp, type GlyphInfo, type RampPreset } from './fonts';
import { renderMosaic, type DitherMode } from './render';
import { getSamples } from './samples';
import { imageFileToCanvas, setupPaste, setupDropZone } from './input';
import { downloadCanvasPNG, gridToText, exportHTML, makeShareImage, shareCanvas } from './export';
import { PALETTES, DEFAULT_PALETTE, cssVars, type ArtPalette } from './palette';

let ramp: GlyphInfo[] = [];
let source: HTMLCanvasElement | null = null;
let mosaicCanvas: HTMLCanvasElement | null = null;
let currentPalette: ArtPalette = DEFAULT_PALETTE;
let renderTimer: number | undefined;

// The deployed site URL stamped onto shared images — update after deploying.
const SITE_URL = 'geez-art.art';

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function setSource(c: HTMLCanvasElement): void {
  source = c;
  const empty = $('emptyHint');
  if (empty) empty.style.display = 'none';
  const chip = $('sourceChip');
  if (chip) chip.classList.add('visible');
  const srcEl = $('source') as HTMLCanvasElement;
  srcEl.width = c.width;
  srcEl.height = c.height;
  srcEl.getContext('2d')!.drawImage(c, 0, 0);
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
  if (!source || ramp.length === 0) return;
  const opts = readRenderOpts();
  const res = renderMosaic(source, ramp, {
    ...opts,
    paper: currentPalette.paper,
    ink: currentPalette.ink,
  });
  const out = $('mosaic') as HTMLCanvasElement;
  out.width = res.canvas.width;
  out.height = res.canvas.height;
  out.getContext('2d')!.drawImage(res.canvas, 0, 0);
  mosaicCanvas = res.canvas;
  const stat = $('mosaicStat');
  stat.textContent = `${res.cols} × ${res.rows} = ${res.cols * res.rows} letters · ${ramp.length}-glyph ramp · ${currentPalette.name}`;
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
  if (!source || ramp.length === 0) return null;
  return renderMosaic(source, ramp, {
    ...readRenderOpts(),
    paper: currentPalette.paper,
    ink: currentPalette.ink,
  });
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
    flash('Copy failed');
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

async function init(): Promise<void> {
  const status = $('status');
  try {
    await loadEthiopicFont();
    status.textContent = 'Measuring glyph density…';
    ramp = await buildRamp();
    status.textContent = `Ready · ${ramp.length}-glyph ramp`;
  } catch (e) {
    status.textContent = 'Error: ' + (e instanceof Error ? e.message : String(e));
    return;
  }

  // Palette selector
  const palSel = $('palette') as HTMLSelectElement;
  for (const p of PALETTES) {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name;
    palSel.appendChild(o);
  }
  palSel.value = DEFAULT_PALETTE.id;
  applyPalette(DEFAULT_PALETTE);

  // Input: file picker via the dropzone, drag-drop, paste.
  const file = $('file') as HTMLInputElement;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (f) {
      imageFileToCanvas(f)
        .then(setSource)
        .catch(() => flash('Could not read that image'));
    }
    file.value = '';
  });
  $('dropzone').addEventListener('click', () => file.click());
  $('dropzone').addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      file.click();
    }
  });
  setupDropZone($('dropzone'), setSource);
  setupPaste(document.body, setSource);

  // Demo images
  const demos = getSamples();
  document.querySelectorAll<HTMLElement>('[data-demo]').forEach((btn) => {
    const name = btn.dataset.demo!;
    const sample = demos.find((s) => s.name === name);
    if (sample) btn.addEventListener('click', () => setSource(sample.render()));
  });

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
  palSel.addEventListener('change', () => {
    const p = PALETTES.find((x) => x.id === palSel.value) ?? DEFAULT_PALETTE;
    applyPalette(p);
  });

  // Letter-set selector: rebuild the density ramp for the chosen alphabet.
  const charsetSel = $('charset') as HTMLSelectElement;
  charsetSel.addEventListener('change', async () => {
    const preset = charsetSel.value as RampPreset;
    try {
      ramp = await buildRamp(preset);
      status.textContent = `Ready · ${ramp.length}-glyph ramp (${charsetSel.selectedOptions[0]?.textContent ?? preset})`;
      queueRender();
    } catch (e) {
      status.textContent = 'Error building ramp: ' + (e instanceof Error ? e.message : String(e));
    }
  });

  // Export
  $('dlPng').addEventListener('click', () => {
    if (mosaicCanvas) downloadCanvasPNG(mosaicCanvas);
  });
  $('share').addEventListener('click', async () => {
    if (!mosaicCanvas) return;
    const branded = makeShareImage(mosaicCanvas, SITE_URL);
    const result = await shareCanvas(branded, `Turn your photo into Ethiopic letters — ${SITE_URL}`);
    flash(result === 'shared' ? 'Shared' : 'Saved share image');
  });
  $('copyText').addEventListener('click', copyText);
  $('dlHtml').addEventListener('click', downloadHTML);

  // First frame: the icon-style demo (classical design direction).
  const first = demos.find((s) => s.name === 'icon') ?? demos[0];
  setSource(first.render());
}

void init();
