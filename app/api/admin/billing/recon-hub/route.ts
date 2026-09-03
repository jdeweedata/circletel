/**
 * GET /api/admin/billing/recon-hub
 *
 * Three-way cash-match hub: platform invoices ↔ Zoho Books ↔ Netcash.
 * Day-done = zero unmatched NetCash→CT AND zero CT-paid/Books-open in window.
 *
 * Query: ?window=today|yesterday|48h (default: yesterday)
 *        &includeBank=1 to run queue-only bank match (default on)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging';
import { resolveReconWindow } from '@/lib/billing/recon-hub/window';
import {
  buildExceptionRows,
  countUnmatchedCash,
} from '@/lib/billing/recon-hub/build-exceptions';
import {
  buildThreeWayInvoiceRows,
  countCtPaidBooksOpen,
} from '@/lib/billing/recon-hub/build-three-way';
import { runThreeWayBankMatch } from '@/lib/billing/recon-hub/run-bank-match';
import { displayName } from '@/lib/billing/recon-hub/party-identity';
import { getZohoBooksClient } from '@/lib/integrations/zoho/books-api-client';
import type {
  OpenArLike,
  PaymentLike,
  PaynowUnmatchedLike,
  ReconHubResponse,
  ReconHubSummary,
  ReconWindow,
  ThreeWayInvoiceLike,
} from '@/lib/billing/recon-hub/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_WINDOWS = new Set<ReconWindow>(['today', 'yesterday', '48h']);
const EXCEPTION_CAP = 150;
const PAYMENT_FETCH_LIMIT = 1000;
const BOOKS_STATUS_CAP = 40;

type PaynowReconStatus = ReconHubSummary['paynowRecon']['status'];

interface PaynowUnmatchedDetail {
  netcashRef?: string;
  yourRef?: string;
  amount?: number;
  reason?: string;
  date?: string;
  id?: string;
}

interface PaynowReconLoad {
  lastRunAt: string | null;
  status: PaynowReconStatus;
  durationMs: number;
  unmatchedFromLastRun: number;
  unmatchedDetails: PaynowUnmatchedDetail[];
}

function parseWindowParam(raw: string | null): ReconWindow {
  if (raw && VALID_WINDOWS.has(raw as ReconWindow)) {
    return raw as ReconWindow;
  }
  return 'yesterday';
}

function inWindow(iso: string | null | undefined, from: string, to: string): boolean {
  if (!iso) return false;
  return iso >= from && iso < to;
}

function mapPaynowRunStatus(dbStatus: string | null | undefined): PaynowReconStatus {
  if (!dbStatus) return null;
  if (dbStatus === 'completed' || dbStatus === 'success') return 'success';
  if (dbStatus === 'completed_with_errors' || dbStatus === 'partial') {
    return 'partial';
  }
  if (dbStatus === 'running') return null;
  return 'failed';
}

async function loadPaynowRecon(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PaynowReconLoad> {
  const empty: PaynowReconLoad = {
    lastRunAt: null,
    status: null,
    durationMs: 0,
    unmatchedFromLastRun: 0,
    unmatchedDetails: [],
  };

  const { data: latestRun, error } = await supabase
    .from('cron_execution_log')
    .select(
      'status, execution_start, execution_end, duration_seconds, execution_details, records_failed, records_processed'
    )
    .eq('job_name', 'paynow-reconciliation')
    .order('execution_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code !== 'PGRST116') {
      apiLogger.warn('[recon-hub] paynow recon log query failed', {
        error: error.message,
      });
    }
    return empty;
  }

  if (!latestRun) return empty;

  const details =
    (latestRun.execution_details as Record<string, unknown> | null) ?? {};
  const unmatchedDetails = (details.unmatchedDetails ??
    details.unmatched_details ??
    []) as PaynowUnmatchedDetail[];
  const unmatchedCount = Number(
    details.unmatched ?? unmatchedDetails.length ?? latestRun.records_failed ?? 0
  );
  const durationFromDetails = Number(details.duration_ms ?? 0);
  const durationMs =
    durationFromDetails ||
    (typeof latestRun.duration_seconds === 'number'
      ? Math.round(latestRun.duration_seconds * 1000)
      : 0);

  return {
    lastRunAt: latestRun.execution_start ?? null,
    status: mapPaynowRunStatus(latestRun.status),
    durationMs,
    unmatchedFromLastRun: Number.isFinite(unmatchedCount) ? unmatchedCount : 0,
    unmatchedDetails: Array.isArray(unmatchedDetails) ? unmatchedDetails : [],
  };
}

function mapPaynowUnmatched(
  details: PaynowUnmatchedDetail[],
  fallbackDate: string
): PaynowUnmatchedLike[] {
  return details.map((d, idx) => ({
    id: d.id ?? `paynow-unmatched-${idx}-${d.netcashRef ?? d.yourRef ?? idx}`,
    amount: Number(d.amount ?? 0),
    date: d.date ?? fallbackDate,
    netcashRef: d.netcashRef ?? d.yourRef ?? null,
  }));
}

/** Include all NetCash + statement sources writers actually use. */
const NETCASH_QUEUE_SOURCES = [
  'netcash_paynow',
  'netcash',
  'paynow',
  'netcash_debit',
  'netcash_statement',
] as const;

