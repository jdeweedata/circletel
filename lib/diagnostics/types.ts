/**
 * Diagnostics & Troubleshooting Module - Type Definitions
 *
 * Types for subscriber health monitoring, event tracking, and auto-ticketing.
 * Integrates with Interstellio (NebularStack) webhooks and CDR data.
 *
 * @version 1.0
 * @created 2025-12-20
 */

// =============================================================================
// Health Status Types
// =============================================================================

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown'

export type EventType =
  | 'session_start'
  | 'session_end'
  | 'lost_carrier'
  | 'user_request'
  | 'session_timeout'
  | 'admin_reset'
  | 'port_error'
  | 'nas_error'
  | 'health_check'
  | 'status_change'
  | 'alert_triggered'
  | 'ticket_created'
  | 'nas_updated'
  | 'authenticated'

export type EventSource = 'webhook' | 'health_check' | 'manual' | 'system'

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical'

// =============================================================================
// Database Records
// =============================================================================

/**
 * Subscriber diagnostics record from database
 */
export interface SubscriberDiagnostics {
  id: string
  customer_service_id: string
  interstellio_subscriber_id: string | null

  // Health Status
  health_status: HealthStatus
  health_score: number // 0-100

  // Session Status
  is_session_active: boolean
  last_session_start: string | null
  last_session_duration_seconds: number
  current_session_ip: string | null
  nas_ip_address: string | null

  // Today's Metrics
  total_sessions_today: number
  lost_carrier_count_today: number
  user_request_count_today: number
  session_timeout_count_today: number
  avg_session_duration_seconds: number

  // 7-Day Metrics
  total_sessions_7days: number
  lost_carrier_count_7days: number
  total_online_seconds_7days: number

  // Last Event
  last_terminate_cause: string | null
  last_disconnect_time: string | null

  // Timestamps
  last_check_at: string | null
  last_event_at: string | null
  metrics_updated_at: string
  created_at: string
  updated_at: string
}

/**
 * Subscriber event record from database
 */
export interface SubscriberEvent {
  id: string
  customer_service_id: string
  diagnostics_id: string | null
  interstellio_subscriber_id: string

  // Event Details
  event_type: EventType
  event_source: EventSource
  event_data: Record<string, unknown>

  // Session Info at Time of Event
  session_active: boolean | null
  session_ip: string | null
  nas_ip: string | null
  terminate_cause: string | null
  session_duration_seconds: number | null

  // Analysis Results
  severity: Severity
  health_impact: number // -100 to +100
  requires_action: boolean
  action_taken: string | null

  // Ticket Reference
  ticket_id: string | null

  // Webhook Raw Data
  webhook_payload: Record<string, unknown> | null
  webhook_received_at: string | null

  // Timestamps
  created_at: string
}

/**
 * Summary view record for admin dashboard
 */
export interface DiagnosticsSummary {
  diagnostics_id: string
  customer_service_id: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  package_name: string
  service_status: string
  installation_address: string

  // Diagnostics
  health_status: HealthStatus
  health_score: number
  is_session_active: boolean
  current_session_ip: string | null
  last_session_start: string | null
  last_session_duration_seconds: number

  // Today's Metrics
  total_sessions_today: number
  lost_carrier_count_today: number
  avg_session_duration_seconds: number

  // 7-Day Metrics
  total_sessions_7days: number
  lost_carrier_count_7days: number
  total_online_seconds_7days: number

  // Last Event
  last_terminate_cause: string | null
  last_disconnect_time: string | null
  last_check_at: string | null
  last_event_at: string | null
  interstellio_subscriber_id: string | null

  // Event Counts
  events_24h: number
  critical_events_24h: number
}

// =============================================================================
// Webhook Types
// =============================================================================

/**
 * Interstellio webhook payload (from NebularStack)
 */
export interface InterstellioWebhookPayload {
  timestamp: string
  timezone: string
  context: 'radius-authentication' | 'radius-accounting'
  trigger: 'subscriber-authenticated' | 'subscriber-nas-updated' | 'subscriber-session-start'
  subscriber: {
    id: string
    domain: string
    username: string
    tenant_id: string
    virtual_id: string
    last_known_nas_ip4: string
    calling_station_id: string | null
    profile_id: string
    service_id: string
  }
  radius_request: Record<string, unknown>
  radius_response: Record<string, unknown>
}

/**
 * Webhook handler result
 */
export interface WebhookHandlerResult {
  success: boolean
  action: 'processed' | 'ignored' | 'error'
  event_id?: string
  customer_service_id?: string
  health_impact?: number
  ticket_created?: boolean
  ticket_id?: string
  error?: string
}

// =============================================================================
// Health Check Types
// =============================================================================

/**
 * Health check result for a single subscriber
 */
export interface HealthCheckResult {
  customer_service_id: string
  interstellio_subscriber_id: string
  previous_status: HealthStatus
  new_status: HealthStatus
  health_score: number

  // Session Analysis
  is_active: boolean
  sessions_today: number
  lost_carriers_today: number
  total_duration_today: number

  // 7-Day Trends
  sessions_7days: number
  lost_carriers_7days: number
  total_duration_7days: number
  stability_score: number // 0-100

  // Alerts
  alerts: HealthAlert[]
  ticket_created: boolean
  ticket_id?: string
}

/**
 * Health alert generated during check
 */
export interface HealthAlert {
  type: 'lost_carrier_spike' | 'session_instability' | 'connection_down' | 'prolonged_offline'
  severity: Severity
  message: string
  value: number // The metric value that triggered the alert
  threshold: number // The threshold that was exceeded
}

/**
 * Batch health check result
 */
export interface BatchHealthCheckResult {
  started_at: string
  completed_at: string
  total_checked: number
  healthy: number
  warning: number
  critical: number
  offline: number
  unknown: number
  errors: number
  tickets_created: number
  alerts_generated: HealthAlert[]
}

