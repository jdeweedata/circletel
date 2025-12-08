/**
 * Supplier Product Image Cache Service
 *
 * Downloads product images from supplier URLs and caches them
 * to Supabase Storage for reliable serving.
 */

import { createClient } from '@/lib/supabase/server'
import {
  ImageCacheResult,
  BatchImageCacheResult,
  SupplierProduct,
} from './types'

const BUCKET_NAME = 'supplier-images'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Cache a single image from source URL to Supabase Storage
 */
export async function cacheImage(
  sourceUrl: string,
  supplierCode: string,
  sku: string
): Promise<ImageCacheResult> {
  if (!sourceUrl) {
    return {
      source_url: sourceUrl,
      cached_path: null,
      success: false,
      error: 'No source URL provided',
    }
  }

  try {
    const supabase = await createClient()

    // Generate storage path: supplier-code/sku.ext
    const extension = getExtensionFromUrl(sourceUrl)
    const storagePath = `${supplierCode.toLowerCase()}/${sanitizeSku(sku)}.${extension}`

    // Check if already cached
    const { data: existingFile } = await supabase.storage
      .from(BUCKET_NAME)
      .list(supplierCode.toLowerCase(), {
        search: sanitizeSku(sku),
      })

    if (existingFile && existingFile.length > 0) {
      return {
        source_url: sourceUrl,
        cached_path: storagePath,
        success: true,
        size_bytes: existingFile[0].metadata?.size,
      }
    }

    // Fetch image from source
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'CircleTel-ImageCache/1.0',
        'Accept': 'image/*',
      },
    })

    if (!response.ok) {
      return {
        source_url: sourceUrl,
        cached_path: null,
        success: false,
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      }
    }

    // Validate content type
    const contentType = response.headers.get('content-type')
    if (contentType && !ALLOWED_TYPES.some(t => contentType.includes(t))) {
      return {
        source_url: sourceUrl,
        cached_path: null,
        success: false,
        error: `Invalid content type: ${contentType}`,
      }
    }

    // Get image data
    const imageBuffer = await response.arrayBuffer()
    const imageSize = imageBuffer.byteLength

    // Check size
    if (imageSize > MAX_IMAGE_SIZE) {
      return {
        source_url: sourceUrl,
        cached_path: null,
        success: false,
        error: `Image too large: ${(imageSize / 1024 / 1024).toFixed(2)}MB`,
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBuffer, {
        contentType: contentType || 'image/jpeg',
        cacheControl: '31536000', // 1 year cache
        upsert: true,
      })

    if (uploadError) {
      return {
        source_url: sourceUrl,
        cached_path: null,
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      }
    }

    return {
      source_url: sourceUrl,
      cached_path: storagePath,
      success: true,
      size_bytes: imageSize,
    }
  } catch (error) {
    return {
      source_url: sourceUrl,
      cached_path: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Cache images for multiple products
 */
export async function cacheProductImages(
  supplierCode: string,
  products: Pick<SupplierProduct, 'id' | 'sku' | 'source_image_url' | 'cached_image_path'>[]
): Promise<BatchImageCacheResult> {
  const supabase = await createClient()
  const results: ImageCacheResult[] = []
  let cached = 0
  let failed = 0
  let skipped = 0

  // Process in parallel with concurrency limit
  const concurrencyLimit = 5
  const chunks = chunkArray(products, concurrencyLimit)

  for (const chunk of chunks) {
    const promises = chunk.map(async (product) => {
      // Skip if already cached
      if (product.cached_image_path) {
        skipped++
        return {
          source_url: product.source_image_url || '',
          cached_path: product.cached_image_path,
          success: true,
        }
      }

      // Skip if no source URL
      if (!product.source_image_url) {
        skipped++
        return {
          source_url: '',
          cached_path: null,
          success: false,
          error: 'No source URL',
        }
      }

      // Cache the image
      const result = await cacheImage(
        product.source_image_url,
        supplierCode,
        product.sku
      )

      // Update product record with cached path
      if (result.success && result.cached_path) {
        await supabase
          .from('supplier_products')
          .update({ cached_image_path: result.cached_path })
          .eq('id', product.id)

        cached++
      } else {
        failed++
      }

      return result
    })

    const chunkResults = await Promise.all(promises)
    results.push(...chunkResults)
  }

  return {
    total: products.length,
    cached,
    failed,
    skipped,
    results,
  }
}

/**
 * Cache all uncached images for a supplier
 */
export async function cacheAllSupplierImages(
  supplierId: string,
  supplierCode: string
): Promise<BatchImageCacheResult> {
  const supabase = await createClient()

  // Get products without cached images
  const { data: products, error } = await supabase
    .from('supplier_products')
    .select('id, sku, source_image_url, cached_image_path')
    .eq('supplier_id', supplierId)
    .eq('is_active', true)
    .is('cached_image_path', null)
    .not('source_image_url', 'is', null)
    .limit(500) // Process in batches

  if (error) {
    throw new Error(`Failed to get products: ${error.message}`)
  }

  if (!products || products.length === 0) {
    return {
      total: 0,
      cached: 0,
      failed: 0,
      skipped: 0,
      results: [],
    }
  }

  return cacheProductImages(supplierCode, products)
}

/**
 * Get public URL for a cached image
 */
export function getCachedImageUrl(cachedPath: string | null): string | null {
  if (!cachedPath) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${cachedPath}`
}

/**
 * Delete cached image
 */
export async function deleteCachedImage(cachedPath: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([cachedPath])

  return !error
}

/**
 * Delete all cached images for a supplier
 */
export async function deleteSupplierImages(supplierCode: string): Promise<number> {
  const supabase = await createClient()

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(supplierCode.toLowerCase())

  if (listError || !files) return 0

  const paths = files.map(f => `${supplierCode.toLowerCase()}/${f.name}`)

  if (paths.length === 0) return 0

  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths)

  return deleteError ? 0 : paths.length
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract file extension from URL
 */
function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.([a-z0-9]+)$/i)
    if (match) {
      const ext = match[1].toLowerCase()
      // Map common extensions
      if (['jpg', 'jpeg'].includes(ext)) return 'jpg'
      if (['png', 'webp', 'gif'].includes(ext)) return ext
    }
  } catch {
    // Invalid URL
  }
  return 'jpg' // Default to jpg
}

/**
 * Sanitize SKU for use as filename
 */
function sanitizeSku(sku: string): string {
  return sku
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100)
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
