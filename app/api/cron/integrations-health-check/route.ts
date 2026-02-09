/**
 * Integration Health Check Cron Job
 *
 * Scheduled job that runs every 30 minutes
 *
 * Purpose:
 * - Monitor health of all 9 third-party integrations
 * - Track consecutive failures for alerting (3 failures = alert)
 * - Suppress duplicate alerts (max 1 alert per 6 hours)
 * - Update health status in database
 *
 * Health Checks:
 * - OAuth token validity and expiration
 * - API endpoint reachability
 * - Webhook failure rates (last 24 hours)
 *
 * Integrations Monitored:
 * - zoho-crm, zoho-billing, zoho-sign
 * - netcash, didit-kyc, clickatell
 * - resend, mtn-coverage, google-maps
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAllIntegrationsHealth } from '@/lib/integrations/health-check-service';
import { differenceInHours } from 'date-fns';
import { cronLogger } from '@/lib/logging';

/**
 * GET /api/cron/integrations-health-check
 *
 * Vercel Cron Job - Runs every 30 minutes
 *
 * Schedule: Every 30 minutes (cron: "* /30 * * * *" without space)
 *
 * Authentication: Vercel Cron Secret
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // =========================================================================
    // Verify Vercel Cron Secret
    // =========================================================================
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      cronLogger.error('[IntegrationsHealthCheck] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      cronLogger.error('[IntegrationsHealthCheck] Invalid authorization');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[IntegrationsHealthCheck]   Starting Health Check Job');
    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[IntegrationsHealthCheck]   Timestamp: ${new Date().toISOString()}`);
    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════\n');

    // =========================================================================
    // Run Health Checks on All Integrations
    // =========================================================================
    const healthCheckResult = await checkAllIntegrationsHealth();

    cronLogger.info('[IntegrationsHealthCheck] Health check complete:');
    cronLogger.info(`  - Total integrations: ${healthCheckResult.totalIntegrations}`);
    cronLogger.info(`  - Healthy: ${healthCheckResult.healthy}`);
    cronLogger.info(`  - Degraded: ${healthCheckResult.degraded}`);
    cronLogger.info(`  - Down: ${healthCheckResult.down}`);
    cronLogger.info(`  - Unknown: ${healthCheckResult.unknown}`);
    cronLogger.info(`  - Duration: ${healthCheckResult.duration}ms\n`);

    // =========================================================================
    // Process Results - Track Consecutive Failures & Send Alerts
    // =========================================================================
    const supabase = await createClient();
    const alertsToSend: Array<{
      integrationSlug: string;
      integrationName: string;
      healthStatus: string;
      issues: string[];
      consecutiveFailures: number;
    }> = [];

    for (const result of healthCheckResult.results) {
      // Get current integration record with tracking columns
      const { data: integration } = await supabase
        .from('integration_registry')
        .select('consecutive_failures, last_alert_sent_at')
        .eq('slug', result.integrationSlug)
        .single();

      if (!integration) {
        cronLogger.warn(`[IntegrationsHealthCheck] Integration not found: ${result.integrationSlug}`);
        continue;
      }

      let newConsecutiveFailures = integration.consecutive_failures;
      let shouldSendAlert = false;

      // Update consecutive failures counter
      if (result.healthStatus === 'down' || result.healthStatus === 'degraded') {
        newConsecutiveFailures = integration.consecutive_failures + 1;

        // Check if we should send an alert
        if (newConsecutiveFailures >= 3) {
          // Check if alert suppression period has passed (6 hours)
          const lastAlertSent = integration.last_alert_sent_at
            ? new Date(integration.last_alert_sent_at)
            : null;

          if (!lastAlertSent || differenceInHours(new Date(), lastAlertSent) >= 6) {
            shouldSendAlert = true;
          }
        }
      } else {
        // Reset counter on healthy status
        newConsecutiveFailures = 0;
      }

      // Update database with new consecutive failures count
      await supabase
        .from('integration_registry')
        .update({
          consecutive_failures: newConsecutiveFailures,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', result.integrationSlug);

      // Queue alert if needed
      if (shouldSendAlert) {
        alertsToSend.push({
          integrationSlug: result.integrationSlug,
          integrationName: result.integrationName,
          healthStatus: result.healthStatus,
          issues: result.issues,
          consecutiveFailures: newConsecutiveFailures,
        });

        // Update last_alert_sent_at timestamp
        await supabase
          .from('integration_registry')
          .update({
            last_alert_sent_at: new Date().toISOString(),
          })
          .eq('slug', result.integrationSlug);
      }

      cronLogger.info(`[IntegrationsHealthCheck] ${result.integrationSlug}: ${result.healthStatus} (failures: ${newConsecutiveFailures})`);
    }

    // =========================================================================
    // Send Alerts
    // =========================================================================
    if (alertsToSend.length > 0) {
      cronLogger.info(`\n[IntegrationsHealthCheck] Sending ${alertsToSend.length} alert(s)...`);

      for (const alert of alertsToSend) {
        await sendIntegrationAlert(alert);
      }

      cronLogger.info('[IntegrationsHealthCheck] ✅ Alerts sent\n');
    } else {
      cronLogger.info('[IntegrationsHealthCheck] No alerts to send\n');
    }

    // =========================================================================
    // Log Summary
    // =========================================================================
    const duration = Date.now() - startTime;

    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════');
    cronLogger.info('[IntegrationsHealthCheck]   Health Check Complete');
    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════');
    cronLogger.info(`[IntegrationsHealthCheck]   Duration: ${duration}ms`);
    cronLogger.info(`[IntegrationsHealthCheck]   Alerts sent: ${alertsToSend.length}`);
    cronLogger.info('[IntegrationsHealthCheck] ═══════════════════════════════════════════════════════════\n');

    return NextResponse.json({
      success: true,
      summary: {
        totalIntegrations: healthCheckResult.totalIntegrations,
        healthy: healthCheckResult.healthy,
        degraded: healthCheckResult.degraded,
        down: healthCheckResult.down,
        unknown: healthCheckResult.unknown,
        alertsSent: alertsToSend.length,
        duration,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    cronLogger.error('[IntegrationsHealthCheck] Error running health check:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run health check',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Send alert notification for integration health issue
 *
 * This sends an email to admin users about the integration health issue.
 * Uses Resend for email delivery.
 */
