# Maleda — Ethiopian Classical Design Language

An infusion of Ethiopian culture into modern design.
Owned by Keydama Software.

## What's in this package

- **DESIGN-LANGUAGE.md** — the canonical definition (principles, palette, type, layout, signature).
- **DESIGN-GUIDE.md** / **DESIGN-GUIDE-sections.md** — the assembled guide.
- **tokens.css** — the single source of truth for color/motion tokens.
- **specs/*.md** — the four spec volumes (color theory, type pairing, characters, deep-dive craft).
- **expressions** (variants/) — the Editor (primary) and Gallery (salvaged), as self-contained HTML
  plus the production build (variants/web/editor/) and the source templates.
- **motifs/** — tibeb-band (the woven border/spine/lozenge) and mesob-motif (the woven-star mark),
  each with its generator script.
- **fonts/subset/** — the built woff2 faces (Bela Bereka + Noto Sans Ethiopic 400/700, ethiopic/latin).
- **images/** — the built WebP assets and the manuscript reference scans.
- **references/** — the mood-board source images (manuscript, tibeb/netela, telegram inspo).
- **build_variants.py / build_web.py / build_subset.py** — the build pipeline.
- **design-elements-review.html** — a one-page review of every element.

## Type system

- Bela Bereka — Amharic display (Ge'ez only; English display falls to Noto 700).
- Noto Sans Ethiopic — body + data (tabular figures).

## Motifs

- Mesob (woven star) — favicon + loading spinner.
- Tibeb spine — footer band.
- Tibeb lozenge — nav separators + empty/error states.
- Haräg interlace — reserved for illuminated margins.
- Eye-dot — live-status gaze.

## Rebuild

`python build_variants.py` (self-contained) and `python build_web.py` (externalized production).
