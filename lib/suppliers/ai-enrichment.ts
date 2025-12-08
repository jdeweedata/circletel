/**
 * AI Enrichment Service for Supplier Products
 *
 * Uses Google Gemini API to enrich product data with structured
 * specifications, features, and categorization.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import type { SupplierProduct } from './types'
import type { ScrapedProductData } from './product-scraper'

// =====================================================
// Types
// =====================================================

export interface EnrichedProductData {
  specifications: Record<string, string>
  features: string[]
  category: string | null
  subcategory: string | null
  enhanced_description: string | null
}

export interface EnrichmentResult {
  success: boolean
  data?: EnrichedProductData
  error?: string
  tokens_used?: number
  processing_time_ms?: number
}

export interface BatchEnrichmentResult {
  total: number
  enriched: number
  failed: number
  skipped: number
  results: Array<{
    sku: string
    success: boolean
    error?: string
  }>
  total_tokens: number
  total_time_ms: number
}

export type EnrichmentStatus = 'pending' | 'scraped' | 'enriched' | 'failed'

// =====================================================
// Configuration
// =====================================================

// Use Gemini 1.5 Flash for speed and cost efficiency
const GEMINI_MODEL = 'gemini-1.5-flash'
const MAX_OUTPUT_TOKENS = 2048
const BATCH_SIZE = 5 // Products per AI call
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

// Gemini 1.5 Flash pricing (per 1M tokens)
const PRICING = {
  input: 0.075, // $0.075 per 1M input tokens
  output: 0.30, // $0.30 per 1M output tokens
}

// =====================================================
// Gemini Client
// =====================================================

let genAI: GoogleGenerativeAI | null = null
let model: GenerativeModel | null = null

function getModel(): GenerativeModel {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    genAI = new GoogleGenerativeAI(apiKey)
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  }
  return model
}

// =====================================================
// Product Enrichment
// =====================================================

/**
 * Enrich a single product using AI
 */
export async function enrichProduct(
  product: SupplierProduct,
  scrapedData?: ScrapedProductData
): Promise<EnrichmentResult> {
  const startTime = Date.now()

  try {
    const prompt = buildEnrichmentPrompt(product, scrapedData)
    const gemini = getModel()

    let lastError: Error | null = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await gemini.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.3, // Lower temperature for more consistent output
            responseMimeType: 'application/json',
          },
        })

        const response = result.response
        const text = response.text()
        const enrichedData = parseEnrichmentResponse(text)

        if (!enrichedData) {
          throw new Error('Failed to parse AI response')
        }

        const processingTime = Date.now() - startTime
        const tokensUsed = estimateTokens(prompt) + estimateTokens(text)

        console.log(
          `[AIEnrichment] Enriched ${product.sku} in ${processingTime}ms (${tokensUsed} tokens)`
        )

        return {
          success: true,
          data: enrichedData,
          tokens_used: tokensUsed,
          processing_time_ms: processingTime,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        console.warn(
          `[AIEnrichment] Attempt ${attempt + 1} failed for ${product.sku}:`,
          lastError.message
        )

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * (attempt + 1))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Max retries exceeded',
      processing_time_ms: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown enrichment error'
    console.error(`[AIEnrichment] Failed to enrich ${product.sku}:`, error)

    return {
      success: false,
      error: errorMessage,
      processing_time_ms: Date.now() - startTime,
    }
  }
}

/**
 * Batch enrich multiple products
 * Groups products to optimize API calls
 */
