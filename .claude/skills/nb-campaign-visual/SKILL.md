---
name: nb-campaign-visual
description: Generate Nano Banana Pro (Gemini image gen) prompts for CircleTel campaign-specific visuals — launch banners, campaign hero images, event graphics, and B2B outreach assets. Use for any named campaign (TrUSC, coverage push, product launch, seasonal promo).
---

# CircleTel — Campaign Visual Generator

Produces Nano Banana Pro prompts for campaign-level visual assets. Covers launch imagery, banner ads, event graphics, and outreach materials for named CircleTel campaigns.

## MeiGen.ai Prompt Techniques

| Technique | How to apply |
|-----------|-------------|
| **Role opener** | "You are a world-class campaign art director for a South African ISP" |
| **BRAND INPUTS block** | Structured fields: CAMPAIGN NAME, AUDIENCE, HEADLINE, TONE, COLOUR |
| **Adaptive logic** | Campaign-specific rules: "If TrUSC → community warmth; If B2B → authority" |
| **Negative constraints** | "NOT Western stock photo / NOT generic tech / NOT cold corporate" |
| **Composition percentages** | Hero scene = 60% / text zone = 40%; state explicitly in prompt |

## Current Active Campaigns

| Campaign | Brief | Key Visual Theme |
|----------|-------|-----------------|
| **TrUSC** | Targeted rural/suburban coverage expansion | Community, connectivity, empowerment |
| **Coverage Push** | Drive coverage check conversions | Map, signal, local geography |
| **Office-in-a-Box Launch** | SME product introduction | Modern office, plug-and-play simplicity |
| **WorkConnect+Mobile** | B2B mobility + fixed convergence | Professional on-the-move |

---

## Step 1 — Ask the User

1. **Campaign name** — Which campaign is this for?
2. **Asset type** — Hero banner / Email header / Print flyer / Event backdrop / Social graphic?
3. **Primary message** — One headline (e.g. "Coverage is here. Are you?")
4. **Audience** — Consumer / SME / Enterprise / Rural community?
5. **Tone** — Empowering? Urgent? Warm? Professional?

---

## Step 2 — Templates

### Template A: TrUSC Community Coverage Campaign

Empowering, locally grounded — celebrates bringing connectivity to underserved areas.

```
A photorealistic campaign hero image for CircleTel's coverage expansion
initiative in South Africa.

Scene: {argument name="scene" default="a warm aerial view of a suburban South
African township neighbourhood at golden hour — neat homes, dusty streets,
children playing outside. Overlaid across the image is a subtle glowing orange
mesh network grid, tracing fibre connections from home to home, pulsing softly
with light. The grid feels organic, not corporate — like connectivity growing
naturally through the community"}.

Mood: {argument name="mood" default="hopeful, empowering, warm, community-centred"}.
Lighting: golden hour, long warm shadows, rich sunset sky in orange and amber.
Brand colour presence: the connectivity grid is in CircleTel orange (#F5831F),
with soft navy (#1B2A4A) shadow tones in the architecture.

Text space: leave the {argument name="text_side" default="upper-left quadrant"}
unobstructed — clean gradient fade to dark navy for white headline text overlay.

Style: documentary photography meets data visualisation overlay. Ultra-realistic
aerial photography. 4K. No logos or text in image.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
```

---

### Template B: Coverage Map Hero

For the /check-coverage page or coverage-push campaign landing page.

```
A cinematic data-visualisation hero image for a South African ISP coverage map.

Concept: {argument name="concept" default="a stylised aerial view of the Western
Cape coastline, seen from 2,000m altitude at dusk. Orange-glowing hexagonal
coverage zones pulse across the suburban areas, overlaid on the real geography.
The zones radiate outward from a central hub point, creating a sense of
expanding network reach. Dark navy ocean in the background contrasts with
the warm orange land coverage zones"}.

Colour palette: deep navy (#1B2A4A) for uncovered zones and water, vivid orange
(#F5831F) for active coverage hexagons, white pinpoint glows for towers/nodes.

Mood: precise, expansive, modern tech. Suggests "your area is covered."

Composition: wide panoramic, slight tilt-shift blur on foreground and edges to
focus on the glowing coverage grid centred in frame. Leave upper-right clear
for "Is your area covered?" text overlay.

Style: high-end data visualisation meets photorealistic geography. Think Google
Maps meets a premium brand campaign. 4K.
Aspect ratio: {argument name="aspect_ratio" default="21:9"}.
```

