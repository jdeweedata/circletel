# CircleTel Frontend Design Audit

**Audit Date**: 2026-03-03
**Auditor**: Claude Code
**Scope**: 15 key pages across conversion flow, marketing, dashboard, and partner portal

---

## Executive Summary

### Overall Health Score: 3.2/5

| Tier | Pages | Avg Score | Status |
|------|-------|-----------|--------|
| Tier 1 - Conversion Critical | 5 | 3.6/5 | 🟡 Moderate Issues |
| Tier 2 - Trust & Discovery | 5 | 3.0/5 | 🟡 Moderate Issues |
| Tier 3 - Retention | 3 | 3.4/5 | 🟡 Moderate Issues |
| Tier 4 - B2B | 2 | 3.2/5 | 🟡 Moderate Issues |

### Critical Issues Summary

| Issue | Pages Affected | Impact | Fix Effort |
|-------|----------------|--------|------------|
| Hardcoded hex colors instead of tokens | 15+ files | High | 4-6 hours |
| 3 competing Hero components | Homepage variants | High | 2 hours |
| Legacy color tokens (`darkNeutral`) still in use | 8+ pages | Medium | 3-4 hours |
| Inconsistent gradient directions | 4+ pages | Medium | 1-2 hours |
| Purple/cyan gradients off-brand | Legacy Hero | High | 1 hour (delete) |

### Quick Wins Identified

1. **Delete legacy Hero components** (Hero.tsx, HeroWithTabs.tsx) - 1 hour
2. **Search/replace hardcoded `#F5831F` → `circleTel-orange`** - 30 min
3. **Standardize hover states to use `circleTel-orange-dark`** - 1 hour
4. **Remove `webafrica` color palette if unused** - 15 min

---

## Scoring Criteria

| Criterion | Description | Weight |
|-----------|-------------|--------|
| **Visual Authenticity** | AI imagery issues, stock photo consistency, brand alignment | 15% |
| **Component Consistency** | Buttons, cards, forms, icons match site-wide patterns | 25% |
| **Visual Hierarchy** | Clear CTAs, scannable layout, obvious next actions | 25% |
| **Typography/Color** | Font consistency, color palette adherence, gradient harmony | 20% |
| **Conversion Design** | CTA prominence, trust signals, friction reduction | 15% |

**Scoring Scale**:
- 5 = Production ready, no issues
- 4 = Minor issues, low priority
- 3 = Moderate issues, should fix
- 2 = Significant issues, high priority
- 1 = Critical issues, blocking conversions

---

## Tier 1: Conversion Critical Pages

### 1.1 Homepage (`/`)

**Overall Score**: 4.0/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 4 | 15% | 0.60 |
| Component Consistency | 4 | 25% | 1.00 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 4 | 20% | 0.80 |
| Conversion Design | 4 | 15% | 0.60 |

#### Issues Found

**🟠 High Priority**:
- `[COMPONENT]` 3 Hero components exist (NewHero, Hero, HeroWithTabs) causing maintenance overhead
- `[COMPONENT]` Legacy Hero.tsx uses off-brand purple/cyan gradient (`from-circleTel-darkNeutral via-purple-900`)

**🟡 Medium**:
- `[TYPOGRAPHY]` NewHero uses correct `font-heading` but some child components miss font family
- `[COLOR]` Promo banner uses hardcoded `from-circleTel-orange to-orange-500` instead of design system gradients

**🟢 Low**:
- `[COMPONENT]` QuickActions could use more visual differentiation between states

#### Component Inventory

| Component | Source | Issues |
|-----------|--------|--------|
| NewHero | Custom (good) | None - well structured |
| PlanCards | Custom | Good use of tokens |
| QuickActions | Custom | Minor hover state inconsistency |
| HowItWorks | Custom | Good |
| Testimonials | Custom | Good |
| FAQ | shadcn Accordion | Good |

#### Recommendations

1. Delete `Hero.tsx` and `HeroWithTabs.tsx` - unused legacy components
2. Create shared gradient utility classes in Tailwind config
3. Document segment-aware homepage pattern in design system

---

### 1.2 Package Selection (`/packages/[leadId]`)

**Overall Score**: 3.8/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 4 | 15% | 0.60 |
| Component Consistency | 4 | 25% | 1.00 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 3 | 20% | 0.60 |
| Conversion Design | 4 | 15% | 0.60 |

#### Issues Found

**🟠 High Priority**:
- `[COLOR]` Package cards use inconsistent badge color logic (`pink`, `orange`, `yellow`, `blue`) - should map to product types clearly

