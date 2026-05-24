import { PiArrowRightBold } from 'react-icons/pi'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { LivePrice } from '@/components/products/LivePrice'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { products, getProductBySlug } from '@/lib/data/products'

type Params = { uid: string }

export function generateStaticParams() {
  return products.map((p) => ({ uid: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { uid } = await params
  const product = getProductBySlug(uid)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.seo?.metaTitle || `${product.name} | CircleTel`,
    description: product.seo?.metaDescription || product.tagline || 'CircleTel connectivity products',
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { uid } = await params
  const product = getProductBySlug(uid)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center">
          {product.heroImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={product.heroImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </div>
          )}

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              {product.category && (
                <span className="text-sm font-medium text-circleTel-orange uppercase tracking-wide">
                  {product.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
                {product.name}
              </h1>
              {product.tagline && (
                <p className="text-xl md:text-2xl text-white/90 mb-8">{product.tagline}</p>
              )}
              {product.pricing && !product.pricing.showContactForPricing && product.pricing.startingPrice && (
                <p className="text-2xl text-white font-bold mb-6">
                  From{' '}
                  <LivePrice
                    productSlug={product.slug}
                    staticPrice={product.pricing.startingPrice}
                    className="text-2xl text-white font-bold"
                    prefix="R"
                  />
                  {product.pricing.priceNote && (
                    <span className="text-lg font-normal text-white/80">
                      {' '}
                      {product.pricing.priceNote}
                    </span>
                  )}
                </p>
              )}
              <Button
                asChild
                size="lg"
                className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-bold px-8 py-6 text-lg"
              >
                <Link href="/coverage">
                  Check Coverage
                  <PiArrowRightBold className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Key Features */}
        {product.keyFeatures && product.keyFeatures.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {product.keyFeatures.map((feature, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Additional Blocks */}
        {product.blocks && product.blocks.length > 0 && (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <BlockRenderer sections={product.blocks as any} />
        )}
      </main>
      <Footer />
    </div>
  )
}
