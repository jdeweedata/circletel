/**
 * Hardware Products API — List / Search
 *
 * GET /api/hardware/products?status=published&search=router&page=1
 */

import { NextResponse } from 'next/server'
import { getHardwareProducts } from '@/lib/hardware-catalogue/queries'
import type { HardwareProductFilters } from '@/lib/hardware-catalogue/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: HardwareProductFilters = {
      status:
        (searchParams.get('status') as HardwareProductFilters['status']) ||
        undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
      category: searchParams.get('category') || undefined,
    }

    const result = await getHardwareProducts(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Hardware API] List error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
