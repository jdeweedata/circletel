# Invoice Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add branded print-ready HTML invoice preview pages accessible from the admin customer billing tab, admin invoice management page, and customer dashboard.

**Architecture:** A shared `InvoicePreview` client component fetches from `${apiEndpoint}/${invoiceId}/preview`. Two new API routes (admin + dashboard) call a shared data assembly function that wraps the existing `buildInvoiceData()` helper. Three thin server page wrappers complete the feature.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase service role + session clients, Tailwind CSS, `react-icons/pi`, existing `InvoiceData` interfaces from `lib/invoices/invoice-pdf-generator.ts`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/invoices/invoice-preview-data.ts` | Data assembly — queries DB, calls `buildInvoiceData()`, ownership check |
| Create | `app/api/admin/billing/invoices/[id]/preview/route.ts` | Admin GET — service role, no ownership check |
| Create | `app/api/dashboard/invoices/[id]/preview/route.ts` | Dashboard GET — customer auth + ownership |
| Create | `components/invoices/InvoicePreview.tsx` | Shared branded component with print CSS |
| Create | `app/admin/customers/[id]/invoices/[invoiceId]/page.tsx` | Thin admin-customer page wrapper |
| Create | `app/admin/billing/invoices/[id]/preview/page.tsx` | Thin admin-billing page wrapper |
| Create | `app/dashboard/invoices/[id]/page.tsx` | Dashboard page wrapper with auth redirect |
| Modify | `components/admin/customers/CustomerBillingTab.tsx` | Add eye-icon View link per invoice row |
| Modify | `app/admin/billing/invoices/[id]/page.tsx` | Add "Preview Invoice" button to action bar |

---

## Task 1: Data Assembly Function

**Files:**
- Create: `lib/invoices/invoice-preview-data.ts`

- [ ] **Step 1: Create `lib/invoices/invoice-preview-data.ts`**

```typescript
/**
 * Invoice Preview Data Assembly
 * Shared library for building InvoicePreviewData from the database.
 * Used by admin and customer-dashboard preview API routes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildInvoiceData,
  type InvoiceData,
} from './invoice-pdf-generator';

export interface InvoicePreviewData extends InvoiceData {
  amountPaid: number;
  amountDue: number;
}

export interface InvoicePreviewOptions {
  /**
   * When set, validates invoice.customer_id === customerId.
   * Throws 'FORBIDDEN' if mismatch — used by dashboard route.
   */
  customerId?: string;
}

