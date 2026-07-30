/**
 * GET /api/admin/billing/recon-hub
 *
 * Daily cash-match hub for admin billing.
 * Day-done = zero unmatched NetCash → CircleTel invoice (red exceptions).
 *
 * Query: ?window=today|yesterday|48h (default: yesterday)
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
import type {
  OpenArLike,
  PaymentLike,
  PaynowUnmatchedLike,
  ReconHubResponse,
  ReconHubSummary,
  ReconWindow,
} from '@/lib/billing/recon-hub/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_WINDOWS = new Set<ReconWindow>(['today', 'yesterday', '48h']);
const EXCEPTION_CAP = 100;
const PAYMENT_FETCH_LIMIT = 1000;

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
  if (
    dbStatus === 'completed_with_errors' ||
    dbStatus === 'partial'
  ) {
    return 'partial';
  }
  if (dbStatus === 'running') return null;
  return 'failed';
}

/**
 * Load latest paynow-reconciliation cron row.
 * Live schema uses execution_start / execution_details / duration_seconds
 * (not started_at / result used by some older writers).
 */
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
    // PGRST116 = no rows; other errors log and return empty
    if (error.code !== 'PGRST116') {
      apiLogger.warn('[recon-hub] paynow recon log query failed', {
        error: error.message,
      });
    }
    return empty;
  }

  if (!latestRun) {
    return empty;
  }

  const details =
    (latestRun.execution_details as Record<string, unknown> | null) ?? {};
  const unmatchedDetails = (details.unmatchedDetails ??
    details.unmatched_details ??
    []) as PaynowUnmatchedDetail[];
  const unmatchedCount = Number(
    details.unmatched ??
      unmatchedDetails.length ??
      latestRun.records_failed ??
      0
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

/**
 * Pending reconciliation_queue rows are the durable store for PayNow cash
 * that never linked to a CT invoice (paynow recon upserts here).
 */
async function loadPendingQueueUnmatched(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PaynowUnmatchedLike[]> {
  const { data, error } = await supabase
    .from('reconciliation_queue')
    .select(
      'id, amount, source_date, source_reference, payer_reference, created_at'
    )
    .eq('status', 'pending')
    .order('source_date', { ascending: false })
    .limit(200);

  if (error) {
    apiLogger.warn('[recon-hub] reconciliation_queue query failed', {
      error: error.message,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
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
  }));
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const window = parseWindowParam(searchParams.get('window'));
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
      sentInvoicesResult,
      overdueInvoicesResult,
      paidInvoicesResult,
      activeServicesResult,
      failedPaymentsResult,
      failedInvoicesResult,
    ] = await Promise.all([
      // NetCash completed payments — filter window in JS (completed_at preferred)
      supabase
        .from('payment_transactions')
        .select(
          'id, status, amount, reference, provider_reference, completed_at, updated_at, invoice_id, customer_invoice_id, zoho_sync_status'
        )
        .eq('provider', 'netcash')
        .eq('status', 'completed')
        .or(
          `completed_at.gte.${windowFrom},and(completed_at.is.null,updated_at.gte.${windowFrom})`
        )
        .order('completed_at', { ascending: false, nullsFirst: false })
        .limit(PAYMENT_FETCH_LIMIT),

      loadPaynowRecon(supabase),
      loadPendingQueueUnmatched(supabase),

      supabase
        .from('customer_invoices')
        .select('id, invoice_number, amount_due, status, invoice_date, due_date')
        .eq('status', 'sent'),

      supabase
        .from('customer_invoices')
        .select('id, invoice_number, amount_due, status, invoice_date, due_date')
        .eq('status', 'overdue'),

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
      const ts = (p.completed_at as string | null) ?? (p.updated_at as string | null);
      return inWindow(ts, windowFrom, windowTo);
    });

    // Join customer_invoices for number/status
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
    const netcashMatchedInWindow = payments.filter(
      (p) => Boolean(p.customer_invoice_id)
    ).length;
    const zohoPaymentLagCount = payments.filter((p) => {
      if (!p.customer_invoice_id) return false;
      return p.zoho_sync_status === 'pending' || p.zoho_sync_status === 'failed';
    }).length;

    // Prefer last-run unmatched details; fall back to pending queue
    const fromLastRun = mapPaynowUnmatched(
      paynowRecon.unmatchedDetails,
      paynowRecon.lastRunAt ?? windowFrom
    );
    const paynowUnmatched: PaynowUnmatchedLike[] =
      fromLastRun.length > 0 ? fromLastRun : queueUnmatched;

    const openArRows: OpenArLike[] = [
      ...(sentInvoicesResult.data ?? []),
      ...(overdueInvoicesResult.data ?? []),
    ].map((inv) => ({
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
    });

    exceptionRows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const exceptions = exceptionRows.slice(0, EXCEPTION_CAP);

    const unmatchedNetcashToCt = countUnmatchedCash(exceptionRows);

    const summary: ReconHubSummary = {
      window,
      windowFrom,
      windowTo,
      unmatchedNetcashToCt,
      netcashCompletedInWindow,
      netcashMatchedInWindow,
      zohoPaymentLagCount,
      dayDone: unmatchedNetcashToCt === 0,
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
      secondary: {
        openAr,
        collectedLast30Days,
        activeServices: activeServicesResult.count ?? 0,
      },
    };

    const body: ReconHubResponse = { summary, exceptions };
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
