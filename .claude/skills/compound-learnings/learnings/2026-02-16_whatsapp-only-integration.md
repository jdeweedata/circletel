# WhatsApp-Only Integration - Learnings

**Date**: 2026-02-16
**Scope**: Transitioning CircleTel from phone+WhatsApp to WhatsApp-only support channel

## Summary

Implemented WhatsApp as the sole customer support channel by:
1. Adding a floating WhatsApp button visible on public pages
2. Replacing all phone number references (087 087 6305 → 082 487 3900)
3. Changing all "Phone:" labels to "WhatsApp:" across 41+ files

## Key Patterns

### 1. Route-Aware Floating Components

Components that should only appear on certain pages use pathname checking:

```typescript
'use client';

import { usePathname } from 'next/navigation';

export function FloatingComponent() {
  const pathname = usePathname();

  // Hide on admin, partner, and auth routes
  const shouldHide =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/partners') ||
    pathname?.startsWith('/auth/');

  if (shouldHide) return null;

  return <div className="fixed bottom-6 right-6 z-50">...</div>;
}
```

**Use Cases**:
- WhatsApp floating button
- StickyCTA components
- Help widgets
- Cookie consent banners

### 2. Centralized Contact Management

All contact info lives in one place:

```typescript
// lib/constants/contact.ts
export const CONTACT = {
  // WhatsApp (Primary support channel - NO phone support)
  WHATSAPP_NUMBER: '082 487 3900',
  WHATSAPP_LINK: 'https://wa.me/27824873900',
  WHATSAPP_INTERNATIONAL: '+27 82 487 3900',

  // Sales (B2B only)
  PHONE_SALES: '010 880 3663',

  // Email
  EMAIL_SUPPORT: 'support@circletel.co.za',
  EMAIL_SALES: 'sales@circletel.co.za',
} as const;

export function getWhatsAppLink(message?: string): string {
  if (!message) return CONTACT.WHATSAPP_LINK;
  return `${CONTACT.WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}
```

**Benefits**:
- Change number once → propagates everywhere
- Type-safe access to contact info
- Pre-built helper for WhatsApp links with messages

### 3. Bulk Replacement Strategy

For wide-reaching changes (like contact numbers):

1. **Grep to identify scope**: `grep -r "087 087 6305" .`
2. **Categorize by type**:
   - UI components (need icons + links)
   - Pages (may need links or just text)
   - Email templates (text replacement)
   - Documentation (text replacement)
3. **Prioritize user-facing first**
4. **Use `replace_all: true` for exact matches**
5. **Verify with grep after**: `grep -r "087 087 6305"` should return 0

## Gotchas

### 1. "Replace Number" vs "Change Channel"

User requests like "replace phone with WhatsApp" may mean:
- Just the number change (087 → 082)
- OR complete channel change (no phone support at all)

**Ask early**: "Should I replace just the number, or remove phone support entirely and make WhatsApp the only channel?"

### 2. Label Changes Require Second Pass

Changing support channel means updating:
- ✅ Phone numbers
- ✅ `tel:` links → `wa.me` links
- ⚠️ "Phone:" labels → "WhatsApp:"
- ⚠️ "Call us" text → "WhatsApp us"

The label changes are easy to miss in first pass.

### 3. Git Tracked Files Ignore .gitignore

Adding a directory to `.gitignore` doesn't untrack existing files:

```bash
# Add to .gitignore
echo "screenshots/" >> .gitignore

# Untrack already-tracked files
git rm -r --cached screenshots/
```

## Files Changed

| Category | Count | Examples |
|----------|-------|----------|
| New component | 1 | `WhatsAppFloatingButton.tsx` |
| Layout | 1 | `app/layout.tsx` |
| UI Components | 4 | Footer, HeroWithTabs, ContactInformation |
| Pages | 14 | Contact, Terms, Payment pages |
| Email system | 3 | variables.ts, footer, templates |
| API/Scripts | 8 | OTP routes, notification scripts |
| Documentation | 12 | Testing docs, email templates |
| **Total** | **43** | |

## Verification Commands

```bash
# Verify old number is gone
grep -r "087 087 6305" . --include="*.ts" --include="*.tsx" --include="*.md"
# Expected: No results

# Verify new number exists
grep -r "082 487 3900" . --include="*.ts" --include="*.tsx" | head -20
# Expected: Multiple WhatsApp references

# Verify no "Phone:" with support number
grep -r "Phone:.*082 487" .
# Expected: No results (should be "WhatsApp:")
```

## Component Reference

### WhatsApp Floating Button

```typescript
// components/common/WhatsAppFloatingButton.tsx
<a
  href={getWhatsAppLink('Hi CircleTel, I need assistance')}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Chat with CircleTel on WhatsApp"
  className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
>
  <FaWhatsapp className="h-7 w-7" />
</a>
```

**Styling**:
- WhatsApp green: `#25D366`
- Position: `fixed bottom-6 right-6`
- Z-index: `z-50` (above most content)
- Hover: `scale-110` (subtle grow effect)

## Related Files

- Contact constants: `lib/constants/contact.ts`
- Floating button: `components/common/WhatsAppFloatingButton.tsx`
- Footer: `components/layout/Footer.tsx`
- Root layout: `app/layout.tsx`