async function loadPendingQueueUnmatched(
  supabase: Awaited<ReturnType<typeof createClient>>,
  windowFrom: string,
  windowTo: string
): Promise<PaynowUnmatchedLike[]> {
  const { data, error } = await supabase
    .from('reconciliation_queue')
    .select(
      'id, amount, source_date, source_reference, payer_reference, created_at, source'
    )
    .eq('status', 'pending')
    .in('source', [...NETCASH_QUEUE_SOURCES])
    .order('source_date', { ascending: false })
    .limit(200);

  if (error) {
    apiLogger.warn('[recon-hub] reconciliation_queue query failed', {
      error: error.message,
    });
    return [];
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      amount: Number(row.amount ?? 0),
      date:
        (row.source_date as string) ||
        (row.created_at as string) ||
        new Date().toISOString(),
      netcashRef:
        (row.source_reference as string | null) ??
        (row.payer_reference as string | null) ??
        null,
    }))
    .filter((row) => {
      const d = row.date.length === 10 ? `${row.date}T00:00:00.000Z` : row.date;
      return inWindow(d, windowFrom, windowTo);
    });
}

async function enrichBooksStatus(
  linkedIds: string[]
): Promise<
  Map<string, { status: string; total: number; balance: number; customerName: string | null }>
> {
  const map = new Map<
    string,
    { status: string; total: number; balance: number; customerName: string | null }
  >();
  if (linkedIds.length === 0) return map;

  try {
    const client = getZohoBooksClient();
    const slice = linkedIds.slice(0, BOOKS_STATUS_CAP);
    await Promise.all(
      slice.map(async (id) => {
        try {
          const inv = await client.getInvoice(id);
          map.set(id, {
            status: inv.status,
            total: Number(inv.total ?? 0),
            balance: Number(inv.balance ?? 0),
            customerName: inv.customer_name ?? null,
          });
        } catch {
          // leave uncached
        }
      })
    );
  } catch (error) {
    apiLogger.warn('[recon-hub] Books status enrichment skipped', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return map;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const window = parseWindowParam(searchParams.get('window'));
    const includeBank = searchParams.get('includeBank') !== '0';
    const now = new Date();
    const bounds = resolveReconWindow(window, now);
    const { from: windowFrom, to: windowTo } = bounds;

    const supabase = await createClient();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const [
      paymentsResult,
      paynowRecon,
      queueUnmatched,
      windowInvoicesResult,
      openArResult,
      paidInvoicesResult,
      activeServicesResult,
      failedPaymentsResult,
      failedInvoicesResult,
    ] = await Promise.all([
      supabase
        .from('payment_transactions')
        .select(
          'id, status, amount, reference, provider_reference, completed_at, updated_at, invoice_id, customer_invoice_id, zoho_sync_status, zoho_books_payment_id'
        )
        .eq('provider', 'netcash')
        .eq('status', 'completed')
        .or(
          `completed_at.gte.${windowFrom},and(completed_at.is.null,updated_at.gte.${windowFrom})`
        )
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(PAYMENT_FETCH_LIMIT),

      loadPaynowRecon(supabase),
      loadPendingQueueUnmatched(supabase, windowFrom, windowTo),

      supabase
        .from('customer_invoices')
        .select(
          `id, invoice_number, status, invoice_date, due_date, total_amount, amount_due, amount_paid,
           zoho_books_invoice_id, zoho_sync_status, paynow_transaction_ref, customer_id,
           customer:customers(account_number, first_name, last_name, business_name)`
        )
        .or(
          `invoice_date.gte.${windowFrom.slice(0, 10)},paid_at.gte.${windowFrom},updated_at.gte.${windowFrom}`
        )
        .order('invoice_date', { ascending: false })
        .limit(300),

      supabase
        .from('customer_invoices')
        .select('id, invoice_number, amount_due, status, invoice_date, due_date')
        .in('status', ['sent', 'overdue', 'partial']),

      supabase
        .from('customer_invoices')
        .select('amount_paid, paid_at')
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgoIso),

      supabase
        .from('customer_services')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('payment_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('zoho_sync_status', 'failed'),

      supabase
        .from('customer_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('zoho_sync_status', 'failed'),
    ]);

    if (paymentsResult.error) {
      throw new Error(
        `payment_transactions query failed: ${paymentsResult.error.message}`
      );
    }

    const rawPayments = (paymentsResult.data ?? []).filter((p) => {
      const ts =
        (p.completed_at as string | null) ?? (p.updated_at as string | null);
      return inWindow(ts, windowFrom, windowTo);
    });

    const invoiceIds = Array.from(
      new Set(
        rawPayments
          .map(
            (p) =>
              (p.customer_invoice_id as string | null) ??
              (p.invoice_id as string | null)
          )
          .filter((id): id is string => Boolean(id))
      )
    );

    const invoiceMap = new Map<
      string,
      { invoice_number: string | null; status: string | null }
    >();

    if (invoiceIds.length > 0) {
      const { data: invoices, error: invError } = await supabase
        .from('customer_invoices')
        .select('id, invoice_number, status')
        .in('id', invoiceIds);

      if (invError) {
        apiLogger.warn('[recon-hub] invoice join failed', {
          error: invError.message,
        });
      } else {
        for (const inv of invoices ?? []) {
          invoiceMap.set(inv.id as string, {
            invoice_number: (inv.invoice_number as string | null) ?? null,
            status: (inv.status as string | null) ?? null,
          });
        }
      }
    }

    const payments: PaymentLike[] = rawPayments.map((p) => {
      const linkedId =
        (p.customer_invoice_id as string | null) ??
        (p.invoice_id as string | null) ??
        null;
      const inv = linkedId ? invoiceMap.get(linkedId) : undefined;
      return {
        id: p.id as string,
        status: (p.status as string) ?? 'completed',
        amount: Number(p.amount ?? 0),
        reference:
          (p.reference as string | null) ??
          (p.provider_reference as string | null) ??
          null,
        completed_at:
          (p.completed_at as string | null) ??
          (p.updated_at as string | null) ??
          null,
        customer_invoice_id: linkedId,
        invoice_number: inv?.invoice_number ?? null,
        invoice_status: inv?.status ?? null,
        zoho_sync_status: (p.zoho_sync_status as string | null) ?? null,
      };
    });

    const netcashCompletedInWindow = payments.length;
    const netcashMatchedInWindow = payments.filter((p) =>
      Boolean(p.customer_invoice_id)
    ).length;
    const zohoPaymentLagCount = payments.filter((p) => {
      if (!p.customer_invoice_id) return false;
      return p.zoho_sync_status === 'pending' || p.zoho_sync_status === 'failed';
    }).length;

    const fromLastRun = mapPaynowUnmatched(
      paynowRecon.unmatchedDetails,
      paynowRecon.lastRunAt ?? windowFrom
    ).filter((row) => {
      const d = row.date.length === 10 ? `${row.date}T00:00:00.000Z` : row.date;
      return inWindow(d, windowFrom, windowTo);
    });
    const paynowUnmatched: PaynowUnmatchedLike[] =
      fromLastRun.length > 0 ? fromLastRun : queueUnmatched;

    const openArRows: OpenArLike[] = (openArResult.data ?? []).map((inv) => ({
      id: inv.id as string,
      invoice_number: (inv.invoice_number as string | null) ?? null,
      amount: Number(inv.amount_due ?? 0),
      status: (inv.status as string | null) ?? null,
      date:
        (inv.due_date as string | null) ??
        (inv.invoice_date as string | null) ??
        '',
    }));

    const openAr = openArRows.reduce((sum, inv) => sum + inv.amount, 0);
    const collectedLast30Days = (paidInvoicesResult.data ?? []).reduce(
      (sum, inv) => sum + Number(inv.amount_paid ?? 0),
      0
    );

    // Active service names by customer
    const customerIds = Array.from(
      new Set(
        (windowInvoicesResult.data ?? [])
          .map((i) => i.customer_id as string)
          .filter(Boolean)
      )
    );
    const serviceByCustomer = new Map<
      string,
      { name: string; monthly: number }
    >();
    if (customerIds.length > 0) {
      const { data: services } = await supabase
        .from('customer_services')
        .select('customer_id, package_name, monthly_price, status, active')
        .in('customer_id', customerIds)
        .or('active.eq.true,status.eq.active');
      for (const s of services ?? []) {
        const cid = s.customer_id as string;
        if (!serviceByCustomer.has(cid)) {
          serviceByCustomer.set(cid, {
            name: (s.package_name as string) || 'Service',
            monthly: Number(s.monthly_price ?? 0),
          });
        }
      }
    }

    // Payments linked to window invoices
    const windowInvoiceIds = (windowInvoicesResult.data ?? []).map(
      (i) => i.id as string
    );
    const paymentByInvoice = new Map<
      string,
      { ref: string | null; matched: boolean; zoho: string | null }
    >();
    if (windowInvoiceIds.length > 0) {
      const idChunk = windowInvoiceIds.slice(0, 100);
      const [{ data: byCustomerInv }, { data: byInvoiceId }] = await Promise.all([
        supabase
          .from('payment_transactions')
          .select(
            'customer_invoice_id, invoice_id, reference, provider_reference, status, zoho_sync_status'
          )
          .eq('status', 'completed')
          .in('customer_invoice_id', idChunk)
          .limit(500),
        supabase
          .from('payment_transactions')
          .select(
            'customer_invoice_id, invoice_id, reference, provider_reference, status, zoho_sync_status'
          )
          .eq('status', 'completed')
          .in('invoice_id', idChunk)
          .limit(500),
      ]);
      for (const p of [...(byCustomerInv ?? []), ...(byInvoiceId ?? [])]) {
        const id =
          (p.customer_invoice_id as string | null) ||
          (p.invoice_id as string | null);
        if (!id) continue;
        paymentByInvoice.set(id, {
          ref:
            (p.reference as string | null) ||
            (p.provider_reference as string | null),
          matched: true,
          zoho: (p.zoho_sync_status as string | null) ?? null,
        });
      }
    }

    const booksIds = (windowInvoicesResult.data ?? [])
      .map((i) => i.zoho_books_invoice_id as string | null)
      .filter((id): id is string => Boolean(id));
    const booksMap = await enrichBooksStatus(booksIds);

    const threeWayInput: ThreeWayInvoiceLike[] = (windowInvoicesResult.data ?? [])
      .filter((inv) => {
        const d = (inv.invoice_date as string | null) || '';
        const dateIso = d.length === 10 ? `${d}T00:00:00.000Z` : d;
        // Include if invoice_date in window OR status paid with any activity
        return (
          inWindow(dateIso, windowFrom, windowTo) ||
          ['paid', 'voided', 'partial', 'sent'].includes(
            String(inv.status || '').toLowerCase()
          )
        );
      })
      .map((inv) => {
        const cid = inv.customer_id as string;
        const svc = serviceByCustomer.get(cid);
        const pay = paymentByInvoice.get(inv.id as string);
        const booksId = inv.zoho_books_invoice_id as string | null;
        const books = booksId ? booksMap.get(booksId) : undefined;
        const customer = inv.customer as
          | {
              account_number?: string | null;
              first_name?: string | null;
              last_name?: string | null;
              business_name?: string | null;
            }
          | {
              account_number?: string | null;
              first_name?: string | null;
              last_name?: string | null;
              business_name?: string | null;
            }[]
          | null;
        const cust = Array.isArray(customer) ? customer[0] : customer;
        const accountNumber = cust?.account_number;
        const customerDisplayName = cust
          ? displayName({
              first_name: cust.first_name,
              last_name: cust.last_name,
              business_name: cust.business_name,
            })
          : null;

        return {
          id: inv.id as string,
          invoice_number: (inv.invoice_number as string | null) ?? null,
          status: (inv.status as string) || 'unknown',
          invoice_date: (inv.invoice_date as string | null) ?? null,
          due_date: (inv.due_date as string | null) ?? null,
          total_amount: Number(inv.total_amount ?? 0),
          amount_due: Number(inv.amount_due ?? 0),
          amount_paid: Number(inv.amount_paid ?? 0),
          zoho_books_invoice_id: booksId,
          zoho_sync_status: (inv.zoho_sync_status as string | null) ?? null,
          paynow_transaction_ref:
            (inv.paynow_transaction_ref as string | null) ?? null,
          customer_id: cid,
          account_number: accountNumber ?? null,
          customer_display_name: customerDisplayName || null,
          books_customer_name: books?.customerName ?? null,
          service_name: svc?.name ?? null,
          monthly_price: svc?.monthly ?? null,
          books_status: books?.status ?? null,
          books_total: books?.total ?? null,
          books_balance: books?.balance ?? null,
          netcash_matched: Boolean(pay?.matched),
          netcash_ref: pay?.ref ?? null,
          payment_zoho_sync_status: pay?.zoho ?? null,
        };
      });

    const threeWayInvoices = buildThreeWayInvoiceRows(threeWayInput);
    const ctPaidBooksOpenCount = countCtPaidBooksOpen(threeWayInvoices);

    let bankExceptions: ReconHubResponse['exceptions'] = [];
    let bankMatch: ReconHubSummary['bankMatch'] = {
      netcashOnlyCount: 0,
      booksOnlyCount: 0,
      driftCount: 0,
    };
    if (includeBank) {
      try {
        const bank = await runThreeWayBankMatch(windowFrom, windowTo, 'queue_only');
        bankExceptions = bank.exceptions;
        bankMatch = {
          netcashOnlyCount: bank.summary.netcashOnlyCount,
          booksOnlyCount: bank.summary.booksOnlyCount,
          driftCount: bank.summary.driftCount,
        };
      } catch (error) {
        apiLogger.warn('[recon-hub] bank match skipped', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const failedEntityCount =
      (failedPaymentsResult.count ?? 0) + (failedInvoicesResult.count ?? 0);
    let zohoHealth: ReconHubSummary['zohoBooks']['healthStatus'] = 'unknown';
    if (!failedPaymentsResult.error && !failedInvoicesResult.error) {
      zohoHealth = failedEntityCount > 0 ? 'degraded' : 'healthy';
    }

    const exceptionRows = buildExceptionRows({
      payments,
      paynowUnmatched,
      openArInvoices: openArRows,
      threeWayRows: threeWayInvoices,
      bankMismatchRows: bankExceptions,
    });

    exceptionRows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const exceptions = exceptionRows.slice(0, EXCEPTION_CAP);

    // Day-done (final): unmatched Netcash→CT clear, CT paid mirrored in Books,
    // and no Netcash bank lines left without a Books match in the window.
    const unmatchedNetcashToCt = countUnmatchedCash(
      exceptionRows.filter(
        (r) =>
          r.reasonCode === 'no_ct_invoice' ||
          r.reasonCode === 'paynow_unmatched'
      )
    );
    const bankBlockers =
      (bankMatch?.netcashOnlyCount ?? 0) + (bankMatch?.driftCount ?? 0);
    const dayDone =
      unmatchedNetcashToCt === 0 &&
      ctPaidBooksOpenCount === 0 &&
      bankBlockers === 0;

    const summary: ReconHubSummary = {
      window,
      windowFrom,
      windowTo,
      unmatchedNetcashToCt,
      netcashCompletedInWindow,
      netcashMatchedInWindow,
      zohoPaymentLagCount,
      ctPaidBooksOpenCount,
      dayDone,
      paynowRecon: {
        lastRunAt: paynowRecon.lastRunAt,
        status: paynowRecon.status,
        durationMs: paynowRecon.durationMs,
        unmatchedFromLastRun: paynowRecon.unmatchedFromLastRun,
      },
      zohoBooks: {
        healthStatus: zohoHealth,
        failedEntityCount,
      },
      bankMatch,
      secondary: {
        openAr,
        collectedLast30Days,
        activeServices: activeServicesResult.count ?? 0,
      },
    };

    const body: ReconHubResponse = { summary, exceptions, threeWayInvoices };
    return NextResponse.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[recon-hub] Failed to build hub response', { error: message });
    return NextResponse.json(
      { error: 'Failed to load recon hub' },
      { status: 500 }
    );
  }
}
