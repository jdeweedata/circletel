# CircleTel Image Generation Workflow

> Step-by-step process from prompt to final marketing asset

## Prerequisites

- Access to `gemini-imagegen` skill or Google AI Studio
- CircleTel logo files in `.design/logos/`
- Brand context loaded from `brand-context.yaml`

---

## Step 1: Choose Template

1. Navigate to `.design/prompts/templates/`
2. Select template matching your asset type:

| Asset Type | Template |
|------------|----------|
| Router product shot | `product-flat-lay.md` or `product-hero.md` |
| Technical diagram | `product-exploded.md` |
| Speed concept | `concept-speed.md` |
| Family scene | `lifestyle-family.md` |
| Social post | `social-promo.md` |
| Website hero | `banner-hero.md` |

---

## Step 2: Customize Prompt

1. Copy the template prompt
2. Replace `[placeholders]` with specifics:

```yaml
# Template
[product], centered top down flat lay, surrounded by [accessories]...

# Customized
5G CPE router, centered top down flat lay, surrounded by orange
ethernet cables and USB-C adapter...
```

3. Verify brand colors are included:
   - Orange: `#F5831F`
   - Charcoal: `#1F2937`
   - Background: `#E6E9EF` or white

---

## Step 3: Generate Image

### Using gemini-imagegen skill

```bash
# Invoke the skill
/skill gemini-imagegen

# Provide prompt when asked
# Specify output folder: .design/images/[category]/
```

### Using image-generator.py

1. Create YAML file in `.design/prompts/`

```yaml
images:
  - name: my-image.jpg
    type: product
    folder: products/routers
    prompt: |
      Your prompt here...
```

2. Run generator:

```bash
cd .design
python image-generator.py prompts/your-file.yaml
```

---

## Step 4: Review & Iterate

### Quality Checklist

- [ ] Product is sharp and in focus
- [ ] Brand colors appear correctly
- [ ] No AI-generated text artifacts
- [ ] Composition matches intended use
- [ ] Lighting is professional quality
- [ ] Background is clean

### If Issues Found

| Issue | Fix |
|-------|-----|
| Blurry product | Add "sharp focus, macro photography" |
| Wrong colors | Verify hex codes, add "exactly #F5831F" |
| Text artifacts | Add "no text, no labels, no words" |
| Cluttered composition | Add "clean, minimal, isolated" |
| Flat lighting | Specify "soft directional studio lighting" |

---

## Step 5: Logo Compositing

> ⚠️ **NEVER generate logos with AI** - Always composite real logos

### Using Canva/Figma

1. Export generated image
2. Import to design tool
3. Place CircleTel logo from `.design/logos/`
4. Position per brand guidelines

### Using Python (PIL)

```python
from PIL import Image

# Load images
background = Image.open('generated-image.jpg')
logo = Image.open('.design/logos/circletel-logo.png')

# Position logo (adjust coordinates)
background.paste(logo, (50, 50), logo)
background.save('final-image.jpg')
```

### Logo Placement Guidelines

| Asset Type | Logo Position | Size |
|------------|---------------|------|
| Social Square | Bottom center | 15% width |
| Hero Banner | Top left | 10% width |
| Product Shot | Don't add | N/A |
| Feature Card | Top left | 12% width |

---

## Step 6: File Organization

### Naming Convention

```
[category]-[subject]-[variant]-[version].jpg

Examples:
product-5g-router-flatlay-v1.jpg
lifestyle-family-home-v2.jpg
concept-speed-abstract-v1.jpg
banner-hero-homepage-v3.jpg
```

### Folder Structure

```
.design/images/
├── products/
│   ├── routers/
│   ├── accessories/
│   └── packaging/
├── lifestyle/
│   ├── family/
│   ├── business/
│   └── outdoor/
├── concepts/
│   ├── speed/
│   ├── coverage/
│   └── connectivity/
├── marketing/
│   ├── social/
│   ├── banners/
│   └── cards/
└── working/           # WIP images, not final
```

---

## Step 7: Documentation

After generating final assets, update the catalog:

```yaml
# .design/images/catalog.yaml
images:
  - filename: product-5g-router-flatlay-v1.jpg
    category: product
    prompt_source: templates/product-flat-lay.md
    created: 2026-03-01
    usage:
      - homepage product section
      - product comparison page
    notes: "Version 1 - approved by marketing"
```

---

## Quick Command Reference

```bash
# Generate single image
/skill gemini-imagegen

# Generate from YAML
python .design/image-generator.py prompts/your-file.yaml

# Generate multiple mockups
python .design/mockup-generator.py prompts/mockups.yaml

# List existing images
ls -la .design/images/products/
```

---

## Troubleshooting

### "Image quality is poor"

Add these quality boosters:
```
ultra realistic, commercial advertising photography,
professional studio lighting, 4K resolution, sharp focus
```

### "Colors look wrong"

Be explicit with hex codes:
```
exactly vibrant orange hex color F5831F
```

### "Background isn't clean"

Specify studio setup:
```
pure white seamless infinity curve background,
professional product photography studio
```

### "Getting text/watermarks"

Add negative modifiers:
```
no text, no watermarks, no labels, no branding, clean surface
```

---

## See Also

- `PROMPT_GUIDE.md` - Detailed prompt writing guide
- `brand-context.yaml` - Brand specifications
- `templates/` - Ready-to-use templates
- `.design/README.md` - Design system overview
