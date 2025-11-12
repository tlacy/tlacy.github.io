#!/usr/bin/env python3
"""
tools/annotate_banner.py

Rasterize `img/banner-combined.svg` to `img/banner-final.png` (if needed) using
ImageMagick, then annotate the PNG with a readable caption and write
`img/banner-final-text.png`.

Usage:
  python3 tools/annotate_banner.py

Notes:
  - Requires Pillow (install with `python3 -m pip install --user pillow`).
  - If `img/banner-final.png` does not exist the script will try to call
    ImageMagick (`magick` or `convert`) to rasterize `img/banner-combined.svg`.
    If ImageMagick isn't installed, the script will print an instructive error
    and exit with a non-zero code.
"""
from __future__ import annotations
import os
import sys
import shutil
import subprocess

SRC_SVG = os.path.join("img", "banner-combined.svg")
SRC_PNG = os.path.join("img", "banner-final.png")
OUT_PNG = os.path.join("img", "banner-final-text.png")
TEXT = "Open to engineering leadership — Austin / Remote"
IMG_WIDTH = 1584
IMG_HEIGHT = 396

def ensure_pillow() -> bool:
    try:
        from PIL import Image  # noqa: F401
        return True
    except Exception:
        print("Pillow is not installed. Install with: python3 -m pip install --user pillow", file=sys.stderr)
        return False

def rasterize_svg() -> bool:
    magick = shutil.which("magick") or shutil.which("convert")
    if not magick:
        print("ImageMagick not found on PATH. Install via Homebrew: 'brew install imagemagick' or install ImageMagick and ensure 'magick' is in your PATH.", file=sys.stderr)
        return False
    cmd = [magick, "-density", "300", SRC_SVG, "-resize", f"{IMG_WIDTH}x{IMG_HEIGHT}!", SRC_PNG]
    print("Rasterizing SVG into PNG with command:", " ".join(cmd))
    try:
        subprocess.check_call(cmd)
        return True
    except subprocess.CalledProcessError as e:
        print("ImageMagick rasterize failed:", e, file=sys.stderr)
        return False

def annotate() -> int:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception:
        print("Pillow is required but not available. Install with: python3 -m pip install --user pillow", file=sys.stderr)
        return 2

    try:
        img = Image.open(SRC_PNG).convert("RGBA")
    except FileNotFoundError:
        print(f"{SRC_PNG} not found; cannot annotate.", file=sys.stderr)
        return 3

    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/Library/Fonts/Arial.ttf", 26)
    except Exception:
        # Fall back to default bitmap font
        font = ImageFont.load_default()

    text = TEXT
    # Compute text width/height in a Pillow-version-safe way
    try:
        # Pillow >= 8: textbbox is available and more accurate
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
    except Exception:
        try:
            w, h = font.getsize(text)
        except Exception:
            # Fallback: estimate size
            w, h = (len(text) * 8, 24)
    padding = 20
    x = img.width - w - padding - 60
    y = 40

    # Semi-opaque band behind the text for contrast
    band_x0 = x - padding
    band_y0 = y - padding // 2
    band_x1 = img.width - 40
    band_y1 = y + h + padding // 2
    draw.rectangle([band_x0, band_y0, band_x1, band_y1], fill=(0, 0, 0, 150))

    # Draw subtle shadow then white text
    draw.text((x + 1, y + 1), text, font=font, fill=(0, 0, 0, 255))
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

    img.save(OUT_PNG)
    print("Wrote:", OUT_PNG)
    return 0

def main() -> int:
    # Ensure Pillow is installed before doing anything else
    if not ensure_pillow():
        return 10

    if not os.path.exists(SRC_PNG):
        if not os.path.exists(SRC_SVG):
            print(f"Source SVG {SRC_SVG} is missing. Place a banner SVG in img/ or create {SRC_PNG} manually.", file=sys.stderr)
            return 11
        ok = rasterize_svg()
        if not ok:
            return 12

    return annotate()

if __name__ == '__main__':
    sys.exit(main())
