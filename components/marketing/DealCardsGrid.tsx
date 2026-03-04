'use client'
import { PiSparkleBold, PiSpinnerBold } from 'react-icons/pi';

import React, { useState, useEffect } from 'react'
import { DealCard, DealCategory } from './DealCard'

export interface Promotion {
  id: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_installation' | 'free_month'
  discount_value: number
  promo_code: string | null
  valid_until: string | null
  image_url: string | null
  banner_image_url: string | null
  category: DealCategory | null
  product_category: string | null
}

interface DealCardsGridProps {
  promotions?: Promotion[]
  maxCards?: number
  title?: string
  showTitle?: boolean
}

/**
 * DealCardsGrid Component
 *
 * Responsive grid of deal cards for homepage display.
 * Fetches promotions from /api/promotions/active if not provided.
 *
 * Layout:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 4 columns (or 3 if fewer cards)
 */
export function DealCardsGrid({
  promotions: initialPromotions,
  maxCards = 4,
  title = "Hot Deals",
  showTitle = true
}: DealCardsGridProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions || [])
  const [loading, setLoading] = useState(!initialPromotions)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip fetch if promotions were provided
    if (initialPromotions) {
      setPromotions(initialPromotions)
      setLoading(false)
      return
    }

    async function fetchPromotions() {
      try {
        const res = await fetch('/api/promotions/active')

        if (!res.ok) {
          throw new Error('Failed to fetch promotions')
        }

        const data = await res.json()
        setPromotions(data.promotions || [])
      } catch (err) {
        console.error('[DealCardsGrid] Fetch error:', err)
        setError('Unable to load deals')
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [initialPromotions])

  // Don't render section if no promotions
  if (!loading && promotions.length === 0) {
    return null
  }

  // Determine CTA link based on category
  const getCtaLink = (promotion: Promotion): string => {
    const category = promotion.category?.toLowerCase() || promotion.product_category?.toLowerCase()

    switch (category) {
      case 'fibre':
        return '/#coverage-check?type=fibre'
      case 'lte':
      case '5g':
        return '/#coverage-check?type=wireless'
      case 'voip':
        return '/packages/voip'
      case 'business':
        return '/business'
      default:
        return '/#coverage-check'
    }
  }

  const displayedPromotions = promotions.slice(0, maxCards)

  // Grid columns based on number of cards
  const gridCols = displayedPromotions.length >= 4
    ? 'md:grid-cols-2 lg:grid-cols-4'
    : displayedPromotions.length === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-2'

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        {showTitle && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <PiSparkleBold className="w-5 h-5 text-[#F5841E]" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {title}
            </h2>
            <PiSparkleBold className="w-5 h-5 text-[#F5841E]" />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <PiSpinnerBold className="w-8 h-8 text-[#F5841E] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-gray-500 py-8">
            {error}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && displayedPromotions.length > 0 && (
          <div className={`grid grid-cols-1 ${gridCols} gap-4 sm:gap-6`}>
            {displayedPromotions.map((promotion) => (
              <DealCard
                key={promotion.id}
                id={promotion.id}
                category={promotion.category}
                title={promotion.name}
                description={promotion.description}
                discountType={promotion.discount_type}
                discountValue={promotion.discount_value}
                promoCode={promotion.promo_code}
                validUntil={promotion.valid_until}
                imageUrl={promotion.image_url || promotion.banner_image_url}
                ctaLink={getCtaLink(promotion)}
              />
            ))}
          </div>
        )}

        {/* View All Link (if more promotions exist) */}
        {!loading && promotions.length > maxCards && (
          <div className="text-center mt-8">
            <a
              href="/promotions"
              className="
                inline-flex items-center gap-2 px-6 py-3
                text-[#F5841E] font-semibold
                border-2 border-[#F5841E] rounded-full
                transition-colors hover:bg-[#F5841E] hover:text-white
              "
            >
              View All Deals
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

export default DealCardsGrid
