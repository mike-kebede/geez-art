# geez-art — Architecture

> Turn photos and videos into mosaics of Ethiopic (Ge'ez) fidel letters.
> 100% client-side, zero backend. Algorithmic mosaic + an Ethiopian classical-art
> design layer (palettes), a live video filter, and a branded share loop.

Stack: TypeScript + Vite + vanilla Canvas 2D, one static `index.html`. No framework.
The full render pipeline is deterministic given the same source pixels and options.

---

## 1. Architecture diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              index.html                                 │
│   static shell · every control · /src/style.css · fontsource CSS        │
│   <script type="module" src="/src/app.ts">                              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │  DOM events + imports
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             src/app.ts                                  │
│   bootstrap + wiring. Owns state: ramp, source, currentPalette,         │
│   selectedCps, videoHandle, lastResult, zoom.                           │
│   queueRender() (120 ms debounce) · renderSource() · doShare()          │
│   custom letter picker · diagnostic hooks (window.__ramp etc.)          │
└───┬──────────┬────────────┬────────────┬────────────┬──────────────┬────┘
    │          │            │            │            │              │
    ▼          ▼            ▼            ▼            ▼              ▼
┌─────────┐┌─────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────────┐
│ input   ││ fonts   ││ render   ││ video    ││ export   ││ palette      │
│ (files  ││ (font + ││ (mosaic  ││ (loop +  ││ (PNG/    ││ (pure design │
│ →opaque ││  ramp)  ││  pipeline││  record) ││  text/   ││  data, no    │
│ canvas) ││         ││  + cache)││          ││  HTML/   ││  DOM)        │
└───┬─────┘└───┬─────┘└───┬──────┘└───┬──────┘└───┬──────┘└──────────────┘
    │          │          │           │           │
    │ lazy     │          │           │           │
    ▼          │          │           │           ▼
  [exifr]      │          │           │         [navigator.share]      ┌────────────┐
  (dynamic     │          │           │         [navigator.clipboard]  │ samples    │
   import)     │          │           │         [blob download]        │ (procedural│
               │          │           ▼                                │  demo      │
               │          │         [MediaRecorder]  src/app.ts ─────▶ │  canvases, │
               │          │         [captureStream]                    │  "Try an   │
               │          ▼                                            │  example") │
               │        [@thi.ng/pixel-dither]                         └────────────┘
               │        [@thi.ng/pixel]        render.ts ── imports ──▶ fonts.ts (FONT)
               ▼                                                       export.ts ─▶ (FONT)
         [document.fonts.load]
         [fontsource: Noto Sans Ethiopic Variable, Inter]
```

**Dependency notes**

- `app.ts` is the only module that touches the DOM controls. Everything else
  is a pure-ish library over canvases and data.
- `fonts.ts` is depended on by both `render.ts` (exports `FONT`, `GlyphInfo`)
  and `export.ts` (exports `FONT`).
- `input.ts` pulls in **exifr** only via `await import('exifr')` (lazy) so it
  stays out of the eager bundle.
- `video.ts` uses the platform `MediaRecorder` + `canvas.captureStream`.
- `render.ts` uses **@thi.ng/pixel-dither** (`orderedDither`) and
  **@thi.ng/pixel** (`IntBuffer`, `GRAY8`) for the ordered/Bayer mode only;
  the scatter and Floyd–Steinberg paths are hand-rolled.
- Google Fonts arrive through the `@fontsource-variable/*` CSS imports in
  `app.ts`; `loadEthiopicFont()` in `fonts.ts` then force-loads the face via
  `document.fonts.load` before measuring glyphs.

```
TEST LAYER

  tests/e2e.spec.ts  ── 27 Playwright tests
     │  drives the real page against the Vite dev server
     │  interacts through DOM ids (#file, #charset, #mosaic, …)
     │  asserts on diagnostics exposed by app.ts:
     │     window.__ramp / __lastChars / __selectedCps / __commonSet
     │  beforeAll() generates tests/fixtures/sample-video.webm by
     │     recording a real canvas with MediaRecorder in a browser
     ▼
   index.html · app.ts · render.ts · fonts.ts · input.ts · video.ts
```

---

## 2. The core pipeline

All in `src/render.ts`, `renderMosaic(source, ramp, opts)`.

```
 source canvas  (photo frame or video frame, always opaque)
   │
   ▼
 [1] PER-CELL SAMPLE + AUTO-CONTRAST            ── getSourcePass()
     • each output cell is downsampled over its source region
     • perceptual (sRGB) luminance per cell:
           lum = (0.2126·R + 0.7152·G + 0.0722·B) / 255   (averaged)
     • per-cell average color retained for the "colorize" pass
     • auto-contrast: percentile stretch on the luminance grid —
           p1 = 1st percentile, p99 = 99th percentile
           stretched = clamp01((lum − p1) / (p99 − p1))
       (stretch collapses to identity when p99 − p1 ≤ 0.04)
     ══ THE PER-SOURCE CACHE (see below) ══
   │
   ▼
 [2] SOBEL EDGE MAP                             (only when edge > 0)
     • 3×3 Sobel on the STRETCHED grid, so real gradients survive
     • magnitude √(gx² + gy²) / 1.2, clamped to 0..1
       (1.2 is an empirically tuned constant that keeps smooth gradients
        in a useful range without blowing out flat regions)
   │
   ▼
 [3] DENSITY TARGET
     • invert?   v = 1 − v
     • contrast: v = clamp01((v − 0.5)·contrast + 0.5)   (S-curve around mid-gray)
     • density:  d = 1 − v                    (ink density ≈ darkness)
     • normalize: work = clamp01((d − dMin)/span + edgeMap·edge)
       where dMin/span come from ramp[0] / ramp[last] measured density
   │
   ▼
 [4] DITHER  (one of three, per the Texture select)
     • ordered — @thi.ng/pixel-dither orderedDither (Bayer), posterized to
                 128 levels, then snapped to a glyph
     • scatter — deterministic integer-hash white-noise jitter of each cell's
                 density target (± half a ramp step) before snapping.
                 (Honestly labeled "scatter" — it is NOT true blue noise.)
     • fs      — hand-rolled Floyd–Steinberg, kernels 7/16 · 3/16 · 5/16 · 1/16.
                 Hand-rolled on purpose: @thi.ng's diffusion reaches only ~2
                 levels, which cannot quantize to a non-uniform ~200-glyph
                 density ramp.
   │
   ▼
 [5] VARIETY-AWARE GLYPH SELECTION             ── pickNorm()
     • find the nearest-density glyph, then widen to a ±VARIETY_WINDOW
       (0.05) density window
     • pick one deterministically from the window using cell position
       (hashNoise(x·0.1337, y·0.9517))
     • this is the "don't collapse onto one letter" knob — flat areas show
       a MIX of glyphs instead of the same shape repeated
   │
   ▼
 [6] DRAW PASS
     • mono  — pre-rasterized glyph sprite atlas (ensureAtlas), one drawImage
               blit per cell. ≈6× faster than per-cell fillText, which is what
               makes 300+ columns interactive. Atlas cache key:
               `${ramp.length}:${cellPx}:${ink}:${paper}`.
     • colorize — per-cell fillText, each glyph drawn in its source cell's
               average RGB color.
   │
   ▼
 MosaicResult { canvas, chars: string[][], cols, rows }
```

Output sizing: `rows = round((sH/sW) · cols · cellAR)` where `cellAR = avgGlyphWidth/64`
(glyph cells are wider than tall); `cellPx = clamp(7, round(2800/cols), 14)` so high
column counts stay within a bounded canvas.

**The per-source cache and its invalidation**

- `getSourcePass()` caches the result of stage [1] — the per-cell luminance
  grid, the auto-contrast stretch, and the per-cell average colors — keyed by
  `"${sourceId}:${cols}:${rows}"`. A `WeakMap` maps each source canvas to a
  numeric id.
- This is the whole point of the cache: changing **mapping-only** controls
  (contrast, edge, dither, palette, invert, colorize) reuses the source pass
  instead of re-sampling the image and re-sorting.
- Memory bound: when the cache grows past 12 entries it is fully cleared.
- **Invalidation:** `invalidateSource(source)` deletes every key whose prefix
  is `"${sourceId}:"`. `app.ts` calls it on **every video frame** because the
  video loop reuses one frame canvas whose pixels change each tick — without
  this, the cache would return stale luminance data and the filter would freeze
  on the first frame. Photo sources are set once and never invalidated (a new
  photo gets a fresh source id).

---

## 3. Input flows

**Photo — file / drag-drop / paste → opaque, EXIF-correct canvas**
(`src/input.ts` + `handlePickedFile` in `app.ts`)

```
 file input  ──┐
 drag-drop   ──┼──▶ handlePickedFile(file)
 paste       ──┘        │
                        │ file.type.startsWith('video/') ? → video flow : ↓
                        ▼
                 imageFileToCanvas(file)
                   │  Promise.all([
                   │    exifr.orientation(file).catch(() => undefined),   (lazy import)
                   │    decodeRaw(file)
                   │  ])
                   ▼
            decodeRaw: createImageBitmap(blob, { imageOrientation: 'none' })
                       → fallback createImageBitmap(blob)
                       → fallback loadViaImg(<img> blob URL)
                   ▼
            orientAndComposite(bitmap, orientation)
                   • canvas w×h swapped when orientation ∈ 5..8
                   • fill white FIRST (alpha composited onto white → the
                     renderer always sees an opaque source)
                   • applyOrientation() — manual canvas transform for EXIF 1–8
                   ▼
            setSource(canvas) → queueRender()   (120 ms debounce)
```

**EXIF fallbacks, deliberately layered**

1. `exifr.orientation` failure → treated as upright (orientation `undefined` → 1).
   An EXIF read error must never sink a valid image.
2. `createImageBitmap` with `imageOrientation: 'none'` failure → plain
   `createImageBitmap` → `<img>` decode. A file the bitmap path rejects (e.g.
   unusual encodings) still gets a chance.
3. The manual transform makes orientation deterministic — no reliance on a
   browser's auto-rotate, so the iOS Safari 13.4+ / Chrome 81+ double-rotation
   quirk cannot occur.

**Video — the live fidel filter** (`src/video.ts` + `handleVideoFile`)

```
 handleVideoFile(file)
   │  URL.createObjectURL(file) · <video muted loop playsInline>
   │  await 'loadedmetadata'
   ▼
 startVideoLoop(video, onFrame, fps = 12)
   │  requestAnimationFrame tick: throttled to ~12 fps
   │  draws each frame into ONE reused frame canvas
   │  calls onFrame(srcCanvas) per frame
   ▼
 app.ts onFrame:  invalidateSource(srcCanvas)   // pixels changed → drop cached pass
                  renderSource(srcCanvas)       // immediate, NO debounce (live)
```

The loop is throttled so the filter stays smooth without melting the CPU;
`togglePlay()` pauses/resumes, `stop()` tears down the rAF loop and the video.
Video mode never runs a photo through `setSource`/debounce — every frame renders
immediately.

---

## 4. Letter-selection flow

The alphabet is measured, not hard-coded by name: `fonts.ts` renders each glyph
to an offscreen canvas at 64 px, builds an ink-density alpha mask (density =
ink-covered fraction), and rejects "tofu" glyphs (unassigned slots / hollow-box
`.notdef` signatures). The full measured set is U+1200–U+135A (syllabary,
skipping unassigned/combining slots) plus punctuation U+1360–U+1368 plus
digits/numbers U+1369–U+137C, sorted ascending by density (lightest first).

**Ramp presets** (the Alphabet select; `RampPreset = 'common' | 'all' | 'dense' | 'light'`):

- **Common Amharic** — the EXACT standard fidel: 34 radicals × 7 vowel orders
  = 238 codepoints. `FIDEL_BASES` lists the 1st-order base of each radical in
  traditional order; `COMMON_AMHARIC` is `{ base, base+1, …, base+6 }` for each.
  Nothing outside this set counts as "common Amharic" — no labiovelars
  (ቈ ኈ ኰ …), no digits/punctuation, no stray slots.
- **Full set** — everything that passed tofu filtering.
- **Dense only** — glyphs whose density ≥ the measured median.
- **Light only** — glyphs whose density ≤ the measured median.

`buildRamp(preset)` slices the measured set then passes it through `evenRamp()`:
resample the density-sorted set to roughly **even density steps with distinct
glyphs** (dedupe by codepoint). Even spacing is what prevents one glyph with a
common density value (e.g. ጨ) from flooding wide tonal bands. The ramp is always
sorted lightest → darkest, which the renderer relies on (`dMin = ramp[0]`).

**The custom picker** (`buildPicker` / `toggleFamily` / `toggleLetter`):

- The grid groups glyphs by radical **family** — `floor(cp / 8)` — since each
  family spans an 8-codepoint block. A big letter tile toggles the whole family;
  a `+` expands individual-letter toggles.
- First time "custom" is chosen (`customTouched === false`) the selection starts
  from a clean slate — **only the letters you tap get used**; after that the
  selection persists across visits to the custom tab.
- `pickAll` / `pickNone` set or clear the whole selection.
- A live `#rampPreview` strip always mirrors the letters actually in use.
- `applyCustomRamp()` runs the selected glyphs through `rampFromGlyphs()`
  (also `evenRamp`), so the ramp is **EXACTLY the selected letters** — even
  spacing, but never a glyph from outside the selection. This is the
  exact-selection rule the tests assert (see §6).

**Randomize** (`mixItUp`, the "Randomize letters" button): each glyph is included
with probability 0.6, floored at 12 glyphs, the selection is switched to the
custom mode, and the mosaic re-renders. Clicking again yields a fresh subset.

---

## 5. Export / share flow

All in `src/export.ts`, wired from `app.ts`.

```
                          ┌─ Download PNG   downloadCanvasPNG → canvasToBlob
        Export buttons ────┼─ Copy as text  copyText → gridToText →
        (Export group)     │                navigator.clipboard.writeText
                          │                (fallbackCopy: hidden <textarea> + execCommand)
                          └─ Save as HTML  exportHTML → self-contained <pre> document
                                             (paper/ink colors, Ethiopic font stack,
                                              minimal <head>; saved as geez-art.html)
        Video download (dlVideo, video mode only):
                          recordCanvas(mosaicCanvas, seconds=4, fps=12)
                            → canvas.captureStream(fps)
                            → MediaRecorder, MIME 'video/webm' if supported
                              (else platform default → MP4 on iOS/Safari)
                            → blob 'video/webm' or 'video/mp4' → downloadBlob
```

**PNG** uses `canvas.toBlob` (async, memory-friendly) rather than `toDataURL`,
then a Blob URL download.

**The branded share image** (`makeShareImage`):

```
 mosaic canvas
   │  + a brand band appended below, height = clamp(44, 0.045·width, 84) px
   ▼
 dark band (#15110d) with a 2 px gold hairline (#d9a441) at the top of the band
 wordmark:  ግዕዝ in Noto Sans Ethiopic (gold) + "geez·art" in Inter
 CTA right-aligned in mono:  "make yours at geez-art.pages.dev"
```

`SITE_URL = 'geez-art.pages.dev'` is stamped in `app.ts`; the band scales with
mosaic width.

**The share sheet** (`shareCanvas`) and the viral loop:

```
 doShare()
   │  makeShareImage(mosaic, SITE_URL)
   ▼
 shareCanvas(branded, text)
   │  canvasToBlob → File('image/png')
   │  navigator.canShare({ files }) && navigator.share ?
   │     share({ files, text })  → 'shared'
   │     └ AbortError (user closed the sheet) → 'shared'  (not an error)
   │     └ other error → downloadCanvasPNG fallback → 'downloaded'
   │  no canShare/share support → downloadCanvasPNG → 'downloaded'
   ▼
 flash('Shared' | 'Saved — send it on WhatsApp or Telegram')
```

**Viral loop:** every shared PNG carries the brand band with "make yours at
geez-art.pages.dev". Whoever receives the image sees the app name and URL, so
each share recruits a new user who can make and share their own mosaic. The
native share sheet surfaces that image to WhatsApp/Telegram/Facebook in one tap
on mobile; everywhere else it degrades to a plain download. Both Share buttons
(`#share`, `#shareTop`) stay disabled until a mosaic exists.

---

## 6. Test suite (27 e2e tests)

`tests/e2e.spec.ts` — Playwright against the real page. `beforeAll()` generates
`tests/fixtures/sample-video.webm` once, by recording a small animated canvas
with `MediaRecorder` inside a real browser. `waitReady()` blocks until the app
status line reads "Ready", "Setup error", or "Something went wrong".

The tests verify the flows end-to-end by poking DOM controls and reading the
diagnostics `app.ts` exposes on `window` (`__ramp`, `__lastChars`,
`__selectedCps`, `__commonSet`), asserting on canvas bytes via `toDataURL()`
when a control must change the output, and failing on any console/page error:

- **Boot & no console errors:** loads to Ready, empty state visible.
- **Photo flow:** uploading `sample.png` renders a mosaic, updates the stat
  line, shows the source chip.
- **Sliders/controls actually change output:** contrast, edges, width,
  palette, invert, colorize, each dither/texture mode (scatter/ordered/fs),
  randomize.
- **Letter selection:** custom picker opens; family toggle re-renders; ramp
  length mirrors the live preview strip; pick-all/pick-none; **exact-selection
  rule** (select exactly 3 letters → `__ramp` is exactly those 3 and every glyph
  in the mosaic is one of them); **Common Amharic purity** (with ≥100 letters,
  every ramp codepoint and every used glyph is inside `__commonSet`, none
  outside); dense/light presets render.
- **Share/export:** header Share disabled until a mosaic exists, enabled after;
  PNG download produces a file named `geez-art*`; copy-as-text puts a
  fidel-letter grid on the clipboard (`/[ሀ-፿]/`).
- **Video flow:** play/pause toggle; a video runs through the filter and the
  mosaic actually animates (two samples 500 ms apart differ — proving the
  per-source cache is invalidated per frame).
- **Misc UX:** zoom in / reset; "Try an example" loads a mosaic with an
  accessible `aria-label`; Clear resets to the zero-sized empty state.

Note: the app deliberately exposes the `window.__*` diagnostics as a test
contract — they are part of the public surface for the suite, not just debug
leftovers.
