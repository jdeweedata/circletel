---
name: nb-product-hero
description: Generate Nano Banana Pro (Gemini image gen) prompts for CircleTel product hero images — landing page heroes, product feature shots, and service visualisations. Use when building or refreshing any product page that needs a hero or section background image.
---

# CircleTel — Product Hero Image Generator

Outputs a ready-to-send Nano Banana Pro prompt for a CircleTel product hero image, then generates it via the Gemini API.

## MeiGen.ai Prompt Techniques (apply to any template)

| Technique | How to apply |
|-----------|-------------|
| **Role opener** | Start with "Act as a world-class editorial art director..." to prime quality |
| **BRAND INPUTS block** | List inputs as labeled fields (BRAND NAME, PRODUCT, AUDIENCE, TONE) before the scene |
| **Negative constraints** | End with "NOT stock photo / NOT generic / NOT corporate blue" |
| **Composition percentages** | Specify visual weight: "subject = 60% / background = 40%" |
| **Layering order** | State explicit z-order: "background → light → subject → overlay → typography" |
| **Adaptive logic** | "If lifestyle product → use real environment; if tech product → use studio" |

## Brand Context

| Element | Value |
|---------|-------|
| Primary colour | Orange `#F5831F` |
| Secondary colour | Navy `#1B2A4A` |
| Accent | White |
| Tone | Confident, modern, South African |
| Avoid | Stock-photo clichés, generic "tech bubbles", excessive lens flare |

---

## Step 1 — Ask the User (if not provided)

Gather any missing info before generating:

1. **Product** — Which product? (Residential Fibre / Office-in-a-Box / WorkConnect+Mobile / Fleet Connect / Custom)
2. **Hero message** — What is the primary headline? (e.g. "Lightning-fast fibre from R399/mo")
3. **Scene mood** — Aspirational lifestyle? Clean studio? Abstract tech?
4. **Aspect ratio** — `16:9` (desktop hero), `4:3` (card), `1:1` (social), `9:16` (mobile hero)
5. **Model** — Quality final asset → `3 Pro`. Quick iteration → `3.1 Flash`.

---

## Step 2 — Select Template

### Template A: Lifestyle Hero (Residential / SME)

Use when the product is consumed by people in a real environment.

```
A photorealistic hero image for a South African internet service provider
advertising their "{argument name="product" default="high-speed home fibre"}" service.

Scene: {argument name="scene" default="a modern open-plan living room in a South African
home, warm natural afternoon light through large windows, a young professional
working on a laptop while a child streams video on a tablet in the background"}.

Colour palette: warm orange accent tones (#F5831F) against cool navy shadows
(#1B2A4A), with clean white highlights. The mood is confident, connected,
and aspirational without being sterile.

Overlay space: leave the {argument name="text_side" default="left third"}
uncluttered with at least 40% negative space for headline text overlay.

Photography style: editorial lifestyle, 35mm f/2.8, shallow depth of field,
natural daylight. Ultra-realistic, 4K detail, commercial quality. No logos,
text, watermarks, or UI elements in the image.

Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
```

---

### Template B: Clean Studio / Tech Abstract

Use for feature-section backgrounds, pricing pages, or tech-forward B2B products.

```
A high-end studio product visual for a South African business connectivity brand.

Concept: {argument name="concept" default="glowing fibre-optic strands forming
a dynamic arc across a dark navy background, with subtle orange light blooms
at key connection nodes"}.

Colour palette: deep navy (#1B2A4A) background, vibrant orange (#F5831F)
light sources, white and cyan secondary accents. The composition should feel
premium, precise, and forward-looking.

Negative space: reserve the {argument name="text_side" default="right half"}
of the frame as dark gradient for text overlay.

Style: cinematic CGI render, ultra-sharp detail, volumetric lighting,
subtle depth of field. No text, logos, UI, or watermarks.

Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
Resolution: 4K.
```

---

### Template C: South African Context Hero

Use when you want to ground the brand visually in the local market.

```
A photorealistic wide hero image for a South African ISP called CircleTel.

Scene: {argument name="scene" default="an aerial drone shot of a modern South
African suburb at golden hour — tiled rooftops, palm trees, and neatly paved
streets — with glowing orange and white fibre-optic light trails overlaid,
tracing the connectivity network between homes"}.

Mood: {argument name="mood" default="empowering, local, optimistic"}.
Lighting: golden hour, warm directional light with long shadows.
Colour palette: warm orange (#F5831F) light trails, navy (#1B2A4A) shadows,
vivid sunset sky.

Technical: drone perspective 60° tilt, ultra-realistic, 4K, photorealistic
aerial photography style. No text or logos.

Aspect ratio: {argument name="aspect_ratio" default="21:9"}.
```

---

