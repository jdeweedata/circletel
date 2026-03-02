/**
 * Nology HTML Parser
 *
 * Parses product data from Nology category pages (VirtueMart) using Cheerio.
 * Handles price extraction, stock status, and product details.
 *
 * NOTE: Nology uses VirtueMart which loads prices via JavaScript/AJAX.
 * Prices require authentication to display. Currently syncing product
 * catalog without pricing until authentication is implemented.
 */

import * as cheerio from 'cheerio'
import type { Element } from 'domhandler'
import type {
  NologyScrapedProduct,
  ParsedNologyProduct,
  NologyCategoryScrapeResult,
} from './nology-types'

/**
 * Parse a Nology category page HTML to extract products
 */
export function parseNologyCategory(
  html: string,
  categoryUrl: string
): NologyCategoryScrapeResult {
  const startTime = Date.now()
  const $ = cheerio.load(html)
  const products: NologyScrapedProduct[] = []
  const errors: string[] = []

  // Extract category name
  const categoryName = extractCategoryName($, categoryUrl)

  // Find all product containers (VirtueMart structure)
  // Nology uses: .product.vm-col for product grid items
  const productContainers = $('.product.vm-col, .vm-product-item, .product-container')

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
  // Try main h1
  const mainTitle = $('h1').first().text().trim()
  if (mainTitle) return mainTitle

  // Try VirtueMart category title
  const vmTitle = $('.category-header h1, .vmgroup-description h1').text().trim()
  if (vmTitle) return vmTitle

  // Try breadcrumb
  const breadcrumb = $('.pathway li:last-child, .breadcrumb li:last-child span').text().trim()
  if (breadcrumb) return breadcrumb

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
): NologyScrapedProduct | null {
  const $el = $(element)

  // Extract product title and link
  // Nology uses h2.product-title > a
  const titleElement = $el.find('h2.product-title a, .product-title a, h3 a').first()
  const name = titleElement.text().trim()

  if (!name) {
    return null // Skip products without name
  }

  const productUrl = titleElement.attr('href') || ''

  // Extract SKU from dedicated element
  // Nology shows: <p class="sku-product-code">SKU: GS1900-8HP</p>
  const sku = extractSku($el, productUrl, name)
  if (!sku) {
    return null // Skip products without SKU
  }

  // Extract price (NOTE: Nology requires auth for prices, usually returns 0)
  const priceInfo = extractPrice($el)

  // Extract image URL
  // Nology uses: .pro-image img or .browseProductImage
  const imageUrl =
    $el.find('.pro-image img, .browseProductImage').first().attr('src') ||
    $el.find('.pro-image img, .browseProductImage').first().attr('data-src') ||
    ''

  // Extract stock status
  const inStock = extractStockStatus($el)

  // Extract manufacturer/brand from product name
  const manufacturer = extractManufacturerFromName(name)

  // Extract short description
  const description =
    $el.find('.product_s_desc, .product-s-desc, p.product_s_desc span').first().text().trim() ||
    undefined

  return {
    sku,
    name,
    description,
    manufacturer,
    priceInclVat: priceInfo.inclVat,
    priceExclVat: priceInfo.exclVat,
    sourceImageUrl: imageUrl ? normalizeImageUrl(imageUrl, categoryUrl) : undefined,
    productUrl: productUrl ? normalizeUrl(productUrl, categoryUrl) : '',
    inStock,
    category,
    categoryUrl,
  }
}

/**
 * Extract SKU from product element
 */
function extractSku(
  $el: cheerio.Cheerio<Element>,
  productUrl: string,
  _name: string
): string | null {
  // Try dedicated SKU element (Nology pattern)
  // <p class="sku-product-code">SKU: GS1900-8HP</p>
  const skuElement = $el.find('.sku-product-code, .product-sku, [itemprop="sku"]').first().text().trim()
  if (skuElement) {
    // Remove "SKU:" prefix if present
    const cleaned = skuElement.replace(/^SKU:\s*/i, '').trim()
    if (cleaned) return cleaned
  }

  // Try virtuemart product ID from form
  const productId = $el.find('input[name="virtuemart_product_id[]"]').first().attr('value')
  if (productId) return `NOL-${productId}`

  // Try data attribute
  const dataProductId =
    $el.attr('data-virtuemart_product_id') ||
    $el.attr('data-product-id') ||
    $el.find('[data-product-id]').first().attr('data-product-id')
  if (dataProductId) return `NOL-${dataProductId}`

  // Extract from URL (e.g., /products/.../zyxel-gs1900-8hp-detail)
  const urlMatch = productUrl.match(/\/([^/]+)-detail(?:\?.*)?$/)
  if (urlMatch) {
    const slug = urlMatch[1].toUpperCase()
    if (slug.length < 50) return slug
  }

  return null
}