async function sendIntegrationAlert(alert: {
  integrationSlug: string;
  integrationName: string;
  healthStatus: string;
  issues: string[];
  consecutiveFailures: number;
}): Promise<void> {
  try {
    cronLogger.info(`[IntegrationsHealthCheck] Sending alert for ${alert.integrationSlug}...`);

    // Get admin users who should receive alerts
    const supabase = await createClient();
    const { data: adminUsers } = await supabase
      .from('admin_users')
      .select('email, first_name, last_name')
      .eq('is_active', true)
      .eq('role', 'super_admin'); // Only send to super admins

    if (!adminUsers || adminUsers.length === 0) {
      cronLogger.warn('[IntegrationsHealthCheck] No admin users found to send alert');
      return;
    }

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      cronLogger.error('[IntegrationsHealthCheck] RESEND_API_KEY not configured');
      return;
    }

    const issuesList = alert.issues.map((issue) => `• ${issue}`).join('\n');

    const emailBody = `
Integration Health Alert - ${alert.integrationName}

Status: ${alert.healthStatus.toUpperCase()}
Consecutive Failures: ${alert.consecutiveFailures}

Issues Detected:
${issuesList}

This integration has failed ${alert.consecutiveFailures} consecutive health checks.

Please investigate and resolve the issue as soon as possible.

View integration details:
https://www.circletel.co.za/admin/integrations/${alert.integrationSlug}

---
This is an automated alert from CircleTel Integration Monitoring System
    `.trim();

    for (const admin of adminUsers) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'CircleTel Alerts <alerts@circletel.co.za>',
            to: admin.email,
            subject: `⚠️ Integration Alert: ${alert.integrationName} - ${alert.healthStatus}`,
            text: emailBody,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          cronLogger.error(
            `[IntegrationsHealthCheck] Failed to send email to ${admin.email}:`,
            errorData
          );
        } else {
          cronLogger.info(`[IntegrationsHealthCheck] ✅ Alert sent to ${admin.email}`);
        }
      } catch (emailError) {
        cronLogger.error(
          `[IntegrationsHealthCheck] Error sending email to ${admin.email}:`,
          emailError
        );
      }
    }

    // Log alert to database
    await supabase.from('integration_activity_log').insert({
      integration_slug: alert.integrationSlug,
      action_type: 'health_alert_sent',
      action_description: `Health alert sent: ${alert.healthStatus} - ${alert.consecutiveFailures} consecutive failures`,
      action_result: 'success',
      metadata: {
        health_status: alert.healthStatus,
        consecutive_failures: alert.consecutiveFailures,
        issues: alert.issues,
        recipients: adminUsers.map((u) => u.email),
      },
    });
  } catch (error) {
    cronLogger.error('[IntegrationsHealthCheck] Error sending alert:', error);
  }
}
