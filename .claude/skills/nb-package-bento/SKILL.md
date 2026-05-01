---
name: nb-package-bento
description: Generate Nano Banana Pro (Gemini image gen) prompts for CircleTel package comparison infographics and Bento grid visuals — pricing pages, package feature cards, service tier comparisons. Use when building pricing sections, product comparison pages, or any structured feature-list visual.
---

# CircleTel — Package Bento Grid & Infographic Generator

Produces Nano Banana Pro prompts for premium infographic visuals showing CircleTel packages, features, or service comparisons. Adapted from the "Premium liquid glass Bento grid" pattern (No. 2 in the Awesome NB Pro Prompts repo).

## MeiGen.ai Prompt Techniques

| Technique | How to apply |
|-----------|-------------|
| **Tile-by-tile rules** | Give explicit content instructions per module (from bento-grid collage pattern) |
| **Adaptive content logic** | "If residential product → speed focus; if B2B → SLA and support focus" |
| **Brand realism rules** | "Only include hardware that CircleTel actually ships — don't invent devices" |
| **Visual consistency rules** | State shared properties: "same corner radius, spacing, art direction quality across all tiles" |
| **Negative constraints** | "Avoid random collage chaos / avoid tiny unreadable text / avoid generic placeholder UI" |
| **[BRACKET] BRAND INPUTS** | Add structured input block at top for easy swapping |

## When to Use

- Pricing page hero infographic
- Package comparison (Starter / Pro / Business)
- Feature highlight grid for a product landing page
- Service tier comparison (Residential vs Business vs Enterprise)
- Promotional "what you get" image for social or email

---

## Step 1 — Gather Input

Ask for or infer:
1. **Package names & key specs** (e.g. "Starter 25Mbps R399, Pro 50Mbps R599, Business 100Mbps R999")
2. **Feature highlights** (e.g. "No data caps, 24/7 support, free installation")
3. **Layout preference** — 3-column (3 packages), 2×3 Bento (features), or single-package spotlight
4. **Language** — English (default)

---

## Step 2 — Templates

### Template A: 3-Package Comparison Grid

```
Input:
- Package 1: {argument name="pkg1_name" default="Starter"} — {argument name="pkg1_speed" default="25Mbps"} — {argument name="pkg1_price" default="R399/mo"}
- Package 2: {argument name="pkg2_name" default="Pro"} — {argument name="pkg2_speed" default="50Mbps"} — {argument name="pkg2_price" default="R599/mo"}
- Package 3: {argument name="pkg3_name" default="Business"} — {argument name="pkg3_speed" default="100Mbps"} — {argument name="pkg3_price" default="R999/mo"}

Create a premium Bento grid infographic image comparing 3 internet service packages
for CircleTel, a South African ISP.

Layout: 3 vertical card columns side by side, equal width, on a deep navy
(#1B2A4A) background. Each card is a frosted glass panel with subtle light
refraction along edges.

Card design per package:
- Top: circular speed icon (glowing orange ring showing Mbps value)
- Middle: package name in bold clean sans-serif, white, 28pt equivalent
- Price: large orange (#F5831F) bold numeral with "/mo" in smaller white text
- Bottom: 3–4 key feature bullets in white 12pt, left-aligned with orange tick icons

Highlight: the middle card (Package 2) has a slightly elevated z-position and
a brighter orange border glow — indicating "most popular".

Typography style: modern, geometric sans-serif (Futura or similar feel).
All text must be sharp and legible — use clean flat colours for text zones,
not gradients under text.

Background: deep space navy with very subtle circular light bloom behind the
centre card in orange.

Overall style: premium SaaS pricing card, Apple-event aesthetic, liquid glass
material design. Ultra-sharp text rendering, 4K.

Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
Language: {argument name="language" default="English"}.
```

---

### Template B: Feature Highlight Bento Grid (6 modules)

Adapted directly from the Nano Banana Pro featured prompt No. 2 pattern.

