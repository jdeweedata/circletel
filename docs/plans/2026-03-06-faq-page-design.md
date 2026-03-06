# FAQ Page Design — SEO/GEO/AI-SEO Optimized

**Date**: 2026-03-06
**Status**: Approved
**Route**: `/faq`

## Overview

Create a comprehensive FAQ page optimized for traditional SEO, GEO (Generative Engine Optimization for AI citations), and AI-SEO. Single authoritative page with ~30 FAQs across 7 categories.

## Goals

1. Rank for FAQ-related queries in Google
2. Get cited by AI assistants (ChatGPT, Claude, Perplexity, Google AI Overviews)
3. Provide accurate, helpful answers to common customer questions
4. Drive conversions via coverage checker CTA

## Technical Architecture

### Files to Create

| File | Purpose |
|------|---------|
| `app/faq/page.tsx` | Server component with metadata, JSON-LD, page layout |
| `app/faq/faq-data.ts` | FAQ content organized by category with types |
| `components/faq/CategoryNav.tsx` | Sticky horizontal category navigation |
| `components/faq/StatCallouts.tsx` | Extractable fact boxes for AI parsing |

### Page Structure

```
/app/faq/page.tsx (Server Component)
├── Metadata (SEO + OpenGraph)
├── JSON-LD Scripts (FAQPage, Organization, Speakable)
├── Hero Section (title, description, breadcrumb)
├── Stat Callouts (top)
├── Category Navigation (sticky jump links)
├── FAQ Sections (accordion per category)
│   ├── Coverage & Availability
│   ├── Pricing & Billing
│   ├── Installation & Setup
│   ├── Speed & Performance
│   ├── Contracts & Cancellation
│   ├── Support & Service
│   └── Business Solutions
├── Stat Callouts (bottom)
└── CTA Section (coverage checker + contact)
```

## SEO Implementation

### Metadata

```typescript
export const metadata: Metadata = {
  title: 'FAQ | CircleTel Internet South Africa - Your Questions Answered',
  description: 'Get answers about CircleTel fibre, 5G, and LTE internet in South Africa. Coverage, pricing, installation, speeds, contracts, and support explained.',
  keywords: ['CircleTel FAQ', 'internet South Africa', 'fibre FAQ', '5G internet questions'],
  openGraph: {
    title: 'FAQ | CircleTel Internet South Africa',
    description: 'Get answers about CircleTel fibre, 5G, and LTE internet in South Africa.',
    url: 'https://www.circletel.co.za/faq',
    type: 'website',
    siteName: 'CircleTel',
  },
  alternates: {
    canonical: 'https://www.circletel.co.za/faq',
  },
}
```

### JSON-LD Schemas

#### 1. FAQPage Schema
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is CircleTel available in my area?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CircleTel provides fibre, 5G, and LTE internet across South Africa..."
      }
    }
  ]
}
```

#### 2. Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CircleTel",
  "url": "https://www.circletel.co.za",
  "logo": "https://www.circletel.co.za/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+27-87-073-0000",
    "contactType": "customer service",
    "areaServed": "ZA",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://www.facebook.com/circletel",
    "https://www.linkedin.com/company/circletel"
  ]
}
```

#### 3. Speakable Schema
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "CircleTel FAQ",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".faq-answer", ".stat-callout"]
  }
}
```

## GEO Optimization Features

| Feature | Implementation |
|---------|----------------|
| Conversational phrasing | "How much does CircleTel cost?" not "Pricing information" |
| Location signals | "...across South Africa including Johannesburg, Cape Town, Durban, Pretoria" |
| Extractable facts | `<div class="stat-callout">Installation: 3-7 days</div>` |
| Specific numbers | "speeds up to 200Mbps", "from R799/month" |
| E-E-A-T signals | Accurate info, real contact details, honest support hours |

## Content Categories

### 1. Coverage & Availability (4-5 Qs)
- Is CircleTel available in my area?
- What areas do you cover in South Africa?
- How do I check coverage at my address?
- What technologies do you offer (fibre/5G/LTE)?

### 2. Pricing & Billing (5-6 Qs)
- How much does CircleTel internet cost?
- Are there any hidden fees or setup costs?
- What payment methods do you accept?
- When am I billed?
- Can I change my plan later?

### 3. Installation & Setup (4-5 Qs)
- How long does installation take?
- Is installation free?
- Do I need to be home for installation?
- What equipment is provided?

### 4. Speed & Performance (4-5 Qs)
- What speeds can I get with CircleTel?
- Is CircleTel fast enough for video conferencing?
- Can multiple people stream at the same time?
- Do you throttle speeds or have data caps?

### 5. Contracts & Cancellation (3-4 Qs)
- Is there a contract or lock-in period?
- How do I cancel my service?
- Are there early termination fees?

### 6. Support & Service (4-5 Qs)
- How do I contact CircleTel support?
- What are your support hours?
- What if my connection goes down?
- Do you have a mobile app?

**IMPORTANT - Accurate Support Messaging:**
- Support via WhatsApp (primary channel) + AI assistance
- Business hours: Mon-Fri, 8am-5pm
- Zoho Desk integration for ticket tracking
- Do NOT claim "24/7 support"

### 7. Business Solutions (4-5 Qs)
- Do you offer business internet plans?
- What's included with business packages?
- Can I get a static IP address?
- Do you offer SLA guarantees?

## Visual Design

### Hero Section
- Orange gradient background (consistent with Terms page)
- H1: "Frequently Asked Questions"
- Subheading: "Everything you need to know about CircleTel internet across South Africa"
- Breadcrumb navigation

### Category Navigation
- Horizontal scrollable tabs
- Sticky positioning below header
- Jump links to each section
- Mobile: horizontal scroll with touch

### FAQ Accordion
- Reuse `components/ui/accordion`
- White cards with subtle shadow
- Category headings with Phosphor icons
- Comprehensive answers (3-5 sentences)

### Stat Callouts
```
┌────────────────────────────────────────────────────────────┐
│  3-7 days       │  WhatsApp Support    │  No contracts    │
│  Installation   │  + AI assistance     │  Cancel anytime  │
└────────────────────────────────────────────────────────────┘
```

### CTA Section
- "Still have questions?" heading
- Coverage checker button
- Contact options (WhatsApp, phone, email)

## Dependencies

- `components/ui/accordion` — existing
- `components/ui/badge` — existing
- Phosphor icons (`react-icons/pi`) — existing
- Design tokens — existing

## Success Metrics

1. Google rich snippets appearing for FAQ queries
2. Page indexed and ranking for "CircleTel FAQ" queries
3. AI assistants citing CircleTel FAQ in responses
4. Reduced support inquiries for common questions

## Out of Scope (v1)

- Comparison tables (CircleTel vs competitors)
- Related questions linking
- Search/filter functionality
- CMS-managed FAQ content
