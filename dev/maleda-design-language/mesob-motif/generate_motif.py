"""Generate the mesob SVG motif from the sisal tray geometry."""

from __future__ import annotations

import math
from pathlib import Path
from urllib.parse import quote

SIZE = 1000
CX = CY = SIZE / 2
R = 499
N_RINGS = 76
N_POINTS = 17
SECTOR = 360 / N_POINTS
# Measured on reference.png: 17 tips, ~21.2° apart (360/17).
# Maroon tips 0.78 R, cream petal tips 0.90 R.
INNER = 0.78
OUTER = 0.90
CREAM = "#E8D19A"
GOLD = "#D9A441"
MAROON = "#451210"
OUT = Path(__file__).parent
PETAL_TIP = 8.4
# Maroon gap in degrees along a spade pointing inward: flat inner
# plateau, a short stem, then a wider bulb that opens to the rim.
SPADE_GAPS = (
    (0.00, 6.4),
    (0.16, 7.2),
    (0.50, 13.8),
    (1.00, 16.4),
)


def _lerp_spade(u: float) -> float:
    steps = SPADE_GAPS
    if u <= steps[0][0]:
        return steps[0][1]
    for (u0, v0), (u1, v1) in zip(steps, steps[1:]):
        if u <= u1:
            x = (u - u0) / (u1 - u0)
            x = x * x * (3 - 2 * x)
            return v0 + (v1 - v0) * x
    return steps[-1][1]


def cream_span(t: float) -> float | None:
    """Angular width of each cream petal. None = maroon rim."""
    if t < INNER:
        return SECTOR
    if t > OUTER:
        return None
    u = (t - INNER) / (OUTER - INNER)
    gap = _lerp_spade(u)
    return max(PETAL_TIP * 0.55, SECTOR - gap)


def polar(deg: float, r: float) -> tuple[float, float]:
    a = math.radians(deg - 90)
    return CX + r * math.cos(a), CY + r * math.sin(a)


def circle_el(
    r: float,
    stroke: str,
    width: float,
    dash: float | None,
    gap: float | None,
    offset: float,
    rotate: float,
) -> str:
    extra = ""
    if dash is not None and gap is not None:
        extra = (
            f' pathLength="360" stroke-dasharray="{dash:.3f} {gap:.3f}" '
            f'stroke-dashoffset="{offset:.3f}"'
        )
    return (
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{r:.3f}" fill="none" '
        f'stroke="{stroke}" stroke-width="{width:.3f}" stroke-linecap="butt" '
        f'transform="rotate({rotate:.3f} {CX:g} {CY:g})" {extra}/>'
    )


def shade(hex_color: str, factor: float) -> str:
    h = hex_color.lstrip("#")
    rgb = [int(h[i : i + 2], 16) for i in (0, 2, 4)]
    rgb = [max(0, min(255, round(c * factor))) for c in rgb]
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def gold_trim(stroke: str) -> str:
    """Gold on every cream/maroon edge: sides, petal caps, and plateau seams."""
    ring_w = R / N_RINGS
    start_i = int(INNER * N_RINGS)
    end_i = int(OUTER * N_RINGS)
    cmds: list[str] = []
    first = True
    for k in range(N_POINTS):
        mid = k * SECTOR
        for i in range(start_i, end_i + 1):
            t = min(max((i + 0.5) / N_RINGS, INNER + 1e-4), OUTER)
            span = cream_span(t) or PETAL_TIP
            r = (i + 0.5) * ring_w
            x, y = polar(mid - span / 2, r)
            cmds.append(f'{"M" if first else "L"}{x:.2f},{y:.2f}')
            first = False
        for i in range(end_i, start_i - 1, -1):
            t = min(max((i + 0.5) / N_RINGS, INNER + 1e-4), OUTER)
            span = cream_span(t) or PETAL_TIP
            r = (i + 0.5) * ring_w
            x, y = polar(mid + span / 2, r)
            cmds.append(f"L{x:.2f},{y:.2f}")
    cmds.append("Z")
    sw = ring_w * 1.35
    return (
        f'<path d="{" ".join(cmds)}" fill="none" stroke="{stroke}" '
        f'stroke-width="{sw:.2f}" stroke-linejoin="bevel" stroke-linecap="butt"/>'
    )