---

### Template C: Office-in-a-Box Product Launch Visual

Clean product launch hero — modern, simple, SME audience.

```
A premium product launch image for CircleTel's "Office-in-a-Box"
all-in-one business connectivity package.

Scene: {argument name="scene" default="a beautifully arranged flat-lay on a
clean white desk: a compact white router with a glowing orange LED ring,
a SIM card, a short ethernet cable, and a small printed card reading
'You're connected.' Arranged neatly like an Apple unboxing aesthetic,
top-down perspective, soft natural daylight from the left"}.

Colour palette: clean white and light grey surface, vivid orange (#F5831F)
LED glow and accents, navy packaging details.

Mood: simple, modern, reassuring — "everything you need, nothing you don't."
Photography style: commercial product photography, overhead flat-lay, 50mm,
three-point softbox lighting, razor-sharp detail. Ultra-realistic. 4K.

Text zone: bottom-third of frame transitions to white for tagline overlay.
Aspect ratio: {argument name="aspect_ratio" default="4:3"}.
No text, logos, or watermarks in image.
```

---

### Template D: Email Campaign Header Banner

Optimised for email — wide, clear, fast-loading visual.

```
A clean, wide email header banner image for a CircleTel marketing campaign.

Theme: {argument name="theme" default="a bright, modern South African home
office environment — natural wood desk, laptop open to a blurred screen,
green plant in background, warm afternoon light"}.

Left side: warm lifestyle scene occupying 60% of width.
Right side: smooth gradient fade to deep navy (#1B2A4A) — 40% of width —
creating a clean dark zone for white text and orange CTA button overlay.

Orange accent element: a single orange-accented detail in the scene
(notebook spine, desk lamp, phone case) ties brand colour to the image.

Photography style: lifestyle editorial, warm colour grade, 35mm, f/2.2.
No stock photo feel — candid, real, South African domestic environment.
Photorealistic, 2K. Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
No text, logos, or UI in image.
```

---

### Template E: Event / Conference Backdrop

For events, trade shows, Zoom backgrounds, or presentation title slides.

```
A large-format event backdrop image for CircleTel, a South African ISP,
to be used as a {argument name="use_case" default="conference backdrop / trade show display"}.

Design: centred symmetrical composition. Deep navy (#1B2A4A) background with a
large abstract fibre-optic mandala pattern radiating outward from centre —
orange light trails (#F5831F) weaving in concentric circles, suggesting network
reach and connectivity.

Surrounding the central mandala: subtle hexagonal grid overlay in low-opacity
white, like a circuit board or coverage map.

Brand zone: wide empty band in the lower third — flat dark navy, clean —
reserved for logo and tagline placement.

Upper corners: very subtle orange glow vignette.

Style: premium tech brand event design, similar to Vodacom or MTN tier event
backdrops but with CircleTel's distinct palette. 4K ultra-sharp.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}.
No text, logos, or watermarks in image itself.
```

---

---

### Template F: Brand Identity Explosion (MeiGen.ai moodboard pattern)

Dense, layered brand world collage — use for campaign launch social posts, OOH concepts, or brand announcement assets.

