/**
 * Close out cron_execution_log rows stranded in status 'running'.
 *
 * Background: every writer of cron_execution_log was sending columns that do
 * not exist on the table (started_at, completed_at, result, result_summary,
 * execution_time_ms) and status values that violate the column's varchar(20)
 * limit or its CHECK constraint ('completed_with_errors', 'success',
 * 'pending', 'skipped'). PostgREST rejected the finalize statement, no caller
 * checked the returned error, and the row was left in 'running' forever.
 *
 * The writers are fixed. This closes the rows the bug already stranded.
 *
 * A stranded row is marked 'cancelled', not 'failed': the job may well have
 * done its work correctly — only the bookkeeping write was rejected. Marking
 * it 'failed' would misreport it on the cron-health dashboard, which treats
 * 'failed' as unhealthy.
 *
 * execution_end is deliberately left NULL. duration_seconds is GENERATED from
 * (execution_end - execution_start), so backfilling execution_end with now()
 * would report a runtime of days. NULL correctly means "end time unknown".
 *
 * Usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/close-stranded-cron-logs.ts
 *   ...                                                                      --apply
 *   ...                                                --older-than-hours=6 --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const OLDER_THAN_HOURS = Number(
  process.argv.find((a) => a.startsWith('--older-than-hours='))?.split('=')[1] ?? 2
);

const CLOSE_REASON =
  'Run never finalized: the cron_execution_log finalize write was rejected by ' +
  'PostgREST (schema drift) and the error was never checked. Closed out by backfill.';

interface StrandedRow {
  id: string;
  job_name: string;
  execution_start: string;
  error_details: Record<string, unknown> | null;
}

async function main() {
  if (!Number.isFinite(OLDER_THAN_HOURS) || OLDER_THAN_HOURS <= 0) {
    throw new Error(`--older-than-hours must be a positive number (got ${OLDER_THAN_HOURS})`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. ' +
        'Run with: set -a && source .env.local && set +a && npx tsx ...'
    );
  }

  const sb = createClient(url, key);
  const cutoff = new Date(Date.now() - OLDER_THAN_HOURS * 3600_000).toISOString();

  console.log(`Mode:   ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`);
  console.log(`Cutoff: execution_start < ${cutoff}  (${OLDER_THAN_HOURS}h ago)\n`);

  const { data: stranded, error: selectError } = await sb
    .from('cron_execution_log')
    .select('id, job_name, execution_start, error_details')
    .eq('status', 'running')
    .lt('execution_start', cutoff)
    .order('execution_start', { ascending: true })
    .returns<StrandedRow[]>();

  if (selectError) throw new Error(`select: ${selectError.message}`);

  if (!stranded || stranded.length === 0) {
    console.log('No stranded rows found. Nothing to do.');
    return;
  }

  const byJob = new Map<string, StrandedRow[]>();
  for (const row of stranded) {
    const list = byJob.get(row.job_name) ?? [];
    list.push(row);
    byJob.set(row.job_name, list);
  }

  console.log(`Found ${stranded.length} stranded row(s):\n`);
  for (const [jobName, rows] of Array.from(byJob.entries()).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${jobName.padEnd(34)} ${String(rows.length).padStart(3)}  ` +
      `oldest ${rows[0].execution_start}  newest ${rows[rows.length - 1].execution_start}`);
  }
  console.log();

  if (!APPLY) {
    console.log('DRY RUN — re-run with --apply to close these out.');
    return;
  }

  const closedAt = new Date().toISOString();
  let closed = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const row of stranded) {
    const strandedForHours = Math.round(
      (Date.now() - new Date(row.execution_start).getTime()) / 3600_000
    );

    // NOTE: never write duration_seconds — it is GENERATED ALWAYS ... STORED.
    // execution_end stays NULL on purpose (see file header).
    const { error: updateError } = await sb
      .from('cron_execution_log')
      .update({
        status: 'cancelled',
        error_message: CLOSE_REASON,
        error_details: {
          ...(row.error_details ?? {}),
          stranded_backfill: {
            closed_out_at: closedAt,
            closed_out_by: 'scripts/close-stranded-cron-logs.ts',
            original_status: 'running',
            stranded_for_hours: strandedForHours,
            reason: CLOSE_REASON,
          },
        },
      })
      .eq('id', row.id)
      .eq('status', 'running'); // guard: never touch a row that moved on

    if (updateError) {
      failures.push({ id: row.id, error: updateError.message });
      console.error(`  FAILED ${row.id} (${row.job_name}): ${updateError.message}`);
    } else {
      closed++;
    }
  }

  console.log(`\nClosed ${closed}/${stranded.length} row(s).`);
  if (failures.length > 0) {
    console.error(`${failures.length} failure(s) — see above.`);
    process.exitCode = 1;
  }

  const { count: remaining, error: verifyError } = await sb
    .from('cron_execution_log')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'running')
    .lt('execution_start', cutoff);

  if (verifyError) {
    console.error(`verify: ${verifyError.message}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Remaining stranded rows older than ${OLDER_THAN_HOURS}h: ${remaining ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