export async function batchEnrichProducts(
  products: SupplierProduct[],
  scrapedDataMap?: Map<string, ScrapedProductData>,
  onProgress?: (current: number, total: number) => void
): Promise<BatchEnrichmentResult> {
  const results: BatchEnrichmentResult['results'] = []
  let enriched = 0
  let failed = 0
  let skipped = 0
  let totalTokens = 0
  const startTime = Date.now()

  // Process products in batches for AI calls
  const chunks = chunkArray(products, BATCH_SIZE)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    // Process each product in the batch
    const chunkResults = await Promise.all(
      chunk.map(async (product) => {
        // Skip if already enriched
        if (hasEnrichedData(product)) {
          skipped++
          return {
            sku: product.sku,
            success: true,
            error: 'Already enriched',
          }
        }

        const scrapedData = scrapedDataMap?.get(product.sku)
        const result = await enrichProduct(product, scrapedData)

        if (result.success) {
          enriched++
          totalTokens += result.tokens_used || 0
        } else {
          failed++
        }

        return {
          sku: product.sku,
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

    // Small delay between batches to avoid rate limiting
    if (i < chunks.length - 1) {
      await delay(500)
    }
  }

  return {
    total: products.length,
    enriched,
    failed,
    skipped,
    results,
    total_tokens: totalTokens,
    total_time_ms: Date.now() - startTime,
  }
}

/**
 * Enrich a batch of products in a single AI call (more efficient)
 */
export async function enrichProductsBatch(
  products: SupplierProduct[],
  scrapedDataMap?: Map<string, ScrapedProductData>
): Promise<Map<string, EnrichmentResult>> {
  const startTime = Date.now()
  const results = new Map<string, EnrichmentResult>()

  if (products.length === 0) {
    return results
  }

  try {
    const prompt = buildBatchEnrichmentPrompt(products, scrapedDataMap)
    const gemini = getModel()

    const result = await gemini.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS * products.length,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    })

    const response = result.response
    const text = response.text()
    const batchResults = parseBatchEnrichmentResponse(text)

    const processingTime = Date.now() - startTime
    const tokensUsed = estimateTokens(prompt) + estimateTokens(text)

    console.log(
      `[AIEnrichment] Batch enriched ${products.length} products in ${processingTime}ms (${tokensUsed} tokens)`
    )

    // Map results back to products
    for (const product of products) {
      const enrichedData = batchResults.get(product.sku)
      if (enrichedData) {
        results.set(product.sku, {
          success: true,
          data: enrichedData,
          tokens_used: Math.round(tokensUsed / products.length),
          processing_time_ms: Math.round(processingTime / products.length),
        })
      } else {
        results.set(product.sku, {
          success: false,
          error: 'No data returned for product',
          processing_time_ms: processingTime,
        })
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Batch enrichment failed'
    console.error('[AIEnrichment] Batch enrichment failed:', error)

    // Mark all products as failed
    for (const product of products) {
      results.set(product.sku, {
        success: false,
        error: errorMessage,
        processing_time_ms: Date.now() - startTime,
      })
    }
  }

  return results
}

// =====================================================
// Prompt Building
// =====================================================

function buildEnrichmentPrompt(
  product: SupplierProduct,
  scrapedData?: ScrapedProductData
): string {
  const productInfo = `
Product Name: ${product.name}
SKU: ${product.sku}
Manufacturer: ${product.manufacturer || 'Unknown'}
Current Description: ${product.description || 'None'}
${scrapedData ? `
Scraped Description: ${scrapedData.description || 'None'}
Scraped Raw Content: ${scrapedData.raw_content?.substring(0, 2000) || 'None'}
Scraped Specifications: ${JSON.stringify(scrapedData.specifications || {})}
Scraped Features: ${JSON.stringify(scrapedData.features || [])}
` : ''}`.trim()

  return `You are a product data specialist. Analyze the following product information and generate structured data.

${productInfo}

Generate a JSON response with the following structure:
{
  "specifications": {
    // Key-value pairs of technical specifications
    // Examples: "Weight": "500g", "Dimensions": "10x5x3cm", "Warranty": "2 years"
    // Include relevant specs based on product type
  },
  "features": [
    // Array of feature bullet points (strings)
    // Each feature should be 1-2 sentences
    // Include 3-8 key features
  ],
  "category": "Main category name or null",
  "subcategory": "Subcategory name or null",
  "enhanced_description": "A clear, professional product description (2-3 sentences) or null if no improvement needed"
}

Guidelines:
- Only include specifications that are relevant to the product type
- Features should highlight benefits, not just restate specs
- If you cannot determine a value with confidence, omit it or use null
- Use South African English spelling conventions
- Categories should be generic (e.g., "Networking", "Storage", "Peripherals")
- Do not make up specific technical values you're unsure about

Respond with valid JSON only.`
}

function buildBatchEnrichmentPrompt(
  products: SupplierProduct[],
  scrapedDataMap?: Map<string, ScrapedProductData>
): string {
  const productsInfo = products.map((product, index) => {
    const scrapedData = scrapedDataMap?.get(product.sku)
    return `
### Product ${index + 1} (SKU: ${product.sku})
Name: ${product.name}
Manufacturer: ${product.manufacturer || 'Unknown'}
Description: ${product.description || 'None'}
${scrapedData ? `Scraped Content: ${scrapedData.raw_content?.substring(0, 500) || 'None'}` : ''}
`.trim()
  }).join('\n\n')

  return `You are a product data specialist. Analyze the following products and generate structured data for each.

${productsInfo}

Generate a JSON response with the following structure:
{
  "products": {
    "SKU1": {
      "specifications": { /* key-value pairs */ },
      "features": [ /* array of feature strings */ ],
      "category": "category or null",
      "subcategory": "subcategory or null",
      "enhanced_description": "description or null"
    },
    "SKU2": { /* ... */ }
  }
}

Guidelines:
- Include an entry for each SKU provided
- Only include relevant specifications based on product type
- Features should highlight benefits (3-8 per product)
- Use South African English spelling
- Do not make up specific technical values

Respond with valid JSON only.`
}

// =====================================================
// Response Parsing
// =====================================================

function parseEnrichmentResponse(text: string): EnrichedProductData | null {
  try {
    // Clean up the response
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7)
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3)
    }

    const parsed = JSON.parse(cleanText.trim())

    return {
      specifications: parsed.specifications || {},
      features: Array.isArray(parsed.features) ? parsed.features : [],
      category: parsed.category || null,
      subcategory: parsed.subcategory || null,
      enhanced_description: parsed.enhanced_description || null,
    }
  } catch (error) {
    console.error('[AIEnrichment] Failed to parse response:', error)
    return null
  }
}

