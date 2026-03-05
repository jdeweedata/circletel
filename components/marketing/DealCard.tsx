'use client'
import { PiArrowRightBold, PiCheckBold, PiClockBold, PiCopyBold, PiTagBold, PiTimerBold } from 'react-icons/pi';

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type DealCategory = 'FIBRE' | 'LTE' | '5G' | 'VOIP' | 'BUSINESS'

export interface DealCardProps {
  id: string
  category: DealCategory | null
  title: string
  description: string | null
  originalPrice?: number
  discountedPrice?: number
  discountType: 'percentage' | 'fixed' | 'free_installation' | 'free_month'
  discountValue: number
  promoCode?: string | null
  validUntil?: string | null
  imageUrl?: string | null
  ctaLink?: string
}

// Category color mapping
const categoryColors: Record<DealCategory, { bg: string; text: string; badge: string }> = {
  FIBRE: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-600' },
  LTE: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-600' },
  '5G': { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-600' },
  VOIP: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-600' },
  BUSINESS: { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-600' }
}

const defaultCategoryColors = { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-600' }

/**
 * Format discount display text
 */
function formatDiscount(type: string, value: number): string {
  switch (type) {
    case 'percentage':
      return `${value}% OFF`
    case 'fixed':
      return `R${value} OFF`
    case 'free_installation':
      return 'FREE INSTALL'
    case 'free_month':
      return `${value} MONTH${value > 1 ? 'S' : ''} FREE`
    default:
      return 'SPECIAL OFFER'
  }
}

/**
 * Format remaining time
 */
function formatTimeRemaining(validUntil: string): string | null {
  const end = new Date(validUntil).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 7) return null // Don't show countdown if more than a week
  if (days > 0) return `${days}d ${hours}h left`
  return `${hours}h left`
}

/**
 * DealCard Component
 *
 * Individual deal card for the homepage grid.
 * Features:
 * - Category badge with color coding
 * - Discount ribbon (corner badge)
 * - Price display with strikethrough
 * - Promo code with copy functionality
 * - Countdown timer for time-sensitive offers
 * - Hover lift effect
 */
export function DealCard({
  id,
  category,
  title,
  description,
  originalPrice,
  discountedPrice,
  discountType,
  discountValue,
  promoCode,
  validUntil,
  imageUrl,
  ctaLink = '/'
}: DealCardProps) {
  const [copied, setCopied] = useState(false)

  const colors = category ? categoryColors[category] : defaultCategoryColors
  const discountText = formatDiscount(discountType, discountValue)
  const timeRemaining = validUntil ? formatTimeRemaining(validUntil) : null

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!promoCode) return

    try {
      await navigator.clipboard.writeText(promoCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = promoCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Link
      href={ctaLink}
      className="
        group relative block bg-white rounded-xl overflow-hidden
        border border-gray-100 shadow-sm
        transition-all duration-300 ease-out
        hover:shadow-lg hover:-translate-y-1 hover:border-gray-200
        focus:outline-none focus:ring-2 focus:ring-[#F5841E] focus:ring-offset-2
      "
    >
      {/* Discount Ribbon */}
      <div
        className={`
          absolute top-3 -right-8 z-10 px-10 py-1
          text-xs font-bold text-white transform rotate-45
          ${colors.badge}
        `}
      >
        {discountText}
      </div>

      {/* Image Section */}
      <div className={`relative h-32 ${colors.bg}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-4xl font-bold ${colors.text} opacity-30`}>
              {category || 'DEAL'}
            </div>
          </div>
        )}

        {/* Category Badge */}
        {category && (
          <span
            className={`
              absolute top-3 left-3 px-2 py-1 rounded-full
              text-xs font-semibold ${colors.badge} text-white
            `}
          >
            {category}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 mb-1">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Price Display */}
        {(originalPrice || discountedPrice) && (
          <div className="flex items-baseline gap-2 mb-3">
            {discountedPrice && (
              <span className="text-lg font-bold text-[#F5841E]">
                R{discountedPrice.toLocaleString()}
              </span>
            )}
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                R{originalPrice.toLocaleString()}
              </span>
            )}
            {!discountedPrice && !originalPrice && (
              <span className="text-lg font-bold text-[#F5841E]">
                Special Offer
              </span>
            )}
          </div>
        )}

        {/* Promo Code */}
        {promoCode && (
          <button
            onClick={handleCopyCode}
            className="
              flex items-center gap-2 w-full px-3 py-2 mb-3
              bg-gray-50 border border-dashed border-gray-300 rounded-lg
              text-sm font-mono transition-colors
              hover:bg-gray-100 hover:border-gray-400
            "
          >
            <PiTagBold className="w-4 h-4 text-gray-500" />
            <span className="flex-1 text-left text-gray-700">{promoCode}</span>
            {copied ? (
              <PiCheckBold className="w-4 h-4 text-green-600" />
            ) : (
              <PiCopyBold className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* Footer: PiTimerBold + CTA */}
        <div className="flex items-center justify-between">
          {/* Countdown Timer */}
          {timeRemaining ? (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <PiClockBold className="w-3.5 h-3.5" />
              <span>{timeRemaining}</span>
            </div>
          ) : (
            <div /> // Spacer
          )}

          {/* CTA */}
          <span
            className="
              inline-flex items-center gap-1 text-sm font-medium
              text-[#F5841E] group-hover:underline
            "
          >
            View Deal
            <PiArrowRightBold className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default DealCard
