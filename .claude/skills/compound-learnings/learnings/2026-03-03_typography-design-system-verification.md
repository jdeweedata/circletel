# Typography Design System Verification Pattern

**Date**: 2026-03-03
**Source**: Typography evaluation implementation verification session
**Impact**: Saves ~15-30 min per design system implementation

## Context

When implementing design system changes across 157+ files, verification is critical before claiming completion.

## Pattern: Implementation Verification Checklist

### 1. Check Documentation Exists
```bash
ls -la docs/design-system/README.md
```

### 2. Verify Deleted Components
```bash
ls -la components/home/Hero*.tsx 2>/dev/null || echo "Deleted as expected"
ls -la components/ui/package-card.tsx 2>/dev/null || echo "Deleted as expected"
```

### 3. Verify Token Additions
```bash
# Check tailwind.config.ts for new tokens
grep -E "display-1|display-2|display-3|display-4" tailwind.config.ts
grep -E "gradient-hero|gradient-cta|gradient-card" tailwind.config.ts
```

### 4. Verify Token Migration
```bash
# Count old token usage (should be 0 or minimal)
grep -r "oldToken" --include="*.tsx" components/ app/ | wc -l

# Count new token usage (should be > 0)
grep -r "newToken" --include="*.tsx" components/ app/ | wc -l
```

### 5. Verify CSS Classes
```bash
grep -E "\.page-title|\.section-heading|font-size:\s*48px" app/globals.css
```

### 6. Run Type Check
```bash
npm run type-check:memory
```

## Typography Scale Reference

Based on 1.32× modular scale (Payfast analysis):

| Element | Desktop | Mobile (0.85×) | Weight |
|---------|---------|----------------|--------|
| H1 | 48px | 40px | 700 |
| H2 | 36px | 30px | 700 |
| H3 | 28px | 24px | 600 |
| H4 | 21px | 18px | 600 |
| Body | 16px | 16px | 400 |

## Acceptable Exceptions

These contexts require hardcoded hex values (don't chase 100% token coverage):

1. **Recharts components** - Fill/stroke props require hex strings
2. **Google Maps API** - strokeColor/fillColor require hex
3. **Inline SVG elements** - fill/stroke attributes need hex
4. **Dynamic style objects** - `style={{ background: '#hex' }}`

## Key Insight

> When plan says "IMPLEMENTATION COMPLETE", always verify:
> 1. Files deleted that should be deleted
> 2. Files created that should be created
> 3. Token migration counts (old → 0, new → expected)
> 4. Type check passes

## Related Files

- `docs/design-system/README.md` - Design system documentation
- `tailwind.config.ts` - Token definitions (fontSize, colors, gradients)
- `app/globals.css` - Typography CSS classes
- `components/ui/button.tsx` - CTA button variants
