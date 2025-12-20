/**
 * Diagnostics Health Check Cron Job
 *
 * Runs every 6 hours to check all active subscriber connections.
 * Updates health status, generates alerts, and creates tickets for issues.
 *
 * Schedule: 0 0,6,12,18 * * * (every 6 hours at midnight, 6am, noon, 6pm)
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createDiagnosticsAnalyzer } from '@/lib/diagnostics/analyzer'
import type {
  BatchHealthCheckResult,
  HealthCheckResult,
  HealthAlert,
} from '@/lib/diagnostics/types'

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET

// Batch size for processing subscribers
const BATCH_SIZE = 10

// Delay between batches (ms) to avoid rate limiting
const BATCH_DELAY_MS = 2000

/**
 * GET /api/cron/diagnostics-health-check
 *
 * Run health check for all active subscribers
 *
 * Protected by CRON_SECRET header
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Diagnostics Cron] Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Diagnostics Cron] Starting health check run...')

  try {
    const supabase = await createClient()

    // Get all active services with Interstellio connection
    const { data: services, error: servicesError } = await supabase
      .from('customer_services')
      .select('id, connection_id, customer_id, package_name')
      .eq('status', 'active')
      .not('connection_id', 'is', null)
      .not('connection_id', 'eq', '')

    if (servicesError) {
      console.error('[Diagnostics Cron] Failed to fetch services:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    console.log(`[Diagnostics Cron] Found ${services?.length || 0} active services to check`)

    if (!services || services.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active services to check',
        stats: {
          total_checked: 0,
          healthy: 0,
          warning: 0,
          critical: 0,
          offline: 0,
          unknown: 0,
          errors: 0,
          tickets_created: 0,
        },
      })
    }

    // Process in batches
    const results: HealthCheckResult[] = []
    const errors: string[] = []
    const allAlerts: HealthAlert[] = []

    for (let i = 0; i < services.length; i += BATCH_SIZE) {
      const batch = services.slice(i, i + BATCH_SIZE)

      console.log(
        `[Diagnostics Cron] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(services.length / BATCH_SIZE)}`
      )

      // Process batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(async (service) => {
          const analyzer = createDiagnosticsAnalyzer()
          return analyzer.analyzeSubscriber(service.id, service.connection_id!)
        })
      )

      // Collect results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j]
        const service = batch[j]

        if (result.status === 'fulfilled') {
          results.push(result.value)
          allAlerts.push(...result.value.alerts)
        } else {
          errors.push(`${service.id}: ${result.reason}`)
          console.error(
            `[Diagnostics Cron] Failed to check ${service.id}:`,
            result.reason
          )
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < services.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // Calculate stats
    const stats: BatchHealthCheckResult = {
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      total_checked: results.length,
      healthy: results.filter((r) => r.new_status === 'healthy').length,
      warning: results.filter((r) => r.new_status === 'warning').length,
      critical: results.filter((r) => r.new_status === 'critical').length,
      offline: results.filter((r) => r.new_status === 'offline').length,
      unknown: results.filter((r) => r.new_status === 'unknown').length,
      errors: errors.length,
      tickets_created: results.filter((r) => r.ticket_created).length,
      alerts_generated: allAlerts,
    }

    const duration = Date.now() - startTime

    console.log(
      `[Diagnostics Cron] Completed in ${duration}ms:`,
      `${stats.healthy} healthy, ${stats.warning} warning, ${stats.critical} critical, ${stats.offline} offline`,
      `(${stats.tickets_created} tickets created, ${stats.errors} errors)`
    )

    // Send summary email if there are critical issues
    if (stats.critical > 0 || stats.tickets_created > 0) {
      await sendSummaryEmail(stats, results)
    }

    // Record cron run in events
    await supabase.from('subscriber_events').insert({
      customer_service_id: services[0].id, // Use first service as reference
      interstellio_subscriber_id: services[0].connection_id,
      event_type: 'health_check',
      event_source: 'system',
      event_data: {
        type: 'cron_batch_complete',
        ...stats,
        duration_ms: duration,
      },
      severity: stats.critical > 0 ? 'high' : stats.warning > 0 ? 'medium' : 'info',
      health_impact: 0,
      requires_action: stats.critical > 0,
    })

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Diagnostics Cron] Error:', error)

    return NextResponse.json(
      {
        success: false,
        duration_ms: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Send summary email to support team
 */
async function sendSummaryEmail(
  stats: BatchHealthCheckResult,
  results: HealthCheckResult[]
): Promise<void> {
  try {
    const criticalResults = results.filter((r) => r.new_status === 'critical')
    const ticketResults = results.filter((r) => r.ticket_created)

    const supportEmail = process.env.SUPPORT_EMAIL || 'support@circletel.co.za'

    // Build email content
    const subject = `[Diagnostics] Health Check Summary - ${stats.critical} Critical, ${stats.warning} Warning`

    const criticalList = criticalResults
      .slice(0, 10)
      .map((r) => `- ${r.interstellio_subscriber_id}: Score ${r.health_score}, ${r.lost_carriers_today} drops today`)
      .join('\n')

    const ticketList = ticketResults
      .slice(0, 10)
      .map((r) => `- ${r.interstellio_subscriber_id}: Ticket ${r.ticket_id}`)
      .join('\n')

    const body = `
Diagnostics Health Check Complete

Run Time: ${stats.started_at} to ${stats.completed_at}
Total Checked: ${stats.total_checked}

Status Summary:
- Healthy: ${stats.healthy}
- Warning: ${stats.warning}
- Critical: ${stats.critical}
- Offline: ${stats.offline}
- Unknown: ${stats.unknown}
- Errors: ${stats.errors}

Tickets Created: ${stats.tickets_created}

${stats.critical > 0 ? `Critical Subscribers:\n${criticalList}\n` : ''}
${stats.tickets_created > 0 ? `New Tickets:\n${ticketList}\n` : ''}

View full details at: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/diagnostics
`.trim()

    // Send email using Resend directly for plain text
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'CircleTel Diagnostics <devadmin@notifications.circletelsa.co.za>',
      to: supportEmail,
      subject,
      text: body,
    })

    console.log('[Diagnostics Cron] Summary email sent to', supportEmail)
  } catch (error) {
    console.error('[Diagnostics Cron] Failed to send summary email:', error)
  }
}

// Configure runtime
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max
