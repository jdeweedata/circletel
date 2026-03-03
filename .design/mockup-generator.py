#!/usr/bin/env python3
"""
CircleTel Mockup Generator - Flexible prompt-based image generation.

Usage:
    # Generate from a prompt file
    python mockup-generator.py prompts/homepage-v3.yaml

    # Generate a single mockup with inline prompt
    python mockup-generator.py --name "hero.jpg" --folder "homepage/v3" --prompt "A modern ISP homepage..."

    # Generate from all YAML files in a folder
    python mockup-generator.py prompts/

    # List available prompt files
    python mockup-generator.py --list
"""

import os
import sys
import argparse
import yaml
from pathlib import Path
from datetime import datetime

from google import genai
from google.genai import types

# Configuration
BASE_DIR = Path("/home/circletel/.design/mockups")
PROMPTS_DIR = Path("/home/circletel/.design/prompts")

# Initialize Gemini client
def get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY environment variable not set")
        sys.exit(1)
    return genai.Client(api_key=api_key)


def generate_image(client, prompt: str, filename: str, folder: str,
                   aspect_ratio: str = "16:9", resolution: str = "2K") -> str | None:
    """Generate a single mockup image."""
    output_dir = BASE_DIR / folder
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    print(f"\n🎨 Generating: {folder}/{filename}")
    print(f"   Aspect: {aspect_ratio}, Resolution: {resolution}")

    try:
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
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
    """Load mockup definitions from a YAML file."""
    with open(filepath, 'r') as f:
        data = yaml.safe_load(f)

    # Support both single mockup and list of mockups
    if isinstance(data, dict):
        if 'mockups' in data:
            return data['mockups']
        else:
            return [data]
    elif isinstance(data, list):
        return data
    else:
        print(f"❌ Invalid format in {filepath}")
        return []


def list_prompt_files():
    """List all available prompt files."""
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)

    files = list(PROMPTS_DIR.glob("**/*.yaml")) + list(PROMPTS_DIR.glob("**/*.yml"))

    if not files:
        print(f"📁 No prompt files found in {PROMPTS_DIR}")
        print("\nCreate a prompt file like this:")
        print(f"  {PROMPTS_DIR}/my-mockups.yaml")
        return

    print(f"📁 Available prompt files in {PROMPTS_DIR}:\n")
    for f in sorted(files):
        rel_path = f.relative_to(PROMPTS_DIR)
        try:
            data = yaml.safe_load(f.read_text())
            if isinstance(data, dict) and 'mockups' in data:
                count = len(data['mockups'])
            elif isinstance(data, list):
                count = len(data)
            else:
                count = 1
            print(f"  📄 {rel_path} ({count} mockups)")
        except:
            print(f"  ⚠️ {rel_path} (invalid)")


def generate_from_file(client, filepath: Path):
    """Generate all mockups defined in a prompt file."""
    print(f"\n📄 Loading: {filepath}")
    mockups = load_prompt_file(filepath)

    if not mockups:
        return []

    print(f"   Found {len(mockups)} mockup(s)")

    results = []
    for mockup in mockups:
        path = generate_image(
            client,
            prompt=mockup.get('prompt', ''),
            filename=mockup.get('name', 'output.jpg'),
            folder=mockup.get('folder', 'misc'),
            aspect_ratio=mockup.get('aspect_ratio', '16:9'),
            resolution=mockup.get('resolution', '2K')
        )
        results.append((mockup.get('name'), path))

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Generate CircleTel mockups from prompt files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s prompts/homepage-v3.yaml     Generate from a prompt file
  %(prog)s prompts/                     Generate from all YAML files in folder
  %(prog)s --list                       List available prompt files
  %(prog)s --name hero.jpg --folder homepage/v3 --prompt "A modern..."
        """
    )

    parser.add_argument('path', nargs='?', help='Prompt file or directory')
    parser.add_argument('--list', action='store_true', help='List available prompt files')
    parser.add_argument('--name', help='Output filename (for inline prompts)')
    parser.add_argument('--folder', default='misc', help='Output folder')
    parser.add_argument('--prompt', help='Inline prompt text')
    parser.add_argument('--aspect', default='16:9', help='Aspect ratio (default: 16:9)')
    parser.add_argument('--resolution', default='2K', help='Resolution: 1K, 2K, 4K (default: 2K)')

    args = parser.parse_args()

    # List mode
    if args.list:
        list_prompt_files()
        return

    # Inline prompt mode
    if args.prompt and args.name:
        client = get_client()
        generate_image(
            client,
            prompt=args.prompt,
            filename=args.name,
            folder=args.folder,
            aspect_ratio=args.aspect,
            resolution=args.resolution
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
    print("📊 SUMMARY")
    print("=" * 60)
    success = sum(1 for _, p in results if p)
    print(f"✅ Generated: {success}/{len(results)}")
    print(f"📁 Output: {BASE_DIR}")


if __name__ == "__main__":
    main()
