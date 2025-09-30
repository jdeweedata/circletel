import { NextRequest, NextResponse } from 'next/server'
import strapi from '@/lib/strapi-client'
import type { StrapiMedia } from '@/lib/types/strapi'

interface AfriHostDevice {
  name: string
  description: string
  price: number
  imageUrl: string
  features: string[]
  moreInfoUrl: string
}

const devices: AfriHostDevice[] = [
  {
    name: "ZTE G5TS",
    description: "5G CPE WiFi 6 Router",
    price: 2499.00,
    imageUrl: "https://www-dev-cms.afrihost.com//imager/devices/zte-g5ts/192022/01_03ed6b724b9485d847c0ea7e6b0b3984.png",
    features: [
      "Fast speeds",
      "Supports 4G, 5G + Wifi 6",
      "Dual-band WiFi 2.4GHz and 5GHz",
      "Wireless devices: Up to 64"
    ],
    moreInfoUrl: "https://www.afrihost.com/devices/view/zte-g5ts"
  },
  {
    name: "TP-Link NX510v",
    description: "5G Fixed Wireless Router",
    price: 3999.00,
    imageUrl: "https://www-dev-cms.afrihost.com//imager/devices/tp-link-nx510v/36315/NX510v-01_03ed6b724b9485d847c0ea7e6b0b3984.png",
    features: [
      "Fast speeds",
      "Supports 4G, 5G + Wifi 6",
      "Dual-band WiFi 2.4GHz and 5GHz",
      "Wireless devices: Connect over 250"
    ],
    moreInfoUrl: "https://www.afrihost.com/devices/view/tp-link-nx510v"
  }
]

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function uploadImageToStrapi(imageBuffer: Buffer, filename: string): Promise<StrapiMedia> {
  // Mock upload since we don't have Strapi running
  console.log(`Mock uploading image: ${filename} (${imageBuffer.length} bytes)`)

  const mockMedia: StrapiMedia = {
    id: Math.floor(Math.random() * 1000),
    documentId: `media_${Math.random().toString(36).substr(2, 9)}`,
    name: filename,
    alternativeText: filename,
    caption: '',
    width: 400,
    height: 300,
    formats: {
      thumbnail: {
        name: `thumb_${filename}`,
        hash: 'thumbnail_hash',
        ext: '.png',
        mime: 'image/png',
        width: 150,
        height: 113,
        size: 10.5,
        url: `/uploads/thumbnail_${filename}`
      }
    },
    hash: `hash_${filename}`,
    ext: '.png',
    mime: 'image/png',
    size: 45.2,
    url: `/uploads/${filename}`,
    provider: 'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  }

  return mockMedia
}

async function createProduct(device: AfriHostDevice, image: StrapiMedia): Promise<any> {
  const productData = {
    data: {
      name: device.name,
      description: device.description,
      price: device.price,
      sku: device.name.toLowerCase().replace(/\s+/g, '-'),
      images: [image.id],
      specifications: {
        features: device.features,
        sourceUrl: device.moreInfoUrl,
        source: "Afrihost",
        type: "Wireless Router"
      },
      inStock: true
    }
  }

  return await strapi.create('products', productData)
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting Afrihost devices import...')
    const results = []

    for (const device of devices) {
      console.log(`Processing device: ${device.name}`)

      try {
        // Download image
        console.log(`Downloading image from: ${device.imageUrl}`)
        const imageBuffer = await downloadImage(device.imageUrl)

        // Upload to Strapi
        const filename = `${device.name.toLowerCase().replace(/\s+/g, '-')}.png`
        console.log(`Uploading image: ${filename}`)
        const uploadedImage = await uploadImageToStrapi(imageBuffer, filename)

        // Create product
        console.log(`Creating product: ${device.name}`)
        const product = await createProduct(device, uploadedImage)

        results.push({
          device: device.name,
          status: 'success',
          productId: product.data.id
        })

        console.log(`✅ Successfully imported: ${device.name}`)
      } catch (error) {
        console.error(`Failed to import ${device.name}:`, error)
        results.push({
          device: device.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errorCount,
      results
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}