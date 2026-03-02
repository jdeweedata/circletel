---
name: brand-design
description: CircleTel brand guidelines for AI image generation. Ensures logo usage, colors, and typography are consistent across all generated assets.
version: 1.0.0
dependencies: gemini-imagegen
---

# CircleTel Brand Design

Ensures all AI-generated images follow CircleTel brand guidelines. This skill automatically injects brand context into image generation prompts and provides logo/asset references.

## When This Skill Activates

This skill automatically activates when you:
- Generate images for CircleTel (social posts, products, marketing)
- Create mockups or UI designs
- Need logo placement guidance
- Ask about brand colors, fonts, or style
- Use the gemini-imagegen skill in this project

**Keywords**: brand, logo, image, generate image, design, colors, typography, marketing image, social post, hero image, product image, circletel style

## Logo System

CircleTel has **8 logo variants** located in `.design/logos/`:

| File | Colors | Background | Use Case |
|------|--------|------------|----------|
| `LOGO-01.png` | Orange + Gray | White/Trans | **Primary** - Website, documents, formal |
| `LOGO-02.png` | Orange only | White/Trans | Single-color printing, embroidery |
| `LOGO-03.png` | Gray only | White/Trans | Neutral contexts, B&W documents |
| `LOGO-04.png` | Black only | White/Trans | High contrast, legal docs, stamps |
| `LOGO-05.png` | White only | Transparent | **Dark backgrounds** - knocked out |
| `LOGO-06.png` | White | Orange bg | **Social avatars**, app icons, favicons |
| `LOGO-07.png` | Orange + Gray | White (small) | Email signatures, small placements |
| `LOGO-08.png` | Orange + Gray | White (large) | High-res print, banners, billboards |

### Logo Selection Rules

```
IF background is dark/black → Use LOGO-05 (white knocked out)
IF social media avatar/icon → Use LOGO-06 (white on orange square)
IF print/large format → Use LOGO-08 (high-res)
IF email/small placement → Use LOGO-07 (optimized small)
IF single-color required → Use LOGO-02 (orange) or LOGO-03 (gray)
IF formal/primary use → Use LOGO-01 (orange + gray, professional)
```

### Logo Elements

The CircleTel logo consists of:
- **Dual swirl circles**: Outer orange, inner gray - represents connectivity & dynamic service
- **WiFi signal icon**: Integrated with the letter "c" - shows wireless/internet focus
- **Typography**: "circle" in lowercase orange, "TEL" in uppercase bold gray

**Clear space**: Maintain padding equal to the height of "TEL" around the logo
**Minimum size**: 32px height for digital, 10mm for print

## Brand Colors

### Primary Palette

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **CircleTel Orange** | `#F5831F` | `circleTel-orange` | Primary brand, CTAs, highlights |
| **Dark Neutral** | `#1F2937` | `circleTel-darkNeutral` | Text, headings, dark UI |
| **Light Neutral** | `#E6E9EF` | `circleTel-lightNeutral` | Backgrounds, cards |

### Extended Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Orange Light** | `#FEF3E8` | Hover states, light backgrounds |
| **Orange Dark** | `#D96F1A` | Pressed states, shadows |
| **Gray** | `#6B7280` | Secondary text, borders |
| **Success Green** | `#10B981` | Success states, confirmations |
| **Error Red** | `#EF4444` | Errors, warnings |
| **Info Blue** | `#3B82F6` | Information, links |

### Color Usage Rules

```
Primary actions → Orange (#F5831F)
Text (body) → Dark Neutral (#1F2937)
Backgrounds → Light Neutral (#E6E9EF) or white
Accents → Orange gradient or solid
Selected states → Dark Blue (#1E4B85) - for package cards
Shadows → Color-matched (orange shadow for orange elements)
```

## Typography

### Font Stack

```css
font-family: Arial, Helvetica, sans-serif;
```

### Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| 600 | `font-semibold` | Subheadings, labels |
| 700 | `font-bold` | Headings, CTAs |
| 800 | `font-extrabold` | Hero text, major headlines |

