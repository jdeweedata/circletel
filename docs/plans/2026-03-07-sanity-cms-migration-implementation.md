# Sanity CMS Migration - Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace custom CMS with embedded Sanity Studio, add 5 document types, 6 blocks, and webhook-driven ISR.

**Architecture:** Sanity Studio embedded at `/studio` via Next.js route group. Schemas in `lib/sanity/schemas/`. Tag-based revalidation via webhook. Typed block renderer dispatches to 13 components.

**Tech Stack:** Next.js 15, Sanity v3, TypeScript, `next-sanity`, `@portabletext/react`, Tailwind CSS

---

## Task Overview

| Group | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Infrastructure | 1-6 | 45 min |
| 2. Document Schemas | 7-11 | 60 min |
| 3. Block Schemas | 12-17 | 45 min |
| 4. Rendering Primitives | 18-20 | 30 min |
| 5. Block Renderers | 21-27 | 90 min |
| 6. Webhook & Revalidation | 28-30 | 30 min |
| 7. Page Integration | 31-33 | 45 min |

---

## Group 1: Infrastructure Setup

### Task 1: Create Root sanity.config.ts

**Files:**
- Create: `sanity.config.ts`

**Step 1: Create sanity.config.ts at project root**

```typescript
// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './lib/sanity/schemas'
import { structure } from './lib/sanity/structure'

export default defineConfig({
  name: 'circletel',
  title: 'CircleTel CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  basePath: '/studio',

  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      // Singletons: no delete/duplicate
      if (['siteSettings', 'homepage'].includes(context.schemaType)) {
        return prev.filter(({ action }) =>
          !['delete', 'duplicate'].includes(action!)
        )
      }
      return prev
    },
    // Hide singletons from "new document" menu
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter(
          (item) => !['siteSettings', 'homepage'].includes(item.templateId)
        )
      }
      return prev
    },
  },
})
```

**Step 2: Commit**

```bash
git add sanity.config.ts
git commit -m "feat(sanity): add root sanity.config.ts with basePath /studio"
```

---

### Task 2: Create Studio Structure Definition

**Files:**
- Create: `lib/sanity/structure.ts`

**Step 1: Create structure.ts**

```typescript
// lib/sanity/structure.ts
import { StructureBuilder } from 'sanity/structure'

// Singleton document IDs
const singletonTypes = ['siteSettings', 'homepage']

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Singletons first
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.listItem()
        .title('Homepage')
        .id('homepage')
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
        ),
      S.divider(),

      // Pages
      S.documentTypeListItem('page').title('Pages'),
      S.documentTypeListItem('productPage').title('Product Pages'),
      S.divider(),

      // Blog
      S.documentTypeListItem('post').title('Blog Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.divider(),

      // Marketing
      S.documentTypeListItem('campaign').title('Campaigns'),
      S.documentTypeListItem('resource').title('Resources'),
      S.divider(),

      // People
      S.documentTypeListItem('teamMember').title('Team'),
      S.documentTypeListItem('testimonial').title('Testimonials'),
    ])
```

**Step 2: Commit**

```bash
git add lib/sanity/structure.ts
git commit -m "feat(sanity): add Studio structure definition"
```

---

### Task 3: Move Existing Schemas to lib/sanity/schemas

**Files:**
- Create: `lib/sanity/schemas/index.ts`
- Create: `lib/sanity/schemas/documents/` (directory)
- Create: `lib/sanity/schemas/blocks/` (directory)
- Create: `lib/sanity/schemas/objects/` (directory)

**Step 1: Create schema directory structure**

```bash
mkdir -p lib/sanity/schemas/documents lib/sanity/schemas/blocks lib/sanity/schemas/objects
```

**Step 2: Copy existing schemas from sanity-studio**

```bash
# Copy documents
cp sanity-studio/schemas/homepage.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/page.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/productPage.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/servicePage.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/resourcePage.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/testimonial.ts lib/sanity/schemas/documents/
cp sanity-studio/schemas/siteSettings.ts lib/sanity/schemas/documents/

# Copy blocks
cp sanity-studio/schemas/blocks/*.ts lib/sanity/schemas/blocks/

# Copy objects
cp sanity-studio/schemas/objects/*.ts lib/sanity/schemas/objects/
```

**Step 3: Create lib/sanity/schemas/index.ts**

```typescript
// lib/sanity/schemas/index.ts

// Document types
import homepage from './documents/homepage'
import page from './documents/page'
import productPage from './documents/productPage'
import servicePage from './documents/servicePage'
import resourcePage from './documents/resourcePage'
import testimonial from './documents/testimonial'
import siteSettings from './documents/siteSettings'

// New document types (will be added in later tasks)
// import post from './documents/post'
// import teamMember from './documents/teamMember'
// import campaign from './documents/campaign'
// import resource from './documents/resource'
// import category from './documents/category'

// Block types
import heroBlock from './blocks/heroBlock'
import featureGridBlock from './blocks/featureGridBlock'
import pricingBlock from './blocks/pricingBlock'
import faqBlock from './blocks/faqBlock'
import comparisonBlock from './blocks/comparisonBlock'
import testimonialBlock from './blocks/testimonialBlock'
import productShowcaseBlock from './blocks/productShowcaseBlock'

// New block types (will be added in later tasks)
// import textBlock from './blocks/textBlock'
// import imageBlock from './blocks/imageBlock'
// import ctaBlock from './blocks/ctaBlock'
// import formBlock from './blocks/formBlock'
// import separatorBlock from './blocks/separatorBlock'
// import galleryBlock from './blocks/galleryBlock'

// Object types
import seo from './objects/seo'
import cta from './objects/cta'
import portableText from './objects/portableText'

export const schemaTypes = [
  // Documents
  homepage,
  page,
  productPage,
  servicePage,
  resourcePage,
  testimonial,
  siteSettings,

  // Blocks
  heroBlock,
  featureGridBlock,
  pricingBlock,
  faqBlock,
  comparisonBlock,
  testimonialBlock,
  productShowcaseBlock,

  // Objects
  seo,
  cta,
  portableText,
]
```

**Step 4: Commit**

```bash
git add lib/sanity/schemas/
git commit -m "feat(sanity): move schemas to lib/sanity/schemas/"
```

---

### Task 4: Create Embedded Studio Route

**Files:**
- Create: `app/(studio)/studio/[[...index]]/page.tsx`

**Step 1: Create directory structure**

```bash
mkdir -p "app/(studio)/studio/[[...index]]"
```

**Step 2: Create Studio page component**

```typescript
// app/(studio)/studio/[[...index]]/page.tsx
'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
```

**Step 3: Create Studio layout for isolation**

```typescript
// app/(studio)/layout.tsx
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

**Step 4: Verify Studio loads**

Run: `npm run dev:memory`
Navigate to: `http://localhost:3000/studio`
Expected: Sanity Studio loads without layout conflicts

**Step 5: Commit**

```bash
git add "app/(studio)/"
git commit -m "feat(sanity): add embedded Studio route at /studio"
```

---

### Task 5: Update lib/sanity/client.ts

**Files:**
- Modify: `lib/sanity/client.ts`

**Step 1: Read existing client.ts**

```bash
cat lib/sanity/client.ts
```

**Step 2: Update client with stega support prep**

```typescript
// lib/sanity/client.ts
import { createClient } from 'next-sanity'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'

// Base client for production queries
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// Server client with write token (for mutations, not used in Phase 1)
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

// Preview client (Phase 2 - stega enabled)
export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: 'previewDrafts',
  stega: {
    enabled: true,
    studioUrl: '/studio',
  },
})

// Export config for reuse
export const sanityConfig = {
  projectId,
  dataset,
  apiVersion,
}
```

**Step 3: Commit**

```bash
git add lib/sanity/client.ts
git commit -m "feat(sanity): update client.ts with stega prep for Phase 2"
```

---

### Task 6: Create lib/sanity/fetch.ts (Draft-Aware Helper)

**Files:**
- Create: `lib/sanity/fetch.ts`

**Step 1: Create fetch helper**

