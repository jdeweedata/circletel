/**
 * Nology xlsx Price List Parser
 *
 * Parses the Nology Reseller Price List xlsx file (April 2026 format).
 * The workbook has 39 sheets — one per brand — each with consistent structure:
 *
 *   Row 3-4: Headers (SKU | DESCRIPTION | PRICE | COMMENTS)
 *   Subsequent: Product rows with category group headers interspersed
 *
 * Product sheets are identified by columns B (SKU), C (Description),
 * D (Price).
 *
 * Non-product sheets (PRICING, Categories, Delivery, EOL, Promotions,
 * New Products, Warehouse Clearance) are skipped.
 */

import ExcelJS from 'exceljs'
import type {
  NologyXlsxRow,
  ParsedNologyProduct,
  NologyParseResult,
  NologySheetResult,
} from './nology-types'

// =====================================================
// Constants
// =====================================================

/** Sheets to skip (utility/non-product sheets) */
const SKIP_SHEETS = new Set([
  'PRICING',
  'Categories',
  'Delivery',
  'EOL Products',
  'Promotions',
  'New Products',
  'Warehouse Clearance',
])

/** Row where headers typically start (varies slightly per sheet) */
const HEADER_SEARCH_START = 1
const HEADER_SEARCH_END = 8

/** SKU pattern: must contain at least one digit or look like a part number */
const SKU_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\-+#\s]+$/

/** Minimum SKU length */
const MIN_SKU_LENGTH = 3

/** Category header patterns — rows to skip */
const CATEGORY_HEADER_PATTERNS = [
  /^[A-Z\s]{3,}$/, // ALL CAPS (e.g., "SWITCHES", "ROUTERS")
  /^\d+$/, // Pure numbers
]

// =====================================================
// Public API
// =====================================================

/**
 * Parse a Nology xlsx price list file
 */
export async function parseNologyFile(
  filePath: string
): Promise<NologyParseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const allProducts: ParsedNologyProduct[] = []
  const sheetResults: NologySheetResult[] = []

  const fileName = filePath.split('/').pop() || 'unknown'

  try {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(filePath)

    console.log(
      `[NologyParser] Parsing ${fileName}: ${wb.worksheets.length} sheets`
    )

    let sheetsProcessed = 0

    for (const ws of wb.worksheets) {
      const name = ws.name.trim()

      // Skip utility sheets
      if (SKIP_SHEETS.has(name)) {
        continue
      }

      sheetsProcessed++

      try {
        const sheetResult = parseSheet(ws, name)
        sheetResults.push(sheetResult)
        allProducts.push(...sheetResult.products)

        if (sheetResult.products_parsed > 0) {
          console.log(
            `[NologyParser] ${name}: ${sheetResult.products_parsed} products`
          )
        }
      } catch (err) {
        const msg = `Sheet "${name}": ${err instanceof Error ? err.message : 'Unknown error'}`
        errors.push(msg)
        sheetResults.push({
          sheet_name: name,
          brand: name,
          products_found: 0,
          products_parsed: 0,
          rows_skipped: 0,
          products: [],
          errors: [msg],
        })
      }
    }

    const durationMs = Date.now() - startTime
    const totalRowsSkipped = sheetResults.reduce(
      (sum, s) => sum + s.rows_skipped,
      0
    )

    return {
      success: true,
      file_name: fileName,
      sheets_processed: sheetsProcessed,
      products_found: allProducts.length + totalRowsSkipped,
      products_parsed: allProducts.length,
      rows_skipped: totalRowsSkipped,
      products: allProducts,
      sheet_results: sheetResults,
      errors,
      duration_ms: durationMs,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`[NologyParser] Failed to parse ${fileName}: ${errorMsg}`)

    return {
      success: false,
      file_name: fileName,
      sheets_processed: 0,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      sheet_results: [],
      errors: [errorMsg],
      duration_ms: durationMs,
    }
  }
}

// =====================================================
// Sheet Parsing
// =====================================================

