---
name: nb-social-ad
description: Generate Nano Banana Pro (Gemini image gen) prompts for CircleTel social media ad images — Facebook, Instagram, LinkedIn. Use when creating paid social creative, organic post visuals, or WhatsApp campaign assets.
---

# CircleTel — Social Media Ad Image Generator

Produces a complete, platform-optimised Nano Banana Pro prompt for a CircleTel social ad, then generates it via Gemini API.

## MeiGen.ai Prompt Techniques

| Technique | How to apply |
|-----------|-------------|
| **Role opener** | "Act as a Social Media Art Director specializing in bold South African brand content" |
| **Phase structure** | For complex collage prompts, use numbered PHASE 1–9 sections |
| **Brand Intelligence block** | End with adaptive rules: "If TrUSC campaign → community warmth; if B2B → professional authority" |
| **Composition percentages** | "Subject = 60% visual weight, graphic elements = 40%" |
| **Layering order** | "Background texture → colour blob → graphic elements → subject (cutout) → typography" |
| **[BRACKET] params** | Use `[BRAND NAME]` / `[CAMPAIGN]` style for human-readable placeholders alongside `{argument}` |

## Platform Reference

| Platform | Aspect Ratio | Resolution | Model |
|----------|-------------|------------|-------|
| Facebook / Instagram Feed | `1:1` or `4:5` | 2K | 3 Pro |
| Instagram Story / Reel cover | `9:16` | 2K | 3 Pro |
| LinkedIn Post | `1.91:1` (use `16:9`) | 2K | 3 Pro |
| WhatsApp image | `1:1` | 1K | 3.1 Flash |
| Facebook Cover | `16:9` | 2K | 3 Pro |

---

## Step 1 — Ask the User (if not provided)

1. **Campaign goal** — Awareness / Promo offer / Engagement / Lead gen?
2. **Offer / message** — What's the hook? (e.g. "Get connected from R399/mo")
3. **Platform** — Facebook feed / Instagram Story / LinkedIn / WhatsApp?
4. **Subject** — People? Product? Abstract? Location?
5. **Text overlay needed?** — If yes, specify headline text + CTA (use Pro model for crisp text).

---

## Step 2 — Select Template

### Template A: Lifestyle Promo Ad (Facebook / Instagram Feed)

High-converting lifestyle creative with offer callout space.

```
A high-end social media advertisement image for CircleTel, a South African
internet service provider.

Scene: {argument name="scene" default="a stylish young South African woman
(mid-20s, natural hair, warm smile) sitting cross-legged on a modern couch,
laptop open, looking up at the camera with a relaxed and satisfied expression.
The room is bright and contemporary — white walls, indoor plants, warm timber
furniture"}.

Brand colours: an orange (#F5831F) accent pillow or detail in the scene ties
to the brand without being heavy-handed. The overall palette is warm,
bright, and inviting.

Composition: subject occupies the right two-thirds of the frame. Leave
the {argument name="text_side" default="upper-left area"} open with clean
negative space for a text overlay badge.

Photography style: candid lifestyle editorial, 50mm f/1.8, natural window
light, slightly warm colour grade, shallow depth of field, South African
domestic setting. Photorealistic, 2K.

Aspect ratio: {argument name="aspect_ratio" default="1:1"}.
No text, logos, or UI in the image itself.
```

---

### Template B: Offer / Promo Badge Style (Facebook / Instagram)

Strong visual with clear CTA zone — works for promotional offers.

```
Create a photorealistic social media advertisement for a South African ISP.

Background: {argument name="background" default="a clean, gradient field
transitioning from deep navy (#1B2A4A) on the left to a slightly lighter
slate on the right — modern, premium, digital-forward"}.

Hero element: {argument name="hero_element" default="a glowing orange
fibre-optic router in the foreground centre, with soft volumetric light
rays emanating outward against the dark background, suggesting speed
and connectivity"}.

Badge zone: a prominent circular or pill-shaped area in orange (#F5831F)
with white highlight glows, in the {argument name="badge_position" default="upper-right corner"},
sized to fit the text "{argument name="offer_text" default="From R399/mo"}".
The badge area must be a flat, solid colour — no textures — so text reads cleanly.

Mood: confident, modern, premium South African tech brand.
Style: cinematic CGI product photography, studio lighting, 2K.
Aspect ratio: {argument name="aspect_ratio" default="4:5"}.
```

