'use client'

import { cn } from '@/lib/utils'
import type {
  MarketingPageSection,
  PromoGridSection,
  FeatureListSection,
  TextContentSection,
  CTABannerSection,
  ImageTextSection,
  StrapiMedia,
  Promotion
} from '@/lib/types/strapi'
import Image from 'next/image'
import Link from 'next/link'
import { PromotionGrid } from './PromotionGrid'

interface MarketingSectionsProps {
  sections: MarketingPageSection[]
  promotions?: Promotion[]
  className?: string
}

function getImageUrl(media?: StrapiMedia): string | null {
  if (!media) return null
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
  return media.url.startsWith('http') ? media.url : `${strapiUrl}${media.url}`
}

export function MarketingSections({
  sections,
  promotions = [],
  className,
}: MarketingSectionsProps) {
  return (
    <div className={cn('space-y-16', className)}>
      {sections.map((section, index) => {
        switch (section.__component) {
          case 'sections.promo-grid':
            return (
              <section key={index} className="container mx-auto px-4">
                {section.title && (
                  <h2 className="text-3xl font-bold text-center mb-8">
                    {section.title}
                  </h2>
                )}
                <PromotionGrid
                  promotions={promotions}
                  columns={section.columns}
                  showFilter={section.showFilter}
                />
              </section>
            )

          case 'sections.feature-list':
            return (
              <section key={index} className="container mx-auto px-4">
                {section.title && (
                  <h2 className="text-3xl font-bold text-center mb-12">
                    {section.title}
                  </h2>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {section.features?.map((feature, idx) => (
                    <div key={idx} className="text-center space-y-3">
                      {feature.icon && (
                        <div className="text-4xl">{feature.icon}</div>
                      )}
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      {feature.description && (
                        <p className="text-gray-600">{feature.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )

          case 'sections.text-content':
            return (
              <section key={index} className="container mx-auto px-4">
                <div
                  className={cn(
                    'max-w-4xl mx-auto prose prose-lg',
                    section.alignment === 'center' && 'text-center',
                    section.alignment === 'right' && 'text-right'
                  )}
                >
                  {section.title && (
                    <h2 className="text-3xl font-bold mb-6">{section.title}</h2>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </div>
              </section>
            )

          case 'sections.cta-banner':
            const ctaBgImage = getImageUrl(section.backgroundImage)
            return (
              <section
                key={index}
                className="relative py-16 overflow-hidden"
                style={{ backgroundColor: section.backgroundColor }}
              >
                {ctaBgImage && (
                  <div className="absolute inset-0 opacity-30">
                    <Image
                      src={ctaBgImage}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="container mx-auto px-4 relative z-10">
                  <div className="max-w-3xl mx-auto text-center text-white space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="text-lg opacity-90">{section.description}</p>
                    )}
                    <div className="pt-4">
                      <Link
                        href={section.ctaLink}
                        className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {section.ctaText}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )

          case 'sections.image-text':
            const imageUrl = getImageUrl(section.image)
            return (
              <section key={index} className="container mx-auto px-4">
                <div
                  className={cn(
                    'grid md:grid-cols-2 gap-8 items-center',
                    section.imagePosition === 'right' && 'md:grid-flow-col-dense'
                  )}
                >
                  <div
                    className={cn(
                      section.imagePosition === 'right' && 'md:col-start-2'
                    )}
                  >
                    {section.title && (
                      <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
                    )}
                    {section.content && (
                      <div
                        className="prose prose-lg"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    )}
                    {section.ctaText && section.ctaLink && (
                      <div className="mt-6">
                        <Link
                          href={section.ctaLink}
                          className="inline-flex items-center justify-center px-6 py-3 bg-circleTel-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          {section.ctaText}
                        </Link>
                      </div>
                    )}
                  </div>
                  {imageUrl && (
                    <div
                      className={cn(
                        'relative h-64 md:h-96',
                        section.imagePosition === 'right' && 'md:col-start-1'
                      )}
                    >
                      <Image
                        src={imageUrl}
                        alt={section.title || ''}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </section>
            )

          default:
            return null
        }
      })}
    </div>
  )
}