/**
 * Extract price from product element
 * NOTE: Nology loads prices via JavaScript - requires authentication
 * This function may return 0 for unauthenticated requests
 */
function extractPrice($el: cheerio.Cheerio<Element>): {
  inclVat: number
  exclVat: number
} {
  const defaultPrice = { inclVat: 0, exclVat: 0 }

  // Try to find price elements (VirtueMart uses various classes)
  const priceSelectors = [
    '.PricesalesPrice',
    '.vm-price-value',
    '.product-price span.price',
    '.product-price',
    '[itemprop="price"]',
  ]

  for (const selector of priceSelectors) {
    const priceText = $el.find(selector).first().text().trim()
    if (priceText) {
      const price = parsePrice(priceText)
      if (price > 0) {
        // Check for excl VAT price
        const exclVatText = $el.find('.PricebasePriceWithoutTax, .price-excl-vat').first().text()
        if (exclVatText) {
          const exclPrice = parsePrice(exclVatText)
          if (exclPrice > 0) {
            return { inclVat: price, exclVat: exclPrice }
          }
        }
        // Calculate excl VAT (15% in SA)
        return {
          inclVat: price,
          exclVat: Math.round((price / 1.15) * 100) / 100,
        }
      }
    }
  }

  // Try itemprop content attribute
  const priceContent = $el.find('[itemprop="price"]').first().attr('content')
  if (priceContent) {
    const price = parseFloat(priceContent)
    if (!isNaN(price) && price > 0) {
      return {
        inclVat: price,
        exclVat: Math.round((price / 1.15) * 100) / 100,
      }
    }
  }

  return defaultPrice
}

/**
 * Parse price string to number
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
 * Extract stock status
 */
function extractStockStatus($el: cheerio.Cheerio<Element>): boolean {
  // Check for explicit stock indicator
  const stockText = $el
    .find('.stock-status, .availability, .vm-stock-level, .product-stock')
    .first()
    .text()
    .toLowerCase()

  if (stockText.includes('out of stock') || stockText.includes('unavailable')) {
    return false
  }
  if (stockText.includes('in stock') || stockText.includes('available')) {
    return true
  }

  // Check for stock CSS classes
  if ($el.find('.in-stock, .available').length > 0) {
    return true
  }
  if ($el.find('.out-of-stock, .unavailable, .soldout').length > 0) {
    return false
  }

  // Check for add to cart form (Nology shows form for in-stock items)
  const addToCartForm = $el.find('form.product, .addtocart-area form')
  if (addToCartForm.length > 0) {
    return true
  }

  // Default to true if we can't determine (product is listed)
  return true
}

/**
 * Extract manufacturer from product name
 * Common brands seen on Nology
 */
function extractManufacturerFromName(name: string): string {
  const knownBrands = [
    // Network equipment brands
    'Zyxel',
    'ZyXEL',
    'MikroTik',
    'Ubiquiti',
    'TP-Link',
    'Cisco',
    'Netgear',
    'D-Link',
    'Dell',
    'HP',
    'HPE',
    'Juniper',
    'H3C',
    'Huawei',
    'Teltonika',
    'Aruba',
    'Ruckus',
    'Fortinet',
    'Planet',
    'Allied Telesis',
    'Extreme',
    'Cambium',
    // Camera/surveillance
    'Hikvision',
    'Dahua',
    // General
    'Samsung',
    'LG',
  ]

  const nameLower = name.toLowerCase()
  for (const brand of knownBrands) {
    if (nameLower.includes(brand.toLowerCase())) {
      // Return properly capitalized brand name
      return brand
    }
  }

  // Check if name starts with a brand-like word (capitalized, 3+ chars)
  const firstWord = name.split(/\s+/)[0]
  if (firstWord && firstWord.length >= 3 && /^[A-Z]/.test(firstWord)) {
    // Could be a brand - return as-is
    return firstWord
  }

  return 'Unknown'
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
  if (url.startsWith('data:')) return ''
  if (url.includes('noimage') || url.includes('placeholder')) return ''

  return normalizeUrl(url, baseUrl)
}

/**
 * Convert scraped product to database format
 */
export function toSupplierProduct(product: NologyScrapedProduct): ParsedNologyProduct {
  // Nology doesn't provide branch-level stock, so we use generic in-stock indicator
  const stockValue = product.inStock ? 1 : 0

  return {
    sku: product.sku,
    name: product.name,
    description: product.description || null,
    manufacturer: product.manufacturer || 'Unknown',
    cost_price: product.priceExclVat,
    retail_price: product.priceInclVat,
    source_image_url: product.sourceImageUrl || '',
    product_url: product.productUrl,
    stock_cpt: 0, // Nology doesn't provide branch stock
    stock_jhb: stockValue, // Assume JHB for Nology
    stock_dbn: 0,
    stock_total: stockValue,
    category: product.category,
  }
}
