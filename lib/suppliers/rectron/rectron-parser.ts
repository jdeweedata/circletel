/**
 * Rectron Price List Parser
 *
 * Parses the RECTRON_PRICE_LIST sheet from a Rectron .xlsm file.
 * Uses exceljs (already a project dependency) for xlsm parsing.
 *
 * The sheet structure:
 *   Row 1-2: Empty
 *   Row 3: Navigation links (skip)
 *   Row 4: Disclaimer text (skip)
 *   Row 5: Headers: PRODUCT LINE | CLASS | SUB CLASS | ITEM | PRICE (R) | DESCRIPTION | WARRANTY | FilterHelper
 *   Row 6+: Data rows and category group headers
 *
 * We skip rows that are category group headers (where all columns have the same text).
 */

import ExcelJS from 'exceljs'
import type {
  RectronXlsmRow,
  ParsedRectronProduct,
  RectronParseResult,
} from './rectron-types'

// =====================================================
// Constants
// =====================================================

/** Row where headers are located (1-indexed) */
const HEADER_ROW = 5

/** Row where data starts (1-indexed) */
const DATA_START_ROW = 6

/** Expected sheet name */
const SHEET_NAME = 'RECTRON_PRICE_LIST'

/** Column indices (1-indexed) */
const COL = {
  PRODUCT_LINE: 1,
  CLASS: 2,
  SUB_CLASS: 3,
  ITEM: 4,
  PRICE: 5,
  DESCRIPTION: 6,
  WARRANTY: 7,
  FILTER_HELPER: 8,
} as const

/** SKU pattern: must contain at least one digit or look like a part number */
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-#]+$/

/** Minimum SKU length */
const MIN_SKU_LENGTH = 3

// =====================================================
// Public API
// =====================================================

/**
 * Parse a Rectron .xlsm price list file
 */
