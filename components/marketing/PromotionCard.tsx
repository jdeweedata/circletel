'use client'

import { cn } from '@/lib/utils'
import type { Promotion, StrapiMedia } from '@/lib/types/strapi'
import Image from 'next/image'
import Link from 'next/link'

interface PromotionCardProps {
  promotion: Promotion
  className?: string
}

function getImageUrl(media?: StrapiMedia): string | null {
  if (!media) return null
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
  return media.url.startsWith('http') ? media.url : `${strapiUrl}${media.url}`
}

export function PromotionCard({ promotion, className }: PromotionCardProps) {
  const featuredImageUrl = getImageUrl(promotion.featuredImage)
  const hasDiscount = promotion.originalPrice && promotion.price && promotion.originalPrice > promotion.price

  return (
    <Link
      href={promotion.ctaLink || '#'}
      className={cn(
        'group relative overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-2xl block',
        'bg-white',
        className
      )}
    >
      <div
        className="relative min-h-[320px] p-8 flex flex-col justify-between"
        style={{
          backgroundColor: promotion.backgroundColor,
          color: promotion.textColor,
        }}
      >
        {/* Badge */}
        {promotion.badge && (
          <div className="absolute top-6 right-6 z-20">
            <span className="inline-block px-4 py-1.5 text-[10px] font-bold uppercase rounded-full bg-pink-500 text-white shadow-lg">
              {promotion.badge}
            </span>
          </div>
        )}

        {/* Decorative Patterns - Afrihost Style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Diagonal lines pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                currentColor,
                currentColor 2px,
                transparent 2px,
                transparent 6px
              )`
            }}></div>
          </div>

          {/* Dots pattern */}
          <div className="absolute top-10 right-10 w-24 h-24 opacity-20">
            <div className="grid grid-cols-8 gap-1.5">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-current" />
              ))}
            </div>
          </div>

          {/* Curved shape bottom left */}
          <svg className="absolute bottom-0 left-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
            <path d="M0,100 Q50,50 100,100 L0,100 Z" fill="currentColor"/>
          </svg>

          {/* Abstract circles */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-5">
            <div className="absolute inset-0 rounded-full border-8 border-current"></div>
            <div className="absolute inset-8 rounded-full border-8 border-current"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1">
          {/* Featured Image */}
          {featuredImageUrl && (
            <div className="relative w-full h-32 mb-6">
              <Image
                src={featuredImageUrl}
                alt={promotion.title}
                fill
                className="object-contain object-right"
              />
            </div>
          )}

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
            {promotion.title}
          </h3>

          {/* Short Description */}
          <p className="text-sm md:text-base opacity-90 mb-6">
            {promotion.shortDescription}
          </p>

          {/* Pricing */}
          {promotion.price !== null && promotion.price !== undefined && (
            <div className="mb-6">
              {hasDiscount && (
                <div className="text-base line-through opacity-70 mb-1">
                  {promotion.currency}{promotion.originalPrice?.toFixed(2)}
                </div>
              )}
              <div className="text-4xl font-bold">
                {promotion.currency} {promotion.price.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* CTA Button - Afrihost Style */}
        <div className="relative z-10 flex items-center justify-center mt-6">
          <div className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold text-sm shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
            <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span>{promotion.ctaText}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}