function parseSheet(
  ws: ExcelJS.Worksheet,
  sheetName: string
): NologySheetResult {
  const errors: string[] = []
  const products: ParsedNologyProduct[] = []
  let rowsSkipped = 0

  const brand = sheetName

  // Find header row by looking for "SKU" in first few rows
  let headerRow = 0
  for (let r = HEADER_SEARCH_START; r <= HEADER_SEARCH_END; r++) {
    const cellB = getCellText(ws, r, 2)
    if (cellB && cellB.toUpperCase().trim() === 'SKU') {
      headerRow = r
      break
    }
  }

  if (headerRow === 0) {
    // No SKU header — might still have products (e.g., AudioCodes sheet)
    // Try alternate detection
    return {
      sheet_name: sheetName,
      brand,
      products_found: 0,
      products_parsed: 0,
      rows_skipped: 0,
      products: [],
      errors: [],
    }
  }

  const dataStartRow = headerRow + 1

  for (let r = dataStartRow; r <= ws.rowCount; r++) {
    const sku = getCellText(ws, r, 2) // Column B
    const description = getCellText(ws, r, 3) // Column C
    const price = getCellNumber(ws, r, 4) // Column D
    const comments = getCellText(ws, r, 5) // Column E
    const productUrl = getCellHyperlink(ws, r, 2) // Hyperlink on SKU cell

    // Skip empty rows
    if (!sku && price === null) {
      rowsSkipped++
      continue
    }

    // Skip if SKU looks like a category header
    if (sku && isCategoryHeader(sku)) {
      rowsSkipped++
      continue
    }

    // Skip if SKU contains obvious non-product text
    if (sku && isNonProductText(sku)) {
      rowsSkipped++
      continue
    }

    // Must have a valid SKU
    if (!sku || sku.length < MIN_SKU_LENGTH || !SKU_PATTERN.test(sku)) {
      if (description && price && price > 0) {
        // Has description and price but no recognizable SKU — could be a product
        // Use a generated SKU
      } else {
        rowsSkipped++
        continue
      }
    }

    // Must have either a description or a price
    if (!description && price === null) {
      rowsSkipped++
      continue
    }

    const product = toProduct(
      {
        brand,
        sku: sku ? sku.trim() : `NOLOGY-${r}`,
        description,
        price,
        comments,
        product_url: productUrl,
        row_number: r,
      },
      sheetName
    )

    products.push(product)
  }

  return {
    sheet_name: sheetName,
    brand,
    products_found: ws.rowCount - dataStartRow + 1,
    products_parsed: products.length,
    rows_skipped: rowsSkipped,
    products,
    errors,
  }
}

// =====================================================
// Cell Reading Helpers
// =====================================================

/**
 * Get cell value as trimmed text (handles rich text and formulas)
 */
function getCellText(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number
): string | null {
  const cell = ws.getRow(row).getCell(col)
  const value = cell.value
  if (value === null || value === undefined) return null

  // Rich text
  if (typeof value === 'object' && 'richText' in value) {
    const rt = value as { richText: Array<{ text: string }> }
    return rt.richText.map((t) => t.text).join('').trim() || null
  }

  // Formula with result
  if (typeof value === 'object' && 'result' in value) {
    const result = (value as { result: unknown }).result
    if (result === null || result === undefined) return null
    return String(result).trim() || null
  }

  // Hyperlink object (the text property is the display text)
  if (typeof value === 'object' && 'text' in value) {
    const text = (value as { text: string }).text
    return text.trim() || null
  }

  const str = String(value).trim()
  return str || null
}

/**
 * Get cell value as a number
 */
function getCellNumber(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number
): number | null {
  const cell = ws.getRow(row).getCell(col)
  const value = cell.value
  if (value === null || value === undefined) return null

  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    // Try parsing
    const cleaned = value.replace(/[R\s,]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
  }

  // Formula with numeric result
  if (typeof value === 'object' && 'result' in value) {
    const result = (value as { result: unknown }).result
    if (typeof result === 'number') return result
    if (typeof result === 'string') {
      const num = parseFloat(result.replace(/[R\s,]/g, ''))
      return isNaN(num) ? null : num
    }
  }

  return null
}

