// Phase 0 legibility gallery (samples.html). Builds the ramp, shows a
// density-ordered strip of every glyph, and renders varied sample mosaics.

import '@fontsource-variable/noto-sans-ethiopic';
import { loadEthiopicFont, buildRamp } from './fonts';
import { getSamples } from './samples';
import { renderMosaic } from './render';

async function main(): Promise<void> {
  const status = document.getElementById('status')!;
  const container = document.getElementById('samples')!;

  status.textContent = 'Loading Ethiopic font…';
  await loadEthiopicFont();

  status.textContent = 'Measuring glyph density and building the ramp…';
  const ramp = await buildRamp();
  status.textContent = `Ramp built: ${ramp.length} glyphs. Rendering samples…`;

  const strip = document.getElementById('rampstrip') as HTMLCanvasElement;
  strip.width = ramp.length * 12;
  strip.height = 28;
  const sctx = strip.getContext('2d')!;
  sctx.fillStyle = '#fff';
  sctx.fillRect(0, 0, strip.width, strip.height);
  sctx.font = '24px "Noto Sans Ethiopic Variable"';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  ramp.forEach((g, i) => sctx.fillText(g.ch, i * 12 + 6, 14));

  const statsEl = document.getElementById('rampstats')!;
  const dMin = ramp[0].density;
  const dMax = ramp[ramp.length - 1].density;
  statsEl.textContent =
    `${ramp.length} glyphs · density ${dMin.toFixed(3)} → ${dMax.toFixed(3)} · span ${(dMax - dMin).toFixed(3)} ` +
    `· lightest ${ramp[0].ch} (U+${ramp[0].cp.toString(16)}) · darkest ${ramp[ramp.length - 1].ch} (U+${ramp[ramp.length - 1].cp.toString(16)})`;

  const usage = new Map<string, number>();
  for (const sample of getSamples()) {
    for (const cols of [64, 128, 200]) {
      const fig = document.createElement('figure');
      const cap = document.createElement('figcaption');
      cap.textContent = `${sample.name} · ${cols} cols`;
      const res = renderMosaic(sample.render(), ramp, { cols });
      for (const row of res.chars) for (const ch of row) usage.set(ch, (usage.get(ch) ?? 0) + 1);
      fig.append(res.canvas, cap);
      container.appendChild(fig);
    }
  }

  const ranked = [...usage.entries()].sort((a, b) => b[1] - a[1]);
  const total = ranked.reduce((s, [, n]) => s + n, 0);
  const stats = document.createElement('p');
  stats.className = 'status';
  stats.textContent =
    `Glyph cells: ${total} · unique glyphs used: ${ranked.length}/${ramp.length} · top used: ` +
    ranked.slice(0, 8).map(([ch, n]) => `${ch} ${Math.round((n / total) * 100)}%`).join(' · ');
  container.prepend(stats);

  status.textContent = `Done — ${ramp.length} glyphs in ramp. Check legibility.`;
}

main().catch((e) => {
  const status = document.getElementById('status')!;
  status.textContent = 'Error: ' + (e instanceof Error ? e.message : String(e));
});
