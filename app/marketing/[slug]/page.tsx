import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { PortableText } from '@/components/sanity/PortableText'
import { SanityImage } from '@/components/sanity/SanityImage'
import { Button } from '@/components/ui/button'
import { PromotionSection } from '@/components/marketing/PromotionSection'
import Link from 'next/link'

interface MarketingPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: page } = await sanityFetch({
    query: queries.pageBySlug,
    params: { slug },
  })

  if (!page) {
    return {
      title: 'Page Not Found',
    }
  }

  return {
    title: `${page.seo?.title || page.title} | CircleTel`,
    description: page.seo?.description || page.excerpt,
  }
}

export default async function MarketingPageView({ params }: MarketingPageProps) {
  const { slug } = await params
  const { data: page } = await sanityFetch({
    query: queries.pageBySlug,
    params: { slug },
  })

  if (!page) {
    notFound()
  }

  // Group content blocks
  const sections: any[] = []
  let currentTextBlocks: any[] = []

  page.content?.forEach((block: any) => {
    if (block._type === 'promotionSection') {
      if (currentTextBlocks.length > 0) {
        sections.push({ type: 'text', blocks: currentTextBlocks })
        currentTextBlocks = []
      }
      sections.push({ type: 'promotion', data: block })
    } else {
      currentTextBlocks.push(block)
    }
  })
  
  if (currentTextBlocks.length > 0) {
    sections.push({ type: 'text', blocks: currentTextBlocks })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-circleTel-darkNeutral text-white py-20 md:py-32 relative overflow-hidden">
        {page.image && (
          <div className="absolute inset-0 opacity-20">
            <SanityImage
              image={page.image}
              alt={page.title}
              fill
              priority
            />
          </div>
        )}
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              {page.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Dynamic Content Sections */}
      {sections.map((section, index) => {
        if (section.type === 'promotion') {
          return <PromotionSection key={section.data._key || index} {...section.data} />
        } else {
          return (
            <div key={index} className="container mx-auto px-4 py-16 max-w-4xl">
              <div className="prose prose-lg max-w-none prose-headings:text-circleTel-darkNeutral prose-a:text-circleTel-orange hover:prose-a:text-orange-600">
                <PortableText content={section.blocks} />
              </div>
            </div>
          )
        }
      })}

      {/* CTA Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-6">
            Ready to get started?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-circleTel-orange hover:bg-orange-600 text-white w-full sm:w-auto">
                Contact Sales
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-circleTel-darkNeutral text-circleTel-darkNeutral hover:bg-gray-100 w-full sm:w-auto">
                View Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}