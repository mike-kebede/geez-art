# Ethiopian Classical Design Language

> **Maleda — an infusion of Ethiopian culture into modern design.**
> A design language for Ethiopian-first digital products, applied across apps. Modern-minimal container; Ethiopian classical art as the driving force.
> **Owned by Keydama Software.**

Living companion to the WorkFlowy mood board (*Ethiopian Classical Design Language* →). Canonical document: this file.

**This language defines underlying principles, not one look.** Sections 1–6 are the shared laws (principles, palette, type, layout, signature, restraint) that hold on every surface. Section 8 defines the expressions the language ships — **the Editor** (primary) and **Gallery** (salvaged). Terminal and Manuscript were explored and archived (`archive/`). One token source, zero drift.

---

## 1. Principles

1. **Space is a feature** — generous whitespace; every view breathes. Nothing competes.
2. **Ethiopian soul, modern bones** — structure is clean minimal; the palette, line, and motifs are drawn from Ethiopian classical art.
3. **Restraint by default** — the tradition's richness lives in deliberate places, not everywhere.
4. **One memorable thing** — a single signature element per view; everything else stays quiet.
5. **Order through proportion** — one consistent scale, classical thinking.
6. **Drawn from the source** — every color and motif traces to Ethiopian classical art, modernized but never diluted into decoration.
7. **Amharic first** — አማርኛ is the native language of the product; English is the translation layer, never the voice. The type and copy are designed for the Amharic reader first.

## 2. Palette

Every value extracted programmatically from reference images (see Mood Board). **Ground**: dark umber-black first; light parchment-gold second. Accent colors used only in the 10%.

**The canonical token source is `tokens.css`** in this folder — the single file all expressions derive from (the Editor specimen is built from it). If a value changes, it changes there.

| Family | Token | Hex | From |
|---|---|---|---|
| Ground · light | parchment white | `#FCF9F3` | ref C / ref A |
| | parchment | `#F5E9D1` | ref C |
| | deep parchment | `#E6D6BC` | ref C / manuscript |
| Ink · dark | umber black | `#15090B` | manuscript (dominant) |
| | deep black | `#0D0508` | manuscript |
| Secondary | mid umber | `#6C523D` | ceiling angels (flesh) |
| | umber | `#573928` | manuscript |
| | dark umber | `#45311F` | mural |
| Highlight · gold | parchment gold | `#F8E6B8` | manuscript |
| | honey gold | `#E5C193` | ref C/D |
| | gold (deep) | `#C9962E` | manuscript — the illumination gold |
| Accent · 10% | madder red | `#A62F1E` | market (cleaned + lifted to manuscript red from `#440709`) |
| | verdigris | `#1E8A5E` | market (cleaned + lifted from `#061F1C`) |
| | saffron | `#E8A33D` | manuscript yellow |
| | ochre-orange | `#E46F30` | ref A |
| | indigo | `#181B2D` | ref B |

**Role mapping** (terminal semantics): verdigris = positive / tick-up · madder red = negative / alert · saffron = highlight · ochre-orange = CTA · parchment gold = labels & hairlines. On dark panels use the lightened variants (verdigris `#7BC9A8`, red `#E8836F`).

## 3. Type system

| Role | Face | Weights | License |
|---|---|---|---|
| Display — titles | **Bela Bereka** | Bold 700 | OFL |
| Mono — data / rates / tables / Ge'ez | **Noto Sans Ethiopic** | Regular (+ Nerd Font) | OFL |
| Sans — body / UI | **Noto Sans Ethiopic** | Variable 100–900 (Ethiopic + Latin) | OFL |

