import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';

export const dynamic = 'force-dynamic';

const EXPECTED_CRONS: Record<string, { intervalMinutes: number; description: string }> = {
  'stats-snapshot': { intervalMinutes: 1440, description: 'Daily customer stats' },
  'payment-reconciliation': { intervalMinutes: 1440, description: 'NetCash reconciliation' },
  'payment-sync-retry': { intervalMinutes: 360, description: 'Payment sync retry' },
  'generate_invoices': { intervalMinutes: 1440, description: 'Invoice generation' },
  'generate_invoices_25th': { intervalMinutes: 1440, description: '25th invoice generation' },
  'submit-debit-orders': { intervalMinutes: 1440, description: 'Debit order submission' },
  'submit-cc-debit-orders': { intervalMinutes: 1440, description: 'CC debit order submission' },
  'zoho-sync': { intervalMinutes: 1440, description: 'Zoho CRM sync' },
  'zoho-books-sync': { intervalMinutes: 1440, description: 'Zoho Books sync' },
  'zoho-books-retry': { intervalMinutes: 360, description: 'Zoho Books retry' },
  'invoice-sms-reminders': { intervalMinutes: 1440, description: 'Invoice SMS reminders' },
  'process-billing-day': { intervalMinutes: 1440, description: 'Billing day processing' },
  'paynow-reconciliation': { intervalMinutes: 240, description: 'PayNow reconciliation' },
};

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const supabase = await createClient();

  const { data: recentLogs, error } = await supabase
    .from('cron_execution_log')
    .select('job_name, status, execution_start, execution_end, error_message, records_processed, records_failed')
    .order('execution_start', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch cron logs' }, { status: 500 });
  }

  const now = new Date();
  const cronStatus: Record<string, {
    description: string;
    lastRun: string | null;
    lastStatus: string | null;
    lastError: string | null;
    healthy: boolean;
    staleSinceMinutes: number | null;
  }> = {};

  for (const [cronName, config] of Object.entries(EXPECTED_CRONS)) {
    const lastLog = recentLogs?.find(l => l.job_name === cronName);
    const lastRunTime = lastLog?.execution_start ? new Date(lastLog.execution_start) : null;
    const staleSinceMinutes = lastRunTime
      ? Math.round((now.getTime() - lastRunTime.getTime()) / 60000)
      : null;

    const staleThreshold = config.intervalMinutes * 2;
    const healthy = lastLog
      ? lastLog.status !== 'failed' && (staleSinceMinutes === null || staleSinceMinutes <= staleThreshold)
      : false;

    cronStatus[cronName] = {
      description: config.description,
      lastRun: lastLog?.execution_start ?? null,
      lastStatus: lastLog?.status ?? null,
      lastError: lastLog?.error_message ?? null,
      healthy,
      staleSinceMinutes,
    };
  }

  const healthyCrons = Object.values(cronStatus).filter(c => c.healthy).length;
  const totalCrons = Object.keys(cronStatus).length;

  return NextResponse.json({
    success: true,
    data: {
      overall: healthyCrons === totalCrons ? 'healthy' : healthyCrons > totalCrons * 0.7 ? 'degraded' : 'unhealthy',
      healthy: healthyCrons,
      total: totalCrons,
      crons: cronStatus,
    },
  });
}
