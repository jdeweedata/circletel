/**
 * Admin Supplier Sync API Route
 * POST /api/admin/suppliers/[id]/sync - Trigger manual sync for a supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncScoopProducts } from '@/lib/suppliers/scoop-sync'
import { cacheAllSupplierImages } from '@/lib/suppliers/image-cache'

// Allow longer execution for sync operations
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for sync

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST - Trigger manual sync for supplier
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Get supplier details
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id, code, name, feed_type, feed_url')
      .eq('id', id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if already syncing
    if (supplier.feed_type === 'manual') {
      return NextResponse.json(
        { success: false, error: 'This supplier does not support automated sync' },
        { status: 400 }
      )
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const cacheImages = body.cache_images ?? true
    const triggeredByUserId = body.user_id || null

    console.log(`[Supplier Sync] Starting sync for ${supplier.name} (${supplier.code})`)

    // Currently only Scoop is supported
    if (supplier.code !== 'SCOOP') {
      return NextResponse.json(
        { success: false, error: `Sync not implemented for supplier: ${supplier.code}` },
        { status: 501 }
      )
    }

    // Run sync
    const syncResult = await syncScoopProducts({
      triggered_by: 'manual',
      triggered_by_user_id: triggeredByUserId,
    })

    // Optionally cache images
    let imageCacheResult = null
    if (cacheImages && syncResult.success) {
      console.log(`[Supplier Sync] Caching images for ${supplier.name}`)
      try {
        imageCacheResult = await cacheAllSupplierImages(supplier.id, supplier.code)

        // Update sync log with image cache results
        await supabase
          .from('supplier_sync_logs')
          .update({ images_cached: imageCacheResult.cached })
          .eq('id', syncResult.log_id)
      } catch (imageError) {
        console.error('[Supplier Sync] Image caching failed:', imageError)
        // Don't fail the whole sync if image caching fails
      }
    }

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        error: syncResult.error || 'Sync failed',
        data: {
          log_id: syncResult.log_id,
          duration_ms: syncResult.duration_ms,
          stats: syncResult.stats,
        },
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed for ${supplier.name}`,
      data: {
        log_id: syncResult.log_id,
        duration_ms: syncResult.duration_ms,
        stats: {
          ...syncResult.stats,
          images_cached: imageCacheResult?.cached || 0,
        },
      },
    })
  } catch (error) {
    console.error('[Supplier Sync API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
