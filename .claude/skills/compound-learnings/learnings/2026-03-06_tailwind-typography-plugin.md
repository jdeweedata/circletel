# Tailwind Typography Plugin Must Be Enabled

**Date:** 2026-03-06
**Trigger:** Prose classes not rendering (no bullet points, no spacing)
**Time to debug:** ~15 minutes

## Problem

Created content pages using Tailwind's `prose` classes for typography (bullet points, paragraph spacing, heading styles). The classes were applied but had no visual effect - lists showed no bullets, paragraphs had no spacing.

## Root Cause

The `@tailwindcss/typography` plugin was **installed** in `package.json` but **not enabled** in `tailwind.config.ts`.

```bash
# Plugin was in package.json
"@tailwindcss/typography": "^0.5.15"

# But missing from tailwind.config.ts plugins array
plugins: [tailwindcssAnimate],  # ❌ typography not included
```

## Fix

```typescript
// tailwind.config.ts
import typography from "@tailwindcss/typography";

export default {
  // ...
  plugins: [tailwindcssAnimate, typography],  // ✅ Add typography
} satisfies Config;
```

## Verification Checklist

When prose classes don't work:

1. **Check package.json** — Is `@tailwindcss/typography` installed?
2. **Check tailwind.config.ts** — Is `typography` imported AND in plugins array?
3. **Restart dev server** — Tailwind config changes require restart

## Pattern: Plugin Installation vs Enablement

Installing a Tailwind plugin is two steps:
1. `npm install @tailwindcss/[plugin]` — Downloads the package
2. Add to `plugins: []` in config — Actually enables it

This applies to all Tailwind plugins:
- `@tailwindcss/typography` (prose classes)
- `@tailwindcss/forms` (form styling)
- `@tailwindcss/aspect-ratio` (aspect ratios)
- `@tailwindcss/container-queries` (container queries)

## CircleTel Specific

Our `tailwind.config.ts` now includes:
```typescript
plugins: [tailwindcssAnimate, typography],
```

Prose classes used in `ContentSection.tsx`:
```typescript
className="prose prose-gray max-w-none prose-ul:list-disc ..."
```