```typescript
// lib/sanity/fetch.ts
import { client, previewClient } from './client'
import { draftMode } from 'next/headers'

type FetchOptions = {
  query: string
  params?: Record<string, unknown>
  tags?: string[]
  revalidate?: number | false
}

/**
 * Draft-aware fetch helper.
 * Uses preview client in draft mode, production client otherwise.
 * Automatically applies cache tags for ISR.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate,
}: FetchOptions): Promise<T> {
  const isDraft = (await draftMode()).isEnabled

  // In draft mode, use preview client (no caching)
  if (isDraft) {
    return previewClient.fetch<T>(query, params)
  }

  // Production: use CDN with cache tags
  return client.fetch<T>(query, params, {
    next: {
      tags,
      revalidate: revalidate ?? false,
    },
  })
}
```

**Step 2: Commit**

```bash
git add lib/sanity/fetch.ts
git commit -m "feat(sanity): add draft-aware sanityFetch helper"
```

---

## Group 2: Document Schemas

### Task 7: Create category Schema

**Files:**
- Create: `lib/sanity/schemas/documents/category.ts`

**Step 1: Create category schema**

```typescript
// lib/sanity/schemas/documents/category.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import category from './documents/category'`
- Add to schemaTypes array: `category,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/documents/category.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add category document schema"
```

---

### Task 8: Create post Schema

**Files:**
- Create: `lib/sanity/schemas/documents/post.ts`

**Step 1: Create post schema**

```typescript
// lib/sanity/schemas/documents/post.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Brief summary for listings and SEO',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'teamMember' }],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Afrikaans', value: 'af' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'featuredImage',
    },
    prepare({ title, author, media }) {
      return {
        title,
        subtitle: author ? `by ${author}` : '',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import post from './documents/post'`
- Add to schemaTypes array: `post,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/documents/post.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add post document schema with categories and author"
```

---

### Task 9: Create teamMember Schema

**Files:**
- Create: `lib/sanity/schemas/documents/teamMember.ts`

**Step 1: Create teamMember schema**

```typescript
// lib/sanity/schemas/documents/teamMember.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Job Title',
      type: 'string',
    }),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'string',
      options: {
        list: [
          { title: 'Leadership', value: 'leadership' },
          { title: 'Sales', value: 'sales' },
          { title: 'Support', value: 'support' },
          { title: 'Technical', value: 'technical' },
          { title: 'Marketing', value: 'marketing' },
          { title: 'Operations', value: 'operations' },
        ],
      },
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import teamMember from './documents/teamMember'`
- Add to schemaTypes array: `teamMember,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/documents/teamMember.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add teamMember document schema"
```

---

### Task 10: Create campaign Schema

**Files:**
- Create: `lib/sanity/schemas/documents/campaign.ts`

**Step 1: Create campaign schema**

```typescript
// lib/sanity/schemas/documents/campaign.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'isEnabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Manual override to enable/disable campaign',
      initialValue: true,
    }),
    defineField({
      name: 'campaignType',
      title: 'Campaign Type',
      type: 'string',
      options: {
        list: [
          { title: 'Banner', value: 'banner' },
          { title: 'Popup', value: 'popup' },
          { title: 'Inline', value: 'inline' },
          { title: 'Landing Page', value: 'landing-page' },
        ],
      },
      initialValue: 'banner',
    }),
    // Scheduling
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'Leave empty for ongoing campaigns',
    }),
    // Targeting
    defineField({
      name: 'targetPages',
      title: 'Target Pages',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'URL patterns: /, /packages/*, /business/*',
    }),
    defineField({
      name: 'targetAudience',
      title: 'Target Audience',
      type: 'string',
      options: {
        list: [
          { title: 'All', value: 'all' },
          { title: 'Consumer', value: 'consumer' },
          { title: 'Business', value: 'business' },
          { title: 'Partner', value: 'partner' },
        ],
      },
      initialValue: 'all',
    }),
    // Display settings
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Higher priority campaigns display first (1-10)',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(10),
    }),
    defineField({
      name: 'isDismissible',
      title: 'Dismissible',
      type: 'boolean',
      description: 'Allow users to close this campaign',
      initialValue: true,
    }),
    defineField({
      name: 'placement',
      title: 'Placement',
      type: 'string',
      options: {
        list: [
          { title: 'Top', value: 'top' },
          { title: 'Bottom', value: 'bottom' },
          { title: 'Center', value: 'center' },
          { title: 'Sidebar', value: 'sidebar' },
        ],
      },
      initialValue: 'top',
    }),
    // Content
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    }),
    defineField({
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color code, e.g. #FF6B00',
    }),
    // Tracking
    defineField({
      name: 'utmCampaign',
      title: 'UTM Campaign',
      type: 'string',
      description: 'UTM campaign parameter for tracking',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      startDate: 'startDate',
      endDate: 'endDate',
      isEnabled: 'isEnabled',
    },
    prepare({ title, startDate, endDate, isEnabled }) {
      const start = startDate ? new Date(startDate).toLocaleDateString() : 'No start'
      const end = endDate ? new Date(endDate).toLocaleDateString() : 'Ongoing'
      const status = isEnabled ? '' : ' [DISABLED]'
      return {
        title: `${title}${status}`,
        subtitle: `${start} → ${end}`,
      }
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import campaign from './documents/campaign'`
- Add to schemaTypes array: `campaign,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/documents/campaign.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add campaign document schema with scheduling and targeting"
```

---

### Task 11: Create resource Schema

**Files:**
- Create: `lib/sanity/schemas/documents/resource.ts`

**Step 1: Create resource schema**

```typescript
// lib/sanity/schemas/documents/resource.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isEnabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Manual override to show/hide resource',
      initialValue: true,
    }),
    defineField({
      name: 'resourceType',
      title: 'Resource Type',
      type: 'string',
      options: {
        list: [
          { title: 'Whitepaper', value: 'whitepaper' },
          { title: 'Case Study', value: 'case-study' },
          { title: 'Guide', value: 'guide' },
          { title: 'Datasheet', value: 'datasheet' },
          { title: 'Video', value: 'video' },
          { title: 'Webinar', value: 'webinar' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        },
      ],
    }),
    // Access control (app-layer enforcement)
    defineField({
      name: 'accessLevel',
      title: 'Access Level',
      type: 'string',
      options: {
        list: [
          { title: 'Public', value: 'public' },
          { title: 'Gated (email required)', value: 'gated' },
          { title: 'Partner Only', value: 'partner-only' },
        ],
      },
      initialValue: 'public',
      description: 'Note: Enforcement is in app layer, not CMS',
    }),
    defineField({
      name: 'gatingFormId',
      title: 'Gating Form ID',
      type: 'string',
      description: 'Form ID for gated content',
      hidden: ({ parent }) => parent?.accessLevel !== 'gated',
    }),
    // Content
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      options: {
        accept: '.pdf,.docx,.xlsx,.zip',
      },
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'For videos/webinars hosted externally',
    }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'portableText',
      description: 'For HTML-based resources',
    }),
    // Categorization
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'products',
      title: 'Related Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'productPage' }] }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'Afrikaans', value: 'af' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      resourceType: 'resourceType',
      media: 'thumbnail',
      isEnabled: 'isEnabled',
    },
    prepare({ title, resourceType, media, isEnabled }) {
      const status = isEnabled ? '' : ' [HIDDEN]'
      return {
        title: `${title}${status}`,
        subtitle: resourceType,
        media,
      }
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import resource from './documents/resource'`
- Add to schemaTypes array: `resource,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/documents/resource.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add resource document schema with access control"
```

---

## Group 3: Block Schemas

### Task 12: Create blockFields Object (Cross-Cutting Fields)

**Files:**
- Create: `lib/sanity/schemas/objects/blockFields.ts`

**Step 1: Create shared block fields**

