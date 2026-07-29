import { createClient } from '@/lib/supabase/server';
import { cronLogger } from '@/lib/logging';

interface CronResult {
  records_processed?: number;
  records_failed?: number;
  records_skipped?: number;
  execution_details?: Record<string, unknown>;
}

export async function withCronLogging<T extends CronResult>(
  cronName: string,
  triggerSource: 'vercel_cron' | 'manual' | 'api' | 'scheduled',
  handler: (logId: string) => Promise<T>
): Promise<T & { logId: string; durationMs: number }> {
  const logId = crypto.randomUUID();
  const startedAt = Date.now();

  const supabase = await createClient();

  await supabase.from('cron_execution_log').insert({
    id: logId,
    job_name: cronName,
    status: 'running',
    trigger_source: triggerSource,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
  });

  cronLogger.info(`[${cronName}] Started`, { logId, triggerSource });

  try {
    const result = await handler(logId);
    const durationMs = Date.now() - startedAt;

    await supabase
      .from('cron_execution_log')
      .update({
        status: (result.records_failed ?? 0) > 0 ? 'partial' : 'completed',
        execution_end: new Date().toISOString(),
        records_processed: result.records_processed ?? 0,
        records_failed: result.records_failed ?? 0,
        records_skipped: result.records_skipped ?? 0,
        execution_details: result.execution_details ?? null,
      })
      .eq('id', logId);

    cronLogger.info(`[${cronName}] Completed`, {
      logId,
      durationMs,
      processed: result.records_processed ?? 0,
      failed: result.records_failed ?? 0,
    });

    return { ...result, logId, durationMs };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await supabase
      .from('cron_execution_log')
      .update({
        status: 'failed',
        execution_end: new Date().toISOString(),
        error_message: errorMessage,
        error_details: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
      .eq('id', logId);

    cronLogger.error(`[${cronName}] Failed`, { logId, durationMs, error: errorMessage });

    throw error;
  }
}

export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  // Fail closed: if no secret is configured, deny access rather than
  // allowing any caller to trigger cron jobs (billing, debit orders, reconciliation).
  if (!cronSecret) {
    cronLogger.error('[verifyCronSecret] CRON_SECRET is not configured — denying cron request');
    return false;
  }
  return authHeader === `Bearer ${cronSecret}`;
}
