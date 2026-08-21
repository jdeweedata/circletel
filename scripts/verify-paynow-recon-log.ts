/**
 * One-off verify: fixed cron_execution_log lifecycle + dry statement match.
 * Does NOT write payment_transactions / invoices / reconciliation_queue.
 *
 * The row is inserted as `running` before any work starts, so every exit path
 * from that point on must drive it to a terminal status. Otherwise this script
 * strands rows exactly the way the bug it verifies does.
 */
import { createClient } from '@supabase/supabase-js';
import { NetCashStatementService } from '../lib/payments/netcash-statement-service';
import { matchInvoiceByReference } from '../lib/billing/invoice-matcher';

const PAYNOW_CODES = new Set([
  'EFT',
  'CRD',
  'OZW',
  'INS',
  'PNW',
  'PNA',
  'PNC',
  'WEB',
  'ONL',
]);

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const date = new Date(Date.now() - 86400000);
  const dateStr = date.toISOString().slice(0, 10);
  const start = Date.now();

  const { data: log, error: logErr } = await sb
    .from('cron_execution_log')
    .insert({
      job_name: 'paynow-reconciliation',
      status: 'running',
      execution_start: new Date().toISOString(),
      trigger_source: 'manual',
      execution_details: {
        triggered_by: 'verify-e2e-dry',
        reconciliation_date: dateStr,
        dry_run: true,
      },
    })
    .select('id')
    .single();

  if (logErr || !log) throw new Error('log insert: ' + logErr?.message);
  console.log('LOG', log.id, 'DATE', dateStr);

  // Terminal close for the abnormal paths. `cancelled` mirrors the backfill's
  // reasoning: an interrupt says nothing about whether the work was sound, and
  // `failed` is what cron-health/route.ts:57 reads as unhealthy.
  let closing = false;
  const closeAsTerminal = async (
    status: 'failed' | 'cancelled',
    message: string
  ) => {
    if (closing) return;
    closing = true;

    // Do NOT write duration_seconds — generated column, rejects the statement.
    const { error: closeErr } = await sb
      .from('cron_execution_log')
      .update({
        status,
        execution_end: new Date().toISOString(),
        error_message: message,
        execution_details: {
          reconciliation_date: dateStr,
          dry_run: true,
          verify_e2e: true,
          aborted: true,
          duration_ms: Date.now() - start,
        },
      })
      .eq('id', log.id);

    if (closeErr) {
      console.error('FAILED TO CLOSE LOG ROW', log.id, closeErr.message);
      return;
    }
    console.log('CLOSED LOG ROW', log.id, '->', status);
  };

  // Ctrl-C does not throw, so try/catch alone would leave the row open.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void closeAsTerminal(
        'cancelled',
        `verify script interrupted (${signal})`
      ).then(() => process.exit(130));
    });
  }

  try {
    const svc = new NetCashStatementService();
    const statement = await svc.getStatement(date);
    console.log('STATEMENT', {
      success: statement.success,
      error: statement.error,
      count: statement.transactions?.length ?? 0,
    });

    const counters = {
      total: 0,
      matched: 0,
      already_paid: 0,
      unmatched: 0,
      would_queue: 0,
      already_recorded: 0,
      errors: [] as string[],
    };

    if (statement.success) {
      const payNow = statement.transactions.filter((tx) => {
        if (tx.effect !== '+') return false;
        const code = PAYNOW_CODES.has(tx.transactionCode);
        const desc = (tx.description || '').toLowerCase();
        return (
          code ||
          desc.includes('paynow') ||
          desc.includes('ozow') ||
          desc.includes('online') ||
          desc.includes('web payment')
        );
      });
      counters.total = payNow.length;

      for (const tx of payNow) {
        if (!(Number(tx.amount) > 0)) continue;
        const reference = tx.accountReference || tx.reference || tx.description;
        if (!reference) {
          counters.errors.push('no-ref');
          continue;
        }
        const { data: existing } = await sb
          .from('payment_transactions')
          .select('id')
          .eq('provider_reference', reference)
          .maybeSingle();
        if (existing) {
          counters.already_recorded++;
          continue;
        }
        const match = await matchInvoiceByReference(reference, sb as never);
        if (!match.matched || !match.invoice) {
          counters.unmatched++;
          counters.would_queue++;
          continue;
        }
        counters.matched++;
        if (match.invoice.status === 'paid') counters.already_paid++;
      }
    }

    const durationMs = Date.now() - start;
    const finalStatus = statement.success ? 'completed' : 'partial';

    // Critical: do NOT write duration_seconds (generated column)
    const { error: finErr } = await sb
      .from('cron_execution_log')
      .update({
        status: finalStatus,
        execution_end: new Date().toISOString(),
        records_processed: counters.total,
        records_failed: counters.unmatched,
        execution_details: {
          reconciliation_date: dateStr,
          statement_fetched: statement.success,
          dry_run: true,
          verify_e2e: true,
          ...counters,
          total_transactions: counters.total,
          newly_matched: 0,
          duration_ms: durationMs,
          errors: statement.success
            ? counters.errors
            : [statement.error || 'statement unavailable'],
        },
      })
      .eq('id', log.id);

    if (finErr) throw new Error('finalize: ' + finErr.message);
    closing = true;

    const { data: latest } = await sb
      .from('cron_execution_log')
      .select(
        'id, status, execution_start, duration_seconds, records_processed, records_failed'
      )
      .eq('id', log.id)
      .single();

    console.log(
      'RESULT',
      JSON.stringify(
        {
          counters,
          finalStatus,
          duration_seconds: latest?.duration_seconds,
          status: latest?.status,
          logId: latest?.id,
        },
        null,
        2
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await closeAsTerminal('failed', `verify script aborted: ${message}`);
    throw error;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