```
Create a premium liquid glass Bento grid product infographic with 6 modules
for CircleTel, a South African internet service provider.

Product: {argument name="product" default="CircleTel Fibre Broadband"}

Brand palette:
- Primary: deep navy #1B2A4A (background base)
- Accent: vivid orange #F5831F (highlights, icons, CTA elements)
- Secondary: white (text, cards)
- Surface: frosted glass effect — semi-transparent panels with subtle blur

Grid layout: 2 rows × 3 columns. Module sizes vary:
- Module 1 (large, spans 2 cols): Hero visual — {argument name="hero_module" default="animated speed dial showing 100Mbps, orange glow, dark background"}
- Module 2: "{argument name="feat1_title" default="No Data Caps"}" — icon + short descriptor
- Module 3: "{argument name="feat2_title" default="24/7 Support"}" — icon + short descriptor
- Module 4: "{argument name="feat3_title" default="Free Installation"}" — icon + short descriptor
- Module 5: "{argument name="feat4_title" default="99.9% Uptime SLA"}" — icon + short descriptor
- Module 6: CTA module — orange background, white text: "{argument name="cta_text" default="Check Coverage"}" with arrow

Typography: clean geometric sans-serif throughout. All text sharp and legible.
Icons: flat line icons in orange on dark navy backgrounds.
Borders: subtle 1px orange glow border on each glass panel.
Shadow: soft drop shadows on each module for depth.
Overall: Apple-event / premium SaaS visual language, not clipart.

Ultra-sharp text rendering. 4K resolution. No stock watermarks.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
```

---

### Template C: Single Package Spotlight

For a single package or plan promotional visual (email, social, print).

```
A premium product spotlight infographic for CircleTel's
"{argument name="package_name" default="Business Pro 100"}" internet package.

Layout: centred single-card design on a dark navy (#1B2A4A) background.
The card is a large frosted glass rectangle with rounded corners and a
glowing orange (#F5831F) border.

Card content zones (top to bottom):
1. Header band: package name "{argument name="package_name" default="Business Pro 100"}"
   in large white bold sans-serif
2. Speed hero: giant glowing circular dial — "{argument name="speed" default="100Mbps"}"
   in orange numerals, surrounded by a dynamic speed arc in orange
3. Price zone: "{argument name="price" default="R999/mo"}" — orange bold price,
   "excl. VAT" in small white text below
4. Feature list: 4 features in two columns with orange tick icons:
   {argument name="features" default="No data caps | Free installation | 24/7 support | Static IP included"}
5. Footer: orange pill button shape with text "{argument name="cta" default="Get Connected Today"}"

Background: very subtle abstract fibre-optic light streaks across the navy field.
Typography: modern geometric sans-serif, all text crisp and sharp.
Ultra-realistic render quality, 4K. Aspect ratio: {argument name="aspect_ratio" default="4:5"}.
```

---

### Template D: Adaptive Brand Bento Collage (MeiGen.ai tile-by-tile pattern)

Full 11-zone bento with adaptive content logic — infers CircleTel's actual products before deciding tile content.

