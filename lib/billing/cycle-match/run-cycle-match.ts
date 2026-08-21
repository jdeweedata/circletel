/**
 * Snapshot every customer_service for a billing month against
 * customer_invoices + payment_transactions, then persist matches/exceptions.
 */

import { createClient } from '@/lib/supabase/server';
import { billingLogger } from '@/lib/logging';
import { formatExceptionCode, formatServiceDisplayId } from './format';
import { monthBounds } from './period';
import { normalizePlatformAmounts } from './normalize-amounts';
import { scoreCycleMatch } from './score-match';
import type { CycleMatchInput, ScoredCycleMatch, ServiceStatus } from './types';

export interface RunCycleMatchOptions {
  yearMonth: string;
  triggeredBy: 'cron' | 'manual';
  userId?: string | null;
}

export interface RunCycleMatchResult {
  runId: string;
  yearMonth: string;
  servicesChecked: number;
  exceptionCount: number;
}

interface ServiceRow {
  id: string;
  customer_id: string;
  package_name: string;
  service_type: string | null;
  product_category: string | null;
  monthly_price: number;
  status: string;
  active: boolean | null;
  activation_date: string | null;
  cancelled_at: string | null;
}

interface InvoiceRow {
  id: string;
  service_id: string | null;
  customer_id: string;
  invoice_number: string | null;
  invoice_date: string | null;
  period_start: string | null;
  period_end: string | null;
  subtotal: number;
  total_amount: number;
  status: string;
  zoho_books_invoice_id: string | null;
  paynow_transaction_ref: string | null;
}

interface PaymentRow {
  customer_invoice_id: string | null;
  amount: number;
  status: string;
  provider_reference: string | null;
  reference: string | null;
  completed_at: string | null;
}

function invoiceInMonth(inv: InvoiceRow, start: string, end: string): boolean {
  const period = inv.period_start;
  const date = inv.invoice_date;
  if (period && period >= start && period <= end) return true;
  if (date && date >= start && date <= end) return true;
  return false;
}

