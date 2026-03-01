# CircleTel AI Image Prompt Library

> Professional prompt templates for generating marketing assets

## Quick Start

```bash
# 1. Choose a template
ls .design/prompts/templates/

# 2. Copy and customize the prompt
cat .design/prompts/templates/product-hero.md

# 3. Generate image
/skill gemini-imagegen
# OR
python .design/image-generator.py prompts/your-file.yaml

# 4. Composite logo (never AI-generate logos)
# Use Canva/Figma with logos from .design/logos/
```

## Directory Structure

```
.design/prompts/
├── README.md                 # This file
├── PROMPT_GUIDE.md           # Learn prompt writing techniques
├── WORKFLOW.md               # Step-by-step generation process
├── brand-context.yaml        # Brand colors, styles, context
├── _template.yaml            # YAML template for batch generation
│
├── templates/                # Ready-to-use prompt templates
│   ├── product-flat-lay.md   # Top-down product shots
│   ├── product-exploded.md   # Technical teardown views
│   ├── product-hero.md       # Dramatic product angles
│   ├── concept-speed.md      # Speed/performance visuals
│   ├── concept-coverage.md   # Coverage/signal visuals
│   ├── lifestyle-family.md   # Family usage scenes
│   ├── lifestyle-business.md # B2B office scenes
│   ├── social-promo.md       # Social media graphics
│   ├── banner-hero.md        # Website hero banners
│   │
│   └── advanced/             # Phase 2: Advanced techniques
│       ├── portrait-split-typography.md   # Split face with text mask
│       ├── poster-photo-mosaic.md         # Grid composite tribute
│       ├── portrait-flash-editorial.md    # 90s B&W flash portraits
│       ├── product-split-digital.md       # Half realistic, half UI
│       ├── character-mascot.md            # Anthropomorphic products
│       ├── collage-multi-panel.md         # Editorial panel layouts
│       ├── composite-surreal-aerial.md    # Giant product composites
│       └── animation-exploded-view.md     # Video/motion prompts
│
├── products/                 # Product-specific prompts
│   └── routers.yaml          # Router product images
│
├── sections/                 # Website section prompts
│   ├── features.yaml         # Feature section images
│   └── hero-backgrounds.yaml # Hero background images
│
├── marketing/                # Marketing asset prompts
│   └── social-posts.yaml     # Social media post images
│
└── icons/                    # Icon generation prompts
    └── feature-icons.yaml    # Feature icons
```

## Template Categories

### Hardware Products

| Template | Use For |
|----------|---------|
| `product-flat-lay.md` | Unboxing shots, package contents |
| `product-exploded.md` | Technical/engineering appeal |
| `product-hero.md` | Landing pages, ads |

### Service Concepts

| Template | Use For |
|----------|---------|
| `concept-speed.md` | Speed/performance messaging |
| `concept-coverage.md` | Coverage/reliability messaging |

### Lifestyle

| Template | Use For |
|----------|---------|
| `lifestyle-family.md` | Consumer/home messaging |
| `lifestyle-business.md` | B2B/enterprise messaging |

### Marketing

| Template | Use For |
|----------|---------|
| `social-promo.md` | Instagram, Facebook, Twitter, LinkedIn |
| `banner-hero.md` | Website hero sections |

### Advanced Techniques (Phase 2)

| Template | Use For |
|----------|---------|
| `advanced/portrait-split-typography.md` | CEO portraits, tagline reveals, team spotlights |
| `advanced/poster-photo-mosaic.md` | Company anniversaries, customer success walls |
| `advanced/portrait-flash-editorial.md` | Technician portraits, authentic team photos |
| `advanced/product-split-digital.md` | Hardware+software features, ecosystem visuals |
| `advanced/character-mascot.md` | Social engagement, friendly mascot content |
| `advanced/collage-multi-panel.md` | Customer journeys, unboxing stories |
| `advanced/composite-surreal-aerial.md` | Viral campaigns, brand awareness |
| `advanced/animation-exploded-view.md` | Video content, product breakdowns |

## Brand Colors (Always Use)

| Color | Hex | Usage |
|-------|-----|-------|
| **Orange** | `#F5831F` | Primary - accents, LEDs, highlights |
| **Charcoal** | `#1F2937` | Secondary - backgrounds, text |
| **Light Gray** | `#E6E9EF` | Backgrounds (lifestyle) |
| **White** | `#FFFFFF` | Backgrounds (studio) |

## The 7-Part Prompt Formula

```
[Subject] + [Composition] + [Context/Props] + [Materials] +
[Lighting] + [Quality Signals] + [Technical Specs]
```

**Example:**
```
CircleTel 5G router,           # Subject
centered 3/4 hero angle,       # Composition
with orange cables,            # Context
matte black glossy surface,    # Materials
dramatic studio lighting,      # Lighting
ultra realistic commercial,    # Quality
85mm f/2.8, 4K, 16:9          # Technical
```

## Quick Reference

### Quality Signals (Add to All Prompts)
```
ultra realistic, commercial product photography,
professional studio lighting, sharp focus, 4K resolution,
no AI-generated text
```

### Common Aspect Ratios
```
1:1   - Instagram square, product thumbnails
9:16  - Instagram stories, TikTok
16:9  - Website sections, YouTube thumbnails
21:9  - Hero banners, cinematic
4:3   - Feature cards
```

### South African Context (Lifestyle Only)
```
diverse South African family, modern African home,
Johannesburg/Cape Town skyline, African-inspired decor,
local business context
```

## Workflow Summary

1. **Select template** from `templates/`
2. **Customize placeholders** with your specifics
3. **Verify brand colors** (#F5831F orange)
4. **Generate image** via gemini-imagegen or image-generator.py
5. **Review quality** against checklist
6. **Composite logo** from `.design/logos/` (never AI-generate)
7. **Save to** `.design/images/[category]/`

## Common Mistakes to Avoid

| ❌ Don't | ✅ Do |
|----------|------|
| "beautiful amazing" | Specific material descriptions |
| AI-generate logos | Composite real logos in post |
| 150+ word prompts | Keep to 50-80 words |
| Forget aspect ratio | Always specify (1:1, 16:9, etc.) |
| Generic backgrounds | Use brand colors |
| Skip "no text" | Add to prevent artifacts |

## Documentation

- **[PROMPT_GUIDE.md](PROMPT_GUIDE.md)** - Deep dive into prompt writing
- **[WORKFLOW.md](WORKFLOW.md)** - Step-by-step generation process
- **[brand-context.yaml](brand-context.yaml)** - Full brand specifications

## Related Resources

- `.design/logos/` - CircleTel logo files for compositing
- `.design/images/` - Generated images organized by category
- `.design/image-generator.py` - Batch generation script
- `.design/mockup-generator.py` - UI mockup generation script