def rings(stroke_cream: str, include_maroon_dashes: bool) -> list[str]:
    parts: list[str] = []
    ring_w = R / N_RINGS
    start = int(INNER * N_RINGS) - 1
    for i in range(max(start, 0), N_RINGS):
        t = (i + 0.5) / N_RINGS
        span = cream_span(t)
        if span is None:
            continue
        r = (i + 0.5) * ring_w
        gap = SECTOR - span
        ridge = 1.04 if i % 2 == 0 else 0.90
        radial = 1 - 0.05 * t
        cream = shade(stroke_cream, ridge * radial) if include_maroon_dashes else stroke_cream
        parts.append(circle_el(r, cream, ring_w + 0.45, span, gap, span / 2, -90))
    return parts


def cream_disc_r() -> float:
    """Stop the solid disc short of the plateau so maroon flats show."""
    return INNER * R - R / N_RINGS


def inner_coils() -> list[str]:
    parts: list[str] = []
    ring_w = R / N_RINGS
    last = int(INNER * N_RINGS)
    for i in range(last):
        r = (i + 0.5) * ring_w
        ridge = 1.03 if i % 2 == 0 else 0.92
        color = shade(CREAM, ridge)
        parts.append(
            f'<circle cx="{CX:g}" cy="{CY:g}" r="{r:.3f}" fill="none" '
            f'stroke="{color}" stroke-width="{ring_w + 0.35:.3f}"/>'
        )
    return parts


def full_color_svg() -> str:
    inner_r = cream_disc_r()
    body = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="1000" height="1000">',
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{R}" fill="{MAROON}"/>',
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{inner_r:.3f}" fill="{CREAM}"/>',
        *inner_coils(),
        *rings(CREAM, include_maroon_dashes=True),
        gold_trim(GOLD),
        rim(),
        "</svg>",
    ]
    return "\n".join(body)


def mask_svg() -> str:
    inner_r = cream_disc_r()
    body = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">',
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{inner_r:.3f}" fill="#fff"/>',
        *rings("#fff", include_maroon_dashes=False),
        rim_mask(),
        "</svg>",
    ]
    return "\n".join(body)


def gold_mask_svg() -> str:
    body = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">',
        gold_trim("#fff"),
        "</svg>",
    ]
    return "\n".join(body)


def rim() -> str:
    """Small cream ticks at petal tips, on a mostly maroon rim."""
    r = R - 6
    tick = 2.6
    gap = SECTOR - tick
    return (
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{r}" fill="none" stroke="{CREAM}" '
        f'stroke-width="8" stroke-linecap="butt" pathLength="360" '
        f'stroke-dasharray="{tick:.3f} {gap:.3f}" stroke-dashoffset="{tick / 2:.3f}" '
        f'transform="rotate(-90 {CX:g} {CY:g})"/>'
    )


def rim_mask() -> str:
    r = R - 6
    tick = 2.6
    gap = SECTOR - tick
    return (
        f'<circle cx="{CX:g}" cy="{CY:g}" r="{r}" fill="none" stroke="#fff" '
        f'stroke-width="8" stroke-linecap="butt" pathLength="360" '
        f'stroke-dasharray="{tick:.3f} {gap:.3f}" stroke-dashoffset="{tick / 2:.3f}" '
        f'transform="rotate(-90 {CX:g} {CY:g})"/>'
    )


def css_fallback_conic() -> str:
    half = PETAL_TIP / 2
    stops: list[str] = []
    for k in range(N_POINTS):
        a0 = k * SECTOR
        a1 = a0 + PETAL_TIP
        a2 = (k + 1) * SECTOR
        stops.append(f"var(--_p) {a0:.3f}deg {a1:.3f}deg")
        stops.append(f"var(--_q) {a1:.3f}deg {a2:.3f}deg")
    return (
        f"    conic-gradient(\n"
        f"      from {-half:.2f}deg,\n"
        f"      {',\n      '.join(stops)}\n"
        f"    )"
    )