export async function runCycleMatch(
  options: RunCycleMatchOptions
): Promise<RunCycleMatchResult> {
  const { periodMonth, start, end, yearMonth } = monthBounds(options.yearMonth);
  const supabase = await createClient();

  const { data: run, error: runError } = await supabase
    .from('cycle_match_runs')
    .insert({
      period_month: periodMonth,
      status: 'running',
      triggered_by: options.triggeredBy,
      triggered_by_user_id: options.userId ?? null,
    })
    .select('id')
    .single();

  if (runError || !run) {
    throw new Error(runError?.message || 'Failed to create cycle_match_runs row');
  }

  try {
    const { data: services, error: svcError } = await supabase
      .from('customer_services')
      .select(
        'id, customer_id, package_name, service_type, product_category, monthly_price, status, active, activation_date, cancelled_at'
      );

    if (svcError) throw new Error(svcError.message);

    const { data: invoices, error: invError } = await supabase
      .from('customer_invoices')
      .select(
        'id, service_id, customer_id, invoice_number, invoice_date, period_start, period_end, subtotal, total_amount, status, zoho_books_invoice_id, paynow_transaction_ref'
      )
      .not('status', 'in', '(voided,cancelled,draft)');

    if (invError) throw new Error(invError.message);

    const monthInvoices = ((invoices || []) as InvoiceRow[]).filter((inv) =>
      invoiceInMonth(inv, start, end)
    );
    const invoiceIds = monthInvoices.map((inv) => inv.id);

    let payments: PaymentRow[] = [];
    if (invoiceIds.length > 0) {
      const { data: payRows, error: payError } = await supabase
        .from('payment_transactions')
        .select(
          'customer_invoice_id, amount, status, provider_reference, reference, completed_at'
        )
        .in('customer_invoice_id', invoiceIds)
        .eq('status', 'completed');
      if (payError) throw new Error(payError.message);
      payments = (payRows || []) as PaymentRow[];
    }

    const invoicesByService = new Map<string, InvoiceRow>();
    for (const inv of monthInvoices) {
      if (!inv.service_id) continue;
      const existing = invoicesByService.get(inv.service_id);
      if (!existing || (inv.invoice_date || '') > (existing.invoice_date || '')) {
        invoicesByService.set(inv.service_id, inv);
      }
    }

    const collectedByInvoice = new Map<string, { amount: number; ref: string | null }>();
    for (const pay of payments) {
      if (!pay.customer_invoice_id) continue;
      const prev = collectedByInvoice.get(pay.customer_invoice_id) || {
        amount: 0,
        ref: null as string | null,
      };
      prev.amount += Number(pay.amount) || 0;
      prev.ref = pay.provider_reference || pay.reference || prev.ref;
      collectedByInvoice.set(pay.customer_invoice_id, prev);
    }

    const scored: Array<{ input: CycleMatchInput; result: ScoredCycleMatch }> = [];
    for (const svc of (services || []) as ServiceRow[]) {
      const amounts = normalizePlatformAmounts(Number(svc.monthly_price) || 0, {
        package_name: svc.package_name,
        service_type: svc.service_type,
        product_category: svc.product_category,
      });
      const invoice = invoicesByService.get(svc.id) ?? null;
      const collected = invoice ? collectedByInvoice.get(invoice.id) : undefined;
      const netcashFromPaynow =
        invoice?.paynow_transaction_ref && !collected
          ? {
              amount: Number(invoice.total_amount) || 0,
              ref: invoice.paynow_transaction_ref,
            }
          : null;

      const input: CycleMatchInput = {
        serviceId: svc.id,
        customerId: svc.customer_id,
        serviceStatus: (svc.status as ServiceStatus) || 'pending',
        serviceActive: svc.active !== false,
        packageName: svc.package_name,
        monthlyPrice: Number(svc.monthly_price) || 0,
        platformExVat: amounts.exVat,
        platformInclVat: amounts.inclVat,
        zohoExVat: invoice ? Number(invoice.subtotal) : null,
        zohoInclVat: invoice ? Number(invoice.total_amount) : null,
        zohoInvoiceId: invoice?.id ?? null,
        zohoInvoiceNumber: invoice?.invoice_number ?? null,
        zohoBooksInvoiceId: invoice?.zoho_books_invoice_id ?? null,
        netcashAmount: collected?.amount ?? netcashFromPaynow?.amount ?? null,
        netcashRef: collected?.ref ?? netcashFromPaynow?.ref ?? null,
        promoExpiredStillDiscounted: false,
      };
      scored.push({ input, result: scoreCycleMatch(input) });
    }

    const matchRows = scored.map(({ result }) => ({
      run_id: run.id,
      service_id: result.serviceId,
      customer_id: result.customerId,
      platform_amount_ex_vat: result.platformExVat,
      platform_amount_incl_vat: result.platformInclVat,
      zoho_amount_ex_vat: result.zohoExVat,
      zoho_amount_incl_vat: result.zohoInclVat,
      netcash_amount: result.netcashAmount,
      platform_record_id: formatServiceDisplayId(result.serviceId),
      zoho_invoice_id: result.zohoInvoiceId,
      zoho_invoice_number: result.zohoInvoiceNumber,
      zoho_books_invoice_id: result.zohoBooksInvoiceId,
      netcash_ref: result.netcashRef,
      match_state: result.matchState,
      pairwise: result.pairwise,
      variance: result.signedVariance,
      leak_type: result.leakType,
      exposure: result.exposure,
      recommended_action: result.recommendedAction,
      diagnosis: result.diagnosis,
      pattern_key: result.patternKey,
      field_diff: result.fieldDiff,
    }));

    const { data: insertedMatches, error: matchError } = await supabase
      .from('billing_cycle_matches')
      .insert(matchRows)
      .select('id, service_id, leak_type, match_state, pattern_key, diagnosis, variance, exposure, field_diff, customer_id');

    if (matchError) throw new Error(matchError.message);

    const exceptionMatches = (insertedMatches || []).filter(
      (row) => row.match_state !== 'matched_3' || row.leak_type
    );

    const { data: lastExc } = await supabase
      .from('billing_cycle_exceptions')
      .select('display_code')
      .order('display_code', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastSeq = lastExc?.display_code?.match(/EXC-(\d+)/);
    let sequence = lastSeq ? Number(lastSeq[1]) + 1 : 2400;

    let exceptionCount = 0;
    for (const match of exceptionMatches) {
      const { error: excError } = await supabase.from('billing_cycle_exceptions').insert({
        display_code: formatExceptionCode(sequence),
        run_id: run.id,
        match_id: match.id,
        service_id: match.service_id,
        customer_id: match.customer_id,
        kind: match.leak_type || match.match_state,
        leak_type: match.leak_type,
        pattern_key: match.pattern_key,
        diagnosis: match.diagnosis || 'Three-way mismatch',
        status: 'open',
        variance: match.variance,
        recoverable: match.exposure,
        cycles_affected: 1,
        field_diff: match.field_diff,
        audit_events: [
          {
            at: new Date().toISOString(),
            kind: 'auto_match',
            message: `Auto-match flagged ${match.match_state}`,
          },
        ],
      });
      if (excError) {
        billingLogger.warn('[cycle-match] exception insert failed', {
          serviceId: match.service_id,
          error: excError.message,
        });
        continue;
      }
      sequence += 1;
      exceptionCount += 1;
    }

    await supabase
      .from('cycle_match_runs')
      .update({
        status: 'ready',
        finished_at: new Date().toISOString(),
        services_checked: scored.length,
      })
      .eq('id', run.id);

    billingLogger.info('[cycle-match] run complete', {
      runId: run.id,
      yearMonth,
      servicesChecked: scored.length,
      exceptionCount,
    });

    return {
      runId: run.id,
      yearMonth,
      servicesChecked: scored.length,
      exceptionCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cycle match failed';
    await supabase
      .from('cycle_match_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', run.id);
    throw error;
  }
}
