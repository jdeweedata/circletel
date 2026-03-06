# Content Page Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build reusable FAQ-style template components for legal/content pages

**Architecture:** Composable block components with data-driven content. Each page imports template components and passes content via a data file. Sidebar auto-generates navigation from sections.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Phosphor Icons, react-icons/pi

**Security Note:** JSON-LD scripts use `dangerouslySetInnerHTML` which is safe here because content is generated from static data files (not user input). This pattern matches the existing FAQ page.

---

## Task 1: Create Content Types

**Files:**
- Create: `lib/content/types.ts`

**Step 1: Create the types file**

```typescript
// lib/content/types.ts
import { IconType } from 'react-icons';
import { ReactNode } from 'react';

/**
 * A single content section (e.g., "1. Service Description")
 */
export interface ContentSection {
  /** URL anchor: "service-description" */
  id: string;
  /** Section title: "1. Service Description" */
  title: string;
  /** Optional icon for navigation */
  icon?: IconType;
  /** JSX content (paragraphs, lists, subsections) */
  content: ReactNode;
}

/**
 * A key point for sidebar (optional highlights)
 */
export interface KeyPoint {
  icon: IconType;
  title: string;
  description?: string;
}

/**
 * Page metadata for SEO and schema generation
 */
export interface ContentPageMeta {
  /** Page title: "Terms of Service" */
  title: string;
  /** Full SEO title: "Terms of Service | CircleTel" */
  pageTitle: string;
  /** Meta description */
  description: string;
  /** Last updated: "March 2026" */
  lastUpdated: string;
  /** Canonical path: "/terms-of-service" */
  canonicalPath: string;
}

/**
 * Complete page data structure
 */
export interface ContentPageData {
  meta: ContentPageMeta;
  intro: {
    /** Optional sidebar intro heading */
    title?: string;
    /** Sidebar intro text */
    description: string;
  };
  /** Optional key highlights for sidebar */
  keyPoints?: KeyPoint[];
  /** Main content sections */
  sections: ContentSection[];
}

/**
 * Props for SidebarNav component
 */
export interface SidebarNavSection {
  id: string;
  title: string;
  icon?: IconType;
}
```

**Step 2: Verify types compile**

Run: `npm run type-check:memory`
Expected: No errors related to `lib/content/types.ts`

**Step 3: Commit**

```bash
git add lib/content/types.ts
git commit -m "feat(content): add content page type definitions"
```

---

## Task 2: Create JSON-LD Schema Generators

**Files:**
- Create: `lib/content/schema.ts`

**Step 1: Create schema generators**

```typescript
// lib/content/schema.ts
import { ContentPageMeta } from './types';

const SITE_URL = 'https://www.circletel.co.za';

/**
 * WebPage schema for legal/content pages
 */
export function generateWebPageSchema(meta: ContentPageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}${meta.canonicalPath}`,
    dateModified: meta.lastUpdated,
    inLanguage: 'en-ZA',
    publisher: {
      '@type': 'Organization',
      name: 'CircleTel',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}

/**
 * BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(meta: ContentPageMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: meta.title,
        item: `${SITE_URL}${meta.canonicalPath}`,
      },
    ],
  };
}
```

**Step 2: Verify schema compiles**

Run: `npm run type-check:memory`
Expected: No errors related to `lib/content/schema.ts`

**Step 3: Commit**

```bash
git add lib/content/schema.ts
git commit -m "feat(content): add JSON-LD schema generators"
```

---

## Task 3: Create ContentPageLayout Component

**Files:**
- Create: `components/content/ContentPageLayout.tsx`

**Step 1: Create layout component**

```tsx
// components/content/ContentPageLayout.tsx
import Link from 'next/link';
import { PiArrowLeftBold } from 'react-icons/pi';
import { ReactNode } from 'react';

interface ContentPageLayoutProps {
  /** Page title displayed in header */
  title: string;
  /** Last updated date */
  lastUpdated?: string;
  /** Page content (sidebar + body) */
  children: ReactNode;
}

