import { describe, expect, it } from '@jest/globals'

import { planEsquireUpsert, toSupplierProductRow } from '../esquire-map'
import type { ParsedEsquireProduct } from '../esquire-types'

const g5c: ParsedEsquireProduct = {
  sku: 'G5C',
  name: 'ZTE G5C',
  description: '5G CPE',
  category: 'Network Routers 5G',
  cost_price: 1999,
  in_stock: true,
  available_qty_raw: 'Yes',
  source_image_url: 'https://cdn.example/g5c.jpg',
}

describe('toSupplierProductRow', () => {
  it('stores Yes as stock_total 1 so in_stock is true, not a warehouse count', () => {
    const row = toSupplierProductRow(g5c, 'supplier-1')
    expect(row.sku).toBe('G5C')
    expect(row.stock_total).toBe(1)
    expect(row.metadata).toEqual({
      available_qty_raw: 'Yes',
      stock_is_boolean: true,
    })
  })
})

describe('planEsquireUpsert', () => {
  it('inserts new SKUs and updates price/stock without duplicating', () => {
    const first = planEsquireUpsert([g5c], new Map())
    expect(first.insert).toEqual(['G5C'])
    expect(first.update).toEqual([])

    const second = planEsquireUpsert(
      [{ ...g5c, cost_price: 1899, in_stock: false }],
      new Map([['G5C', { cost_price: 1999, stock_total: 1 }]])
    )
    expect(second.insert).toEqual([])
    expect(second.update).toEqual(['G5C'])
    expect(second.unchanged).toEqual([])

    const third = planEsquireUpsert(
      [g5c],
      new Map([['G5C', { cost_price: 1999, stock_total: 1 }]])
    )
    expect(third.unchanged).toEqual(['G5C'])
    expect(third.insert).toEqual([])
    expect(third.update).toEqual([])
  })
})
