# Invoice Display & PDF Download — Design Spec

**Date**: 2026-04-01
**Status**: Draft
**Scope**: Customer portal billing dashboard — invoices tab + PDF download

---

## Problem

The invoices tab at `/dashboard/billing` has 5 issues preventing customers from viewing and downloading invoices:

1. **PDF download always fails** — API endpoint queries non-existent `pdf_url` column (actual column is `zoho_pdf_url`, and it's NULL for all invoices anyway)
2. **No on-the-fly PDF generation** — The SARS-compliant generator exists but is never wired into the download endpoint
3. **Status mismatch** — DB uses `sent`/`unpaid`/`partial`/`refunded` but frontend only handles `paid`/`pending`/`overdue`/`cancelled`
4. **Dead "Download PDF" button on invoice detail page** — No click handler (Server Component can't have onClick)
5. **Invoice detail auth broken** — Uses `createClient()` instead of `createClientWithSession()` for `getUser()`

## Approach: Generate PDFs On-the-Fly

Rewrite the PDF endpoint to generate invoices in real-time using the existing `buildInvoiceData()` + `generateInvoicePDFBuffer()` from `lib/invoices/invoice-pdf-generator.ts`. No storage, no migration needed.

---

## Changes

### 1. Rewrite PDF API Endpoint

**File**: `app/api/dashboard/invoices/[id]/pdf/route.ts`

**Current**: Tries to read `pdf_url` from DB, download from Supabase Storage. Fails because column doesn't exist.

**New**:
- Fetch full invoice from `customer_invoices` (all columns needed for PDF)
- Fetch customer details from `customers` (name, email, phone, address)
- Optionally fetch order for address (`consumer_orders`)
- Call `buildInvoiceData({ invoice, customer, order })` to transform DB data to `InvoiceData`
- Call `generateInvoicePDFBuffer(invoiceData)` to produce PDF
- Return as `application/pdf` with appropriate Content-Disposition header
- Keep existing auth pattern (Bearer token + cookie fallback)

### 2. Fix Status Mapping in Billing API

**File**: `app/api/dashboard/billing/route.ts` (line 148)

Map DB statuses to frontend statuses:
- `unpaid` / `sent` / `draft` → `pending`
- `partial` → `pending` (with partial indicator)
- `refunded` → `cancelled`
- `paid`, `overdue`, `cancelled` → pass through

Update the frontend `Invoice` interface to optionally include `amount_paid` for partial display.

### 3. Fix Status Badge on Billing Page

**File**: `app/dashboard/billing/page.tsx` (lines ~419-424)

Ensure badge rendering handles all mapped statuses. Currently only checks `paid`, `pending`, `overdue`. Add visual distinction for the mapped statuses.

### 4. Fix Invoice Detail Page Auth

**File**: `app/dashboard/invoices/[id]/page.tsx` (line 29)

Change `createClient()` to `createClientWithSession()` so `getUser()` can read the session cookie.

### 5. Fix "Download PDF" Button on Invoice Detail Page

**File**: `app/dashboard/invoices/[id]/page.tsx` (line 176-179)

The page is a Server Component, so it can't have `onClick`. Two options:
- **Option A**: Make the button an `<a>` tag linking to `/api/dashboard/invoices/[id]/pdf?download=true` (simplest — the API handles auth via cookies)
- **Option B**: Extract to a client component

**Chosen**: Option A — simplest, works because the PDF API already supports cookie auth.

```tsx
<Button variant="outline" className="flex-1" asChild>
  <a href={`/api/dashboard/invoices/${id}/pdf?download=true`} target="_blank" rel="noopener noreferrer">
    <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
    Download PDF
  </a>
</Button>
```

### 6. Add `sent` Status Badge on Invoice Detail Page

**File**: `app/dashboard/invoices/[id]/page.tsx` (lines 61-74)

Add `sent` case to `getStatusBadge()` to show a blue/info badge for sent invoices.

---

## Files Modified (5 files)

| File | Change |
|------|--------|
| `app/api/dashboard/invoices/[id]/pdf/route.ts` | Rewrite to generate PDF on-the-fly |
| `app/api/dashboard/billing/route.ts` | Fix status mapping (sent/unpaid → pending) |
| `app/dashboard/billing/page.tsx` | Ensure badge handles all statuses |
| `app/dashboard/invoices/[id]/page.tsx` | Fix auth, fix PDF button, add sent status |
| _(no new files)_ | |

## Existing Code Reused

| Function | File | Purpose |
|----------|------|---------|
| `buildInvoiceData()` | `lib/invoices/invoice-pdf-generator.ts:437` | Transforms DB rows to `InvoiceData` |
| `generateInvoicePDFBuffer()` | `lib/invoices/invoice-pdf-generator.ts:428` | Generates PDF as ArrayBuffer |
| `createClientWithSession()` | `lib/supabase/server.ts` | Cookie-aware Supabase client |

## Not Changed

- No database migration needed
- No new storage buckets
- No new dependencies (jsPDF + jspdf-autotable already installed)
- Invoice detail `/pay` page — already works correctly

---

## Verification

1. Log in as customer (`jeffrey@newgenre.co.za` or similar)
2. Navigate to `/dashboard/billing` → Invoices tab
3. Confirm all 6 invoices display with correct status badges (paid = green, sent = blue/pending)
4. Click PDF icon on any invoice → should download a SARS-compliant PDF
5. Click "View" on any invoice → detail page loads (not 401/redirect loop)
6. On detail page, click "Download PDF" → should download PDF
7. Run `npm run type-check:memory` — no new errors
