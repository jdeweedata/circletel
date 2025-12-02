/**
 * Payment Sync Monitoring Cron Endpoint
 *
 * Monitors payment sync health and sends alerts when issues are detected.
 * Called by Vercel Cron every 4 hours (offset from retry job).
 *
 * Checks:
 * - Failed sync count exceeds threshold
 * - Sync success rate below threshold
 * - Payments pending sync for too long
 *
 * Alerts via:
 * - Email (using Resend)
 * - Optional webhook (Slack/Discord)
 *
 * @module app/api/cron/payment-sync-monitor/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Environment configuration
const ALERT_EMAIL = process.env.PAYMENT_ALERT_EMAIL || process.env.ALERT_EMAIL_TO || 'dev@circletel.co.za';
const ALERT_WEBHOOK_URL = process.env.PAYMENT_ALERT_WEBHOOK_URL || process.env.ALERT_WEBHOOK_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Thresholds
const FAILED_SYNC_THRESHOLD = 5; // Alert if more than 5 failed syncs
const SUCCESS_RATE_THRESHOLD = 95; // Alert if success rate below 95%
const PENDING_HOURS_THRESHOLD = 4; // Alert if pending for more than 4 hours

interface MonitoringResult {
  status: 'healthy' | 'warning' | 'critical';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    value: number | string;
    threshold: number | string;
    message: string;
  }[];
  alerts_sent: {
    email: boolean;
    webhook: boolean;
  };
  timestamp: string;
}

/**
 * GET /api/cron/payment-sync-monitor
 *
 * Called by Vercel Cron to monitor payment sync health
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - PENDING_HOURS_THRESHOLD * 60 * 60 * 1000);

    // Initialize result
    const result: MonitoringResult = {
      status: 'healthy',
      checks: [],
      alerts_sent: { email: false, webhook: false },
      timestamp: now.toISOString(),
    };

    // Check 1: Count of failed syncs in last 24 hours
    const { count: failedCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'failed')
      .gte('updated_at', twentyFourHoursAgo.toISOString());

    const failedSyncs = failedCount || 0;
    const failedCheck = {
      name: 'Failed Syncs (24h)',
      status: failedSyncs > FAILED_SYNC_THRESHOLD ? 'fail' as const : failedSyncs > 0 ? 'warn' as const : 'pass' as const,
      value: failedSyncs,
      threshold: FAILED_SYNC_THRESHOLD,
      message: failedSyncs > FAILED_SYNC_THRESHOLD
        ? `${failedSyncs} failed syncs exceed threshold of ${FAILED_SYNC_THRESHOLD}`
        : failedSyncs > 0
        ? `${failedSyncs} failed syncs detected`
        : 'No failed syncs',
    };
    result.checks.push(failedCheck);

    // Check 2: Success rate in last 24 hours
    const { count: totalCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .not('zoho_sync_status', 'is', null);

    const { count: syncedCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'synced')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    const total = totalCount || 0;
    const synced = syncedCount || 0;
    const successRate = total > 0 ? Math.round((synced / total) * 100) : 100;

    const successRateCheck = {
      name: 'Sync Success Rate (24h)',
      status: successRate < SUCCESS_RATE_THRESHOLD ? 'fail' as const : 'pass' as const,
      value: `${successRate}%`,
      threshold: `${SUCCESS_RATE_THRESHOLD}%`,
      message: successRate < SUCCESS_RATE_THRESHOLD
        ? `Success rate ${successRate}% is below threshold of ${SUCCESS_RATE_THRESHOLD}%`
        : `Success rate ${successRate}% is healthy`,
    };
    result.checks.push(successRateCheck);

    // Check 3: Stale pending syncs (pending for more than threshold hours)
    const { count: stalePendingCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('zoho_sync_status', 'pending')
      .lt('created_at', fourHoursAgo.toISOString());

    const stalePending = stalePendingCount || 0;
    const stalePendingCheck = {
      name: `Stale Pending Syncs (>${PENDING_HOURS_THRESHOLD}h)`,
      status: stalePending > 0 ? 'warn' as const : 'pass' as const,
      value: stalePending,
      threshold: 0,
      message: stalePending > 0
        ? `${stalePending} payments pending sync for more than ${PENDING_HOURS_THRESHOLD} hours`
        : 'No stale pending syncs',
    };
    result.checks.push(stalePendingCheck);

    // Check 4: Today's payment volume
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', todayStart.toISOString());

    const todayVolumeCheck = {
      name: 'Payments Today',
      status: 'pass' as const,
      value: todayPayments || 0,
      threshold: 'N/A',
      message: `${todayPayments || 0} payments processed today`,
    };
    result.checks.push(todayVolumeCheck);

    // Determine overall status
    const hasFailures = result.checks.some(c => c.status === 'fail');
    const hasWarnings = result.checks.some(c => c.status === 'warn');
    result.status = hasFailures ? 'critical' : hasWarnings ? 'warning' : 'healthy';

    // Send alerts if critical
    if (result.status === 'critical') {
      const alertResult = await sendAlerts(result);
      result.alerts_sent = alertResult;
    }

    // Log monitoring result
    await logMonitoringResult(supabase, result, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      ...result,
      processing_time_ms: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Payment sync monitoring error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * Send alert notifications
 */