---

### Template C: LinkedIn B2B Ad

Professional, trust-building creative for business decision-makers.

```
A professional editorial photograph for a B2B LinkedIn advertisement by
CircleTel, a South African business connectivity provider.

Scene: {argument name="scene" default="a modern South African open-plan
office — clean desks, floor-to-ceiling windows with a city skyline visible,
3–4 professionals in smart-casual attire collaborating around a monitor.
Diverse team: mixed ages and ethnicities reflective of South Africa"}.

Lighting: bright, even, corporate — daylight through large windows, soft
fill from overhead panels. No dramatic shadows.

Colour accent: one element in the frame (chair, wall feature, or desk item)
is orange (#F5831F) to create a brand connection without being branded.

Composition: wide medium shot, negative space on the {argument name="text_side" default="left third"}
for headline overlay. People are engaged and clearly working — not posed stiffly.

Photography style: commercial editorial, 28mm wide-angle, f/2.8, sharp,
clean skin tones, professional colour grade. Photorealistic, 2K.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
No text, logos, UI, or watermarks.
```

---

### Template D: WhatsApp / Story Vertical Ad

Full-bleed vertical for Stories and WhatsApp image campaigns.

```
A bold vertical social media image for CircleTel — a South African internet
service provider — designed for Instagram Stories or WhatsApp.

Scene: {argument name="scene" default="a close-up, editorial lifestyle portrait
of a smiling South African man (30s, professional) holding a smartphone,
looking directly at the camera. Blurred modern home office in background"}.

Composition: subject fills the upper 60% of the frame. The lower 40% transitions
to a clean navy (#1B2A4A) gradient block — flat enough for white text overlay
(CTA zone). An orange (#F5831F) thin horizontal divider line separates subject
from the CTA zone.

Photography: 85mm f/1.4 portrait, warm natural light, South African interior.
Photorealistic, editorial quality. No text, logos, or UI in image.
Aspect ratio: 9:16. Resolution: 2K.
```

---

---

### Template E: Phase-Based Social Collage (MeiGen.ai pattern — high-impact Instagram/Facebook)

Role-primed, 9-phase structured prompt. Best for launch campaigns, promo ads, awareness posts.

