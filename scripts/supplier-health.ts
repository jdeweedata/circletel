/**
 * Supplier Sync Health Dashboard
 *
 * Run with:
 *   npx tsx scripts/supplier-health.ts
 *
 * Shows sync status, product counts, and recent errors for all suppliers.
 */

import { config } from 'dotenv'
config({ path: '.env.production.local' })

import { createClient } from '@/lib/supabase/server'

async function main() {
  const supabase = await createClient()

  // Fetch supplier summaries using the existing view
  const { data: summaries, error } = await supabase
    .from('suppliers')
    .select(
      `
      code,
      name,
      is_active,
      sync_status,
      last_synced_at,
      sync_error,
      feed_type
    `
    )
    .order('name')

  if (error) {
    console.error('Failed to fetch supplier data:', error.message)
    process.exit(1)
  }

  if (!summaries || summaries.length === 0) {
    console.log('No suppliers found.')
    return
  }

  // Fetch product counts per supplier
  const { data: productCounts } = await supabase
    .from('supplier_products')
    .select('supplier_id, is_active, in_stock')
    .then(({ data }) => {
      if (!data) return { data: [] }

      // Group by supplier using supplier name lookup
      const counts: Record<string, { total: number; active: number; inStock: number }> = {}
      // We need supplier names — fetch supplier IDs
      return supabase
        .from('suppliers')
        .select('id, code')
        .then(({ data: supplierData }) => {
          const codeById = new Map(
            (supplierData || []).map((s) => [s.id, s.code])
          )
          for (const p of data) {
            const code = codeById.get(p.supplier_id) || 'UNKNOWN'
            if (!counts[code]) {
              counts[code] = { total: 0, active: 0, inStock: 0 }
            }
            counts[code].total++
            if (p.is_active) counts[code].active++
            if (p.in_stock) counts[code].inStock++
          }
          return { data: counts }
        })
    })
    .then((result) => {
      if ('data' in result && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
        return result.data as Record<string, { total: number; active: number; inStock: number }>
      }
      return {}
    })

  // Fetch recent sync errors (last 7 days)
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: recentErrors } = (await supabase
    .from('supplier_sync_logs')
    .select(
      `
      supplier_id,
      error_message,
      started_at
    `
    )
    .eq('status', 'failed')
    .gte('started_at', sevenDaysAgo)
    .order('started_at', { ascending: false })
    .limit(10)) as {
    data: Array<{
      supplier_id: string
      error_message: string | null
      started_at: string
    }> | null
  }

  // Map supplier IDs to codes for error display
  const supplierCodeById = new Map<string, string>()
  const { data: supplierList } = await supabase
    .from('suppliers')
    .select('id, code')
  for (const s of supplierList || []) {
    supplierCodeById.set(s.id, s.code)
  }

  // =====================================================
  // Display
  // =====================================================

  console.log('Supplier Sync Health Dashboard')
  console.log('==============================')
  console.log('')

  for (const supplier of summaries) {
    const code = (supplier as { code: string }).code
    const name = (supplier as { name: string }).name
    const isActive = (supplier as { is_active: boolean }).is_active
    const syncStatus = (supplier as { sync_status: string }).sync_status
    const lastSynced = (supplier as { last_synced_at: string | null }).last_synced_at
    const syncError = (supplier as { sync_error: string | null }).sync_error
    const feedType = (supplier as { feed_type: string }).feed_type

    const counts = productCounts?.[code] || {
      total: 0,
      active: 0,
      inStock: 0,
    }
    const staleThreshold = 24 * 60 * 60 * 1000
    const isStale =
      lastSynced &&
      Date.now() - new Date(lastSynced).getTime() > staleThreshold

    const statusIcon = !isActive
      ? '⚫'
      : syncStatus === 'success'
        ? '🟢'
        : syncStatus === 'failed'
          ? '🔴'
          : syncStatus === 'syncing'
            ? '🟡'
            : '⚪'

    const staleLabel = isStale ? ' ⚠️ STALE' : ''

    console.log(`${statusIcon} ${name} (${code})`)
    console.log(`   Feed: ${feedType} | Status: ${syncStatus}${staleLabel}`)
    console.log(
      `   Last sync: ${lastSynced ? new Date(lastSynced).toLocaleString('en-ZA') : 'never'}`
    )
    console.log(
      `   Products: ${counts.total} total | ${counts.active} active | ${counts.inStock} in stock`
    )
    if (syncError) {
      console.log(`   Last error: ${syncError}`)
    }
    console.log('')
  }

  // Recent errors section
  if (recentErrors && recentErrors.length > 0) {
    console.log('=== RECENT SYNC ERRORS (last 7 days) ===')
    for (const err of recentErrors) {
      const code = supplierCodeById.get(err.supplier_id) || 'UNKNOWN'
      console.log(
        `  ${new Date(err.started_at).toLocaleString('en-ZA')} — ${code}: ${err.error_message}`
      )
    }
    console.log('')
  }
}

main().catch((error) => {
  console.error('Health check failed:', error)
  process.exit(1)
})
