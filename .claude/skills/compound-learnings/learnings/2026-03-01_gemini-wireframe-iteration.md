# Gemini Wireframe Iteration Pattern

**Date**: 2026-03-01
**Session**: Homepage refactor with AI-assisted design iteration
**Impact**: ~2-4 hours saved per design variant

## Pattern Overview

Use Gemini 3.1 Flash Image Preview to generate and iterate on UI wireframes through prompt refinement, rather than manual mockup creation.

## Script Structure

```javascript
// scripts/refine-hero.js
const PROMPTS = {
  "variant-name": `[Detailed UI description with:]
    1. CHANGES TO APPLY - specific modifications
    2. KEEP UNCHANGED - preserved elements
    3. BRAND COLORS - hex values
    4. FONTS - typeface + weights
    5. RENDER - quality expectations
  `,
};

// Rate-limit protection
await new Promise(r => setTimeout(r, 8000)); // 8s between generations
```

## Prompt Engineering Tips

### Be Specific About States
```
SEGMENT TABS:
- ACTIVE TAB: Solid orange #E87A1E background, white text, rectangular with 8px rounded corners
- INACTIVE TABS: Light grey #F0F0F0 background, navy #1B2A4A text
- HOVER STATE: Light orange #FDF2E9 (show on ONE inactive tab to demonstrate)
```

### Define Layout Changes Explicitly
```
ADDRESS SEARCH BAR — Position ABOVE the text content, full width:
- LAYOUT CHANGE: Address bar spans FULL WIDTH of hero card, positioned ABOVE segment content
- Input field (56px height) + "Check Availability" button (200px) on SAME ROW
```

### Specify Typography by Weight
```
FONTS: Manrope throughout — SemiBold (600) for headings/tabs/buttons,
Regular (400) for body text, Medium (500) for labels, Bold (700) for prices.
```

## Iteration Workflow

1. **Initial generation** with baseline prompt
2. **Review output** for issues (tab shape, element prominence, font style)
3. **Update prompt** with specific corrections
4. **Regenerate all variants** to maintain consistency
5. **Implement in code** once design is approved

## Common Refinements

| Issue | Prompt Fix |
|-------|-----------|
| Pill-shaped tabs | "rectangular shape with subtle rounded corners (8px radius)" |
| Element not prominent | "LARGE [element] (56px height, shadow-md)" |
| Wrong background | "light grey #F0F0F0 background" (specify hex) |
| Layout wrong | Add explicit "LAYOUT CHANGE:" section |

## Integration with Code

After wireframe approval, translate to Tailwind:

| Wireframe Spec | Tailwind Class |
|----------------|----------------|
| 8px rounded corners | `rounded-lg` |
| #F0F0F0 background | `bg-circleTel-grey200` |
| 56px height | `h-14` |
| shadow-md | `shadow-md` |
| Manrope SemiBold | `font-display font-semibold` |

## Files

- Script: `scripts/refine-hero.js`
- Output: `wireframes/*.png`
- Reference: `wireframes/current-homepage.png`

## Environment

```bash
GEMINI_API_KEY=xxx node scripts/refine-hero.js all
```

## Time Savings

- Manual mockup: 2-4 hours per variant
- AI generation: 2-3 minutes per variant
- Iteration cycle: 10-15 minutes total for refinements