---

### Template D: Editorial Brand Moodboard Hero (MeiGen.ai pattern)

Role-primed, layered identity explosion — use for campaign launch, brand refresh, or OOH concepts.

```
Act as a world-class editorial art director and visual identity designer.

BRAND INPUTS:
BRAND NAME: CircleTel
INDUSTRY / PRODUCT TYPE: South African ISP — home fibre and business connectivity
PRIMARY BRAND COLOR: vivid orange #F5831F
SECONDARY BRAND COLOR: deep navy #1B2A4A
ACCENT COLOR: white
BRAND PERSONALITY: {argument name="brand_personality" default="confident, local, empowering, modern"}
OPTIONAL HEADLINE / TEXT: {argument name="headline" default="Connected. Everywhere."}

VISUAL STYLE:
Create a dense, layered editorial moodboard-style composition combining:
• product and device photography (routers, phones, laptops)
• packaging elements and branded materials
• typography snippets and campaign phrases
• abstract graphic shapes in brand colours
• UI-like card elements (coverage maps, speed stats, service tiers)
• editorial cutouts and overlapping assets

The composition should feel:
• layered with depth and intentional overlaps
• like a Pinterest board meets a premium ISP campaign
• expressive and brand-heavy but never cluttered
• visually rich and scroll-stopping

ART DIRECTION:
Include a mix of:
• a lifestyle shot of a South African in a modern home or office using the product
• bold typography block with "{argument name="headline" default="Connected. Everywhere."}"
• abstract orange blob/shape behind/around the subject (irregular, hand-painted aesthetic — NOT perfect circle)
• a UI-style panel showing coverage map or speed stat
• orange (#F5831F) and navy (#1B2A4A) as dominant palette throughout

COMPOSITION RULES:
• asymmetrical layout — hero subject off-centre, graphic elements counter-balance
• layering order: background → orange colour blob → graphic elements → subject (cutout) → typography
• hero subject = 60% visual weight; supporting graphics = 40%
• leave 15–20% breathing room (negative space) to prevent claustrophobia
• diagonal lines and angled elements create directional flow

TECHNICAL SPECS:
Aspect ratio: {argument name="aspect_ratio" default="16:9"}
Resolution: 4K
Mood: confident, local, empowering — South African ISP brand world in one frame
Style reference: Vodacom campaign aesthetics × editorial digital collage × premium tech brand

NOT a clean minimal layout.
NOT generic tech stock photography.
NOT corporate Western aesthetic — must feel South African.
```

---

## Step 3 — Generate via Gemini API

After confirming the prompt, run this script:

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """[PASTE FILLED PROMPT HERE]"""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",  # Use 3.1-flash for quick drafts
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="{argument name='aspect_ratio' default='16:9'}",
            image_size="4K"  # Drop to 2K or 1K for drafts
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        img = part.as_image()
        img.save("circletel-hero.jpg")
        print("Saved: circletel-hero.jpg")
    elif part.text:
        print(part.text)
```

Save to `scripts/generate-hero-image.py` and run:
```bash
set -a && source .env.local && set +a && python scripts/generate-hero-image.py
```

---

### Template E: Logo Emboss / Brand Materialisation (Multi-Phase CGI)

For premium brand identity assets — metal-embossed logo on textured surface.

```
CircleTel | {argument name="metal_color" default="Brushed Gold"}

Act as a Senior CGI Artist and Brand Identity Director specializing in premium logo
materializations. The logo mark appears pushed outward from behind a metallic surface —
like a relief stamp pressed from the reverse side, a hallmark embossed on luxury packaging,
or a raised seal on official documents. The logo does not exist as a separate standing
object; it exists as a raised relief, a bulge, an outward protrusion part of the surface.

BRAND INTELLIGENCE:
(1) LOGO GEOMETRY — CircleTel's primary mark: the circle-and-arc motif in its most reduced
    form — clean, scalable at any size.
(2) COLOR PALETTE — base: {argument name="metal_color" default="Brushed Gold"}.
    Build full tonal system from lightest specular highlight to deepest shadow. Determine
    if mood reads warm, cool, or neutral.
(3) SURFACE MATERIAL — Gold/champagne: warm brushed metal with radial grain.
    Silver/grey: brushed or circular-grain steel. Black: anodized aluminum or matte carbon
    fiber. White: matte ceramic or chalk plaster. Orange: anodized colored metal, holding
    hue in lit areas, desaturating toward black in deepest shadows.
(4) LIGHT DIRECTION — single light angle to reveal emboss topography: highlights on raised
    ridge peaks, shadows on descending walls.

