#!/usr/bin/env python3
"""
CircleTel Image Generator - Generate any type of image with brand consistency.

Supports:
  - UI Mockups (desktop, mobile, tablet)
  - Product Images (routers, devices, equipment)
  - Section Assets (hero backgrounds, feature illustrations)
  - Marketing (social posts, banners, ads)
  - Icons & Graphics (custom icons, infographics)
  - Lifestyle & Photography (stock-style photos)

Usage:
    # Generate from a prompt file
    python image-generator.py prompts/products/routers.yaml

    # Quick generation with type preset
    python image-generator.py --type product --name "5g-router.jpg" --prompt "A sleek white 5G router..."

    # List available types and templates
    python image-generator.py --types
    python image-generator.py --list
"""

import os
import sys
import argparse
import yaml
from pathlib import Path
from datetime import datetime

from google import genai
from google.genai import types

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_DIR = Path("/home/circletel/.design")
OUTPUT_DIR = BASE_DIR / "images"
PROMPTS_DIR = BASE_DIR / "prompts"

# CircleTel Brand Context - Appended to all prompts for consistency
BRAND_CONTEXT = """
Brand Guidelines:
- Primary Color: #F5831F (CircleTel Orange)
- Secondary: #1F2937 (Dark Neutral)
- Background: #E6E9EF (Light Neutral)
- Typography: Modern sans-serif (Inter, SF Pro, or similar)
- Style: Clean, professional, South African market
- Logo: "CircleTel" with orange circle accent
"""

# Image Type Presets
IMAGE_TYPES = {
    "mockup": {
        "description": "UI/UX mockups and wireframes",
        "folder": "mockups",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "style_prefix": "High-fidelity UI mockup, Figma quality, pixel-perfect,",
    },
    "mockup-mobile": {
        "description": "Mobile app mockups (iPhone/Android)",
        "folder": "mockups",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "style_prefix": "High-fidelity mobile UI mockup, iPhone 15 Pro, iOS native feel,",
    },
    "product": {
        "description": "Product photography (routers, devices, equipment)",
        "folder": "products",
        "aspect_ratio": "1:1",
        "resolution": "2K",
        "style_prefix": "Professional product photography, studio lighting, white background, e-commerce quality,",
    },
    "product-lifestyle": {
        "description": "Products in context (home/office settings)",
        "folder": "products",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "style_prefix": "Lifestyle product photography, natural lighting, modern home/office setting,",
    },
    "hero": {
        "description": "Hero section backgrounds and images",
        "folder": "sections/hero",
        "aspect_ratio": "21:9",
        "resolution": "2K",
        "style_prefix": "Website hero image, cinematic, high contrast, professional,",
    },
    "feature": {
        "description": "Feature section illustrations",
        "folder": "sections/features",
        "aspect_ratio": "4:3",
        "resolution": "2K",
        "style_prefix": "Clean feature illustration, minimal style, professional,",
    },
    "icon": {
        "description": "Custom icons and small graphics",
        "folder": "icons",
        "aspect_ratio": "1:1",
        "resolution": "1K",
        "style_prefix": "Minimal icon design, flat style, single color with orange accent,",
    },
    "illustration": {
        "description": "Custom illustrations and graphics",
        "folder": "illustrations",
        "aspect_ratio": "4:3",
        "resolution": "2K",
        "style_prefix": "Modern illustration, flat design with subtle gradients, professional,",
    },
    "social": {
        "description": "Social media posts (Instagram/Facebook)",
        "folder": "marketing/social",
        "aspect_ratio": "1:1",
        "resolution": "2K",
        "style_prefix": "Social media post, eye-catching, bold typography, marketing quality,",
    },
    "social-story": {
        "description": "Social media stories (Instagram/Facebook)",
        "folder": "marketing/social",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "style_prefix": "Social media story, vertical format, engaging, swipe-up friendly,",
    },
    "banner": {
        "description": "Web banners and ads",
        "folder": "marketing/banners",
        "aspect_ratio": "21:9",
        "resolution": "2K",
        "style_prefix": "Web banner, clean design, clear CTA, advertising quality,",
    },
    "email": {
        "description": "Email header images",
        "folder": "marketing/email",
        "aspect_ratio": "3:1",
        "resolution": "1K",
        "style_prefix": "Email header image, clean, professional, optimized for email clients,",
    },
    "photo": {
        "description": "Stock-style photography",
        "folder": "photos",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "style_prefix": "Professional photography, natural lighting, authentic South African context,",
    },
    "infographic": {
        "description": "Data visualizations and infographics",
        "folder": "infographics",
        "aspect_ratio": "9:16",
        "resolution": "2K",
        "style_prefix": "Clean infographic, data visualization, easy to read, professional,",
    },
    "comparison": {
        "description": "Before/after or comparison images",
        "folder": "marketing/comparisons",
        "aspect_ratio": "16:9",
        "resolution": "2K",
        "style_prefix": "Comparison layout, clear side-by-side, professional presentation,",
    },
}


