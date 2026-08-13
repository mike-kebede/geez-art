#!/usr/bin/env python3
"""Inline fonts + images into every variants/*.tmpl.html -> variants/*.html"""
import base64, os, re, glob

ROOT = os.path.dirname(os.path.abspath(__file__))

def data_uri(rel, mime):
    with open(os.path.join(ROOT, rel), "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()

SUBS = {
    "@@BELA@@":   data_uri("fonts/subset/BelaBereka-Bold.woff2", "font/woff2"),
    "@@NOTO400ETH@@": data_uri("fonts/subset/NotoSansEthiopic-400-ethiopic.woff2", "font/woff2"),
    "@@NOTO700ETH@@": data_uri("fonts/subset/NotoSansEthiopic-700-ethiopic.woff2", "font/woff2"),
    "@@HERO@@":    data_uri("images/hero-street.webp", "image/webp"),
    "@@HERO_640@@": data_uri("images/hero-640.webp", "image/webp"),
    "@@HERO_960@@": data_uri("images/hero-960.webp", "image/webp"),
    "@@COFFEE@@":  data_uri("images/coffee.webp", "image/webp"),
}

def noto_css():
    css = open(os.path.join(ROOT, "fonts", "noto.css"), encoding="utf-8").read()
    blocks = re.findall(r"/\*\s*(\S+)\s*\*/\s*@font-face\s*{([^}]+)}", css)
    out = []
    for subset, body in blocks:
        wm = re.search(r"font-weight:\s*(\d+)", body)
        um = re.search(r"unicode-range:\s*([^;}]+)", body)
        weight = wm.group(1) if wm else "400"
        rel = f"fonts/subset/NotoSansEthiopic-{weight}-{subset}.woff2"
        if not os.path.exists(os.path.join(ROOT, rel)) or os.path.getsize(os.path.join(ROOT, rel)) < 1024:
            continue
        uri = data_uri(rel, "font/woff2")
        out.append("@font-face{font-family:'Noto Sans Ethiopic';font-style:normal;"
                   f"font-weight:{weight};font-display:swap;src:url({uri}) format('woff2');"
                   + (f"unicode-range:{um.group(1).strip()};" if um else "") + "}")
    return "\n".join(out)

subs = dict(SUBS)
subs["@@NOTO_CSS@@"] = noto_css()
subs["@@TOKENS@@"] = open(os.path.join(ROOT, "tokens.css"), encoding="utf-8").read()

for tmpl in sorted(glob.glob(os.path.join(ROOT, "variants", "*.tmpl.html"))):
    name = os.path.basename(tmpl)[: -len(".tmpl.html")]
    html = open(tmpl, encoding="utf-8").read()
    missing = [k for k in subs if k in html and subs[k] == "@@NOTO_CSS@@" and False]
    for k, v in subs.items():
        html = html.replace(k, v)
    html = re.sub(r'<link rel="preload"[^>]*>\n?', '', html)
    left = re.findall(r"@@[A-Z_]+@@", html)
    if left:
        print(f"  !! {name} leftover placeholders: {set(left)}")
    out = os.path.join(ROOT, "variants", name + ".html")
    open(out, "w", encoding="utf-8").write(html)
    print(f"built {name}.html  {os.path.getsize(out)/1e6:.2f} MB")
