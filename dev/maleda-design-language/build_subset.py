#!/usr/bin/env python3
"""Subset every font to the glyphs actually used by the variants, as woff2.

Keeps the specimen self-contained while cutting the font payload from ~925KB
to a fraction (the pages use ~60 fidäl + Latin, not the full 352-glyph sets).
"""
import os, glob
from fontTools.subset import Options, load_font, save_font, Subsetter

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "fonts", "subset")
os.makedirs(OUT, exist_ok=True)

def used_codepoints():
    cps = set()
    for fn in glob.glob(os.path.join(ROOT, "variants", "*.tmpl.html")):
        t = open(fn, encoding="utf-8").read()
        cps.update(ord(c) for c in t)
    # ASCII printable always (spaces, punctuation, A-Z, 0-9)
    cps |= set(range(0x20, 0x7F))
    # NBSP, curly quotes, dashes, true minus, ellipsis, Ge'ez punctuation + Ethiopic numerals
    cps |= {
        0x00A0, 0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2026, 0x2212,
        0x1361, 0x1362, 0x1363, 0x1364, 0x1365, 0x1366, 0x1367, 0x1368,
        0x1369, 0x136A, 0x136B, 0x136C, 0x136D, 0x136E, 0x136F, 0x1370,
        0x1371, 0x1372, 0x1373, 0x1374, 0x1375,
    }
    return sorted(cps)

def subset(src, dst):
    opts = Options()
    opts.flavor = "woff2"
    opts.drop_tables += ["FFTM", "GSUB"]
    opts.layout_features = ["*"]
    font = load_font(src, opts)
    ss = Subsetter(options=opts)
    ss.populate(unicodes=used_codepoints())
    ss.subset(font)
    save_font(font, dst, opts)

jobs = [
    (os.path.join(ROOT, "fonts", "BelaBereka-Bold.ttf"),          os.path.join(OUT, "BelaBereka-Bold.woff2")),
    (os.path.join(ROOT, "fonts", "HHLemdMono-Regular.otf"),       os.path.join(OUT, "HHLemdMono-Regular.woff2")),
    (os.path.join(ROOT, "fonts", "HiburMono-Regular.woff2"),      os.path.join(OUT, "HiburMono-Regular.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-400-ethiopic.woff2"), os.path.join(OUT, "NotoSansEthiopic-400-ethiopic.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-400-latin.woff2"),    os.path.join(OUT, "NotoSansEthiopic-400-latin.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-400-latin-ext.woff2"),os.path.join(OUT, "NotoSansEthiopic-400-latin-ext.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-700-ethiopic.woff2"), os.path.join(OUT, "NotoSansEthiopic-700-ethiopic.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-700-latin.woff2"),    os.path.join(OUT, "NotoSansEthiopic-700-latin.woff2")),
    (os.path.join(ROOT, "fonts", "NotoSansEthiopic-700-latin-ext.woff2"),os.path.join(OUT, "NotoSansEthiopic-700-latin-ext.woff2")),
]

for src, dst in jobs:
    try:
        subset(src, dst)
        print(f"{os.path.basename(src):45s} {os.path.getsize(src)//1024:5d}KB -> {os.path.getsize(dst)//1024:5d}KB")
    except Exception as e:
        print(f"SKIP {os.path.basename(src)}: {e}")
