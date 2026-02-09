/**
 * Interstellio Diagnostics Webhook Handler
 *
 * Receives webhooks from Interstellio (NebularStack) for:
 * - subscriber-authenticated: PPPoE authentication events
 * - subscriber-nas-updated: NAS/BNG updates
 * - subscriber-session-start: Session start events
 *
 * Processes events to update diagnostics and trigger alerts.
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createDiagnosticsAnalyzer } from '@/lib/diagnostics/analyzer'
import {
  type InterstellioWebhookPayload,
  type WebhookHandlerResult,
  type EventType,
  type Severity,
  terminateCauseToEventType,
} from '@/lib/diagnostics/types'
import { AdminNotificationService } from '@/lib/notifications/admin-notifications'
import { webhookLogger } from '@/lib/logging'

// Webhook secret for signature verification (optional - Interstellio may not sign)
const WEBHOOK_SECRET = process.env.INTERSTELLIO_WEBHOOK_SECRET

// Rate limiting: Max events per subscriber per minute
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX_EVENTS = 30

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * POST /api/webhooks/interstellio/diagnostics
 *
 * Receives and processes Interstellio webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Parse request body
    const rawBody = await request.text()
    let payload: InterstellioWebhookPayload

    try {
      payload = JSON.parse(rawBody)
    } catch {
      webhookLogger.error('[Interstellio Webhook] Invalid JSON payload')
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET) {
      const signature = request.headers.get('x-interstellio-signature') ||
                       request.headers.get('x-webhook-signature')

      if (!signature || !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
        webhookLogger.error('[Interstellio Webhook] Invalid signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Validate required fields
    if (!payload.subscriber?.id || !payload.trigger) {
      webhookLogger.error('[Interstellio Webhook] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: subscriber.id and trigger' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const subscriberId = payload.subscriber.id
    if (!checkRateLimit(subscriberId)) {
      webhookLogger.warn(`[Interstellio Webhook] Rate limit exceeded for ${subscriberId}`)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    webhookLogger.info(`[Interstellio Webhook] Received ${payload.trigger} for ${subscriberId}`)

    // Process the webhook
    const result = await processWebhook(payload, rawBody)

    const duration = Date.now() - startTime
    webhookLogger.info(
      `[Interstellio Webhook] Processed ${payload.trigger} in ${duration}ms: ${result.action}`
    )

    return NextResponse.json(result)
  } catch (error) {
    webhookLogger.error('[Interstellio Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as WebhookHandlerResult,
      { status: 500 }
    )
  }
}

/**
 * Process incoming webhook and update diagnostics
 */