/**
 * Extract hyperlink URL from a cell
 */
function getCellHyperlink(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number
): string | null {
  const cell = ws.getRow(row).getCell(col)
  const value = cell.value

  // exceljs stores hyperlinks in the value object
  if (typeof value === 'object' && value !== null) {
    if ('hyperlink' in value) {
      return (value as { hyperlink: string }).hyperlink || null
    }
  }

  return null
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Check if text looks like a category group header
 */
function isCategoryHeader(text: string): boolean {
  if (text.length < 2) return false

  // Category headers are plain text labels like "SWITCHES", "ROUTERS"
  // They contain only letters, spaces, and forward slashes (no digits/dashes)
  // This distinguishes them from SKUs like "LS-1600V2-6P-HPWR-GL"
  const isPlainText = /^[A-Z][A-Z\s/&()-]+$/.test(text)
  if (isPlainText && text.length >= 3 && text.length < 50) {
    return true
  }

  return false
}

/**
 * Check if text is non-product metadata
 */
function isNonProductText(text: string): boolean {
  const lower = text.toLowerCase()
  const nonProductPatterns = [
    'click here',
    'e & oe',
    'terms & conditions',
    'pricing valid',
    'all pricing',
    'for more information',
    'nology is an official',
    'please refer to',
    'return',
    'page',
  ]
  return nonProductPatterns.some((p) => lower.includes(p))
}

// =====================================================
// Product Conversion
// =====================================================

/**
 * Convert raw xlsx row to ParsedNologyProduct
 */
function toProduct(
  row: NologyXlsxRow,
  sheetName: string
): ParsedNologyProduct {
  const name =
    row.description || row.sku || `Unknown Product (${sheetName})`

  // Extract warranty from comments
  const warranty = extractWarranty(row.comments)

  // Extract stock info from comments
  const hasStockInfo = row.comments
    ? /in stock|now in stock|eta|confirmed on order|last stock/i.test(
        row.comments
      )
    : false

  return {
    sku: row.sku!.trim(),
    name: name.trim(),
    description: row.description || null,
    manufacturer: row.brand,
    cost_price: row.price || 0,
    retail_price: row.price || 0, // Nology xlsx doesn't provide retail
    source_image_url: '',
    product_url: row.product_url || '',
    stock_cpt: 0, // Not in xlsx
    stock_jhb: 0,
    stock_dbn: 0,
    stock_total: hasStockInfo ? 1 : 0, // At least mark as available
    category: row.brand,
    warranty,
    subcategory: categoryFromRow(row),
  }
}

/**
 * Extract warranty duration from comments text
 */
function extractWarranty(comments: string | null): string | null {
  if (!comments) return null

  const patterns = [
    /(\d+)\s*(?:month|yr|year)s?\s*warranty/i,
    /(\d+)\s*months?\s*warranty/i,
    /warranty[:\s]*(\d+)\s*(?:month|yr|year)s?/i,
  ]

  for (const pattern of patterns) {
    const match = comments.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      return `${num} months`
    }
  }

  return null
}

/**
 * Infer subcategory from row data
 */
function categoryFromRow(row: NologyXlsxRow): string | null {
  // If comments contain a category-like prefix
  if (row.comments) {
    const catMatch = row.comments.match(
      /^(SWITCHES|ROUTERS|ACCESS POINTS|FIREWALLS|HEADSETS|SPEAKERPHONES?|CAMERAS?|(?:Wi-?Fi|FIBRE|5G|LTE)\s+(?:ROUTERS?|CPE)|CONVERTORS?|SOLAR PANELS?|BACKUP POWER|MESH (?:Wi-?FI|WI-FI)|ANDROID TV|SMART (?:SWITCH|HOME))/i
    )
    if (catMatch) return catMatch[1]
  }

  return null
}