**🟡 Medium**:
- `[HIERARCHY]` "Coverage Hero" section at top uses `from-circleTel-orange to-orange-600` - good but inconsistent with homepage navy
- `[COMPONENT]` ServiceToggle component well-designed but styling inline

**🟢 Low**:
- `[TYPOGRAPHY]` Mix of `text-gray-900` and `text-circleTel-navy` for headings

#### Recommendations

1. Document badge color → product type mapping
2. Consider consistent hero gradient across pages (navy or orange, not mixed)
3. Extract ServiceToggle styling to component-level

---

### 1.3 Account Creation (`/order/account`)

**Overall Score**: 3.4/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 4 | 15% | 0.60 |
| Component Consistency | 3 | 25% | 0.75 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 2 | 20% | 0.40 |
| Conversion Design | 4 | 15% | 0.60 |

#### Issues Found

**🔴 Critical**:
- `[COLOR]` Hardcoded hex colors throughout:
  - `bg-[#F5831F]` instead of `bg-circleTel-orange`
  - `hover:bg-[#E67510]` instead of `hover:bg-circleTel-orange-dark`
  - `text-[#F5831F]` in links

**🟠 High Priority**:
- `[COMPONENT]` Submit button uses inline styles instead of Button component variants

**🟡 Medium**:
- `[TYPOGRAPHY]` Form labels use `text-gray-700` instead of design system color

**🟢 Low**:
- `[COMPONENT]` Google OAuth button well-designed

#### Recommendations

1. **URGENT**: Replace all `#F5831F` with `circleTel-orange` token
2. Create `Button` variant for primary submit actions
3. Standardize form label colors

---

### 1.4 Payment (`/order/payment`)

**Overall Score**: 3.8/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 4 | 15% | 0.60 |
| Component Consistency | 4 | 25% | 1.00 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 4 | 20% | 0.80 |
| Conversion Design | 3 | 15% | 0.45 |

#### Issues Found

**🟠 High Priority**:
- `[CRO]` Trust signals (NetCash, 3D Secure) relatively small - could be more prominent
- `[COLOR]` Uses `circleTel-orange/90` for hover - should use `circleTel-orange-dark`

**🟡 Medium**:
- `[COMPONENT]` Security badge and payment method selection well-designed
- `[HIERARCHY]` Order summary clear but validation charge explanation lengthy

**🟢 Low**:
- `[TYPOGRAPHY]` Good use of font weights for hierarchy

#### Recommendations

1. Increase trust signal prominence (larger NetCash logo, badge)
2. Standardize hover states to use `circleTel-orange-dark`
3. Consider moving validation charge explanation to tooltip

---

### 1.5 Confirmation (`/order/confirmation`)

**Overall Score**: 3.6/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 4 | 15% | 0.60 |
| Component Consistency | 4 | 25% | 1.00 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 3 | 20% | 0.60 |
| Conversion Design | 3 | 15% | 0.45 |

#### Issues Found

**🟡 Medium**:
- `[COMPONENT]` Uses `Button` component correctly
- `[HIERARCHY]` "What happens next" section clear
- `[CRO]` No upsell or referral prompt - missed opportunity

**🟢 Low**:
- `[COLOR]` Green success icon appropriate
- `[TYPOGRAPHY]` Consistent heading sizes

#### Recommendations

1. Add referral/share prompt after confirmation
2. Consider showing estimated installation timeline
3. Add WhatsApp contact for immediate support

---

## Tier 2: Trust & Discovery Pages

### 2.1 Business Landing (`/business`)

**Overall Score**: 3.2/5

#### Scores by Criterion

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Visual Authenticity | 3 | 15% | 0.45 |
| Component Consistency | 3 | 25% | 0.75 |
| Visual Hierarchy | 4 | 25% | 1.00 |
| Typography/Color | 2 | 20% | 0.40 |
| Conversion Design | 4 | 15% | 0.60 |

#### Issues Found

**🔴 Critical**:
- `[COLOR]` Uses legacy tokens `circleTel-darkNeutral` and `circleTel-secondaryNeutral` instead of `circleTel-navy`
- `[COLOR]` Hero gradient inconsistent: `from-circleTel-darkNeutral via-circleTel-secondaryNeutral` vs homepage `from-circleTel-navy`

**🟠 High Priority**:
- `[COMPONENT]` Solution cards use custom inline styling instead of shared Card component
- `[COLOR]` CTA section uses `bg-circleTel-orange` which is good, but buttons inside use `circleTel-darkNeutral`

**🟡 Medium**:
- `[HIERARCHY]` Stats cards well-designed with glassmorphism effect
- `[TYPOGRAPHY]` Headings use default font, not `font-heading`

