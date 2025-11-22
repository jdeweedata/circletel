import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { queries } from '@/lib/sanity/client'
import { sanityFetch } from '@/lib/sanity/live'
import { PortableText } from '@/components/sanity/PortableText'
import { SanityImage } from '@/components/sanity/SanityImage'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

// Section Components
import { PromotionSection } from '@/components/marketing/PromotionSection'
import { HeroSection } from '@/components/marketing/HeroSection'
import { FeaturesSection } from '@/components/marketing/FeaturesSection'
import { CallToActionSection } from '@/components/marketing/CallToActionSection'
import { FAQSection } from '@/components/marketing/FAQSection'

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
      
      // Standard Portable Text (wrapped in a container)
      case 'block':
      case 'image':
        // Note: In a real page builder, text usually comes in a 'textSection' object.
        // Since we mixed 'block' array with 'objects' in the schema, we handle single blocks here.
        // However, sequential text blocks should ideally be grouped. 
        // For simplicity in this iteration, we render them wrapped.
        // A better approach for the future is to wrap text in a "Text Section" object in Sanity.
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

  // Group sequential text blocks to avoid excessive padding/containers
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
    <div className="min-h-screen">
      {/* Fallback Hero if no Hero block is present at the start */}
      {/* Only show if the first block is NOT a hero */}
      {(!page.content || page.content.length === 0 || page.content[0]._type !== 'hero') && (
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

      {/* Footer CTA (Optional, only if not using page builder CTA at end) */}
      {/* Only show if last block is not a CTA or Footer is not explicitly disabled (future feat) */}
      <div className="bg-gray-50 py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
            Have questions? We're here to help.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}