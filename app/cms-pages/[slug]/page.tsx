import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { PortableText } from '@/components/sanity/PortableText'
import { SanityImage } from '@/components/sanity/SanityImage'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

// Section Components
import { PromotionSection } from '@/components/marketing/PromotionSection'
import { HeroSection } from '@/components/marketing/HeroSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { CallToActionSection } from '@/components/marketing/CallToActionSection'
import { FAQSection } from '@/components/marketing/FAQSection'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { data: page } = await sanityFetch({
    query: queries.pageBySlug,
    params: { slug },
  })

  if (!page) {
    return {
      title: 'Page Not Found | CircleTel',
      description: 'The requested page could not be found.',
    }
  }

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.excerpt || '',
    keywords: page.seo?.keywords?.join(', ') || '',
    openGraph: {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.excerpt || '',
      type: 'website',
    },
  }
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params
  const { data: page } = await sanityFetch({
    query: queries.pageBySlug,
    params: { slug },
  })

  if (!page) {
    notFound()
  }

  // Helper to render blocks
  const renderBlock = (block: any, index: number) => {
    switch (block._type) {
      case 'hero':
        return <HeroSection key={block._key || index} {...block} />
      
      case 'features':
        return <FeaturesSection key={block._key || index} {...block} />
      
      case 'callToAction':
        return <CallToActionSection key={block._key || index} {...block} />
      
      case 'faq':
        return <FAQSection key={block._key || index} {...block} />

      case 'promotionSection':
        return <PromotionSection key={block._key || index} {...block} />
      
      // Standard Portable Text
      case 'block':
      case 'image':
        return (
          <div key={block._key || index} className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="prose prose-lg max-w-none prose-headings:text-circleTel-darkNeutral prose-a:text-circleTel-orange hover:prose-a:text-orange-600">
              <PortableText content={[block]} />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // Group sequential text blocks
  const groupedBlocks: any[] = []
  let currentTextGroup: any[] = []

  page.content?.forEach((block: any) => {
    if (block._type === 'block' || block._type === 'image') {
      currentTextGroup.push(block)
    } else {
      if (currentTextGroup.length > 0) {
        groupedBlocks.push({ _type: 'textGroup', blocks: [...currentTextGroup] })
        currentTextGroup = []
      }
      groupedBlocks.push(block)
    }
  })
  
  if (currentTextGroup.length > 0) {
    groupedBlocks.push({ _type: 'textGroup', blocks: [...currentTextGroup] })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Fallback Hero if no Hero block is present at the start */}
      {(!page.content || page.content.length === 0 || page.content[0]._type !== 'hero') && (
        <div className="bg-gradient-to-r from-circleTel-orange to-orange-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-xl text-orange-100 max-w-3xl mx-auto">
                {page.excerpt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Render Content Blocks */}
      {groupedBlocks.map((block, index) => {
        if (block._type === 'textGroup') {
          return (
             <div key={`text-group-${index}`} className="container mx-auto px-4 py-12 max-w-4xl">
              <div className="prose prose-lg max-w-none prose-headings:text-circleTel-darkNeutral prose-a:text-circleTel-orange hover:prose-a:text-orange-600">
                <PortableText content={block.blocks} />
              </div>
            </div>
          )
        }
        return renderBlock(block, index)
      })}

      {/* Navigation Footer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-200 mt-12">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            ← Go Home
          </Link>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(page._createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}