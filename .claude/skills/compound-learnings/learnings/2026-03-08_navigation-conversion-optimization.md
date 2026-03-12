# Navigation Conversion Optimization Learnings

**Date:** 2026-03-08
**Task:** Implement HelpBar, SearchModal, and StickyMobileCTA based on Vodacom analysis
**Duration:** ~30 minutes

---

## Correction Received (RSI)

**User said:** "We do not have a Sales phone (010 880 3663) for inbound sales we integrated WhatsApp to ZOHO Desk we reach out to customers that either contact us on the WhatsApp number or via email at sales@circletel.co.za"

**Actionable takeaway:** CircleTel has NO inbound phone number. All customer contact is via:
- WhatsApp: 082 487 3900 (integrated to ZOHO Desk)
- Email: sales@circletel.co.za

**Fix applied:** Updated `PHONE_SALES` → `PHONE_SALES_OUTBOUND` with comment noting it's not for public display.

---

## Patterns

### 1. Conversion Optimization: Help Access Above Nav
When adding support/contact access to navigation, use a slim bar ABOVE the main nav:
- Keeps primary CTAs (Request Quote, Login) visible in main nav
- Doesn't compete with conversion buttons
- Navy/dark background creates visual separation

```
┌─────────────────────────────────────────┐
│ [Support Hours]    [WhatsApp] | [Email] │  ← HelpBar (secondary)
├─────────────────────────────────────────┤
│ [Logo]  Nav ▾   [CTA 1] [CTA 2]         │  ← Main Nav (primary)
└─────────────────────────────────────────┘
```

### 2. Command Palette Search Pattern
For site-wide search on marketing sites:
- Static search index (no API needed for small sites)
- Keyboard shortcut: Ctrl/Cmd+K
- Keyboard navigation: Arrow keys + Enter
- Category badges help users orient results
- Show top 6 results by default when empty query

**Key files:**
- `components/navigation/SearchModal.tsx`
- Uses Dialog from shadcn/ui
- `useSearchShortcut` hook for global Ctrl+K

### 3. Sticky Mobile CTA Pattern
For mobile conversion:
- Only show after scroll (200px threshold) - not immediately intrusive
- Dismissible with X button (respect user choice)
- Exclude from pages where action is irrelevant (checkout, dashboard, auth)
- Use `pb-safe` for notch/home indicator safe area
- Lower z-index than WhatsApp button to avoid conflicts

```typescript
const EXCLUDED_PATHS = [
  '/coverage',    // Already on target page
  '/order',       // In funnel
  '/checkout',    // Converting
  '/auth',        // Auth flow
  '/admin',       // Staff
  '/partners',    // Partners
  '/dashboard',   // Logged in
];
```

### 4. Multi-Component Z-Index Coordination
When adding floating/fixed elements, coordinate z-indexes:
- z-50: WhatsApp floating button (highest - always accessible)
- z-40: Sticky mobile CTA (below WhatsApp)
- z-50: Header/nav (same level as WhatsApp, different position)

---

## What Worked

1. **Option A (Quick Win) first** - Starting with HelpBar alone, then adding search, then sticky CTA allowed incremental verification
2. **Using centralized contact constants** - `lib/constants/contact.ts` made the phone→email fix trivial
3. **Batch execution with checkpoints** - Following executing-plans skill caught the phone number issue before shipping

---

## What Failed

1. **Assumed phone number was valid for inbound** - Should have checked business context before using `PHONE_SALES`
2. **Initial build OOM** - VPS memory constraints killed full build; type-check was sufficient verification

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Navy HelpBar | Matches Vodacom pattern, creates visual hierarchy |
| Static search index | No API latency, covers marketing pages adequately |
| Scroll-triggered sticky CTA | Avoid immediate popup annoyance |
| Email instead of phone | User correction - WhatsApp + email is the actual support model |

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `components/navigation/HelpBar.tsx` | Contact strip above nav | 53 |
| `components/navigation/SearchModal.tsx` | Command palette search | 160 |
| `components/navigation/StickyMobileCTA.tsx` | Mobile scroll CTA | 60 |

---

## Rule Candidate

**Pattern:** Always verify business contact model before displaying contact methods
**Frequency:** 1 (this session)
**Action:** Note for future - if pattern recurs, create rule

---

## Source

Commit: `3e5d096c feat(nav): add HelpBar, search modal, and sticky mobile CTA`
