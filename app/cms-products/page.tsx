import { client, queries } from '@/lib/sanity/client'
import { PortableText } from '@/components/sanity/PortableText'
import Link from 'next/link'
import { Metadata } from 'next'

interface Product {
  _id: string
  name: string
  slug: { current: string }
  description: any[]
  price: number
  setupFee: number
  category?: {
    title: string
    slug: { current: string }
    color: string
  }
  features: Array<{
    _key: string
    feature: string
    included: boolean
  }>
  specifications: {
    speed?: string
    dataLimit?: string
    technology?: string
    coverage?: string
  }
  isActive: boolean
  isFeatured: boolean
  _createdAt: string
}

export const metadata: Metadata = {
  title: 'Products & Services | CircleTel',
  description: 'Explore our range of internet packages and cloud services',
}

async function getProducts(): Promise<Product[]> {
  // Skip Sanity calls during build if no project ID configured
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === 'dummy-project-id') {
    return []
  }
  
  try {
    const products = await client.fetch(queries.products)
    return products?.filter((product: Product) => product.isActive) || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function CMSProducts() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-4">
              Products & Services
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from our range of internet packages and cloud services designed for South African businesses and consumers
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              No active products are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {products.map((product) => (
              <div
                key={product._id}
                className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                  product.isFeatured ? 'ring-2 ring-circleTel-orange' : ''
                }`}
              >
                {/* Product Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral">
                      {product.name}
                    </h2>
                    {product.isFeatured && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-circleTel-orange text-white">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  {product.category && (
                    <span
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white mb-4"
                      style={{ backgroundColor: product.category.color }}
                    >
                      {product.category.title}
                    </span>
                  )}

                  {/* Pricing */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-circleTel-darkNeutral">
                      R{product.price.toLocaleString()}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  {product.setupFee > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Setup fee: R{product.setupFee.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="p-6 border-b border-gray-200">
                  {product.description && product.description.length > 0 && (
                    <PortableText content={product.description} className="text-sm" />
                  )}
                </div>

                {/* Features */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Features Included:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature) => (
                      <li key={feature._key} className="flex items-center">
                        <svg
                          className={`w-4 h-4 mr-3 ${
                            feature.included ? 'text-green-500' : 'text-red-500'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          {feature.included ? (
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          ) : (
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          )}
                        </svg>
                        <span className="text-gray-700">{feature.feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specifications */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Technical Specifications:</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm">
                    {product.specifications.speed && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Speed:</dt>
                        <dd className="font-medium">{product.specifications.speed}</dd>
                      </div>
                    )}
                    {product.specifications.dataLimit && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Data Limit:</dt>
                        <dd className="font-medium">{product.specifications.dataLimit}</dd>
                      </div>
                    )}
                    {product.specifications.technology && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Technology:</dt>
                        <dd className="font-medium">{product.specifications.technology}</dd>
                      </div>
                    )}
                    {product.specifications.coverage && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Coverage:</dt>
                        <dd className="font-medium">{product.specifications.coverage}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button className="w-full bg-circleTel-orange text-white px-6 py-3 rounded-md font-medium hover:bg-orange-600 transition-colors">
                      Get This Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}