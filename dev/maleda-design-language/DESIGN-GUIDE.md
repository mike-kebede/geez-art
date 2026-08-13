# Ethiopian Classical Design Language — The Design Guide

> **Maleda — an infusion of Ethiopian culture into modern design.**
> The identity and executable system for an **Amharic-first** (አማርኛ primary, English the translation layer) news · exchange-rate · information terminal. Modern-minimal container; Ethiopian classical art as the driving force.
> **Owned by Keydama Software.**

*Canonical document: `DESIGN-LANGUAGE.md`. This guide is the assembled, editor-approved whole: identity, laws, craft, characters, expressions, and the image catalog behind every color and motif.*

---

## Table of Contents

- **Intro** — The identity, and how it was built
- **1. Identity & Story** — the thesis, the gallery metaphor, the sources
- **2. Principles** — six laws, and the Do / Don't
- **3. Palette** — tokens, the wheel grammar, weight, harmony law, themes
- **4. Type** — four faces, two ladders, the pairing chart, numeral grammar
- **5. Layout & Manuscript Transition Cues** — the frame system, interlace, grades, and the transition-cue system (prominent)
- **6. Signature & Motion** — the five design elements, the weave loader, motion law
- **7. Expressions** — Editor · Gallery
- **8. Characters** — the Meskroch, the Painted Field, the world
- **9. References** — the image catalog
- **10. Sources** — every attribution, consolidated

---

## Intro — The identity, and how it was built

This language is **one idea with a strict grammar**: a modern-minimal information terminal — a content surface for a bilingual Ethiopian audience — whose walls, frames, pigments, and figures are all drawn from Ethiopian classical painting. The gallery is the interface: **parchment-light walls hold the calm; umber-black panels hold the data as paintings; and the paintings are content.**

The name and the mark are the same sentence in two scripts — **ማለዳ · Maleda** ("daybreak"), the permanent bilingual wordmark, set as Noto Sans Ethiopic Ge'ez beside a calligraphic Latin lockup: *one utterance in two scripts, the single legitimate exception to the display-mixing ban.* There is **no logo**. The identity is carried entirely by design elements — type, pigment, line, texture, and a single watching eye-dot.

### How it was built

1. **Mood board** — a WorkFlowy tree (*Ethiopian Classical Design Language →*) collecting Ethiopian classical references: 15th-century processional crosses, Gospel manuscripts, illuminated haräg headpieces, Debre Berhan Selassie ceiling angels, diptych and triptych icons, and the coffee ceremony.
2. **Palette extraction** — every color was **extracted programmatically** from the reference images (`references/ms-18th-century.jpg`, `references/ms-gospels-harag.jpg`, `references/ms-geez-letterform.jpg`, and the Commons catalog), then cleaned and lifted into usable tokens.
3. **Principles** — six laws were drafted from the mood board and the client's brief, then sign-off was tracked in WorkFlowy.
4. **Token system** — the 5-step pigment scales, neutrals, and the semantic state mapping, all blended by one law (toward parchment 300 / ink 900, never white/black).
5. **Signature** — three candidate signature marks were compared; the winner was **design elements, not a logo**, with the **live eye-dot** as "the gaze of the terminal."
6. **Deep-dive fan-outs** — fifteen-agent fan-outs produced four executable spec volumes: **craft** (frames, motion, color tokens, typography, live data), **color harmony & theory** (wheel grammar, weight, CVD law), **type pairing** (faces, ladders, the pairing chart), and **characters & illustration** (the Meskroch canon, scenes, the painted world).
7. **Specimens** — a canonical taste-test article (`taste-test-news-article.html`, == `variants/editor.html`) plus the **Gallery** expression (`variants/gallery.html`), built as self-contained pages. Terminal · Manuscript were explored and **archived** (`archive/`).
8. **Audit** — a 12-persona, 13-agent audit (`audit-report.md`) verified the specs are executable and self-auditing, and produced a bounded fix list. This guide folds the audit's decisions into the system so the laws and the shipped artifacts agree.

---

## 1. Identity & Story

### The thesis

> **Paintings are content.**

The terminal is a gallery. The viewport is a wall. Every card is a hanging painting. The umber-black panels — rates tables, terminal grids, headline paintings — are the gallery's canvases, framed with a thin gold mount and mat. The parchment-light space around them is the wall that lets a painting be a painting. When a rate ticks, **the painting's number rolls; the world holds perfectly still.**

The positioning line: *"The data may rush, but the gallery watches at the pace of a painting."*

### The gallery metaphor, literalized

| Gallery | Terminal |
|---|---|
| Parchment-light walls | Ground — whitespace, open space, the calm 60% |
| Umber-black paintings | Data panels — rates, tables, terminal grids (the 30%) |
| Gold mount + inner mat | The frame system (Grade 2+ on live instruments) |
| Illuminated margins | Manuscript framing around text blocks |
| The gallery's custodian | The live eye-dot — one watchful gaze per view |
| Illumination | Gold as metal-light — never a fill, never bulk |

### The story it tells

The identity is drawn from a specific, genuine tradition — not a pastiche. The sources are **Ethiopian Orthodox manuscript and icon painting**:

- **15th-century processional crosses** — the technical mastery of monastic artisans; the interlaced strapwork that becomes the *haräg* lattice (drawn as abstract interlace, never as a crucifix).
- **Gospel manuscripts** — Ge'ez calligraphy, rubrication (the one loud red reserved for emphasis), and gold illumination. The *black body + red divine names + gold gilding* reading model.
- **Haräg headpieces** (e.g. the Gunda Gunde Gospels) — the ornamental woven bands that become the manuscript transition cues and the headpiece interlace.
- **Debre Berhan Selassie ceiling angels** — the eighty flat, frontal, almond-eyed angels watching from above; the figure canon and the Watcher.
- **Diptych and triptych icons** — hieratic frontal figures, the almond eye with its golden pupil, the flat gold halo.
- **The coffee ceremony** — the buna scene: three rounds (abol · tona · baraka), each lighter than the last, "each auction a little more honest."

Everything is **modernized but never diluted into decoration**: the structure stays clean and minimal; the tradition lives in the palette, the line, the lattice, and the figures.

### Design elements, not a logo

The identity expressly refuses a logo or mascot. The character of the language is carried by **five design elements** (Section 6), and the single memorable thing is **the eye-dot watching the data** — the gaze of the product itself. Figures may *illustrate* empty states and editorial moments; they never brand, and never enter product chrome.

---

## 2. Principles

The language defines **underlying principles, not one look.** Sections 1–6 of this guide are the shared laws that hold across every surface; Section 7 lists the four expressions that voice them. A product moves between expressions by surface and mode **without ever breaking the shared grammar.**

### The six laws

1. **Space is a feature.** Generous whitespace; every view breathes. Nothing competes.
2. **Ethiopian soul, modern bones.** Structure is clean minimal; the palette, line, and motifs are drawn from Ethiopian classical art.
3. **Restraint by default.** The tradition's richness lives in deliberate places, not everywhere. (60-30-10; accents only in the 10%.)
4. **One memorable thing.** A single signature element per view; everything else stays quiet. (Never multiplied, never a mascot.)
5. **Order through proportion.** One consistent scale, classical thinking. A 4px module; two type ladders crossing at exactly two shared steps (11px and 13px); a strict frame grade ladder.
6. **Drawn from the source.** Every color and motif traces to Ethiopian classical art — modernized, but never diluted into decoration. Every accent hue is semantically claimed; categorical identity is carried by type, glyph, and position, never by invented color.

### Do / Don't

- **Do** let the umber-black panels carry the data density; keep the walls open.
- **Do** use mono for numbers and columns; tabular figures everywhere digits line up.
- **Do** let the live eye-dot hold one moment per view.
- **Do** keep the manuscript transition cues — the frame inscribes, the painting mounts, the weave is over/under.
- **Don't** scatter the accent colors — they live in the 10% (gold capped at ~3%).
- **Don't** turn classical motifs into decoration (no Greek-key-style carpeting; restraint is law 3).
- **Don't** render a crucifix or Latin cross; the lattice stays abstract-interlaced. (P3 cross-tile is outline-only, 4-fold abstract.)
- **Don't** turn the eye-dot into a mascot or logo, or multiply it. One per view.
- **Don't** co-present the Ethiopian flag trio (saffron + verdigris + madder) in one frame, one figure, or one scene.

---

## 3. Palette

### 3.1 The tokens (extracted programmatically from the references)

Every value below was extracted from the reference images (see Section 9) and cleaned/lifted for use. **Ground**: dark umber-black first; light parchment-gold second. Accent colors used only in the 10%.

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
| Accent · 10% | madder red | `#A62F1E` | market (cleaned + lifted to manuscript red) |
| | verdigris | `#1E8A5E` | market (cleaned + lifted) |
| | saffron | `#E8A33D` | manuscript yellow |
| | ochre-orange | `#E46F30` | ref A |
| | indigo | `#181B2D` | ref B |

**Role mapping** (terminal semantics): verdigris = positive / tick-up · madder red = negative / alert · saffron = highlight · ochre-orange = CTA · parchment gold = labels & hairlines. On dark panels use the lightened (300-tint) variants — verdigris `#7BC9A8`, red `#E8836F`, saffron `#E8C46A`, pale gold `#E5C193`.

### 3.2 The blend law — the one rule that keeps it a system

Tints and shades are **never mixed toward white/black** (that desaturates and "websafes" the pigments). Every step is an sRGB blend toward the two manuscript neutrals that already carry warm character:

- Light steps blend toward **Parchment 300 `#F5E9D1`** (the warm light pole, hue 40°)
- Dark steps blend toward **Ink 900 `#15090B`** (the red-lean near-black, hue 350°)

Ratios fixed across ALL pigments: **100 = 12% pigment + 88% parchment · 300 = 45% + 55% · 500 = 100% (core) · 700 = 55% pigment + 45% ink · 900 = 30% pigment + 70% ink.** Because both anchors are themselves chromatic, the scale stays chromatic at every step instead of graying out. **Parchment and gold share one hue radius (40°); umber and ochre share one (~21°)** — which is why nothing ever fights: the neutrals and the accents are the same hue families at different value.

