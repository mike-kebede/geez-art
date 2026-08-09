---
name: geez-art
colors:
  gallery-wall: '#15110d'
  surface: '#1d1711'
  surface-raised: '#262015'
  hairline: '#3a2f24'
  paper-text: '#f1e9d9'
  mist: '#a99c83'
  gold: '#d4a24c'
  oxblood: '#7a1f14'
  oxblood-bright: '#a0341f'
  ivory-paper: '#f3ead8'
  ink: '#2a1a12'
  teal: '#1e5a55'
  primary-on: '#fdf8ee'
  white: '#ffffff'
typography:
  wordmark-fidel:
    fontFamily: Noto Sans Ethiopic Variable
    fontSize: 30px
    fontWeight: '700'
    color: gold
  wordmark-latin:
    fontFamily: Space Grotesk Variable
    fontSize: 21px
    fontWeight: '600'
    letterSpacing: 0.04em
  section-heading:
    fontFamily: Space Grotesk Variable
    fontSize: 12.5px
    fontWeight: '600'
    letterSpacing: 0.14em
    uppercase: true
  ui-label:
    fontFamily: Inter Variable
    fontSize: 13px
    fontWeight: '400'
  empty-hint:
    fontFamily: Space Grotesk Variable
    fontSize: 18px
    letterSpacing: 0.02em
  data:
    fontFamily: IBM Plex Mono
    fontSize: 11.5px
  data-small:
    fontFamily: IBM Plex Mono
    fontSize: 10px
  fidel-glyph:
    fontFamily: Noto Sans Ethiopic Variable
rounded:
  button: 6px
  dropzone: 8px
  panel: 10px
  chip: 5px
  card: 8px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  gutter: 26px
  page-x: 28px
  control-rail: 330px
---

# Design System: geez·art

**Project ID:** geez-art — "framed illuminated artifact on a dark gallery wall"

## 1. Visual Theme & Atmosphere

geez·art is a tribute to the Ethiopic script made modern. It turns photographs
into mosaics built from fidel letters — step back and it's a picture, step close
and it's thousands of real glyphs — and presents that result as a **framed
illuminated artifact** in a dark gallery. The mood is reverent, precise, and
quietly luxurious: church-mural jewel tones set inside disciplined near-black
chrome. Ethiopian manuscript illumination supplies the soul — the parchment
canvas, the oxblood-and-gold border band, the four gold corner diamonds — while
contemporary design principles supply the discipline: one signature element,
generous whitespace, hairline rules, a tight type hierarchy, and motion that
respects `prefers-reduced-motion`.

The signature device is the **frame**: an ivory canvas held by a 3px oxblood
border, a 1px inset gold hairline, and four 45° gold corner diamonds, floating on
a deep soft shadow like a work on a museum wall. Everything else stays quiet —
the room is dark (`#15110d`), the controls are flat panels with hairline borders,
and only the palette selector may recolor the *painting*, never the room. This
separation — dark disciplined chrome around a single luminous artifact — is the
whole identity.

## 2. Color Palette & Roles

### Primary Foundation

- **Gallery Wall** `#15110d` — page background; the dark room. Warm near-black,
  not neutral (leans brown).
- **Surface** `#1d1711` — control rail panels, source chip; a step off the wall.
- **Surface Raised** `#262015` — button/chip fills, select backgrounds, hover.
- **Hairline** `#3a2f24` — borders and rules on dark; warm, low-contrast.
- **Ivory Paper** `#f3ead8` — the mosaic canvas; the only light surface in the
  room. The artwork's ground (default; palette-selectable).
- **Ink** `#2a1a12` — text/glyphs on ivory; warm near-black.

### Accent & Interactive

- **Oxblood** `#7a1f14` — the deep Ethiopian red. Primary actions (Share/CTA),
  frame border. Bold, heritage, slightly austere.
- **Oxblood Bright** `#a0341f` — primary-action hover.
- **Gold** `#d4a24c` — the manuscript gold. Corner diamonds, dropzone border,
  section headings, slider/checkbox accent, focus rings, footer fidel, selected
  letter states. Used as a *system* accent across the chrome.
- **Teal** `#1e5a55` — tertiary accent within palettes; secondary notes.