> **HH Lemd Mono was dropped.** font.et lists no license, no designer, no publisher for it — it cannot legally ship. Noto Sans Ethiopic (OFL, Latin from Noto Sans Mono + full Ge'ez) is the mono voice.

Rules: **Amharic-first** — Bela Bereka is the Amharic display voice (headlines, pull-quotes, hero numbers, kickers), used with restraint. Bela has **no Latin glyphs** (verified), so **English display uses Noto Sans Ethiopic 700** — one voice per language; the identity's character is carried by the Amharic fidäl. Mono for anything columnar (rates, tickers, tables, timestamps). Noto Sans Ethiopic is the quiet base for body and UI copy in both scripts. Ge'ez text may render in any Ge'ez-capable face; Noto Sans Ethiopic owns mono Ge'ez.

## 4. Layout — the gallery

- **Walls**: parchment-light ground, generous open space.
- **Paintings**: deep umber-black panels where dense data lives (rates, tables, terminal grids) — the app's focal points, framed by a thin gold mount rule.
- **Illuminated margins**: text blocks sit inside manuscript-style framing — a thin gold frame with red / green / gold / saffron bands and corner diamonds at the top and bottom edges, and an ornamental headband above the article. The manuscript's illuminated borders, modernized to hairlines.
- **Hairlines**: thin rules in umber/ochre; cross-lattice as section dividers.
- **Proportion**: spacing and scale from one consistent ratio; type scale stays on a strict ladder.

## 5. Signature — expressed as design elements, not a logo

The character of the language is carried by **design elements** — type, texture, line, color, and live data indicators — not by a logo symbol. The signature is a **motif system** of four elements, each with a fixed role and a fixed place:

1. **The tibeb spine** — the recurring woven accent: a single gold hairline with a nested lozenge, reserved for the footer band and nav separators. One quiet recurrence; never a full border, never a repeating pattern.
2. **The mesob** — the mark: the woven-star / coiled basket mark, used as the favicon. It is the identity's one compact symbol; it does not repeat across the surface.
3. **The haräg interlace** — the interlace for illuminated manuscript margins, held in reserve: brought out only where the layout calls for the manuscript frame around text.
4. **The live eye-dot** — the "gaze" of the terminal as a data element: a small status dot. Parchment gold = live · oxblood = alert · pulse = loading · and where a number belongs, it becomes the readout. One moment per view; never a mascot, never multiplied.

The **tilet diamond** — the earlier solid lozenge motif — is **retired**, superseded by the tibeb spine's nested lozenge and the mesob.

The "one memorable thing" is how the eye-dot watches the data — the gaze of the product itself.

**Motion** — the language moves as deliberately as it sits: the **weave loader** (the three manuscript pigments — verdigris · saffron · madder — as triangles orbiting into a woven diamond) for loading screens; the **flowing ticker** (continuous scroll) as the live heartbeat; the **frame inscription** (the manuscript border easing in on load); and the eye-dot's states. Every animation respects `prefers-reduced-motion`.

## 6. Do / Don't

- **Do** let the umber-black panels carry the data density; keep the walls open.
- **Do** use mono for numbers and columns; tabular figures everywhere digits line up.
- **Do** let the live eye-dot hold one moment per view.
- **Do** keep the tibeb spine to the footer band and nav separators — one quiet recurrence, never a full border.
- **Don't** scatter the accent colors — they live in the 10%.
- **Don't** let the mesob leave the favicon — it is the mark, not a repeating motif.
- **Don't** turn classical motifs into decoration (no Greek-key-style carpeting; restraint is principle 3).
- **Don't** render a crucifix or Latin cross; the interlace stays abstract-interlaced.
- **Don't** turn the eye-dot into a mascot or logo, or multiply it.

## 7. Status

- Principles: draft — awaiting sign-off.
- HH Lemd Mono: **dropped** — font.et lists no license/designer/publisher, so it cannot ship. Noto Sans Ethiopic (OFL) is the mono voice.
- Palette: converged; accent values cleaned for use (see table).
- Rendering: four expressions built as self-contained pages in `variants/` (gallery.html · terminal.html · manuscript.html · editor.html). The canonical specimen is `taste-test-news-article.html`.

## 8. The expressions

Two expressions, both built from `tokens.css`.

**★ Editor — primary.** Near-white newsroom, type-led, hairline rules; the Ethiopian character carried by type and color alone. Amharic-first, bilingual-pure, a three-view loop (article · rates board · news index). The canonical surface — `taste-test-news-article.html`.

**Gallery — salvaged.** Open parchment, one gold headpiece hairline, the umber-black rates panel hung as the **single framed painting** (gold mount + inner mat); rubrication red for urgency. Museum-calm. `variants/gallery.html`.

Terminal and Manuscript were explored as alternative modes and **archived** (`archive/`).