def css_with_data_uri(mask: str, gold_mask: str) -> str:
    compact = "".join(line.strip() for line in mask.splitlines())
    gold_compact = "".join(line.strip() for line in gold_mask.splitlines())
    uri = "data:image/svg+xml," + quote(compact, safe="")
    gold_uri = "data:image/svg+xml," + quote(gold_compact, safe="")
    coil = """repeating-radial-gradient(
    circle at 50% 50%,
    rgb(0 0 0 / var(--star-coil)) 0 0.45%,
    rgb(255 255 255 / 0.07) 0.55% 0.85%,
    transparent 0.95% 1.35%
  )"""
    return f"""/* Mesob motif — drop this file into any site.
 *
 * Colors:  --star-light  --star-dark  --star-gold
 * Size:    --star-size   (medallion)   --star-repeat (wallpaper)
 *
 * <div class="mesob"></div>
 * <div class="mesob mesob--sm"></div>
 * <section class="mesob-wallpaper">...</section>
 */

:root {{
  --star-light: {CREAM};
  --star-dark: {MAROON};
  --star-gold: {GOLD};
  --star-size: 12rem;
  --star-repeat: 7.5rem;
  --star-coil: 0.22;
  --star-mask: url("{uri}");
  --star-crown: url("{gold_uri}");
}}

.mesob {{
  display: inline-block;
  width: var(--star-size);
  aspect-ratio: 1;
  flex: 0 0 auto;
  border-radius: 50%;
  background-color: var(--star-dark);
  background-image: {coil};
  background-blend-mode: multiply;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--star-dark) 70%, #000);
}}

.mesob::before {{
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  background-color: var(--star-gold);
  background-image: {coil};
  background-blend-mode: multiply;
  -webkit-mask: var(--star-crown) center / contain no-repeat;
  mask: var(--star-crown) center / contain no-repeat;
}}

.mesob::after {{
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  background-color: var(--star-light);
  background-image: {coil};
  background-blend-mode: multiply;
  -webkit-mask: var(--star-mask) center / contain no-repeat;
  mask: var(--star-mask) center / contain no-repeat;
}}

.mesob--sm {{ --star-size: 2.75rem; --star-coil: 0.12; }}
.mesob--md {{ --star-size: 6.5rem; }}
.mesob--lg {{ --star-size: 18rem; --star-coil: 0.26; }}
.mesob--xl {{ --star-size: 28rem; --star-coil: 0.28; }}

.mesob--invert {{
  background-color: var(--star-light);
}}
.mesob--invert::after {{
  background-color: var(--star-dark);
}}

.mesob--quiet {{
  opacity: 0.16;
}}

.mesob-wallpaper {{
  position: relative;
  isolation: isolate;
  background-color: var(--star-dark);
}}
.mesob-wallpaper::before {{
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: var(--star-gold);
  -webkit-mask-image: var(--star-crown);
  -webkit-mask-size: var(--star-repeat) var(--star-repeat);
  -webkit-mask-repeat: repeat;
  mask-image: var(--star-crown);
  mask-size: var(--star-repeat) var(--star-repeat);
  mask-repeat: repeat;
}}
.mesob-wallpaper::after {{
  content: "";
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background-color: var(--star-light);
  -webkit-mask-image: var(--star-mask);
  -webkit-mask-size: var(--star-repeat) var(--star-repeat);
  -webkit-mask-repeat: repeat;
  mask-image: var(--star-mask);
  mask-size: var(--star-repeat) var(--star-repeat);
  mask-repeat: repeat;
}}

/* Pure CSS fallback — no mask, {N_POINTS}-fold. */
.mesob--css {{
  --_p: var(--star-light);
  --_q: var(--star-dark);
  --_g: var(--star-gold);
  background:
    repeating-radial-gradient(
      circle at 50% 50%,
      rgb(0 0 0 / var(--star-coil)) 0 0.45%,
      rgb(255 255 255 / 0.06) 0.55% 0.85%,
      transparent 0.95% 1.35%
    ),
    radial-gradient(circle at 50% 50%, transparent 0 {OUTER*100:.0f}%, var(--_q) {OUTER*100+0.2:.1f}%),
    radial-gradient(circle at 50% 50%, var(--_p) 0 {INNER*100:.0f}%, transparent {INNER*100+0.2:.1f}%),
{css_fallback_conic()};
}}
.mesob--css::before,
.mesob--css::after {{
  display: none;
}}
"""


def main() -> None:
    full = full_color_svg()
    mask = mask_svg()
    gold_mask = gold_mask_svg()
    (OUT / "mesob.svg").write_text(full, encoding="utf-8")
    (OUT / "mesob-mask.svg").write_text(mask, encoding="utf-8")
    (OUT / "mesob-crown.svg").write_text(gold_mask, encoding="utf-8")
    (OUT / "motif.css").write_text(css_with_data_uri(mask, gold_mask), encoding="utf-8")
    print("wrote mesob.svg", len(full), "bytes")
    print("wrote mesob-mask.svg", len(mask), "bytes")
    print("wrote mesob-crown.svg", len(gold_mask), "bytes")
    print("wrote motif.css")


if __name__ == "__main__":
    main()