export async function assembleInvoicePreviewData(
  supabase: SupabaseClient,
  invoiceId: string,
  options: InvoicePreviewOptions = {}
): Promise<{ invoice: InvoicePreviewData }> {
  // 1. Fetch invoice
  const { data: rawInvoice, error: invoiceError } = await supabase
    .from('customer_invoices')
    .select(
      'id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, amount_due, status, period_start, period_end, line_items, notes, customer_id'
    )
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !rawInvoice) {
    console.error(
      '[invoice-preview-data] Invoice lookup failed:',
      invoiceError?.message ?? 'no data returned'
    );
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // 2. Ownership check (dashboard context)
  if (options.customerId && rawInvoice.customer_id !== options.customerId) {
    throw new Error('FORBIDDEN');
  }

  // 3. Fetch customer
  const { data: rawCustomer, error: customerError } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone, account_number')
    .eq('id', rawInvoice.customer_id)
    .single();

  if (customerError || !rawCustomer) {
    console.error(
      '[invoice-preview-data] Customer lookup failed:',
      customerError?.message ?? 'no data returned'
    );
    throw new Error(`Customer for invoice ${invoiceId} not found`);
  }

  // 4. Build InvoiceData using existing helper
  const invoiceData = buildInvoiceData({
    invoice: {
      id: rawInvoice.id,
      invoice_number: rawInvoice.invoice_number,
      invoice_date: rawInvoice.invoice_date,
      due_date: rawInvoice.due_date,
      period_start: rawInvoice.period_start ?? undefined,
      period_end: rawInvoice.period_end ?? undefined,
      subtotal: parseFloat(String(rawInvoice.subtotal ?? 0)),
      tax_amount: parseFloat(String(rawInvoice.tax_amount ?? 0)),
      total_amount: parseFloat(String(rawInvoice.total_amount ?? 0)),
      line_items: Array.isArray(rawInvoice.line_items) ? rawInvoice.line_items : [],
      notes: rawInvoice.notes ?? undefined,
      status: rawInvoice.status ?? undefined,
    },
    customer: {
      first_name: rawCustomer.first_name ?? '',
      last_name: rawCustomer.last_name ?? '',
      email: rawCustomer.email ?? '',
      phone: rawCustomer.phone ?? undefined,
      account_number: rawCustomer.account_number ?? undefined,
    },
  });

  // 5. Extend with payment fields
  const invoice: InvoicePreviewData = {
    ...invoiceData,
    amountPaid: parseFloat(String(rawInvoice.amount_paid ?? 0)),
    amountDue: parseFloat(String(rawInvoice.amount_due ?? 0)),
  };

  return { invoice };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/invoices/invoice-preview-data.ts
git commit -m "feat(billing): add invoice preview data assembly function"
```

---

## Task 2: Admin API Route

**Files:**
- Create: `app/api/admin/billing/invoices/[id]/preview/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
/**
 * Admin Invoice Preview API
 * GET /api/admin/billing/invoices/[id]/preview
 *
 * Returns assembled InvoicePreviewData for any invoice.
 * Uses service role — admin layout handles session auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assembleInvoicePreviewData } from '@/lib/invoices/invoice-preview-data';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { invoice } = await assembleInvoicePreviewData(supabase, id);

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: `Invoice ${id} not found` },
        { status: 404 }
      );
    }

    apiLogger.error('[Invoice Preview] Error', { invoiceId: id, error: message });
    return NextResponse.json(
      { success: false, error: 'Failed to load invoice' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Smoke-test the route**

```bash
# Get any invoice ID from the DB
curl -s "https://agyjovdugmtopasyvlng.supabase.co/rest/v1/customer_invoices?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# Then hit the dev server:
# curl http://localhost:3000/api/admin/billing/invoices/<id>/preview
```

Expected: `{ "success": true, "invoice": { "invoiceNumber": "...", ... } }`

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/billing/invoices/\[id\]/preview/route.ts
git commit -m "feat(billing): add admin invoice preview API route"
```

---

## Task 3: Dashboard API Route

**Files:**
- Create: `app/api/dashboard/invoices/[id]/preview/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
/**
 * Dashboard Invoice Preview API
 * GET /api/dashboard/invoices/[id]/preview
 *
 * Returns InvoicePreviewData for a single invoice owned by the
 * logged-in customer. Returns 403 if the invoice belongs to someone else.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientWithSession } from '@/lib/supabase/server';
import { assembleInvoicePreviewData } from '@/lib/invoices/invoice-preview-data';
import { billingLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // 1. Auth: Bearer header first, then session cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let user: { id: string } | null = null;

    if (token) {
      const anonClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user: tokenUser }, error } = await anonClient.auth.getUser(token);
      if (error || !tokenUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      user = tokenUser;
    } else {
      const sessionClient = await createClientWithSession();
      const { data: { session }, error } = await sessionClient.auth.getSession();
      if (error || !session?.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      user = session.user;
    }

    // 2. Resolve customer ID from auth user
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: customer, error: customerError } = await serviceClient
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    // 3. Assemble with ownership enforcement
    const { invoice } = await assembleInvoicePreviewData(
      serviceClient,
      id,
      { customerId: customer.id }
    );

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === 'FORBIDDEN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ success: false, error: `Invoice ${id} not found` }, { status: 404 });
    }

    billingLogger.error('[Dashboard Invoice Preview] Error', { invoiceId: id, error: message });
    return NextResponse.json({ success: false, error: 'Failed to load invoice' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/dashboard/invoices/\[id\]/preview/route.ts
git commit -m "feat(billing): add dashboard invoice preview API route with ownership check"
```

---

## Task 4: InvoicePreview Component

**Files:**
- Create: `components/invoices/InvoicePreview.tsx`

- [ ] **Step 1: Create `components/invoices/InvoicePreview.tsx`**

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  PiPrinterBold,
  PiDownloadSimpleBold,
  PiSpinnerBold,
  PiFileTextBold,
} from 'react-icons/pi';
import { COMPANY_DETAILS } from '@/lib/invoices/invoice-pdf-generator';
import type { InvoicePreviewData } from '@/lib/invoices/invoice-preview-data';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePreviewProps {
  invoiceId: string;
  apiEndpoint: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatLongDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'paid':    return 'bg-green-100 text-green-800';
    case 'overdue': return 'bg-red-100 text-red-800';
    case 'sent':    return 'bg-blue-100 text-blue-800';
    case 'draft':   return 'bg-gray-100 text-gray-800';
    default:        return 'bg-yellow-100 text-yellow-800';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoicePreview({ invoiceId, apiEndpoint }: InvoicePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoicePreviewData | null>(null);

  // Inject print CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'invoice-print-css';
    style.textContent = `
      @media print {
        @page { size: A4; margin: 15mm; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .invoice-section { page-break-inside: avoid; break-inside: avoid; }
        table { page-break-inside: auto; }
        tr { page-break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById('invoice-print-css');
      if (el) document.head.removeChild(el);
    };
  }, []);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiEndpoint}/${invoiceId}/preview`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error ?? 'Failed to load invoice');
        } else {
          setInvoice(data.invoice);
        }
      } catch {
        setError('Network error — please try again');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [invoiceId, apiEndpoint]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <PiSpinnerBold className="h-8 w-8 animate-spin text-[#F5831F] mx-auto mb-2" />
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <PiFileTextBold className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Invoice Not Available</h2>
          <p className="text-gray-500 text-sm">{error ?? 'Failed to fetch invoice data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">

      {/* ── ACTION BAR (hidden on print) ── */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex items-center justify-end gap-3 px-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PiPrinterBold className="h-4 w-4" />
          Print
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#F5831F] rounded-lg hover:bg-[#e07010] transition-colors"
        >
          <PiDownloadSimpleBold className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      {/* ── INVOICE DOCUMENT ── */}
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-10">

        {/* ── 1. HEADER ── */}
        <div className="invoice-section flex items-start justify-between mb-6">
          <div className="flex-shrink-0">
            <Image
              src="/images/circletel-logo.png"
              alt="CircleTel"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 tracking-wide">TAX INVOICE</h1>
            <p className="text-gray-500 text-sm mt-1">
              Invoice Date: {formatLongDate(invoice.invoiceDate)}
            </p>
            <p className="text-gray-500 text-sm">
              Due Date: {formatLongDate(invoice.dueDate)}
            </p>
            <p className="text-gray-700 font-mono text-sm mt-1">
              {invoice.invoiceNumber}
            </p>
            {invoice.status && (
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium uppercase ${getStatusStyle(invoice.status)}`}
              >
                {invoice.status}
              </span>
            )}
          </div>
        </div>

        {/* ── ORANGE RULE ── */}
        <div className="h-1 rounded mb-6" style={{ backgroundColor: '#F5831F' }} />

        {/* ── 2. FROM / TO ── */}
        <div className="invoice-section grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
            <p className="font-bold text-gray-900">{COMPANY_DETAILS.name}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.line1}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.line2}</p>
            <p className="text-sm text-gray-600">
              {COMPANY_DETAILS.address.province} {COMPANY_DETAILS.address.postalCode}
            </p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.address.country}</p>
            <p className="text-sm text-gray-600 mt-1">VAT No: {COMPANY_DETAILS.vatNumber}</p>
            <p className="text-sm text-gray-600">Reg No: {COMPANY_DETAILS.registrationNumber}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.contact.email}</p>
            <p className="text-sm text-gray-600">{COMPANY_DETAILS.contact.website}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">To</p>
            <p className="font-bold text-gray-900">{invoice.customer.name}</p>
            {invoice.customer.accountNumber && (
              <p className="text-sm text-gray-600">Account: {invoice.customer.accountNumber}</p>
            )}
            {invoice.customer.email && (
              <p className="text-sm text-gray-600">{invoice.customer.email}</p>
            )}
            {invoice.customer.phone && (
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            )}
            {invoice.customer.address?.line1 && (
              <>
                <p className="text-sm text-gray-600 mt-1">{invoice.customer.address.line1}</p>
                {invoice.customer.address.line2 && (
                  <p className="text-sm text-gray-600">{invoice.customer.address.line2}</p>
                )}
                {invoice.customer.address.city && (
                  <p className="text-sm text-gray-600">{invoice.customer.address.city}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── 3. LINE ITEMS TABLE ── */}
        <div className="invoice-section mb-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Line Items
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-600 border border-gray-200">
                  Description
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-16">
                  Qty
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Unit Price (excl)
                </th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-16">
                  VAT %
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Amount (excl)
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 border border-gray-200 w-28">
                  Amount (incl)
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.length > 0 ? (
                invoice.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900 border border-gray-200">
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 border border-gray-200">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700 border border-gray-200">
                      {item.vat_percent}%
                    </td>
                    <td className="py-2 px-3 text-right text-gray-700 border border-gray-200">
                      {formatCurrency(item.excl_total)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-gray-900 border border-gray-200">
                      {formatCurrency(item.incl_total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-3 px-3 text-center text-gray-400 border border-gray-200"
                  >
                    Service Invoice
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 4. VAT SUMMARY ── */}
        <div className="invoice-section flex justify-end mb-6">
          <div className="w-72 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal (excl VAT)</span>
              <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT (15%)</span>
              <span className="font-mono">{formatCurrency(invoice.totalVat)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total (incl VAT)</span>
              <span className="font-mono">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* ── 5. PAYMENT SUMMARY ── */}
        <div className="invoice-section flex justify-end mb-8">
          <div className="w-72 bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-mono font-medium text-green-600">
                {formatCurrency(invoice.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Amount Due</span>
              <span
                className={`font-mono ${
                  invoice.amountDue > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(invoice.amountDue)}
              </span>
            </div>
          </div>
        </div>

        {/* ── 6. BANKING DETAILS ── */}
        <div className="invoice-section mb-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Banking Details
          </h2>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-900">{COMPANY_DETAILS.banking.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Branch Code</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.branchCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Name</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Type</span>
                <span className="font-medium text-gray-900">
                  {COMPANY_DETAILS.banking.accountType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account Number</span>
                <span className="font-medium text-gray-900 font-mono">
                  {COMPANY_DETAILS.banking.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reference</span>
                <span className="font-medium text-[#F5831F] font-mono">
                  {invoice.customer.accountNumber ?? invoice.invoiceNumber}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Please use your account number as payment reference:{' '}
              <strong>{invoice.customer.accountNumber ?? invoice.invoiceNumber}</strong>
            </p>
          </div>
        </div>

        {/* ── 7. NOTES (conditional) ── */}
        {invoice.notes && (
          <div className="invoice-section mb-6">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Notes</h2>
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{invoice.notes}</p>
          </div>
        )}

        {/* ── 8. FOOTER ── */}
        <div className="border-t border-gray-200 pt-4 mt-6 text-center text-xs text-gray-400">
          <p>
            {COMPANY_DETAILS.name} | Reg: {COMPANY_DETAILS.registrationNumber} | VAT:{' '}
            {COMPANY_DETAILS.vatNumber}
          </p>
          <p>
            {COMPANY_DETAILS.address.line1}, {COMPANY_DETAILS.address.line2} |{' '}
            {COMPANY_DETAILS.contact.email} | {COMPANY_DETAILS.contact.website}
          </p>
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/invoices/InvoicePreview.tsx
git commit -m "feat(billing): add InvoicePreview shared component"
```

---

## Task 5: Page Wrappers

**Files:**
- Create: `app/admin/customers/[id]/invoices/[invoiceId]/page.tsx`
- Create: `app/admin/billing/invoices/[id]/preview/page.tsx`
- Create: `app/dashboard/invoices/[id]/page.tsx`

- [ ] **Step 1: Create `app/admin/customers/[id]/invoices/[invoiceId]/page.tsx`**

```tsx
import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string; invoiceId: string }>;
}

export default async function AdminCustomerInvoicePage({ params }: Props) {
  const { invoiceId } = await params;
  return (
    <InvoicePreview
      invoiceId={invoiceId}
      apiEndpoint="/api/admin/billing/invoices"
    />
  );
}
```

- [ ] **Step 2: Create `app/admin/billing/invoices/[id]/preview/page.tsx`**

```tsx
import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminBillingInvoicePreviewPage({ params }: Props) {
  const { id } = await params;
  return (
    <InvoicePreview
      invoiceId={id}
      apiEndpoint="/api/admin/billing/invoices"
    />
  );
}
```

- [ ] **Step 3: Create `app/dashboard/invoices/[id]/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InvoicePreview from '@/components/invoices/InvoicePreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardInvoicePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirect=/dashboard/invoices/${id}`);
  }

  return (
    <InvoicePreview
      invoiceId={id}
      apiEndpoint="/api/dashboard/invoices"
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add \
  app/admin/customers/\[id\]/invoices/\[invoiceId\]/page.tsx \
  app/admin/billing/invoices/\[id\]/preview/page.tsx \
  app/dashboard/invoices/\[id\]/page.tsx
git commit -m "feat(billing): add invoice preview page wrappers (admin + dashboard)"
```

---

## Task 6: Navigation Links

**Files:**
- Modify: `components/admin/customers/CustomerBillingTab.tsx`
- Modify: `app/admin/billing/invoices/[id]/page.tsx`

- [ ] **Step 1: Add eye icon import to `CustomerBillingTab.tsx`**

Find the existing import line:
```tsx
import { PiArrowSquareOutBold, PiArrowsClockwiseBold, PiCheckCircleBold, PiFileTextBold, PiPackageBold, PiPaperPlaneRightBold, PiWarningCircleBold } from 'react-icons/pi';
```

Replace with:
```tsx
import { PiArrowSquareOutBold, PiArrowsClockwiseBold, PiCheckCircleBold, PiEyeBold, PiFileTextBold, PiPackageBold, PiPaperPlaneRightBold, PiWarningCircleBold } from 'react-icons/pi';
```

- [ ] **Step 2: Add View link to each invoice row in `CustomerBillingTab.tsx`**

Find this block (inside the invoice row, in the `flex items-center gap-3` div):
```tsx
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendPayNow(invoice.id)}
                        disabled={actionLoading === `paynow-${invoice.id}`}
                      >
                        {actionLoading === `paynow-${invoice.id}` ? (
                          <PiArrowsClockwiseBold className="h-4 w-4 animate-spin" />
                        ) : (
                          <PiPaperPlaneRightBold className="h-4 w-4" />
                        )}
                      </Button>
                    )}