```
You are a world-class creative director, brand strategist, and editorial art director
specializing in high-impact campaign systems for South African brands.

BRAND INPUTS:
BRAND NAME: CircleTel
INDUSTRY: South African ISP — home fibre and business connectivity
PRIMARY BRAND COLOR: vivid orange #F5831F
SECONDARY BRAND COLOR: deep navy #1B2A4A
BRAND PERSONALITY: {argument name="brand_personality" default="confident, local, empowering, modern"}
CAMPAIGN: {argument name="campaign" default="TrUSC — Coverage Expansion"}
OPTIONAL HEADLINE: {argument name="headline" default="COVERAGE IS HERE"}

VISUAL STYLE:
Create a bold, visually rich, highly curated editorial moodboard collage that feels
like a brand world captured in one frame. Dense, layered, expressive.

Include a mix of:
• lifestyle shot — South African person or community scene (reflecting the campaign)
• packaging or branded material (router box, SIM card, install kit)
• typography snippet with campaign headline in bold display type
• abstract graphic shapes in orange (#F5831F) — blobs, arcs, network nodes
• UI-like elements (coverage map fragment, speed badge, service tier card)
• editorial cutouts and overlapping assets

The composition should feel:
• slightly layered but intentionally designed
• like a premium South African brand campaign Pinterest board
• expressive, community-centred, and brand-heavy
• visually rich and scroll-stopping

COMPOSITION RULES:
• asymmetrical layout (NOT grid-based)
• elements scattered but balanced
• overlapping layers with depth
• mix of large hero elements + small details
• combine clean areas with dense clusters
• avoid too much empty space

COLOUR & DESIGN LANGUAGE:
• strictly follow orange (#F5831F) + navy (#1B2A4A) palette
• strong use of orange across graphic elements
• navy used for contrast, backgrounds, and shadow zones
• minimal additional colours — keep brand-consistent

TYPOGRAPHY:
• modern editorial typography
• bold headlines + small UI text
• include campaign headline naturally in layout
• typography integrated, not separate

ADAPTIVE LOGIC:
- If campaign is TrUSC/community: warm golden tones, township or suburban neighbourhood scene, community figures, softer blob shapes
- If campaign is Office-in-a-Box/B2B: modern office environment, professional figures, more structured layout
- If campaign is Coverage Push: map imagery, signal arcs, geographic scope feeling
- If campaign is product launch: product hero front-and-centre, unboxing element, clean energy

NOT a clean minimal layout.
NOT a grid.
NOT corporate Western stock photography.
Must feel alive, layered, and South African.

Aspect ratio: {argument name="aspect_ratio" default="16:9"}
Resolution: 4K
Style reference: South African premium brand campaign × editorial digital collage × MeiGen.ai pattern No. 3
```

---

## Step 3 — Generate via Gemini API

```python
import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

PROMPT = """[PASTE FILLED PROMPT HERE]"""
ASPECT    = "16:9"   # Adjust per asset type
SIZE      = "4K"     # Use "2K" for email headers, "4K" for print/hero

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[PROMPT],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio=ASPECT,
            image_size=SIZE,
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        part.as_image().save("circletel-campaign.jpg")
        print("Saved: circletel-campaign.jpg")
    elif part.text:
        print(part.text)
```

```bash
set -a && source .env.local && set +a && python scripts/generate-campaign-visual.py
```

---

## Multi-Asset Batch Generation

For generating a full campaign set at once (hero + social + email header):

```python
ASSETS = [
    {"prompt": HERO_PROMPT,   "ratio": "16:9", "size": "4K",  "filename": "campaign-hero.jpg"},
    {"prompt": SOCIAL_PROMPT, "ratio": "1:1",  "size": "2K",  "filename": "campaign-social.jpg"},
    {"prompt": EMAIL_PROMPT,  "ratio": "16:9", "size": "2K",  "filename": "campaign-email.jpg"},
]
```

Use `Batch API` pattern from `gemini-imagegen` skill for 5+ assets simultaneously.

---

---

### Template G: Integrated 2D/3D Brand Ad (Subject + Product Breakout)

For high-impact campaign ads where the subject and product physically overlap the graphic
panel — breaking the wall between design and photo. Extreme low-angle, worm's-eye power.

