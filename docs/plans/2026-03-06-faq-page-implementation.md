# FAQ Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a comprehensive FAQ page at `/faq` optimized for SEO, GEO (AI citations), and user experience.

**Architecture:** Server Component with static metadata, JSON-LD structured data, sticky category navigation, accordion-based FAQ sections, and extractable stat callouts. Content stored in TypeScript data file for type safety.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Radix Accordion, Phosphor Icons, JSON-LD schemas

**Security Note:** JSON-LD scripts use `dangerouslySetInnerHTML` which is safe here because content is generated server-side from our own static data file (not user input). This is the standard Next.js pattern for structured data.

---

## Task 1: Create FAQ Data Types and Content

**Files:**
- Create: `app/faq/faq-data.ts`

**Step 1: Create the FAQ data file with types and content**

Create file `app/faq/faq-data.ts` with:
- FAQItem and FAQCategory interfaces
- 7 categories with ~30 total FAQs
- Helper functions: getAllFAQs(), getCategoryById()

Categories:
1. Coverage & Availability (4 Qs)
2. Pricing & Billing (5 Qs)
3. Installation & Setup (5 Qs)
4. Speed & Performance (5 Qs)
5. Contracts & Cancellation (4 Qs)
6. Support & Service (4 Qs) - accurate WhatsApp/8x5 messaging
7. Business Solutions (5 Qs)

**Step 2: Verify TypeScript types compile**

Run: `npm run type-check:memory 2>&1 | grep -E "(faq-data|error)" | head -20`
Expected: No errors related to faq-data.ts

**Step 3: Commit**

```bash
git add app/faq/faq-data.ts
git commit -m "feat(faq): add FAQ data with 7 categories and 30 questions"
```

---

## Task 2: Create StatCallouts Component

**Files:**
- Create: `components/faq/StatCallouts.tsx`

**Step 1: Create the StatCallouts component**

- Grid of 3 stat cards (1 col mobile, 3 col desktop)
- Default stats: Installation (3-7 days), WhatsApp Support, No contracts
- CSS class `.stat-callout` for Speakable schema targeting
- Props: stats (optional), className

**Step 2: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "(StatCallouts|error)" | head -10`

**Step 3: Commit**

```bash
git add components/faq/StatCallouts.tsx
git commit -m "feat(faq): add StatCallouts component for extractable facts"
```

---

## Task 3: Create CategoryNav Component

**Files:**
- Create: `components/faq/CategoryNav.tsx`

**Step 1: Create the CategoryNav component**

- Client component ('use client')
- Horizontal scrollable on mobile
- Sticky positioning below header (top-16)
- Active state tracking via scroll position
- Smooth scroll to category on click
- Icon + label (label truncated on mobile)

**Step 2: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "(CategoryNav|error)" | head -10`

**Step 3: Commit**

```bash
git add components/faq/CategoryNav.tsx
git commit -m "feat(faq): add CategoryNav sticky navigation component"
```

---

## Task 4: Create FAQ Page with JSON-LD Schemas

**Files:**
- Create: `app/faq/page.tsx`

**Step 1: Create the main FAQ page**

Server component with:

1. **Metadata** - title, description, keywords, OpenGraph, canonical
2. **JSON-LD Scripts** (3 schemas):
   - FAQPage schema with all questions
   - Organization schema with contact info
   - Speakable schema targeting .faq-answer and .stat-callout
3. **Hero Section** - orange gradient, breadcrumb, title, description
4. **StatCallouts** - positioned at -mt-6 to overlap hero
5. **CategoryNav** - sticky navigation
6. **FAQ Sections** - 7 category sections with accordions
7. **CTA Section** - coverage checker, contact options

**Step 2: Verify TypeScript compiles**

Run: `npm run type-check:memory 2>&1 | grep -E "(faq/page|error)" | head -20`

**Step 3: Commit**

```bash
git add app/faq/page.tsx
git commit -m "feat(faq): add FAQ page with SEO metadata and JSON-LD schemas"
```

---

## Task 5: Create Component Index and Verify Build

**Files:**
- Create: `components/faq/index.ts`

**Step 1: Create barrel export**

```typescript
export { CategoryNav } from './CategoryNav';
export { StatCallouts } from './StatCallouts';
export type { StatItem } from './StatCallouts';
```

**Step 2: Run full type check**

Run: `npm run type-check:memory`
Expected: No errors, exit code 0

**Step 3: Run build to verify SSR works**

Run: `npm run build:memory 2>&1 | tail -30`
Expected: Build succeeds, `/faq` route listed

**Step 4: Commit**

```bash
git add components/faq/index.ts
git commit -m "feat(faq): add component barrel exports"
```

---

## Task 6: Visual Verification and Final Commit

**Step 1: Start dev server**

Run: `npm run dev:memory`

**Step 2: Manual verification checklist**

- [ ] Navigate to http://localhost:3000/faq
- [ ] Hero section displays with orange gradient
- [ ] Stat callouts render (3 cards)
- [ ] Category navigation is sticky on scroll
- [ ] Clicking category jumps to section
- [ ] All 7 FAQ sections render with accordions
- [ ] Accordions expand/collapse smoothly
- [ ] CTA section has coverage checker + contact buttons
- [ ] Contact options display (WhatsApp, Phone, Email)
- [ ] Mobile responsive (check at 375px width)

**Step 3: Verify JSON-LD in page source**

1. View page source (Ctrl+U)
2. Search for "application/ld+json"
3. Verify 3 script blocks exist

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(faq): complete FAQ page implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | FAQ data types and content | `app/faq/faq-data.ts` |
| 2 | StatCallouts component | `components/faq/StatCallouts.tsx` |
| 3 | CategoryNav component | `components/faq/CategoryNav.tsx` |
| 4 | FAQ page with JSON-LD | `app/faq/page.tsx` |
| 5 | Component exports + build | `components/faq/index.ts` |
| 6 | Visual verification | Manual testing |

**Total estimated time:** 45-60 minutes

**Post-implementation:**
1. Test in staging environment
2. Run Google Rich Results Test on /faq URL
3. Submit to Google Search Console for indexing
4. Monitor AI assistant citations
