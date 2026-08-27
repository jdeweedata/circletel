/**
 * Hardware Products API — public Storefront list
 *
 * GET /api/hardware/products?search=router&page=1
 * Always returns published Promoted rows. Dealer cost is stripped.
 */

import { NextResponse } from 'next/server'
import { getHardwareProducts } from '@/lib/hardware-catalogue/queries'
import { omitDealerCost } from '@/lib/hardware-catalogue/storefront'
import type { HardwareProductFilters } from '@/lib/hardware-catalogue/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: HardwareProductFilters = {
      status: 'published',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      page_size: parseInt(searchParams.get('page_size') || '20', 10),
      category: searchParams.get('category') || undefined,
    }

    const result = await getHardwareProducts(filters)
    return NextResponse.json({
      ...result,
      data: result.data.map((row) =>
        omitDealerCost(row as unknown as Record<string, unknown>)
      ),
    })
  } catch (error) {
    console.error('[Hardware API] List error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
