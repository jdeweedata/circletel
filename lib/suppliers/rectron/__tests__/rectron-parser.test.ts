import { describe, it, expect } from '@jest/globals'
import ExcelJS from 'exceljs'
import { parseRectronBuffer } from '../rectron-parser'

/**
 * Build an in-memory .xlsx matching the real Rectron layout:
 *   rows 1-4 filler, row 5 headers, row 6+ data.
 * Columns: PRODUCT_LINE | CLASS | SUB_CLASS | ITEM | PRICE | DESCRIPTION | WARRANTY | FilterHelper
 */
async function buildRectronWorkbookBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('RECTRON_PRICE_LIST')

  ws.getRow(1).values = ['Rectron Price List']
  ws.getRow(5).values = [
    'PRODUCT LINE', 'CLASS', 'SUB CLASS', 'ITEM', 'PRICE (R)', 'DESCRIPTION', 'WARRANTY', 'FilterHelper',
  ]
  // A real product row
  ws.getRow(6).values = ['AMD', 'CPU', 'AMD Ryzen', 'ABC-123', 1500, 'AMD Ryzen 5 5600', 12, 1]
  // A category-header row (same plain text across the first columns) — must be skipped
  ws.getRow(7).values = ['COMPONENTS', 'COMPONENTS', 'COMPONENTS', 'COMPONENTS', null, null, null, null]
  // A second product row
  ws.getRow(8).values = ['Seagate', 'Hard Drives', 'Seagate HDD', 'ST2000', 899.5, '2TB HDD', 24, 1]

  const arr = await wb.xlsx.writeBuffer()
  return Buffer.from(arr as ArrayBuffer)
}

describe('parseRectronBuffer', () => {
  it('parses products from an in-memory xlsx buffer (no disk)', async () => {
    const buffer = await buildRectronWorkbookBuffer()

    const result = await parseRectronBuffer(buffer, 'RECTRON_PRICE_LIST_test.xlsm')

    expect(result.success).toBe(true)
    expect(result.file_name).toBe('RECTRON_PRICE_LIST_test.xlsm')
    expect(result.products_parsed).toBe(2)

    const skus = result.products.map((p) => p.sku).sort()
    expect(skus).toEqual(['ABC-123', 'ST2000'])

    const amd = result.products.find((p) => p.sku === 'ABC-123')!
    expect(amd.cost_price).toBe(1500)
    expect(amd.manufacturer).toBe('AMD')
    expect(amd.warranty_months).toBe(12)
  })

  it('returns success:false when the expected sheet is missing', async () => {
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('SOME_OTHER_SHEET')
    const buffer = Buffer.from((await wb.xlsx.writeBuffer()) as ArrayBuffer)

    const result = await parseRectronBuffer(buffer, 'wrong.xlsm')
    expect(result.success).toBe(false)
    expect(result.errors.join(' ')).toMatch(/RECTRON_PRICE_LIST.*not found/i)
  })
})