PHASE 1: SURFACE & ATMOSPHERE
One single continuous material surface — not a background with an object on it, but one
unified physical plane filling the entire canvas. Subtle radial gradient: brighter near
center where embossed logo sits, darkening toward edges. Brushed metal grain is radial/
concentric from center. Fine uniform grain texture across entire surface (ISO 800 equivalent).
Surface must feel physical and touchable — like a metal plate or premium embossed card.

PHASE 2: THE EMBOSS
CircleTel logo rendered as full bas-relief — coin or commemorative medal quality. The
complete filled silhouette of the CircleTel circle-arc mark rises as one unified solid mass.
Top face slightly convex — gently domed, catching key light across full width. Transition
from flat surface to raised form follows smooth beveled wall — curved like a coin edge.
Any negative spaces within the mark recessed back to surface level with their own beveled
walls. Overall raised height: substantial — like a thick coin or heavy embossed seal.
Logo geometry completely faithful to CircleTel's actual mark in correct proportions.

PHASE 3: LIGHTING
One primary soft area light, upper-left, 10–11 o'clock — broad and diffused. Color
temperature: warm amber for gold/orange surfaces, cool white for silver/steel.
Subtle fill from lower-right at 10–15% intensity — retains shadow detail without
flattening form. No hard shadows. No spotlight pools. No rim light. Lighting exists
solely to reveal three-dimensional topography of the emboss.

PHASE 4: TYPOGRAPHY
Lower portion of canvas, same continuous surface. Minimal typographic lockup:
1. CircleTel circle-arc icon mark, small (3–4% canvas width), flat — not embossed.
2. "CIRCLETEL" wordmark in clean geometric spaced capitals below.
3. One short italic/light descriptor: "South African Connectivity" or "Est. 2023".
Stacked vertically, centered, generous spacing. No decorative rules or lines.

Ray Tracing enabled. No Depth of Field — entire surface in perfect sharp focus.
Film grain uniformly applied. No chromatic aberration. No lens distortion.
Anti-aliasing maximum — ridge edges perfectly clean.
Aspect ratio: {argument name="aspect_ratio" default="1:1"}.
```

---

### Template F: Luxury Multi-Phase Product (Hypebeast / Highsnobiety Level)

For premium product shots — router, SIM card, device. Editorial commercial quality.

```
CircleTel | {argument name="object" default="compact WiFi router"}

Act as a High-End Commercial Product Photographer and Creative Director shooting a luxury
editorial campaign (Hypebeast / Highsnobiety / Wallpaper* level).

PHASE 1: BRAND INTELLIGENCE
Hero subject: a {argument name="object" default="compact WiFi router"} branded for CircleTel.
CircleTel visual identity: primary orange #F5831F, deep navy #1B2A4A, white accents.
Typography: clean geometric sans-serif, tracked, modern. Cultural positioning: premium
South African connectivity brand — confident, local, empowering. Apply identity with
precision — do not invent a generic brand.

PHASE 2: OBJECT SURFACE & MATERIAL DNA
Base tone: deep neutral — matte dark graphite or matte navy. Fine-grain surface micro-texture
visible under raking light — powder-coat or brushed material feel. Subtle gradient bloom:
base color dissolves in lower portion into CircleTel orange #F5831F — a soft luminous haze
from within the material, not a printed graphic. Logo application: embossed or metallic foil
relief — catching specular at edges only. Precise. Restrained. Typography: "CircleTel" in
clean geometric sans, small tracking, positioned with editorial intentionality.

