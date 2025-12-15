/**
 * API Route: /api/admin/integrations/interstellio/subscribers/[id]/usage
 *
 * GET: Get usage data for subscriber
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getInterstellioClient, DataAggregation } from '@/lib/interstellio'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/integrations/interstellio/subscribers/[id]/usage
 *
 * Query params:
 * - aggregation: hourly, daily, weekly, monthly (default: daily)
 * - days: Number of days to fetch (default: 30, max: 90)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriberId } = await context.params
    const { searchParams } = new URL(request.url)

    const aggregation = (searchParams.get('aggregation') || 'daily') as DataAggregation
    const days = Math.min(parseInt(searchParams.get('days') || '30'), 90)

    // Validate aggregation
    const validAggregations: DataAggregation[] = ['hourly', 'daily', 'weekly', 'monthly', 'yearly']
    if (!validAggregations.includes(aggregation)) {
      return NextResponse.json({ error: 'Invalid aggregation. Use: hourly, daily, weekly, monthly, yearly' }, { status: 400 })
    }

    // Auth
    const supabaseSSR = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const supabaseAdmin = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabaseSSR.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Calculate date range
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    // Get usage from Interstellio
    const client = getInterstellioClient()
    const usageData = await client.getSubscriberUsage(subscriberId, aggregation, {
      start: start.toISOString(),
      end: end.toISOString(),
    })

    // Calculate totals and format data
    let totalUploadKb = 0
    let totalDownloadKb = 0

    const formattedData = usageData.map((entry) => {
      totalUploadKb += entry.upload_kb || 0
      totalDownloadKb += entry.download_kb || 0

      return {
        time: entry.time,
        uploadKb: entry.upload_kb || 0,
        downloadKb: entry.download_kb || 0,
        totalKb: entry.combined_kb || (entry.upload_kb || 0) + (entry.download_kb || 0),
        uploadMb: Math.round((entry.upload_kb || 0) / 1024 * 100) / 100,
        downloadMb: Math.round((entry.download_kb || 0) / 1024 * 100) / 100,
        totalMb: Math.round(((entry.combined_kb || 0) || ((entry.upload_kb || 0) + (entry.download_kb || 0))) / 1024 * 100) / 100,
      }
    })

    return NextResponse.json({
      subscriberId,
      aggregation,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        days,
      },
      data: formattedData,
      summary: {
        totalUploadMb: Math.round(totalUploadKb / 1024 * 100) / 100,
        totalDownloadMb: Math.round(totalDownloadKb / 1024 * 100) / 100,
        totalUploadGb: Math.round(totalUploadKb / 1024 / 1024 * 100) / 100,
        totalDownloadGb: Math.round(totalDownloadKb / 1024 / 1024 * 100) / 100,
        totalCombinedGb: Math.round((totalUploadKb + totalDownloadKb) / 1024 / 1024 * 100) / 100,
        dataPoints: formattedData.length,
      },
    })
  } catch (error) {
    console.error('Interstellio usage error:', error)

    if (error instanceof Error && 'status' in error) {
      const apiError = error as Error & { status: number }
      if (apiError.status === 404) {
        return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 })
      }
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Interstellio authentication failed', code: 'INTERSTELLIO_AUTH_ERROR' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch usage data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
