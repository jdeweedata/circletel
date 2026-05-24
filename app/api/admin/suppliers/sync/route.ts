/**
 * Admin Supplier Sync Trigger API
 *
 * POST /api/admin/suppliers/sync
 * Body: { supplier: "SCOOP" }
 *
 * Triggers a sync for a specific supplier in the background.
 * Returns immediately — does not wait for sync to complete.
 */

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supplier = body.supplier as string

    if (!supplier) {
      return NextResponse.json(
        { error: 'Missing supplier code' },
        { status: 400 }
      )
    }

    // Build the command
    const cmd = `cd /home/circletel && set -a && source .env.production.local 2>/dev/null && set +a && npx tsx scripts/sync-all-suppliers.ts --supplier ${supplier} >> /tmp/supplier-sync-trigger.log 2>&1 &`

    // Fire and forget
    const { exec } = await import('child_process')
    exec(cmd, (error) => {
      if (error) {
        console.error(
          `[Sync Trigger] Failed to start sync for ${supplier}:`,
          error.message
        )
      }
    })

    return NextResponse.json({
      success: true,
      message: `Sync triggered for ${supplier}`,
    })
  } catch (error) {
    console.error('[Sync Trigger API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    )
  }
}
