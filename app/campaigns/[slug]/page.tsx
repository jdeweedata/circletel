import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PromotionGrid } from '@/components/marketing/PromotionGrid'
import { useCampaign } from '@/hooks/use-campaigns'
import Link from 'next/link'

interface CampaignPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params

  return {
    title: `${slug} Campaign | CircleTel`,
    description: 'CircleTel campaign page',
  }
}

export default async function CampaignPageView({ params }: CampaignPageProps) {
  const { slug } = await params

  return <CampaignPageContent slug={slug} />
}

function CampaignPageContent({ slug }: { slug: string }) {
  'use client'

  const { data: campaign, isLoading, error } = useCampaign(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-circleTel-orange border-r-transparent"></div>
      </div>
    )
  }

  if (error || !campaign) {
    notFound()
  }

  const startDate = new Date(campaign.startDate).toLocaleDateString()
  const endDate = new Date(campaign.endDate).toLocaleDateString()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Campaign Header */}
      <section className="bg-gradient-to-br from-circleTel-orange to-orange-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-semibold uppercase">
              {campaign.type.replace('-', ' ')}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">{campaign.name}</h1>
            <p className="text-lg opacity-90">
              {startDate} - {endDate}
            </p>
            {campaign.description && (
              <div
                className="prose prose-lg prose-invert mx-auto"
                dangerouslySetInnerHTML={{ __html: campaign.description }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Campaign Promotions */}
      {campaign.promotions && campaign.promotions.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Campaign Offers
          </h2>
          <PromotionGrid promotions={campaign.promotions} columns={3} showFilter={false} />
        </section>
      )}

      {/* Related Marketing Pages */}
      {campaign.marketingPages && campaign.marketingPages.length > 0 && (
        <section className="container mx-auto px-4 py-16 bg-white">
          <h2 className="text-3xl font-bold text-center mb-12">
            Learn More
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaign.marketingPages.map(page => (
              <Link
                key={page.id}
                href={`/marketing/${page.slug}`}
                className="block p-6 bg-gray-50 rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{page.title}</h3>
                {page.metaDescription && (
                  <p className="text-gray-600">{page.metaDescription}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}