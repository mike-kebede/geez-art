#!/usr/bin/env python3
"""Externalized production build: small HTML + assets/ folder (fonts, images).

The self-contained single-file build stays for sharing; this is the deployment
form the performance rubrics want — a ~30KB HTML shell + versioned woff2
subset fonts + responsive images, all cacheable.
"""
import os, re, shutil, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

ASSETS = {
    "@@BELA@@":   ("Bela.woff2",    "fonts/subset/BelaBereka-Bold.woff2"),
    "@@NOTO400ETH@@": ("Noto400-ethiopic.woff2", "fonts/subset/NotoSansEthiopic-400-ethiopic.woff2"),
    "@@NOTO700ETH@@": ("Noto700-ethiopic.woff2", "fonts/subset/NotoSansEthiopic-700-ethiopic.woff2"),
    "@@HERO@@":   ("hero.webp",     "images/hero-street.webp"),
    "@@HERO_640@@": ("hero-640.webp", "images/hero-640.webp"),
    "@@HERO_960@@": ("hero-960.webp", "images/hero-960.webp"),
    "@@COFFEE@@": ("coffee.webp",   "images/coffee.webp"),
}

def noto_web(assets):
    css = open(os.path.join(ROOT, "fonts", "noto.css"), encoding="utf-8").read()
    blocks = re.findall(r"/\*\s*(\S+)\s*\*/\s*@font-face\s*{([^}]+)}", css)
    out = []
    for subset, body in blocks:
        wm = re.search(r"font-weight:\s*(\d+)", body)
        um = re.search(r"unicode-range:\s*([^;}]+)", body)
        weight = wm.group(1) if wm else "400"
        rel = f"fonts/subset/NotoSansEthiopic-{weight}-{subset}.woff2"
        src = os.path.join(ROOT, rel)
        if not os.path.exists(src) or os.path.getsize(src) < 1024:
            continue
        fname = f"Noto{weight}-{subset}.woff2"
        shutil.copy(src, os.path.join(assets, fname))
        out.append("@font-face{font-family:'Noto Sans Ethiopic';font-style:normal;"
                   f"font-weight:{weight};font-display:swap;"
                   f"src:url(assets/{fname}) format('woff2');"
                   + (f"unicode-range:{um.group(1).strip()};" if um else "") + "}")
    return "\n".join(out)

def build_web(name):
    tmpl = os.path.join(ROOT, "variants", f"{name}.tmpl.html")
    html = open(tmpl, encoding="utf-8").read()
    outdir = os.path.join(ROOT, "variants", "web", name)
    assets = os.path.join(outdir, "assets")
    shutil.rmtree(outdir, ignore_errors=True)
    os.makedirs(assets, exist_ok=True)
    for k, (fname, src) in ASSETS.items():
        shutil.copy(os.path.join(ROOT, src), os.path.join(assets, fname))
        html = html.replace(k, "assets/" + fname)
    html = html.replace("@@NOTO_CSS@@", noto_web(assets))
    html = html.replace("@@TOKENS@@", open(os.path.join(ROOT, "tokens.css"), encoding="utf-8").read())
    left = re.findall(r"@@[A-Z_]+@@", html)
    open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(html)
    total = sum(os.path.getsize(os.path.join(assets, f)) for f in os.listdir(assets))
    print(f"web:{name}  html={os.path.getsize(os.path.join(outdir,'index.html'))//1024}KB  assets={total//1024}KB  (leftover {set(left) if left else 'none'})")

if __name__ == "__main__":
    for n in ["editor", "gallery"]:
        build_web(n)