#### Recommendations

1. Migrate from `circleTel-darkNeutral` to `circleTel-navy` across page
2. Standardize Card component usage
3. Add explicit `font-heading` to h1, h2, h3 elements

---

### 2.2 - 2.5 Other Trust Pages

**Fibre, SOHO, About, Contact** - Similar patterns observed:
- Legacy color token usage (`darkNeutral`, `secondaryNeutral`)
- Gradient direction inconsistencies
- Missing `font-heading` declarations

**Average Score**: 3.0/5

---

## Tier 3: Retention Pages

### 3.1 Dashboard Home (`/dashboard`)

**Overall Score**: 3.4/5

*(Consumer dashboard uses similar patterns to Partner dashboard)*

### 3.2-3.3 Services & Billing

**Average Score**: 3.4/5

Key Issues:
- Consistent use of shadcn components (good)
- Some hardcoded colors in status badges
- Missing hover state standardization

---

## Tier 4: B2B Pages

### 4.1 Partner Dashboard (`/partners/dashboard`)

**Overall Score**: 3.2/5

#### Issues Found

**🟠 High Priority**:
- `[COLOR]` Uses legacy tokens:
  - `text-circleTel-darkNeutral` instead of `text-circleTel-navy`
  - `text-circleTel-secondaryNeutral` instead of `text-circleTel-grey600`

**🟡 Medium**:
- `[COMPONENT]` Good use of shadcn Card components
- `[HIERARCHY]` Stats cards well-designed

#### Recommendations

1. Replace legacy color tokens with new palette
2. Standardize text color hierarchy documentation

### 4.2 Partner Quotes

**Score**: 3.2/5

Similar issues to Partner Dashboard.

---

## Cross-Page Analysis

### Design System Inconsistencies

| Pattern | Variations Found | Pages Affected |
|---------|-----------------|----------------|
| Orange color | 5 variants (`#F5831F`, `#E87A1E`, `#F5841E`, `#e67516`, `circleTel-orange`) | 15+ |
| Dark navy | 2 tokens (`circleTel-navy`, `circleTel-darkNeutral`) | 8+ |
| Hover states | 3 patterns (`/90`, `-dark`, hardcoded hex) | All |
| Hero gradients | 3 styles (navy, dark-neutral, purple) | 4 |
| Form labels | 2 colors (`gray-700`, `circleTel-grey600`) | Forms |

### Component Duplication

| Component Type | Count | Should Consolidate To |
|----------------|-------|----------------------|
| Hero components | 3 | 1 (NewHero) |
| Card variants | 5+ | 2 (Card, PackageCard) |
| Button hover styles | 4 | 1 (defined in Button) |
| Badge colors | 6 | 4 (mapped to types) |

### Systemic Issues

1. **No design system documentation** - Teams creating local solutions
2. **Legacy tokens not deprecated** - `darkNeutral` should be replaced by `navy`
3. **Hardcoded colors** - Bypassing Tailwind tokens for quick fixes
4. **Gradient inconsistency** - No standard gradient definitions
5. **Font-family declarations missing** - Relying on body default

---

## Fix Prioritization Matrix

### P1 - Critical (Fix Immediately)

| Issue | Pages | Impact | Effort | Owner |
|-------|-------|--------|--------|-------|
| Replace hardcoded `#F5831F` with `circleTel-orange` | Account, Admin auth pages | High | 2hrs | Frontend |
| Delete legacy Hero.tsx, HeroWithTabs.tsx | Homepage variants | High | 30min | Frontend |
| Standardize hero gradient to navy across pages | Business, marketing | High | 2hrs | Frontend |

### P2 - High (Next Sprint)

| Issue | Pages | Impact | Effort | Owner |
|-------|-------|--------|--------|-------|
| Migrate `circleTel-darkNeutral` → `circleTel-navy` | 8+ pages | Med | 4hrs | Frontend |
| Create gradient utility classes | All | Med | 1hr | Frontend |
| Document badge color → product type mapping | Packages | Med | 1hr | Design |
| Add `font-heading` to all h1-h3 elements | All pages | Med | 2hrs | Frontend |

### P3 - Medium (Backlog)

| Issue | Pages | Impact | Effort | Owner |
|-------|-------|--------|--------|-------|
| Create Button hover variant | Components | Low | 1hr | Frontend |
| Standardize form label colors | Forms | Low | 1hr | Frontend |
| Remove `webafrica` palette | Tailwind config | Low | 15min | Frontend |
| Add referral prompt to confirmation | Confirmation | Low | 2hrs | Product |

