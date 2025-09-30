'use client'

import { cn } from '@/lib/utils'
import type { HeroSection, StrapiMedia } from '@/lib/types/strapi'
import Image from 'next/image'
import Link from 'next/link'

interface MarketingHeroProps {
  hero: HeroSection
  className?: string
}

function getImageUrl(media?: StrapiMedia): string | null {
  if (!media) return null
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
  return media.url.startsWith('http') ? media.url : `${strapiUrl}${media.url}`
}

export function MarketingHero({ hero, className }: MarketingHeroProps) {
  const backgroundImageUrl = getImageUrl(hero.backgroundImage)

  return (
    <section
      className={cn('relative py-20 md:py-32 overflow-hidden', className)}
      style={{
        backgroundColor: hero.backgroundColor,
        color: hero.textColor,
      }}
    >
      {/* Background Image */}
      {backgroundImageUrl && (
        <div className="absolute inset-0 opacity-30">
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Decorative Pattern */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
        <div className="absolute top-20 right-10 w-32 h-32 grid grid-cols-8 gap-1">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-current" />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {hero.title}
          </h1>

          {/* Subtitle */}
          {hero.subtitle && (
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              {hero.subtitle}
            </p>
          )}

          {/* CTA Button */}
          {hero.ctaText && hero.ctaLink && (
            <div className="pt-4">
              <Link
                href={hero.ctaLink}
                className={cn(
                  'inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-lg transition-all',
                  'bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl'
                )}
              >
                {hero.ctaText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}