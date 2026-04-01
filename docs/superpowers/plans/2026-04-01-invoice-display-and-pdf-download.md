# Invoice Display & PDF Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 bugs that prevent invoices from displaying correctly and PDF downloads from working on the customer billing portal at `/dashboard/billing`.

**Architecture:** Four files are modified — no new files, no migrations. The PDF endpoint is rewritten to generate PDFs on-the-fly using the existing SARS-compliant generator (`lib/invoices/invoice-pdf-generator.ts`). Status mapping is fixed in the billing API. Badges and detail page are updated to handle all real DB status values.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (Postgres), jsPDF + jspdf-autotable (already installed)

---

## File Map

| File | What changes |
|------|-------------|
| `app/api/dashboard/invoices/[id]/pdf/route.ts` | **Rewrite** — generate PDF on-the-fly instead of reading from storage |
| `app/api/dashboard/billing/route.ts` | **Fix line 148** — map `sent`/`unpaid`/`draft`→`pending`, `partial`→`pending`, `refunded`→`cancelled` |
| `app/dashboard/billing/page.tsx` | **Fix lines 419–424** — badge variant for `paid`/`pending`/`overdue` with correct colours |
| `app/dashboard/invoices/[id]/page.tsx` | **Fix 3 things** — auth client, PDF button, `sent` status badge |

---

## Task 1: Rewrite PDF Generation Endpoint

**Files:**
- Modify: `app/api/dashboard/invoices/[id]/pdf/route.ts`

### Background

The current endpoint tries to read `invoice.pdf_url` from the DB — a column that doesn't exist (the real column is `zoho_pdf_url` and all invoices have it as NULL). This means **every** PDF download returns 404 "PDF not yet generated".

The fix: fetch the invoice + customer row, pass them to the existing `buildInvoiceData()` + `generateInvoicePDFBuffer()` helpers, and stream the result directly. No storage needed.

Key function signatures from `lib/invoices/invoice-pdf-generator.ts`:

```typescript
// Transforms DB rows → InvoiceData
buildInvoiceData(params: {
  invoice: { id, invoice_number, invoice_date, due_date, period_start?, period_end?,
              subtotal, tax_amount?, vat_amount?, total_amount, line_items, notes?, status? };
  customer: { first_name, last_name, email, phone?, account_number?,
               business_name?, business_registration?, tax_number? };
  order?: { installation_address?, city?, province?, postal_code? };
}): InvoiceData

// Generates PDF bytes — runs jsPDF in Node.js
generateInvoicePDFBuffer(invoice: InvoiceData): ArrayBuffer
```

The `customers` table has all required fields: `first_name`, `last_name`, `email`, `phone`, `account_number`, `business_name`, `business_registration`, `tax_number`.

The `consumer_orders` table has address fields: `installation_address`, `city`, `province`, `postal_code`, `customer_id`.

- [ ] **Step 1: Verify the current endpoint fails**

```bash
# Get a valid invoice ID first
curl -s -X GET "https://www.circletel.co.za/api/dashboard/billing" \
  -H "Authorization: Bearer <your_token>" | python3 -c "
import sys,json; d=json.load(sys.stdin)
for inv in d['data']['invoices'][:2]:
    print(inv['id'], inv['invoice_number'])
"
# Then attempt PDF download
curl -v "https://www.circletel.co.za/api/dashboard/invoices/<invoice_id>/pdf?download=true" \
  -H "Authorization: Bearer <your_token>"
# Expected: 404 {"error":"PDF not yet generated"}
```

- [ ] **Step 2: Replace the entire PDF route with the on-the-fly generator**

Replace `app/api/dashboard/invoices/[id]/pdf/route.ts` with:

