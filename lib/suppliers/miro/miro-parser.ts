/**
 * MiRO Distribution xlsx Price List Parser
 *
 * Parses the MiRO price list xlsx file (May 2026 format).
 * Every sheet has the identical structure:
 *
 *   Row 1: "Price list generated on DD-MM-YYYY"
 *   Row 2: "MiRO Client Code: XXXXXX"
 *   Row 3: empty
 *   Row 4: Headers — Item Code | Item Description | Retail Price | Your Price | Item Link
 *   Row 5+: Product rows
 *
 * Retail Price and Your Price are formatted strings like "R1,234.00"
 * and must be parsed to numbers. All prices exclude VAT.
 */

import ExcelJS from 'exceljs'
import type { ParsedMiRoProduct, MiRoParseResult } from './miro-types'

// =====================================================
// Constants
// =====================================================

/** Header row number (1-indexed) */
const HEADER_ROW = 4

/** Data starts on this row */
const DATA_START_ROW = 5

/** Skip the "(use for new brand)" template sheet */
const SKIP_SHEETS = new Set(['(use for new brand)'])

// =====================================================
// Public API
// =====================================================

export async function parseMiRoFile(
  filePath: string
): Promise<MiRoParseResult> {
  const startTime = Date.now()

  const fileName = filePath.split('/').pop() || 'unknown'

  try {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(filePath)

    return parseWorkbook(wb, fileName, startTime)
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`[MiRoParser] Failed: ${errorMsg}`)

    return {
      success: false,
      file_name: fileName,
      sheets_processed: 0,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      errors: [errorMsg],
      duration_ms: durationMs,
    }
  }
}

export async function parseMiRoXlsxBuffer(
  buffer: ExcelJS.Buffer,
  fileName = 'miro-pricing.xlsx'
): Promise<MiRoParseResult> {
  const startTime = Date.now()

  try {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)
    return parseWorkbook(wb, fileName, startTime)
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`[MiRoParser] Failed: ${errorMsg}`)

    return {
      success: false,
      file_name: fileName,
      sheets_processed: 0,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      errors: [errorMsg],
      duration_ms: durationMs,
    }
  }
}

export function parseMiRoCsvContent(
  csvContent: string,
  fileName = 'miro-pricing.csv'
): MiRoParseResult {
  const startTime = Date.now()
  const errors: string[] = []

  try {
    const lines = csvContent
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length < 2) {
      throw new Error('CSV does not contain product rows')
    }

    const headers = parseCsvLine(lines[0]).map(normalizeHeader)
    const products: ParsedMiRoProduct[] = []
    let rowsSkipped = 0

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCsvLine(lines[i])
        const product = parseCsvProduct(headers, row)

        if (product) {
          products.push(product)
        } else {
          rowsSkipped++
        }
      } catch (error) {
        rowsSkipped++
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return {
      success: true,
      file_name: fileName,
      sheets_processed: 1,
      products_found: lines.length - 1,
      products_parsed: products.length,
      rows_skipped: rowsSkipped,
      products,
      errors,
      duration_ms: Date.now() - startTime,
    }
  } catch (error) {
    return {
      success: false,
      file_name: fileName,
      sheets_processed: 0,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration_ms: Date.now() - startTime,
    }
  }
}

// =====================================================
// Sheet Parsing
// =====================================================

function parseSheet(
  ws: ExcelJS.Worksheet,
  sheetName: string
): ParsedMiRoProduct[] {
  const products: ParsedMiRoProduct[] = []

  for (let r = DATA_START_ROW; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)

    // Column A: Item Code
    const sku = getCellText(row, 1)
    // Column B: Item Description
    const description = getCellText(row, 2)
    // Column C: Retail Price (formatted string)
    const retailPriceStr = getCellText(row, 3)
    // Column D: Your Price / Dealer Cost (formatted string)
    const yourPriceStr = getCellText(row, 4)
    // Column E: Product URL
    const itemLink = getCellText(row, 5)

    // Skip empty rows
    if (!sku && !description) continue

    // Must have a SKU
    if (!sku || sku.length < 2) continue

    // Parse prices
    const retailPrice = parsePrice(retailPriceStr)
    const costPrice = parsePrice(yourPriceStr)

    // Skip rows without a meaningful price
    if (costPrice === null && retailPrice === null) continue

    products.push({
      sku: sku.trim(),
      name: description || sku.trim(),
      description: description || null,
      manufacturer: sheetName,
      cost_price: costPrice || 0,
      retail_price: retailPrice || 0,
      source_image_url: '',
      product_url: itemLink || '',
      stock_cpt: 0,
      stock_jhb: 0,
      stock_dbn: 0,
      stock_total: 0, // Not in xlsx
      category: sheetName,
    })
  }

  return products
}

