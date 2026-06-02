/**
 * Payload CMS product data access layer.
 * 
 * Queries the Payload Local API for product data.
 * All product data now lives in the Payload 'products' collection.
 */

import type { ProductData } from './types'

let payloadClient: any = null

async function getPayloadClient() {
  if (payloadClient) return payloadClient

  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    payloadClient = await getPayload({ config })
    return payloadClient
  } catch {
    return null
  }
}

function toProductData(doc: any): ProductData {
  return {
    _id: doc.id?.toString() || doc.slug,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    tagline: doc.tagline || undefined,
    description: doc.description || undefined,
    heroImage: doc.heroImage?.url || null,
    pricing: doc.pricing ? {
      startingPrice: doc.pricing.startingPrice,
      priceNote: doc.pricing.priceNote || 'per month',
      showContactForPricing: doc.pricing.showContactForPricing || false,
    } : undefined,
    keyFeatures: (doc.keyFeatures || []).map((f: any) => ({
      _key: f.id || f.title,
      title: f.title,
      description: f.description || '',
      icon: f.icon || 'speed',
    })),
    specifications: (doc.specifications || []).map((s: any) => ({
      _key: s.id || s.label,
      label: s.label,
      value: s.value,
    })),
    seo: doc.meta ? {
      metaTitle: doc.meta.title,
      metaDescription: doc.meta.description,
    } : undefined,
  }
}

export async function getAllProducts(): Promise<ProductData[]> {
  const payload = await getPayloadClient()
  if (!payload) return []

  try {
    const { docs } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 100,
    })
    return docs.map(toProductData)
  } catch {
    return []
  }
}

export async function getProductBySlug(slug: string): Promise<ProductData | undefined> {
  const payload = await getPayloadClient()
  if (!payload) return undefined

  try {
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: 'published' } },
        ],
      },
      limit: 1,
    })

    if (docs.length === 0) return undefined
    return toProductData(docs[0])
  } catch {
    return undefined
  }
}

export async function getProductSlugs(): Promise<string[]> {
  const payload = await getPayloadClient()
  if (!payload) return []

  try {
    const { docs } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 100,
      select: { slug: true },
    })
    return docs.map((d: any) => d.slug)
  } catch {
    return []
  }
}
