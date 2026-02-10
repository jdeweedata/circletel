# Billing Automation Implementation Learnings

**Date**: 2026-02-10
**Session Focus**: Automated billing workflow with Pay Now fallback

## Summary

Implemented end-to-end billing automation:
- Monthly invoices trigger debit orders for eMandate customers
- Non-eMandate customers receive Pay Now links via email + SMS
- Failed debit orders automatically fallback to Pay Now
- Webhook reconciles payments back to invoices

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20260209000001_add_paynow_tracking.sql` | Pay Now tracking columns |
| `lib/billing/paynow-billing-service.ts` | Pay Now URL generation & notifications |
| `lib/billing/failed-debit-handler.ts` | Auto-fallback on debit failure |
| `app/api/cron/process-billing-day/route.ts` | Daily billing processor |

## Patterns

### 1. Supabase Join Returns Array

When using Supabase's foreign key joins with `.single()`, the joined table data comes back as an array, not an object.

```typescript
// WRONG - will fail type check
const customerEmail = invoice.customer.email;

// CORRECT - handle array
const customerData = Array.isArray(invoice.customer)
  ? invoice.customer[0]
  : invoice.customer;
const customerEmail = customerData?.email;
```

**Why**: Supabase's PostgREST can return multiple related records, so it defaults to array format even with `.single()` on the parent.

### 2. Billing Service Layer Structure

Organize billing services by action + domain:

```
lib/billing/
├── types.ts                    # Shared types
├── invoice-notification-service.ts  # Invoice emails
├── paynow-billing-service.ts   # Pay Now generation + sending
├── failed-debit-handler.ts     # Debit failure handling
└── index.ts                    # Exports (optional)
```

**Pattern**: `{action}-{domain}-service.ts`

### 3. Cron with Dry Run Support

All billing crons should support dry run for safe production testing:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dryRun === true;

  // In processing loop
  if (dryRun) {
    cronLogger.info('Dry run - skipping actual processing');
    return result;
  }

  // Actual processing...
}
```

**Usage**: `curl -X POST /api/cron/process-billing-day -d '{"dryRun": true}'`

### 4. SMS Template Organization

Group SMS templates as typed const object:

```typescript
const SMS_TEMPLATES = {
  paymentDue: (name: string, invoice: string, amount: number, url: string) =>
    `Hi ${name}, your CircleTel invoice ${invoice} for R${amount.toFixed(2)} is due. Pay: ${url}`,

  debitFailed: (name: string, invoice: string, amount: number, url: string) =>
    `Hi ${name}, your debit order for ${invoice} failed. Pay here: ${url}`,
} as const;

// Usage with type safety
const message = SMS_TEMPLATES.paymentDue(name, invoiceNum, amount, url);
```

### 5. Webhook Transaction Reference Lookup

Store transaction ref on invoice when generating Pay Now, enables webhook reconciliation:

```typescript
// When generating Pay Now
await supabase.from('customer_invoices').update({
  paynow_transaction_ref: transactionRef,  // CT-{invoiceId}-{timestamp}
});

// In webhook handler
const { data: invoice } = await supabase
  .from('customer_invoices')
  .select('*')
  .eq('paynow_transaction_ref', transactionId)
  .single();
```

## Friction Points

### Supabase CLI Not Linked

**Error**: `Cannot find project ref. Have you run supabase link?`

**Solutions**:
1. Link project: `npx supabase link --project-ref agyjovdugmtopasyvlng`
2. Or apply SQL manually via Dashboard → SQL Editor

**Prevention**: Check for `.supabase/` folder before running Supabase CLI commands.

## Architecture Decisions

### Cron Timing

| Cron | Time (SAST) | Purpose |
|------|-------------|---------|
| submit-debit-orders | 06:00 | Process eMandate customers |
| process-billing-day | 07:00 | Send Pay Now to non-eMandate |

One hour gap ensures debit orders are queued before Pay Now fallback runs.

### Email Template Inline vs React Email

Chose inline HTML template in service because:
- Single-purpose template (Pay Now notification)
- No complex dynamic content
- Faster iteration without build step

Consider extracting to React Email if template needs reuse or complex logic.

## Testing Commands

```bash
# Dry run - no notifications sent
curl -X POST https://www.circletel.co.za/api/cron/process-billing-day \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"dryRun": true}'

# Test specific date
curl -X POST https://www.circletel.co.za/api/cron/process-billing-day \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"date": "2026-02-15", "dryRun": true}'
```

### 6. 3-State Mandate Validation

Use enum-style returns instead of boolean when state matters for messaging:

```typescript
// WRONG - loses important state information
async function verifyActiveMandate(customerId: string): Promise<boolean> {
  // Can't differentiate "pending" from "none"
}

// CORRECT - enables targeted messaging
async function checkMandateStatus(
  customerId: string
): Promise<'active' | 'pending' | 'none'> {
  const { data: paymentMethod } = await supabase
    .from('customer_payment_methods')
    .select('mandate_status, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .maybeSingle();

  if (!paymentMethod) return 'none';

  const isVerified = paymentMethod.encrypted_details?.verified === true;
  const mandateActive = paymentMethod.mandate_status === 'active';

  if (isVerified && mandateActive) return 'active';
  return 'pending';  // Exists but not complete
}
```

**Benefit**: Different SMS/email templates for pending vs none:
- `pending` → "Complete your debit order setup"
- `none` → "Set up debit order for hassle-free payments"

### 7. Date Validation Before DB Insert

Always validate dates to prevent epoch (1970-01-01) bugs:

```typescript
// In API route or service
const dueDate = new Date(effectiveBillingDate);
if (isNaN(dueDate.getTime()) || dueDate.getFullYear() < 2000) {
  return NextResponse.json(
    { success: false, error: `Invalid due_date: ${effectiveBillingDate}` },
    { status: 400 }
  );
}

// In UI rendering
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
    return 'Invalid date';
  }
  return date.toLocaleDateString('en-ZA', { ... });
};
```

**Why**: Unix epoch (0) converts to "01 Jan 1970" which confuses users.

### 8. eMandate Fallback with Reminder

When eMandate is pending, include CTA to complete setup:

```typescript
if (skippedInvoices.length > 0) {
  for (const skipped of skippedInvoices) {
    await PayNowBillingService.processPayNowForInvoice(
      skipped.invoiceId,
      {
        sendEmail: true,
        sendSms: true,
        smsTemplate: 'emandatePending',  // Targeted template
        includeEmandateReminder: true,   // Add CTA to email
      }
    );
  }
}
```

## Related Files

- `lib/payments/netcash-service.ts` - NetCash Pay Now URL generation
- `lib/integrations/clickatell/sms-service.ts` - SMS sending
- `app/api/payments/webhook/route.ts` - Payment reconciliation
- `app/api/cron/submit-debit-orders/route.ts` - Debit order processing

## Pending Actions

- [ ] Apply migration `20260209000001_add_paynow_tracking.sql`
- [ ] Apply migration `20260210000001_fix_invalid_due_dates.sql`
- [ ] Test billing crons with dry run in production
- [ ] Monitor first real billing day execution