```
{argument name="brand_name" default="CircleTel"} | {argument name="headline" default="COVERAGE IS HERE"} | {argument name="subtext" default="Fixed wireless from R999/mo"} | {argument name="cta" default="Check Coverage"}

Act as a Senior Art Director.

PHASE 1: INTEGRATED COMPOSITION & OVERLAP
Layout: seamless fusion of 2D graphics and 3D photography. The subject and their primary
product prop (CircleTel router or smartphone) must physically overlap the graphic panel to
break the "wall" between design and photo. Geometric shapes from the graphic side must bleed
into the photographic sky area.

PHASE 2: BRAND & CATEGORY SIMULATION
CircleTel industry: South African ISP — connectivity, mobile, fixed wireless.
Include a person confidently holding or interacting with a CircleTel device (router or phone).
Shape: bold arcs and signal-wave geometry — suggesting reach and connectivity.
Color: CircleTel primary orange (#F5831F) for both graphic pattern and accent on subject's
outfit or device.

PHASE 3: TYPOGRAPHY & CONTENT
Headline: "{argument name="headline" default="COVERAGE IS HERE"}" — bold modern sans-serif,
large, displayed prominently.
Sub-headline: "{argument name="subtext" default="Fixed wireless from R999/mo"}" below headline.
CTA button: minimalist orange pill shape with white text: "{argument name="cta" default="Check Coverage"}".
Typography has 3D depth — text layers sit partially behind the subject or device.

PHASE 4: PHOTOGRAPHY & SUBJECT
Perspective: extreme low-angle (worm's eye view) looking up.
Subject: {argument name="subject" default="confident South African professional, late 20s,
diverse, smart-casual attire with orange accent"}.
Environment: massive clear blue South African sky as backdrop.
Subject's styling incorporates CircleTel orange (#F5831F) as a visual link.

PHASE 5: FINAL VISUAL STYLE
High-end commercial aesthetic. Crisp, saturated, professional fusion of flat vector art
and realistic photography. NOT stock photo. NOT cold corporate.
Aspect ratio: {argument name="aspect_ratio" default="9:16"}.
```

---

### Template H: Three-Panel Vertical Brand Manifesto Stack

For launch posts, campaign announcements, or brand reveal assets (Instagram carousel,
vertical billboard, trade show pull-up banner).

```
{argument name="brand_name" default="CircleTel"}

Act as a Senior AI Visual Strategist & Creative Director. Generate a high-end three-panel
vertical manifesto stack. Every element must be a logical derivative of CircleTel's identity.

PHASE 1: BRAND ANALYSIS
CircleTel: South African ISP — home fibre and business connectivity.
Background color: deep navy #1B2A4A (high contrast primary).
3-word slogan: "{argument name="slogan" default="FAST. LOCAL. CONNECTED."}".
Brand philosophy: "{argument name="philosophy" default="We believe every South African deserves\nfast, reliable connectivity — at home and at work."}".
Technical specs block: 100Mbps fibre | 5G FWA | No data caps | 24/7 support | Same-day install.

PHASE 2: COMPOSITIONAL STRUCTURE (THREE STACKED PANELS)

TOP PANEL — Action & Identity:
Dynamic wide-angle shot of a South African professional using CircleTel — laptop open,
phone in hand, modern home or office environment. Warm golden light.
Typography mid-left: "CircleTel" logo + "{argument name="slogan" default="FAST. LOCAL. CONNECTED."}"
in bold white uppercase sans-serif.
Micro-typography top-left: 2-line brand philosophy in tiny minimalist font.

MIDDLE PANEL — Hero Product & Density:
Macro close-up of CircleTel router — orange LED ring in sharp focus, fine surface detail,
studio lighting. Deep navy background with orange specular highlights.
Typography mid-right: "CircleTel" + slogan — creating diagonal visual flow from top panel.
Technical density bottom-left: the 5 technical specs in sharp microscopic uppercase font —
"technical blueprint" aesthetic filling negative space.

BOTTOM PANEL — The Power Pose:
Low-angle hero shot of the South African subject from TOP PANEL — confident, empowered,
looking directly into camera. Warm backlit sky.
Mega-typography: two massive high-contrast slogans in white bold sans-serif overlaid
across the centre frame.
Corner accents: CircleTel circle icon bottom-right; secondary micro-text bottom-left.

PHASE 3: LIGHTING & TEXTURE
Hard direct sunlight creating crisp sharp-edged shadows and brilliant highlights (Chiaroscuro).
Extreme fidelity in skin pores, fabric weaves, and router surface micro-texture. Zero AI-plastic.

PHASE 4: TECH SPECS
8K Resolution. Global Illumination. Ray Traced reflections. Cinematic photo grain.
Aspect ratio: {argument name="aspect_ratio" default="9:16"} (full vertical stack).
```