```
You are a world-class brand designer, creative director, and editorial art director
specializing in structured brand collages for South African marketing campaigns.

BRAND INPUTS:
BRAND NAME: CircleTel
INDUSTRY: South African ISP — home fibre and business connectivity
PRIMARY BRAND COLOR: vivid orange #F5831F
SECONDARY BRAND COLOR: deep navy #1B2A4A
BRAND PERSONALITY: {argument name="brand_personality" default="confident, local, empowering, modern"}
PRODUCT FOCUS: {argument name="product_focus" default="residential fibre and business connectivity"}
OPTIONAL HEADLINE: {argument name="headline" default="Connected. Everywhere."}

ADAPTIVE CONTENT LOGIC:
Before deciding tile content, infer what CircleTel actually offers:
- Home fibre packages (Starter / Pro / Business), sold via coverage check
- Business connectivity (Office-in-a-Box, WorkConnect+Mobile, Fleet Connect SIMs)
- South African ISP — local support, no data caps, fast installation
Do NOT invent products or hardware CircleTel doesn't ship.
Only include: compact routers, SIM cards, ethernet cables, laptops, smartphones — no server racks or enterprise hardware.

GRID BLUEPRINT:
Create a 16:9 horizontal bento-grid brand collage.
Layout: 3 rows × 4 columns, rounded tiles, equal 12px gaps, clean alignment.
Background: deep navy (#1B2A4A).

11 content zones (map tiles to this grid):

Zone 1 — HERO (spans 2 cols × 2 rows, top-left): flagship lifestyle scene —
  a South African person at home or in a modern office, warm natural light, CircleTel product visible.
  Orange (#F5831F) colour detail ties to brand.

Zone 2 — SPEED STAT (1 col × 1 row, top-centre): dark navy tile, large orange numeral
  showing a speed value (e.g. "100Mbps"), micro-label "fibre speed" in white.

Zone 3 — PRODUCT (1 col × 1 row, top-right): compact product shot — CircleTel router
  with soft orange LED glow on dark background. Studio lighting, sharp detail.

Zone 4 — HEADLINE (2 cols × 1 row, middle-left): typography tile —
  "{argument name="headline" default="Connected. Everywhere."}" in bold white display type
  on a flat orange (#F5831F) background. No texture under text.

Zone 5 — COVERAGE MAP FRAGMENT (1 col × 1 row, middle-centre): abstract coverage map —
  hexagonal orange zones on dark navy, suggesting local geographic reach.

Zone 6 — FEATURE BADGE (1 col × 1 row, middle-right): icon + short feature label.
  Feature: "{argument name="feature_badge" default="No Data Caps"}" — orange icon, white label, navy background.

Zone 7 — SECONDARY LIFESTYLE (1 col × 1 row, bottom-left): tight crop — hands on keyboard
  or person smiling at a phone. Warm South African domestic or office environment.

Zone 8 — PACKAGE NAME (1 col × 1 row, bottom-centre-left): dark navy tile, white package
  name in bold type: "{argument name="package_name" default="Pro 50"}" with small orange
  price tag: "{argument name="price" default="R599/mo"}".

Zone 9 — SUPPORT BADGE (1 col × 1 row, bottom-centre-right): circular icon badge —
  orange ring with "24/7" in bold white, "Support" label below. Navy background.

Zone 10 — BRAND COLOUR BLOCK (1 col × 1 row, bottom-right): flat vivid orange (#F5831F) tile
  with white CTA text: "{argument name="cta_text" default="Check Coverage →"}" in bold sans-serif.

Zone 11 — TEXTURE ACCENT (remaining corner if grid allows): abstract fibre-optic light
  streak fragment in orange, purely decorative, low opacity, navy background.

VISUAL CONSISTENCY RULES (apply across all zones):
- Corner radius: 16px on every tile — uniform, no exceptions
- Gap: 12px between all tiles — equal, no variation
- Typography: clean geometric sans-serif throughout — same typeface family
- Dark tiles: navy (#1B2A4A) background with white or orange text
- Bright tiles: orange (#F5831F) background with white text only — no gradients under text
- All text must be sharp, crisp, and fully legible at 100% zoom
- Icons: flat line style, 2px stroke, orange on dark — no filled clipart, no drop shadows on icons
- Images: editorial photography quality, warm colour grade, not stock photo

NEGATIVE CONSTRAINTS:
NOT generic collage chaos — tiles must feel intentional and aligned.
NOT tiny unreadable text — minimum apparent text size equivalent to 12pt at full resolution.
NOT invented hardware (no server racks, no enterprise gear CircleTel doesn't ship).
NOT Western/non-South-African aesthetic.
NOT cold corporate blue — navy only as a supporting dark tone.

Ultra-sharp text rendering. 4K resolution. sRGB colour mode.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
```

---

## Step 3 — Generate via Gemini API

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """[PASTE FILLED PROMPT HERE]"""

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",  # Pro required for crisp text rendering
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
            image_size="4K"
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("circletel-package-infographic.jpg")
        print("Saved: circletel-package-infographic.jpg")
    elif part.text:
        print(part.text)
```

```bash
set -a && source .env.local && set +a && python scripts/generate-package-infographic.py
```

**Always use `gemini-3-pro-image-preview`** for these — text and numbers must be legible, which requires Pro's superior typography rendering.

---

## Iteration Tips

| Issue | Fix |
|-------|-----|
| Text blurry / unreadable | Add "All text must be sharp, crisp, and fully legible at 100% zoom" |
| Prices wrong font size | Specify "price in 48pt bold, features in 14pt regular" |
| Too cluttered | Remove one module, add "generous white space between elements" |
| Icons look clip-art | Add "clean flat line icons, 2px stroke weight, not filled clipart" |
| Glass effect not visible | Add "frosted glass with visible blur and refraction, not just white opacity" |