// =============================================================================
// Analysis Types
// =============================================================================

/**
 * Severity thresholds for auto-ticketing
 */
export interface SeverityThresholds {
  lost_carrier_warning: number // Number of lost carriers to trigger warning
  lost_carrier_critical: number // Number of lost carriers to trigger critical
  offline_hours_warning: number // Hours offline to trigger warning
  offline_hours_critical: number // Hours offline to trigger critical
  session_instability_threshold: number // Sessions per hour indicating instability
}

/**
 * Default severity thresholds
 */
export const DEFAULT_SEVERITY_THRESHOLDS: SeverityThresholds = {
  lost_carrier_warning: 5,
  lost_carrier_critical: 10,
  offline_hours_warning: 2,
  offline_hours_critical: 6,
  session_instability_threshold: 5, // 5+ sessions per hour = unstable
}

/**
 * Health score weights for calculation
 */
export interface HealthScoreWeights {
  session_active: number // Weight for having an active session
  lost_carrier_penalty: number // Penalty per lost carrier
  session_stability: number // Weight for stable sessions
  uptime_weight: number // Weight for uptime percentage
}

/**
 * Default health score weights
 */
export const DEFAULT_HEALTH_SCORE_WEIGHTS: HealthScoreWeights = {
  session_active: 30, // 30 points for being connected
  lost_carrier_penalty: 5, // -5 points per lost carrier
  session_stability: 30, // 30 points for stable sessions
  uptime_weight: 40, // 40 points based on uptime %
}

// =============================================================================
// Admin API Types
// =============================================================================

/**
 * Admin diagnostics list request params
 */
export interface DiagnosticsListParams {
  page?: number
  limit?: number
  health_status?: HealthStatus | 'all'
  sort_by?: 'health_score' | 'last_check_at' | 'lost_carrier_count_today' | 'customer_name'
  sort_order?: 'asc' | 'desc'
  search?: string // Search by customer name, email, or subscriber ID
}

/**
 * Admin diagnostics list response
 */
export interface DiagnosticsListResponse {
  data: DiagnosticsSummary[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  stats: {
    total: number
    healthy: number
    warning: number
    critical: number
    offline: number
    unknown: number
  }
}

/**
 * Usage summary from Interstellio telemetry
 */
export interface UsageSummary {
  today: {
    uploadGb: number
    downloadGb: number
    totalGb: number
  }
  sevenDays: {
    uploadGb: number
    downloadGb: number
    totalGb: number
  }
  lastUpdated: string | null
}

/**
 * Single subscriber diagnostics detail response
 */
export interface DiagnosticsDetailResponse {
  diagnostics: SubscriberDiagnostics
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
    account_number: string | null
  }
  service: {
    id: string
    package_name: string
    status: string
    installation_address: string
    provider_name: string | null
  }
  recent_events: SubscriberEvent[]
  open_tickets: {
    id: string
    ticket_number: string
    subject: string
    status: string
    created_at: string
  }[]
  usage: UsageSummary | null
}

/**
 * Manual diagnostics trigger request
 */
export interface ManualDiagnosticsRequest {
  customer_service_id: string
  include_speed_test?: boolean
  force_refresh?: boolean
}

/**
 * Manual diagnostics trigger response
 */
export interface ManualDiagnosticsResponse {
  success: boolean
  result?: HealthCheckResult
  speed_test?: {
    download_kbps: number
    upload_kbps: number
    timestamp: string
  }
  error?: string
}

// =============================================================================
// Notification Types
// =============================================================================

/**
 * Diagnostics alert notification payload
 */
export interface DiagnosticsAlertPayload {
  customer_name: string
  customer_email: string
  customer_phone: string | null
  package_name: string
  installation_address: string
  interstellio_subscriber_id: string

  // Alert Details
  alert_type: string
  severity: Severity
  message: string

  // Current Status
  health_status: HealthStatus
  health_score: number
  is_session_active: boolean
  last_terminate_cause: string | null

  // Metrics
  lost_carriers_today: number
  sessions_today: number

  // Links
  admin_diagnostics_url: string
  admin_customer_url: string

  // Ticket (if created)
  ticket_number?: string
  ticket_url?: string
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Map terminate cause to event type
 */
export function terminateCauseToEventType(cause: string | null): EventType {
  if (!cause) return 'session_start'

  switch (cause) {
    case 'Lost-Carrier':
      return 'lost_carrier'
    case 'User-Request':
      return 'user_request'
    case 'Session-Timeout':
      return 'session_timeout'
    case 'Idle-Timeout':
      return 'session_timeout'
    case 'Admin-Reset':
      return 'admin_reset'
    case 'Port-Error':
      return 'port_error'
    case 'NAS-Error':
      return 'nas_error'
    default:
      return 'session_end'
  }
}

/**
 * Calculate health status from score
 */
export function healthScoreToStatus(score: number): HealthStatus {
  if (score >= 80) return 'healthy'
  if (score >= 50) return 'warning'
  if (score > 0) return 'critical'
  return 'offline'
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return '#EF4444' // Red
    case 'high':
      return '#F97316' // Orange
    case 'medium':
      return '#F59E0B' // Amber
    case 'low':
      return '#3B82F6' // Blue
    case 'info':
    default:
      return '#6B7280' // Gray
  }
}

/**
 * Get health status color for UI
 */
export function getHealthStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return '#10B981' // Green
    case 'warning':
      return '#F59E0B' // Amber
    case 'critical':
      return '#EF4444' // Red
    case 'offline':
      return '#6B7280' // Gray
    case 'unknown':
    default:
      return '#9CA3AF' // Light Gray
  }
}

/**
 * Format duration from seconds
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}