```
Act as a Social Media Art Director and Digital Collage Artist specializing in bold,
South African brand content for Instagram and Facebook campaigns.

PHASE 1: CONCEPTUAL FRAMEWORK
Create a dynamic digital collage that merges lifestyle photography with graphic design energy.
This is controlled boldness — a composition that feels vibrant and authentic while maintaining
CircleTel brand coherence. Anti-stock: textured, layered, energetic.

PHASE 2: SUBJECT & PHOTOGRAPHY
- Subject: {argument name="subject" default="a smiling South African woman (mid-20s, natural hair) seated on a modern couch with a laptop, relaxed and confident"}
- Hero element: feature a CircleTel brand moment prominently (router glow, coverage map, service badge)
- Camera angle: slight low angle to empower subject
- Crop: 3/4 body or full body showing hero element clearly
- Photography style: editorial lifestyle — warm natural light, candid, NOT posed

PHASE 3: COLOUR BLOCKING FOUNDATION
- Primary blob: large organic shape (40–60% of composition) in orange #F5831F behind/around subject
- Shape style: irregular, hand-painted aesthetic — NOT a perfect geometric shape
- Texture: visible brush strokes at 15–25% opacity — avoid flat digital fills
- Placement: blob frames subject without obscuring face or key product detail

PHASE 4: GRAPHIC ELEMENTS LAYER
Add 3–5 abstract elements scattered across the composition:
- Elements: coverage map fragment, speed stat badge, signal arc, or network node graphic
- Colour palette: orange (#F5831F) + navy (#1B2A4A) accents — max 3 colours total
- Placement: asymmetric — top-left and bottom-right zones (avoid centre crowding)
- Scale: mix small (5% of canvas) + medium (15%) elements — nothing overpowering
- Aesthetic: analog/handmade feel — imperfect edges, visible texture

PHASE 5: TYPOGRAPHY INTEGRATION
- Campaign message: "{argument name="message" default="Coverage is here."}" — bold display typography
- Tagline: {argument name="tagline" default="From R399/mo"} — orange pill badge
- Type treatment: mix of aligned and slightly rotated text (2–5° angles) for dynamic energy
- Hierarchy: campaign message largest → tagline medium → CTA smallest

PHASE 6: TEXTURE & BACKGROUND
- Base layer: off-white or light warm-grey textured background (NOT pure white)
- Texture: felt rather than seen — adds tactility without competing with foreground
- CTA zone: lower 10–15% = flat navy (#1B2A4A) strip with white CTA text

PHASE 7: COMPOSITION RULES
- Layout: asymmetric balance — subject off-centre, graphic elements counter-balance
- Breathing room: 15% negative space (background visible) to prevent claustrophobia
- Layering order: background texture → orange blob → graphic elements → subject → typography
- Focal point: subject + brand element = 60% visual weight; graphics support = 40%
- Movement: diagonal lines from top-left to bottom-right create directional flow

PHASE 8: BRAND INTELLIGENCE
Adapt based on campaign:
- TrUSC/community: warmer tones, neighbourhood backdrop, softer blob, community feel
- Office-in-a-Box/B2B: modern office setting, more structured layout, cleaner blob shape
- Promo/price offer: bold typography leads, price badge front-and-centre, higher energy

PHASE 9: TECHNICAL SPECS
Aspect ratio: {argument name="aspect_ratio" default="4:5"} (Instagram feed)
Resolution: 2K
Colour mode: sRGB, vibrant saturation (Instagram-optimised)
Style reference: South African premium brand campaign × editorial digital collage
Mood: {argument name="mood" default="confident, local, empowering, energetic"}

NOT generic stock photography.
NOT flat corporate poster.
NOT Western/non-South-African aesthetic.
```

---

## Step 3 — Generate via Gemini API

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """[PASTE FILLED PROMPT HERE]"""
ASPECT_RATIO = "1:1"   # Adjust per platform

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio=ASPECT_RATIO,
            image_size="2K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("circletel-social-ad.jpg")
        print("Saved: circletel-social-ad.jpg")
    elif part.text:
        print(part.text)