```typescript
// lib/sanity/schemas/objects/blockFields.ts
import { defineField } from 'sanity'

/**
 * Cross-cutting fields shared by all page builder blocks.
 * Import and spread into each block's fields array.
 */
export const blockFields = [
  defineField({
    name: 'anchorId',
    title: 'Anchor ID',
    type: 'string',
    description: 'For in-page navigation links (e.g., "pricing")',
  }),
  defineField({
    name: 'theme',
    title: 'Theme',
    type: 'string',
    options: {
      list: [
        { title: 'Default', value: 'default' },
        { title: 'Light', value: 'light' },
        { title: 'Dark', value: 'dark' },
        { title: 'Brand', value: 'brand' },
      ],
    },
    initialValue: 'default',
  }),
  defineField({
    name: 'paddingTop',
    title: 'Padding Top',
    type: 'string',
    options: {
      list: [
        { title: 'None', value: 'none' },
        { title: 'Small', value: 'sm' },
        { title: 'Medium', value: 'md' },
        { title: 'Large', value: 'lg' },
        { title: 'Extra Large', value: 'xl' },
      ],
    },
    initialValue: 'md',
  }),
  defineField({
    name: 'paddingBottom',
    title: 'Padding Bottom',
    type: 'string',
    options: {
      list: [
        { title: 'None', value: 'none' },
        { title: 'Small', value: 'sm' },
        { title: 'Medium', value: 'md' },
        { title: 'Large', value: 'lg' },
        { title: 'Extra Large', value: 'xl' },
      ],
    },
    initialValue: 'md',
  }),
  defineField({
    name: 'hideOn',
    title: 'Hide On',
    type: 'string',
    options: {
      list: [
        { title: 'Never hide', value: 'none' },
        { title: 'Mobile', value: 'mobile' },
        { title: 'Desktop', value: 'desktop' },
      ],
    },
    initialValue: 'none',
  }),
]
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import { blockFields } from './objects/blockFields'`
- Export for reuse: `export { blockFields }`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/objects/blockFields.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add cross-cutting blockFields for all blocks"
```

---

### Task 13: Create textBlock Schema

**Files:**
- Create: `lib/sanity/schemas/blocks/textBlock.ts`

**Step 1: Create textBlock schema**

```typescript
// lib/sanity/schemas/blocks/textBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'textBlock',
  title: 'Text Block',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Small text above the title',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'portableText',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
      },
      initialValue: 'left',
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      options: {
        list: [
          { title: 'Narrow', value: 'narrow' },
          { title: 'Medium', value: 'medium' },
          { title: 'Wide', value: 'wide' },
          { title: 'Full', value: 'full' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      title: 'title',
      eyebrow: 'eyebrow',
    },
    prepare({ title, eyebrow }) {
      return {
        title: 'Text Block',
        subtitle: title || eyebrow || 'Rich text content',
      }
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import textBlock from './blocks/textBlock'`
- Add to schemaTypes array: `textBlock,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/blocks/textBlock.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add textBlock schema with cross-cutting fields"
```

---

### Task 14: Create imageBlock Schema

**Files:**
- Create: `lib/sanity/schemas/blocks/imageBlock.ts`
- Create: `lib/sanity/schemas/objects/link.ts`

**Step 1: Create reusable link object**

```typescript
// lib/sanity/schemas/objects/link.ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      options: {
        list: [
          { title: 'Internal', value: 'internal' },
          { title: 'External', value: 'external' },
        ],
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'internalLink',
      title: 'Internal Page',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'productPage' }, { type: 'post' }, { type: 'resource' }],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      hidden: ({ parent }) => parent?.linkType !== 'external',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in New Tab',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'utmSource',
      title: 'UTM Source',
      type: 'string',
      description: 'For tracking',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      linkType: 'linkType',
    },
    prepare({ label, linkType }) {
      return {
        title: label || 'Link',
        subtitle: linkType,
      }
    },
  },
})
```

**Step 2: Create imageBlock schema**

```typescript
// lib/sanity/schemas/blocks/imageBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'imageBlock',
  title: 'Image Block',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'link',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { title: 'Small', value: 'small' },
          { title: 'Medium', value: 'medium' },
          { title: 'Large', value: 'large' },
          { title: 'Full Width', value: 'full' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'rounded',
      title: 'Rounded Corners',
      type: 'boolean',
      initialValue: false,
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      media: 'image',
      caption: 'caption',
    },
    prepare({ media, caption }) {
      return {
        title: 'Image',
        subtitle: caption || 'No caption',
        media,
      }
    },
  },
})
```

**Step 3: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import link from './objects/link'`
- Add import: `import imageBlock from './blocks/imageBlock'`
- Add to schemaTypes array: `link,` and `imageBlock,`

**Step 4: Commit**

```bash
git add lib/sanity/schemas/objects/link.ts lib/sanity/schemas/blocks/imageBlock.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add imageBlock and reusable link object"
```

---

### Task 15: Create ctaBlock Schema

**Files:**
- Create: `lib/sanity/schemas/blocks/ctaBlock.ts`

**Step 1: Create ctaBlock schema**

```typescript
// lib/sanity/schemas/blocks/ctaBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'ctaBlock',
  title: 'Call to Action Block',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Banner', value: 'banner' },
          { title: 'Card', value: 'card' },
          { title: 'Inline', value: 'inline' },
          { title: 'Split', value: 'split' },
        ],
      },
      initialValue: 'banner',
    }),
    defineField({
      name: 'primaryButton',
      title: 'Primary Button',
      type: 'cta',
    }),
    defineField({
      name: 'secondaryButton',
      title: 'Secondary Button',
      type: 'cta',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color code, e.g. #FF6B00',
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      options: {
        list: [
          { title: 'Light (white)', value: 'light' },
          { title: 'Dark (black)', value: 'dark' },
        ],
      },
      initialValue: 'light',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      title: 'headline',
      variant: 'variant',
    },
    prepare({ title, variant }) {
      return {
        title: 'CTA Block',
        subtitle: `${variant}: ${title || 'No headline'}`,
      }
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import ctaBlock from './blocks/ctaBlock'`
- Add to schemaTypes array: `ctaBlock,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/blocks/ctaBlock.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add ctaBlock schema"
```

---

### Task 16: Create formBlock Schema

**Files:**
- Create: `lib/sanity/schemas/blocks/formBlock.ts`

**Step 1: Create formBlock schema**

```typescript
// lib/sanity/schemas/blocks/formBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'formBlock',
  title: 'Form Block',
  type: 'object',
  fields: [
    defineField({
      name: 'formProvider',
      title: 'Form Provider',
      type: 'string',
      options: {
        list: [
          { title: 'CircleTel Contact', value: 'circletel-contact' },
          { title: 'CircleTel Callback', value: 'circletel-callback' },
          { title: 'CircleTel Newsletter', value: 'circletel-newsletter' },
          { title: 'HubSpot', value: 'hubspot' },
          { title: 'Typeform', value: 'typeform' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'formId',
      title: 'Form ID',
      type: 'string',
      description: 'Provider-specific form identifier',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Card', value: 'card' },
          { title: 'Inline', value: 'inline' },
          { title: 'Split (image + form)', value: 'split' },
        ],
      },
      initialValue: 'card',
    }),
    defineField({
      name: 'submitText',
      title: 'Submit Button Text',
      type: 'string',
      initialValue: 'Submit',
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'text',
      rows: 2,
      initialValue: 'Thank you! We will be in touch soon.',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      description: 'For split variant',
      hidden: ({ parent }) => parent?.variant !== 'split',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      headline: 'headline',
      formProvider: 'formProvider',
    },
    prepare({ headline, formProvider }) {
      return {
        title: 'Form Block',
        subtitle: `${formProvider}: ${headline || 'No headline'}`,
      }
    },
  },
})
```