### 3.3 The 5-step pigment scales

| pigment | 100 | 300 | 500 core | 700 | 900 |
|---|---|---|---|---|---|
| madder | `#ECD3BC` | `#D19580` | `#A62F1E` | `#651E15` | `#401411` |
| verdigris | `#DBDEC3` | `#94BE9D` | `#1E8A5E` | `#1A5039` | `#183024` |
| saffron | `#F3E1BF` | `#EFCA8E` | `#E8A33D` | `#895E26` | `#54371A` |
| gold | `#F0DFBD` | `#E1C488` | `#C9962E` | `#78571E` | `#4B3316` |
| ochre-orange | `#F3DABE` | `#EDB289` | `#E46F30` | `#87411F` | `#532816` |
| indigo (support only) | `#DAD0BD` | `#928C87` | `#181B2D` | `#17131E` | `#160E15` |

Indigo's dark end collapses into near-black **by nature** — that is the measured signature that indigo is a support/shadow pigment, never a foreground accent. Even steps (200/400/600/800) are generated by t-bisection: 200 = 0.28, 400 = 0.72, 600 = 0.78, 800 = 0.42.

### 3.4 Neutral scales

- **Parchment**: 100 `#FCF9F3` · 300 `#F5E9D1` · 500 `#E6D6BC` · 600 `#D4C09F` · 700 `#CFB893` · 900 `#9C7C55`
- **Umber**: 100 `#EFE2CF` · 300 `#D0B28E` · 500 `#6C523D` · 600 `#4A2F20` · 700 `#573928` · 800 `#3A2016` · 900 `#241410`
- **Ink** (the near-blacks): 800 `#241411` · 900 `#15090B` · 950 `#0D0508`

### 3.5 The wheel grammar — why these hues harmonize

All hue angles are **CIELAB hue_ab** (the perceptually meaningful wheel). The system in three sentences:

> The palette is a **42° warm wedge** (madder 38.7° → gold 80.7°, parchment extending to ~91°), one **cool counterpoint** 78.6° past the wedge (verdigris 159.3°), and one **shadow point** (indigo 289.1°). Everything chroma-carrying except verdigris lives inside the wedge. The wheel sector **180°–270° is empty — and that emptiness IS the system's identity.**

Measured wheel map (hue_ab / chroma C\* / L\*):

| Pigment | hue_ab | C\* | L\* | role |
|---|---|---|---|---|
| madder `#A62F1E` | 38.7° | 61.1 | 38.3 | the hot pole / the ONE loud red |
| ochre-orange `#E46F30` | 52.4° | 68.2 | 60.0 | hot edge of the warm wedge |
| umber `#6C523D` | 55–65° | 18–19 | 27–74 | the desaturated CORE of the wedge (the warm neutral) |
| saffron `#E8A33D` | 74.6° | 62.7 | 72.0 | bright yellow-orange (caution) |
| pale gold `#E5C193` | 77.0° | 28.7 | 80.1 | gold's bright tint (dark-theme gold) |
| gold `#C9962E` | 80.7° | 59.5 | 65.3 | the gilded yellow / metal-light |
| parchment `#F5E9D1` | 85–91° | 3–15 | 86–98 | the ground — near-achromatic WARM white |
| verdigris `#1E8A5E` | 159.3° | 43.2 | 51.0 | the sole cool counterpole |
| sage `#6FB796` | 162.0° | 31.7 | 69.1 | verdigris's desat tint (dark-theme verdi) |
| indigo `#181B2D` | 289.1° | 13.3 | 10.3 | the shadow / only true cool |
| ink `#15090B` | 8.8° | 4.4 | 3.4 | warm-black with a RED lean |

**The wheel relationships actually present:**

- **Madder ↔ verdigris is NOT complementary** — it measures **120.6°**, a near-triadic opposition. This is a feature: true 180° complements vibrate via simultaneous contrast; a 120° pair is *calm-but-alive*. The tradition's palette is physically incapable of buzzing — restraint by structure, not willpower.
- **Gold / saffron / ochre / umber ARE analogous** — one continuous arc 52.4°→80.7° (28.3° span), plus umber as the arc's desaturated core. Gold is the wedge's brightest high-chroma point; umber is its earth anchor; madder is its hot, saturated red edge.
- **Umber IS the warm neutral** (hue 55–65°, chroma 18) — the wedge's own earth, so it harmonizes with every warm pigment by hue and with cool pigments by contrast.
- **The TRUE triadic spine is madder / verdigris / indigo** (spacings 120.6° / 129.8° / 109.6°) — for depth and shadow. The **OPERABLE data triad is madder / verdigris / gold** — gold replaces indigo by entering on *lightness* (ΔL 27 from madder): the triad's "gilding." Both coexist: the hue triad (depth) and the light triad (data/status).
- **Gold as metal-light, not a color**: gold reads as illumination because it is the wedge's brightest high-chroma member, dosed at ~3%, and **never a fill**. More gold reads as brass.
- **Warm bookending**: parchment is yellow-leaning (85–91°), ink is RED-leaning (hue 8.8°, chroma 4.4 — a warm black, not neutral). Both themes are "warm on warm," which is why one grammar survives light and dark.

### 3.6 Allowed harmony schemes