export async function parseRectronFile(filePath: string): Promise<RectronParseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const products: ParsedRectronProduct[] = []
  let rowsSkipped = 0

  const fileName = filePath.split('/').pop() || 'unknown'

  try {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(filePath)

    const ws = wb.getWorksheet(SHEET_NAME)
    if (!ws) {
      throw new Error(`Sheet "${SHEET_NAME}" not found in ${fileName}`)
    }

    console.log(
      `[RectronParser] Parsing ${fileName}: ${ws.rowCount} rows, ${ws.columnCount} cols`
    )

    for (let r = DATA_START_ROW; r <= ws.rowCount; r++) {
      const row = readRow(ws, r)

      // Skip empty rows
      if (!row.item && row.price === null) {
        rowsSkipped++
        continue
      }

      // Skip category group headers (where PRODUCT_LINE === CLASS === SUB_CLASS === ITEM)
      if (isCategoryHeader(row)) {
        rowsSkipped++
        continue
      }

      // Validate we have a proper product row
      if (!isValidProductRow(row)) {
        rowsSkipped++
        continue
      }

      try {
        const product = toProduct(row)
        products.push(product)
      } catch (err) {
        const msg = `Row ${r}: ${err instanceof Error ? err.message : 'Unknown parse error'}`
        errors.push(msg)
        rowsSkipped++
      }
    }

    const durationMs = Date.now() - startTime

    return {
      success: true,
      file_name: fileName,
      products_found: ws.rowCount - DATA_START_ROW + 1,
      products_parsed: products.length,
      rows_skipped: rowsSkipped,
      products,
      errors,
      duration_ms: durationMs,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[RectronParser] Failed to parse ${fileName}: ${errorMsg}`)

    return {
      success: false,
      file_name: fileName,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      errors: [errorMsg],
      duration_ms: durationMs,
    }
  }
}

// =====================================================
// Row Reading Helpers
// =====================================================

/**
 * Read a row from the worksheet into a RectronXlsmRow
 */
function readRow(
  ws: ExcelJS.Worksheet,
  rowNum: number
): RectronXlsmRow {
  // exceljs rows are 1-indexed
  const row = ws.getRow(rowNum)

  const getCellValue = (col: number): string | null => {
    const cell = row.getCell(col)
    const value = cell.value
    if (value === null || value === undefined) return null
    // Handle rich text (merged cells with formatting)
    if (typeof value === 'object' && 'richText' in value) {
      const rt = value as { richText: Array<{ text: string }> }
      return rt.richText.map((t) => t.text).join('').trim() || null
    }
    // Handle formula results (exceljs stores as { formula: ..., result: ... })
    if (typeof value === 'object' && 'result' in value) {
      const result = (value as { result: unknown }).result
      return result !== null && result !== undefined ? String(result) : null
    }
    return String(value).trim() || null
  }

  const getCellNumber = (col: number): number | null => {
    const cell = row.getCell(col)
    const value = cell.value
    if (value === null || value === undefined) return null
    // Handle formula results
    if (typeof value === 'object' && 'result' in value) {
      const result = (value as { result: unknown }).result
      if (typeof result === 'number') return result
      return null
    }
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
      return isNaN(parsed) ? null : parsed
    }
    return null
  }

  return {
    product_line: getCellValue(COL.PRODUCT_LINE),
    class: getCellValue(COL.CLASS),
    sub_class: getCellValue(COL.SUB_CLASS),
    item: getCellValue(COL.ITEM),
    price: getCellNumber(COL.PRICE),
    description: getCellValue(COL.DESCRIPTION),
    warranty: getCellNumber(COL.WARRANTY),
    filter_helper: getCellNumber(COL.FILTER_HELPER),
  }
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Check if a row is a category group header.
 * These rows have the same text in PRODUCT_LINE, CLASS, SUB_CLASS, and ITEM.
 * e.g., "COMPONENTS" in all columns, or "AMD" in all columns.
 */
function isCategoryHeader(row: RectronXlsmRow): boolean {
  const vals = [row.product_line, row.class, row.sub_class, row.item]
  const nonNull = vals.filter((v): v is string => v !== null)
  if (nonNull.length < 2) return false
  // All non-null values must be the same AND be plain text (no digits/dashes)
  // This prevents SKU-like values from being treated as category headers
  const allSame = nonNull.every((v) => v === nonNull[0])
  const isPlainText = /^[A-Za-z\s/]+$/.test(nonNull[0])
  return allSame && isPlainText
}

/**
 * Check if a row looks like a valid product (has a SKU-like ITEM and a numeric PRICE)
 */
function isValidProductRow(row: RectronXlsmRow): boolean {
  // Must have an ITEM that looks like a SKU
  if (!row.item || row.item.length < MIN_SKU_LENGTH) return false
  if (!SKU_PATTERN.test(row.item)) return false

  // Must have a price (some products might be POA but those we skip)
  if (row.price === null || row.price <= 0) return false

  return true
}

// =====================================================
// Product Conversion
// =====================================================

/**
 * Convert a raw xlsm row to a ParsedRectronProduct
 */
function toProduct(row: RectronXlsmRow): ParsedRectronProduct {
  // Use description as the product name, falling back to ITEM
  const name = row.description || row.item || 'Unknown Product'

  // Build a richer description from the available fields
  const descriptionParts = [
    row.product_line ? `${row.product_line}` : null,
    row.sub_class ? `${row.sub_class}` : null,
    row.description || null,
  ].filter(Boolean)

  return {
    sku: row.item!.trim(),
    name: name.trim(),
    description: descriptionParts.join(' — ') || null,
    manufacturer: row.product_line || 'Unknown',
    cost_price: row.price!,
    retail_price: row.price!, // Rectron doesn't provide retail price
    source_image_url: '', // Not in the xlsm
    stock_cpt: 0, // Not tracked by Rectron
    stock_jhb: 0,
    stock_dbn: 0,
    stock_total: 0,
    product_url: null,
    category: row.class || null,
    subcategory: row.sub_class || null,
    warranty_months: row.warranty,
  }
}