**Step 2: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add import: `import formBlock from './blocks/formBlock'`
- Add to schemaTypes array: `formBlock,`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/blocks/formBlock.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add formBlock schema with provider support"
```

---

### Task 17: Create separatorBlock and galleryBlock Schemas

**Files:**
- Create: `lib/sanity/schemas/blocks/separatorBlock.ts`
- Create: `lib/sanity/schemas/blocks/galleryBlock.ts`

**Step 1: Create separatorBlock schema**

```typescript
// lib/sanity/schemas/blocks/separatorBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'separatorBlock',
  title: 'Separator Block',
  type: 'object',
  fields: [
    defineField({
      name: 'mode',
      title: 'Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Divider (visible line)', value: 'divider' },
          { title: 'Spacer (invisible space)', value: 'spacer' },
        ],
      },
      initialValue: 'divider',
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Line', value: 'line' },
          { title: 'Gradient', value: 'gradient' },
          { title: 'Dashed', value: 'dashed' },
          { title: 'Dots', value: 'dots' },
        ],
      },
      initialValue: 'line',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      options: {
        list: [
          { title: 'Full', value: 'full' },
          { title: 'Three Quarters', value: 'three-quarters' },
          { title: 'Half', value: 'half' },
          { title: 'Quarter', value: 'quarter' },
        ],
      },
      initialValue: 'full',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    defineField({
      name: 'spacing',
      title: 'Spacing',
      type: 'string',
      options: {
        list: [
          { title: 'Small', value: 'sm' },
          { title: 'Medium', value: 'md' },
          { title: 'Large', value: 'lg' },
          { title: 'Extra Large', value: 'xl' },
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      description: 'Hex color for divider line',
      hidden: ({ parent }) => parent?.mode !== 'divider',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      mode: 'mode',
      style: 'style',
      spacing: 'spacing',
    },
    prepare({ mode, style, spacing }) {
      return {
        title: mode === 'divider' ? 'Divider' : 'Spacer',
        subtitle: mode === 'divider' ? `${style} • ${spacing}` : spacing,
      }
    },
  },
})
```

**Step 2: Create galleryBlock schema**

```typescript
// lib/sanity/schemas/blocks/galleryBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'galleryBlock',
  title: 'Gallery Block',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).max(12),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Grid', value: 'grid' },
          { title: 'Masonry', value: 'masonry' },
          { title: 'Carousel', value: 'carousel' },
        ],
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'lightbox',
      title: 'Enable Lightbox',
      type: 'boolean',
      description: 'Allow clicking images to view full size',
      initialValue: true,
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: {
        list: [2, 3, 4],
      },
      initialValue: 3,
      hidden: ({ parent }) => parent?.layout === 'carousel',
    }),
    defineField({
      name: 'gap',
      title: 'Gap',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Small', value: 'sm' },
          { title: 'Medium', value: 'md' },
          { title: 'Large', value: 'lg' },
        ],
      },
      initialValue: 'md',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      type: 'string',
      options: {
        list: [
          { title: 'Auto', value: 'auto' },
          { title: 'Square', value: 'square' },
          { title: '4:3', value: '4:3' },
          { title: '16:9', value: '16:9' },
        ],
      },
      initialValue: 'auto',
    }),
    ...blockFields,
  ],
  preview: {
    select: {
      images: 'images',
      layout: 'layout',
      heading: 'heading',
    },
    prepare({ images, layout, heading }) {
      return {
        title: heading || 'Gallery',
        subtitle: `${images?.length || 0} images • ${layout}`,
        media: images?.[0],
      }
    },
  },
})
```

**Step 3: Add to schema index**

Update `lib/sanity/schemas/index.ts`:
- Add imports: `import separatorBlock from './blocks/separatorBlock'` and `import galleryBlock from './blocks/galleryBlock'`
- Add to schemaTypes array: `separatorBlock,` and `galleryBlock,`

**Step 4: Commit**

```bash
git add lib/sanity/schemas/blocks/separatorBlock.ts lib/sanity/schemas/blocks/galleryBlock.ts lib/sanity/schemas/index.ts
git commit -m "feat(sanity): add separatorBlock and galleryBlock schemas"
```

---

## Group 4: Rendering Primitives

### Task 18: Create SanityImage Primitive

**Files:**
- Create: `components/sanity/primitives/SanityImage.tsx`

**Step 1: Create SanityImage component**

```typescript
// components/sanity/primitives/SanityImage.tsx
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'

interface SanityImageAsset {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    width: number
    height: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  alt?: string
}

interface SanityImageProps {
  image: SanityImageAsset
  alt?: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9'
}

export function SanityImage({
  image,
  alt,
  width = 1200,
  height,
  fill = false,
  sizes,
  className,
  priority = false,
  aspectRatio = 'auto',
}: SanityImageProps) {
  if (!image?.asset) {
    return null
  }

  const imageUrl = urlFor(image).width(width).auto('format').url()

  // Calculate height based on aspect ratio if not provided
  const calculatedHeight = height || (() => {
    switch (aspectRatio) {
      case 'square':
        return width
      case '4:3':
        return Math.round(width * 0.75)
      case '16:9':
        return Math.round(width * 0.5625)
      default:
        return Math.round(width * 0.5625)
    }
  })()

  // Extract hotspot for object-position
  const hotspot = image.hotspot
  const objectPosition = hotspot
    ? `${hotspot.x * 100}% ${hotspot.y * 100}%`
    : 'center'

  const altText = image.alt || alt || ''

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={altText}
        fill
        sizes={sizes || '100vw'}
        className={className}
        style={{ objectPosition }}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src={imageUrl}
      alt={altText}
      width={width}
      height={calculatedHeight}
      className={className}
      style={{ objectPosition }}
      priority={priority}
    />
  )
}
```

**Step 2: Commit**

```bash
mkdir -p components/sanity/primitives
git add components/sanity/primitives/SanityImage.tsx
git commit -m "feat(sanity): add SanityImage primitive with hotspot support"
```

---

### Task 19: Create SanityLink Primitive

**Files:**
- Create: `components/sanity/primitives/SanityLink.tsx`

**Step 1: Create SanityLink component**

```typescript
// components/sanity/primitives/SanityLink.tsx
import Link from 'next/link'
import { ReactNode } from 'react'

interface SanityLinkData {
  linkType: 'internal' | 'external'
  internalLink?: {
    _type: string
    slug?: { current: string }
  }
  externalUrl?: string
  label?: string
  openInNewTab?: boolean
  utmSource?: string
}

interface SanityLinkProps {
  link: SanityLinkData
  children?: ReactNode
  className?: string
}

// Map document types to URL paths
const typeToPath: Record<string, string> = {
  page: '',
  productPage: '/products',
  post: '/blog',
  resource: '/resources',
}

function resolveInternalUrl(link: SanityLinkData): string {
  if (!link.internalLink?.slug?.current) {
    return '/'
  }

  const basePath = typeToPath[link.internalLink._type] || ''
  return `${basePath}/${link.internalLink.slug.current}`
}

function appendUtm(url: string, utmSource?: string): string {
  if (!utmSource) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}utm_source=${encodeURIComponent(utmSource)}`
}

export function SanityLink({ link, children, className }: SanityLinkProps) {
  if (!link) return null

  const isExternal = link.linkType === 'external'
  const label = children || link.label || ''

  if (isExternal && link.externalUrl) {
    const href = appendUtm(link.externalUrl, link.utmSource)
    return (
      <a
        href={href}
        className={className}
        target={link.openInNewTab ? '_blank' : undefined}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
      >
        {label}
      </a>
    )
  }

  const href = appendUtm(resolveInternalUrl(link), link.utmSource)
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}
```

**Step 2: Commit**

```bash
git add components/sanity/primitives/SanityLink.tsx
git commit -m "feat(sanity): add SanityLink primitive with internal/external support"
```

---

### Task 20: Create PortableText Primitive

**Files:**
- Create: `components/sanity/primitives/PortableText.tsx`

**Step 1: Install @portabletext/react if needed**

```bash
npm install @portabletext/react --save
```

**Step 2: Create PortableText component**

```typescript
// components/sanity/primitives/PortableText.tsx
import {
  PortableText as BasePortableText,
  PortableTextComponents,
} from '@portabletext/react'
import { SanityImage } from './SanityImage'
import { SanityLink } from './SanityLink'

interface PortableTextProps {
  value: unknown[]
  className?: string
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <figure className="my-6">
        <SanityImage
          image={value}
          className="rounded-lg"
          width={800}
        />
        {value.caption && (
          <figcaption className="mt-2 text-sm text-gray-500 text-center">
            {value.caption}
          </figcaption>
        )}
      </figure>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const isExternal = value?.href?.startsWith('http')
      return (
        <a
          href={value?.href}
          className="text-circleTel-orange hover:underline"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },
    internalLink: ({ children, value }) => (
      <SanityLink link={value} className="text-circleTel-orange hover:underline">
        {children}
      </SanityLink>
    ),
  },
  block: {
    h2: ({ children }) => (
      <h2 className="text-2xl font-heading font-bold mt-8 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-heading font-semibold mt-6 mb-3">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-heading font-medium mt-4 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-circleTel-orange pl-4 my-6 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
  },
}

export function PortableText({ value, className }: PortableTextProps) {
  if (!value) return null

  return (
    <div className={className}>
      <BasePortableText value={value} components={components} />
    </div>
  )
}
```

