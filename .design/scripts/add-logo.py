#!/usr/bin/env python3
"""
CircleTel Logo Compositor
Adds actual CircleTel logos to generated images.

Usage:
  python add-logo.py input.jpg                    # Uses LOGO-01 (default)
  python add-logo.py input.jpg --logo 6           # Uses LOGO-06 (white on orange)
  python add-logo.py input.jpg --logo 5 --pos tl  # Top-left, white logo
  python add-logo.py input.jpg --size 0.25        # 25% of image width

Logo variants:
  1: Orange + Gray (primary, professional)
  2: Orange only (single color)
  3: Gray only (monochrome)
  4: Black only (high contrast)
  5: White only (dark backgrounds)
  6: White on orange bg (social avatars)
  7: Orange + Gray small (email signatures)
  8: Orange + Gray large (print/banners)
"""

import argparse
from pathlib import Path
from PIL import Image

LOGOS_DIR = Path(__file__).parent.parent / "logos"
LOGO_FILES = {
    1: "FLAT COLOUR - CIRCLE TEL LOGO-01.png",
    2: "FLAT COLOUR - CIRCLE TEL LOGO-02.png",
    3: "FLAT COLOUR - CIRCLE TEL LOGO-03.png",
    4: "FLAT COLOUR - CIRCLE TEL LOGO-04.png",
    5: "FLAT COLOUR - CIRCLE TEL LOGO-05.png",
    6: "FLAT COLOUR - CIRCLE TEL LOGO-06.png",
    7: "FLAT COLOUR - CIRCLE TEL LOGO-07.png",
    8: "FLAT COLOUR - CIRCLE TEL LOGO-08.png",
}

POSITIONS = {
    "br": lambda w, h, lw, lh, p: (w - lw - p, h - lh - p),  # bottom-right
    "bl": lambda w, h, lw, lh, p: (p, h - lh - p),           # bottom-left
    "tr": lambda w, h, lw, lh, p: (w - lw - p, p),           # top-right
    "tl": lambda w, h, lw, lh, p: (p, p),                    # top-left
    "bc": lambda w, h, lw, lh, p: ((w - lw) // 2, h - lh - p),  # bottom-center
    "tc": lambda w, h, lw, lh, p: ((w - lw) // 2, p),        # top-center
}


def add_logo(
    input_path: str,
    output_path: str = None,
    logo_variant: int = 1,
    position: str = "br",
    size_ratio: float = 0.20,
    padding_ratio: float = 0.03,
):
    """Add CircleTel logo to an image."""

    # Load background
    bg = Image.open(input_path).convert("RGBA")
    bg_w, bg_h = bg.size

    # Load logo
    logo_file = LOGOS_DIR / LOGO_FILES[logo_variant]
    if not logo_file.exists():
        raise FileNotFoundError(f"Logo not found: {logo_file}")

    logo = Image.open(logo_file).convert("RGBA")

    # Resize logo
    logo_w = int(bg_w * size_ratio)
    ratio = logo_w / logo.width
    logo_h = int(logo.height * ratio)
    logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

    # Calculate position
    padding = int(bg_w * padding_ratio)
    pos_func = POSITIONS.get(position, POSITIONS["br"])
    x, y = pos_func(bg_w, bg_h, logo_w, logo_h, padding)

    # Composite
    bg.paste(logo_resized, (x, y), logo_resized)

    # Save
    if output_path is None:
        p = Path(input_path)
        output_path = str(p.parent / f"{p.stem}-branded{p.suffix}")

    bg.convert("RGB").save(output_path, "JPEG", quality=95)
    print(f"✅ Saved: {output_path}")
    print(f"   Logo: LOGO-0{logo_variant} at {position}")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Add CircleTel logo to images")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("-o", "--output", help="Output path (default: input-branded.jpg)")
    parser.add_argument("-l", "--logo", type=int, default=1, choices=range(1, 9),
                        help="Logo variant 1-8 (default: 1)")
    parser.add_argument("-p", "--pos", default="br", choices=POSITIONS.keys(),
                        help="Position: br, bl, tr, tl, bc, tc (default: br)")
    parser.add_argument("-s", "--size", type=float, default=0.20,
                        help="Logo size as ratio of image width (default: 0.20)")
    parser.add_argument("--padding", type=float, default=0.03,
                        help="Padding as ratio of image width (default: 0.03)")

    args = parser.parse_args()

    add_logo(
        args.input,
        args.output,
        logo_variant=args.logo,
        position=args.pos,
        size_ratio=args.size,
        padding_ratio=args.padding,
    )


if __name__ == "__main__":
    main()
