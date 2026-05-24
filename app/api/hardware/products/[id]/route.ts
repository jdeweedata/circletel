/**
 * Hardware Products API — Single Product CRUD
 *
 * GET  /api/hardware/products/[id]     — fetch product with relations
 * PATCH /api/hardware/products/[id]    — update product fields
 */

import { NextResponse } from 'next/server'
import {
  getHardwareProductById,
  updateHardwareProduct,
} from '@/lib/hardware-catalogue/queries'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await getHardwareProductById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('[Hardware API] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const product = await updateHardwareProduct(id, body)
    return NextResponse.json(product)
  } catch (error) {
    console.error('[Hardware API] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}