### Text Styles

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Hero headline | 48-64px | 800 | Dark Neutral |
| Section heading | 32-40px | 700 | Dark Neutral |
| Subheading | 20-24px | 600 | Dark Neutral |
| Body | 16px | 400 | Dark Neutral |
| Caption | 14px | 400 | Gray |
| Price | 24-32px | 700 | Orange |

## AI Image Generation Templates

### MANDATORY: Brand Context Injection

When generating ANY image for CircleTel, ALWAYS include this brand context:

```yaml
brand_context: |
  CircleTel Brand Guidelines:
  - Primary color: Vibrant orange (#F5831F)
  - Secondary color: Dark charcoal (#1F2937)
  - Background: Clean white or light gray (#E6E9EF)
  - Style: Modern, professional, South African market
  - Mood: Trustworthy, innovative, approachable
  - Typography: Clean sans-serif (Arial style)
  - Avoid: Overly busy designs, neon colors, clip art style
```

### Template: Product Photography

```yaml
type: product
prompt: |
  Professional product photography of [PRODUCT].

  Setting:
  - Clean white or light gray studio background
  - Soft, diffused lighting with subtle shadows
  - 3/4 angle view or hero shot

  Style:
  - E-commerce ready, high quality
  - Subtle orange accent lighting or props
  - Modern, premium feel

  CircleTel Brand:
  - Primary orange: #F5831F for any accent elements
  - Clean, uncluttered composition
  - Professional, trustworthy aesthetic
```

### Template: Social Media Post

```yaml
type: social
prompt: |
  Social media post for [CAMPAIGN/OFFER].

  Design:
  - Bold headline prominent
  - Orange gradient background or accent (#F5831F)
  - White text on dark areas
  - Clear price/offer callout

  Layout:
  - Logo placement: Bottom right corner
  - Leave space for text overlay
  - Instagram/Facebook square format (1:1)

  Style:
  - Eye-catching, scroll-stopping
  - Modern, clean typography
  - South African market appropriate
```

### Template: Hero Background

```yaml
type: hero
prompt: |
  Website hero background for [SECTION/PAGE].

  Design:
  - Wide cinematic composition (21:9 or 16:9)
  - Dark gradient on left side for text overlay
  - Subtle tech/connectivity visual elements
  - Orange accent lighting or elements (#F5831F)

  Scene:
  - [SPECIFIC SCENE DESCRIPTION]
  - Modern, professional setting
  - South African context if applicable

  Style:
  - High contrast, dramatic lighting
  - Premium, aspirational feel
  - Space for headline + CTA overlay
```

### Template: Feature Icon

```yaml
type: icon
prompt: |
  Minimal feature icon representing [FEATURE].

  Design:
  - Simple line art style
  - Orange accent (#F5831F)
  - White or transparent background
  - 64x64px icon scale

  Style:
  - Flat design, clean lines
  - Single concept, instantly recognizable
  - Consistent with other CircleTel icons
```

### Template: Marketing Illustration

```yaml
type: illustration
prompt: |
  Illustration for [PURPOSE/FEATURE].

  Elements:
  - [KEY VISUAL ELEMENTS]
  - Orange accent color (#F5831F)
  - Dark charcoal (#1F2937) for outlines/text

  Style:
  - Flat design or subtle gradients
  - Clean, modern aesthetic
  - Professional but approachable
  - South African representation if showing people
```

## Prompt Enhancement Rules

When using gemini-imagegen or any image generation:

### DO

1. **Always specify exact hex codes**: Use `#F5831F` not "orange"
2. **Include brand context**: Add the brand_context block to prompts
3. **Reference logo location**: For logo overlays, reference `.design/logos/`
4. **Specify South African context**: For lifestyle/people images
5. **Use correct aspect ratios**: Match the image type presets

### DON'T

1. **Don't use generic colors**: "Blue and orange" - specify exact hex
2. **Don't skip brand context**: Even for "quick" images
3. **Don't use wrong logo variant**: Check the selection rules above
4. **Don't overcomplicate**: Keep designs clean and professional
5. **Don't use clipart style**: Always specify "professional" or "modern"

## Image Type Quick Reference