**Step 3: Create index export**

```typescript
// components/sanity/primitives/index.ts
export { SanityImage } from './SanityImage'
export { SanityLink } from './SanityLink'
export { PortableText } from './PortableText'
```

**Step 4: Commit**

```bash
git add components/sanity/primitives/PortableText.tsx components/sanity/primitives/index.ts package.json package-lock.json
git commit -m "feat(sanity): add PortableText primitive with custom components"
```

---

## Group 5: Block Renderers

### Task 21: Create BlockRenderer Dispatcher

**Files:**
- Create: `components/sanity/BlockRenderer.tsx`
- Create: `lib/sanity/types.ts`

**Step 1: Create Sanity types**

```typescript
// lib/sanity/types.ts
export type BlockType =
  | 'heroBlock'
  | 'featureGridBlock'
  | 'pricingBlock'
  | 'faqBlock'
  | 'comparisonBlock'
  | 'testimonialBlock'
  | 'productShowcaseBlock'
  | 'textBlock'
  | 'imageBlock'
  | 'ctaBlock'
  | 'formBlock'
  | 'separatorBlock'
  | 'galleryBlock'

export interface BlockCommonFields {
  _key: string
  _type: BlockType
  anchorId?: string
  theme?: 'default' | 'light' | 'dark' | 'brand'
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hideOn?: 'none' | 'mobile' | 'desktop'
}

export type SanitySection = BlockCommonFields & Record<string, unknown>
```

**Step 2: Create BlockRenderer**

```typescript
// components/sanity/BlockRenderer.tsx
import { cn } from '@/lib/utils'
import { SanitySection } from '@/lib/sanity/types'
import { blockRegistry } from './blocks'
import * as Sentry from '@sentry/nextjs'

interface BlockRendererProps {
  sections: SanitySection[]
  className?: string
}

const paddingClasses = {
  none: '',
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
}

const visibilityClasses = {
  none: '',
  mobile: 'hidden md:block',
  desktop: 'md:hidden',
}

const themeClasses = {
  default: '',
  light: 'bg-white text-gray-900',
  dark: 'bg-gray-900 text-white',
  brand: 'bg-circleTel-orange text-white',
}

export function BlockRenderer({ sections, className }: BlockRendererProps) {
  if (!sections?.length) return null

  return (
    <div className={className}>
      {sections.map((section) => {
        const Component = blockRegistry[section._type]

        if (!Component) {
          // Log unknown block types to monitoring
          Sentry.captureMessage(`Unknown Sanity block type: ${section._type}`, {
            level: 'warning',
            extra: { sectionKey: section._key },
          })
          console.warn(`[Sanity] Unknown block type: ${section._type}`)
          return null
        }

        const paddingTop = paddingClasses[section.paddingTop || 'md']
        const paddingBottom = paddingClasses[section.paddingBottom || 'md']
        const visibility = visibilityClasses[section.hideOn || 'none']
        const theme = themeClasses[section.theme || 'default']

        return (
          <section
            key={section._key}
            id={section.anchorId}
            data-block-type={section._type}
            data-theme={section.theme || 'default'}
            className={cn(
              paddingTop,
              paddingBottom,
              visibility,
              theme
            )}
          >
            <Component {...section} />
          </section>
        )
      })}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add lib/sanity/types.ts components/sanity/BlockRenderer.tsx
git commit -m "feat(sanity): add BlockRenderer dispatcher with monitoring"
```

---

### Task 22: Create Block Registry and TextBlock

**Files:**
- Create: `components/sanity/blocks/index.ts`
- Create: `components/sanity/blocks/TextBlock.tsx`

**Step 1: Create TextBlock component**

```typescript
// components/sanity/blocks/TextBlock.tsx
import { cn } from '@/lib/utils'
import { PortableText } from '../primitives'

interface TextBlockProps {
  eyebrow?: string
  title?: string
  content: unknown[]
  alignment?: 'left' | 'center' | 'right'
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full'
  backgroundColor?: string
}

const maxWidthClasses = {
  narrow: 'max-w-xl',
  medium: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-full',
}

const alignmentClasses = {
  left: 'text-left',
  center: 'text-center mx-auto',
  right: 'text-right ml-auto',
}

export function TextBlock({
  eyebrow,
  title,
  content,
  alignment = 'left',
  maxWidth = 'medium',
  backgroundColor,
}: TextBlockProps) {
  return (
    <div
      className="container mx-auto px-4"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div
        className={cn(
          maxWidthClasses[maxWidth],
          alignmentClasses[alignment]
        )}
      >
        {eyebrow && (
          <p className="text-sm font-medium text-circleTel-orange uppercase tracking-wide mb-2">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-3xl font-heading font-bold mb-6">{title}</h2>
        )}
        <PortableText value={content} className="prose prose-lg max-w-none" />
      </div>
    </div>
  )
}
```

**Step 2: Create block registry (partial - will add more in subsequent tasks)**

```typescript
// components/sanity/blocks/index.ts
import { ComponentType } from 'react'
import { BlockType } from '@/lib/sanity/types'
import { TextBlock } from './TextBlock'

// Placeholder components for existing blocks (to be connected later)
const PlaceholderBlock = () => <div>Block not yet implemented</div>

export const blockRegistry: Record<BlockType, ComponentType<any>> = {
  // Existing blocks (connect to existing components or create)
  heroBlock: PlaceholderBlock,
  featureGridBlock: PlaceholderBlock,
  pricingBlock: PlaceholderBlock,
  faqBlock: PlaceholderBlock,
  comparisonBlock: PlaceholderBlock,
  testimonialBlock: PlaceholderBlock,
  productShowcaseBlock: PlaceholderBlock,

  // New blocks
  textBlock: TextBlock,
  imageBlock: PlaceholderBlock, // Will be added in Task 23
  ctaBlock: PlaceholderBlock,   // Will be added in Task 24
  formBlock: PlaceholderBlock,  // Will be added in Task 25
  separatorBlock: PlaceholderBlock, // Will be added in Task 26
  galleryBlock: PlaceholderBlock,   // Will be added in Task 27
}
```

**Step 3: Commit**

```bash
mkdir -p components/sanity/blocks
git add components/sanity/blocks/TextBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add TextBlock renderer and block registry"
```

---

### Task 23: Create ImageBlock Renderer

**Files:**
- Create: `components/sanity/blocks/ImageBlock.tsx`

**Step 1: Create ImageBlock component**

```typescript
// components/sanity/blocks/ImageBlock.tsx
import { cn } from '@/lib/utils'
import { SanityImage, SanityLink } from '../primitives'

interface ImageBlockProps {
  image: {
    asset: { _ref: string }
    hotspot?: { x: number; y: number }
    alt?: string
  }
  caption?: string
  link?: {
    linkType: 'internal' | 'external'
    internalLink?: { _type: string; slug?: { current: string } }
    externalUrl?: string
    openInNewTab?: boolean
  }
  size?: 'small' | 'medium' | 'large' | 'full'
  alignment?: 'left' | 'center' | 'right'
  rounded?: boolean
}

const sizeClasses = {
  small: 'max-w-sm',
  medium: 'max-w-2xl',
  large: 'max-w-4xl',
  full: 'max-w-full',
}

const alignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
}

export function ImageBlock({
  image,
  caption,
  link,
  size = 'medium',
  alignment = 'center',
  rounded = false,
}: ImageBlockProps) {
  const imageElement = (
    <figure
      className={cn(
        sizeClasses[size],
        alignmentClasses[alignment]
      )}
    >
      <SanityImage
        image={image}
        className={cn(
          'w-full h-auto',
          rounded && 'rounded-lg'
        )}
        width={size === 'full' ? 1920 : size === 'large' ? 1200 : size === 'medium' ? 800 : 400}
      />
      {caption && (
        <figcaption className="mt-3 text-sm text-gray-500 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )

  if (link) {
    return (
      <div className="container mx-auto px-4">
        <SanityLink link={link} className="block">
          {imageElement}
        </SanityLink>
      </div>
    )
  }

  return <div className="container mx-auto px-4">{imageElement}</div>
}
```

**Step 2: Update block registry**