function parseWorkbook(
  wb: ExcelJS.Workbook,
  fileName: string,
  startTime: number
): MiRoParseResult {
  const errors: string[] = []
  const allProducts: ParsedMiRoProduct[] = []

  console.log(
    `[MiRoParser] Parsing ${fileName}: ${wb.worksheets.length} sheets`
  )

  let productsFound = 0
  let sheetsProcessed = 0

  for (const ws of wb.worksheets) {
    const name = ws.name.trim()

    if (SKIP_SHEETS.has(name)) continue

    sheetsProcessed++

    try {
      const sheetProducts = parseSheet(ws, name)
      allProducts.push(...sheetProducts)
      productsFound += ws.rowCount - DATA_START_ROW + 1

      if (sheetProducts.length > 0) {
        console.log(
          `[MiRoParser] ${name}: ${sheetProducts.length} products`
        )
      }
    } catch (err) {
      const msg = `Sheet "${name}": ${err instanceof Error ? err.message : 'Unknown error'}`
      errors.push(msg)
    }
  }

  const rowsSkipped = productsFound - allProducts.length

  return {
    success: true,
    file_name: fileName,
    sheets_processed: sheetsProcessed,
    products_found: productsFound,
    products_parsed: allProducts.length,
    rows_skipped: Math.max(0, rowsSkipped),
    products: allProducts,
    errors,
    duration_ms: Date.now() - startTime,
  }
}

function parseCsvProduct(
  headers: string[],
  row: string[]
): ParsedMiRoProduct | null {
  const repairedRow = repairMiRoCsvRow(headers, row)

  const get = (...names: string[]): string | null => {
    for (const name of names) {
      const index = headers.indexOf(name)
      if (index >= 0) {
        const value = repairedRow[index]?.trim()
        if (value) return value
      }
    }
    return null
  }

  const sku = get('item_code', 'sku', 'code', 'product_code')
  const description = get('item_description', 'description', 'name')
  const retailPrice = parsePrice(get('retail_price', 'rrp', 'list_price'))
  const costPrice = parsePrice(get('your_price', 'dealer_price', 'cost_price'))
  const itemLink = get('item_link', 'product_url', 'url', 'link')

  if (!sku || sku.length < 2) return null
  if (costPrice === null && retailPrice === null) return null

  return {
    sku: sku.trim(),
    name: description || sku.trim(),
    description: description || null,
    manufacturer: 'MiRO',
    cost_price: costPrice || 0,
    retail_price: retailPrice || 0,
    source_image_url: '',
    product_url: itemLink || '',
    stock_cpt: 0,
    stock_jhb: 0,
    stock_dbn: 0,
    stock_total: 0,
    category: 'MiRO',
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i++
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function repairMiRoCsvRow(headers: string[], row: string[]): string[] {
  if (row.length <= headers.length) return row

  const skuIndex = headers.indexOf('item_code')
  const descriptionIndex = headers.indexOf('item_description')
  const retailIndex = headers.indexOf('retail_price')
  const costIndex = headers.indexOf('your_price')
  const linkIndex = headers.indexOf('item_link')

  if (
    headers.length === 5 &&
    skuIndex === 0 &&
    descriptionIndex === 1 &&
    retailIndex === 2 &&
    costIndex === 3 &&
    linkIndex === 4
  ) {
    return [
      row[0] || '',
      row[1] || '',
      row.slice(2, -2).join(','),
      row[row.length - 2] || '',
      row[row.length - 1] || '',
    ]
  }

  return row.slice(0, headers.length)
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// =====================================================
// Helpers
// =====================================================

function getCellText(
  row: ExcelJS.Row,
  col: number
): string | null {
  const cell = row.getCell(col)
  const value = cell.value
  if (value === null || value === undefined) return null

  if (typeof value === 'object' && 'richText' in value) {
    const rt = value as { richText: Array<{ text: string }> }
    return rt.richText.map((t) => t.text).join('').trim() || null
  }

  if (typeof value === 'object' && 'text' in value) {
    return (value as { text: string }).text.trim() || null
  }

  const str = String(value).trim()
  return str || null
}

/**
 * Parse a South African price string like "R1,234.00" or "R42.50" to a number
 */
function parsePrice(raw: string | null): number | null {
  if (!raw) return null

  // Remove currency symbol and whitespace
  let cleaned = raw.replace(/[R\s]/g, '')

  // Remove thousand separators (commas)
  cleaned = cleaned.replace(/,/g, '')

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}
