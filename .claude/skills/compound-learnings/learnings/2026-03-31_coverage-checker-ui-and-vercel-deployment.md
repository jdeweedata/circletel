---
name: coverage-checker-ui-and-vercel-deployment
description: Admin shared component prop traps (StatusBadge/StatCard), Vercel Enhanced Machine heap sizing, deployment API trigger pattern
type: correction
---

# Coverage Checker UI + Vercel Deployment — Session Learnings

**Date**: 2026-03-31
**Duration**: ~1.5 hours

---

## What Happened

Built the Tarana Coverage Checker admin UI (7 components). Type check returned 10 errors across 5 files. After fixing, build still failed on Vercel — OOM with 6144MB heap. After fixing heap, new commits didn't auto-trigger Vercel deployment. Had to manually trigger via REST API.

---

## Corrections

### 1. StatusBadge uses `status` prop, not `label`

```tsx
// ❌ WRONG (caused 3 type errors)
<StatusBadge variant="success" label="Active" />

// ✅ CORRECT
<StatusBadge variant="success" status="Active" />
```

### 2. StatCard `icon` is ReactNode, not IconType

```tsx
// ❌ WRONG (caused 4 type errors)
<StatCard icon={PiRulerBold} label="Distance" value="1.5 km" />

// ✅ CORRECT
<StatCard icon={<PiRulerBold />} label="Distance" value="1.5 km" />
```

### 3. FresnelAnalysis field names

```typescript
// ❌ WRONG
fresnel.clearanceRatio    // doesn't exist
fresnel.hasLineOfSight    // doesn't exist

// ✅ CORRECT
fresnel.clearanceRatioMin
fresnel.isLineOfSight
```

### 4. react-icons/pi — verify icon names before using

`PiNavigatorBold` does not exist. Use `PiCrosshairBold` for GPS/location mode.
Always check icon exists before committing.

---

## Vercel Enhanced Build Machine Heap

**Old (8GB standard machine)**: 6144MB → now OOMs on large builds
**New (16GB Enhanced machine)**: 12288MB → 14GB total budget, 2GB headroom

Already updated `coding-standards.md` and `vercel.json`.

---

## Vercel Deployment Gap

Multiple commits pushed in rapid succession → Vercel only queued deployment for first commit. Fix commits (`c632f815`, `5a1887a3`) were silently dropped.

**Resolution**: Used Vercel REST API to manually trigger from latest SHA.
Key insight: `repoId` must be numeric GitHub ID (`978274630`), not repo slug.

---

## Patterns → Rules Created

- `.claude/rules/admin-shared-components.md` — StatusBadge/StatCard prop interfaces
- `.claude/rules/vercel-deployment.md` — Deployment trigger + monitoring API patterns
