"""Geometric tibeb band — integer grid, 1px axis-aligned rails."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

OUT = Path(__file__).parent

INK = "#15090B"
GOLD = "#C9962E"
UMBER = "#573928"

SW = 80
UNIT = 48
SH = UNIT * 2          # 96
MOTIF_X, MOTIF_W = 16, 48
# 1px strokes sit on the .5 so they cover one device pixel, not two.
RAIL = (4.5, 8.5, 71.5, 75.5)
SPINE = 24
CRISP = (
    f'stroke="{GOLD}" stroke-width="1" stroke-linecap="butt" '
    f'shape-rendering="crispEdges" vector-effect="non-scaling-stroke"'
)


def svg(w: int, h: int, inner: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" fill="none" preserveAspectRatio="none">\n'
        f'<rect width="{w}" height="{h}" fill="{INK}"/>\n'
        f"{inner}</svg>\n"
    )


def diamond_d(cx: int, cy: int, r: int) -> str:
    return f"M{cx},{cy - r} L{cx + r},{cy} L{cx},{cy + r} L{cx - r},{cy} Z"


def nested_diamond(cx: int, cy: int, r: int) -> str:
    mid, core = max(round(r * 0.62), 3), max(round(r * 0.22), 2)
    return (
        f'<path d="{diamond_d(cx, cy, r)}" stroke="{GOLD}" stroke-width="1" '
        f'stroke-linejoin="miter"/>\n'
        f'<path d="{diamond_d(cx, cy, mid)}" fill="{UMBER}"/>\n'
        f'<path d="{diamond_d(cx, cy, core)}" fill="{GOLD}"/>\n'
    )


def saltire(x: int, y: int, s: int) -> str:
    x2, y2 = x + s, y + s
    d = f"M{x},{y} L{x2},{y2} M{x2},{y} L{x},{y2}"
    return (
        f'<g stroke-linecap="butt">\n'
        f'<path d="{d}" stroke="{GOLD}" stroke-width="8"/>\n'
        f'<path d="{d}" stroke="{UMBER}" stroke-width="4"/>\n'
        f'<path d="{d}" stroke="{GOLD}" stroke-width="1"/>\n'
        f"</g>\n"
    )


def v_rails(h: int) -> str:
    return "".join(f'<path d="M{x},0 V{h}" {CRISP}/>\n' for x in RAIL)


def h_rails(w: int) -> str:
    return "".join(f'<path d="M0,{y} H{w}" {CRISP}/>\n' for y in RAIL)


def motif_v(rows: int = 2) -> str:
    cx = MOTIF_X + MOTIF_W // 2
    r = UNIT // 2 - 1
    parts: list[str] = []
    for i in range(rows):
        y0 = i * UNIT
        if i % 2 == 0:
            parts.append(nested_diamond(cx, y0 + UNIT // 2, r))
        else:
            parts.append(saltire(MOTIF_X, y0, MOTIF_W))
    return "".join(parts)


def motif_h(cols: int = 2) -> str:
    cy = MOTIF_X + MOTIF_W // 2
    r = UNIT // 2 - 1
    parts: list[str] = []
    for i in range(cols):
        x0 = i * UNIT
        if i % 2 == 0:
            parts.append(nested_diamond(x0 + UNIT // 2, cy, r))
        else:
            parts.append(saltire(x0, MOTIF_X, MOTIF_W))
    return "".join(parts)


def slim_v() -> str:
    return svg(SW, SH, v_rails(SH) + motif_v(2))


def slim_h() -> str:
    return svg(SH, SW, h_rails(SH) + motif_h(2))


def spine_v() -> str:
    w = h = SPINE
    mid = w / 2 + 0.5  # 12.5 — crisp 1px vertical
    inner = f'<path d="M{mid},0 V{h}" {CRISP}/>\n' + nested_diamond(w // 2, h // 2, 7)
    return svg(w, h, inner)


def spine_h() -> str:
    w = h = SPINE
    mid = h / 2 + 0.5
    inner = f'<path d="M0,{mid} H{w}" {CRISP}/>\n' + nested_diamond(w // 2, h // 2, 7)
    return svg(w, h, inner)


def full_v() -> str:
    h = SH
    gap, spine_x = 8, 88
    w = SW + gap + SPINE + gap + SW  # 200
    left = f'<g>{v_rails(h)}{motif_v(2)}</g>\n'
    spine = f'<g transform="translate({spine_x} 0)">'
    spine += f'<path d="M12.5,0 V{h}" {CRISP}/>\n'
    for i in range(h // SPINE):
        spine += nested_diamond(12, (i + 0) * SPINE + SPINE // 2, 7)
    spine += "</g>\n"
    right = f'<g transform="translate({spine_x + SPINE + gap} 0)">{v_rails(h)}{motif_v(2)}</g>\n'
    return svg(w, h, left + spine + right)


def frame_tile() -> tuple[str, int]:
    s, e = SW, SH
    f = s + e + s  # 256
    inner: list[str] = []
    for d in RAIL:
        inner.append(
            f'<rect x="{d}" y="{d}" width="{f - 2 * d}" height="{f - 2 * d}" '
            f'fill="none" {CRISP}/>\n'
        )
    inner.append(f'<g transform="translate(0 {s})">{motif_v(2)}</g>\n')
    inner.append(f'<g transform="translate({s + e} {s})">{motif_v(2)}</g>\n')
    inner.append(f'<g transform="translate({s} 0)">{motif_h(2)}</g>\n')
    inner.append(f'<g transform="translate({s} {s + e})">{motif_h(2)}</g>\n')
    for cx, cy in ((s // 2, s // 2), (f - s // 2, s // 2), (s // 2, f - s // 2), (f - s // 2, f - s // 2)):
        inner.append(nested_diamond(cx, cy, 20))
    return svg(f, f, "".join(inner)), s


def data_uri(raw: str) -> str:
    return "data:image/svg+xml," + quote(" ".join(raw.split()), safe="")


def css_text(strip, strip_h, spine, spine_h, full, frame, slice_px: int) -> str:
    # 96/80 = 1.2 → 40px band tiles at 48px wide (both integers)
    return f"""/* Geometric tibeb band — 1px crisp rails, integer grid.
 * .pattern-marker      vertical band
 * .pattern-spine       vertical spine
 * .pattern-rule        horizontal band
 * .pattern-rule-spine  horizontal spine
 * .pattern-frame       4-sided border
 */