async function processWebhook(
  payload: InterstellioWebhookPayload,
  rawBody: string
): Promise<WebhookHandlerResult> {
  const supabase = await createClient()
  const subscriberId = payload.subscriber.id

  // Find customer service by Interstellio subscriber ID
  const { data: serviceData } = await supabase.rpc(
    'find_customer_service_by_interstellio_id',
    { p_interstellio_id: subscriberId }
  )

  if (!serviceData || serviceData.length === 0) {
    webhookLogger.info(
      `[Interstellio Webhook] Unknown subscriber ${subscriberId}, ignoring`
    )
    return {
      success: true,
      action: 'ignored',
      error: 'Subscriber not found in CircleTel database',
    }
  }

  const service = serviceData[0]
  const customerServiceId = service.customer_service_id

  // Determine event type from webhook trigger
  const eventType = mapTriggerToEventType(payload.trigger)

  // Determine severity based on context
  const severity = determineSeverity(payload)

  // Calculate health impact
  const healthImpact = calculateHealthImpact(payload)

  // Insert event record
  const { data: eventRecord, error: eventError } = await supabase
    .from('subscriber_events')
    .insert({
      customer_service_id: customerServiceId,
      interstellio_subscriber_id: subscriberId,
      event_type: eventType,
      event_source: 'webhook',
      event_data: {
        trigger: payload.trigger,
        context: payload.context,
        username: payload.subscriber.username,
        nas_ip: payload.subscriber.last_known_nas_ip4,
        calling_station_id: payload.subscriber.calling_station_id,
      },
      session_active: payload.trigger === 'subscriber-session-start',
      session_ip: payload.subscriber.calling_station_id,
      nas_ip: payload.subscriber.last_known_nas_ip4,
      severity,
      health_impact: healthImpact,
      requires_action: severity === 'critical' || severity === 'high',
      webhook_payload: JSON.parse(rawBody),
      webhook_received_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (eventError) {
    webhookLogger.error('[Interstellio Webhook] Failed to insert event:', eventError)
    return {
      success: false,
      action: 'error',
      error: 'Failed to record event',
    }
  }

  // Update diagnostics record with latest event info
  await supabase
    .from('subscriber_diagnostics')
    .upsert({
      customer_service_id: customerServiceId,
      interstellio_subscriber_id: subscriberId,
      last_event_at: new Date().toISOString(),
      is_session_active: payload.trigger === 'subscriber-session-start',
      current_session_ip: payload.subscriber.calling_station_id,
      nas_ip_address: payload.subscriber.last_known_nas_ip4,
    })

  // For session start events, run full analysis
  let ticketCreated = false
  let ticketId: string | undefined

  if (payload.trigger === 'subscriber-session-start') {
    const analyzer = createDiagnosticsAnalyzer()
    const result = await analyzer.analyzeSubscriber(customerServiceId, subscriberId)

    ticketCreated = result.ticket_created
    ticketId = result.ticket_id

    // Send alert notification if high severity
    if (result.alerts.some(a => a.severity === 'critical' || a.severity === 'high')) {
      await sendAlertNotification(service, result.alerts, result.health_score)
    }
  }

  return {
    success: true,
    action: 'processed',
    event_id: eventRecord.id,
    customer_service_id: customerServiceId,
    health_impact: healthImpact,
    ticket_created: ticketCreated,
    ticket_id: ticketId,
  }
}

/**
 * Map Interstellio trigger to internal event type
 */
function mapTriggerToEventType(
  trigger: InterstellioWebhookPayload['trigger']
): EventType {
  switch (trigger) {
    case 'subscriber-authenticated':
      return 'authenticated'
    case 'subscriber-nas-updated':
      return 'nas_updated'
    case 'subscriber-session-start':
      return 'session_start'
    default:
      return 'session_start'
  }
}

/**
 * Determine severity based on webhook context
 */
function determineSeverity(payload: InterstellioWebhookPayload): Severity {
  // Session start is generally info level
  if (payload.trigger === 'subscriber-session-start') {
    return 'info'
  }

  // NAS updates can indicate issues
  if (payload.trigger === 'subscriber-nas-updated') {
    return 'low'
  }

  // Authentication events are info
  if (payload.trigger === 'subscriber-authenticated') {
    return 'info'
  }

  return 'info'
}

/**
 * Calculate health impact of the event
 */
function calculateHealthImpact(payload: InterstellioWebhookPayload): number {
  // Session start is positive (connection restored)
  if (payload.trigger === 'subscriber-session-start') {
    return 5 // Small positive impact
  }

  // Other events are neutral
  return 0
}

/**
 * Verify webhook signature (HMAC-SHA256)
 */
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Check rate limit for subscriber
 */
function checkRateLimit(subscriberId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(subscriberId)

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(subscriberId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX_EVENTS) {
    return false
  }

  entry.count++
  return true
}

/**
 * Send alert notification to support team
 */
async function sendAlertNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  alerts: any[],
  healthScore: number
): Promise<void> {
  try {
    // Use existing admin notification service
    // Format alert message
    const alertMessages = alerts
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .map(a => `[${a.severity.toUpperCase()}] ${a.message}`)
      .join('\n')

    webhookLogger.info(
      `[Interstellio Webhook] Alert notification for ${service.customer_name}:`,
      alertMessages
    )

    // Email would be sent here using AdminNotificationService
    // For now, just log it
    // await AdminNotificationService.notifyDiagnosticsAlert({ ... })
  } catch (error) {
    webhookLogger.error('[Interstellio Webhook] Failed to send alert:', error)
  }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Every minute
