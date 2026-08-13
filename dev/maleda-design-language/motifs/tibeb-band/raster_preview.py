"""Raster the tibeb tiles with the same geometry as the SVGs."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

import generate as g

OUT = Path(__file__).parent
INK = (21, 9, 11)
GOLD = (201, 150, 46)
UMBER = (87, 57, 40)


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def diamond_pts(cx: float, cy: float, hw: float, hh: float | None, s: float) -> list[tuple[float, float]]:
    hh = hw if hh is None else hh
    return [
        ((cx) * s, (cy - hh) * s),
        ((cx + hw) * s, (cy) * s),
        ((cx) * s, (cy + hh) * s),
        ((cx - hw) * s, (cy) * s),
    ]


def draw_nested(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, s: float) -> None:
    d.polygon(diamond_pts(cx, cy, r, None, s), outline=GOLD, width=max(2, round(1.75 * s)))
    d.polygon(diamond_pts(cx, cy, r * 0.62, None, s), fill=UMBER)
    d.polygon(diamond_pts(cx, cy, r * 0.22, None, s), fill=GOLD)


def draw_saltire(d: ImageDraw.ImageDraw, x: float, y: float, size: float, s: float) -> None:
    x2, y2 = x + size, y + size
    layers = [(GOLD, size * 0.24), (UMBER, size * 0.12), (GOLD, size * 0.035)]
    for color, w in layers:
        width = max(2, round(w * s))
        d.line([(x * s, y * s), (x2 * s, y2 * s)], fill=color, width=width)
        d.line([(x2 * s, y * s), (x * s, y2 * s)], fill=color, width=width)


def draw_rails(d: ImageDraw.ImageDraw, x: float, h: float, s: float) -> None:
    w = max(2, round(1.15 * s))
    d.line([(x * s, 0), (x * s, h * s)], fill=GOLD, width=w)
    d.line([((x + 3.2) * s, 0), ((x + 3.2) * s, h * s)], fill=GOLD, width=w)


def tile_slim(s: int = 6) -> Image.Image:
    w, h = g.SW, g.SH
    img = Image.new("RGB", (w * s, h * s), INK)
    d = ImageDraw.Draw(img)
    draw_rails(d, 4, h, s)
    cx = g.MOTIF_X + g.MOTIF_W / 2
    r = g.MOTIF_W / 2 - 1.5
    draw_nested(d, cx, g.UNIT / 2, r, s)
    pad = 2.5
    draw_saltire(d, g.MOTIF_X + pad, g.UNIT + pad, g.MOTIF_W - 2 * pad, s)
    draw_rails(d, w - 8.2, h, s)
    return img


def tile_spine(s: int = 10) -> Image.Image:
    img = Image.new("RGB", (28 * s, 28 * 4 * s), INK)
    d = ImageDraw.Draw(img)
    w = max(2, round(1.15 * s))
    d.line([(14 * s, 0), (14 * s, 28 * 4 * s)], fill=GOLD, width=w)
    for i in range(4):
        cy = (i + 0.5) * 28
        d.polygon(diamond_pts(14, cy, 7.5, None, s), outline=GOLD, width=max(2, round(1.5 * s)))
        d.polygon(diamond_pts(14, cy, 3, None, s), fill=UMBER)
    return img


def compose() -> None:
    slim = tile_slim(6)
    slim2 = tile_slim(6)
    stacked = Image.new("RGB", (slim.width, slim.height * 2), INK)
    stacked.paste(slim, (0, 0))
    stacked.paste(slim2, (0, slim.height))
    stacked.save(OUT / "preview-marker.png")

    spine = tile_spine(8)
    spine.save(OUT / "preview-spine.png")

    # specimen strip: marker | spine | marker
    gap = 24
    h = max(stacked.height, spine.height)
    sheet = Image.new("RGB", (stacked.width * 2 + spine.width + gap * 4, h + gap * 2), INK)
    x = gap
    sheet.paste(stacked, (x, gap))
    x += stacked.width + gap
    sheet.paste(spine, (x, gap))
    x += spine.width + gap
    sheet.paste(stacked, (x, gap))
    sheet.save(OUT / "preview-specimen.png")
    print("wrote", OUT / "preview-specimen.png", sheet.size)


if __name__ == "__main__":
    compose()