```

Replace with:
```tsx
                    <Link
                      href={`/admin/customers/${customerId}/invoices/${invoice.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                      title="View Invoice"
                    >
                      <PiEyeBold className="h-4 w-4 text-gray-500" />
                    </Link>
                    {invoice.status !== 'paid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendPayNow(invoice.id)}
                        disabled={actionLoading === `paynow-${invoice.id}`}
                      >
                        {actionLoading === `paynow-${invoice.id}` ? (
                          <PiArrowsClockwiseBold className="h-4 w-4 animate-spin" />
                        ) : (
                          <PiPaperPlaneRightBold className="h-4 w-4" />
                        )}
                      </Button>
                    )}
```

- [ ] **Step 3: Add Preview Invoice button to `app/admin/billing/invoices/[id]/page.tsx`**

Add `PiEyeBold` to the existing pi import at the top of the file:
```tsx
import { PiArrowLeftBold, PiArrowSquareOutBold, PiArrowsClockwiseBold, PiBuildingBold, PiCalendarBold, PiCheckCircleBold, PiClockBold, PiCreditCardBold, PiCurrencyDollarBold, PiDownloadSimpleBold, PiEnvelopeBold, PiEyeBold, PiFileTextBold, PiLightningBold, PiPlusCircleBold, PiSpinnerBold, PiUserBold, PiWarningBold, PiXCircleBold } from 'react-icons/pi';
```

Find the action button group (the `flex gap-2` div containing "Record Payment", "Send Reminder", "Download PDF"):
```tsx
        <div className="flex gap-2">
          {invoice.status !== 'paid' && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowPaymentDialog(true)}
            >
              <PiPlusCircleBold className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
          <Button variant="outline">
            <PiEnvelopeBold className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
          <Button variant="outline">
            <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
```

Replace with:
```tsx
        <div className="flex gap-2">
          {invoice.status !== 'paid' && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowPaymentDialog(true)}
            >
              <PiPlusCircleBold className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/admin/billing/invoices/${id}/preview`} target="_blank">
              <PiEyeBold className="h-4 w-4 mr-2" />
              Preview Invoice
            </Link>
          </Button>
          <Button variant="outline">
            <PiEnvelopeBold className="h-4 w-4 mr-2" />
            Send Reminder
          </Button>
          <Button variant="outline">
            <PiDownloadSimpleBold className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