### Typography & Text Hierarchy

- **Paper Text** `#f1e9d9` — primary text on dark chrome.
- **Mist** `#a99c83` — muted/secondary text on dark (status, hints, captions,
  mono data). ~6.5–6.9:1 on dark surfaces (AA).
- **Primary On** `#fdf8ee` — text on oxblood (CTA label).

### Functional States

- Focus: gold 2px `:focus-visible` outline with offset. Selected states in the
  letter picker go gold on a translucent gold wash (`rgba(212,162,76,.08)`).
- Disabled/inactive letters: 35% opacity. Family heads off: 40% opacity.

The four **artifact palettes** (recolor only the frame + canvas, not the room):

| Palette | Paper | Ink | Accent | Gold | Teal |
|---|---|---|---|---|---|
| Mono | `#ffffff` | `#111111` | `#5a5a5a` | `#8f8f8f` | `#3a3a3a` |
| Parchment | `#f3ecdd` | `#2a1a12` | `#8a2b1d` | `#b98a2f` | `#1f5c58` |
| Icon | `#e8dcc0` | `#241510` | `#a3271d` | `#c9a13a` | `#21655f` |
| Church mural | `#efe6d2` | `#24150f` | `#7a1f14` | `#cfab55` | `#1d5a52` |

## 3. Typography Rules

### Hierarchy & Weights

Four families carry the design, each with one job:

- **Noto Sans Ethiopic Variable** — the fidel, used as *brand*: the wordmark
  `ግዕዝ` at 30px/700 in gold, letter-picker glyphs (15–16px), and the canvas
  itself. The script is the identity, so it never appears as decorative clutter.
- **Space Grotesk Variable** — display: the "geez·art" wordmark (21px/600,
  `0.04em` tracking), section headings (12.5px/600, uppercase, `0.14em` tracking,
  gold, with a fading hairline rule), the empty-state hint (18px). Its geometric,
  angular forms echo the fidel's structure.
- **Inter Variable** — UI body: labels, buttons, dropzone text (13–14.5px/400).
  Quiet and legible; does the work.