Update `components/sanity/blocks/index.ts`:
- Add import: `import { ImageBlock } from './ImageBlock'`
- Update registry: `imageBlock: ImageBlock,`

**Step 3: Commit**

```bash
git add components/sanity/blocks/ImageBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add ImageBlock renderer"
```

---

### Task 24: Create CtaBlock Renderer

**Files:**
- Create: `components/sanity/blocks/CtaBlock.tsx`

**Step 1: Create CtaBlock component**

```typescript
// components/sanity/blocks/CtaBlock.tsx
import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CtaBlockProps {
  headline: string
  description?: string
  variant?: 'banner' | 'card' | 'inline' | 'split'
  primaryButton?: {
    text: string
    url: string
    style?: 'primary' | 'secondary'
  }
  secondaryButton?: {
    text: string
    url: string
    style?: 'primary' | 'secondary'
  }
  backgroundImage?: {
    asset: { _ref: string }
    hotspot?: { x: number; y: number }
  }
  backgroundColor?: string
  textColor?: 'light' | 'dark'
}

const variantClasses = {
  banner: 'py-16 px-4',
  card: 'py-12 px-8 rounded-2xl shadow-lg',
  inline: 'py-8 px-4',
  split: 'grid md:grid-cols-2 gap-8 items-center',
}

export function CtaBlock({
  headline,
  description,
  variant = 'banner',
  primaryButton,
  secondaryButton,
  backgroundImage,
  backgroundColor,
  textColor = 'light',
}: CtaBlockProps) {
  const textClasses = textColor === 'light' ? 'text-white' : 'text-gray-900'

  return (
    <div className="container mx-auto px-4">
      <div
        className={cn(
          'relative overflow-hidden',
          variantClasses[variant],
          textClasses,
          !backgroundImage && !backgroundColor && 'bg-circleTel-navy'
        )}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {/* Background image */}
        {backgroundImage && (
          <div className="absolute inset-0 -z-10">
            <SanityImage
              image={backgroundImage}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'relative z-10',
          variant !== 'split' && 'text-center max-w-3xl mx-auto'
        )}>
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            {headline}
          </h2>

          {description && (
            <p className="mt-4 text-lg opacity-90">{description}</p>
          )}

          {(primaryButton || secondaryButton) && (
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              {primaryButton && (
                <Button asChild size="lg">
                  <Link href={primaryButton.url}>{primaryButton.text}</Link>
                </Button>
              )}
              {secondaryButton && (
                <Button asChild variant="outline" size="lg">
                  <Link href={secondaryButton.url}>{secondaryButton.text}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update block registry**

Update `components/sanity/blocks/index.ts`:
- Add import: `import { CtaBlock } from './CtaBlock'`
- Update registry: `ctaBlock: CtaBlock,`

**Step 3: Commit**

```bash
git add components/sanity/blocks/CtaBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add CtaBlock renderer with variants"
```

---

### Task 25: Create FormBlock Renderer

**Files:**
- Create: `components/sanity/blocks/FormBlock.tsx`

**Step 1: Create FormBlock component**

```typescript
// components/sanity/blocks/FormBlock.tsx
'use client'

import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'
import { ContactForm } from '@/components/forms/ContactForm'
import { CallbackForm } from '@/components/forms/CallbackForm'
import { NewsletterForm } from '@/components/forms/NewsletterForm'

interface FormBlockProps {
  formProvider: 'circletel-contact' | 'circletel-callback' | 'circletel-newsletter' | 'hubspot' | 'typeform'
  formId?: string
  headline?: string
  description?: string
  variant?: 'card' | 'inline' | 'split'
  submitText?: string
  successMessage?: string
  backgroundImage?: {
    asset: { _ref: string }
    hotspot?: { x: number; y: number }
  }
}

const formComponents: Record<string, React.ComponentType<{ formId?: string; submitText?: string; successMessage?: string }>> = {
  'circletel-contact': ContactForm,
  'circletel-callback': CallbackForm,
  'circletel-newsletter': NewsletterForm,
}

const variantClasses = {
  card: 'bg-white rounded-2xl shadow-lg p-8',
  inline: '',
  split: 'grid md:grid-cols-2 gap-8 items-center',
}