export function ContentPageLayout({
  title,
  lastUpdated,
  children,
}: ContentPageLayoutProps) {
  return (
    <>
      {/* Orange Header */}
      <section className="bg-gradient-to-br from-circleTel-orange via-circleTel-orange to-orange-500 text-white">
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            {/* Breadcrumb */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm mb-8"
            >
              <PiArrowLeftBold className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading">
              {title}
            </h1>

            {lastUpdated && (
              <p className="mt-4 text-white/70 text-sm">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>

          {/* Curved bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-[2rem]" />
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
```

**Step 2: Verify component compiles**

Run: `npm run type-check:memory`
Expected: No errors related to `ContentPageLayout.tsx`

**Step 3: Commit**

```bash
git add components/content/ContentPageLayout.tsx
git commit -m "feat(content): add ContentPageLayout component"
```

---

## Task 4: Create ContentSidebar Component

**Files:**
- Create: `components/content/ContentSidebar.tsx`

**Step 1: Create sidebar container**

```tsx
// components/content/ContentSidebar.tsx
import { ReactNode } from 'react';

interface ContentSidebarProps {
  children: ReactNode;
}

export function ContentSidebar({ children }: ContentSidebarProps) {
  return (
    <aside className="lg:w-80 flex-shrink-0">
      <div className="lg:sticky lg:top-24 space-y-6">{children}</div>
    </aside>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/ContentSidebar.tsx
git commit -m "feat(content): add ContentSidebar component"
```

---

## Task 5: Create SidebarIntro Component

**Files:**
- Create: `components/content/SidebarIntro.tsx`

**Step 1: Create intro card**

```tsx
// components/content/SidebarIntro.tsx
interface SidebarIntroProps {
  /** Optional heading */
  title?: string;
  /** Intro description text */
  description: string;
}

export function SidebarIntro({ title, description }: SidebarIntroProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {title && (
        <h3 className="font-semibold text-circleTel-navy mb-3">{title}</h3>
      )}
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/SidebarIntro.tsx
git commit -m "feat(content): add SidebarIntro component"
```

---

## Task 6: Create SidebarNav Component

**Files:**
- Create: `components/content/SidebarNav.tsx`

**Step 1: Create navigation component**

```tsx
// components/content/SidebarNav.tsx
import { PiListBold } from 'react-icons/pi';
import { SidebarNavSection } from '@/lib/content/types';

interface SidebarNavProps {
  sections: SidebarNavSection[];
}

export function SidebarNav({ sections }: SidebarNavProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
        Jump to section
      </h3>
      <nav className="space-y-1">
        {sections.map((section) => {
          const Icon = section.icon || PiListBold;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-circleTel-orange/5 hover:text-circleTel-orange transition-colors group"
            >
              <Icon className="w-4 h-4 text-gray-400 group-hover:text-circleTel-orange transition-colors" />
              <span className="text-sm font-medium">{section.title}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/SidebarNav.tsx
git commit -m "feat(content): add SidebarNav component"
```

---

## Task 7: Create SidebarKeyPoints Component

**Files:**
- Create: `components/content/SidebarKeyPoints.tsx`

**Step 1: Create key points card**

```tsx
// components/content/SidebarKeyPoints.tsx
import { KeyPoint } from '@/lib/content/types';

interface SidebarKeyPointsProps {
  points: KeyPoint[];
  /** Card heading - defaults to "Key points" */
  heading?: string;
}

export function SidebarKeyPoints({
  points,
  heading = 'Key points',
}: SidebarKeyPointsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-circleTel-navy mb-4 text-sm uppercase tracking-wide">
        {heading}
      </h3>
      <div className="space-y-4">
        {points.map((point, index) => {
          const Icon = point.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-circleTel-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-circleTel-navy text-sm">
                  {point.title}
                </p>
                {point.description && (
                  <p className="text-gray-500 text-xs">{point.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/SidebarKeyPoints.tsx
git commit -m "feat(content): add SidebarKeyPoints component"
```

---

## Task 8: Create SidebarContact Component

**Files:**
- Create: `components/content/SidebarContact.tsx`

**Step 1: Create contact CTA card**

```tsx
// components/content/SidebarContact.tsx
import { PiWhatsappLogoBold, PiEnvelopeBold } from 'react-icons/pi';
import { CONTACT } from '@/lib/constants/contact';

interface SidebarContactProps {
  /** Card heading - defaults to "Need help?" */
  heading?: string;
}

export function SidebarContact({ heading = 'Need help?' }: SidebarContactProps) {
  return (
    <div className="bg-circleTel-navy rounded-2xl p-6 text-white">
      <h3 className="font-semibold mb-2">{heading}</h3>
      <p className="text-white/70 text-sm mb-4">
        Our support team is available {CONTACT.SUPPORT_HOURS}.
      </p>
      <div className="space-y-2">
        <a
          href={CONTACT.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors"
        >
          <PiWhatsappLogoBold className="w-4 h-4" />
          <span>{CONTACT.WHATSAPP_NUMBER}</span>
        </a>
        <a
          href={`mailto:${CONTACT.EMAIL_PRIMARY}`}
          className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
        >
          <PiEnvelopeBold className="w-4 h-4" />
          <span>{CONTACT.EMAIL_PRIMARY}</span>
        </a>
      </div>
    </div>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/SidebarContact.tsx
git commit -m "feat(content): add SidebarContact component"
```

---

## Task 9: Create ContentBody Component

**Files:**
- Create: `components/content/ContentBody.tsx`

**Step 1: Create body container**

```tsx
// components/content/ContentBody.tsx
import { ReactNode } from 'react';

interface ContentBodyProps {
  children: ReactNode;
}

export function ContentBody({ children }: ContentBodyProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className="space-y-8">{children}</div>
    </div>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/ContentBody.tsx
git commit -m "feat(content): add ContentBody component"
```

---

## Task 10: Create ContentSection Component

**Files:**
- Create: `components/content/ContentSection.tsx`

**Step 1: Create section component**

```tsx
// components/content/ContentSection.tsx
import { ReactNode } from 'react';
import { IconType } from 'react-icons';
import { PiFileTextBold } from 'react-icons/pi';

interface ContentSectionProps {
  /** Section ID for anchor links */
  id: string;
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: IconType;
  /** Section content */
  children: ReactNode;
}

export function ContentSection({
  id,
  title,
  icon,
  children,
}: ContentSectionProps) {
  const Icon = icon || PiFileTextBold;

  return (
    <section id={id} className="scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        <Icon className="w-5 h-5 text-circleTel-orange" />
        <h2 className="text-lg font-bold text-circleTel-navy font-heading">
          {title}
        </h2>
      </div>

      {/* Section Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="prose prose-gray max-w-none prose-headings:text-circleTel-navy prose-headings:font-semibold prose-h3:text-base prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-circleTel-navy">
          {children}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/ContentSection.tsx
git commit -m "feat(content): add ContentSection component"
```

---

## Task 11: Create Barrel Export

**Files:**
- Create: `components/content/index.ts`

**Step 1: Create barrel export**

```typescript
// components/content/index.ts
export { ContentPageLayout } from './ContentPageLayout';
export { ContentSidebar } from './ContentSidebar';
export { ContentBody } from './ContentBody';
export { ContentSection } from './ContentSection';
export { SidebarIntro } from './SidebarIntro';
export { SidebarNav } from './SidebarNav';
export { SidebarKeyPoints } from './SidebarKeyPoints';
export { SidebarContact } from './SidebarContact';
```

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add components/content/index.ts
git commit -m "feat(content): add barrel export for content components"
```

---

## Task 12: Create Terms of Service Content Data

**Files:**
- Create: `app/terms-of-service/content-data.tsx`

**Reference:** Read existing content from `app/terms-of-service/page.tsx` to extract sections.

**Step 1: Create content data file with all 16 sections**

Extract content from existing page, structure as ContentPageData with proper icons for each section.

**Step 2: Verify and commit**

Run: `npm run type-check:memory`

```bash
git add app/terms-of-service/content-data.tsx
git commit -m "feat(terms): add structured content data"
```

---

## Task 13: Replace Terms of Service Page

**Files:**
- Modify: `app/terms-of-service/page.tsx` (complete replacement)

**Step 1: Replace page with new template**

Import content data and template components. Assemble page with:
- JSON-LD scripts (WebPage + Breadcrumb schemas)
- ContentPageLayout with title and lastUpdated
- ContentSidebar with Intro, Nav, KeyPoints, Contact
- ContentBody with mapped ContentSection components

**Step 2: Verify build and visually test**

Run: `npm run type-check:memory`
Run: `npm run dev:memory`
Visit: `http://localhost:3000/terms-of-service`
Expected: Two-column layout with orange header, sticky sidebar, content sections

**Step 3: Commit**

```bash
git add app/terms-of-service/page.tsx
git commit -m "refactor(terms): migrate to content page template"
```

---

## Task 14: Create Privacy Policy Content Data

**Files:**
- Create: `app/privacy-policy/content-data.tsx`

**Reference:** Read existing content from `app/privacy-policy/page.tsx` to extract all 11 sections.

**Step 1: Create content data file**

Structure as ContentPageData with:
- meta (title, description, canonicalPath, lastUpdated)
- intro (description about privacy commitment)
- keyPoints (POPIA compliant, Data encrypted, Your rights)
- sections (all 11 sections with icons)

**Step 2: Verify and commit**

```bash
git add app/privacy-policy/content-data.tsx
git commit -m "feat(privacy): add structured content data"
```

---

## Task 15: Replace Privacy Policy Page

**Files:**
- Modify: `app/privacy-policy/page.tsx` (complete replacement)

**Step 1: Replace with template pattern**

Follow same pattern as Task 13, importing from content-data.tsx.

**Step 2: Verify build and visually test**

Run: `npm run type-check:memory`
Visit: `http://localhost:3000/privacy-policy`

**Step 3: Commit**

```bash
git add app/privacy-policy/page.tsx
git commit -m "refactor(privacy): migrate to content page template"
```

---

## Task 16: Delete /terms Folder

**Files:**
- Delete: `app/terms/` (entire folder)

**Step 1: Verify /terms is redundant**

Check that `/terms-of-service` covers all content from `/terms`.

**Step 2: Delete folder**

```bash
rm -rf app/terms
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove redundant /terms page (consolidated into /terms-of-service)"
```

---

## Task 17: Final Verification

**Step 1: Run full type check**

```bash
npm run type-check:memory
```

Expected: 0 errors

**Step 2: Run build**

```bash
npm run build:memory
```

Expected: Build succeeds

**Step 3: Visual verification checklist**

- [ ] `/terms-of-service` — Two-column layout renders correctly
- [ ] `/terms-of-service` — Sidebar navigation links work (smooth scroll)
- [ ] `/terms-of-service` — Key points display correctly
- [ ] `/terms-of-service` — Contact CTA shows correct WhatsApp/Email
- [ ] `/privacy-policy` — Same checks as above
- [ ] Mobile view — Sidebar stacks above content
- [ ] JSON-LD — Check page source for schema scripts

**Step 4: Commit verification**

```bash
git log --oneline -10
```

Verify all commits are present.

---

## Summary

| Task | Files | Type |
|------|-------|------|
| 1 | `lib/content/types.ts` | Create |
| 2 | `lib/content/schema.ts` | Create |
| 3-10 | `components/content/*.tsx` | Create (8 files) |
| 11 | `components/content/index.ts` | Create |
| 12 | `app/terms-of-service/content-data.tsx` | Create |
| 13 | `app/terms-of-service/page.tsx` | Replace |
| 14 | `app/privacy-policy/content-data.tsx` | Create |
| 15 | `app/privacy-policy/page.tsx` | Replace |
| 16 | `app/terms/` | Delete |
| 17 | — | Verification |

**Total: 17 tasks, ~13 new files, 2 replaced, 1 deleted**