:root {{
  --pattern-ink: {INK};
  --pattern-gold: {GOLD};
  --pattern-umber: {UMBER};
  --pattern-strip: url("{strip}");
  --pattern-strip-h: url("{strip_h}");
  --pattern-spine: url("{spine}");
  --pattern-spine-h: url("{spine_h}");
  --pattern-full: url("{full}");
  --pattern-frame: url("{frame}");
  --pattern-w: 40px;
  --pattern-spine-w: 24px;
}}

.pattern-marker {{
  width: var(--pattern-w);
  min-height: 7rem;
  background: var(--pattern-ink) var(--pattern-strip) 0 0 / 100% auto repeat-y;
  flex: 0 0 var(--pattern-w);
}}

.pattern-spine {{
  width: var(--pattern-spine-w);
  min-height: 7rem;
  background: var(--pattern-ink) var(--pattern-spine) 0 0 / 100% auto repeat-y;
  flex: 0 0 var(--pattern-spine-w);
}}

.pattern-full {{
  width: calc(var(--pattern-w) * 2.5);
  min-height: 7rem;
  background: var(--pattern-ink) var(--pattern-full) 0 0 / 100% auto repeat-y;
  flex: 0 0 calc(var(--pattern-w) * 2.5);
}}

.pattern-rule,
hr.pattern-rule {{
  display: block;
  height: var(--pattern-w);
  width: 100%;
  border: 0;
  margin: 1.25rem 0;
  background: var(--pattern-ink) var(--pattern-strip-h) 0 0 / calc(var(--pattern-w) * 1.2) 100% repeat-x;
}}

.pattern-rule-spine,
hr.pattern-rule-spine {{
  display: block;
  height: var(--pattern-spine-w);
  width: 100%;
  border: 0;
  margin: 1.25rem 0;
  background: var(--pattern-ink) var(--pattern-spine-h) 0 0 / var(--pattern-spine-w) 100% repeat-x;
}}

.pattern-frame {{
  border: var(--pattern-w) solid var(--pattern-ink);
  border-image-source: var(--pattern-frame);
  border-image-slice: {slice_px};
  border-image-repeat: repeat;
  border-image-width: var(--pattern-w);
  background-color: var(--pattern-ink);
}}

.pattern-frame--sm {{ --pattern-w: 32px; }}
.pattern-frame--lg {{ --pattern-w: 80px; }}
"""


def main() -> None:
    slim = slim_v()
    slim_h_s = slim_h()
    spine = spine_v()
    spine_h_s = spine_h()
    full = full_v()
    frame, sl = frame_tile()

    (OUT / "pattern-slim.svg").write_text(slim, encoding="utf-8")
    (OUT / "pattern-slim-h.svg").write_text(slim_h_s, encoding="utf-8")
    (OUT / "pattern-spine.svg").write_text(spine, encoding="utf-8")
    (OUT / "pattern-spine-h.svg").write_text(spine_h_s, encoding="utf-8")
    (OUT / "pattern-full.svg").write_text(full, encoding="utf-8")
    (OUT / "pattern-frame.svg").write_text(frame, encoding="utf-8")
    (OUT / "pattern.css").write_text(
        css_text("pattern-slim.svg", "pattern-slim-h.svg", "pattern-spine.svg",
                 "pattern-spine-h.svg", "pattern-full.svg", "pattern-frame.svg", sl),
        encoding="utf-8",
    )
    (OUT / "pattern.inline.css").write_text(
        css_text(data_uri(slim), data_uri(slim_h_s), data_uri(spine),
                 data_uri(spine_h_s), data_uri(full), data_uri(frame), sl),
        encoding="utf-8",
    )
    print("wrote geometric tiles")


if __name__ == "__main__":
    main()


def css_gradient_band() -> str:
    """Pure-CSS tibeb band — crisp diagonal braid (no SVG). Matches the saltire
    layering: gold 8px / umber 4px / gold 1px core, at 45deg, plus paired rails."""
    return f""".tibeb-band{{
  height:40px;
  border-top:1px solid {GOLD};
  border-bottom:1px solid {GOLD};
  box-shadow: inset 0 5px 0 {GOLD}, inset 0 -5px 0 {GOLD};
  background-image:
    repeating-linear-gradient(45deg,  {GOLD} 0 1px, transparent 1px 44px),
    repeating-linear-gradient(-45deg, {GOLD} 0 1px, transparent 1px 44px),
    repeating-linear-gradient(45deg,  {UMBER} 0 4px, transparent 4px 44px),
    repeating-linear-gradient(-45deg, {UMBER} 0 4px, transparent 4px 44px),
    repeating-linear-gradient(45deg,  {GOLD} 0 8px, transparent 8px 44px),
    repeating-linear-gradient(-45deg, {GOLD} 0 8px, transparent 8px 44px);
}}"""
