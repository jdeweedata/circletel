import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface RelatedProductsProps {
  products: Array<{
    _id: string
    name: string
    slug: string
    tagline?: string
    heroImage?: string | null
    pricing?: { startingPrice?: number; priceNote?: string }
  }>
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          You Might Also Like
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product.slug}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.heroImage && (
                  <div className="relative h-48">
                    <Image
                      src={product.heroImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-1">
                    {product.name}
                  </h3>
                  {product.tagline && (
                    <p className="text-slate-600 text-sm mb-2">
                      {product.tagline}
                    </p>
                  )}
                  {product.pricing?.startingPrice != null && (
                    <p className="text-primary font-medium">
                      From R{product.pricing.startingPrice.toLocaleString()}/mo
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