export function FormBlock({
  formProvider,
  formId,
  headline,
  description,
  variant = 'card',
  submitText,
  successMessage,
  backgroundImage,
}: FormBlockProps) {
  const FormComponent = formComponents[formProvider]

  // For external providers, render placeholder
  if (!FormComponent) {
    if (formProvider === 'hubspot' && formId) {
      return (
        <div className="container mx-auto px-4">
          <div className={variantClasses[variant]}>
            {headline && <h2 className="text-2xl font-heading font-bold mb-4">{headline}</h2>}
            <div id={`hubspot-form-${formId}`} data-hubspot-form-id={formId}>
              {/* HubSpot script will inject form here */}
            </div>
          </div>
        </div>
      )
    }

    if (formProvider === 'typeform' && formId) {
      return (
        <div className="container mx-auto px-4">
          <div className={variantClasses[variant]}>
            {headline && <h2 className="text-2xl font-heading font-bold mb-4">{headline}</h2>}
            <div data-tf-live={formId} style={{ height: '400px' }}>
              {/* Typeform embed */}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4">
        <div className={variantClasses[variant]}>
          <p className="text-red-500">Form provider "{formProvider}" not configured</p>
        </div>
      </div>
    )
  }

  // Split variant with background image
  if (variant === 'split' && backgroundImage) {
    return (
      <div className="container mx-auto px-4">
        <div className={variantClasses[variant]}>
          <div className="relative h-64 md:h-full min-h-[300px] rounded-lg overflow-hidden">
            <SanityImage image={backgroundImage} fill className="object-cover" />
          </div>
          <div className="py-8 md:py-0">
            {headline && <h2 className="text-2xl font-heading font-bold mb-2">{headline}</h2>}
            {description && <p className="text-gray-600 mb-6">{description}</p>}
            <FormComponent
              formId={formId}
              submitText={submitText}
              successMessage={successMessage}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className={cn(variantClasses[variant], 'max-w-xl mx-auto')}>
        {headline && <h2 className="text-2xl font-heading font-bold mb-2">{headline}</h2>}
        {description && <p className="text-gray-600 mb-6">{description}</p>}
        <FormComponent
          formId={formId}
          submitText={submitText}
          successMessage={successMessage}
        />
      </div>
    </div>
  )
}
```

**Step 2: Update block registry**

Update `components/sanity/blocks/index.ts`:
- Add import: `import { FormBlock } from './FormBlock'`
- Update registry: `formBlock: FormBlock,`

**Step 3: Commit**

```bash
git add components/sanity/blocks/FormBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add FormBlock renderer with provider support"
```

---

### Task 26: Create SeparatorBlock Renderer

**Files:**
- Create: `components/sanity/blocks/SeparatorBlock.tsx`

**Step 1: Create SeparatorBlock component**

```typescript
// components/sanity/blocks/SeparatorBlock.tsx
import { cn } from '@/lib/utils'

interface SeparatorBlockProps {
  mode?: 'divider' | 'spacer'
  style?: 'line' | 'gradient' | 'dashed' | 'dots'
  width?: 'full' | 'three-quarters' | 'half' | 'quarter'
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

const spacingClasses = {
  sm: 'py-4',
  md: 'py-8',
  lg: 'py-12',
  xl: 'py-16',
}

const widthClasses = {
  full: 'w-full',
  'three-quarters': 'w-3/4',
  half: 'w-1/2',
  quarter: 'w-1/4',
}

export function SeparatorBlock({
  mode = 'divider',
  style = 'line',
  width = 'full',
  spacing = 'md',
  color,
}: SeparatorBlockProps) {
  // Spacer mode: just empty space
  if (mode === 'spacer') {
    return <div className={spacingClasses[spacing]} aria-hidden="true" />
  }

  // Divider mode: visible line
  const dividerStyles = {
    line: 'border-t border-gray-200',
    gradient: 'h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent',
    dashed: 'border-t border-dashed border-gray-300',
    dots: 'border-t-2 border-dotted border-gray-300',
  }

  return (
    <div className={cn('flex justify-center', spacingClasses[spacing])}>
      <hr
        className={cn(
          dividerStyles[style],
          widthClasses[width]
        )}
        style={color ? { borderColor: color } : undefined}
      />
    </div>
  )
}
```

**Step 2: Update block registry**

Update `components/sanity/blocks/index.ts`:
- Add import: `import { SeparatorBlock } from './SeparatorBlock'`
- Update registry: `separatorBlock: SeparatorBlock,`

**Step 3: Commit**

```bash
git add components/sanity/blocks/SeparatorBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add SeparatorBlock renderer"
```

---

### Task 27: Create GalleryBlock Renderer

**Files:**
- Create: `components/sanity/blocks/GalleryBlock.tsx`

**Step 1: Create GalleryBlock component**

```typescript
// components/sanity/blocks/GalleryBlock.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SanityImage } from '../primitives'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface GalleryImage {
  asset: { _ref: string }
  hotspot?: { x: number; y: number }
  alt?: string
  caption?: string
}

interface GalleryBlockProps {
  heading?: string
  images: GalleryImage[]
  layout?: 'grid' | 'masonry' | 'carousel'
  lightbox?: boolean
  columns?: 2 | 3 | 4
  gap?: 'none' | 'sm' | 'md' | 'lg'
  aspectRatio?: 'auto' | 'square' | '4:3' | '16:9'
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
}

export function GalleryBlock({
  heading,
  images,
  layout = 'grid',
  lightbox = true,
  columns = 3,
  gap = 'md',
  aspectRatio = 'auto',
}: GalleryBlockProps) {
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)

  if (!images?.length) return null

  const handleImageClick = (image: GalleryImage) => {
    if (lightbox) {
      setLightboxImage(image)
    }
  }

  return (
    <div className="container mx-auto px-4">
      {heading && (
        <h2 className="text-2xl font-heading font-bold mb-6">{heading}</h2>
      )}

      {/* Grid / Masonry layout */}
      {(layout === 'grid' || layout === 'masonry') && (
        <div className={cn('grid', columnClasses[columns], gapClasses[gap])}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(image)}
              className={cn(
                'relative overflow-hidden rounded-lg',
                lightbox && 'cursor-zoom-in',
                aspectRatio === 'square' && 'aspect-square',
                aspectRatio === '4:3' && 'aspect-[4/3]',
                aspectRatio === '16:9' && 'aspect-video'
              )}
            >
              <SanityImage
                image={image}
                fill={aspectRatio !== 'auto'}
                className={cn(
                  'transition-transform duration-300 hover:scale-105',
                  aspectRatio !== 'auto' && 'object-cover'
                )}
                width={aspectRatio === 'auto' ? 600 : undefined}
              />
            </button>
          ))}
        </div>
      )}

      {/* Carousel layout */}
      {layout === 'carousel' && (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(image)}
              className="flex-none w-80 snap-center rounded-lg overflow-hidden"
            >
              <SanityImage
                image={image}
                width={320}
                className="w-full h-auto"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox dialog */}
      {lightbox && lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
            <SanityImage
              image={lightboxImage}
              width={1200}
              className="w-full h-auto rounded-lg"
            />
            {lightboxImage.caption && (
              <p className="text-white text-center mt-4">{lightboxImage.caption}</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
```

**Step 2: Update block registry (final version)**

```typescript
// components/sanity/blocks/index.ts
import { ComponentType } from 'react'
import { BlockType } from '@/lib/sanity/types'
import { TextBlock } from './TextBlock'
import { ImageBlock } from './ImageBlock'
import { CtaBlock } from './CtaBlock'
import { FormBlock } from './FormBlock'
import { SeparatorBlock } from './SeparatorBlock'
import { GalleryBlock } from './GalleryBlock'

// Placeholder for existing blocks - connect these to actual components
const PlaceholderBlock = ({ _type }: { _type: string }) => (
  <div className="p-8 bg-gray-100 text-center">
    <p className="text-gray-500">Block "{_type}" - connect to existing component</p>
  </div>
)

export const blockRegistry: Record<BlockType, ComponentType<any>> = {
  // Existing blocks (TODO: connect to existing components)
  heroBlock: PlaceholderBlock,
  featureGridBlock: PlaceholderBlock,
  pricingBlock: PlaceholderBlock,
  faqBlock: PlaceholderBlock,
  comparisonBlock: PlaceholderBlock,
  testimonialBlock: PlaceholderBlock,
  productShowcaseBlock: PlaceholderBlock,

  // New blocks
  textBlock: TextBlock,
  imageBlock: ImageBlock,
  ctaBlock: CtaBlock,
  formBlock: FormBlock,
  separatorBlock: SeparatorBlock,
  galleryBlock: GalleryBlock,
}
```

**Step 3: Commit**

```bash
git add components/sanity/blocks/GalleryBlock.tsx components/sanity/blocks/index.ts
git commit -m "feat(sanity): add GalleryBlock renderer with lightbox support"
```

---

## Group 6: Webhook & Revalidation

### Task 28: Create Revalidation Utilities

**Files:**
- Create: `lib/sanity/revalidation.ts`

**Step 1: Create revalidation utilities**

```typescript
// lib/sanity/revalidation.ts

type TagFunction = (slug?: string) => string[]

const tagMap: Record<string, TagFunction> = {
  page: (slug) => [`page:${slug}`, 'pages', 'navigation'],
  homepage: () => ['homepage', 'navigation'],
  productPage: (slug) => [`product:${slug}`, 'products', 'pricing'],
  post: (slug) => [`post:${slug}`, 'posts', 'blog', 'recent-posts'],
  campaign: () => ['campaigns', 'active-campaigns', 'banners'],
  resource: (slug) => [`resource:${slug}`, 'resources', 'resource-library'],
  teamMember: () => ['team', 'about'],
  siteSettings: () => ['site-settings', 'navigation', 'footer', 'contact'],
  testimonial: () => ['testimonials'],
  category: () => ['categories', 'blog'],
}

export function getTagsForDocument(type: string, slug?: string): string[] {
  const tagFn = tagMap[type]
  if (!tagFn) {
    console.warn(`[Revalidation] Unknown document type: ${type}`)
    return [type]
  }
  return tagFn(slug)
}

const pathMap: Record<string, (slug: string) => string> = {
  page: (slug) => `/${slug}`,
  homepage: () => '/',
  productPage: (slug) => `/products/${slug}`,
  post: (slug) => `/blog/${slug}`,
  resource: (slug) => `/resources/${slug}`,
  teamMember: (slug) => `/team/${slug}`,
}

export function getPathForDocument(type: string, slug?: string): string | null {
  if (!slug) return null
  const pathFn = pathMap[type]
  return pathFn ? pathFn(slug) : null
}
```

**Step 2: Commit**

```bash
git add lib/sanity/revalidation.ts
git commit -m "feat(sanity): add revalidation tag and path utilities"
```

---

### Task 29: Create Revalidation Webhook Route

**Files:**
- Create: `app/api/sanity/revalidate/route.ts`

**Step 1: Create webhook route handler**

```typescript
// app/api/sanity/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import { NextResponse } from 'next/server'
import { getTagsForDocument, getPathForDocument } from '@/lib/sanity/revalidation'
import * as Sentry from '@sentry/nextjs'

const secret = process.env.SANITY_WEBHOOK_SECRET

interface WebhookPayload {
  _type: string
  _id: string
  slug?: string
  oldSlug?: string
  operation?: 'create' | 'update' | 'delete'
}

export async function POST(request: Request) {
  try {
    // Validate webhook signature
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      request,
      secret
    )

    if (!isValidSignature) {
      Sentry.captureMessage('Invalid Sanity webhook signature', {
        level: 'warning',
      })
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Validate payload
    if (!body?._type) {
      return NextResponse.json(
        { message: 'Invalid payload: missing _type' },
        { status: 400 }
      )
    }

    const { _type, slug, oldSlug, operation = 'update' } = body

    console.log(`[Sanity Revalidate] ${operation} ${_type}: ${slug || 'no slug'}`)

    // Tag-based revalidation (primary strategy)
    const tags = getTagsForDocument(_type, slug)
    for (const tag of tags) {
      revalidateTag(tag)
    }

    // Path-based revalidation for slug changes
    if (operation === 'update' && oldSlug && oldSlug !== slug) {
      const oldPath = getPathForDocument(_type, oldSlug)
      const newPath = getPathForDocument(_type, slug)

      if (oldPath) revalidatePath(oldPath)
      if (newPath) revalidatePath(newPath)

      console.log(`[Sanity Revalidate] Slug changed: ${oldSlug} → ${slug}`)
    }

    // Path-based revalidation for deletions
    if (operation === 'delete' && slug) {
      const path = getPathForDocument(_type, slug)
      if (path) revalidatePath(path)
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      message: `Marked stale: ${tags.join(', ')}`,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[Sanity Revalidate] Error:', error)
    Sentry.captureException(error)

    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
mkdir -p app/api/sanity/revalidate
git add app/api/sanity/revalidate/route.ts
git commit -m "feat(sanity): add revalidation webhook route handler"
```

---

### Task 30: Create GROQ Queries with Cache Tags

**Files:**
- Modify: `lib/sanity/queries.ts`

**Step 1: Create/update queries file**

```typescript
// lib/sanity/queries.ts
import { sanityFetch } from './fetch'

// ============================================
// Page Queries
// ============================================

const PAGE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  seo,
  sections[]{
    _key,
    _type,
    ...
  }
`

export async function getPage(slug: string) {
  return sanityFetch({
    query: `*[_type == "page" && slug.current == $slug][0]{${PAGE_FIELDS}}`,
    params: { slug },
    tags: [`page:${slug}`, 'pages'],
  })
}

export async function getHomepage() {
  return sanityFetch({
    query: `*[_type == "homepage"][0]{${PAGE_FIELDS}}`,
    params: {},
    tags: ['homepage'],
  })
}

export async function getProductPage(slug: string) {
  return sanityFetch({
    query: `*[_type == "productPage" && slug.current == $slug][0]{${PAGE_FIELDS}}`,
    params: { slug },
    tags: [`product:${slug}`, 'products'],
  })
}

// ============================================
// Blog Queries
// ============================================

const POST_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  "author": author->{name, slug, photo},
  "categories": categories[]->{title, slug},
  publishedAt,
  body
`

export async function getPost(slug: string) {
  return sanityFetch({
    query: `*[_type == "post" && slug.current == $slug][0]{${POST_FIELDS}}`,
    params: { slug },
    tags: [`post:${slug}`, 'posts'],
  })
}

export async function getBlogPosts(limit = 10) {
  return sanityFetch({
    query: `*[_type == "post"] | order(publishedAt desc)[0...$limit]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      featuredImage,
      "author": author->{name, photo},
      publishedAt
    }`,
    params: { limit },
    tags: ['posts', 'blog'],
  })
}

// ============================================
// Campaign Queries
// ============================================

export async function getActiveCampaigns(audience: string = 'all') {
  const now = new Date().toISOString()

  return sanityFetch({
    query: `*[_type == "campaign"
      && isEnabled == true
      && startDate <= $now
      && (endDate == null || endDate > $now)
      && (targetAudience == "all" || targetAudience == $audience)
    ] | order(priority desc){
      _id,
      title,
      campaignType,
      headline,
      description,
      image,
      cta,
      placement,
      isDismissible,
      backgroundColor,
      targetPages
    }`,
    params: { now, audience },
    tags: ['campaigns', 'active-campaigns'],
  })
}

// ============================================
// Resource Queries
// ============================================

export async function getResources(limit = 20) {
  return sanityFetch({
    query: `*[_type == "resource" && isEnabled == true] | order(publishedAt desc)[0...$limit]{
      _id,
      title,
      "slug": slug.current,
      resourceType,
      description,
      thumbnail,
      accessLevel
    }`,
    params: { limit },
    tags: ['resources', 'resource-library'],
  })
}

export async function getResource(slug: string) {
  return sanityFetch({
    query: `*[_type == "resource" && slug.current == $slug][0]{
      _id,
      title,
      "slug": slug.current,
      resourceType,
      description,
      thumbnail,
      accessLevel,
      file,
      externalUrl,
      body,
      "products": products[]->{title, slug},
      seo
    }`,
    params: { slug },
    tags: [`resource:${slug}`, 'resources'],
  })
}

// ============================================
// Team Queries
// ============================================

export async function getTeamMembers() {
  return sanityFetch({
    query: `*[_type == "teamMember"] | order(order asc){
      _id,
      name,
      "slug": slug.current,
      role,
      department,
      photo,
      bio
    }`,
    params: {},
    tags: ['team'],
  })
}

// ============================================
// Site Settings
// ============================================

export async function getSiteSettings() {
  return sanityFetch({
    query: `*[_type == "siteSettings"][0]`,
    params: {},
    tags: ['site-settings', 'navigation'],
  })
}
```

**Step 2: Commit**

```bash
git add lib/sanity/queries.ts
git commit -m "feat(sanity): add GROQ queries with cache tags"
```

---

## Group 7: Page Integration

### Task 31: Update Page Route to Use Sanity

**Files:**
- Modify: `app/[slug]/page.tsx`

**Step 1: Update dynamic page route**

```typescript
// app/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPage } from '@/lib/sanity/queries'
import { BlockRenderer } from '@/components/sanity/BlockRenderer'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) return {}

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description,
    openGraph: {
      title: page.seo?.ogTitle || page.seo?.title || page.title,
      description: page.seo?.ogDescription || page.seo?.description,
      images: page.seo?.ogImage ? [page.seo.ogImage] : undefined,
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <main>
      <BlockRenderer sections={page.sections} />
    </main>
  )
}
```

**Step 2: Commit**

```bash
git add app/[slug]/page.tsx
git commit -m "feat(sanity): integrate Sanity page rendering with BlockRenderer"
```

---

### Task 32: Update Existing Block Schemas with Cross-Cutting Fields

**Files:**
- Modify: `lib/sanity/schemas/blocks/heroBlock.ts`
- Modify: (other existing block schemas)

**Step 1: Update heroBlock with cross-cutting fields**

Read existing heroBlock, then add blockFields spread:

```typescript
// lib/sanity/schemas/blocks/heroBlock.ts
import { defineField, defineType } from 'sanity'
import { blockFields } from '../objects/blockFields'

export default defineType({
  name: 'heroBlock',
  title: 'Hero Block',
  type: 'object',
  fields: [
    // ... existing fields ...
    ...blockFields, // Add cross-cutting fields
  ],
  // ... preview config ...
})
```

**Step 2: Repeat for all existing blocks**

Apply the same pattern to:
- `featureGridBlock.ts`
- `pricingBlock.ts`
- `faqBlock.ts`
- `comparisonBlock.ts`
- `testimonialBlock.ts`
- `productShowcaseBlock.ts`

**Step 3: Commit**

```bash
git add lib/sanity/schemas/blocks/
git commit -m "feat(sanity): add cross-cutting fields to existing blocks"
```

---

### Task 33: Final Integration Test

**Step 1: Run type check**

```bash
npm run type-check:memory
```

Expected: No TypeScript errors

**Step 2: Start dev server**

```bash
npm run dev:memory
```

**Step 3: Test Studio**

Navigate to: `http://localhost:3000/studio`
Expected: Sanity Studio loads with all document types visible

**Step 4: Test page rendering**

Create a test page in Studio with various blocks
Navigate to the page URL
Expected: All blocks render correctly

**Step 5: Test webhook (local)**

Use Sanity CLI or dashboard to trigger a publish
Check Vercel logs for revalidation
Expected: Tags marked stale

**Step 6: Final commit**

```bash
git add .
git commit -m "feat(sanity): complete Phase 1 Sanity CMS migration"
```

---

## Summary

| Group | Tasks | Files Created/Modified |
|-------|-------|----------------------|
| Infrastructure | 6 | 7 files |
| Document Schemas | 5 | 6 files |
| Block Schemas | 6 | 8 files |
| Rendering Primitives | 3 | 4 files |
| Block Renderers | 7 | 8 files |
| Webhook & Revalidation | 3 | 3 files |
| Page Integration | 3 | 3 files |

**Total: 33 tasks, ~39 files**

---

## Next Steps After Phase 1

1. Configure webhook in Sanity dashboard (manage.sanity.io)
2. Add `SANITY_WEBHOOK_SECRET` to Vercel env vars
3. Train marketing team on Studio
4. Connect existing block components to registry
5. Begin Phase 2: Visual Editing + Draft Mode
