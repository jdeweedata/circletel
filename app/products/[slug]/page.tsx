import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { PortableText } from '@/components/sanity/PortableText'
import { SanityImage } from '@/components/sanity/SanityImage'
import { Button } from '@/components/ui/button'
import { Check, Wifi, Activity, Gauge } from 'lucide-react'
import Link from 'next/link'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: product } = await sanityFetch({
    query: queries.productBySlug,
    params: { slug },
    tags: [`product:${slug}`]
  })

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.name} | CircleTel Products`,
    description: product.name, // Could extract from description blocks if needed
  }
}

export default async function ProductPageView({ params }: ProductPageProps) {
  const { slug } = await params
  const { data: product } = await sanityFetch({
    query: queries.productBySlug,
    params: { slug },
    tags: [`product:${slug}`]
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Product Header / Hero */}
      <div className="bg-gray-50 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <Link 
            href="/products" 
            className="inline-flex items-center text-gray-600 hover:text-circleTel-orange mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Product Gallery/Image */}
            <div className="space-y-4">
              {product.image && (
                <div className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
                  <SanityImage
                    image={product.image}
                    alt={product.name}
                    fill
                    priority
                    className="p-4"
                  />
                </div>
              )}
              {product.gallery && product.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.gallery.map((image: any, index: number) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-sm border border-gray-100 cursor-pointer hover:border-circleTel-orange transition-colors">
                      <SanityImage
                        image={image}
                        alt={`${product.name} gallery image ${index + 1}`}
                        fill
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.category && (
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                  product.category.title === 'Business' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {product.category.title}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-circleTel-orange">
                  R{product.price}
                </span>
                <span className="text-gray-500">/month</span>
              </div>

              {product.setupFee > 0 && (
                <p className="text-sm text-gray-500 mb-6">
                  One-time setup fee: R{product.setupFee}
                </p>
              )}

              {product.description && (
                <div className="prose prose-sm text-gray-600 mb-8">
                  <PortableText content={product.description} />
                </div>
              )}

              <div className="space-y-4">
                <Link href={`/coverage?product=${product._id}`}>
                  <Button size="lg" className="w-full md:w-auto bg-circleTel-orange hover:bg-orange-600 text-white">
                    Check Availability
                  </Button>
                </Link>
                <p className="text-xs text-gray-400 text-center md:text-left">
                  * Terms and conditions apply. Availability depends on coverage area.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          
          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">Key Features</h2>
              <ul className="space-y-4">
                {product.features.map((item: any, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`mt-1 rounded-full p-1 ${item.included ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {item.included ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 flex items-center justify-center font-bold">×</div>}
                    </div>
                    <span className={item.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                      {item.feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Specs */}
          {product.specifications && (
            <div>
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">Technical Specifications</h2>
              <div className="grid grid-cols-1 gap-4">
                {product.specifications.speed && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Gauge className="w-8 h-8 text-circleTel-orange mr-4" />
                    <div>
                      <p className="text-sm text-gray-500">Speed</p>
                      <p className="font-semibold text-gray-900">{product.specifications.speed}</p>
                    </div>
                  </div>
                )}
                {product.specifications.dataLimit && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Activity className="w-8 h-8 text-circleTel-orange mr-4" />
                    <div>
                      <p className="text-sm text-gray-500">Data Limit</p>
                      <p className="font-semibold text-gray-900">{product.specifications.dataLimit}</p>
                    </div>
                  </div>
                )}
                {product.specifications.technology && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Wifi className="w-8 h-8 text-circleTel-orange mr-4" />
                    <div>
                      <p className="text-sm text-gray-500">Technology</p>
                      <p className="font-semibold text-gray-900">{product.specifications.technology}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
