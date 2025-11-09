# CircleTel Email Slices

**Reusable email components using React Email for consistent, branded transactional emails**

## Architecture

Email slices are modular, reusable components that follow the same pattern as Prismic web slices but are optimized for email client compatibility.

### Core Principles

1. **Inline CSS Only** - All styles must be inline for email client compatibility
2. **Table-Based Layouts** - Use `<table>` elements for layout (Outlook compatibility)
3. **No JavaScript** - Email clients don't support JavaScript
4. **Absolute URLs** - All images must use absolute URLs
5. **Web Fonts Fallbacks** - Always include fallback fonts

## Directory Structure

```
emails/
├── slices/                    # Reusable email components
│   ├── CircleTelHeader.tsx   # Brand header with logo
│   ├── CircleTelHero.tsx     # Title + icon + gradient
│   ├── CircleTelTextBlock.tsx # Paragraph content
│   ├── CircleTelButton.tsx   # CTA buttons
│   ├── CircleTelServiceDetails.tsx # Key-value pairs
│   ├── CircleTelInvoiceTable.tsx # Line items + VAT
│   ├── CircleTelFooter.tsx   # Contact + legal
│   └── CircleTelSocialLinks.tsx # Social media icons
├── templates/                 # Complete email templates
│   ├── consumer/             # B2C emails
│   ├── business/             # B2B emails
│   └── partners/             # Partner emails
└── utils/                     # Email utilities
    ├── styles.ts             # Shared inline styles
    └── variables.ts          # Variable substitution
```

## Usage

### Example: Order Confirmation Email

```tsx
import { CircleTelHeader } from './slices/CircleTelHeader';
import { CircleTelHero } from './slices/CircleTelHero';
import { CircleTelTextBlock } from './slices/CircleTelTextBlock';
import { CircleTelButton } from './slices/CircleTelButton';
import { CircleTelFooter } from './slices/CircleTelFooter';

export default function OrderConfirmation({
  customerName,
  orderNumber,
  orderUrl
}) {
  return (
    <Html>
      <Head />
      <Body style={emailStyles.body}>
        <CircleTelHeader />
        <CircleTelHero
          title="Order Confirmed!"
          icon="✅"
        />
        <CircleTelTextBlock>
          Thank you {customerName}! Your order {orderNumber} has been confirmed.
        </CircleTelTextBlock>
        <CircleTelButton href={orderUrl} variant="primary">
          View Order
        </CircleTelButton>
        <CircleTelFooter />
      </Body>
    </Html>
  );
}
```

## Slice Components

### CircleTelHeader
**Purpose:** Brand header with CircleTel logo and orange gradient
**Props:** None (uses brand defaults)
**Height:** 80px

### CircleTelHero
**Purpose:** Email title with optional icon and gradient background
**Props:**
- `title: string` - Main heading
- `subtitle?: string` - Optional subheading
- `icon?: string` - Emoji or icon
- `backgroundColor?: string` - Custom background (default: orange gradient)

### CircleTelTextBlock
**Purpose:** Paragraph content with branded typography
**Props:**
- `children: ReactNode` - Text content
- `align?: 'left' | 'center' | 'right'` - Text alignment

### CircleTelButton
**Purpose:** Call-to-action button
**Props:**
- `href: string` - Link URL
- `children: ReactNode` - Button text
- `variant?: 'primary' | 'secondary' | 'outline'` - Button style

### CircleTelServiceDetails
**Purpose:** Display package/service information as key-value pairs
**Props:**
- `details: Array<{ label: string; value: string }>` - Key-value pairs

### CircleTelInvoiceTable
**Purpose:** Line items with pricing and VAT calculation
**Props:**
- `items: Array<{ description: string; amount: number }>` - Line items
- `subtotal: number` - Subtotal amount
- `vat: number` - VAT amount (15%)
- `total: number` - Total amount

### CircleTelFooter
**Purpose:** Standard footer with contact info, legal, and social links
**Props:** None (uses company defaults)

### CircleTelSocialLinks
**Purpose:** Social media icon links
**Props:**
- `showFacebook?: boolean` - Show Facebook icon (default: true)
- `showTwitter?: boolean` - Show Twitter icon (default: true)
- `showInstagram?: boolean` - Show Instagram icon (default: true)
- `showLinkedIn?: boolean` - Show LinkedIn icon (default: true)

## Brand Colors

```typescript
const brandColors = {
  primary: '#F5831F',           // CircleTel Orange
  primaryDark: '#e67516',       // Darker orange for gradients
  darkNeutral: '#1F2937',       // Dark text
  secondaryNeutral: '#4B5563',  // Secondary text
  lightNeutral: '#E6E9EF',      // Light backgrounds
  white: '#FFFFFF',             // White
};
```

## Email Client Compatibility

All slices are tested in:
- ✅ Outlook (2016, 2019, 365, Web)
- ✅ Gmail (Web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ Thunderbird

## Testing

```bash
# Preview all email templates locally
npm run email:dev

# Send test email
npm run email:send -- --template order_confirmation --to test@example.com
```

## Variable Substitution

Email templates support variable substitution using `{{variable}}` syntax:

```tsx
<CircleTelTextBlock>
  Thank you {{customerName}} for your order {{orderNumber}}.
</CircleTelTextBlock>
```

Variables are replaced at send-time via the `/api/email/send` endpoint.

## Best Practices

1. **Keep it Simple** - Email clients have limited CSS support
2. **Use Tables** - For reliable layout across all clients
3. **Inline Everything** - Styles, images (base64 small icons only)
4. **Test Early** - Preview in Litmus/Email on Acid before production
5. **Mobile First** - Most emails are read on mobile devices
6. **Accessibility** - Use semantic HTML and alt text for images

## Resources

- [React Email Documentation](https://react.email)
- [Email Client CSS Support](https://www.caniemail.com/)
- [MJML Email Framework](https://mjml.io/)
- [Litmus Email Testing](https://litmus.com/)

---

**Last Updated:** 2025-11-08
**Maintained By:** CircleTel Development Team