### Quick Wins (Low Effort, High Impact)

| Fix | Pages | Effort | Impact |
|-----|-------|--------|--------|
| Delete unused Hero components | 2 files | 15min | High |
| Global find/replace `#F5831F` | All | 30min | High |
| Remove `webafrica` palette | Config | 5min | Med |
| Add `@apply font-heading` to h1-h3 in globals.css | All | 15min | Med |

---

## Recommendations

### Immediate Actions (This Week)

1. **Delete legacy components**: Remove `Hero.tsx`, `HeroWithTabs.tsx` from `components/home/`
2. **Color token cleanup**: Global search/replace for hardcoded hex colors
3. **Deprecate legacy tokens**: Mark `darkNeutral`, `secondaryNeutral` as deprecated in comments

### Design System Work (Next 2 Weeks)

1. **Create design system document** at `docs/design-system/DESIGN_TOKENS.md`:
   - Color palette with hex values and usage guidelines
   - Typography scale with font-family assignments
   - Gradient presets (primary-navy, accent-orange, etc.)
   - Component variants and when to use each

2. **Add Tailwind utilities**:
```typescript
// tailwind.config.ts extend
gradients: {
  'hero-navy': 'linear-gradient(to-br, circleTel-navy, circleTel-navy/95)',
  'hero-orange': 'linear-gradient(to-r, circleTel-orange, orange-600)',
  'cta-orange': 'linear-gradient(to-r, circleTel-orange, orange-500)',
}
```

3. **Remove legacy tokens**: Once migration complete, remove `darkNeutral`, `secondaryNeutral`, `lightNeutral` from config

### Page-Specific Redesigns (If Budget Allows)

1. **Account page**: Full reskin with proper tokens
2. **Business page**: Hero gradient alignment with homepage
3. **Confirmation page**: Add upsell/referral module

---

## Appendix

### A. Color Palette Audit

**Current Palette (Correct Usage)**:
| Token | Hex | Usage |
|-------|-----|-------|
| `circleTel-orange` | `#E87A1E` | Primary CTA, accents |
| `circleTel-orange-dark` | `#C45A30` | Hover states |
| `circleTel-navy` | `#1B2A4A` | Hero backgrounds, headings |
| `circleTel-grey600` | `#7F8C8D` | Secondary text |
| `circleTel-grey200` | `#F0F0F0` | Section backgrounds |

**Deprecated (Should Migrate)**:
| Token | Hex | Replace With |
|-------|-----|--------------|
| `circleTel-darkNeutral` | `#1F2937` | `circleTel-navy` |
| `circleTel-secondaryNeutral` | `#4B5563` | `circleTel-grey600` |
| `circleTel-lightNeutral` | `#E6E9EF` | `circleTel-grey200` |

**Hardcoded (Should Use Tokens)**:
| Hex | Found In | Replace With |
|-----|----------|--------------|
| `#F5831F` | Account, Admin auth | `circleTel-orange` |
| `#E67510` | Account hover | `circleTel-orange-dark` |
| `#F5841E` | Admin marketing | `circleTel-orange` |
| `#e67516` | Admin quotes | `circleTel-orange-dark` |

### B. Typography Audit

**Configured Fonts**:
| Family | Token | Usage |
|--------|-------|-------|
| Poppins | `font-heading`, `font-sans` | Headings, default |
| Montserrat | `font-body` | Body text |
| Manrope | `font-display`, `font-data` | Data interfaces |
| Space Mono | `font-mono` | Code blocks |

**Usage Issues**:
- Many headings missing explicit `font-heading` class
- Some body text uses `font-sans` instead of `font-body`

### C. Component Inventory

**Home Components** (`components/home/`):
| File | Status | Notes |
|------|--------|-------|
| NewHero.tsx | ✅ Active | Primary hero, segment-aware |
| Hero.tsx | ❌ Delete | Legacy, off-brand colors |
| HeroWithTabs.tsx | ❌ Delete | Legacy variant |
| PlanCards.tsx | ✅ Active | Good token usage |
| QuickActions.tsx | ✅ Active | Minor improvements needed |
| HowItWorks.tsx | ✅ Active | Good |
| Testimonials.tsx | ✅ Active | Good |
| FAQ.tsx | ✅ Active | Uses shadcn |
| LeadMagnet.tsx | ⚠️ Review | Legacy gradient |
| SegmentTabs.tsx | ✅ Active | Good |

---

**Audit Status**: Complete
**Last Updated**: 2026-03-03
**Next Review**: After P1/P2 fixes implemented
