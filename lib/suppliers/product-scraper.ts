/**
 * Product Scraper Service
 *
 * Uses Firecrawl to scrape product details from supplier websites.
 * Extracts specifications, features, and additional metadata.
 */

import Firecrawl from '@mendable/firecrawl-js'

// =====================================================
// Types
// =====================================================

export interface ScrapedProductData {
  product_url: string
  title: string | null
  description: string | null
  specifications: Record<string, string>
  features: string[]
  category: string | null
  subcategory: string | null
  additional_images: string[]
  raw_content: string
  scraped_at: string
}

export interface ScrapeResult {
  success: boolean
  data?: ScrapedProductData
  error?: string
}

export interface BatchScrapeResult {
  total: number
  scraped: number
  failed: number
  skipped: number
  results: Array<{
    sku: string
    product_url: string | null
    success: boolean
    error?: string
  }>
}

export interface ProductUrlMatch {
  sku: string
  product_url: string
  confidence: 'exact' | 'partial' | 'fuzzy'
}

// =====================================================
// Configuration
// =====================================================

const SCOOP_BASE_URL = 'https://scoop.co.za'
const SCRAPE_DELAY_MS = 250 // Rate limiting: 4 requests/second
const SCRAPE_TIMEOUT_MS = 30000
const MAX_CONCURRENT_SCRAPES = 5

// =====================================================
// Firecrawl Client
// =====================================================

let firecrawlClient: Firecrawl | null = null

function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY not configured')
    }
    firecrawlClient = new Firecrawl({ apiKey })
  }
  return firecrawlClient
}

// =====================================================
// URL Discovery
// =====================================================

/**
 * Map the Scoop website to discover product URLs
 */
export async function discoverScoopProductUrls(): Promise<string[]> {
  console.log('[ProductScraper] Discovering product URLs from Scoop website...')

  try {
    const firecrawl = getFirecrawlClient()

    // Map the website to find all product URLs
    const mapResult = await firecrawl.mapUrl(SCOOP_BASE_URL, {
      includeSubdomains: false,
      limit: 5000,
    })

    if (!mapResult.success || !mapResult.links) {
      console.error('[ProductScraper] Failed to map website:', mapResult)
      return []
    }

    // Filter to product URLs (typically contain /product/ or /p/)
    const productUrls = mapResult.links.filter((url: string) => {
      const lowercaseUrl = url.toLowerCase()
      return (
        lowercaseUrl.includes('/product/') ||
        lowercaseUrl.includes('/products/') ||
        lowercaseUrl.includes('/p/') ||
        lowercaseUrl.includes('/item/')
      )
    })

    console.log(`[ProductScraper] Found ${productUrls.length} potential product URLs`)
    return productUrls
  } catch (error) {
    console.error('[ProductScraper] URL discovery failed:', error)
    return []
  }
}

/**
 * Search for a product URL by SKU or name
 */
export async function findProductUrl(
  sku: string,
  productName: string
): Promise<ProductUrlMatch | null> {
  try {
    const firecrawl = getFirecrawlClient()

    // Search using Firecrawl
    const searchResult = await firecrawl.search(`site:scoop.co.za ${sku} ${productName}`, {
      limit: 5,
    })

    if (!searchResult.success || !searchResult.data?.length) {
      return null
    }

    // Find the best match
    for (const result of searchResult.data) {
      const url = result.url || ''
      const title = (result.title || '').toLowerCase()
      const skuLower = sku.toLowerCase()

      // Exact SKU match
      if (url.includes(skuLower) || title.includes(skuLower)) {
        return {
          sku,
          product_url: url,
          confidence: 'exact',
        }
      }

      // Partial name match
      const nameParts = productName.toLowerCase().split(' ').slice(0, 3)
      const matchCount = nameParts.filter(part => title.includes(part)).length
      if (matchCount >= 2) {
        return {
          sku,
          product_url: url,
          confidence: 'partial',
        }
      }
    }

    // Return first result as fuzzy match
    if (searchResult.data[0]?.url) {
      return {
        sku,
        product_url: searchResult.data[0].url,
        confidence: 'fuzzy',
      }
    }

    return null
  } catch (error) {
    console.error(`[ProductScraper] Failed to find URL for SKU ${sku}:`, error)
    return null
  }
}

// =====================================================
// Product Scraping
// =====================================================

/**
 * Scrape a single product page
 */
