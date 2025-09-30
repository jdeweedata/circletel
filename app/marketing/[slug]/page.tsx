import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { MarketingSections } from '@/components/marketing/MarketingSections'
import { useMarketingPage } from '@/hooks/use-marketing-pages'

interface MarketingPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { slug } = await params

  // In a real implementation, you'd fetch the page data here
  // For now, return default metadata
  return {
    title: `${slug} | CircleTel`,
    description: 'CircleTel marketing page',
  }
}

export default async function MarketingPageView({ params }: MarketingPageProps) {
  const { slug } = await params

  return <MarketingPageContent slug={slug} />
}

function MarketingPageContent({ slug }: { slug: string }) {
  'use client'

  const { data: page, isLoading, error } = useMarketingPage(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-circleTel-orange border-r-transparent"></div>
      </div>
    )
  }

  if (error || !page) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {page.hero && <MarketingHero hero={page.hero} />}

      {/* Dynamic Sections */}
      {page.sections && page.sections.length > 0 && (
        <MarketingSections
          sections={page.sections}
          promotions={page.promotions}
          className="py-16"
        />
      )}
    </div>
  )
}