```

```bash
set -a && source .env.local && set +a && python scripts/generate-social-ad.py
```

---

### Template F: Precision Editorial Portrait

For headshots, testimonial hero images, or influencer-style single-subject ads.

```
Photorealistic editorial portrait of a smiling {argument name="subject" default="South African
professional woman, mid-30s, natural hair"} in a CircleTel brand moment.

She/he wears {argument name="styling" default="smart-casual attire with an orange #F5831F
accent detail — scarf, earring, or jacket trim"}.

{argument name="pose" default="Slightly leaning forward in a close wide-angle perspective,
with a warm, confident expression and subtle smile"}.

Background: {argument name="background" default="clean deep navy (#1B2A4A) studio background
with soft radial gradient — darker edges, lighter center behind the subject"}.

Lighting: bright soft lighting, gentle contrast, sharp focus.
Brand anchor: one orange (#F5831F) element in the scene ties to CircleTel without being
heavy-handed. Minimal, high-fashion editorial mood.

Photography style: commercial editorial, 50mm f/1.8, natural-looking studio lighting,
shallow depth of field. South African subject — not Western stock photo.
Photorealistic. 2K. Aspect ratio: {argument name="aspect_ratio" default="1:1"}.
No text, logos, or UI in image.
```

---

### Template G: Gradient Breakout Character

For launch posts, offer ads, or bold feed-stopping creative. Subject "breaks out" of a
colored square into the white canvas — powerful 3D tension effect.

```
A professional high-end graphic design advertisement composition on a pure solid white canvas.

Centered is a perfectly symmetrical large solid rounded square. The entire interior is filled
with a smooth vibrant gradient fading from {argument name="gradient_top_left" default="#F5831F
vivid orange"} (top-left) to {argument name="gradient_bottom_right" default="#1B2A4A deep navy"}
(bottom-right).

A {argument name="subject" default="confident young South African professional, mid-20s,
natural hair, warm smile"} is positioned such that the bottom of their torso is perfectly
flush with the very bottom edge of the square — no colored border visible beneath them.
Person and clothing maintain natural, realistic colors and textures, professional studio
lighting independent of the background gradient (no color cast on skin or clothes).

They are firmly gripping {argument name="product" default="a CircleTel compact WiFi router
with a glowing orange LED ring"}. The top of their head and hair break the TOP boundary of
the square, overlapping the white background. Their hands and the device also break the
SIDE boundaries for a powerful 3D breakout effect, extending onto the white canvas.

Typography layout:
- Top white space (above square, clear gap): "{argument name="brand_text" default="CircleTel"}"
  in clean bold geometric sans-serif, navy (#1B2A4A).
- Bottom-right inside the square: small thin clean white text —
  "{argument name="tagline" default="Connected. Everywhere."}".

Lighting: sharp and crisp commercial, emphasizing textures of both subject and product.
Aspect ratio: {argument name="aspect_ratio" default="4:5"}. 2K. No watermark.
```

---

### Template H: Viral / Engagement — WhatsApp Bubble Dining

For viral engagement posts, WhatsApp campaign teasers, or community content.

```
Hyper-realistic top-down macro photography. A long light-green WhatsApp speech bubble
acting as a dining table. Two real living humans (shrunk to tiny scale) are sitting at
opposite ends. They are NOT plastic figures — visible skin texture, natural hair, and
realistic clothing folds. They are eating real South African food that looks freshly
cooked — not play-doh.

The text inside the bubble reads: "{argument name="message" default="Check if CircleTel
covers your area 👉 circletel.co.za"}".

Bottom right of bubble: timestamp "{argument name="timestamp" default="9:41 AM"}" and
blue double-ticks.

The background is completely filled with a high-density seamless WhatsApp doodle
pattern — line art icons covering the entire surface edge-to-edge with no empty spaces,
resembling the original dense WhatsApp wallpaper.

Professional studio lighting. 8K resolution. Sharp focus.
Aspect ratio: {argument name="aspect_ratio" default="1:1"}.
```

---

## Step 3 — Generate via Gemini API

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """[PASTE FILLED PROMPT HERE]"""
ASPECT_RATIO = "1:1"   # Adjust per platform

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio=ASPECT_RATIO,
            image_size="2K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("circletel-social-ad.jpg")
        print("Saved: circletel-social-ad.jpg")
    elif part.text:
        print(part.text)
```

```bash
set -a && source .env.local && set +a && python scripts/generate-social-ad.py
```

---

## Iteration Tips

| Issue | Fix |
|-------|-----|
| Subject looks foreign / Western | Add "South African, diverse, local aesthetic, not stock photo" |
| Orange looks yellow | Add "vivid orange #F5831F, NOT yellow, NOT gold — pure orange" |
| CTA zone too busy | Add "the lower CTA zone must be completely flat and uncluttered" |
| Too polished / fake | Add "candid, natural expression, editorial documentary feel" |
| Wrong skin tones | Add "accurate warm South African skin tones, not overexposed" |
| Breakout effect not working | Add "subject's head, hands, and product physically extend BEYOND the square boundary onto the white canvas — hard 3D breakout, not a soft fade" |
| WhatsApp scene looks illustrated | Add "NOT cartoon — real humans with visible skin pores, natural hair texture, realistic fabric folds" |
