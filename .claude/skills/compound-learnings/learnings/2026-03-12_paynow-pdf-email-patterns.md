---
name: paynow-pdf-email-patterns
description: Patterns for PDF invoices with clickable PayNow buttons and branded customer emails
type: pattern
---

# PayNow PDF & Email Patterns

## Date: 2026-03-12

## Context

Implemented branded billing emails and PDF invoices with embedded PayNow payment links for CircleTel customers.

## PDF PayNow Button Pattern

Add clickable payment buttons to jsPDF documents:

```typescript
import jsPDF from 'jspdf';

function addPayNowButton(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  paynowUrl: string,
  amount: number
) {
  // Orange button background
  doc.setFillColor('#F5831F');
  doc.roundedRect(x, y, width, height, 3, 3, 'F');

  // Button text
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#FFFFFF');
  doc.text('PAY NOW', x + width / 2, y + 12, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`R ${amount.toFixed(2)}`, x + width / 2, y + 22, { align: 'center' });

  // Clickable link area
  doc.link(x, y, width, height, { url: paynowUrl });
}
```

## PayNow URL Structure

```typescript
const PAYNOW_BASE = 'https://paynow.netcash.co.za/site/paynow.aspx';

function buildPayNowUrl(
  serviceKey: string,      // m1 - NetCash service key
  pciVaultKey: string,     // m2 - PCI vault key (NOT vendor key!)
  reference: string,       // p2 - Payment reference (e.g., CT-INV2026-00005-timestamp)
  description: string,     // p3 - Payment description
  amount: number           // p4 - Amount in RANDS (decimal, not cents)
): string {
  return `${PAYNOW_BASE}?m1=${serviceKey}&m2=${pciVaultKey}&p2=${reference}&p3=${encodeURIComponent(description)}&p4=${amount.toFixed(2)}`;
}
```

### Common Mistakes (that cause R0.00 or payment failures)

| Wrong | Correct | Why |
|-------|---------|-----|
| `m2=vendor_key` | `m2=pci_vault_key` | m2 must be PCI vault key |
| `Amount=89900` (cents) | `p4=899.00` (Rands) | API expects decimal Rands |
| `m4=amount` | `p4=amount` | Parameter name is p4, not m4 |

## Branded Email Template Structure

```html
<!-- CircleTel branded email structure -->
<body style="background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table width="600" style="margin: 0 auto; background: #FFFFFF; border-radius: 12px;">

    <!-- Logo Header -->
    <tr>
      <td style="padding: 32px 40px; text-align: center; border-bottom: 1px solid #E5E7EB;">
        <img src="https://www.circletel.co.za/images/circletel-logo.png" width="160">
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 40px;">
        <!-- Dark card for emphasis -->
        <table style="background: linear-gradient(135deg, #1F2937, #374151); border-radius: 12px;">
          <tr>
            <td style="padding: 24px;">
              <p style="color: #9CA3AF; font-size: 11px;">TOTAL DUE</p>
              <p style="color: #F5831F; font-size: 28px; font-weight: 700;">R 1,998.00</p>
            </td>
          </tr>
        </table>

        <!-- Orange CTA button -->
        <a href="{paynow_url}" style="display: block; background: #F5831F; color: #FFFFFF; text-align: center; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Pay Now
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 40px; background: #1F2937; text-align: center;">
        <p style="color: #9CA3AF; font-size: 12px;">Circle Tel SA (Pty) Ltd</p>
      </td>
    </tr>
  </table>
</body>
```

## Sending Emails with PDF Attachments (Resend)

```typescript
const attachments = [
  {
    filename: 'Invoice-INV-2026-00005.pdf',
    content: Buffer.from(pdf.output('arraybuffer')).toString('base64')
  }
];

await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'CircleTel Billing <billing@notify.circletel.co.za>',
    to: ['customer@example.com'],
    subject: 'Your Invoice',
    html: emailHtml,
    attachments,
    reply_to: 'contactus@circletel.co.za',
  }),
});
```

## Script Execution

Always use `tsx` instead of `ts-node` for running scripts:

```bash
# Correct
npx tsx scripts/send-invoice.ts

# Wrong (module resolution errors)
npx ts-node scripts/send-invoice.ts
```

## Related Files

- `lib/invoices/invoice-pdf-generator.ts` - Base invoice PDF with branding
- `lib/quotes/circletel-logo-base64.ts` - Logo for PDF embedding
- `scripts/send-jeffrey-prins-branded.ts` - Complete example with all patterns

## Time Savings

- Reusable PDF button: ~15 min per implementation
- Email template structure: ~30 min per new email type
- PayNow URL builder: Prevents debugging wrong parameters (~45 min saved)