```

Note: the admin invoice page uses `useParams()` — check for `const params = useParams()` near the top. The `id` used in the href above comes from `params.id`. Verify the variable name is `id` by checking line ~15 of the file where params is destructured.

- [ ] **Step 4: Commit**

```bash
git add \
  components/admin/customers/CustomerBillingTab.tsx \
  app/admin/billing/invoices/\[id\]/page.tsx
git commit -m "feat(billing): add invoice preview navigation links to admin UI"
```

---

## Task 7: Type Check & Push

- [ ] **Step 1: Run type check**

```bash
cd /home/circletel && npm run type-check:memory 2>&1 | tail -20
```

Expected: `Found 0 errors.`

If errors appear, fix them before continuing. Common issues:
- `InvoicePreviewData` not imported where used → add `import type { InvoicePreviewData } from '@/lib/invoices/invoice-preview-data'`
- `formatDate` unused → remove the import (only `formatLongDate` is used in the component)
- `useParams` id variable name in admin invoice page → check actual destructuring

- [ ] **Step 2: Push to main**

```bash
git push origin main
```

---

## Verification Checklist

After deployment:

- [ ] `/admin/customers/[known-id]/invoices/[known-invoice-id]` — branded invoice renders
- [ ] `/admin/billing/invoices/[known-id]/preview` — same invoice from billing context
- [ ] "Preview Invoice" button visible on `/admin/billing/invoices/[id]`
- [ ] Eye icon visible on each invoice row in customer billing tab
- [ ] `/dashboard/invoices/[id]` as logged-in customer — own invoice renders
- [ ] `/dashboard/invoices/[other-customer-invoice-id]` — returns 403 error state
- [ ] Click Print → browser print dialog shows A4 invoice
- [ ] Unauthenticated `/dashboard/invoices/[id]` → redirects to `/login?redirect=...`
