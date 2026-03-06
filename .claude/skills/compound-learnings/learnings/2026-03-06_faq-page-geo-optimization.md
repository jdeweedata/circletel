# FAQ Page with SEO/GEO/AI-SEO Optimization

**Date**: 2026-03-06
**Session**: FAQ page creation and redesign
**Impact**: High - reusable patterns for content pages

---

## Summary

Created a comprehensive FAQ page optimized for traditional SEO, GEO (Generative Engine Optimization for AI citations), and user experience. Redesigned with two-column layout based on competitor analysis.

## Patterns

### 1. Two-Column FAQ Layout

**Structure:**
```
┌─────────────────────────────────────────────────────┐
│  [Hero with curved bottom edge]                     │
├──────────────────┬──────────────────────────────────┤
│  SIDEBAR (sticky)│  FAQ CONTENT                     │
│  - Intro text    │  - Category header               │
│  - Jump to nav   │  - Numbered questions (01, 02)   │
│  - Quick facts   │  - Accordion answers             │
│  - Contact CTA   │  - Bottom CTA                    │
└──────────────────┴──────────────────────────────────┘
```

**Implementation:**
```tsx
<div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
  <aside className="lg:w-80 flex-shrink-0">
    <div className="lg:sticky lg:top-24 space-y-6">
      {/* Sidebar content */}
    </div>
  </aside>
  <div className="flex-1 min-w-0">
    {/* Main FAQ content */}
  </div>
</div>
```

**Location**: `app/faq/page.tsx`

### 2. JSON-LD Structured Data for FAQ Pages

Three schemas for maximum SEO/GEO coverage:

1. **FAQPage** - Google rich snippets + AI parsing
2. **Organization** - Entity authority signals
3. **Speakable** - Voice search optimization (targets `.faq-answer`, `.stat-callout`)

**Security note**: JSON-LD uses inline scripts which are safe when content is generated server-side from static data (not user input).

**Location**: `app/faq/page.tsx` lines 51-99

### 3. GEO Optimization Checklist

| Feature | Implementation |
|---------|----------------|
| Conversational phrasing | "How much does CircleTel cost?" not "Pricing" |
| Location signals | "Johannesburg, Cape Town, Durban, Pretoria" in answers |
| Extractable facts | `.stat-callout` class for AI parsing |
| Specific numbers | "R799/month", "3-7 days", "99.5% SLA" |
| E-E-A-T signals | Accurate info, real contact details |

### 4. Centralized Contact Constants

**File**: `lib/constants/contact.ts`

```typescript
import { CONTACT } from '@/lib/constants/contact';

// Usage
<a href={CONTACT.WHATSAPP_LINK}>{CONTACT.WHATSAPP_NUMBER}</a>
<a href={`mailto:${CONTACT.EMAIL_PRIMARY}`}>{CONTACT.EMAIL_PRIMARY}</a>
<span>{CONTACT.SUPPORT_HOURS}</span>
```

**Rule**: `.claude/rules/contact-details.md` - enforces use of constants

## Friction Points & Solutions

### Wrong Icon Library
- **Issue**: Subagent used `FaWhatsapp` instead of `PiWhatsappLogoBold`
- **Solution**: Spec review caught it; created fix commit
- **Prevention**: Always verify imports match project conventions (Phosphor Bold)

### Hardcoded Contact Details
- **Issue**: 20+ files with hardcoded contact info
- **Solution**: Created `lib/constants/contact.ts` + enforcement rule
- **Prevention**: Import from constants, never hardcode

### Inaccurate Support Hours
- **Issue**: Claimed "24/7 support" when actually Mon-Fri 8am-5pm
- **Solution**: User caught during review; fixed in constants
- **Prevention**: Verify business facts with stakeholder before writing copy

## Key Learnings

1. **Single authoritative page** beats multiple pages for AI citations
2. **Competitor screenshots** reveal quick design wins (took 5 min to identify improvements)
3. **Spec reviews catch issues** that self-reviews miss
4. **Constants + rules + memory** = governance that persists across sessions
5. **Numbered questions** (01, 02...) improve scannability significantly

## Files Created/Modified

| File | Purpose |
|------|---------|
| `app/faq/page.tsx` | Main FAQ page with JSON-LD |
| `app/faq/faq-data.ts` | 32 FAQs across 7 categories |
| `components/faq/CategoryNav.tsx` | Sticky category navigation (removed in redesign) |
| `components/faq/StatCallouts.tsx` | Extractable fact boxes |
| `lib/constants/contact.ts` | Centralized contact details |
| `.claude/rules/contact-details.md` | Enforcement rule |

## Reuse Checklist

When creating similar content pages:

- [ ] Use two-column layout (sidebar + content)
- [ ] Add FAQPage JSON-LD schema
- [ ] Add Organization schema (if not already on site)
- [ ] Add Speakable schema with `.faq-answer` class
- [ ] Include location signals in copy
- [ ] Use specific numbers, not vague claims
- [ ] Import contact details from constants
- [ ] Number items for scannability
