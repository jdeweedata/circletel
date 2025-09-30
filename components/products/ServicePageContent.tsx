'use client'

import { useServicePage } from '@/hooks/use-service-pages'
import { PackageCard } from './PackageCard'
import { PricingComparisonTable } from './PricingComparisonTable'
import { HowItWorksSection } from './HowItWorksSection'
import { FAQAccordion } from './FAQAccordion'
import { SpecGrid } from './SpecGrid'
import { ServicePageSection } from '@/lib/types/strapi'
import { Loader2 } from 'lucide-react'

interface ServicePageContentProps {
  slug: string
  category?: string
}

export function ServicePageContent({ slug, category }: ServicePageContentProps) {
  const { data: page, isLoading, error } = useServicePage(slug)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Content Not Available</h3>
          <p className="text-yellow-700">
            This page content is being configured in the CMS. Please check back soon or contact support.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">
      {/* Packages Section */}
      {page.packages && page.packages.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.packages.map((pkg) =>
              pkg.tiers?.map((tier) => (
                <PackageCard key={tier.id} tier={tier} />
              ))
            )}
          </div>
        </section>
      )}

      {/* Dynamic Sections */}
      {page.sections && page.sections.length > 0 && (
        <div className="space-y-16 py-8">
          {page.sections.map((section, index) => (
            <section key={index} className="container mx-auto px-4">
              {renderSection(section)}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function renderSection(section: ServicePageSection) {
  switch (section.__component) {
    case 'sections.pricing-table':
      return <PricingComparisonTable section={section} />

    case 'sections.how-it-works':
      return <HowItWorksSection section={section} />

    case 'sections.faq':
      return <FAQAccordion section={section} />

    case 'sections.spec-grid':
      return <SpecGrid section={section} />

    case 'sections.text-content':
      return (
        <div className="max-w-4xl mx-auto">
          {section.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-6 text-center">
              {section.title}
            </h2>
          )}
          <div
            className={`prose prose-lg max-w-none text-${section.alignment}`}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </div>
      )

    case 'sections.cta-banner':
      return (
        <div
          className="relative rounded-2xl overflow-hidden py-16 px-8 text-center"
          style={{ backgroundColor: section.backgroundColor }}
        >
          {section.backgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${section.backgroundImage.url})` }}
            />
          )}
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {section.title}
            </h2>
            {section.description && (
              <p className="text-xl text-white/90 mb-8">{section.description}</p>
            )}
            <a
              href={section.ctaLink}
              className="inline-block px-8 py-4 bg-white text-circleTel-darkNeutral font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {section.ctaText}
            </a>
          </div>
        </div>
      )

    case 'sections.feature-list':
      return (
        <div className="max-w-4xl mx-auto">
          {section.title && (
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-8 text-center">
              {section.title}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.features.map((feature) => (
              <div
                key={feature.id}
                className="flex gap-4 p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {feature.icon && (
                  <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">
                    {feature.title}
                  </h3>
                  {feature.description && (
                    <p className="text-circleTel-secondaryNeutral">{feature.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}