---

### Template I: Top-Down Lifestyle Scene (Instagram Table / Custom Prop)

For viral social content — overhead lifestyle scene with a custom-designed prop table
styled as a social post, coverage map, or product card.

```
Ultra-wide-angle hyper-realistic shooting in top-down mode. A group of
{argument name="group_size" default="4"} real people sitting at a
{argument name="table_shape" default="square"} dining table.

The camera is pushed far back, creating significant negative space (empty floor area)
around the people and table — clean, minimalistic composition.

Scene atmosphere: {argument name="atmosphere" default="modern Cape Town apartment, Sunday
afternoon, warm natural light, casual smart-casual attire in navy and orange tones"}.

Each person's actions: {argument name="actions" default="one checking a phone, one
pointing at a laptop, one laughing, one pouring coffee — natural, candid, not posed"}.

The table is a custom-made physical prop designed as a CircleTel product card:
- Solid white stripe ONLY along top and bottom edges (no white frames on left or right).
- Upper white stripe: CircleTel circle logo (drawn profile style), username "circletel",
  small blue verified checkmark, "..." on right.
- Lower white stripe: orange heart + comment + share icons on left, bookmark icon on right.
- Centre of table: filled with CircleTel orange (#F5831F) — hex code #F5831F.
- On the orange surface: {argument name="table_content" default="a CircleTel router
  (white, orange LED ring), a smartphone displaying a coverage map, two coffee cups,
  a notebook. All items strictly within the orange center area — NOTHING beyond the
  white stripes"}.

Floor background: deep navy (#1B2A4A) — creates visual separation from table.
Professional studio lighting, clear shadows. 8K, sharp focus.
Aspect ratio: {argument name="aspect_ratio" default="1:1"}.
```

---

### Template J: Epic Outdoor / Adventure Campaign Ad

For bold outdoor coverage ads, urban campaign posters, or large-format OOH concepts.

```
Epic outdoor {argument name="environment" default="Cape Town mountain"} advertisement for
CircleTel, a South African connectivity brand.

{argument name="subject" default="A confident South African woman, late 20s, standing on
a rocky clifftop with Table Mountain visible behind her"}, holding a CircleTel router
aloft — a giant oversized version of the router dramatically placed on the mountain edge
beside her, suggesting scale and dominance.

Golden hour sunset lighting. The sky is vivid — deep orange fading to navy, matching
CircleTel's brand palette exactly.

Bold condensed white typography "{argument name="headline" default="COVERAGE IS YOURS."}"
overlaid on the sky zone. Tagline below in smaller white text:
"{argument name="tagline" default="Fixed wireless. No cables. Everywhere."}".

Cinematic wide shot. National Geographic–quality photography — not stock photo.
South African landscape. Photorealistic HD.
Aspect ratio: {argument name="aspect_ratio" default="16:9"}. 4K.
No watermarks.
```

---

## Iteration Tips

| Issue | Fix |
|-------|-----|
| Connectivity overlay looks too tech/cold | Add "warm, human-centred, not cold corporate tech" |
| TrUSC scene looks generic African | Add specific geography: "Cape Flats / Soweto / Durban North suburb aesthetic" |
| Orange too dominant | Add "orange as accent only — 20% of visual weight, navy dominant" |
| Scene feels stock-photo | Add "shot on 35mm film, candid, not posed, not stock photo" |
| Coverage map looks fake | Add "photorealistic satellite imagery base with data overlay — not illustrated" |
| 2D/3D breakout not working | Add "subject physically crosses the design panel boundary — hard overlap, no fade or blend" |
| Manifesto text unreadable | Add "all text panels must be ultra-sharp at 8K — no motion blur or typography distortion" |
| Top-down food looks fake | Add "NOT play-doh — real freshly cooked food with realistic texture, steam, and colour" |
| Oversized prop looks composited | Add "the giant object must cast a physically accurate shadow and match the ambient lighting — seamlessly integrated" |
