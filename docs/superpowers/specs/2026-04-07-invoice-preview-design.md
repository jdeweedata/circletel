# Invoice Preview Design

**Date**: 2026-04-07
**Status**: Approved
**Pattern**: Mirrors `feature/statement-preview` implementation

---

## Overview

Branded, print-ready HTML invoice preview pages for individual `customer_invoices` records. Accessible from three entry points: admin customer billing tab, admin invoice management page, and customer dashboard. Supports Print and Download PDF via `window.print()`.

---

## Files to Create

### 1. Data Assembly
**`lib/invoices/invoice-preview-data.ts`**
- `assembleInvoicePreviewData(supabase, invoiceId, options?)` function
- Queries `customer_invoices` + `customers` tables
- Parses `line_items` JSONB column into `InvoiceLineItem[]`
- Reuses `InvoiceData`, `InvoiceLineItem`, `InvoiceCustomer` interfaces from `invoice-pdf-generator.ts`
- Accepts optional `{ customerId: string }` constraint — when provided, validates `invoice.customer_id === customerId` and throws 403 if mismatch (dashboard ownership check)
- Returns `{ invoice: InvoiceData }`

### 2. Admin API Route
**`app/api/admin/billing/invoices/[id]/preview/route.ts`**
- `GET` handler, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`
- Service role Supabase client
- Admin auth: Bearer header first, fallback to cookies + `admin_users` table check
- Calls `assembleInvoicePreviewData(supabase, id)` — no customer constraint
- Returns `{ success: true, invoice: InvoiceData }` or 401/404/500

### 3. Dashboard API Route
**`app/api/dashboard/invoices/[id]/route.ts`**
- `GET` handler, `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`
- Customer auth: Bearer header first, fallback to `createClientWithSession()` → `auth.getUser()` → lookup `customers.id` by `auth_user_id`
- Calls `assembleInvoicePreviewData(supabase, id, { customerId })` — enforces ownership
- Returns `{ success: true, invoice: InvoiceData }` or 401/403/404/500

### 4. Shared Preview Component
**`components/invoices/InvoicePreview.tsx`** (~500 lines, `'use client'`)
- Props: `invoiceId: string`, `apiEndpoint: string`
- Fetches from `${apiEndpoint}/${invoiceId}` on mount
- Sections:
  - **Action bar** (print-hidden): Print button, Download PDF button
  - **CircleTel header**: logo left, "TAX INVOICE" title right
  - Invoice number, date, due date, status badge
  - **Orange rule** separator
  - **FROM / TO grid**: `COMPANY_DETAILS` left, customer details right (name, account number, email, phone)
  - **Line items table**: Description | Qty | Unit Price (excl VAT) | VAT % | Amount (excl) | Amount (incl)
  - **VAT summary**: Subtotal excl VAT → VAT (15%) → Total incl VAT (right-aligned)
  - **Payment summary**: Amount Paid (green) / Amount Due (red if > 0) / Status badge
  - **Banking details**: Standard Bank block (from `COMPANY_DETAILS`)
  - **Footer**: reg number, VAT number, contact details
- Print CSS injected via `useEffect` — A4, hides action bar, page-break safe
- PDF via `window.print()` — matches preview exactly

### 5. Admin Customer Invoice Page
**`app/admin/customers/[id]/invoices/[invoiceId]/page.tsx`**
- Thin server component wrapper
- Async params: `const { id, invoiceId } = await context.params`
- Renders `<InvoicePreview invoiceId={invoiceId} apiEndpoint="/api/admin/billing/invoices" />`

### 6. Admin Billing Invoice Preview Page
**`app/admin/billing/invoices/[id]/preview/page.tsx`**
- Thin server component wrapper
- Async params: `const { id } = await context.params`
- Renders `<InvoicePreview invoiceId={id} apiEndpoint="/api/admin/billing/invoices" />`

### 7. Dashboard Invoice Page
**`app/dashboard/invoices/[id]/page.tsx`**
- Server component, auth check → redirect to `/login?redirect=/dashboard/invoices/${id}` if not authed
- Renders `<InvoicePreview invoiceId={id} apiEndpoint="/api/dashboard/invoices" />`

---

## Files to Modify

| File | Change |
|------|--------|
| `components/admin/customers/CustomerBillingTab.tsx` | Add "View" link on each invoice row → `/admin/customers/${customerId}/invoices/${invoiceId}` |
| `app/admin/billing/invoices/[id]/page.tsx` | Add "Preview Invoice" button → `/admin/billing/invoices/${id}/preview` |
| `app/dashboard/invoices/page.tsx` | Add "View" link on each invoice row → `/dashboard/invoices/${invoiceId}` |

---

## Data Flow

```
Admin clicks "View" on invoice row
  → /admin/customers/[id]/invoices/[invoiceId]
  OR /admin/billing/invoices/[id]/preview
  → InvoicePreview fetches /api/admin/billing/invoices/[id]/preview
  → assembleInvoicePreviewData() queries customer_invoices + customers
  → Returns InvoiceData JSON
  → Component renders branded HTML
  → Print/Download: window.print()

Customer clicks "View" on dashboard invoice row
  → /dashboard/invoices/[id]
  → InvoicePreview fetches /api/dashboard/invoices/[id]
  → assembleInvoicePreviewData(supabase, id, { customerId }) — ownership enforced
  → Returns InvoiceData JSON
  → Same branded HTML render
```

---

## Key Reuse

| Asset | Reuse |
|-------|-------|
| `InvoiceData`, `InvoiceLineItem`, `InvoiceCustomer` interfaces | API return type + component state |
| `COMPANY_DETAILS` constant | FROM section, banking, footer |
| Statement preview layout | Print CSS, action bar, header/footer pattern |
| Auth patterns | Bearer + cookie dual-check from `auth-patterns.md` |

---

## Implementation Order

1. `lib/invoices/invoice-preview-data.ts`
2. `app/api/admin/billing/invoices/[id]/preview/route.ts`
3. `app/api/dashboard/invoices/[id]/route.ts`
4. `components/invoices/InvoicePreview.tsx`
5. `app/admin/customers/[id]/invoices/[invoiceId]/page.tsx`
6. `app/admin/billing/invoices/[id]/preview/page.tsx`
7. `app/dashboard/invoices/[id]/page.tsx`
8. Modify `CustomerBillingTab.tsx`, `app/admin/billing/invoices/[id]/page.tsx`, `app/dashboard/invoices/page.tsx`

---

## Verification

1. Navigate to `/admin/customers/[id]/invoices/[invoiceId]` — branded invoice renders with real data
2. Navigate to `/admin/billing/invoices/[id]/preview` — same invoice renders from billing context
3. Click Print — browser print dialog shows A4 invoice
4. Navigate to `/dashboard/invoices/[id]` as logged-in customer — own invoice only
5. Try `/dashboard/invoices/[other-customer-invoice-id]` — returns 403
6. Run `npm run type-check:memory` — no type errors
