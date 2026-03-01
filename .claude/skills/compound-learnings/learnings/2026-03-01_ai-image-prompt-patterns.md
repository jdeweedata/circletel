# AI Image Generation Prompt Patterns

**Date**: 2026-03-01
**Category**: Design / AI Image Generation
**Impact**: High - Used for all marketing asset generation

## The 7-Part Prompt Formula

Every effective AI image prompt follows this structure:

```
[Subject] + [Composition] + [Context/Props] + [Materials] +
[Lighting] + [Quality Signals] + [Technical Specs]
```

### Example Application

```
CircleTel 5G router,              # Subject
centered 3/4 hero angle,          # Composition
with orange (#F5831F) cables,     # Context/Props
matte black glossy surface,       # Materials
dramatic studio lighting,         # Lighting
ultra realistic commercial,       # Quality Signals
85mm f/2.8, 4K, 16:9             # Technical Specs
```

## Quality Signal Injection (Always Include)

```
ultra realistic, commercial product photography,
professional studio lighting, sharp focus, 4K resolution,
no AI-generated text
```

These signals consistently improve output quality across all AI image generators.

## Prompt Length Sweet Spot

| Length | Effect |
|--------|--------|
| < 30 words | Too vague, inconsistent results |
| 50-80 words | Optimal - specific yet focused |
| > 100 words | Diminishing returns, model confusion |

## Camera Specs That Add Realism

| Spec | When to Use |
|------|-------------|
| `100mm lens, f/8` | Product photography (deep focus) |
| `85mm lens, f/2.8` | Lifestyle/portrait (shallow DOF) |
| `35mm wide angle` | Environmental/office scenes |
| `macro photography` | Detail shots |

## Material Micro-Details

Add 2-3 material descriptors for realism:

- **Surfaces**: matte, glossy, textured, brushed metal
- **Lighting effects**: LED glow, reflection, rim light
- **Tactile cues**: dewy, condensation, frosted

## Common Mistakes to Avoid

| ❌ Avoid | ✅ Use Instead |
|----------|---------------|
| "beautiful amazing" | Specific material descriptions |
| AI-generating logos | Composite real logos in post |
| 150+ word prompts | Keep to 50-80 words |
| Generic backgrounds | Use brand colors (#F5831F, #1F2937) |
| Skip aspect ratio | Always specify (1:1, 16:9, 21:9) |

## Text Artifact Prevention

Always append one of these to prevent AI text:
```
no text, no labels, no AI-generated text
```
or
```
clean surface, no branding, no words
```

## Brand Context Injection

For CircleTel assets, include:
```
Primary Color: vibrant orange (#F5831F)
Secondary: dark charcoal (#1F2937)
Background: light gray (#E6E9EF) or pure white
Style: modern, professional, approachable
```

## South African Context (Lifestyle)

For local market relevance:
```
diverse South African family, modern African home,
Johannesburg/Cape Town skyline, African-inspired decor
```

## Template Location

All templates: `.design/prompts/templates/`
- `product-*.md` - Hardware shots
- `concept-*.md` - Abstract visuals
- `lifestyle-*.md` - People scenes
- `social-*.md` - Marketing graphics

## Related Files

- `.design/prompts/PROMPT_GUIDE.md` - Full documentation
- `.design/prompts/brand-context.yaml` - Brand specifications
- `.design/prompts/WORKFLOW.md` - Generation process
