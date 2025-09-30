import strapi from '@/lib/strapi-client'
import type { Product, StrapiMedia } from '@/lib/types/strapi'

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
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/png' })
  formData.append('files', blob, filename)

  const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`)
  }

  const result = await response.json()
  return result[0] // Strapi returns an array
}

async function createProduct(device: AfriHostDevice, image: StrapiMedia): Promise<void> {
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

  const response = await strapi.create('products', productData)
  console.log(`Created product: ${device.name}`, response)
}

async function importAfriHostDevices() {
  try {
    console.log('Starting Afrihost devices import...')

    for (const device of devices) {
      console.log(`Processing device: ${device.name}`)

      // Download image
      console.log(`Downloading image from: ${device.imageUrl}`)
      const imageBuffer = await downloadImage(device.imageUrl)

      // Upload to Strapi
      const filename = `${device.name.toLowerCase().replace(/\s+/g, '-')}.png`
      console.log(`Uploading image: ${filename}`)
      const uploadedImage = await uploadImageToStrapi(imageBuffer, filename)

      // Create product
      console.log(`Creating product: ${device.name}`)
      await createProduct(device, uploadedImage)

      console.log(`✅ Successfully imported: ${device.name}`)
    }

    console.log('🎉 All devices imported successfully!')
  } catch (error) {
    console.error('Error importing devices:', error)
    throw error
  }
}

export { importAfriHostDevices }

// Run if called directly
if (require.main === module) {
  importAfriHostDevices().catch(console.error)
}