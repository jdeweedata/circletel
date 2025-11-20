#!/usr/bin/env tsx

/**
 * ZOHO Billing - Failed Sync Alerting System
 *
 * Monitors for failed syncs and sends notifications via:
 * - Email (using Resend API)
 * - Webhook (Slack, Discord, or custom endpoint)
 *
 * Usage:
 *   npm run zoho:alert-failed
 *   npm run zoho:alert-failed -- --dry-run
 *   npm run zoho:alert-failed -- --email-only
 *   npm run zoho:alert-failed -- --webhook-only
 *
 * Environment Variables Required:
 *   RESEND_API_KEY - For email notifications
 *   ALERT_EMAIL_TO - Email address to send alerts to
 *   ALERT_WEBHOOK_URL - Optional webhook URL for Slack/Discord
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const emailOnly = args.includes('--email-only')
const webhookOnly = args.includes('--webhook-only')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendApiKey = process.env.RESEND_API_KEY
const alertEmailTo = process.env.ALERT_EMAIL_TO || 'dev@circletel.co.za'
const webhookUrl = process.env.ALERT_WEBHOOK_URL

// Initialize Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface FailedSync {
  entity_type: string
  entity_id: string
  entity_details: string
  error_message: string | null
  failed_at: string
  attempts: number
}

interface AlertResult {
  email_sent: boolean
  webhook_sent: boolean
  errors: string[]
}

/**
 * Fetch failed syncs from the last 24 hours
 */
async function fetchRecentFailedSyncs(): Promise<FailedSync[]> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const failedSyncs: FailedSync[] = []

  // Check failed customers
  const { data: failedCustomers } = await supabase
    .from('customers')
    .select('id, email, account_number, updated_at')
    .eq('zoho_sync_status', 'failed')
    .neq('account_type', 'internal_test')
    .gte('updated_at', yesterday)
    .order('updated_at', { ascending: false })

  if (failedCustomers) {
    for (const customer of failedCustomers) {
      // Get error from sync logs
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('error_message, attempt_number')
        .eq('entity_type', 'customer')
        .eq('entity_id', customer.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)

      failedSyncs.push({
        entity_type: 'Customer',
        entity_id: customer.id,
        entity_details: `${customer.email} (${customer.account_number})`,
        error_message: logs?.[0]?.error_message || 'Unknown error',
        failed_at: customer.updated_at,
        attempts: logs?.[0]?.attempt_number || 1
      })
    }
  }

  // Check failed services
  const { data: failedServices } = await supabase
    .from('customer_services')
    .select(`
      id,
      package_name,
      updated_at,
      customer:customers!inner(email, account_number)
    `)
    .eq('zoho_sync_status', 'failed')
    .gte('updated_at', yesterday)
    .order('updated_at', { ascending: false })

  if (failedServices) {
    for (const service of failedServices as any[]) {
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('error_message, attempt_number')
        .eq('entity_type', 'subscription')
        .eq('entity_id', service.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)

      failedSyncs.push({
        entity_type: 'Subscription',
        entity_id: service.id,
        entity_details: `${service.package_name} - ${service.customer.email}`,
        error_message: logs?.[0]?.error_message || 'Unknown error',
        failed_at: service.updated_at,
        attempts: logs?.[0]?.attempt_number || 1
      })
    }
  }

  // Check failed invoices
  const { data: failedInvoices } = await supabase
    .from('customer_invoices')
    .select(`
      id,
      invoice_number,
      amount,
      updated_at,
      customer:customers!inner(email, account_number)
    `)
    .eq('zoho_sync_status', 'failed')
    .gte('updated_at', yesterday)
    .order('updated_at', { ascending: false })

  if (failedInvoices) {
    for (const invoice of failedInvoices as any[]) {
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('error_message, attempt_number')
        .eq('entity_type', 'invoice')
        .eq('entity_id', invoice.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)

      failedSyncs.push({
        entity_type: 'Invoice',
        entity_id: invoice.id,
        entity_details: `${invoice.invoice_number} - R${invoice.amount} - ${invoice.customer.email}`,
        error_message: logs?.[0]?.error_message || 'Unknown error',
        failed_at: invoice.updated_at,
        attempts: logs?.[0]?.attempt_number || 1
      })
    }
  }

  // Check failed payments
  const { data: failedPayments } = await supabase
    .from('payment_transactions')
    .select(`
      id,
      amount,
      payment_method,
      updated_at,
      customer:customers!inner(email, account_number)
    `)
    .eq('zoho_sync_status', 'failed')
    .gte('updated_at', yesterday)
    .order('updated_at', { ascending: false })

  if (failedPayments) {
    for (const payment of failedPayments as any[]) {
      const { data: logs } = await supabase
        .from('zoho_sync_logs')
        .select('error_message, attempt_number')
        .eq('entity_type', 'payment')
        .eq('entity_id', payment.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1)

      failedSyncs.push({
        entity_type: 'Payment',
        entity_id: payment.id,
        entity_details: `R${payment.amount} (${payment.payment_method}) - ${payment.customer.email}`,
        error_message: logs?.[0]?.error_message || 'Unknown error',
        failed_at: payment.updated_at,
        attempts: logs?.[0]?.attempt_number || 1
      })
    }
  }

  return failedSyncs
}

