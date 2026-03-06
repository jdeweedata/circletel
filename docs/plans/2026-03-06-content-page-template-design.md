# Content Page Template Design

**Date:** 2026-03-06
**Status:** Approved
**Scope:** Reusable template for legal/content pages based on FAQ design

## Problem Statement

Current legal pages (`/terms-of-service`, `/privacy-policy`) use an outdated single-column design with manual Navbar/Footer wrappers. The newer FAQ page has a modern two-column layout with sticky sidebar navigation that improves readability and user experience.

We need a reusable template system that applies the FAQ design pattern to all content pages.

## Design Decision

**Approach: Composable Blocks**

Create modular components that can be assembled to build any content page, with data-driven content that separates presentation from content.

## Component Architecture

```
components/content/
├── ContentPageLayout.tsx      # Main wrapper (orange header + two-column body)
├── ContentSidebar.tsx         # Sticky sidebar container
├── SidebarIntro.tsx           # Intro text block
├── SidebarNav.tsx             # Auto-generated from sections
├── SidebarKeyPoints.tsx       # Optional highlights
├── SidebarContact.tsx         # WhatsApp + Email CTA
├── ContentBody.tsx            # Right column container
├── ContentSection.tsx         # Section with anchor + heading + content
└── index.ts                   # Barrel export

lib/content/
├── types.ts                   # ContentPage, Section, KeyPoint types
└── schema.ts                  # JSON-LD generators (WebPage, Article, Breadcrumb)
```

## Component Specifications

### ContentPageLayout
- Orange gradient header with title
- Curved bottom edge (matching FAQ)
- Gray background body
- Two-column flex layout (sidebar + content)
- Props: `title`, `lastUpdated`, `children`

### ContentSidebar
- Sticky positioning (`lg:sticky lg:top-24`)
- Width: `lg:w-80`
- Accepts children (sidebar blocks)

### SidebarIntro
- White card with rounded corners
- Optional title, required description
- Props: `title?`, `description`

### SidebarNav
- White card with section links
- Auto-generates from sections array
- Icons for each section (optional)
- Smooth scroll to anchors
- Props: `sections`

### SidebarKeyPoints
- White card with icon + text pairs
- Like FAQ's "Quick Facts" but renamed for legal pages
- Props: `points: KeyPoint[]`

### SidebarContact
- Navy background card
- Uses CONTACT constants (WhatsApp + Email)
- Support hours display

### ContentBody
- Flex-grow container
- Right column wrapper
- Space-y for section spacing

### ContentSection
- Scroll margin for sticky header
- Section heading with optional icon
- Bottom border separator
- Props: `id`, `title`, `icon?`, `children`

## Data Structure

```typescript
interface ContentPageData {
  meta: {
    title: string;
    pageTitle: string;
    description: string;
    lastUpdated: string;
    canonicalPath: string;
  };
  intro: {
    title?: string;
    description: string;
  };
  keyPoints?: KeyPoint[];
  sections: ContentSection[];
}

interface ContentSection {
  id: string;
  title: string;
  icon?: IconType;
  content: React.ReactNode;
}

interface KeyPoint {
  icon: IconType;
  title: string;
  description?: string;
}
```

## JSON-LD Schemas

Each content page includes:
- **WebPage schema** - page metadata
- **BreadcrumbList schema** - Home > Page Name

## Page Implementation Pattern

Each page consists of:
1. `content-data.tsx` - structured content data
2. `page.tsx` - thin wrapper (~40 lines) that assembles components

```typescript
// app/terms-of-service/page.tsx
export default function TermsOfServicePage() {
  const { meta, intro, keyPoints, sections } = termsData;

  return (
    <>
      {/* JSON-LD */}
      <ContentPageLayout title={meta.title} lastUpdated={meta.lastUpdated}>
        <ContentSidebar>
          <SidebarIntro description={intro.description} />
          <SidebarNav sections={sections} />
          {keyPoints && <SidebarKeyPoints points={keyPoints} />}
          <SidebarContact />
        </ContentSidebar>
        <ContentBody>
          {sections.map((section) => (
            <ContentSection key={section.id} {...section}>
              {section.content}
            </ContentSection>
          ))}
        </ContentBody>
      </ContentPageLayout>
    </>
  );
}
```

## Migration Plan

### Pages to Refactor
| Page | Action |
|------|--------|
| `/terms-of-service` | Refactor to new template |
| `/privacy-policy` | Refactor to new template |

### Pages to Delete
| Page | Reason |
|------|--------|
| `/terms` | Consolidate into `/terms-of-service` |

### Migration Order
1. Build template components
2. Create `terms-of-service/content-data.tsx`
3. Replace `terms-of-service/page.tsx`
4. Repeat for `privacy-policy`
5. Delete `/terms` folder

## Files Summary

### New Files (12)
- `components/content/ContentPageLayout.tsx`
- `components/content/ContentSidebar.tsx`
- `components/content/SidebarIntro.tsx`
- `components/content/SidebarNav.tsx`
- `components/content/SidebarKeyPoints.tsx`
- `components/content/SidebarContact.tsx`
- `components/content/ContentBody.tsx`
- `components/content/ContentSection.tsx`
- `components/content/index.ts`
- `lib/content/types.ts`
- `lib/content/schema.ts`
- `app/terms-of-service/content-data.tsx`
- `app/privacy-policy/content-data.tsx`

### Modified Files (2)
- `app/terms-of-service/page.tsx` (replace)
- `app/privacy-policy/page.tsx` (replace)

### Deleted Files (1)
- `app/terms/` (entire folder)

## Success Criteria

1. Both legal pages render with FAQ-style two-column layout
2. Sidebar navigation auto-generates from content sections
3. JSON-LD schemas present on all pages
4. No `'use client'` directive needed (Server Components)
5. Content separated from presentation (data files)
6. CONTACT constants used for all contact details