1. **ANALOGOUS** (default/secondary — the whole light theme is one): 2–3 members of the warm wedge at different chroma/lightness — madder+gold+umber, saffron+ochre+umber. The 60-30-10 IS an analogous scheme: 60% ground (parchment), 30% umber (the wedge's desat core), 10% one warm accent.
2. **SPLIT-COMPLEMENTARY** (the accent scheme): one warm pair from the wedge + verdigris as the sole cool. This is the identity's triadic spine realized as reduced split-complement. It is the ONLY legal warm/cool construction.
3. **THE TRIADIC SPINE** (signature): madder/verdigris/gold for **DATA** (positive/negative/live); madder/verdigris/indigo for **DEPTH** (weave shadows, panel cavity). Never all four of madder+verdigris+gold+indigo in one view.
4. **MONOCHROMATIC / VALUE HARMONY** (the terminal resting state): one pigment at multiple steps (gold 300/500/700, or umber 100→900). Color = one family; hierarchy = value.

### 3.7 Forbidden schemes

1. **FULL TETRAD** — forbidden by construction and by law.
2. **HIGH-CHROMA COMPLEMENTS ADJACENT** — madder 500 next to verdigris 500 at equal size/lightness. Legal only when separated by ≥20 ΔL (madder 700 vs verdi 500, or madder 500 vs sage 300) or by one intermediate neutral. **The weave loader's three equal pigments (madder/saffron/verdigris) is the SINGLE sanctioned full-chroma trio** — the loudest moment in the system, and the only one.
3. **THE FLAG** — saffron + verdigris + madder co-present in one frame/container = the Ethiopian tricolor. Forbidden in any single container (see also Section 8: never on a figure or scene).
4. **THE EMPTY ZONE** — any hue in 180°–270° at chroma >25 (pure cyan/teal/blue/violet, neon). Indigo is the only legal cool and it is C13.
5. **SAME-WEDGE SIBLINGS WITH <2 SEPARATING CHANNELS** — gold↔ochre, gold↔saffron, pale-gold↔onink-saffron as adjacent data channels (Second-Channel Law, §3.9).

### 3.8 Why the tradition harmonizes — the theory in six lines

- **Earthy, mid-chroma pigments.** Every chroma-carrying hue is C43–68 max (a modern saturated cyan is C80+). Mid-chroma colors recede, so three accents can coexist and the 60-30-10 holds.
- **A warm neutral ground.** Parchment carries hue 85–91° at chroma 3–15. Because the ground belongs to the same hue family as the pigments, every pigment on parchment shares a warm component — even verdigris reads as "cool within warm," never foreign.
- **One loud red, and only one.** Rubrication is a reserve: madder at C61 is the most saturated hue, yet it sits at hue 38.7° (red-orange, not pure red) — so even the loud red leans toward brown and stays sub-scream.
- **Gold as metal-light.** C60, L65, hue 80.7°, dosed at ~3%, never a fill. Capping gold is what keeps it precious.
- **The empty wedge.** The 180°–270° sector is deliberately unoccupied; the palette occupies ~⅓ of the wheel and lets emptiness do the work.
- **Triadic spacing prevents buzz.** The strongest pair sits at 120.6°, not 180°. Calm-but-alive, achieved by structure.

### 3.9 Pairing rules — the Second-Channel Law

**THE LAW:** any two colors used as sibling channels (adjacent data series, status, or legend categories) must differ in **≥2 of three perceptual channels**: hue (≥25° hue_ab), lightness (≥15 ΔL), chroma (≥20 ΔC). Pairs separated by hue ALONE inside the warm wedge are forbidden — hue-only separation is exactly what deuteranopia destroys.

**MAY SIT TOGETHER** (measured): Umber ↔ any pigment (C18 is the harmonizer; ΔE2000 to every accent ≥32) · Parchment ↔ any (ΔE 34–57) · Ink 900/950 ↔ any · **Gold ↔ madder** (42.0° hue, ΔL 27) · **Verdigris ↔ gold — the delta/live core pair** (78.6° hue; THE single sanctioned warm/cool pair — the skeleton of the data grammar: up = verdi, live = gold) · **Madder ↔ verdigris** (ΔE 59, 120.6° apart — the signature opposition, legal only when separated by ≥20 ΔL or a neutral) · Verdigris ↔ saffron (legal as legend categories; forbidden inside a frame with madder — flag) · Indigo ↔ any (shadow-only; but indigo is **invisible on ink**, ΔE 11.2 — never text/data there).

**NEVER TOUCH** (forbidden pairs, measured):
1. **Gold ↔ saffron** — the worst pair in the system: 6.1° hue, ΔE2000 6.8, ΔL 6.7. Defused only by role-lock (gold = eye-dot/knot/LIVE; saffron = caution text) — never a gold mark beside a saffron mark.
2. **Gold ↔ ochre** — 28.3° hue but post-deutan ΔE 13.6 (−34%, the largest collapse) at near-equal lightness. Forbidden as sibling data channels.
3. **Pale-gold ↔ on-ink saffron** — ΔE 9.2, ΔL 0.4. Practically identical.
4. **Saffron ↔ ochre co-presence** — both are the warning family; one per viewport.
5. **Saffron + verdigris + madder in one frame** — the flag.
6. **Madder 500 ↔ verdigris 500 as equal-weight fills.**
7. **Indigo ↔ ink as text/data** — indigo is shadow-only.

The delta pair survives color-vision deficiency because it obeys the law: on-ink red `#E8836F` ↔ on-ink green `#7BC9A8` differ by hue AND lightness (post-deutan ΔE stays 26). **Never equalize their lightness.**

### 3.10 Weight — the luminance staircase (why the 60-30-10 is physics, not taste)

The page is a **luminance staircase**: bright wall → mid pigment → dark panel, traversed by a warm temperature field with exactly two cool breaks and exactly one chroma figure at a time.

| band | role | tokens | L\* range |
|---|---|---|---|
| GROUND (60%) | walls, cards, wells | parch-100 .949 · -300 .823 · -500 .685 | 86–98 |
| PIGMENT (10%) | accents | 700-steps for text; 500-cores for marks | 22–72 |
| PANEL (30%) | the "paintings" + umber structure | ink-900 .0038, ink-950 .0021; umber 500 .096 | 2–37 |

**THE ORDERING IS THE LAW:** in the light theme, pigment L\* sits BETWEEN wall L\* and panel L\*. If a pigment ever sits outside its band (bright gold as a FILL on the bright wall, dark madder on the dark panel), the staircase inverts and the page reads busy or invisible.

Measured energy split (wall parch-300 @60% + umber-500 @30% + madder-500 @10%): **GROUND ≈ 93% / SECONDARY ≈ 5% / ACCENT ≈ 2%.** This skew is WHY the page feels calm: the area-dominant layer is also luminance-dominant.

**The area-cap law (derives the 10% and the 3% gold cap):** the accent band must not out-weight the secondary band — `Y_pig ≤ 3 × Y_umber = 0.287`. Check every pigment core:

| pigment core | Y | max legal area | verdict |
|---|---|---|---|
| madder-500 | 0.102 | >100% | full 10% legal |
| verdigris-500 | 0.193 | >100% | full 10% legal |
| ochre `#E46F30` | 0.281 | ~10% | exactly at ceiling |
| gold-500 `#C9962E` | 0.344 | ≤ 8.3% | identity cap 3% |
| gold-300 `#E1C488` | 0.573 | ≤ 5.0% | |
| saffron-500 | 0.437 | ≤ 6.6% | |
| parchment-gold `#F8E6B8` | 0.800 | ≤ 3.6% | — **this IS the ~3% gold cap, derived** |

Madder and verdigris are the only pigments that can actually inhabit the full 10% — which is why they are the workhorse data valences.

**Weight determines role** (the sub-staircase inside the pigment band): on the bright wall, L\* < 45 → text-capable (700-steps all ≥ 4.5:1); 45 < L\* < 72 → mark-capable only; L\* > 72 → the near-wall brights are invisible on parchment and exist ONLY to be figure on the dark panel. On the dark panel the ladder inverts: a pigment is figure only as its **300-tint** (L\* 65–80), never as its dark core.

### 3.11 Semantic state mapping (law, not token)

State hues are system-wide invariants; accent hues are per-viewport choices. They must be separate channels.

| role | light (on wall) | dark (on panel) |
|---|---|---|
| positive / up | verdi 700 `#1A5039` (8.9:1) | sage `#6FB796` (8.3:1) |
| negative / down | madder 700 `#651E15` (11.4:1) | on-ink red `#E8836F` (7.4:1) |
| alert | ochre 700 `#87411F` (7.1:1) | on-ink saffron `#E8C46A` (11.7:1) |
| live | gold 700 `#78571E` (6.3:1) | pale gold `#E5C193` (11.5:1) |
| neutral / rest | umber 700 `#573928` (9.9:1) | parch 600 `#D4C09F` (11.0:1) |

**The structural consequence:** every chroma hue is semantically claimed (verdi/madder/saffron = states, gold = live), so this palette has **NO free identity hue**. Categorical identity (which currency, which market, which section) cannot ride color at all — it falls to the secondary encodings, in fixed priority: **typography** (Bela vs Lemd vs Ethiopic) → **glyph** (the woven diamond, the Ge'ez chip) → **fixed position** (rails/columns). **Color is the LAST channel.** Every data color must be redundant with the sign (+/−, true minus U+2212), fixed position, a shape/glyph, or a label.

### 3.12 Theme invariance — one painting under two illuminations

The two themes are **NOT different palettes** — they are the same hue lattice read at a different Y-ordinate. The pigment's HUE is invariant (madder 38.7° in both themes); only its WEIGHT changes (500-core on parchment ↔ 300-tint on ink). **Never mirror the theme — invert it**: light reads the ramp's DARK end (700/900 steps, ≥3:1 on parchment); dark reads the LIGHT end (100/500 steps, ≥3:1 on ink). The **500 core is the pivot**: on parchment it is wash-or-mark (only madder 500 reads as text); on ink it is text-or-mark.

The **theme-invariance budget**: for every shared accent token, |hue_light − hue_dark| < 5°. Verified: gold 80.7°/pale-gold 77.0° = 3.7° ✓ · madder 38.7°/onink-red 37.1° = 1.6° ✓ · verdigris 159.3°/sage 162.0° = 2.7° ✓ · **saffron 74.6°/onink-saffron 87.7° = 13.1° — OUT OF BUDGET** (correct on-ink saffron toward ~78.5° if the pair must be compared across themes).

**The no-invented-color test (load-bearing):** a token T is legal iff ∃ pigment P, neutral N ∈ {parchment 100/300, ink 900/950, umber 900}: T = sRGB_lerp(P, N, α) within ΔE ≤ 1.0. Sage `#6FB796` = verdi 500 55% → parchment 300: on-chord, legal. Web-safe mint `#7BC9A8` = off-chord (ΔE ≈ 6.5): REJECTED. Every dark-theme token that passes this test is, by construction, **not a second palette**.

### 3.13 Extending without breaking — the admission filter

A new hue enters only if it passes ALL of: (1) it lands in an allowed zone — the warm wedge 38.7°→91°, OR the cool counterpoint 155°–165°, OR the shadow slot 285°–295° at chroma <25; never 180°–270° at chroma >25; (2) it is ≥25° hue from any existing channel hue, or ≥15 ΔL, or ≥20 ΔC from it (Second-Channel Law); (3) its tints/shades blend toward parchment/ink, never white/black; (4) it is introduced at one role, one step, at <1% coverage, and only after the existing 5-step scale fails. **Extend by VALUE first, then CHROMA, and only then by HUE.** Forbidden extensions: pure cyan/teal, violet/magenta, electric blue, any neon. (A copper/rust at ~45–50° and a deeper bronze at ~70° are legal candidates today.)

### 3.14 The known WCAG defects and their fixes (canonical)

Two load-bearing light-theme values fail WCAG as shipped and are **pre-solved**:

- Light-theme delta text at verdigris 500 `#1E8A5E` = **4.12:1** (fails AA text) → use **verdi 700 `#1A5039` (8.9:1)**.
- Light-theme LIVE eye-dot at gold 500 `#C9962E` = **2.53:1** (fails WCAG 1.4.11 non-text 3:1) → render the light-theme eye-dot at **gold 700 `#78571E` (6.28:1)**; keep pale gold `#E5C193` (11.5:1) on ink.

Keep the 500 cores as marks/fills (≤12px) only.

---

## 4. Type

### 4.1 The four faces, four locked registers

| Role | Face | Weights | License | Binding rules |
|---|---|---|---|---|
| Display — editorial voice | **Bela Bereka** | Bold 700 only | OFL | min 22px, tracking 0, never uppercase, ≤2 per view, banned from terminal except wordmark (floor 1.25rem) |
| Body / UI | **Noto Sans Ethiopic** | Variable 400/500/700 (Ethiopic + Latin) | OFL | the ONLY face below 1rem; 700 owns the one uppercase label step (11px); 500 owns inline fidel gloss at 1em ink |
| Data / terminal | **Noto Sans Ethiopic** | 400 (+ Nerd Font) | **OFL** | owns EVERY numeral; tabular figures; ts-hero 40–52px (HH Lemd was dropped — no license on font.et; the spec's contingency swap is now the law) |
| Mono Ge'ez | **Noto Sans Ethiopic** | 400 (+ Nerd Font) | OFL | mono/data context only; join 1.083em of Lemd at baseline; ≥11px |

Four faces fill four slots and the system is **closed** — adopt nothing else into it.

### 4.2 Two ladders, two shared steps

**EDITORIAL LADDER** (base 16px, ratio 1.25): h1 clamp 40–60px Bela 700 · h2 28–38px Bela · pull-quote 22–28px Bela (hairline gold rules above/below, not a red bar) · lead 18–21px Noto 400 · body 17px Noto 400 (measure 42rem) · small 13px · label 11px Noto 700 UPPERCASE tracking 0.14em (the ONLY uppercase/tracked step) · micro 10px — **discarded** (no Ethiopic below 11px). Dropcap: Bela 700, 3.2em, gold-deep on parchment, **never madder**.

**TERMINAL LADDER** (base 13px mono, pixel-calm): ts-hero clamp(2.5rem,4.5vw,3.25rem) = 40–52px HH Lemd tabular, panel-ink-hi `#FBF3DB` on umber · ts-rate 16px · ts-data 13px (every cell, every figure) · ts-tick 13px · ts-head 11px Noto 700 uppercase tracking 0.12em · ts-term 14px (Lemd Latin + Noto Sans Ethiopic fidel). **The terminal's calm IS its hierarchy** — nothing but 11 and 13 plus one hero number; Bela is banned from the terminal except the wordmark.

The two ladders cross at exactly **11px and 13px**, so a number can sit inside prose and a prose label can crown a table without breaking rhythm. That crossing is "the one consistent scale."

### 4.3 The pairing chart — the complete legal set

1. **LEMD + HIBURMONO — the mono Ge'ez join.** Legal everywhere in the mono/data context. Metric-locked: Noto Sans Ethiopic at **1.083em** of the Lemd em (cap-aligned: 0.774/0.714), `vertical-align:0`, `margin-right:0.4em`. (The earlier 1.04em/−0.06em was tuned to nothing; the re-derivation is frozen.) At 13px the fidel band top lands exactly on Lemd's cap. Position-invariant across both ladders.
2. **NOTO + LEMD — the inline-numeral crossing.** A 13px numeral inside 13px prose, or an 11px Noto label crowning a 13px value — band-compatible at 13px.
3. **BELA + HIBURMONO — the wordmark lockup ONLY.** ማለዳ (Noto Sans Ethiopic) + Maleda (Bela) at 1.25rem, 0.6em gap, baseline-aligned, zero shift, tracking 0. The only permanent two-script display pair. (Audited fallback: MALEDA in Noto 700 caps at 1.25rem, band-exact at 0.714em — see 4.6.)
4. **BELA → NOTO — the article stack.** Display descends to lead/body/small in reading order, but Bela and Noto never share a baseline; the 22px display floor keeps them in different optical bands.
5. **SINGLE-FACE by design** — everything else: prose is Noto-only; figures are Lemd-only; mono Ge'ez is Noto Sans Ethiopic-only.

### 4.4 The numeral grammar — HH Lemd owns every number

- Every figure: `font-variant-numeric:tabular-nums lining-nums`. Rates always 2 decimals (`128.40`); the decimal point is the alignment anchor.
- **DELTA: signed mono string** `+0.8` / `−0.3` using the **true minus U+2212** (never hyphen-minus); the sign IS the glyph; **no ▲▼ in tables** (ticker only); color the WHOLE value verdigris/red, never the sign alone.
- Units at 0.72em of the figure, baseline, muted, no space inside the string (`128.40ETB`, `/lb`, `%`). Grouping: ASCII comma always (`128,400`). Dates: Latin digits + Ge'ez month + Latin year (`9 ነሐሴ 2026`); Ethiopic numerals ፩–፱ are ceremonial/ordinal only, **never data**.
- **The hero rate** (the eye-dot's readout): `--ts-hero` HH Lemd 400, panel-ink-hi `#FBF3DB` on umber `#17130F`, tracking 0, delta beneath at 13px sign-colored. **Bela never renders a number — at any size, in any context.** Editorial stat numerals (pull-quote stats): `--fs-stat` HH Lemd 400 tabular, 28–40px, gold-deep on parchment, ≤1 per article.

### 4.5 Ge'ez / Latin metric engineering

- **Leading multipliers**: Amh = Latin × **1.09 body** / × **1.11 display** (resolved body 1.7/1.85, h1 1.05/1.16). Default EVERYTHING to `--lh-am`; use `--lh` only for pure-Latin literals (USD/ETB, timestamps). This is the single biggest fix for the "horrendous" feel — one line-height applied to both scripts clips the fidel or makes the Latin airy.
- **Inline gloss** (body): fidel at exactly 1em, weight 500, ink color, glossed once with a 1px saffron underline, at most once per article.
- **The 11px floor**: no Ge'ez below 0.6875rem anywhere. The 26 fidel + 7 vowel-row marks are illegible below 11px.
- **Single-language display rule**: never mix scripts at display size (data-lang toggle). The wordmark is the ONLY permanent bilingual pair; the boot title block is a composition of single-script elements; label/subhead scale may mix scripts in the SAME face (Noto, 0.5em gap).

### 4.6 Measured truths and the audit's verdicts

- **Bela Bereka ships ZERO Latin glyphs** (cmap = 352 Ethiopic + 29 Basic-Latin digits/punct; no A–Z). "Maleda" and English h1s have silently rendered in Noto. **Resolution**: English display in Noto Sans Ethiopic 700 (same clamp, single-language toggle); wordmark as ማለዳ (Noto Sans Ethiopic) + **MALEDA (Noto 700 CAPS)** at 1.25rem — the caps band (0.714em) matches the fidel band exactly. The calligraphic moment is Amharic-only until a Latin-bearing Bela build is audited.
- **HH Lemd Mono is not genuinely monospaced** (measured v1.102): digit advances 462–564 UPM, no tnum/lnum feature, so `tabular-nums` is a silent no-op and decimals drift (up to ~4.4px at 13px). **The spec's false promise must be struck**: "HH Lemd figures are proportional-lining; tabular alignment is engineered at the slot level, never assumed from the font." Fix: right-align numeric cells to the decimal and wrap each figure in a fixed **0.625em advance slot**, OR take the contingency — swap to **Noto Sans Ethiopic + Noto Sans Mono (both OFL)**, which zeroes both the license risk and the metric dependency.
- **Licenses**: HH Lemd Mono (unlisted — verify before shipping; contingent swap to Noto Sans Mono is preferred) and Bela Hidase (unlisted — adoption blocked until OFL verifies).
- **Candidate verdicts**: adopt NONE unconditionally. **Ge'ez Manuscript Zemen** (OFL) is a conditional fifth register — the single illuminated manuscript-initial (fidel-only, ≤1/article, never alongside Bela in a headline, monochrome-render-gated). **Bela Hidase** is a license-gated weight extension (never a companion voice). **Rejected**: Zemenay (duplicative/non-OFL), Agbalumo (wrong temperature, single-weight 400), ahabesha'stypewriter (non-commercial, ~331 glyphs, textured — third mono), Monolithic Geez (proprietary, duplicates display), Waldba (nine voices = inconsistency), Menbere (client-rejected, permanently).

---

## 5. Layout & Manuscript Transition Cues

This section carries the system's most defining machinery: **the frame is a proportion system, not an ornament** — and the manuscript transition cues are how a view *becomes* a gallery: the frame inscribes like a scribe, the painting mounts, the weave is truly interwoven. These cues are prominent by design; they are the difference between "a warm minimal news page" and "a gallery whose paintings are content."

### 5.1 The gallery

- **Walls**: parchment-light ground, generous open space.
- **Paintings**: deep umber-black panels where dense data lives (rates, tables, terminal grids) — the app's focal points, framed by a thin gold mount rule.
- **Illuminated margins**: text blocks sit inside manuscript-style framing — a thin gold frame with red/green/gold/saffron bands and corner diamonds at the top and bottom edges, and an ornamental headband above the article. The manuscript's illuminated borders, modernized to hairlines.
- **Hairlines**: thin rules in umber/ochre; the cross-lattice as section dividers.
- **Proportion**: spacing and scale from one consistent ratio (4px module; spacing steps 4·8·16·24·32·48·64); the type scale stays on a strict ladder.

### 5.2 The frame anatomy (the module)

The frame exists on a strict **module M = 4px**; the only non-module dimension in the whole system is the **1px stroke** (the scribe's hairline — deliberately the one exception). Anatomy, always the same five parts (outside → inside):

1. **Outer hairline** — 1px, 40% of its full color. It "holds the wall."
2. **Air gap** (the manuscript "waste") — 8px at Grade 1, 4px at Grade 2, 6px at Grade 3.
3. **Ornament zone** — the weave band; width = density tier × 8px (8/16/24). Bare (empty) at Grade 1.
4. **Inner hairline** — 1px at 70–80% of full color. **THIS is the line; it owns the content.** (On parchment: umber ink `#15090B` at 0.7. On umber-black panels: parchment `#F8E6B8` at 0.5 or pale gold `#E5C193` at 0.6.)
5. **Content gutter** — the clearance from inner rule to text: cards 12px, articles 16px, tables 8px, modals 24px, empty-states 20px.

**Air and gutter do more work than any strap.** Decoration is HELD AWAY from content by air — that is the manuscript craft and the whole source of subtlety.

### 5.3 Frame grades (rule+band cost; gutter separate)

| Grade | Form | Cost | Corner | Where |
|---|---|---|---|---|
| **0** | bare hairline: 1px only | 1px | — | tables, form fields, plain article body, modal chrome — **the calm default; most of the app lives here** |
| **1** | the scribe's double rule: outer 1px@0.4 + 8px air + inner 1px@0.7 | 10px | **stitched corner** | default for cards |
| **2** | the weave frame: outer + 4px air + 16px weave band (2× tile) + 4px air + inner | 26px | **rivet lozenge** | LIVE rate panels, featured article, terminal views |
| **3** | the illuminated frame: outer + 6px air + 1px flank + 24px band (3× tile) + 1px flank + 6px air + inner | ~40px | rivet lozenge (double) | boot screen and the hero headpiece ONLY — the gallery's single largest painting |

**Ratio cap: rule+band ≤ 1/14 of the container's short side**, enforced by the collapse ladder (§5.7) — never by eye.

### 5.4 The corner — the rivet lozenge

A 2:1 elongated rhombus (long axis along the frame diagonal, echoing the 3:2 manuscript page folded). Long axis 16px, short 8px, **1px outline, NO fill**, centered 12px in from the inner-rule corner so it floats in the air. At its center, a **2px dot — the jewel**. Grade 2: single outline + 2px dot. Grade 3: double outline + 3px dot. Grade 1: NO lozenge — the **stitched corner** (rules stop 4px short; a 1px diagonal stitch of 12px closes the corner). Grade 0: nothing.

**State — the corner connects to the identity:** dot = gold when live (`#C9962E` on light / `#E5C193` on dark), lifted red `#E8836F` when alert, and on loading the dot pulses 0.45↔1 over 900ms cubic-bezier(0.4,0,0.6,1). **The corner rivet is the eye-dot's seat** — the frame's live-ness is signaled by the corner, never by adding more gold. At container short side <48px, the whole frame collapses to **ONE 2px corner dot** at the top-right inner corner.

### 5.5 The lattice / interlace — exact tile geometry

**A weave is OVER/UNDER, not crossed lines.** Tile T = 16px (4M). Two diagonal strap families at +45°/−45°, spacing 8px (T/2) — a 2×2 diamond grid per tile. **Strap weight w = 1px.** Over/under: at each crossing the NE–SW family passes over where (family index + strap index) is even — a deterministic checkerboard. Rendered in two layers: (1) the full recess grid in the recess color; (2) the gold over-straps, each interrupted by a **2px gap centered on its under-crossings** (1px each side), so the gold visibly passes OVER the recess strap. This over/under is what makes it read as woven at every zoom, and it works at 1px because the two tones carry the depth.

**Density tiers** (band height = tile height):
- **1× "air"** — single layer (no gaps — a pure engraved hatch), deep gold `#C9962E`@0.32 on parchment / pale gold `#E5C193`@0.22 on black. Band 8px. Reads as "the hint of a weave."
- **2× "weave"** — full two-layer over/under. Band 16px. **The workhorse.**
- **3× "garden"** — over-strap 2px (gold) + under-strap 1px (**ONE accent color only** — madder or verdigris, never saffron) @0.85, spacing 6px, band 24px, flanked by 1px hairlines. Rich illumination, used once.

**Absolute rule: strap ≤ T/8 and air between strap edges ≥ 2× strap.** If a 6px visual band is ever wanted, it is built from THREE 1px straps with 2px air between (a woven ribbon) — never one 6px strap (strap ≈ band ≈ repeat → checkerboard smear and moiré). **Never tile a pattern cell** (the crossing lattice has an irrational period 8√2, so seams moiré); author full-length strokes with `stroke-dasharray = P−2 2`, gap = 2, offset per parity family. `shape-rendering="geometricPrecision"` — never `crispEdges` (jagged diagonals). No 1.5px strokes anywhere.

**Weave colors**: on parchment walls the weave is MONOCHROME — gold over-straps woven over the parchment surface (recess = the wall). On umber-black panels: over-straps pale gold `#E5C193`@0.9; recess straps mid-umber `#573928`@0.8 (the authentic umber-under-gold). In dark theme the weave swaps to pale gold over the void `#0D0508` — **gold threads over darkness, which is the manuscript-in-dark behavior.**

### 5.6 Margins, gutters, gallery hang

Framed containers hug their own edge (outer padding 0; all interior air is the gutter). Unframed (Grade 0) containers use 16px padding. Wall spacing between framed panels (the gallery hang): **16px horizontal, 24px vertical on desktop; 12/16px on mobile.** Frame inset from viewport edge on parchment walls: 16px. On umber-black panels the frame sits 8px from the panel's own edge.

### 5.7 Scale-collapse ladder (this is what kills "horrendous fat frames on small cards")

Min short side per grade, from the 1/14 ratio: **G0 < 140px (no frame) · G1 140–364px · G2 364–560px · G3 > 560px.** Below 300px short side, only an **L-frame** (band on top + one side, LTR: left), never a full rectangle. Height ≤48px (chips, small stats): ALL ornament removed — the single manuscript gesture allowed is one 2px corner dot. Any container that cannot earn its grade drops to the next lower one; **there is no penalty for a bare frame.**

**Container legality** (static chrome = G0/G1; G2+ ONLY when content is live): article body G0 (16px gutter), featured article G2 · card G1 (12px gutter), live-rate/featured G2, G3 never · table G0 only (1px + 8px gutter) · modal G0 only (24px gutter; corner dot for loading/alert) · empty-state G0, G1 for the primary empty hero, **never the weave** (no live data).

### 5.8 The manuscript transition-cue system

This is the load-bearing set: the cues that turn a static frame into a manuscript that *arrives*.

**A. The painting mount-in-mat (how a panel becomes a painting).** Frame = 1px gold-deep `#C9962E`@0.85 at inset 0. **Mat** = a second 1px hairline `rgba(248,230,184,.16)` inset **12px** — the double rule "mat inside frame" is what makes a panel read instantly as a painting. Content then at 20px 24px, leaving 8px/12px clear of the mat hairline (asymmetric clearances echo manuscript margins). Corner radius 0 (crisp, manuscript).

**B. The quarterfoil knots.** At each corner, an 18px SVG quarterfoil interlace knot — a single gold strand tracing r(θ) = 7.2·cos(2θ), stroke 1.5px gold@0.9, no fill, the two mount rails entering tangentially and terminating into the knot. Center weave: crossing order clockwise = over/under/over/under, under-passages carry a 2px gap. **Knots are the corner, replacing any floating diamond.**

**C. The headpiece interlace band.** A true 2-strand plait, SVG height 12: two strands y = 6+3·sin(2πx/14+φ), A φ=0, B φ=π (half-period offset). Crossings every 7px on the center line; at each crossing the over-strand is continuous, the under-strand carries a 2px gap. Stroke 1px gold@0.5. Placed 8px below the panel-head, 12px above the hero. (This modernizes the illuminated *haräg* headband of the source manuscripts.)

**D. The foot line.** 1px gold hairline (mount@0.6) full width with a centered 6px lozenge (rotated 45°, no fill) sitting above it. **Composition: head = active knot-work, foot = a single lozenge at rest.**

**E. Quiet vs ornamented — the load-bearing differentiation.** `--ornament:full` on data panels (mount + mat, four knots, band@0.5, foot lozenge). The **prose frame is deliberately QUIETER** — `--ornament:quiet`: no knots, no lozenge; two 1px hairlines (outer mount@0.7, inner mat@0.5) 4px apart, band@0.4 above the lead paragraph, foot = hairline only. **Ornament is EARNED ONLY by the live paintings.** This density split — text frames quiet, data panels ornamented — is what delivers "paintings are content."

**F. The inscription-on-load.** First paint: frame rules inscribe clockwise — top 600ms, right @150ms, bottom @300ms, left @450ms; each `stroke-dasharray = L L, dashoffset L→0`, 600ms, `--inscribe` cubic-bezier(.45,0,.2,1). @800ms the four knots draw stroke-length 0→1 (500ms). @1200ms the band inscribes left→right (700ms, ease-out). Refetch acknowledgement: only the top mount hairline re-inscribes (600ms left→right) while the 16px weave loader occupies the eye-dot slot; on data landing content fades 0.55→1 (320ms) then the number roll runs. Reduced motion: all of the above are static — frame and band present, no draw-on.

**G. The two-hand inscription choreography (hero plate).** The gold outer rule draws **clockwise from top-left** (900px/s, 40ms corner pauses); the ink inner rule draws **counter-clockwise from bottom-right**, start +120ms — *the hands lap counter to each other.* Gold hairline trails Hand A by a fixed 60px. Binding tacks pop (60ms snap) as each hand passes its corner. Sharp corner = a beat, not a slide. Frame time ≈ 2050ms for the hero plate (560×300).

**H. The boot sequence as one transition arc.** 0ms parchment wall fades in · 150ms weave loader begins · 1500ms strands settle (the loader weaving the mark) · 1900ms strands resolve into the static woven-diamond mark and the eye-dot ignites (the **loader→live-seed signature**) · 1980ms Hand A, 2100ms Hand B, 2240ms gold hairline · ~3900ms frame complete, tacks popped · 3450ms title plate inscribes (gold underline 400ms L→R) · 3650ms content reveal (rows rise 8px→0, stagger 70ms, last live rate rolls in LAST) · 4200ms the eye-dot's gold pulse begins — **the terminal has opened its eyes.** Subsequent loads skip straight to the content reveal (400ms); the frame is persistent, never re-inscribed.

### 5.9 Illumination on parchment vs umber panels

On parchment (`#F5E9D1` wall), the weave re-cedes into the wall (contrast ≈ 2.4:1 — deliberately a whisper); only the inner rule is dark ink, so the frame reads as "the one drawn line." On umber-black panels the weave is brighter because **the panel is the focal point.** Light vs dark theme: same geometry, different material — **never less decoration.** Dark theme wall drops to deep umber `#0D0508`, so panels LIFT one step to `#1B1114` and are separated by their gold frame alone; wall hairlines go ghost (`#FCF9F3`@0.12).

---

## 6. Signature & Motion

### 6.1 The five signature design elements

The character of the language is carried by **design elements** — type, texture, line, color, and live data indicators — not by a logo symbol. The almond-eye survives as a *motif*, delivered through four elements plus the framing:

1. **The live eye-dot** — the "gaze" of the terminal as a data element: a small status dot. Parchment gold = live · oxblood = alert · pulse = loading · and where a number belongs, it becomes the readout. **One moment per view; never a mascot, never multiplied.**
2. **Cross lattice** — the 6-strand interlace as hairlines, section dividers, ~8% panel-grid texture, rotating loading ticker. **No-crucifix rule.**
3. **Ge'ez section chips** — each section keyed to its fidäl initial (ዜና → ዘ): a manuscript/lectionary index.
4. **Gold hairline on parchment/umber** — the gallery framing; the umber-black panel as the painting.
5. **Illuminated margins** — the manuscript frame: a thin gold border, a gold interlace (lattice) band, corner diamonds, and the ornamental headpiece. The illuminated borders around manuscript text, modernized to hairlines — **never the flag, always the lattice.**

The "one memorable thing" is **how the eye-dot watches the data** — the gaze of the product itself.

### 6.2 The eye-dot — the status owner

The eye-dot (**12px, the only fill permitted at size**) is the panel's single status owner. It renders exactly one state: **LIVE, LOADING, or ALERT.** It is bi-chromatic by law: gold-family (live/loading) or madder-family (alert) only. Saffron/ochre never touch it; verdigris belongs to data valence, never to status.

- **LIVE (crown, static).** Light: core gold 700 `#78571E` (6.28:1 — the WCAG fix), halo gold 100 `#F0DFBD`@0.85. Dark: core pale gold `#E5C193` (11.5:1). No animation. The steady dot expands (200ms) into the 2-line **rate readout chip**: dark well, 1px halo-gold border, rate numeral pale gold + "LIVE" label. Gold appears nowhere else on the panel.
- **LOADING (transient breath).** 1.2s infinite pulse, ease-in-out: halo Ø20→24px, core alpha 1.0→0.75. A heartbeat, never a spin or blink. Gold-family in both themes.
- **ALERT (failing — ignite, then still).** Light: core madder 700 `#651E15`, halo madder 300 `#D19580`@0.55 (urgency from color, not motion). Dark: on-ink red `#E8836F`. One-shot 240ms enter, then **perfectly still**.
- **Transitions.** LIVE→LOADING: 200ms fade then pulse. LOADING→LIVE: pulse halts, 400ms settle. LIVE→ALERT: 240ms crossfade (failure is immediate). ALERT→LIVE: 600ms crossfade (**recovery must be earned**).
- **Collision resolution.** Eye-dot priority: ALERT > LOADING > LIVE. The instant negative fires: (a) the eye-dot flips to ALERT, (b) gold is withdrawn panel-wide, (c) verdigris is fully withdrawn. **Gold and madder can never share a panel, by construction.**

### 6.3 Motion law — the tokens

Every motion (a) **derives from weave/frame/ink metaphors**, (b) **decelerates into rest or travels constantly — never bounce**, (c) **terminates in a static resolved state** (the mark, the live eye-dot, the marked underline), and (d) **moves one thing at a time**, sequentially.

| token | value | used for |
|---|---|---|
| `--ease-ink` | cubic-bezier(0.16,1,0.3,1) | ALL entrances, rolls, reveals, ignitions, the loader's settle. NO overshoot, NO bounce, ever |
| `--ease-press` | cubic-bezier(0.7,0,0.84,0) | departures, the error un-weave, elements leaving |
| `--ease-page` | cubic-bezier(0.83,0,0.17,1) | section-level transitions, large reveals |
| `--ease-thread` | linear | continuous travel: weave strand travel, ticker ribbon, scroll-fill rail. A thread being pulled is constant; only a spinner eases |

Durations: `--dur-tic` 100 · `--dur-micro` 180 · `--dur-quick` 240 · `--dur-snap` 340 (number roll) · `--dur-move` 400 · `--dur-standard` 600 · `--dur-settle` 900 · `--dur-inscribe` 1200 · `--dur-weave` 2400 (loader cycle) · `--dur-boot` 4200.

**Color semantics:** gold = live/existence; pigments (verdigris/saffron/madder) = events and loading; umber = rest. Motion never invents new colors.

### 6.4 The weave loader — interlace, not orbit

Three strands **BRAID on one shared lozenge path** (96×96 tile, rounded diamond N(0,−34) E(24,0) S(0,34) W(−24,0), r=7) with over/under crossings — not a pinwheel. Strands are three **needle kites** (26px along travel, pointed head, 6px tail base, opacity ramp 0.95 head→0.20 tail — a drawn brushstroke of pigment, not a filled triangle), phase-offset 120°, pigments **verdigris · saffron · madder** (lightened on panels). Travel is constant (linear, a thread), cycle 2400ms.

**The weave ripple:** each strand's centerline = base path + normal-offset sine (amplitude 1.6px, 3 cycles) → strands cross **6×/cycle at exactly 400ms spacing**. At each crossing the under-strand drops to opacity 0.55 and luminance −8% for the 120ms pass (classic interlace shadow). The crossing is the loader's perceptual beat — 6 beats per 2400ms. An **ink trail** (0.9px residue stroke ahead of each head, fading 0.5→0 over 600ms) gives the pigment-staining-the-strand read.

**The settle (the loader's PURPOSE):** on content-ready, a 400ms ease-ink tween decelerates travel to 0 and damps the ripple, **converging the three strands into the static woven-diamond mark** — the loader never spins forever. The gold lozenge is woven by the pigments at the knot instant.

**Variants:** Loading (full pigment, ink trail on) · Empty (same geometry, muted at 38%, no trail, cycle 3200ms — "waiting," not "working") · **Error (the weave UN-WEAVES)** — verdigris and saffron fade to 20%, the madder strand reverses direction, ripple doubles so the crossings become near-misses — *the knot coming apart*, meaning-bound · Live (no loader; the static mark's eye-dot breathes at 2400ms).

### 6.5 The woven-diamond mark

The loader's resolved state and the section seal: a 24px static glyph — the same three interlaced strands closed into a diamond knot, 1px gold strokes (`#C9962E` on light, `#E5C193`@80% on dark), the three pigments as 1.5px accents at the knot's three corners. **Never animated as a whole — only its eye-dot center pulses.** (The audit flagged the mark's everywhere-status as drifting toward a de facto logo; the discipline is: it is a *motif*, one per view, never a brand emblem.)

### 6.6 Data micro-interactions

- **Rate-tick number roll.** Each changing digit rolls in a vertical 10-digit column, translateY(−n×17px), 340ms ease-ink (max 460ms), carry 9→0 wraps naturally, next-left column +60ms, single-column 0.4px wet-ink blur, 4ms paper-settle at landing. Max 4 rolling columns at once.
- **Delta wash (not a blink).** Value color SNAPS to the delta color (up verdi `#7BC9A8`/`#1E8A5E`, down red `#E8836F`/`#A62F1E`), holds 80ms, eases back over 440ms; a 3px background band at 14% delivers the same 440ms curve. NO scale, no bounce. Debounced so it never double-flashes.
- **Alert pulse.** Threshold crossing: the row's left 2px gold rule brightens and a radial halo swells 12→44px, 260ms, then decays. Repeat 1600ms, **MAX 3 pulses**, then decays to a persistent 0.75px gold underline (the marked state). **Alerts never strobe indefinitely.** The eye-dot shifts to red-hold for the window — no blink.
- **The flowing ticker.** 44px ribbon, HH Lemd 13px, items separated by a 6px gold diamond + gap; **48px/s linear** (translateX on one full-width strip holding 2 duplicate copies). Hover/focus **pauses the ribbon** (WCAG 2.2.2); reduced motion renders it static.

### 6.7 Scroll & reveal

Reveal: opacity 0→1 + translateY 16px→0, 600ms ease-ink, 50ms stagger within a cluster, max 3 clusters per viewport. **Knot divider** (replaces the old lattice band): a 1px gold rule with the single woven-diamond mark at center; on scroll-into-view it draws outward from center, then the knot draws. **Sticky Ge'ez section chip**: on activation its underline draws 300ms and its gold wash rises 0→0.12. Gallery rail: a 1px gold hairline fills with scroll — linear, a thread tied to scroll. Parallax, minimal: wall 0.94×, data panels 0.88× (paintings recessed), text 1.0×; disabled in reduced motion.

### 6.8 Reduced motion + performance (non-negotiable)

Under `prefers-reduced-motion: reduce`: weave → static woven mark (240ms fade) · ticker → step carousel · alerts → single 500ms flash then the marked underline · reveals → opacity-only 240ms · frame inscription → 400ms fade (no stroke-draw) · parallax → none. Functional motion (roll, flash, tick) kept at minimum duration. **Loading vs live must stay distinguishable** with animations off (distinct static form, not animation-only).

**Performance budget:** animate ONLY transform + opacity (stroke-dasharray/dashoffset for rules); never width/height/top/left. Loader = max 5 composited layers. Ticker = 1 composited strip. **Total simultaneous transform/opacity animations ≤10.** No box-shadow/text-shadow animation — shadows pre-baked as gradient layers. Alerts decay to static after 3 pulses. Adaptive: if sustained <30fps, step the loader to one crossing per 600ms and disable the ink trail. No layout-triggering properties during motion; no reflow during tick/roll.

---

## 7. The expressions — Editor · Gallery

Two expressions, both built from `tokens.css`.

**★ Editor — primary.** Near-white newsroom, type-led, hairline rules; the Ethiopian character carried by type and color alone. Amharic-first, bilingual-pure, a three-view loop (article · rates board · news index) with hash navigation and an honestly-badged sample rates board carrying provenance metadata. The canonical surface — `taste-test-news-article.html` (== `variants/editor.html`). The thesis's single gallery moment lives in its rates board: the umber-black panel hung as the one painting — gold mount + mat, as spec'd in §5.8.

**Gallery — salvaged.** Open parchment, one gold headpiece hairline, the umber-black rates panel hung as the **single framed painting** (gold mount + inner mat); rubrication red for urgency. Museum-calm. `variants/gallery.html`.

**Terminal · Manuscript** were explored as alternative modes and **archived** (`archive/`).

### Decisions the audits resolved

- **One canonical surface**: `editor.tmpl.html` — two "canonicals" must never drift.
- **One frozen wordmark**: ማለዳ (Noto Sans Ethiopic) + MALEDA (Noto 700 caps) — language-pure per mode.
- **One live dot per view** (the rates head); the rest are inert hairlines.
- **One shared token baseline**: `tokens.css`, the single source every expression imports — one expression, one source, zero drift.

---

## 8. Characters

### 8.1 The canon — "The Meskroch" (ምስክሮች, "the Witnesses")

The canonical figures are the gallery's guardians: hieratic, frontal, almond-eyed figures who stand watch over the market as data flows. They are a **construction built from the system's own geometry** — never a likeness, never a mascot, never a logo.

**Role rules.** Figures appear ONLY in illustration, empty states, loading, and editorial moments — never in chrome (no buttons, menus, nav, avatars). Figures never occlude or touch data (the Herald's raised palm keeps ≥8px from the rate it gestures toward). Figures are gender-neutral by default (the shamma/gabi head-cover hides the head).

### 8.2 The cast (three figures + a scene)

| Figure | Ge'ez | Role | Pigment key | Appears in | Hook |
|---|---|---|---|---|---|
| The Watcher | ጠባቂ | the human face of the eye-dot; the sentinel who watches the ticker | gold + ink ONLY — the eyes are the only gold on him | boot, primary empty hero, loading draw-in, onboarding (live step) | THE WATCH: eyes breathe; one 2px saccade per data change |
| The Chronicler | ጸሐፊ | the scribe-reporter with a Ge'ez notebook; the editorial voice | saffron robe, umber ink | article empty, article loading, editorial illustration, onboarding (stories step) | THE PEN: one ink line draws + a 1px dot (the Amharic ።) per story |
| The Market trader | ነጋዴ | the coffee trader at the stall; the rates/market voice | verdigris robe + ONE gold seam on the jebena | rates empty, rates loading, market editorial, the ceremony scene (as host), onboarding (market step) | THE POUR: one 3° jebena tilt + one 0.9px gold thread per tick |

The Watcher never appears in editorial illustration (he IS the product, not a story figure). The Chronicler and Market trader never appear in chrome. **One figure per moment, or none** — never two (two reads as a duet); three only in a deliberate hieratic row (the coffee-ceremony scene).

### 8.3 The hieratic canon — construction (exact)

**Module grid M = 4px.** Face-frame = 24px (the woven-diamond mark's dimension — a figure's face is the mark made flesh). Full figure canvas 120×200 (3:5). **Proportion: head : body = 1 : 8** (the elongated hieratic canon), 8 heads tall. Canonical unit: 1 nibus = the almond eye width.

**The almond eye (the signature):** 5×3px (14×5 at 200px), drawn as two tangent arcs — inner canthus a point 1px lower than the outer canthus, which rises 1px (the classic icon slant). Inter-eye gap 2px (eyes close-set and large — the icon hallmark). **The pupil IS the live state**: gold `#C9962E` = live · madder `#A62F1E` = alert · pulse gold→parchment = loading. One 1px parchment catchlight dot at 2 o'clock. **This literalizes "paintings are content" — the Witness's eye IS the system's eye-dot.** One authorized shift = the "witnessing glance": both pupils move 1px to the SAME side, toward the illustrated datum. Both move together; cross-eyed and outward-staring are forbidden.

**Figure palette (the only pigments allowed on figures):**
- Skin Canonical `#4A2813` (default on parchment/gold) · Skin Deep `#2B1408` (dark theme, back/second figures) · Skin Ochre `#8A5A2B` (ONE reserved "lit" figure per editorial spread).
- Shamma/gabi: parchment `#FCF9F3`, 1px ink fold-lines, 3 parallel 1px ink stripes at the hem, optional 2px gold band. Robes: madder (dignified, rubric) or verdigris; deep ink robe with gold trim. **Saffron is trims/accents only — never a large cloth fill.** Gold is metal/light only — rims, borders, halo, never a large fill.
- **Halo**: flat gold disc Ø24px behind the head (modernized); thin 2px gold ring for small/secondary figures and dark theme. Halos belong to the four sanctioned figure types ONLY.

**Line & rendering.** Outline 2px silhouette / 1px interior at canon (3px/2px at 192px; 1px all at 48px; ≤24px → glyph). Light theme line = ink `#15090B`; dark theme = parchment `#FCF9F3`. **Flat fields, ZERO gradients, ZERO shading, ZERO drop shadows, ZERO noise.** Fill-inset rule: every color region under-draws its outline by 1px (kills the SVG gap artifact). Pixel-snap to the 1px grid, whole px only.

### 8.4 Expression & pose grammar

Four discrete expression states, no blending, no cartoon faces: **Watchful** (default: full almond, gold pupil, no brows, neutral mouth) · **Alert** (flat 1px brows appear, pupils → madder, mouth tightens to 2px — no wide eyes, no open mouth) · **Serene** (almond lowers to a resting crescent, corners lift 0.5px — market settles) · **Herald** ("here is the number": Watchful face + the open-palm raise — the hand speaks, the face stays neutral).

The complete pose set: (1) Standing Witness (default, frontal, arms at sides) · (2) The Herald (right hand raised, palm OUT — the modernized icon blessing hand; signature gesture) · (3) The Keeper (hands folded at the waist, for idle/loading) · (4) The Coffee Hostess (seated at the mesob, hand on the jebena — editorial ritual) · (5) The Watcher (halo MANDATORY, both palms raised to shoulder height — the Debre Berhan Selassie homage for empty/loading states: "the market is being watched"). Posture: primary figures ALWAYS frontal, spine vertical, weight even — no contrapposto, no profile, no crossed arms, no pointing at the viewer.

### 8.5 Character animation — ceremonial motion

Principle: **hieratic stillness is the default.** Motion is confined, ceremonial, on a **12fps integer frame grid**, linear easing only — no bounce, no overshoot, no ease-elastic. Only three eases exist for figures: `--ease-ink` (arrive/plant/settle/draw), `--ease-press` (depart/withdraw/exit), `--ease-thread` (gaze pursuit, garment wave).

The four sanctioned loops: **THE DRIFT** (idle: 1px lateral sway + 1° rotation, 1.6s, halo rigid) · **THE BLINK OF THE WITNESS** (signature: the almond eyes close to a 1px slit and reopen, 5 frames ≈0.42s, every 4–6s — reads as a shutter, the gold pupil glows through) · **THE HERALD'S LIFT** (raised palm lifts 4px, index extends, 0.6s in / 0.8s hold / 0.6s out, fires once on data arrival) · **THE WATCH PULSE** (alert: pupils → madder AND the silhouette flashes madder 1px for exactly one 1.0s loop — mirrors the red-alert eye-dot).

**Loading affordance:** the figure is STATIC (never re-implements the weave-loader); loading is conveyed by (a) pupils pulsing gold→parchment in step with the eye-dot pulse, and (b) **the halo draws itself** — the gold ring's stroke sweeps 0→360° via stroke-dasharray, 1.2s linear. Appear/disappear: a 0.8s dissolve or a 1px cross-fade through the frame's interlace. **Forbidden motion:** walk cycles, jumping, spinning, squash-and-stretch, swinging limbs, head-bobbing, finger-tapping, any idle-loop energy.

**Scale / glyph rules:** ≤24px → glyph (halo-disc + two almonds + gold pupils only, no body) · 24–48px → robe silhouette + eye details · 48px+ → full canon · figures ship at 96–288px in empty states and editorial. **Faces NEVER appear in product chrome at any size.**

### 8.6 The Painted Field — the illustration system

An illustration is a **painting hung in the gallery** — the sanctioned exception to the chrome restraint caps (fills >12px, >2 chroma families), allowed exactly once per viewport, obeying its own stricter laws: no gradients, no blur/glow/shadows, no flag-trio, no new colors, **no animated world**.

**THE STATIC/LIVING LAW (the core):** within any illustration the painted world — parchment, umber, ink, and the two world pigments — is STATIC. It never changes color or position for data events. ALL live state lives in the **gilt data plane**: the gold-verdigris tablet, the ticker line, the eye-dot, the halo behind data. When a rate ticks: the world holds perfectly still; the tablet's number rolls; the eye-dot breathes.

**Composition.** Flat frontal only; no perspective, no vanishing point. Depth is SYMBOLIC: vertical register stacking = distance (upper = farther), scale = importance (hieratic). Three registers: APEX 0–28% (sky, sun, halos, incense, AND the data plane) · ACTION 28–68% (figures, jebena, mesob, market table, monitors) · GROUND 68–100% (ground line, table, cups, the grounding weave band). An object may cross exactly ONE register boundary. Hieratic scale: at most three grades (hero 1.6×, support 1.0×, accent 0.6×). **Number symbolism:** 3-cycles and 4-part symmetry; never 5s or 6s in hero positions.

**The scene vocabulary (five canonical scenes, fixed anatomy):** S1 Addis Street (flat frontal frieze, one blue-white minibus, one vertical accent) · S2 The Market / mercato + Aksum (striped awnings, spice cones, woven granaries, stelae) · S3 **Buna** — the coffee ceremony, the signature hospitality scene (jebena hero at 1.6×, three cini cups for abol/tona/baraka, incense coils, qetema grass) · S4 **The Mesob** — the woven basket table drawn ENTIRELY in P2 diamond lattice; the load/empty/waiting glyph in physical space (mirrors the weave loader) · S5 **The Ticker-World** — one frontal figure watching a row of gold-rimmed monitors whose faces carry ticker lines; the product scene.

**How illustration frames data — three legal relationships:**
- **R1 The framed painting** — a small painted scene beside/above a data panel. The painting is memory/context; the panel holds the live data.
- **R2 The painting hosts the data — THE TERMINAL'S SIGNATURE ILLUSTRATION.** A gilt data tablet (a cartouche/inscription tablet) floats INSIDE the scene: 1.5px gold border on a parchment face, rivet-lozenge corners, its own 12px eye-dot at the top-right (or the frame's corner rivet). The tablet is the ONLY element drawn in gold+verdigris and it FLOATS (data plane). Numbers live ONLY on tablets or the ticker band — never written across a wall, a basket, or a cup.
- **R3 The panel IS the painting** — full-bleed on-umber: a data panel whose face IS a painted scene with the data overlaid as the live gilt layer. The gallery thesis at full power.

### 8.7 The world — a painted stage

The world is a stationary frontal tableau — a manuscript panel the viewer faces directly. **Depth is a stack of flat cut-out planes** (Plane A backdrop / Plane B architecture / Plane C ground strip / Plane D foreground framing edge), never a converging space. Light is symbolic, never physical: the **halo** (three flat annulus rings), the **gold field wash** (a hard 2-step poster split — the only gradient-like treatment in the entire language), the **fire glyph** (three flat tongues, no glow), the **window light shaft** (at most one flat gold parallelogram, hard edges). One focal subject per scene, ≤3 figure types, **≥20% of the frame is untouched backdrop.**

**World pigments** (additions to the established palette, scope-locked): umber `#8C5A2B` (earth/wood), field gold `#D9B45C`, **lapis `#2E5E8C` — the ONE sanctioned cool token (manuscript lapis), taxi stripe and tiny accents only, never a field fill**, verdigris light `#52B48A`, warm charcoal `#4A3A33` (incense smoke), night deep `#1A0E08` / `#2A1810` (dark-theme world).

**The object library** (canonical proportions): jebena (bulb body, no handle, long upward spout), mesob (truncated cone in P2 lattice; plan form = the medallion texture token), rečot cups, m'eqad brazier, Ethiopian cross (abstract lattice, illustration/architecture ONLY — never a brand mark), taxi minibus (madder-over-lapis double stripe), stele, tukul, eucalyptus, awning, storefront.

**Reuse taxonomy** (world motif → design element, one motif per surface): jebena silhouette → section divider · mesob medallion → background texture (8–12% ink) · haräg interlace → scene border · stele silhouette → vertical divider · eucalyptus lobe → ticker ornament / bullet · cross lattice → 4% watermark · taxi stripe → "route band" under editorial headers.

### 8.8 Respect / cultural rules

No direct copies (no reproduction of a specific icon, no tracing Debre Berhan Selassie angels, no named saint's face — the figure is an abstract construction of almond arcs, trapezoid robes, and a circle) · no caricature, never mock the umber skin · halo discipline (reserved for sanctioned figure types, never combined with a live ticker in a way that trivializes the sacred form) · the figures are the gallery — data is the painting; they stand in the margins, never overlaid on data · captions in Amharic use proper orthography, never transliteration · **run the figure system past an Ethiopian Orthodox-informed stakeholder before shipping any character** (the audit's cultural flag — the abstract construction is the safe form; a direct named-church "homage" pose should be softened or gated behind explicit approval).

---

## 9. References — the image catalog

Every color, motif, and figure in this language traces to the images below. The palette was extracted programmatically from the manuscript set; the lattice and figure system derive from the icons and the haräg headpieces. Files live under `references/` (relative to this guide).

### The manuscripts (palette + typography + layout)

**18th-century manuscript** — `references/ms-18th-century.jpg`
Parchment-gold ground, umber-black ink, rubrication red, gold illumination. Source of the ground pair (parchment first, umber-black second), the manuscript reading model (black body, red divine names, gold gilding), and the deep gold `#C9962E` "illumination gold."

**Ge'ez letterform** — `references/ms-geez-letterform.jpg`
Fidäl calligraphy with the 6th/7th-order vowel marks overhanging the fidel band. Justifies the 22px display floor, the ×1.11 Amharic display leading, and the single-language display rule.

**Gospels haräg** — `references/ms-gospels-harag.jpg`
The interlace/lattice strapwork in its native form — the source of the over/under weave law (§5.5), the headpiece band, and the "never the flag, always the lattice" rule.

### The icons & the ceiling (figures + the almond eye)

**Debre Berhan Selassie ceiling angels, Gondar** — `references/commons/ceiling-angels-debre-berhan.jpg`
Eighty flat, frontal, almond-eyed angels. The source of the figure canon's frontality, the almond eye, the "ceiling angels (flesh)" mid-umber token `#6C523D`, and the Watcher. *(Katie Hunt, CC BY 2.0.)*

**Diptych icon: Saint George and Mary with the Infant Christ** (Walters 3616) — `references/commons/icon-diptych-saint-george.jpg`
The hieratic two-panel form and the flat gold halo. The diptych/triptych structure informs the gallery's panel-hanging and the flat halo disc.

**Triptych icon: the Virgin Mary** (Detroit Institute of Arts) — `references/commons/icon-triptych-virgin-dia.jpg`
Three-panel structure, frontal figures, deep reds and blues. Source of the deep indigo shadow token `#181B2D` and the panel-as-painting idea.

**Open manuscript with illuminated text, Na'akuto La'ab monastery** — `references/commons/manuscript-open-naakuto.jpg`
An open book with painting and illumination — the literal "manuscript as interface" moment behind the illuminated-margins cue system (§5.8).

**15th-century processional cross** (Walters 542894) — `references/commons/cross-processional-walters.jpg`
The technical mastery of monastic artisans and the interlaced strapwork that becomes the cross lattice — abstract-interlaced, never a crucifix. *(Walters Art Museum, Public Domain.)*

**Leaf from the Gunda Gunde Gospels** (Walters W850208V) — `references/commons/harag-headpiece-gunda-gunde.jpg`
The ornamental headpiece band in full color — the direct ancestor of the headpiece interlace and the illuminated headband above articles.

**Matthew's Gospel, Ge'ez calligraphy** (British Library Add. MS 59874) — `references/commons/geez-calligraphy-matthew-gospel.jpg`
Clean Ge'ez script on vellum — source of the Ge'ez section-chip idea and the wordmark's fidel. *(British Library, Public Domain.)*

### The coffee ceremony (the scene + the photographic world)

**Coffee ceremony** — `references/coffee.jpg` (also `references/coffee-ceremony.jpg`)
The jebena, the mesob, the three rounds. Source of the buna scene (S3), the Coffee Hostess, the abol/tona/baraka structure, and the "each round lighter than the last" metaphor. *(ProtoplasmaKid, CC BY-SA 4.0 — the Commons copy.)*

**Addis street** — `references/hero-street.jpg`
The street photography used in the taste-test specimen — source of the S1 street scene's palette and the documentary register alongside the paintings. *(Wikimedia Commons photo credit as shipped in the specimen.)*

---

## 10. Sources

### Reference images (Wikimedia Commons — all verified in `references/commons/_downloads.json`)

| Image (file) | Work | Credit | License |
|---|---|---|---|
| `references/commons/cross-processional-walters.jpg` | Ethiopian Processional Cross, Walters 542894 | Walters Art Museum | Public domain |
| `references/commons/icon-diptych-saint-george.jpg` | Diptych Icon with Saint George and Mary, Walters 3616 | Walters Art Museum | Public domain |
| `references/commons/harag-headpiece-gunda-gunde.jpg` | Leaf from the Gunda Gunde Gospels, Walters W850208V | Walters Art Museum | Public domain |
| `references/commons/geez-calligraphy-matthew-gospel.jpg` | Matthew's Gospel, British Library Add. MS 59874 | British Library | Public domain |
| `references/commons/icon-triptych-virgin-dia.jpg` | Triptych, Icon of the Virgin Mary, 2002.3 | Detroit Institute of Arts | Public domain |
| `references/commons/ceiling-angels-debre-berhan.jpg` | Debre Birhan Selassie church, Gondar | Katie Hunt (uploaded by Fæ) | CC BY 2.0 |
| `references/commons/coffee-ceremony-protoplasmakid.jpg` | Coffee ceremony of Ethiopia and Eritrea | ProtoplasmaKid | CC BY-SA 4.0 |
| `references/commons/manuscript-open-naakuto.jpg` | Close-up of manuscript with painting and illuminated text, Monastery of Na'akuto La'ab | Flickr (3415950561) | CC BY (as credited in the specimen) |

All Commons art is public domain (museum collections) or CC-licensed; the specimen ships honest `"Figures illustrative — not market data"` disclaimers in both scripts and proper photo credits.

### Fonts

- **Bela Bereka** — Bold 700, Open Font License (OFL). Calligraphic Ethiopic display face. ⚠️ Ships NO Latin glyphs (measured) — English display and the wordmark "Maleda" fall back per §4.6.
- **Noto Sans Ethiopic** — Variable 100–900, OFL. Bilingual body/UI face (Ethiopic + Latin).
- **Noto Sans Ethiopic** — Regular, OFL (Behailu Barento / typehabesha). True mono Ge'ez, drawn to Noto Sans Mono geometry; Latin from Noto Sans Mono.
- **HH Lemd Mono** — Regular, **license UNLISTED — verify before shipping.** Every numeral rides this face; contingency swap to Noto Sans Mono + Noto Sans Ethiopic (both OFL) is preferred.
- **Bela Hidase** — same designer as Bela Bereka, **license unlisted** — blocked until OFL verifies; only ever a weight extension, never a companion voice.
- **Ge'ez Manuscript Zemen** — OFL 1.1 (EMUFI / geezorg, RFN; calligraphic fidel derived from Abyssinica SIL). Conditional fifth register — the single illuminated manuscript-initial, gated on a monochrome-render pass.

### Font candidates evaluated and rejected

Agbalumo (OFL, wrong temperature, single-weight 400) · Zemenay (non-OFL/non-distributed; conflates three distinct faces) · ahabesha'stypewriter (personal-use only, ~331 glyphs, textured vintage — a third mono) · Monolithic Geez (proprietary, duplicates display) · Waldba (OFL, nine voices = inconsistency) · Menbere (client-rejected, permanently).

### Process & documents

- **Canonical doc**: `DESIGN-LANGUAGE.md` — the living companion to the WorkFlowy mood board (*Ethiopian Classical Design Language →*).
- **Deep-dive craft**: `specs-deep-dive.md` — frame geometry, interlace, motion, color tokens, typography, live-data information design (15-agent fan-out).
- **Color harmony & theory**: `specs-color-theory.md` — wheel grammar, luminance-weight budget, the Second-Channel Law, the CVD audit, theme invariance, the growth/blend laws (15-agent fan-out).
- **Type pairing**: `specs-type-pairing.md` — four-face system, two ladders, the pairing chart, numeral grammar, the Ge'ez/Latin metric engineering (15-agent fan-out).
- **Characters**: `specs-characters.md` — the Meskroch canon, the Painted Field, the world & environments, the animation grammar (15-agent fan-out).
- **Audit**: `audit-report.md` — the 12-persona, 13-agent app audit and its synthesis; its decisions (contrast fixes, single canonical layout, frozen wordmark, one eye-dot, calendar and language corrections) are folded into this guide.
- **Specimens**: `taste-test-news-article.html` (canonical Editor), `variants/editor.html` · `gallery.html` · `terminal.html` · `manuscript.html`; source templates `variants/*.tmpl.html`.
- **Reference catalog**: `references/_fetch.py` + `references/commons/_downloads.json` — provenance for every Commons image.

### Status

- Principles: **draft — awaiting sign-off** (tracked in WorkFlowy).
- HH Lemd Mono license: **unverified — confirm before shipping**.
- Palette: **converged**; accent values cleaned for use; harmony and weight theory complete; the two light-theme WCAG fixes are pre-solved (verdi 700, gold 700).
- Type: **four-face system locked**; two license flags pending; Bela's missing Latin resolved by audited fallback.
- Rendering: four expressions built as self-contained pages; the canonical specimen is `taste-test-news-article.html`.
- Audit: complete — the rebuild of the templates against the specs is the bounded next step (specs prove the fixes are known and small).

---

*The gallery watches at the pace of a painting — and its paintings are content.*