- **IBM Plex Mono** — data/instrumentation: status line, slider values, glyph
  counts, source-chip label, figcaptions (9–12px, letter-spaced uppercase where
  it's a label). Mono reads as "the tool's readout."

### Spacing Principles

Body line-height 1.55 for comfortable scanning. Display faces carry the
personality through weight and tracking (tight uppercase sections, looser
wordmark) rather than large sizes — the app stays compact and precise. Small
type dominates (13px UI), which keeps the dark room from feeling loud; the
canvas is the only place where size is allowed to be dramatic.

## 4. Component Stylings

### Buttons

Radius **6px**, padding `7px 12px`, 13px, hairline border. **Primary** (Share):
solid Oxblood `#7a1f14` with `#fdf8ee` text, hover `#a0341f`. **Ghost/quiet**:
Surface Raised fill, Hairline border, text Paper Text; hover turns border+text
Gold. Transitions 0.15s on border/background/color. No heavy shadows, no
pill shapes — buttons are flat and precise.

### The Frame (signature)

The only component allowed to be ornate. Ivory Paper background, **3px Oxblood
border**, `16px` mat padding, **1px inset Gold hairline** (`box-shadow` inset),
four **12px Gold diamonds** rotated 45° and straddling the corners at `-8px`, and
a deep soft drop shadow (`0 24px 60px -18px rgba(0,0,0,.7)`). Entrance: a
0.6s fade+rise; diamonds pop in staggered 0.5s — both disabled under
reduced-motion.

### Control Rail (cards/containers)

Surface background, `1px Hairline` border, radius **10px**, `18px` horizontal
padding, sticky at top. Sections divided by hairline rules with **gold uppercase
Space Grotesk headings** and a fading gradient rule after. The source reference
is a small `5px` chip (surface, hairline border) beside the mono stat line below
the frame — it never covers the artwork.

### Dropzone

**1.5px dashed Gold** border, radius **8px**, `22px 14px` padding, centered
text. Hover/dragover: border to Gold, translucent gold wash background. Keyboard
operable (role=button, Enter/Space).

### Inputs & Forms

Selects: Surface Raised fill, Hairline border, radius 6px, Paper Text; focus
border Gold. Sliders and checkboxes: native controls tinted with
`accent-color: var(--gold)`. Labels 13px; slider values float right in mono.
All touch-friendly on mobile.

### Letter Picker (domain-specific)

A scrollable column of **radical families** — each family is an 8-codepoint block
shown as a large fidel "head" letter (toggle-all) beside its members (toggle-one).
Selected glyphs: Gold border + text on a translucent gold wash; unselected: 35%
opacity. Family head mirrors the aggregate state (all selected → gold, none →
dimmed). This is where the user literally chooses which letters compose the art.

## 5. Layout Principles

### Grid & Structure

Two-column stage: the **showcase** (artwork, flexible `minmax(0,1fr)`) and a
fixed **330px control rail** on the right, `26px` gap. Top bar spans full width:
wordmark left, mono status right. Below the frame: a centered mono stat line
(`cols × rows = N letters · M-glyph ramp · palette`). Footer carries the
respect/cultural note.

### Whitespace Strategy

Spacing clusters on a **4px rhythm** (`12/14/16/18/22/26/28`). Stage gutters
`26px` (28px at page edge), topbar `20px 28px`, frame mat `16px`. The room is
generous; the controls are compact. Mobile (≤620px) tightens gutters to 16px,
frame mat to 10px, and un-sticks the rail.

### Alignment & Visual Balance

The artwork is the visual anchor and everything centers beneath it; the control
rail is left-aligned and dense. Balance is achieved by contrast in *weight*: one
luminous centered object against disciplined surrounding chrome.

### Responsive Behavior & Touch

Desktop-first, but a real mobile pass: stack at **900px** (rail below), tighten
at **620px**. Controls go `position: static` on mobile. Canvas scales
`width:100%; height:auto`. Keyboard focus (gold), reduced-motion, and semantic
headings are respected throughout.

## 6. Design System Notes for Stitch Generation

### Language to Use

"A single framed illuminated artwork on a dark gallery wall." When prompting,
keep the **room dark and quiet** and spend color on the **artifact only**. The
frame is a 3px oxblood border + 1px inset gold hairline + four 45° gold corner
diamonds + deep soft shadow. Chrome is flat panels with hairline rules; the only
gold outside the frame is on headings, focus, and the dropzone. Never decorate
with extra fidel — the script is the brand, used sparingly.

### Color References

Room: `#15110d` wall, `#1d1711` surface, `#262015` raised, `#3a2f24` hairline.
Text: `#f1e9d9` on dark, `#a99c83` muted, `#fdf8ee` on oxblood. Accents:
Oxblood `#7a1f14` / hover `#a0341f`, Gold `#d4a24c`, Teal `#1e5a55`. Artwork:
Ivory `#f3ead8` / Ink `#2a1a12` (or the palette variants).

### Component Prompts

- *"A dark gallery wall in #15110d. In the center, a framed artwork: ivory
  canvas #f3ead8, 3px oxblood border #7a1f14, a 1px gold hairline just inside,
  four small 45° gold diamonds at the corners, a deep soft drop shadow beneath.
  The frame holds a mosaic made of Ethiopian fidel letters."*
- *"A flat control panel in #1d1711 with a hairline border #3a2f24 and a gold
  uppercase Space Grotesk section heading 'ADJUST' followed by a fading hairline
  rule. Inside: 13px Inter labels, gold-tinted sliders, surface-raised selects."*
- *"A dashed gold dropzone with centered 14px text: 'Drop an image here', a
  smaller muted mono line beneath. On hover the border brightens to gold over a
  faint gold wash."*

### Incremental Iteration

Start from the current dark-gallery direction and modernize by *disciplining*,
not adding: tighten the spacing rhythm to a strict 4px/8px grid, raise button
touch targets to ≥40px, reduce the control rail's visual noise (fewer hairline
rules), and let the empty state carry more presence (larger hint, a hint of the
script). Keep the frame signature intact — it is the differentiator. If asked
for "more modern," the levers are: bigger type hierarchy, fewer borders, one
accent instead of three, and motion that reveals rather than decorates.