```typescript
/**
 * Customer Invoice PDF — generate on-the-fly
 * GET /api/dashboard/invoices/[id]/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { buildInvoiceData, generateInvoicePDFBuffer } from '@/lib/invoices/invoice-pdf-generator';
import { billingLogger } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Auth: Bearer token OR cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: { id: string } | null = null;
    let supabase: ReturnType<typeof createClient>;

    if (token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: { user: tokenUser }, error } = await supabase.auth.getUser(token);
      if (error || !tokenUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = tokenUser;
    } else {
      supabase = await createServerClient() as ReturnType<typeof createClient>;
      const { data: { user: cookieUser }, error } = await supabase.auth.getUser();
      if (error || !cookieUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = cookieUser;
    }

    // Resolve customer_id from auth user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, business_name, business_registration, tax_number')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch invoice — verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('customer_invoices')
      .select('id, invoice_number, invoice_date, due_date, period_start, period_end, subtotal, tax_amount, total_amount, amount_paid, amount_due, line_items, notes, status')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Optionally fetch most-recent order for installation address
    const { data: order } = await supabase
      .from('consumer_orders')
      .select('installation_address, city, province, postal_code')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Build InvoiceData and generate PDF
    const invoiceData = buildInvoiceData({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        period_start: invoice.period_start ?? undefined,
        period_end: invoice.period_end ?? undefined,
        subtotal: parseFloat(invoice.subtotal) || 0,
        tax_amount: invoice.tax_amount ? parseFloat(invoice.tax_amount) : undefined,
        total_amount: parseFloat(invoice.total_amount) || 0,
        line_items: invoice.line_items || [],
        notes: invoice.notes ?? undefined,
        status: invoice.status,
      },
      customer: {
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone ?? undefined,
        account_number: customer.account_number ?? undefined,
        business_name: customer.business_name ?? undefined,
        business_registration: customer.business_registration ?? undefined,
        tax_number: customer.tax_number ?? undefined,
      },
      order: order ? {
        installation_address: order.installation_address ?? undefined,
        city: order.city ?? undefined,
        province: order.province ?? undefined,
        postal_code: order.postal_code ?? undefined,
      } : undefined,
    });

    const pdfBuffer = generateInvoicePDFBuffer(invoiceData);

    const disposition = request.nextUrl.searchParams.get('download') === 'true'
      ? 'attachment'
      : 'inline';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    billingLogger.error('Unexpected error generating invoice PDF', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep "pdf/route"
# Expected: no lines output (no errors in this file)
```

- [ ] **Step 4: Smoke-test the endpoint locally**

```bash
# Start dev server in a separate terminal if not already running:
# npm run dev:memory

# Test with a real invoice ID and session token from browser DevTools
curl -s "http://localhost:3000/api/dashboard/invoices/<invoice_id>/pdf?download=true" \
  -H "Authorization: Bearer <session_token>" \
  --output /tmp/test-invoice.pdf
file /tmp/test-invoice.pdf
# Expected: /tmp/test-invoice.pdf: PDF document, version 1.x
```

- [ ] **Step 5: Commit**

```bash
git add app/api/dashboard/invoices/[id]/pdf/route.ts
git commit -m "fix(billing): generate invoice PDFs on-the-fly instead of reading from storage

Rewrites PDF endpoint to call buildInvoiceData() + generateInvoicePDFBuffer()
from the existing SARS-compliant generator. Removes dependency on pdf_url
column (which doesn't exist in customer_invoices). All 6 existing invoices
are now downloadable immediately."
```

---

## Task 2: Fix Status Mapping in Billing API

**Files:**
- Modify: `app/api/dashboard/billing/route.ts` (line 148)

### Background

The `customer_invoices` table uses DB statuses: `paid`, `sent`, `unpaid`, `partial`, `overdue`, `cancelled`, `refunded`, `draft`. The billing page TypeScript interface only declares `'paid' | 'pending' | 'overdue' | 'cancelled'`. The word `pending` never appears in the DB — it's a frontend concept. Right now `sent` invoices are type-cast unsafely and fall through to a gray badge.

