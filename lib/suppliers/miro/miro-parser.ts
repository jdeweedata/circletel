/**
 * MiRO Distribution HTML Parser
 *
 * Parses product data from MiRO category pages using Cheerio.
 * Handles price extraction, stock levels by branch, and product details.
 */

import * as cheerio from 'cheerio'
import type { Element } from 'domhandler'
import type {
  MiRoScrapedProduct,
  MiRoStockLevels,
  ParsedMiRoProduct,
  CategoryScrapeResult,
} from './miro-types'

/**
 * Parse a MiRO category page HTML to extract products
 */
export function parseMiRoCategory(
  html: string,
  categoryUrl: string
): CategoryScrapeResult {
  const startTime = Date.now()
  const $ = cheerio.load(html)
  const products: MiRoScrapedProduct[] = []
  const errors: string[] = []

  // Extract category name from breadcrumb or page title
  const categoryName = extractCategoryName($, categoryUrl)

  // Find all product containers
  // MiRO uses PrestaShop-style markup
  const productContainers = $('.product-miniature, .article[data-id-product], .js-product-miniature')

  productContainers.each((_index, element) => {
    try {
      const product = parseProductElement($, element, categoryName, categoryUrl)
      if (product) {
        products.push(product)
      }
    } catch (error) {
      errors.push(
        `Failed to parse product: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  return {
    categoryUrl,
    categoryName,
    products,
    productsFound: products.length,
    duration_ms: Date.now() - startTime,
    errors,
  }
}

/**
 * Extract category name from page
 */
function extractCategoryName($: cheerio.CheerioAPI, categoryUrl: string): string {
  // Try breadcrumb
  const breadcrumb = $('.breadcrumb li:last-child, .breadcrumb-item:last-child').text().trim()
  if (breadcrumb) return breadcrumb

  // Try page title
  const pageTitle = $('h1.category-name, h1.page-heading, .category-header h1').text().trim()
  if (pageTitle) return pageTitle

  // Fall back to URL-based extraction
  const urlParts = categoryUrl.split('/').pop()?.replace(/-/g, ' ') || 'Unknown'
  return urlParts.split('?')[0]
}

/**
 * Parse a single product element
 */
function parseProductElement(
  $: cheerio.CheerioAPI,
  element: Element,
  category: string,
  categoryUrl: string
): MiRoScrapedProduct | null {
  const $el = $(element)

  // Extract SKU from data attribute or text
  const sku = extractSku($el)
  if (!sku) {
    return null // Skip products without SKU
  }

  // Extract product name
  const name = $el
    .find('.product-title a, .product-name a, h3.product-title a, h2.product-title a')
    .first()
    .text()
    .trim()

  if (!name) {
    return null // Skip products without name
  }

  // Extract product URL
  const productUrl =
    $el.find('.product-title a, .product-name a').first().attr('href') ||
    $el.find('a[href*="/product"]').first().attr('href') ||
    ''

  // Extract price
  const priceInfo = extractPrice($el)

  // Extract stock levels
  const stock = extractStockLevels($el)

  // Extract image URL
  const sourceImageUrl =
    $el.find('img.product-image, .product-image img, .thumbnail img').first().attr('data-src') ||
    $el.find('img.product-image, .product-image img, .thumbnail img').first().attr('src') ||
    ''

  // Extract manufacturer/brand
  const manufacturer =
    $el.find('.brand-name, .manufacturer-name, .product-brand').first().text().trim() ||
    extractManufacturerFromName(name)

  // Extract description
  const description =
    $el.find('.product-description-short, .product-desc').first().text().trim() || undefined

  return {
    sku,
    name,
    description,
    manufacturer,
    priceInclVat: priceInfo.inclVat,
    priceExclVat: priceInfo.exclVat,
    sourceImageUrl: sourceImageUrl ? normalizeImageUrl(sourceImageUrl, categoryUrl) : undefined,
    productUrl: productUrl ? normalizeUrl(productUrl, categoryUrl) : '',
    stock,
    category,
    categoryUrl,
  }
}

/**
 * Extract SKU from product element
 */
function extractSku($el: cheerio.Cheerio<Element>): string | null {
  // Try data attribute
  const dataId = $el.attr('data-id-product')
  if (dataId) return `MIRO-${dataId}`

  // Try SKU text element
  const skuText =
    $el.find('.sku, .product-reference, .reference').first().text().trim() ||
    $el.find('[itemprop="sku"]').first().text().trim()

  if (skuText) {
    // Clean up SKU text (remove "SKU:", "Ref:", etc.)
    const cleaned = skuText.replace(/^(sku|ref|reference|code):\s*/i, '').trim()
    return cleaned || null
  }

  return null
}

/**
 * Extract price from product element
 * MiRO shows prices in format "R1,234.56" or "R1 234.56"
 */
function extractPrice($el: cheerio.Cheerio<Element>): {
  inclVat: number
  exclVat: number
} {
  const defaultPrice = { inclVat: 0, exclVat: 0 }

  // Try to find price elements
  const priceText =
    $el.find('.price, .product-price, .current-price').first().text() ||
    $el.find('[itemprop="price"]').first().attr('content') ||
    ''

  const price = parsePrice(priceText)

  // Check if there's a separate excl VAT price
  const exclVatText = $el
    .find('.price-excl, .price-excl-vat, .tax-label')
    .first()
    .text()

  if (exclVatText && exclVatText.toLowerCase().includes('excl')) {
    const exclPrice = parsePrice(exclVatText)
    if (exclPrice > 0) {
      return { inclVat: price, exclVat: exclPrice }
    }
  }

  // If only one price, assume it's incl VAT and calculate excl (VAT is 15% in SA)
  if (price > 0) {
    return {
      inclVat: price,
      exclVat: Math.round((price / 1.15) * 100) / 100,
    }
  }

  return defaultPrice
}

/**
 * Parse price string to number
 * Handles formats: "R1,234.56", "R1 234.56", "R1234.56", "1234.56"
 */
export function parsePrice(text: string): number {
  if (!text) return 0

  // Remove currency symbol, spaces, and thousands separators
  const cleaned = text
    .replace(/R\s*/gi, '')
    .replace(/ZAR\s*/gi, '')
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .replace(/[^\d.]/g, '')

  // Extract the numeric value
  const match = cleaned.match(/(\d+\.?\d*)/)
  if (match) {
    const value = parseFloat(match[1])
    return isNaN(value) ? 0 : Math.round(value * 100) / 100
  }

  return 0
}

/**
 * Extract stock levels by branch
 * MiRO shows stock with branch indicators (JHB, CPT, DBN, NS)
 */
function extractStockLevels($el: cheerio.Cheerio<Element>): MiRoStockLevels {
  const stock: MiRoStockLevels = {
    jhb: 'out',
    cpt: 'out',
    dbn: 'out',
    ns: 'out',
  }

  // Look for stock availability indicators
  const stockElements = $el.find('.stock-info, .availability, .warehouse-stock, .branch-stock')

  stockElements.each((_i, el) => {
    const text = cheerio.load(el).text().toLowerCase()

    // Check for each branch
    if (text.includes('jhb') || text.includes('johannesburg')) {
      stock.jhb = extractStockValue(text, 'jhb')
    }
    if (text.includes('cpt') || text.includes('cape')) {
      stock.cpt = extractStockValue(text, 'cpt')
    }
    if (text.includes('dbn') || text.includes('durban')) {
      stock.dbn = extractStockValue(text, 'dbn')
    }
    if (text.includes('ns') || text.includes('national')) {
      stock.ns = extractStockValue(text, 'ns')
    }
  })

  // Alternative: PiCheckBold for generic in-stock indicator
  const availabilityText = $el.find('.availability, .stock-status').first().text().toLowerCase()

  if (
    availabilityText.includes('in stock') ||
    availabilityText.includes('available') ||
    $el.find('.in-stock, .available').length > 0
  ) {
    // If generic in-stock but no branch info, assume JHB has stock
    if (stock.jhb === 'out') {
      stock.jhb = 'in_stock'
    }
  }

  return stock
}

/**
 * Extract numeric stock value or status from text
 */
function extractStockValue(
  text: string,
  _branch: string
): number | 'in_stock' | 'out' {
  // Look for numeric value
  const numMatch = text.match(/(\d+)\s*(pcs|units|available)?/i)
  if (numMatch) {
    const num = parseInt(numMatch[1], 10)
    if (!isNaN(num) && num > 0) return num
  }

  // Check for qualitative indicators
  if (text.includes('in stock') || text.includes('available') || text.includes('✓')) {
    return 'in_stock'
  }
  if (text.includes('out of stock') || text.includes('unavailable') || text.includes('✗')) {
    return 'out'
  }

  return 'out'
}

/**
 * Extract manufacturer from product name
 * Common patterns: "Ubiquiti UniFi AC Pro", "MikroTik hAP ac2"
 */
function extractManufacturerFromName(name: string): string {
  const knownBrands = [
    'Ubiquiti',
    'MikroTik',
    'Cambium',
    'TP-Link',
    'Hikvision',
    'Dahua',
    'Cisco',
    'Netgear',
    'Ruckus',
    'Aruba',
    'Fortinet',
    'Mimosa',
    'Tarana',
    'Teltonika',
    'Ruijie',
    'EnGenius',
    'Peplink',
    'Draytek',
    'ZyXEL',
    'UniFi',
    'AirMax',
  ]

  for (const brand of knownBrands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand
    }
  }

  // Return first word as manufacturer if unknown
  const firstWord = name.split(/\s+/)[0]
  return firstWord || 'Unknown'
}

/**
 * Normalize relative URLs to absolute
 */
function normalizeUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`

  const base = new URL(baseUrl)
  if (url.startsWith('/')) {
    return `${base.protocol}//${base.host}${url}`
  }

  return `${base.protocol}//${base.host}/${url}`
}

/**
 * Normalize image URL
 */
function normalizeImageUrl(url: string, baseUrl: string): string {
  // Handle data URLs
  if (url.startsWith('data:')) return ''

  // Handle lazy-load placeholders
  if (url.includes('placeholder') || url.includes('loading')) return ''

  return normalizeUrl(url, baseUrl)
}

/**
 * Convert scraped product to database format
 */
export function toSupplierProduct(product: MiRoScrapedProduct): ParsedMiRoProduct {
  // Convert stock levels to numbers
  const stockToNumber = (val: number | 'in_stock' | 'out'): number => {
    if (typeof val === 'number') return val
    if (val === 'in_stock') return 1 // At least 1 in stock
    return 0
  }

  const stockJhb = stockToNumber(product.stock.jhb)
  const stockCpt = stockToNumber(product.stock.cpt)
  const stockDbn = stockToNumber(product.stock.dbn)
  const stockNs = stockToNumber(product.stock.ns)

  return {
    sku: product.sku,
    name: product.name,
    description: product.description || null,
    manufacturer: product.manufacturer || 'Unknown',
    cost_price: product.priceExclVat,
    retail_price: product.priceInclVat,
    source_image_url: product.sourceImageUrl || '',
    product_url: product.productUrl,
    stock_cpt: stockCpt,
    stock_jhb: stockJhb,
    stock_dbn: stockDbn,
    stock_total: stockJhb + stockCpt + stockDbn + stockNs,
    category: product.category,
  }
}
