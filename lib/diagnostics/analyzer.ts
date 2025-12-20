/**
 * Diagnostics Analyzer Service
 *
 * Analyzes CDR records from Interstellio to calculate health scores,
 * detect issues, and generate alerts for auto-ticketing.
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { createClient } from '@/lib/supabase/server'
import { getInterstellioClient } from '@/lib/interstellio'
import type { SessionAnalysis, TelemetryCDRRecord } from '@/lib/interstellio/types'
import {
  type SubscriberDiagnostics,
  type SubscriberEvent,
  type HealthCheckResult,
  type HealthAlert,
  type HealthStatus,
  type Severity,
  type EventType,
  type SeverityThresholds,
  type HealthScoreWeights,
  DEFAULT_SEVERITY_THRESHOLDS,
  DEFAULT_HEALTH_SCORE_WEIGHTS,
  terminateCauseToEventType,
  healthScoreToStatus,
} from './types'

// =============================================================================
// Analyzer Service
// =============================================================================

export class DiagnosticsAnalyzer {
  private thresholds: SeverityThresholds
  private weights: HealthScoreWeights

  constructor(
    thresholds: SeverityThresholds = DEFAULT_SEVERITY_THRESHOLDS,
    weights: HealthScoreWeights = DEFAULT_HEALTH_SCORE_WEIGHTS
  ) {
    this.thresholds = thresholds
    this.weights = weights
  }

  /**
   * Analyze a single subscriber and update diagnostics
   */
  async analyzeSubscriber(
    customerServiceId: string,
    interstellioSubscriberId: string
  ): Promise<HealthCheckResult> {
    const supabase = await createClient()
    const client = getInterstellioClient()

    // Get current diagnostics record
    const { data: currentDiagnostics } = await supabase
      .from('subscriber_diagnostics')
      .select('*')
      .eq('customer_service_id', customerServiceId)
      .single()

    const previousStatus = currentDiagnostics?.health_status || 'unknown'

    // Get session analysis from Interstellio
    let analysis: SessionAnalysis
    try {
      analysis = await client.analyzeSessionStatus(interstellioSubscriberId)
    } catch (error) {
      console.error(`[DiagnosticsAnalyzer] Failed to analyze ${interstellioSubscriberId}:`, error)

      // Return error result
      return {
        customer_service_id: customerServiceId,
        interstellio_subscriber_id: interstellioSubscriberId,
        previous_status: previousStatus as HealthStatus,
        new_status: 'unknown',
        health_score: 0,
        is_active: false,
        sessions_today: 0,
        lost_carriers_today: 0,
        total_duration_today: 0,
        sessions_7days: 0,
        lost_carriers_7days: 0,
        total_duration_7days: 0,
        stability_score: 0,
        alerts: [],
        ticket_created: false,
      }
    }

    // Get 7-day CDR records for trend analysis
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    let cdrRecords: TelemetryCDRRecord[] = []

    try {
      cdrRecords = await client.getCDRRecords(interstellioSubscriberId, {
        start_time: this.formatDate(sevenDaysAgo),
        end_time: this.formatDate(now),
      })
    } catch (error) {
      console.error(`[DiagnosticsAnalyzer] Failed to get CDR records:`, error)
    }

    // Calculate metrics
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayRecords = cdrRecords.filter(
      (r) => new Date(r.start_time) >= todayStart
    )

    const lostCarriersToday = todayRecords.filter(
      (r) => r.terminate_cause === 'Lost-Carrier'
    ).length

    const lostCarriers7days = cdrRecords.filter(
      (r) => r.terminate_cause === 'Lost-Carrier'
    ).length

    const totalDuration7days = cdrRecords.reduce(
      (sum, r) => sum + (r.duration || 0),
      0
    )

    // Calculate stability score (based on session frequency and duration)
    const stabilityScore = this.calculateStabilityScore(cdrRecords, lostCarriers7days)

    // Calculate health score
    const healthScore = this.calculateHealthScore({
      isActive: analysis.isActive,
      lostCarriersToday,
      lostCarriers7days,
      sessionsToday: analysis.totalSessionsToday,
      stabilityScore,
      totalDuration7days,
    })

    // Determine health status
    const newStatus = analysis.isActive
      ? healthScoreToStatus(healthScore)
      : 'offline'

    // Generate alerts
    const alerts = this.generateAlerts({
      lostCarriersToday,
      lostCarriers7days,
      isActive: analysis.isActive,
      previousStatus: previousStatus as HealthStatus,
      newStatus,
      lastCheckAt: currentDiagnostics?.last_check_at,
    })

    // Update diagnostics record
    const diagnosticsUpdate = {
      health_status: newStatus,
      health_score: healthScore,
      is_session_active: analysis.isActive,
      last_session_start: analysis.lastSession?.start_time || null,
      last_session_duration_seconds: analysis.lastSession?.duration || 0,
      current_session_ip: analysis.isActive
        ? analysis.lastSession?.calling_station_id || null
        : null,
      nas_ip_address: analysis.lastSession?.nas_ip_address || null,
      total_sessions_today: analysis.totalSessionsToday,
      lost_carrier_count_today: lostCarriersToday,
      user_request_count_today:
        analysis.terminateCauses['User-Request'] || 0,
      session_timeout_count_today:
        (analysis.terminateCauses['Session-Timeout'] || 0) +
        (analysis.terminateCauses['Idle-Timeout'] || 0),
      avg_session_duration_seconds: Math.round(
        analysis.totalDurationSeconds / Math.max(1, analysis.totalSessionsToday)
      ),
      total_sessions_7days: cdrRecords.length,
      lost_carrier_count_7days: lostCarriers7days,
      total_online_seconds_7days: totalDuration7days,
      last_terminate_cause: analysis.lastSession?.terminate_cause || null,
      last_disconnect_time: analysis.isActive
        ? null
        : analysis.lastSession?.update_time || null,
      last_check_at: now.toISOString(),
      metrics_updated_at: now.toISOString(),
    }

    await supabase
      .from('subscriber_diagnostics')
      .upsert({
        customer_service_id: customerServiceId,
        interstellio_subscriber_id: interstellioSubscriberId,
        ...diagnosticsUpdate,
      })

    // Create health check event
    await this.createEvent({
      customer_service_id: customerServiceId,
      interstellio_subscriber_id: interstellioSubscriberId,
      event_type: 'health_check',
      event_source: 'health_check',
      event_data: {
        previous_status: previousStatus,
        new_status: newStatus,
        health_score: healthScore,
        alerts: alerts.map((a) => a.type),
      },
      session_active: analysis.isActive,
      session_ip: analysis.lastSession?.calling_station_id || null,
      nas_ip: analysis.lastSession?.nas_ip_address || null,
      terminate_cause: analysis.lastSession?.terminate_cause || null,
      session_duration_seconds: analysis.lastSession?.duration || null,
      severity: this.getHighestSeverity(alerts),
      health_impact: healthScore - (currentDiagnostics?.health_score || 100),
      requires_action: alerts.some(
        (a) => a.severity === 'critical' || a.severity === 'high'
      ),
    })

    // Create ticket if needed
    let ticketCreated = false
    let ticketId: string | undefined

    if (alerts.some((a) => a.severity === 'critical' || a.severity === 'high')) {
      const ticket = await this.createTicket(
        customerServiceId,
        alerts.filter((a) => a.severity === 'critical' || a.severity === 'high'),
        newStatus,
        healthScore
      )
      if (ticket) {
        ticketCreated = true
        ticketId = ticket.id
      }
    }

    return {
      customer_service_id: customerServiceId,
      interstellio_subscriber_id: interstellioSubscriberId,
      previous_status: previousStatus as HealthStatus,
      new_status: newStatus,
      health_score: healthScore,
      is_active: analysis.isActive,
      sessions_today: analysis.totalSessionsToday,
      lost_carriers_today: lostCarriersToday,
      total_duration_today: analysis.totalDurationSeconds,
      sessions_7days: cdrRecords.length,
      lost_carriers_7days: lostCarriers7days,
      total_duration_7days: totalDuration7days,
      stability_score: stabilityScore,
      alerts,
      ticket_created: ticketCreated,
      ticket_id: ticketId,
    }
  }

  /**
   * Calculate health score based on metrics
   */
  private calculateHealthScore(metrics: {
    isActive: boolean
    lostCarriersToday: number
    lostCarriers7days: number
    sessionsToday: number
    stabilityScore: number
    totalDuration7days: number
  }): number {
    let score = 100

    // Active session bonus/penalty
    if (!metrics.isActive) {
      score -= this.weights.session_active
    }

    // Lost carrier penalty
    const lostCarrierPenalty =
      metrics.lostCarriersToday * this.weights.lost_carrier_penalty
    score -= Math.min(lostCarrierPenalty, 30) // Cap at 30 points

    // Stability bonus
    score += (metrics.stabilityScore / 100) * this.weights.session_stability - this.weights.session_stability
    // (This adds 0 for 100% stability, -30 for 0% stability)

    // Uptime weight (based on 7-day uptime)
    const maxPossibleSeconds = 7 * 24 * 60 * 60 // 604800 seconds
    const uptimePercentage = (metrics.totalDuration7days / maxPossibleSeconds) * 100
    const uptimeScore = (uptimePercentage / 100) * this.weights.uptime_weight
    score += uptimeScore - this.weights.uptime_weight
    // (This adds 0 for 100% uptime, -40 for 0% uptime)

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Calculate stability score based on session patterns
   */
  private calculateStabilityScore(
    records: TelemetryCDRRecord[],
    lostCarriers: number
  ): number {
    if (records.length === 0) return 0

    // Stability factors:
    // 1. Low number of sessions (fewer reconnects = more stable)
    // 2. Low lost carrier ratio
    // 3. Average session duration > 1 hour

    const avgDuration =
      records.reduce((sum, r) => sum + (r.duration || 0), 0) / records.length
    const lostCarrierRatio = lostCarriers / records.length

    let score = 100

    // Penalize for too many sessions (instability indicator)
    if (records.length > 28) {
      // More than 4 sessions/day on average
      score -= Math.min((records.length - 28) * 2, 30)
    }

    // Penalize for high lost carrier ratio
    score -= lostCarrierRatio * 40

    // Bonus for long average sessions (stable connections)
    if (avgDuration > 3600) {
      // > 1 hour average
      score += 10
    } else if (avgDuration < 300) {
      // < 5 minutes average
      score -= 20
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Generate alerts based on metrics and thresholds
   */
  private generateAlerts(params: {
    lostCarriersToday: number
    lostCarriers7days: number
    isActive: boolean
    previousStatus: HealthStatus
    newStatus: HealthStatus
    lastCheckAt: string | null
  }): HealthAlert[] {
    const alerts: HealthAlert[] = []

    // Lost carrier spike alert
    if (params.lostCarriersToday >= this.thresholds.lost_carrier_critical) {
      alerts.push({
        type: 'lost_carrier_spike',
        severity: 'critical',
        message: `Critical: ${params.lostCarriersToday} connection drops today`,
        value: params.lostCarriersToday,
        threshold: this.thresholds.lost_carrier_critical,
      })
    } else if (params.lostCarriersToday >= this.thresholds.lost_carrier_warning) {
      alerts.push({
        type: 'lost_carrier_spike',
        severity: 'high',
        message: `High: ${params.lostCarriersToday} connection drops today`,
        value: params.lostCarriersToday,
        threshold: this.thresholds.lost_carrier_warning,
      })
    }

    // Connection down alert
    if (!params.isActive && params.previousStatus !== 'offline') {
      alerts.push({
        type: 'connection_down',
        severity: 'high',
        message: 'Customer connection is currently offline',
        value: 0,
        threshold: 0,
      })
    }

    // Prolonged offline alert
    if (params.lastCheckAt && !params.isActive) {
      const lastCheck = new Date(params.lastCheckAt)
      const hoursOffline = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60)

      if (hoursOffline >= this.thresholds.offline_hours_critical) {
        alerts.push({
          type: 'prolonged_offline',
          severity: 'critical',
          message: `Customer offline for ${Math.round(hoursOffline)} hours`,
          value: hoursOffline,
          threshold: this.thresholds.offline_hours_critical,
        })
      } else if (hoursOffline >= this.thresholds.offline_hours_warning) {
        alerts.push({
          type: 'prolonged_offline',
          severity: 'medium',
          message: `Customer offline for ${Math.round(hoursOffline)} hours`,
          value: hoursOffline,
          threshold: this.thresholds.offline_hours_warning,
        })
      }
    }

    // Session instability alert (too many reconnects)
    if (params.lostCarriers7days > 20) {
      alerts.push({
        type: 'session_instability',
        severity: 'medium',
        message: `Unstable connection: ${params.lostCarriers7days} drops in 7 days`,
        value: params.lostCarriers7days,
        threshold: 20,
      })
    }

    return alerts
  }

  /**
   * Get highest severity from alerts
   */
  private getHighestSeverity(alerts: HealthAlert[]): Severity {
    if (alerts.length === 0) return 'info'

    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
    for (const severity of severityOrder) {
      if (alerts.some((a) => a.severity === severity)) {
        return severity
      }
    }
    return 'info'
  }

  /**
   * Create a subscriber event record
   */
  private async createEvent(event: Partial<SubscriberEvent>): Promise<void> {
    const supabase = await createClient()

    await supabase.from('subscriber_events').insert({
      customer_service_id: event.customer_service_id,
      interstellio_subscriber_id: event.interstellio_subscriber_id,
      event_type: event.event_type,
      event_source: event.event_source,
      event_data: event.event_data || {},
      session_active: event.session_active,
      session_ip: event.session_ip,
      nas_ip: event.nas_ip,
      terminate_cause: event.terminate_cause,
      session_duration_seconds: event.session_duration_seconds,
      severity: event.severity || 'info',
      health_impact: event.health_impact || 0,
      requires_action: event.requires_action || false,
      webhook_payload: event.webhook_payload,
      webhook_received_at: event.webhook_received_at,
    })
  }

  /**
   * Create support ticket for alerts
   */
  private async createTicket(
    customerServiceId: string,
    alerts: HealthAlert[],
    healthStatus: HealthStatus,
    healthScore: number
  ): Promise<{ id: string; ticket_number: string } | null> {
    const supabase = await createClient()

    // Get customer info
    const { data: service } = await supabase
      .from('customer_services')
      .select(`
        customer_id,
        connection_id,
        package_name,
        installation_address,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('id', customerServiceId)
      .single()

    if (!service) {
      console.error(`[DiagnosticsAnalyzer] Service not found: ${customerServiceId}`)
      return null
    }

    // Check for existing open diagnostics ticket
    const { data: existingTicket } = await supabase
      .from('support_tickets')
      .select('id, ticket_number')
      .eq('customer_id', service.customer_id)
      .eq('category', 'diagnostics')
      .in('status', ['open', 'pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingTicket) {
      // Update existing ticket with new alerts
      await supabase
        .from('support_tickets')
        .update({
          description: this.buildTicketDescription(alerts, healthStatus, healthScore, service),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingTicket.id)

      return existingTicket
    }

    // Generate ticket number
    const ticketNumber = `DIAG-${Date.now().toString(36).toUpperCase()}`

    // Create new ticket
    const severity = this.getHighestSeverity(alerts)
    const priority = severity === 'critical' ? 'urgent' : severity === 'high' ? 'high' : 'medium'

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        customer_id: service.customer_id,
        subject: `[Auto] Connection Issue - ${this.getAlertSummary(alerts)}`,
        description: this.buildTicketDescription(alerts, healthStatus, healthScore, service),
        priority,
        category: 'diagnostics',
        status: 'open',
      })
      .select('id, ticket_number')
      .single()

    if (error) {
      console.error(`[DiagnosticsAnalyzer] Failed to create ticket:`, error)
      return null
    }

    // Create ticket_created event
    await this.createEvent({
      customer_service_id: customerServiceId,
      interstellio_subscriber_id: service.connection_id,
      event_type: 'ticket_created',
      event_source: 'system',
      event_data: {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        alerts: alerts.map((a) => a.type),
      },
      severity,
      requires_action: true,
    })

    return ticket
  }

  /**
   * Get summary of alerts for ticket subject
   */
  private getAlertSummary(alerts: HealthAlert[]): string {
    if (alerts.length === 0) return 'Unknown Issue'

    const types = [...new Set(alerts.map((a) => a.type))]

    if (types.includes('lost_carrier_spike')) {
      return 'Frequent Connection Drops'
    }
    if (types.includes('connection_down')) {
      return 'Connection Offline'
    }
    if (types.includes('prolonged_offline')) {
      return 'Extended Outage'
    }
    if (types.includes('session_instability')) {
      return 'Unstable Connection'
    }

    return 'Connection Issue'
  }

  /**
   * Build ticket description from alerts
   */
  private buildTicketDescription(
    alerts: HealthAlert[],
    healthStatus: HealthStatus,
    healthScore: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service: any
  ): string {
    const customer = service.customers

    return `
## Auto-Generated Diagnostics Ticket

**Customer:** ${customer.first_name} ${customer.last_name}
**Email:** ${customer.email}
**Phone:** ${customer.phone || 'N/A'}
**Package:** ${service.package_name}
**Address:** ${service.installation_address}

### Current Status
- **Health Status:** ${healthStatus.toUpperCase()}
- **Health Score:** ${healthScore}/100

### Alerts Detected
${alerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.message}`).join('\n')}

### Recommended Actions
1. Contact customer to confirm connectivity issue
2. Check CPE/router status if customer reports problem
3. Escalate to NOC if line issue suspected

---
*This ticket was automatically created by the Diagnostics System.*
    `.trim()
  }

  /**
   * Format date for Interstellio API
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+02:00`
  }
}

// =============================================================================
// Exported Functions
// =============================================================================

/**
 * Create analyzer instance with default settings
 */
export function createDiagnosticsAnalyzer(
  thresholds?: SeverityThresholds,
  weights?: HealthScoreWeights
): DiagnosticsAnalyzer {
  return new DiagnosticsAnalyzer(thresholds, weights)
}

/**
 * Analyze a single subscriber (convenience function)
 */
export async function analyzeSubscriber(
  customerServiceId: string,
  interstellioSubscriberId: string
): Promise<HealthCheckResult> {
  const analyzer = createDiagnosticsAnalyzer()
  return analyzer.analyzeSubscriber(customerServiceId, interstellioSubscriberId)
}