def get_client():
    """Initialize Gemini client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY environment variable not set")
        print("   Set it with: export GEMINI_API_KEY=your_key")
        sys.exit(1)
    return genai.Client(api_key=api_key)


def generate_image(
    client,
    prompt: str,
    filename: str,
    folder: str,
    aspect_ratio: str = "16:9",
    resolution: str = "2K",
    image_type: str = None,
    include_brand: bool = True,
) -> str | None:
    """Generate a single image."""

    # Apply type preset if specified
    style_prefix = ""
    if image_type and image_type in IMAGE_TYPES:
        preset = IMAGE_TYPES[image_type]
        style_prefix = preset.get("style_prefix", "")
        if not folder or folder == "misc":
            folder = preset.get("folder", "misc")
        if aspect_ratio == "16:9":  # Only override if default
            aspect_ratio = preset.get("aspect_ratio", aspect_ratio)
        if resolution == "2K":  # Only override if default
            resolution = preset.get("resolution", resolution)

    # Build final prompt
    full_prompt = prompt
    if style_prefix:
        full_prompt = f"{style_prefix}\n\n{prompt}"
    if include_brand:
        full_prompt = f"{full_prompt}\n\n{BRAND_CONTEXT}"

    # Create output directory
    output_dir = OUTPUT_DIR / folder
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    print(f"\n🎨 Generating: {folder}/{filename}")
    print(f"   Type: {image_type or 'custom'}")
    print(f"   Aspect: {aspect_ratio}, Resolution: {resolution}")

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[full_prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size=resolution
                ),
            ),
        )

        for part in response.parts:
            if part.inline_data:
                image = part.as_image()
                image.save(str(output_path))
                print(f"   ✅ Saved: {output_path}")
                return str(output_path)
            elif part.text:
                print(f"   📝 Note: {part.text[:100]}...")

        print("   ⚠️ No image generated")
        return None

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None


def load_prompt_file(filepath: Path) -> list[dict]:
    """Load image definitions from a YAML file."""
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)

    if isinstance(data, dict):
        if "images" in data:
            return data["images"]
        elif "mockups" in data:  # Backward compatibility
            return data["mockups"]
        else:
            return [data]
    elif isinstance(data, list):
        return data
    else:
        print(f"❌ Invalid format in {filepath}")
        return []


def list_types():
    """List available image types."""
    print("\n📷 Available Image Types:\n")
    print(f"{'Type':<18} {'Aspect':<8} {'Folder':<25} Description")
    print("-" * 80)
    for name, config in IMAGE_TYPES.items():
        print(
            f"{name:<18} {config['aspect_ratio']:<8} {config['folder']:<25} {config['description']}"
        )
    print("\nUsage: python image-generator.py --type product --name router.jpg --prompt '...'")


def list_prompt_files():
    """List all available prompt files."""
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)

    files = list(PROMPTS_DIR.glob("**/*.yaml")) + list(PROMPTS_DIR.glob("**/*.yml"))

    if not files:
        print(f"📁 No prompt files found in {PROMPTS_DIR}")
        return

    print(f"📁 Available prompt files:\n")
    for f in sorted(files):
        rel_path = f.relative_to(PROMPTS_DIR)
        try:
            data = yaml.safe_load(f.read_text())
            if isinstance(data, dict):
                items = data.get("images", data.get("mockups", [data]))
                count = len(items) if isinstance(items, list) else 1
            elif isinstance(data, list):
                count = len(data)
            else:
                count = 1
            print(f"  📄 {rel_path} ({count} images)")
        except:
            print(f"  ⚠️ {rel_path} (invalid)")


def generate_from_file(client, filepath: Path) -> list:
    """Generate all images defined in a prompt file."""
    print(f"\n📄 Loading: {filepath}")
    images = load_prompt_file(filepath)

    if not images:
        return []

    print(f"   Found {len(images)} image(s)")

    results = []
    for img in images:
        path = generate_image(
            client,
            prompt=img.get("prompt", ""),
            filename=img.get("name", "output.jpg"),
            folder=img.get("folder", "misc"),
            aspect_ratio=img.get("aspect_ratio", "16:9"),
            resolution=img.get("resolution", "2K"),
            image_type=img.get("type"),
            include_brand=img.get("include_brand", True),
        )
        results.append((img.get("name"), path))

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Generate CircleTel images with brand consistency",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # From prompt files
  %(prog)s prompts/products/routers.yaml
  %(prog)s prompts/

  # Quick generation with type preset
  %(prog)s --type product --name router.jpg --prompt "A sleek white 5G CPE router"
  %(prog)s --type hero --name homepage-bg.jpg --prompt "Abstract network visualization"
  %(prog)s --type social --name promo.jpg --prompt "5G launch announcement"

  # List options
  %(prog)s --types                    # Show image type presets
  %(prog)s --list                     # Show available prompt files
        """,
    )

    parser.add_argument("path", nargs="?", help="Prompt file or directory")
    parser.add_argument("--types", action="store_true", help="List image type presets")
    parser.add_argument("--list", action="store_true", help="List prompt files")
    parser.add_argument("--type", choices=IMAGE_TYPES.keys(), help="Image type preset")
    parser.add_argument("--name", help="Output filename")
    parser.add_argument("--folder", help="Output folder (overrides type default)")
    parser.add_argument("--prompt", help="Inline prompt text")
    parser.add_argument("--aspect", help="Aspect ratio (overrides type default)")
    parser.add_argument("--resolution", default="2K", help="Resolution: 1K, 2K, 4K")
    parser.add_argument("--no-brand", action="store_true", help="Skip brand context")

    args = parser.parse_args()

    # List modes
    if args.types:
        list_types()
        return

    if args.list:
        list_prompt_files()
        return

    # Inline prompt mode
    if args.prompt and args.name:
        client = get_client()

        # Get defaults from type
        folder = args.folder
        aspect = args.aspect

        if args.type:
            preset = IMAGE_TYPES[args.type]
            if not folder:
                folder = preset["folder"]
            if not aspect:
                aspect = preset["aspect_ratio"]

        generate_image(
            client,
            prompt=args.prompt,
            filename=args.name,
            folder=folder or "misc",
            aspect_ratio=aspect or "16:9",
            resolution=args.resolution,
            image_type=args.type,
            include_brand=not args.no_brand,
        )
        return

    # File/directory mode
    if not args.path:
        parser.print_help()
        return

    path = Path(args.path)
    client = get_client()

    if path.is_file():
        results = generate_from_file(client, path)
    elif path.is_dir():
        files = list(path.glob("**/*.yaml")) + list(path.glob("**/*.yml"))
        if not files:
            print(f"❌ No YAML files found in {path}")
            return

        results = []
        for f in sorted(files):
            results.extend(generate_from_file(client, f))
    else:
        # Try as relative to PROMPTS_DIR
        full_path = PROMPTS_DIR / path
        if full_path.exists():
            results = generate_from_file(client, full_path)
        else:
            print(f"❌ Path not found: {path}")
            return

    # Summary
    print("\n" + "=" * 60)
    success = sum(1 for _, p in results if p)
    print(f"✅ Generated: {success}/{len(results)}")
    print(f"📁 Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
