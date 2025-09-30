'use client'

import { useState } from 'react'
import { PromotionCard } from './PromotionCard'
import type { Promotion } from '@/lib/types/strapi'
import { cn } from '@/lib/utils'

interface PromotionGridProps {
  promotions: Promotion[]
  columns?: number
  showFilter?: boolean
  className?: string
}

const categoryLabels: Record<string, string> = {
  all: 'All deals',
  fibre: 'Fibre',
  wireless: 'Wireless',
  voip: 'VoIP',
  hosting: 'Hosting',
  devices: 'Devices',
  mobile: 'Mobile',
  other: 'Other',
}

export function PromotionGrid({
  promotions,
  columns = 3,
  showFilter = true,
  className,
}: PromotionGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories from promotions
  const categories = ['all', ...new Set(promotions.map(p => p.category))]

  // Filter promotions by selected category
  const filteredPromotions =
    selectedCategory === 'all'
      ? promotions
      : promotions.filter(p => p.category === selectedCategory)

  return (
    <div className={cn('space-y-8', className)}>
      {/* Category Filter */}
      {showFilter && categories.length > 2 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-circleTel-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {categoryLabels[category] || category}
            </button>
          ))}
        </div>
      )}

      {/* Promotions Grid */}
      {filteredPromotions.length > 0 ? (
        <div
          className={cn(
            'grid gap-6',
            columns === 2 && 'md:grid-cols-2',
            columns === 3 && 'md:grid-cols-2 lg:grid-cols-3',
            columns === 4 && 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          )}
        >
          {filteredPromotions.map(promotion => (
            <PromotionCard key={promotion.id} promotion={promotion} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No promotions available in this category.
        </div>
      )}
    </div>
  )
}