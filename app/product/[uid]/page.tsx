import { PiArrowRightBold } from 'react-icons/pi'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { sanityFetch } from '@/lib/sanity/fetch'
import { urlFor } from '@/lib/sanity/image'
import { BlockRenderer } from '@/components/sanity/BlockRenderer'
import { SanitySection } from '@/lib/sanity/types'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

/**
 * Sanity Product Page Route
 *
 * Renders product pages with hero, features, pricing, and content blocks
 */

interface ProductPageData {
  _id: string
  name: string
  slug: string
  category?: string
  tagline?: string
  heroImage?: { asset?: { url?: string }; alt?: string }
  pricing?: {
    startingPrice?: number
    priceNote?: string
    showContactForPricing?: boolean
  }
  keyFeatures?: Array<{ title: string; description: string; icon?: string }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: { asset?: { url?: string } }
  }
  blocks?: SanitySection[]
}

type Params = { uid: string }

const PRODUCT_PAGE_QUERY = `*[_type == "productPage" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  category,
  tagline,
  heroImage {
    asset->{url},
    alt
  },
  pricing,
  keyFeatures,
  seo,
  blocks[]{
    _key,
    _type,
    ...
  }
}`

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { uid } = await params

  const page = await sanityFetch<ProductPageData | null>({
    query: PRODUCT_PAGE_QUERY,
    params: { slug: uid },
    tags: [`product:${uid}`, 'products'],
  })

  if (!page) {
    return { title: 'Product Not Found' }
  }

  return {
    title: page.seo?.metaTitle || `${page.name} | CircleTel`,
    description: page.seo?.metaDescription || page.tagline || 'CircleTel connectivity products',
    openGraph: page.seo?.ogImage?.asset?.url
      ? {
          images: [{ url: page.seo.ogImage.asset.url }],
        }
      : undefined,
  }
}

export async function generateStaticParams() {
  const pages = await sanityFetch<{ slug: string }[]>({
    query: `*[_type == "productPage" && defined(slug.current)]{ "slug": slug.current }`,
    params: {},
    tags: ['products'],
  })

  return pages.map((page) => ({ uid: page.slug }))
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { uid } = await params

  const page = await sanityFetch<ProductPageData | null>({
    query: PRODUCT_PAGE_QUERY,
    params: { slug: uid },
    tags: [`product:${uid}`, 'products'],
  })

  if (!page) {
    notFound()
  }

  const heroImageUrl = page.heroImage?.asset?.url
    ? urlFor(page.heroImage).width(1920).height(1080).url()
    : null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center">
          {/* Background Image */}
          {heroImageUrl && (
            <div className="absolute inset-0 z-0">
              <Image
                src={heroImageUrl}
                alt={page.heroImage?.alt || page.name || 'Product hero'}
                fill
                className="object-cover"
                priority
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </div>
          )}

          {/* Hero Content */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              {page.category && (
                <span className="text-sm font-medium text-circleTel-orange uppercase tracking-wide">
                  {page.category}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
                {page.name}
              </h1>
              {page.tagline && (
                <p className="text-xl md:text-2xl text-white/90 mb-8">{page.tagline}</p>
              )}
              {page.pricing && !page.pricing.showContactForPricing && page.pricing.startingPrice && (
                <p className="text-2xl text-white font-bold mb-6">
                  From R{page.pricing.startingPrice.toLocaleString()}
                  {page.pricing.priceNote && (
                    <span className="text-lg font-normal text-white/80">
                      {' '}
                      {page.pricing.priceNote}
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
        {page.keyFeatures && page.keyFeatures.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {page.keyFeatures.map((feature, index) => (
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
        <BlockRenderer sections={page.blocks || []} />
      </main>
      <Footer />
    </div>
  )
}
