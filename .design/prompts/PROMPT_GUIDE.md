# CircleTel AI Image Generation Prompt Guide

> Learn to craft effective prompts for professional marketing assets

## Table of Contents

1. [Anatomy of Effective Prompts](#anatomy-of-effective-prompts)
2. [Pattern Breakdown](#pattern-breakdown)
3. [CircleTel Brand Integration](#circletel-brand-integration)
4. [Template Categories](#template-categories)
5. [Common Mistakes](#common-mistakes)
6. [Iteration Techniques](#iteration-techniques)

---

## Anatomy of Effective Prompts

### The 7-Part Formula

Every high-quality prompt follows this structure:

```
[Subject] + [Composition] + [Context/Props] + [Material Details] +
[Lighting] + [Quality Signals] + [Technical Specs]
```

### Example Breakdown

```
5G CPE router,                              # 1. Subject
centered top down flat lay,                 # 2. Composition
surrounded by ethernet cables and tech      # 3. Context/Props
  accessories in orange (#F5831F),
glossy surface with LED glow reflections,   # 4. Material Details
soft directional studio lighting,           # 5. Lighting
ultra realistic commercial photography,     # 6. Quality Signals
100mm lens, f/8, 4K, 1:1                   # 7. Technical Specs
```

---

## Pattern Breakdown

### Pattern 1: Top-Down Flat Lay (Products)

**Best for:** Hardware, accessories, package contents

```
[product], centered top down flat lay, surrounded by [accessories],
[material details], [dynamic elements like glow or shadows],
[background color] seamless background, soft directional lighting,
crisp realistic shadow, high end product advertising, ultra realistic
macro product photography, 100mm lens look, f/8 sharp focus,
clean composition, no extra text, 4K, 1:1
```

**Key Elements:**

| Element | Purpose | Example |
|---------|---------|---------|
| `centered top down flat lay` | Camera angle | Establishes overhead view |
| `surrounded by [accessories]` | Context | Cables, adapters, documentation |
| `glossy/matte surface` | Material | Defines product finish |
| `crisp realistic shadow` | Grounding | Adds depth and realism |
| `no extra text` | Prevents artifacts | Avoids AI-generated text |

### Pattern 2: Exploded View (Technical)

**Best for:** Engineering credibility, technical audiences

```
[product], high-end product advertising, white seamless background,
exploded view with inner mechanics revealed, outer shell hovering
above core, [internal components] suspended, perfect alignment
guides implied, [accent color] lighting on key components,
crisp soft shadow, ultra realistic, macro product photography,
100mm lens look, f/8, 4K, 16:9
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `exploded view` | Shows engineering depth |
| `outer shell hovering` | Creates spatial separation |
| `components suspended` | Technical credibility |
| `alignment guides implied` | Precision aesthetic |

### Pattern 3: Hero Angle (Marketing)

**Best for:** Landing pages, ads, social media

```
[product] in dramatic 3/4 hero angle, [signature feature] prominently
visible, [accent color] LED indicators glowing, placed on [surface],
[background style], cinematic lighting from above-left, subtle
lens flare, depth of field with sharp product focus, commercial
advertising photography, 85mm lens, f/2.8, 4K, 16:9
```

### Pattern 4: Lifestyle/In-Use (Emotional)

**Best for:** Brand connection, family/business scenarios

```
[demographic] in [setting], [activity description], [devices visible],
[WiFi/connectivity visual cues], warm [lighting description],
[local/cultural elements], authentic candid moment, editorial
lifestyle photography style, 85mm lens, shallow depth of field,
[publication style] authenticity, 4K, 16:9
```

### Pattern 5: Abstract Concepts (Speed/Coverage)

**Best for:** Service visualization, intangibles

```
Abstract visualization of [concept], streams of [brand color] light
particles flowing through [contrasting color] space, [technology
metaphor], data packets visualized as [element], sense of [emotion],
cinematic depth of field, futuristic but approachable, clean
composition for text overlay on [position], 4K, [aspect ratio]
```

---

## CircleTel Brand Integration

### Always Include

```yaml
# Color injection
primary: "vibrant orange (#F5831F)"
secondary: "dark charcoal (#1F2937)"
background: "light gray (#E6E9EF)" or "pure white"

# Style keywords
- "modern"
- "professional"
- "trustworthy"
- "approachable"

# South African context (lifestyle shots)
- "South African family/professional"
- "modern African home/office decor"
- "local urban/suburban setting"
```

### Brand Color Usage

| Color | Hex | Use In |
|-------|-----|--------|
| Orange | `#F5831F` | Accents, LEDs, highlights, cables |
| Charcoal | `#1F2937` | Text overlays, contrast elements |
| Light Gray | `#E6E9EF` | Backgrounds (lifestyle) |
| White | `#FFFFFF` | Backgrounds (studio products) |

### Example Brand-Integrated Prompt

```
CircleTel 5G router, centered top down flat lay, surrounded by
ethernet cables in vibrant orange (#F5831F) and sleek tech
accessories, soft glow from orange LED indicators, matte black
device body with orange accent lighting, crisp realistic shadow
on pure white seamless background, soft directional studio
lighting, ultra realistic commercial product photography,
100mm lens look, f/8 sharp focus, clean composition, no text
on device, 4K, 1:1
```

---

## Template Categories

### `/templates/product-*.md`

| Template | Use Case |
|----------|----------|
| `product-flat-lay.md` | Top-down product shots |
| `product-exploded.md` | Technical teardown views |
| `product-hero.md` | Angled marketing shots |
| `product-packaging.md` | Box and packaging shots |

### `/templates/concept-*.md`

| Template | Use Case |
|----------|----------|
| `concept-speed.md` | Speed/performance visuals |
| `concept-coverage.md` | Coverage/signal visuals |
| `concept-connectivity.md` | Abstract connection themes |

### `/templates/lifestyle-*.md`

| Template | Use Case |
|----------|----------|
| `lifestyle-family.md` | Family usage scenes |
| `lifestyle-business.md` | B2B office environments |
| `lifestyle-outdoor.md` | Mobile/outdoor usage |

### `/templates/marketing-*.md`

| Template | Use Case |
|----------|----------|
| `social-promo.md` | Social media graphics |
| `banner-hero.md` | Website hero sections |
| `feature-card.md` | Feature highlight cards |

---

## Common Mistakes

### ❌ DON'Ts

| Mistake | Why It's Bad | Fix |
|---------|--------------|-----|
| "beautiful amazing product" | Generic, adds nothing | Use specific material descriptions |
| AI-generating logos | Never looks right | Composite real logo in post |
| "minimal maximalist style" | Contradictory | Pick one style |
| 150+ word prompts | Diminishing returns | Keep to 50-80 words |
| "realistic unrealistic" | Confusing | Be consistent |
| Forgetting aspect ratio | Wrong crop | Always specify (1:1, 16:9, etc.) |
| Generic backgrounds | Lacks brand identity | Use brand colors |

### ✅ DO's

| Technique | Why It Works | Example |
|-----------|--------------|---------|
| Specific camera specs | Grounds in reality | "100mm lens, f/8" |
| Material micro-details | Adds realism | "dewy condensation, matte surface" |
| Named lighting | Professional look | "soft directional studio lighting" |
| Quality context signals | Sets expectations | "high end commercial advertising" |
| Composition anchors | Controls framing | "centered, 3/4 angle, top down" |
| "no text" | Prevents artifacts | Add at end of prompt |

---

## Iteration Techniques

### The 3-Pass Method

1. **Pass 1: Core Subject** (generate)
   ```
   5G router, white seamless background, studio lighting, product photography, 4K
   ```

2. **Pass 2: Add Details** (refine)
   ```
   5G router with orange LED indicators, matte black body, centered on
   white seamless background, soft studio lighting, commercial product
   photography, 100mm lens, f/8, 4K
   ```

3. **Pass 3: Brand Polish** (finalize)
   ```
   CircleTel 5G router with glowing orange (#F5831F) LED indicators,
   matte black body with orange accent trim, centered on pure white
   seamless background, soft directional studio lighting, crisp
   realistic shadow, high-end commercial product advertising, ultra
   realistic, 100mm lens, f/8 sharp focus, no text, 4K, 1:1
   ```

### Seed Preservation

When you get a good result:
1. Save the exact prompt
2. Note any model-specific settings
3. Use as base for variations

### A/B Testing Prompts

Create two versions with one variable changed:

```yaml
# Version A: Cool lighting
prompt_a: "...cool blue studio lighting..."

# Version B: Warm lighting
prompt_b: "...warm golden hour lighting..."
```

Compare results, document winner.

---

## Quick Reference Card

```
FORMULA:
[Subject] + [Composition] + [Context] + [Materials] +
[Lighting] + [Quality] + [Specs]

BRAND COLORS:
Orange #F5831F | Charcoal #1F2937 | Gray #E6E9EF | White #FFFFFF

QUALITY SIGNALS:
- ultra realistic
- commercial product photography
- professional studio lighting
- sharp focus, 4K

ALWAYS ADD:
- Aspect ratio (1:1, 16:9, 21:9)
- "no extra text" or "no AI-generated text"
- Camera specs (85mm/100mm, f/8)

AVOID:
- Generic adjectives (beautiful, amazing)
- AI-generating logos
- Contradictory styles
- 100+ word prompts
```

---

---

## Advanced Techniques

> Phase 2 templates for sophisticated visual content

### Pattern 6: Split Face Typography

**Best for:** Personal branding, motivational messaging, team spotlights

```
High-contrast black and white split composition portrait,
vertical split at nose bridge, left half showing realistic
photographic face of [subject], right half pure white
with large serif typography "[TEXT]" where letters reveal
face through text shapes, dramatic chiaroscuro lighting,
heavy slab serif uppercase stacked vertically, editorial
portrait, strong shadows, 4K, 9:16
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `vertical split at nose bridge` | Dramatic asymmetry |
| `chiaroscuro lighting` | High contrast B&W |
| `letters reveal face` | Text masking effect |
| `slab serif stacked` | Bold typography |

**Template:** `templates/advanced/portrait-split-typography.md`

### Pattern 7: Photo Mosaic Grid

**Best for:** Company milestones, tribute posters, community content

```
Portrait silhouette filled with dense photo mosaic grid,
central figure outline as container, interior filled with
[number] small photographs showing [theme], halftone dot
and film grain textures per cell, B&W base with selective
[brand color] overlays, "[TEXT]" in Inter Semibold MAX 20%
canvas width, tribute poster style, 4K, [aspect ratio]
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `silhouette as container` | Unifies diverse images |
| `halftone, film grain` | Texture variety |
| `selective color overlays` | Brand accent focus |
| `MAX 20% canvas width` | Prevents oversized text |

**Template:** `templates/advanced/poster-photo-mosaic.md`

### Pattern 8: Flash Photography Portrait

**Best for:** Authentic team photos, behind-the-scenes, real people marketing

```
Hyper-realistic 4K black and white portrait, direct flash
photography creating vintage 90s editorial aesthetic,
[subject description], hard shadows against plain [color]
background, ultra-detailed skin texture with fine film grain,
candid [mood] expression, natural imperfections visible,
high contrast flash highlights, documentary style, 85mm, 4K
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `direct flash` | Signature hard shadows |
| `90s editorial` | Vintage authenticity |
| `natural imperfections` | Human connection |
| `fine film grain` | Analog quality |

**Template:** `templates/advanced/portrait-flash-editorial.md`

### Pattern 9: Product Split (Physical + Digital)

**Best for:** Hardware-software integration, ecosystem visuals, feature breakdown

```
[Product] centered floating against clean background,
conceptually split by design with vertical divide, left
half photorealistic showing materials textures reflections,
right half flat digital elements including [UI fragments,
signals, data streams], holographic overlays on digital
side, [brand color] accent glow at split line, commercial
meets digital design, 4K, [aspect ratio]
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `conceptually split` | Dual physical/digital narrative |
| `photorealistic left` | Hardware credibility |
| `flat digital right` | Software ecosystem |
| `accent glow at split` | Visual connection |

**Template:** `templates/advanced/product-split-digital.md`

### Pattern 10: Character Mascot

**Best for:** Social engagement, younger audiences, approachable branding

```
8K character product photography, [product] reimagined as
adorable [character type] with [facial features], wearing
[accessories] related to [activity], posed in [action],
warm cinematic lighting with golden bokeh, Pixar-quality
character design, photorealistic textures, cute expressive
eyes, no AI text, 4K, [aspect ratio]
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `character with facial features` | Personality/emotion |
| `golden bokeh` | Warm inviting feel |
| `Pixar-quality` | High-end character design |
| `photorealistic textures` | Believable materials |

**Template:** `templates/advanced/character-mascot.md`

### Pattern 11: Multi-Panel Collage

**Best for:** Customer journeys, product stories, multi-angle features

```
Editorial multi-panel collage with [number] asymmetric
photographic frames, each panel showing [subject] from
different [angle/moment/stage], unified warm amber palette,
floating translucent UI overlays, subtle grid lines and
cursor accents, realistic lens distortion, film grain,
magazine editorial layout, white gaps between panels, 4K
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `asymmetric frames` | Editorial dynamism |
| `unified palette` | Visual cohesion |
| `floating UI overlays` | Modern tech aesthetic |
| `white gaps` | Clean separation |

**Template:** `templates/advanced/collage-multi-panel.md`

### Pattern 12: Surreal Aerial Composite

**Best for:** Viral social content, brand awareness, memorable advertising

```
Aerial photograph composite with giant [product] placed at
[SA landmark], [interaction element] adjusting product,
real-world backdrop showing [location features], golden
[time] light with long shadows, product reflecting
environment, surreal scale juxtaposition, hyper-realistic
materials against real photography, National Geographic
quality, 4K, [aspect ratio]
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `giant [product]` | Attention-grabbing scale |
| `recognizable landmark` | Local relevance |
| `interaction element` | Human narrative |
| `surreal scale juxtaposition` | Memorable contrast |

**Template:** `templates/advanced/composite-surreal-aerial.md`

### Pattern 13: Exploded View Animation (Video)

**Best for:** Product features, social video, technical deep-dives

```
[Duration] animation of [product] exploding apart in slow
motion, separating into [number] distinct [components],
components floating and rotating to reveal [detail focus],
[lighting] with [brand color] accent on key features,
particle effects during separation, camera [movement],
clean [background], cinematic motion graphics, 4K [fps]
```

**Key Elements:**

| Element | Purpose |
|---------|---------|
| `slow motion` | Dramatic reveal |
| `components floating` | 360 visibility |
| `particle effects` | Visual polish |
| `camera orbit/push` | Dynamic perspective |

**Template:** `templates/advanced/animation-exploded-view.md`

---

## Advanced Template Quick Reference

| Template | Pattern | Use Case |
|----------|---------|----------|
| `portrait-split-typography.md` | Split Face | CEO portraits, tagline reveals |
| `poster-photo-mosaic.md` | Photo Mosaic | Anniversaries, milestones |
| `portrait-flash-editorial.md` | Flash Portrait | Team photos, authenticity |
| `product-split-digital.md` | Physical+Digital | Hardware-software features |
| `character-mascot.md` | Character | Social engagement, fun content |
| `collage-multi-panel.md` | Multi-Panel | Customer journeys, stories |
| `composite-surreal-aerial.md` | Surreal Aerial | Viral campaigns, awareness |
| `animation-exploded-view.md` | Video/Motion | Product breakdown videos |

---

## B&W Monochrome Brand Variant

For flash photography and split typography patterns:

```yaml
# B&W CircleTel Variant
monochrome:
  primary: "#000000"        # True black
  secondary: "#FFFFFF"      # Pure white
  accent: "#F5831F"         # Orange pop (selective use)

  style:
    - "high contrast"
    - "dramatic shadows"
    - "fine film grain"
    - "editorial authenticity"
```

**Usage:** Add single orange (#F5831F) accent to one element (lip color, badge, LED) while keeping rest monochrome.

---

## See Also

- `brand-context.yaml` - Full brand specifications
- `templates/` - Ready-to-use prompt templates (basic)
- `templates/advanced/` - Advanced technique templates (Phase 2)
- `WORKFLOW.md` - End-to-end generation workflow
- `.design/README.md` - Design system overview