export async function scrapeProductPage(productUrl: string): Promise<ScrapeResult> {
  console.log(`[ProductScraper] Scraping: ${productUrl}`)

  try {
    const firecrawl = getFirecrawlClient()

    const scrapeResult = await firecrawl.scrapeUrl(productUrl, {
      formats: ['markdown', 'html'],
      timeout: SCRAPE_TIMEOUT_MS,
    })

    if (!scrapeResult.success) {
      return {
        success: false,
        error: 'Scrape failed - no content returned',
      }
    }

    // Extract structured data from the scraped content
    const markdown = scrapeResult.markdown || ''
    const html = scrapeResult.html || ''

    // Parse specifications from common patterns
    const specifications = extractSpecifications(markdown, html)
    const features = extractFeatures(markdown, html)
    const additionalImages = extractAdditionalImages(html)
    const category = extractCategory(markdown, html)

    return {
      success: true,
      data: {
        product_url: productUrl,
        title: scrapeResult.metadata?.title || null,
        description: scrapeResult.metadata?.description || null,
        specifications,
        features,
        category: category?.category || null,
        subcategory: category?.subcategory || null,
        additional_images: additionalImages,
        raw_content: markdown.substring(0, 10000), // Limit raw content size
        scraped_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown scrape error'
    console.error(`[ProductScraper] Scrape failed for ${productUrl}:`, error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Batch scrape multiple product pages
 */
export async function batchScrapeProducts(
  products: Array<{ sku: string; product_url: string | null }>,
  onProgress?: (current: number, total: number) => void
): Promise<BatchScrapeResult> {
  const results: BatchScrapeResult['results'] = []
  let scraped = 0
  let failed = 0
  let skipped = 0

  // Process in chunks to respect rate limits
  const chunks = chunkArray(products, MAX_CONCURRENT_SCRAPES)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    const chunkResults = await Promise.all(
      chunk.map(async (product) => {
        if (!product.product_url) {
          skipped++
          return {
            sku: product.sku,
            product_url: product.product_url,
            success: false,
            error: 'No product URL',
          }
        }

        const result = await scrapeProductPage(product.product_url)

        if (result.success) {
          scraped++
        } else {
          failed++
        }

        return {
          sku: product.sku,
          product_url: product.product_url,
          success: result.success,
          data: result.data,
          error: result.error,
        }
      })
    )

    results.push(...chunkResults)

    // Report progress
    if (onProgress) {
      onProgress(results.length, products.length)
    }

    // Rate limiting delay between chunks
    if (i < chunks.length - 1) {
      await delay(SCRAPE_DELAY_MS * MAX_CONCURRENT_SCRAPES)
    }
  }

  return {
    total: products.length,
    scraped,
    failed,
    skipped,
    results,
  }
}

// =====================================================
// Content Extraction Helpers
// =====================================================

/**
 * Extract specifications from scraped content
 */
function extractSpecifications(
  markdown: string,
  html: string
): Record<string, string> {
  const specs: Record<string, string> = {}

  // Pattern 1: Key: Value format
  const keyValuePattern = /^([A-Za-z][A-Za-z0-9\s]+):\s*(.+)$/gm
  let match
  while ((match = keyValuePattern.exec(markdown)) !== null) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key.length < 50 && value.length < 200) {
      specs[key] = value
    }
  }

  // Pattern 2: Table rows with th/td
  const tablePattern = /<tr[^>]*>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>/gi
  while ((match = tablePattern.exec(html)) !== null) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key.length < 50 && value.length < 200 && !specs[key]) {
      specs[key] = value
    }
  }

  // Pattern 3: Definition lists
  const dlPattern = /<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/gi
  while ((match = dlPattern.exec(html)) !== null) {
    const key = match[1].trim()
    const value = match[2].trim()
    if (key.length < 50 && value.length < 200 && !specs[key]) {
      specs[key] = value
    }
  }

  return specs
}

/**
 * Extract features from scraped content
 */
function extractFeatures(markdown: string, html: string): string[] {
  const features: string[] = []
  const seenFeatures = new Set<string>()

  // Pattern 1: Bullet points in markdown
  const bulletPattern = /^[-*]\s+(.+)$/gm
  let match
  while ((match = bulletPattern.exec(markdown)) !== null) {
    const feature = match[1].trim()
    if (
      feature.length > 10 &&
      feature.length < 200 &&
      !seenFeatures.has(feature.toLowerCase())
    ) {
      seenFeatures.add(feature.toLowerCase())
      features.push(feature)
    }
  }

  // Pattern 2: List items in HTML
  const liPattern = /<li[^>]*>([^<]+)<\/li>/gi
  while ((match = liPattern.exec(html)) !== null) {
    const feature = match[1].trim()
    if (
      feature.length > 10 &&
      feature.length < 200 &&
      !seenFeatures.has(feature.toLowerCase())
    ) {
      seenFeatures.add(feature.toLowerCase())
      features.push(feature)
    }
  }

  return features.slice(0, 20) // Limit to 20 features
}

/**
 * Extract additional images from HTML
 */
function extractAdditionalImages(html: string): string[] {
  const images: string[] = []
  const seenUrls = new Set<string>()

  const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgPattern.exec(html)) !== null) {
    const src = match[1]
    if (
      src.startsWith('http') &&
      !seenUrls.has(src) &&
      !src.includes('logo') &&
      !src.includes('icon') &&
      !src.includes('placeholder')
    ) {
      seenUrls.add(src)
      images.push(src)
    }
  }

  return images.slice(0, 10) // Limit to 10 images
}

/**
 * Extract category from content
 */
function extractCategory(
  markdown: string,
  html: string
): { category: string; subcategory: string | null } | null {
  // Pattern 1: Breadcrumb
  const breadcrumbPattern = /(?:Home|Products?)\s*[>\/]\s*([^>\/\n]+)(?:\s*[>\/]\s*([^>\/\n]+))?/i
  const match = markdown.match(breadcrumbPattern) || html.match(breadcrumbPattern)

  if (match) {
    return {
      category: match[1].trim(),
      subcategory: match[2]?.trim() || null,
    }
  }

  return null
}

// =====================================================
// Utility Functions
// =====================================================

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