PHASE 3: THE ACCENT BREAKOUT ELEMENT
Identify the most logical "interruption zone" on {argument name="object" default="compact WiFi router"}
— a seam, edge, band, collar, or rim. Apply a narrow saturated orange (#F5831F) accent band
at this zone — vivid, slightly matte. This element must visually break out of the object's
boundary, extending or wrapping beyond the expected edge. The accent carries micro-typography:
"CONNECTED. EVERYWHERE." — small, precise, tracked.

PHASE 4: STAGING & COMPOSITION
Studio cyclorama. Surface tone: off-white to warm light gray. Background: cool neutral
mid-gray, darker upper zone. Object at 3/4 angle — front face and one secondary surface
visible. Rule of thirds: object occupies right 60% of frame. Left field: generous negative
space for headline overlay.

PHASE 5: LIGHTING
Single dominant key light: large softbox, camera-left, elevated 40°. Specular highlight
traces top-left edge — revealing material grain. Shadow side: no fill. Darkness earns depth.
Subtle ambient bounce from cyclorama floor — lifts shadow 15%, no more. Accent band receives
micro-specular glint along dominant edge. Chiaroscuro logic applied to product photography.
No lens flare. No atmospheric effects.

PHASE 6: TECH SPECS
Lens: 85mm equivalent, f/4.5. Object fully sharp, background softened. Film grain overlay:
15% opacity. Octane/Ray Tracing quality — physically accurate shadow falloff.
Aspect ratio: {argument name="aspect_ratio" default="4:5"}.
```

---

### Template G: JSON Product Visual (Frosted Glass Hands — Editorial Minimal)

For ultra-refined product float shots — clean, ethereal, high-end.

```json
{
  "task": "photorealistic_product_visual",
  "scene": {
    "environment": "high-key studio",
    "background": "pure white seamless",
    "negative_space": "very high",
    "depth_of_field": "layered depth with strong subject isolation"
  },
  "subject": {
    "primary_object": "CircleTel {PRODUCT} — {PRODUCT_DESCRIPTION}",
    "position": "perfectly centered, floating",
    "orientation": "upright",
    "scale": "natural product scale",
    "clarity": "ultra-sharp, high micro-contrast",
    "brand_detail": "CircleTel orange #F5831F LED ring or accent visible"
  },
  "human_elements": {
    "hands": {
      "count": 2,
      "layering": "positioned behind a frosted glass surface",
      "visual_effect": "frosted glass diffusion, milky blur, softened edges",
      "transparency": "semi-opaque",
      "focus": "intentionally out of focus",
      "gesture": "slow, delicate, abstract reach",
      "interaction": "no contact with the product"
    }
  },
  "optical_effects": {
    "frosted_glass": {
      "applied_to": "hands only",
      "blur_type": "diffusion blur",
      "edge_softness": "high",
      "light_scatter": "subtle bloom"
    }
  },
  "lighting": {
    "style": "soft diffused studio lighting",
    "direction": "frontal with gentle top wash",
    "shadows": "extremely soft and minimal",
    "highlights": "clean, controlled highlights on the product only",
    "contrast": "low overall, high on product"
  },
  "aesthetic": {
    "mood": "ethereal, calm, refined",
    "style": "high-end editorial product photography",
    "visual_language": "minimal, airy, modern, poetic",
    "emotion": "care, purity, precision"
  },
  "camera": {
    "lens": "85mm",
    "aperture": "f/2.0",
    "angle": "eye-level"
  },
  "post_processing": {
    "retouching": "luxury commercial polish",
    "grain": "none",
    "color_grading": "clean whites with subtle warm orange bloom on product"
  },
  "output": {
    "resolution": "ultra_high_resolution",
    "focus_priority": "product only",
    "clarity_separation": "product razor sharp, background and hands diffused"
  }
}
```

---

### Template H: Technical Infographic Annotation

For product explainer posts, spec sheets, or educational content.

```
Create an infographic image of a {argument name="object" default="CircleTel compact WiFi router"},
combining a realistic photograph or photoreal render of the object with technical annotation
overlays placed directly on top.

Use black ink–style line drawings and text (technical pen / architectural sketch look) on a
pure white studio background, including:
• Key component labels (antenna array, LED status ring, ethernet ports, power input)
• Internal cutaway or exploded-view outlines showing internal layout
• Measurements, dimensions, and scale markers
• Material callouts (matte ABS housing, anodized aluminium trim)
• Arrows indicating function, force, or flow (WiFi signal, air circulation, power flow)
• Simple schematic or sectional diagrams where relevant
• CircleTel orange (#F5831F) used sparingly on 1–2 key callout lines only

Place the title "{argument name="object" default="CircleTel Router"}" inside a hand-drawn
technical annotation box in one corner.

Style & layout rules:
• The real object remains clearly visible beneath the annotations
• Annotations feel sketched, technical, and architectural
• Clean composition with balanced negative space
• Educational, museum-exhibit / engineering-manual vibe

Visual style: minimal technical illustration — black linework over realistic imagery,
precise but slightly hand-drawn feel.
Color palette: white background, black annotation lines and text, one orange accent line.
Output: ultra-crisp, 1:1 or 4:5, no watermark.
```

---

## Iteration Tips

| If the result is... | Try... |
|--------------------|--------|
| Too generic | Add "South African suburb" / "Johannesburg CBD" / "Cape Town coastline" to scene |
| Wrong colours | Add "colour-accurate #F5831F orange, NOT yellow or red" to prompt |
| Too cluttered | Add "minimalist, generous negative space, 50% of frame empty" |
| Too corporate | Add "candid, editorial lifestyle, not a stock photo" |
| Text overlapping subject | Specify exact region: "subject confined to right third of frame" |
| Emboss looks flat | Add "raised height equivalent to a thick commemorative coin — substantial, not a shallow bump" |
| Product looks plastic | Add "fine-grain surface micro-texture, powder-coat feel, 15% film grain overlay — anti-CGI-plastic" |
| Hands look fake | Add "frosted glass diffusion on hands, milky blur, semi-opaque, intentionally out of focus" |
