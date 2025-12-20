/**
 * Admin Diagnostics API - Detail Endpoint
 *
 * GET /api/admin/diagnostics/[id] - Get single subscriber diagnostics
 * POST /api/admin/diagnostics/[id] - Trigger manual analysis
 *
 * @version 1.0
 * @created 2025-12-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createDiagnosticsAnalyzer } from '@/lib/diagnostics/analyzer'
import { getInterstellioClient } from '@/lib/interstellio'
import type { DataUsageEntry } from '@/lib/interstellio/types'
import type {
  DiagnosticsDetailResponse,
  ManualDiagnosticsRequest,
  ManualDiagnosticsResponse,
  UsageSummary,
} from '@/lib/diagnostics/types'

/**
 * GET /api/admin/diagnostics/[id]
 *
 * Get detailed diagnostics for a single subscriber
 *
 * Params:
 * - id: Customer service ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Get diagnostics record
    const { data: diagnostics, error: diagError } = await supabase
      .from('subscriber_diagnostics')
      .select('*')
      .eq('customer_service_id', id)
      .single()

    if (diagError || !diagnostics) {
      return NextResponse.json(
        { error: 'Diagnostics record not found' },
        { status: 404 }
      )
    }

    // Get customer service with customer info
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select(`
        id,
        package_name,
        status,
        installation_address,
        provider_name,
        connection_id,
        customer_id,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          account_number
        )
      `)
      .eq('id', id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Customer service not found' },
        { status: 404 }
      )
    }

    // Get recent events (last 50)
    const { data: events } = await supabase
      .from('subscriber_events')
      .select('*')
      .eq('customer_service_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get open tickets for this customer
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, subject, status, created_at')
      .eq('customer_id', service.customer_id)
      .in('status', ['open', 'pending', 'in_progress'])
      .order('created_at', { ascending: false })

    // Fetch usage data from Interstellio
    let usage: UsageSummary | null = null

    if (service.connection_id) {
      try {
        const client = getInterstellioClient()
        const now = new Date()

        // Calculate totals from usage entries
        const calculateTotals = (entries: DataUsageEntry[]) => {
          const totalUploadKb = entries.reduce((sum, e) => sum + (e.upload_kb || 0), 0)
          const totalDownloadKb = entries.reduce((sum, e) => sum + (e.download_kb || 0), 0)
          return {
            uploadGb: Math.round((totalUploadKb / 1024 / 1024) * 100) / 100,
            downloadGb: Math.round((totalDownloadKb / 1024 / 1024) * 100) / 100,
            totalGb: Math.round(((totalUploadKb + totalDownloadKb) / 1024 / 1024) * 100) / 100,
          }
        }

        // Fetch today's usage (hourly aggregation)
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        const todayUsage = await client.getSubscriberUsage(
          service.connection_id,
          'hourly',
          {
            start: startOfToday.toISOString(),
            end: now.toISOString(),
          }
        )

        // Fetch 7-day usage (daily aggregation)
        const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const sevenDayUsage = await client.getSubscriberUsage(
          service.connection_id,
          'daily',
          {
            start: startOf7Days.toISOString(),
            end: now.toISOString(),
          }
        )

        usage = {
          today: calculateTotals(todayUsage),
          sevenDays: calculateTotals(sevenDayUsage),
          lastUpdated: now.toISOString(),
        }
      } catch (error) {
        console.error('[Admin Diagnostics] Failed to fetch usage data:', error)
        // Don't fail entire request - just set usage to null
        usage = null
      }
    }

    // Handle the case where customers might be an array or single object
    const customersData = service.customers as unknown
    const customer = (Array.isArray(customersData) ? customersData[0] : customersData) as {
      id: string
      first_name: string
      last_name: string
      email: string
      phone: string | null
      account_number: string | null
    }

    const response: DiagnosticsDetailResponse = {
      diagnostics,
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.phone,
        account_number: customer.account_number,
      },
      service: {
        id: service.id,
        package_name: service.package_name,
        status: service.status,
        installation_address: service.installation_address,
        provider_name: service.provider_name,
      },
      recent_events: events || [],
      open_tickets: tickets || [],
      usage,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Admin Diagnostics Detail] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/diagnostics/[id]
 *
 * Trigger manual diagnostics analysis for a subscriber
 *
 * Body:
 * - include_speed_test: boolean (optional)
 * - force_refresh: boolean (optional)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const body: ManualDiagnosticsRequest = await request.json()

    const supabase = await createClient()

    // Get customer service with connection_id
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('id, connection_id')
      .eq('id', id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Customer service not found' },
        { status: 404 }
      )
    }

    if (!service.connection_id) {
      return NextResponse.json(
        { error: 'No Interstellio subscriber ID configured for this service' },
        { status: 400 }
      )
    }

    // Run analysis
    const analyzer = createDiagnosticsAnalyzer()
    const result = await analyzer.analyzeSubscriber(id, service.connection_id)

    // Create manual analysis event
    await supabase.from('subscriber_events').insert({
      customer_service_id: id,
      interstellio_subscriber_id: service.connection_id,
      event_type: 'health_check',
      event_source: 'manual',
      event_data: {
        triggered_by: 'admin',
        force_refresh: body.force_refresh || false,
        include_speed_test: body.include_speed_test || false,
      },
      session_active: result.is_active,
      severity: 'info',
      health_impact: 0,
      requires_action: false,
    })

    const response: ManualDiagnosticsResponse = {
      success: true,
      result,
    }

    // TODO: Add speed test integration if requested
    // if (body.include_speed_test) {
    //   response.speed_test = await runSpeedTest(service.connection_id)
    // }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Admin Diagnostics Analyze] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      } as ManualDiagnosticsResponse,
      { status: 500 }
    )
  }
}