Mapping:
- `unpaid` → `pending` (customer owes, not yet overdue)
- `sent` → `pending` (invoice sent, awaiting payment)
- `draft` → `pending` (shouldn't appear in portal but handle gracefully)
- `partial` → `pending` (partially paid, still owes)
- `refunded` → `cancelled`
- `paid`, `overdue`, `cancelled` → pass through unchanged

- [ ] **Step 1: Locate the exact line**

```bash
grep -n "inv.status as" /home/circletel/app/api/dashboard/billing/route.ts
# Expected: 148:      status: inv.status as 'paid' | 'pending' | 'overdue' | 'cancelled',
```

- [ ] **Step 2: Replace the status cast with a mapping function**

In `app/api/dashboard/billing/route.ts`, replace line 148:

```typescript
// BEFORE (line 148):
status: inv.status as 'paid' | 'pending' | 'overdue' | 'cancelled',

// AFTER — add the helper above the transformedInvoices block (around line 139),
// then use it in the map:
```

Add this helper function immediately before the `const transformedInvoices` line (~line 139):

```typescript
const mapInvoiceStatus = (dbStatus: string): 'paid' | 'pending' | 'overdue' | 'cancelled' => {
  switch (dbStatus) {
    case 'paid':     return 'paid';
    case 'overdue':  return 'overdue';
    case 'cancelled':
    case 'refunded': return 'cancelled';
    case 'unpaid':
    case 'sent':
    case 'draft':
    case 'partial':
    default:         return 'pending';
  }
};
```

Then update line 148 to:

```typescript
status: mapInvoiceStatus(inv.status),
```

- [ ] **Step 3: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep "billing/route"
# Expected: no lines output
```

- [ ] **Step 4: Commit**

```bash
git add app/api/dashboard/billing/route.ts
git commit -m "fix(billing): map DB invoice statuses to frontend status enum

DB uses sent/unpaid/partial/refunded/draft — frontend only knows
paid/pending/overdue/cancelled. Adds mapInvoiceStatus() helper so
sent/unpaid/draft/partial all display as pending instead of being
unsafely cast."
```

---

## Task 3: Fix Invoice Status Badges on Billing Page

**Files:**
- Modify: `app/dashboard/billing/page.tsx` (lines 419–424)

### Background

After Task 2, invoices will now correctly have status `pending` for what the DB calls `sent`/`unpaid`. The billing page badge currently only colours `paid` (green) and `overdue` (red), everything else falls to shadcn's `secondary` (gray). We need `pending` to show as yellow/warning, and `cancelled` as gray, matching the visual convention used across the admin.

The Badge component accepts `variant` prop: `'default' | 'secondary' | 'destructive' | 'outline'`. We also apply Tailwind overrides via `className`.

- [ ] **Step 1: Locate the badge block**

```bash
grep -n "invoice.status === 'paid'" /home/circletel/app/dashboard/billing/page.tsx
# Expected: line ~419
```

- [ ] **Step 2: Update the badge**

Replace the existing `<Badge>` block (lines 419–425) with:

```tsx
<Badge
  className={`text-xs font-semibold ${
    invoice.status === 'paid'
      ? 'bg-green-100 text-green-800 border-green-200'
      : invoice.status === 'overdue'
      ? 'bg-red-100 text-red-800 border-red-200'
      : invoice.status === 'pending'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-gray-100 text-gray-600 border-gray-200'
  } border`}
  variant="outline"
>
  {invoice.status === 'pending' ? 'UNPAID' : invoice.status.toUpperCase()}
</Badge>
```

> Note: We display `UNPAID` as the label for `pending` — friendlier than `PENDING` for a customer facing a payment they owe.

- [ ] **Step 3: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep "billing/page"
# Expected: no lines output
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/billing/page.tsx
git commit -m "fix(billing): colour-code invoice status badges

paid=green, overdue=red, pending/unpaid=amber, cancelled=gray.
Shows 'UNPAID' label for pending status — clearer for customers."
```

---

## Task 4: Fix Invoice Detail Page (Auth + PDF Button + Sent Badge)

**Files:**
- Modify: `app/dashboard/invoices/[id]/page.tsx`

### Background

Three independent bugs in this single file:

1. **Auth broken**: Line 29 uses `createClient()` (service role, no cookies) then calls `getUser()`. Per `auth-patterns.md`, `getUser()` always returns null with `createClient()` — must use `createClientWithSession()`. Effect: any logged-in customer hitting `/dashboard/invoices/[id]` gets redirected to `/login`.

2. **Download PDF button is dead**: Lines 176–179 — a Server Component can't have `onClick`. The button renders but does nothing. Fix: use `asChild` with an `<a>` tag pointing at the PDF API endpoint. The PDF API supports cookie auth (no token header needed from a browser link click).

3. **`sent` status not handled**: `getStatusBadge()` handles `paid`, `unpaid`, `overdue`, `draft` but not `sent`. Two of the six invoices in production have `sent` status and will show a plain `{status}` badge with `variant="outline"` (no colour).

- [ ] **Step 1: Verify the auth bug**

```bash
# Open an incognito browser window, log in, navigate to:
# https://www.circletel.co.za/dashboard/billing
# Click "View" on any invoice
# Expected (broken): redirected to /login?redirect=/dashboard/invoices/<id>
# After fix: invoice detail page loads
```

- [ ] **Step 2: Fix auth — change createClient to createClientWithSession**

In `app/dashboard/invoices/[id]/page.tsx`:

Replace line 11:
```typescript
// BEFORE:
import { createClient } from '@/lib/supabase/server';

// AFTER:
import { createClientWithSession } from '@/lib/supabase/server';
```

Replace line 29:
```typescript
// BEFORE:
const supabase = await createClient();

// AFTER:
const supabase = await createClientWithSession();
```

- [ ] **Step 3: Add `sent` to getStatusBadge**

In `app/dashboard/invoices/[id]/page.tsx`, the `getStatusBadge` function currently starts at line 61. Replace it entirely:

```typescript
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 border border-green-200">Paid</Badge>;
    case 'unpaid':
    case 'sent':
      return <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Unpaid</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800 border border-red-200">Overdue</Badge>;
    case 'partial':
      return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Partial</Badge>;
    case 'cancelled':
    case 'refunded':
      return <Badge variant="secondary">Cancelled</Badge>;
    case 'draft':
      return <Badge variant="outline">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
```

- [ ] **Step 4: Fix the dead "Download PDF" button**

In `app/dashboard/invoices/[id]/page.tsx`, replace lines 176–179:

```tsx
// BEFORE:
<Button variant="outline" className="flex-1">
  <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
  Download PDF
</Button>

// AFTER:
<Button variant="outline" className="flex-1" asChild>
  <a
    href={`/api/dashboard/invoices/${id}/pdf?download=true`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
    Download PDF
  </a>
</Button>
```

This works because:
- The Server Component renders an `<a>` tag — no JavaScript needed
- The PDF API endpoint (`/api/dashboard/invoices/[id]/pdf`) accepts cookie auth
- `target="_blank"` opens the PDF in a new tab; `?download=true` sets `Content-Disposition: attachment`

- [ ] **Step 5: Type-check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep "invoices/\[id\]"
# Expected: no lines output
```

- [ ] **Step 6: Full type-check across all changed files**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -5
# Expected: exit 0, only pre-existing unrelated errors
```

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/invoices/[id]/page.tsx
git commit -m "fix(billing): fix invoice detail page auth, PDF button, and status badges

- Switch createClient() → createClientWithSession() so getUser() can
  read session cookie (was always returning null, redirecting to login)
- Fix dead 'Download PDF' button: Server Component can't have onClick,
  replace with asChild <a href='/api/.../pdf?download=true'>
- Add sent/partial/refunded cases to getStatusBadge() — 2 of 6 live
  invoices have sent status and showed no colour"
```

---

## Task 5: End-to-End Verification

- [ ] **Step 1: Run type check one final time**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | grep -E "(billing|invoices)" | grep -v "^$"
# Expected: no new errors in billing or invoice files
```

- [ ] **Step 2: Test invoices tab displays correctly**

1. Open browser → log in as a customer with invoices (e.g. `jeffrey@newgenre.co.za`)
2. Navigate to `/dashboard/billing` → **Invoices** tab
3. Confirm invoices list renders — should see `INV-2026-xxxxx` entries
4. Confirm badge colours: paid invoices show green, sent/unpaid show amber "UNPAID"

- [ ] **Step 3: Test PDF download from billing page**

1. On the Invoices tab, click the **PDF** button on any invoice
2. Expected: browser downloads a file named `INV-2026-xxxxx.pdf`
3. Open the file — should show CircleTel logo, invoice number, customer name, line items, Standard Bank payment details

- [ ] **Step 4: Test invoice detail page**

1. Click **View** on any invoice
2. Expected: detail page loads at `/dashboard/invoices/<id>` (no redirect to login)
3. Status badge shows the correct colour
4. Click **Download PDF** → browser downloads the PDF (opens in new tab or triggers download)

- [ ] **Step 5: Test overdue/cancelled statuses (if applicable)**

If you have test invoices with other statuses, verify their badge colours. If not, spot-check by temporarily changing a test invoice's status in the Supabase dashboard.

- [ ] **Step 6: Push to staging first, then main**

```bash
git push origin main:staging
# Verify on https://circletel-staging.vercel.app/dashboard/billing

# Then push to production
git push origin main
```

---

## Summary of Changes

| File | Lines changed | Bug fixed |
|------|--------------|-----------|
| `app/api/dashboard/invoices/[id]/pdf/route.ts` | Full rewrite (~140 lines) | PDF always 404 — queries non-existent column |
| `app/api/dashboard/billing/route.ts` | +8 lines (helper + 1 line change) | `sent`/`unpaid` cast wrong, show as gray |
| `app/dashboard/billing/page.tsx` | ~6 lines | Badge only coloured paid/overdue |
| `app/dashboard/invoices/[id]/page.tsx` | ~20 lines | Auth redirect loop + dead PDF button + no `sent` badge |
