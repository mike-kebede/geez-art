# geez·art — pictures made of ፊደል (fidel)

Turn a photograph into a mosaic built entirely from Ethiopic (Ge'ez) letters.
Step back and you see a picture. Step close and you see fidel — thousands of
real glyphs, each one doing honest work carrying the image.

> The double reading: a face at arm's length, ከሩቅ ሥዕል — from far, a picture;
> from close, the letters.

It runs entirely in your browser. Zero backend, zero upload, works offline.
Your picture never leaves your device.

---

## Made with respect

The Ethiopic script — ፊደል — is not a decorative font. To the Ethiopian
Orthodox Tewahedo tradition the script is sacred: it carries the Bible, the
liturgy, centuries of manuscript illumination and church mural painting.
geez·art is a **tribute to that script**, built with care and a light touch,
not a novelty that plays with something holy.

Three things we hold to:

- The letters are treated as *art*, the way a church mural painter treats them.
  The app's color palettes are drawn from parchment grounds, deep Ethiopian
  reds, ochre golds, and muted teals — the palette of manuscript illumination.
- Nothing mocks or trivializes the script. The framing is celebration.
- If a picture includes a person, the app itself says it: **ask before
  sharing**. A portrait in fidel is still a portrait of someone real.

---

## What it does

- Drop, paste, or click-to-upload an image.
- Adjust **width** (20–400 columns), **contrast**, **edge emphasis**, color
  inversion, and per-letter **colorize**.
- Choose from four **palettes** (Mono, Parchment, Icon, Church mural) and four
  **letter sets** (full Ethiopic set, common Amharic, dense-only, light-only).
- Choose a **dithering** mode: ordered (Bayer), blue noise, or Floyd–Steinberg.
- **Export** as PNG, as copyable plain text, or as a self-contained HTML page.

The result shows a running count: `cols × rows = N letters · M-glyph ramp ·
palette`.

---

## How it works

Everything is computed client-side and deterministically. The pipeline:

1. **Font + glyph measurement.** The ramp is font-specific, so it is built at
   runtime against the bundled **Noto Sans Ethiopic Variable** (self-hosted,
   no network). Each candidate glyph is rasterized at 64 px onto a canvas, an
   alpha mask is extracted, and the fraction of the cell covered by ink is
   measured as the glyph's **density**. Missing glyphs (tofu) are detected by
   comparing each mask against the `.notdef` box signature and discarded.

2. **The density ramp.** The full Ethiopic set — the U+1200–U+135A syllabary
   (including interleaved labiovelars), punctuation U+1360–U+1368, and digits
   U+1369–U+137C — is sorted ascending by measured ink density. A final pass
   resamples it to **roughly even density steps with distinct glyphs**:
   naive nearest-density selection over-clusters (glyphs whose measured
   densities coincide all collapse onto one shape, so a single glyph gets
   repeated across wide tonal bands); even spacing spreads usage across shapes.
   Ramp presets slice this set: *common Amharic* (drops the labiovelars),
   *dense only*, *light only*.

3. **Perceptual luminance.** Each cell averages its pixels with Rec. 709
   weights (0.2126·R + 0.7152·G + 0.0722·B) for a perceptual sRGB luminance
   value in 0..1.

4. **Auto-contrast.** A 1%/99% percentile stretch maps the image's actual tonal
   range onto the full ramp, so a narrow, hazy band still fills every glyph.

5. **Edge emphasis (Sobel).** An optional edge map darkens outlines so subject
   edges pop instead of dissolving into the ramp — a big part of why faces and
   objects read clearly.

6. **Dithering.** Three modes:
   - **Ordered (Bayer)** — the default, via `@thi.ng/pixel-dither`. Posterizes
     to 128 uniform levels, each snapped to the nearest glyph density.
   - **Blue noise** — hash-jitter each density target before snapping. No
     directional artifacts, and no serial dependency (parallel/GPU-safe).
   - **Floyd–Steinberg** — classic error diffusion. Best tone fidelity, but it
     leaves the directional "worm" artifacts on smooth face/skin tones that the
     other two modes exist to avoid.

7. **Sprite-atlas blitting.** In the default (mono) draw pass, every ramp glyph
   is pre-rasterized once into an offscreen **sprite atlas** (keyed by
   ramp × cell size × ink × paper), and each cell is drawn with a single
   `drawImage` tile blit — roughly **6× faster than per-cell `fillText`**. This
   is how the top tools reach 300+ columns without freezing. A per-glyph
   `colorize` mode falls back to `fillText` with each cell's average color.
   Cell size adapts (7–14 px) so the output canvas stays bounded at high
   column counts.

8. **Input handling.** Files, drag-and-drop, and clipboard paste are read with
   EXIF orientation stripped (via `exifr` reading the raw bytes, then a manual
   orientation transform) so a phone photo is never double-rotated or
   mis-oriented; transparency is composited onto white.

9. **Export.** PNG via `canvas.toBlob` (memory-friendly), the grid as plain
   text (rows joined by newlines — best-effort alignment), and a fully
   self-contained standalone HTML page with inline styles.

The app shell itself borrows from Ethiopian classical design — a wordmark
reading ግዕዝ · geez·art, framed parchment canvases with corner ornaments, and
palettes that recolor the framed artifact, not the dark gallery chrome around it.

---

## Project layout

```
src/
  app.ts          App bootstrap + wiring (controls, export, first frame)
  render.ts       Mosaic renderer: luminance, contrast, Sobel, dither, atlas
  fonts.ts        Font loading, glyph measurement, density ramp construction
  input.ts        File / drop / paste → EXIF-corrected canvas
  export.ts       PNG / plain-text / standalone-HTML export
  palette.ts      Ethiopian classical-art palettes (pure data)
  samples.ts      Procedural demo images (face, jebena, cross, icon-classical, …)
  samples-main.ts Phase-0 legibility gallery (samples.html)
  style.css
index.html        The app page
samples.html      Phase-0 glyph legibility gallery
poc/              Early proof-of-concept work
```

## Run & build

```bash
npm install        # install dependencies
npm run dev        # Vite dev server with HMR
npm run build      # typecheck (tsc) + production build → dist/
npm run preview    # preview the production build locally
```

Requirements: Node 18+ (Vite 6). No environment variables, no API keys, no
backend. The production build in `dist/` is pure static files — deploy it
anywhere that serves static HTML (see `DEPLOY.md`).

---

## Open-source libraries

| Package | Used for |
| --- | --- |
| `@thi.ng/pixel-dither` + `@thi.ng/pixel` | ordered/Bayer dithering and pixel buffer types |
| `exifr` | reading EXIF orientation from image bytes |
| `@fontsource-variable/noto-sans-ethiopic` | self-hosted Ethiopic font (SIL OFL 1.1) |
| `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk`, `@fontsource/ibm-plex-mono` | UI fonts (self-hosted) |
| `vite` (dev) | build tooling |
| `typescript` (dev) | types + typecheck |

Exact license texts ship with each package in `node_modules/` (see
`package-lock.json` for versions). The rendered glyphs are Noto Sans Ethiopic,
by Google, under the SIL Open Font License.

---

## Parked research: shape-composition

A direction we want to explore but have deliberately left for later:
**shape-composition** — composing the *features* of an image out of specific
letters whose *shapes* echo the feature (an eye formed from ዐ, a brow from ሀ).
Today's renderer treats every glyph as tonal ink: density carries the picture,
not letter shape. Shape-composition is the obvious next leap and needs its own
measurement pass (shape similarity, not just ink density) plus a placement
solver. It's parked so the density engine stays clean and fast.

---

## A note on sharing

If your mosaic includes a recognizable person — including yourself — ask the
person before you post it. The letters are a gift; someone's face is not
yours to hand out.

_Tribute to the ፊደል, made with respect._
