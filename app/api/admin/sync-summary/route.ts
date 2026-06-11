/**
 * Sync Summary API
 *
 * GET /api/admin/sync-summary?days=7
 *
 * Returns recent sync activity and alerts across all suppliers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request)
  if (!authResult.success) return authResult.response

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const supabase = await createClient()
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString()

    // Recent sync logs
    const { data: syncLogs } = await supabase
      .from('supplier_sync_logs')
      .select(
        `
        id,
        supplier_id,
        status,
        products_found,
        products_created,
        products_updated,
        products_deactivated,
        error_message,
        duration_ms,
        started_at,
        completed_at,
        supplier:suppliers (code, name)
      `
      )
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(20)

    // Hardware products pending review (cost changes >5%)
    // We check for products where cost changed from the last sync
    const { data: costChanges } = await supabase
      .from('hardware_product_suppliers')
      .select(
        `
        id,
        hardware_product_id,
        supplier_cost,
        last_synced_cost,
        cost_updated_at,
        hardware_product:circletel_hardware_products (
          id, name, slug
        )
      `
      )
      .not('last_synced_cost', 'is', null)
      .gte(
        'cost_updated_at',
        new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      )
      .order('cost_updated_at', { ascending: false })
      .limit(10)

    // Calculate change percentages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const costAlerts = (costChanges || []).map((cc: any) => {
      const oldCost = cc.last_synced_cost || 0
      const newCost = cc.supplier_cost || 0
      const changePercent =
        oldCost > 0
          ? Math.round(((newCost - oldCost) / oldCost) * 1000) / 10
          : 100

      return {
        hardware_product_id: cc.hardware_product_id,
        product_name: cc.hardware_product?.name || 'Unknown',
        product_slug: cc.hardware_product?.slug || '',
        old_cost: oldCost,
        new_cost: newCost,
        change_percent: changePercent,
        updated_at: cc.cost_updated_at,
      }
    })

    // Filter to only significant changes
    const significantChanges = costAlerts.filter(
      (a: { change_percent: number }) => Math.abs(a.change_percent) >= 5
    )

    // Supplier status summary
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('code, name, sync_status, last_synced_at')

    const staleThreshold = 24 * 60 * 60 * 1000
    const supplierStatus = (suppliers || []).map((s) => ({
      code: s.code,
      name: s.name,
      status: s.sync_status,
      last_synced: s.last_synced_at,
      is_stale:
        s.last_synced_at &&
        Date.now() - new Date(s.last_synced_at).getTime() >
          staleThreshold,
    }))

    return NextResponse.json({
      recent_syncs: (syncLogs || []).map((log) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...log,
        supplier_name: (log as any).supplier?.name || 'Unknown',
        supplier_code: (log as any).supplier?.code || 'UNKNOWN',
      })),
      cost_alerts: significantChanges,
      supplier_status: supplierStatus,
      summary: {
        total_syncs: syncLogs?.length || 0,
        failed_syncs:
          syncLogs?.filter((l) => l.status === 'failed').length || 0,
        products_created:
          syncLogs?.reduce((s, l) => s + l.products_created, 0) || 0,
        products_updated:
          syncLogs?.reduce((s, l) => s + l.products_updated, 0) || 0,
        cost_alerts_count: significantChanges.length,
        stale_suppliers: supplierStatus.filter((s) => s.is_stale)
          .length,
      },
    })
  } catch (error) {
    console.error('[Sync Summary API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync summary' },
      { status: 500 }
    )
  }
}