async function sendAlerts(result: MonitoringResult): Promise<{ email: boolean; webhook: boolean }> {
  const alerts = { email: false, webhook: false };

  // Send email alert
  if (RESEND_API_KEY && ALERT_EMAIL) {
    try {
      const emailSent = await sendEmailAlert(result);
      alerts.email = emailSent;
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  // Send webhook alert
  if (ALERT_WEBHOOK_URL) {
    try {
      const webhookSent = await sendWebhookAlert(result);
      alerts.webhook = webhookSent;
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  return alerts;
}

/**
 * Send email alert via Resend
 */
async function sendEmailAlert(result: MonitoringResult): Promise<boolean> {
  const failedChecks = result.checks.filter(c => c.status === 'fail');
  const warningChecks = result.checks.filter(c => c.status === 'warn');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .check { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .check-fail { background-color: #fef2f2; border-left: 4px solid #dc2626; }
        .check-warn { background-color: #fffbeb; border-left: 4px solid #f59e0b; }
        .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Sync Alert: ${result.status.toUpperCase()}</h1>
        </div>
        <div class="content">
          <p><strong>Time:</strong> ${new Date(result.timestamp).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>

          <h3>Failed Checks (${failedChecks.length})</h3>
          ${failedChecks.map(c => `
            <div class="check check-fail">
              <strong>${c.name}:</strong> ${c.value} (threshold: ${c.threshold})<br>
              ${c.message}
            </div>
          `).join('')}

          ${warningChecks.length > 0 ? `
            <h3>Warnings (${warningChecks.length})</h3>
            ${warningChecks.map(c => `
              <div class="check check-warn">
                <strong>${c.name}:</strong> ${c.value}<br>
                ${c.message}
              </div>
            `).join('')}
          ` : ''}

          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za'}/admin/dashboard"
               style="background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">
              View Admin Dashboard
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated alert from CircleTel Payment Sync Monitoring.</p>
          <p>Retry failed syncs will run automatically every 4 hours.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CircleTel Alerts <alerts@notifications.circletelsa.co.za>',
      to: [ALERT_EMAIL],
      subject: `[ALERT] Payment Sync ${result.status.toUpperCase()} - ${failedChecks.length} issue(s) detected`,
      html,
    }),
  });

  return response.ok;
}

/**
 * Send webhook alert (Slack/Discord compatible)
 */
async function sendWebhookAlert(result: MonitoringResult): Promise<boolean> {
  const failedChecks = result.checks.filter(c => c.status === 'fail');

  const payload = {
    username: 'CircleTel Payment Monitor',
    icon_emoji: ':rotating_light:',
    attachments: [
      {
        color: result.status === 'critical' ? '#dc2626' : '#f59e0b',
        title: `Payment Sync Alert: ${result.status.toUpperCase()}`,
        fields: failedChecks.map(c => ({
          title: c.name,
          value: `${c.value} (threshold: ${c.threshold})\n${c.message}`,
          short: false,
        })),
        footer: 'CircleTel Payment Sync Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const response = await fetch(ALERT_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

/**
 * Log monitoring result to database
 */
async function logMonitoringResult(
  supabase: Awaited<ReturnType<typeof createClient>>,
  result: MonitoringResult,
  processingTimeMs: number
): Promise<void> {
  try {
    await supabase.from('zoho_sync_logs').insert({
      entity_type: 'payment_monitoring',
      entity_id: 'cron_monitor',
      operation: 'health_check',
      status: result.status === 'healthy' ? 'synced' : 'failed',
      request_payload: result.checks,
      response_payload: {
        status: result.status,
        alerts_sent: result.alerts_sent,
        processing_time_ms: processingTimeMs,
      },
      duration_ms: processingTimeMs,
    });
  } catch (error) {
    console.error('Failed to log monitoring result:', error);
  }
}

// Export config for Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 60;
