# Tibeb band — incorporate this

Agent notes. This folder is a **motif candidate** for the Ethiopian Classical Design Language. It is **not** the haräg braid and **not** the mesob coil (those live in `_motifs.json` / `motif-preview.html` cards 1–2).

Canonical laws: `../../DESIGN-LANGUAGE.md`, tokens: `../../tokens.css`. Preview: `preview.html`.

## What it is

Netela/tibeb **end-strip**, modernized: nested lozenge + saltire + paired hairline selvedge. Geometry only — no beads, no dots, no 45° hash.

Pigments (already baked into the SVGs; keep them in lockstep with tokens):

| Role | Token | Hex |
|---|---|---|
| Ground | `--ink-900` | `#15090B` |
| Line / gold | `--gold-500` | `#C9962E` |
| Fill | `--umber-700` | `#573928` |

Do not recolor to cream/terracotta from the source photo. Do not add madder/verdigris/saffron here (motion triad only — never a static motif).

## What to use when

Link `pattern.css` (sibling SVGs must stay next to it) **or** `pattern.inline.css` for a single-file drop-in.

| Need | Class | Default size |
|---|---|---|
| Vertical band (sidebar, panel edge) | `.pattern-marker` | `--pattern-w: 40px` |
| Quiet vertical delineator | `.pattern-spine` | `--pattern-spine-w: 24px` |
| Full seven-column strip | `.pattern-full` | ~2.5 × `--pattern-w` |
| Horizontal section break | `hr.pattern-rule` | height `--pattern-w` |
| Horizontal spine (independent) | `hr.pattern-rule-spine` | height `--pattern-spine-w` |
| Four-sided frame on an ink panel | `.pattern-frame` | `--pattern-w`; `--sm` 32px / `--lg` 80px |

Prefer **spine** on Editor (hairline, type-led). Prefer **marker** or **frame** on Gallery as the mount around the one painting. Never both frame and haräg lattice on the same edge.

## Restraint (non-negotiable)

From DESIGN-LANGUAGE.md: one memorable thing per view; gold ≤ ~3%; no classical-motif carpeting.

- **One** tibeb chrome moment per viewport (one rule, or one spine, or one frame — not stacked).
- Not a background texture. Not a wallpaper. Not a logo / favicon (mesob coil owns the mark slot).
- Not a substitute for the eye-dot, weave loader, or Ge'ez chips.
- Does not replace haräg on manuscript *text* frames unless a human explicitly swaps it. Haräg = interlace for illuminated margins. Tibeb = woven end-band for separators and ink-panel mounts.
- Corner rivet lozenge (specs-deep-dive) stays the Grade 2/3 *frame corner* moment. Do not also sprinkle these nested lozenges as repeating gems.

## How to wire it

1. Copy or `@import` this folder’s CSS from the expression (`variants/…` or `taste-test-news-article.html`). Relative URLs in `pattern.css` resolve against the CSS file — keep the six SVGs beside it, or use `pattern.inline.css`.
2. Map CSS variables to tokens if the host page already defines them:

```css
.pattern-frame, .pattern-marker, .pattern-rule, .pattern-rule-spine, .pattern-spine {
  --pattern-ink: var(--ink-900);
  --pattern-gold: var(--gold-500);
  --pattern-umber: var(--umber-700);
}
```

   SVG fills are still hardcoded hex. If tokens change, rerun `python generate.py` in this folder after editing `INK` / `GOLD` / `UMBER` at the top of `generate.py`.
3. Honor `prefers-reduced-motion` — this motif is static; do not animate the band.
4. Dark/ink panels only for the full-color tiles (they assume `#15090B` ground). Do not drop the ink-filled SVG on parchment without a new parchment variant.

## Technical — do not “fix” these

- Axis-aligned rails are **1px**, on `.5` coordinates, `shape-rendering="crispEdges"`. Fractional strokes (1.15, 1.5, 1.75) alias and look wavy. Do not reintroduce them.
- Horizontal tiles are **drawn in place** (`pattern-slim-h.svg`, `pattern-spine-h.svg`). Do not `rotate()` a vertical tile for the rule — that broke edge joins and made rails wavy.
- Integer viewBoxes: slim `80×96`, horizontal `96×80` (ratio 1.2), spine `24×24`, frame `256×256`, slice `80`.
- Frame uses `border-image-repeat: repeat` (not `round`) and concentric rects so the selvedge is one joined line.
- Regenerate with `python generate.py`. Do not hand-edit the SVG paths unless you then change the generator — they will be overwritten.

## Files

| File | Role |
|---|---|
| `generate.py` | Source of truth |
| `pattern.css` | Classes + `url(*.svg)` |
| `pattern.inline.css` | Same classes, data-URI SVGs |
| `pattern-slim.svg` / `-h.svg` | Marker / rule tile |
| `pattern-spine.svg` / `-h.svg` | Spine tile |
| `pattern-full.svg` | Marker + spine + marker |
| `pattern-frame.svg` | 9-slice frame |
| `preview.html` | Specimen for this motif only |

Catalog hook: `_motifs.json` entry “Tibeb Band (nested lozenge + saltire)”; specimen card 3 in `../../motif-preview.html`.
