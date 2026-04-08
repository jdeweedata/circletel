---
paths:
  - "lib/constants/contact*"
  - "components/navigation/**"
  - "components/footer/**"
---

Rule: contact-details
Loaded by: CLAUDE.md
Scope: Contact information across all pages and components

---

## MANDATORY: Use Centralized Contact Constants

**NEVER hardcode contact details in components or pages.**

Always import from `lib/constants/contact.ts`:

```typescript
import { CONTACT, getWhatsAppLink } from '@/lib/constants/contact';
```

## Approved Contact Details

| Channel | Constant | Value |
|---------|----------|-------|
| WhatsApp | `CONTACT.WHATSAPP_NUMBER` | 082 487 3900 |
| WhatsApp Link | `CONTACT.WHATSAPP_LINK` | https://wa.me/27824873900 |
| Email | `CONTACT.EMAIL_PRIMARY` | contactus@circletel.co.za |
| Support Hours | `CONTACT.SUPPORT_HOURS` | Mon-Fri, 8am-5pm |

## Usage Examples

```tsx
// WhatsApp link
<a href={CONTACT.WHATSAPP_LINK}>{CONTACT.WHATSAPP_NUMBER}</a>

// WhatsApp with pre-filled message
<a href={getWhatsAppLink('Hi, I have a question about...')}>WhatsApp us</a>

// Email link
<a href={`mailto:${CONTACT.EMAIL_PRIMARY}`}>{CONTACT.EMAIL_PRIMARY}</a>
```

## DO NOT

```tsx
// WRONG - hardcoded values
<a href="https://wa.me/27824873900">082 487 3900</a>
<a href="mailto:support@circletel.co.za">Email us</a>
<span>24/7 support</span> // INCORRECT - support is Mon-Fri 8am-5pm

// RIGHT - use constants
<a href={CONTACT.WHATSAPP_LINK}>{CONTACT.WHATSAPP_NUMBER}</a>
<a href={`mailto:${CONTACT.EMAIL_PRIMARY}`}>{CONTACT.EMAIL_PRIMARY}</a>
<span>{CONTACT.SUPPORT_HOURS}</span>
```

## Channels Available

- **WhatsApp**: Primary contact channel
- **Email**: contactus@circletel.co.za

**No phone number** — do not display a phone number for customer contact.

## Support Hours (ACCURATE)

- Mon-Fri, 8am-5pm South African time
- WhatsApp messages monitored during business hours
- AI assistant provides instant answers to common questions
- **Do NOT claim "24/7 support"** — this is inaccurate