function parseBatchEnrichmentResponse(
  text: string
): Map<string, EnrichedProductData> {
  const results = new Map<string, EnrichedProductData>()

  try {
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7)
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3)
    }

    const parsed = JSON.parse(cleanText.trim())
    const products = parsed.products || parsed

    for (const [sku, data] of Object.entries(products)) {
      const productData = data as Record<string, unknown>
      results.set(sku, {
        specifications: (productData.specifications as Record<string, string>) || {},
        features: Array.isArray(productData.features)
          ? (productData.features as string[])
          : [],
        category: (productData.category as string) || null,
        subcategory: (productData.subcategory as string) || null,
        enhanced_description: (productData.enhanced_description as string) || null,
      })
    }
  } catch (error) {
    console.error('[AIEnrichment] Failed to parse batch response:', error)
  }

  return results
}

// =====================================================
// Utility Functions
// =====================================================

function hasEnrichedData(product: SupplierProduct): boolean {
  // Check if product already has meaningful enriched data
  const hasSpecs =
    product.specifications &&
    typeof product.specifications === 'object' &&
    Object.keys(product.specifications).length > 0

  const hasFeatures =
    Array.isArray(product.features) && product.features.length > 0

  return hasSpecs || hasFeatures
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4)
}

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

/**
 * Estimate cost of enrichment operation
 */
export function estimateEnrichmentCost(
  productCount: number,
  avgInputTokens = 500,
  avgOutputTokens = 300
): {
  estimated_tokens: number
  estimated_cost_usd: number
} {
  const totalInputTokens = productCount * avgInputTokens
  const totalOutputTokens = productCount * avgOutputTokens

  const inputCost = (totalInputTokens / 1_000_000) * PRICING.input
  const outputCost = (totalOutputTokens / 1_000_000) * PRICING.output

  return {
    estimated_tokens: totalInputTokens + totalOutputTokens,
    estimated_cost_usd: Math.round((inputCost + outputCost) * 100) / 100,
  }
}