| Type | Aspect | Resolution | Logo Variant |
|------|--------|------------|--------------|
| Product | 1:1 | 2K | Usually none (clean product shot) |
| Social Post | 1:1 | 1K | LOGO-06 (corner) or LOGO-01 |
| Social Story | 9:16 | 2K | LOGO-06 (top/bottom) |
| Hero | 21:9 | 2K-4K | Usually none (overlaid in code) |
| Feature | 4:3 | 1K | None |
| Icon | 1:1 | 512px | None |
| Banner | 21:9 | 2K | LOGO-01 or LOGO-05 |
| Email Header | 3:1 | 1K | LOGO-01 or LOGO-07 |

## File Organization

Generated images should be saved to `.design/images/`:

```
.design/images/
├── products/           # Product photography
│   └── routers/
├── sections/           # Website sections
│   ├── hero/
│   └── features/
├── marketing/          # Marketing materials
│   └── social/
├── icons/              # Feature icons
│   └── features/
└── mockups/            # UI mockups
```

## Validation Checklist

Before finalizing any generated image:

- [ ] Primary orange (#F5831F) used correctly
- [ ] No off-brand colors present
- [ ] Logo variant appropriate for background
- [ ] Clean, professional aesthetic
- [ ] South African market appropriate
- [ ] Correct aspect ratio for intended use
- [ ] Saved to correct `.design/images/` subfolder

## Logo Compositing Workflow

**CRITICAL**: Never ask AI to generate the CircleTel logo. Always composite actual logo files.

### Workflow

```
1. Generate background/content WITHOUT logo
2. Composite actual logo from .design/logos/
3. Save final branded image
```

### Helper Script

```bash
# Add logo to any image
python .design/scripts/add-logo.py image.jpg

# Options
python .design/scripts/add-logo.py image.jpg --logo 6    # LOGO-06 (white on orange)
python .design/scripts/add-logo.py image.jpg --pos bl    # Bottom-left
python .design/scripts/add-logo.py image.jpg --size 0.25 # 25% width
```

### Python API

```python
from PIL import Image

# 1. Generate background (no logo in prompt)
# 2. Composite actual logo:

background = Image.open("generated.jpg").convert("RGBA")
logo = Image.open(".design/logos/FLAT COLOUR - CIRCLE TEL LOGO-06.png").convert("RGBA")

# Resize to 20% of width
logo_w = int(background.width * 0.20)
ratio = logo_w / logo.width
logo_resized = logo.resize((logo_w, int(logo.height * ratio)), Image.Resampling.LANCZOS)

# Position bottom-right
padding = int(background.width * 0.03)
x = background.width - logo_resized.width - padding
y = background.height - logo_resized.height - padding

# Composite and save
background.paste(logo_resized, (x, y), logo_resized)
background.convert("RGB").save("final-branded.jpg", quality=95)
```

### Logo Selection for Compositing

| Background | Use Logo | Why |
|------------|----------|-----|
| Dark/gradient | **LOGO-06** | White on orange square, high visibility |
| Light/white | **LOGO-01** | Orange + gray, professional |
| Orange areas | **LOGO-05** | White only, transparent |
| Print/large | **LOGO-08** | High resolution |
| Small/email | **LOGO-07** | Optimized small |

## Integration with gemini-imagegen

When invoking the gemini-imagegen skill in this project:

1. **Generate WITHOUT logo**: Tell AI to leave space or skip logo entirely
2. **Composite actual logo**: Use `add-logo.py` or PIL code above
3. **Default to Flash model**: Use `gemini-3.1-flash-image-preview` for iteration
4. **Use Pro for text**: Switch to `gemini-3-pro-image-preview` for text-heavy designs
5. **Save as JPEG**: Always use `.jpg` extension (Gemini returns JPEG)

### Example Prompt (No Logo)

```python
prompt = """
CircleTel Brand Guidelines:
- Primary color: Vibrant orange (#F5831F)
- Secondary color: Dark charcoal (#1F2937)
- Style: Modern, professional, South African market

Create a social media post for 5G launch.
- "5G IS HERE" headline
- Orange gradient background
- Speed indicators
- Price callout "From R599/mo"

Do NOT include any logo - it will be added separately.
"""
```

---

**Version**: 1.0.0
**Last Updated**: 2026-03-01
**Maintained By**: CircleTel Development Team
**Logo Files**: `.design/logos/`
**Image Output**: `.design/images/`
