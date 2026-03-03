# CircleTel Design System

AI-powered image generation using Gemini 3.1 Flash Image.

> **Brand Skill Active**: Use `/skill brand-design` to load CircleTel brand guidelines before generating images. The skill auto-activates on keywords: `brand`, `logo`, `generate image`, `design`.

## Quick Start

```bash
# Set API key
export GEMINI_API_KEY=your_key_here

# List available image types
python image-generator.py --types

# Quick generation with type preset
python image-generator.py --type product --name "router.jpg" --prompt "A sleek 5G router"

# Generate from prompt file
python image-generator.py prompts/products/routers.yaml

# Generate ALL images in prompts folder
python image-generator.py prompts/
```

## Image Types

| Type | Aspect | Description |
|------|--------|-------------|
| `mockup` | 16:9 | UI/UX mockups and wireframes |
| `mockup-mobile` | 9:16 | Mobile app mockups |
| `product` | 1:1 | Product photography (studio) |
| `product-lifestyle` | 16:9 | Products in context |
| `hero` | 21:9 | Hero section backgrounds |
| `feature` | 4:3 | Feature illustrations |
| `icon` | 1:1 | Custom icons |
| `illustration` | 4:3 | Custom graphics |
| `social` | 1:1 | Social media posts |
| `social-story` | 9:16 | Instagram/Facebook stories |
| `banner` | 21:9 | Web banners |
| `email` | 3:1 | Email headers |
| `photo` | 16:9 | Stock-style photography |
| `infographic` | 9:16 | Data visualizations |

## Directory Structure

```
.design/
├── image-generator.py       # Main generator (flexible)
├── mockup-generator.py      # Mockup-specific generator
│
├── prompts/                 # Prompt definition files
│   ├── products/
│   │   └── routers.yaml     # Router product images
│   ├── sections/
│   │   ├── hero-backgrounds.yaml
│   │   └── features.yaml
│   ├── marketing/
│   │   └── social-posts.yaml
│   ├── icons/
│   │   └── feature-icons.yaml
│   └── _template.yaml
│
└── images/                  # Generated images (organized)
    ├── products/
    │   └── routers/
    ├── sections/
    │   ├── hero/
    │   └── features/
    ├── marketing/
    │   └── social/
    ├── icons/
    └── mockups/
```

## Prompt File Format

```yaml
# images key for image-generator.py
images:
  - name: my-image.jpg
    type: product              # Uses type preset
    folder: products/custom    # Override folder
    aspect_ratio: "1:1"        # Override aspect
    resolution: "2K"           # 1K, 2K, or 4K
    include_brand: true        # Add brand context
    prompt: |
      Your detailed prompt here...

# mockups key also supported (backward compatible)
mockups:
  - name: desktop-view.jpg
    folder: mockups/feature
    prompt: |
      UI mockup description...
```

## Usage Examples

### Quick Single Image

```bash
# Product photo
python image-generator.py --type product --name "5g-router.jpg" \
  --prompt "A sleek white 5G CPE router with external antennas"

# Hero background
python image-generator.py --type hero --name "network-bg.jpg" \
  --prompt "Abstract network visualization with orange accents"

# Social post
python image-generator.py --type social --name "promo.jpg" \
  --prompt "5G launch announcement with bold typography"

# Custom aspect ratio
python image-generator.py --type product --name "banner.jpg" \
  --aspect "21:9" --prompt "Router lineup product banner"
```

### From Prompt Files

```bash
# Single file
python image-generator.py prompts/products/routers.yaml

# All files in category
python image-generator.py prompts/marketing/

# All prompts
python image-generator.py prompts/
```

## Brand Context

All images automatically include CircleTel brand context:

- **Primary Color**: `#F5831F` (Orange)
- **Secondary**: `#1F2937` (Dark)
- **Background**: `#E6E9EF` (Light)
- **Style**: Clean, professional, South African market

To disable: `--no-brand` flag or `include_brand: false` in YAML.

## Creating New Prompts

1. **Choose category**: products, sections, marketing, icons
2. **Copy template**: `cp prompts/_template.yaml prompts/my-category/my-file.yaml`
3. **Set type**: Use appropriate type preset
4. **Write prompt**: Be specific about elements, style, colors
5. **Generate**: `python image-generator.py prompts/my-category/my-file.yaml`

## Prompt Best Practices

### Be Specific

```yaml
prompt: |
  A sleek white 5G CPE router device.

  Design:
  - Matte white rectangular body
  - LED indicators (blue/green)
  - Two external antennas

  Setting:
  - White studio background
  - Soft lighting, subtle shadows
  - 3/4 angle view

  Style: E-commerce product photography
```

### Use Type Presets

Types add automatic style prefixes:
- `product` → "Professional product photography, studio lighting..."
- `hero` → "Website hero image, cinematic, high contrast..."
- `icon` → "Minimal icon design, flat style..."

### Include Context

- Name exact colors: `#F5831F` not "orange"
- Specify angles: "3/4 view", "top-down", "eye-level"
- Reference styles: "flat design", "photorealistic", "minimal"
- Describe mood: "warm", "professional", "energetic"

## Tips

- Use `1K` resolution for quick iteration
- Use `2K` for web-ready images
- Use `4K` for print or large displays
- Group related images in the same YAML file
- Use versioned folders for iterations