/**
 * Format failed syncs as HTML email
 */
function formatEmailHtml(failedSyncs: FailedSync[]): string {
  const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .summary { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #dc2626; }
        .sync-item { background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #f59e0b; }
        .sync-item h3 { margin: 0 0 10px 0; color: #dc2626; font-size: 16px; }
        .detail { margin: 5px 0; font-size: 14px; }
        .detail strong { color: #1f2937; }
        .error { color: #dc2626; background-color: #fef2f2; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 13px; }
        .footer { margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px; font-size: 13px; color: #6b7280; }
        .action-button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 ZOHO Billing Sync Failures Detected</h1>
        </div>
        <div class="content">
          <div class="summary">
            <p><strong>Time:</strong> ${timestamp}</p>
            <p><strong>Failed Syncs (Last 24h):</strong> ${failedSyncs.length}</p>
            <p><strong>Action Required:</strong> Review and retry failed syncs</p>
          </div>
  `

  for (const sync of failedSyncs) {
    const failedTime = new Date(sync.failed_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

    html += `
      <div class="sync-item">
        <h3>${sync.entity_type} Sync Failed</h3>
        <div class="detail"><strong>Entity:</strong> ${sync.entity_details}</div>
        <div class="detail"><strong>Failed At:</strong> ${failedTime}</div>
        <div class="detail"><strong>Attempts:</strong> ${sync.attempts}</div>
        <div class="error"><strong>Error:</strong> ${sync.error_message}</div>
      </div>
    `
  }

  html += `
          <a href="http://localhost:3001/admin/zoho-sync" class="action-button">View ZOHO Sync Dashboard</a>
        </div>
        <div class="footer">
          <p>This is an automated alert from CircleTel ZOHO Billing Integration.</p>
          <p>To retry failed syncs, run: <code>npm run zoho:retry-failed</code></p>
          <p>To check system health, run: <code>npm run zoho:health-check</code></p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Format failed syncs as plain text email
 */
function formatEmailText(failedSyncs: FailedSync[]): string {
  const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

  let text = `🚨 ZOHO Billing Sync Failures Detected\n`
  text += `═══════════════════════════════════════════════════════════\n\n`
  text += `Time: ${timestamp}\n`
  text += `Failed Syncs (Last 24h): ${failedSyncs.length}\n`
  text += `Action Required: Review and retry failed syncs\n\n`

  for (const sync of failedSyncs) {
    const failedTime = new Date(sync.failed_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

    text += `───────────────────────────────────────────────────────────\n`
    text += `${sync.entity_type} Sync Failed\n`
    text += `Entity: ${sync.entity_details}\n`
    text += `Failed At: ${failedTime}\n`
    text += `Attempts: ${sync.attempts}\n`
    text += `Error: ${sync.error_message}\n\n`
  }

  text += `═══════════════════════════════════════════════════════════\n`
  text += `To retry failed syncs: npm run zoho:retry-failed\n`
  text += `To check system health: npm run zoho:health-check\n`
  text += `Dashboard: http://localhost:3001/admin/zoho-sync\n`

  return text
}

/**
 * Send email alert using Resend API
 */
async function sendEmailAlert(failedSyncs: FailedSync[]): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CircleTel Alerts <alerts@circletel.co.za>',
        to: [alertEmailTo],
        subject: `🚨 ZOHO Billing: ${failedSyncs.length} Failed Sync${failedSyncs.length > 1 ? 's' : ''} Detected`,
        html: formatEmailHtml(failedSyncs),
        text: formatEmailText(failedSyncs)
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Email API error: ${error}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: `Email send failed: ${error}` }
  }
}

/**
 * Send webhook notification (Slack/Discord/Custom)
 */
async function sendWebhookAlert(failedSyncs: FailedSync[]): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl) {
    return { success: false, error: 'ALERT_WEBHOOK_URL not configured' }
  }

  const timestamp = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

  // Format for Slack/Discord (supports both formats)
  const payload = {
    username: 'CircleTel ZOHO Alerts',
    icon_emoji: ':rotating_light:',
    attachments: [
      {
        color: '#dc2626',
        title: '🚨 ZOHO Billing Sync Failures Detected',
        fields: [
          {
            title: 'Failed Syncs (Last 24h)',
            value: failedSyncs.length.toString(),
            short: true
          },
          {
            title: 'Time',
            value: timestamp,
            short: true
          }
        ],
        text: failedSyncs.map(sync =>
          `*${sync.entity_type}:* ${sync.entity_details}\n` +
          `Error: \`${sync.error_message}\``
        ).join('\n\n'),
        footer: 'CircleTel ZOHO Integration',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Webhook error: ${error}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: `Webhook send failed: ${error}` }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚨 ZOHO Billing Failed Sync Alerting System')
  console.log('════════════════════════════════════════════════════════════')

  if (isDryRun) {
    console.log('Mode: 🔍 DRY RUN (no alerts will be sent)')
  } else {
    console.log('Mode: ✅ LIVE (alerts will be sent)')
  }

  console.log('════════════════════════════════════════════════════════════\n')

  // Fetch failed syncs
  console.log('📊 Fetching failed syncs from last 24 hours...')
  const failedSyncs = await fetchRecentFailedSyncs()

  if (failedSyncs.length === 0) {
    console.log('✅ No failed syncs found - system healthy!')
    return
  }

  console.log(`⚠️  Found ${failedSyncs.length} failed sync(s):\n`)

  for (const sync of failedSyncs) {
    console.log(`  ${sync.entity_type}: ${sync.entity_details}`)
    console.log(`    Error: ${sync.error_message}`)
    console.log(`    Attempts: ${sync.attempts}`)
    console.log()
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN: Would send alerts to:')
    if (!emailOnly && !webhookOnly) {
      if (resendApiKey) console.log(`  📧 Email: ${alertEmailTo}`)
      if (webhookUrl) console.log(`  🔔 Webhook: ${webhookUrl}`)
    } else {
      if (emailOnly && resendApiKey) console.log(`  📧 Email: ${alertEmailTo}`)
      if (webhookOnly && webhookUrl) console.log(`  🔔 Webhook: ${webhookUrl}`)
    }
    return
  }

  // Send alerts
  console.log('📤 Sending alerts...\n')
  const result: AlertResult = {
    email_sent: false,
    webhook_sent: false,
    errors: []
  }

  // Send email alert
  if (!webhookOnly) {
    console.log('📧 Sending email alert...')
    const emailResult = await sendEmailAlert(failedSyncs)
    result.email_sent = emailResult.success

    if (emailResult.success) {
      console.log(`  ✅ Email sent to: ${alertEmailTo}`)
    } else {
      console.log(`  ❌ Email failed: ${emailResult.error}`)
      result.errors.push(`Email: ${emailResult.error}`)
    }
  }

  // Send webhook alert
  if (!emailOnly) {
    console.log('🔔 Sending webhook alert...')
    const webhookResult = await sendWebhookAlert(failedSyncs)
    result.webhook_sent = webhookResult.success

    if (webhookResult.success) {
      console.log('  ✅ Webhook notification sent')
    } else {
      console.log(`  ❌ Webhook failed: ${webhookResult.error}`)
      result.errors.push(`Webhook: ${webhookResult.error}`)
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('📊 Alert Results')
  console.log('════════════════════════════════════════════════════════════')
  console.log(`Failed Syncs: ${failedSyncs.length}`)
  console.log(`Email Sent: ${result.email_sent ? '✅ Yes' : '❌ No'}`)
  console.log(`Webhook Sent: ${result.webhook_sent ? '✅ Yes' : '❌ No'}`)

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:')
    result.errors.forEach(err => console.log(`  - ${err}`))
  }

  if (result.email_sent || result.webhook_sent) {
    console.log('\n✅ Alert(s) sent successfully!')
  } else {
    console.log('\n❌ No alerts were sent (check configuration)')
    process.exit(1)
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
