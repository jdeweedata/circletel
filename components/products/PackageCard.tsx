'use client'

import { PackageTier } from '@/lib/types/strapi'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

interface PackageCardProps {
  tier: PackageTier
  showBadge?: boolean
  compact?: boolean
}

export function PackageCard({ tier, showBadge = true, compact = false }: PackageCardProps) {
  const isHighlighted = tier.highlighted

  return (
    <div
      className={`
        relative flex flex-col rounded-lg overflow-hidden transition-all duration-300
        ${isHighlighted
          ? 'border-2 border-circleTel-orange shadow-xl scale-105 bg-white'
          : 'border border-gray-200 shadow-md hover:shadow-lg bg-white'
        }
        ${compact ? 'p-4' : 'p-6'}
      `}
    >
      {/* Badge */}
      {showBadge && tier.badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span className="inline-block px-4 py-1 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-full shadow-md">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Tier Name */}
      <div className={`${showBadge && tier.badge ? 'mt-2' : ''}`}>
        <h3 className={`font-bold text-circleTel-darkNeutral ${compact ? 'text-lg' : 'text-2xl'}`}>
          {tier.name}
        </h3>
        {tier.description && (
          <p className="text-sm text-circleTel-secondaryNeutral mt-1">{tier.description}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          {tier.originalPrice && tier.originalPrice > tier.price && (
            <span className="text-lg text-gray-400 line-through">
              {tier.currency}{tier.originalPrice.toFixed(2)}
            </span>
          )}
          <span className={`font-bold text-circleTel-darkNeutral ${compact ? 'text-3xl' : 'text-4xl'}`}>
            {tier.currency}{tier.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-circleTel-secondaryNeutral mt-1">
          {getBillingCycleText(tier.billingCycle)}
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 mt-6">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-circleTel-darkNeutral">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="mt-6">
        {tier.ctaLink ? (
          <Link href={tier.ctaLink} className="block">
            <Button
              className={`w-full ${
                isHighlighted
                  ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                  : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
              }`}
              size={compact ? 'default' : 'lg'}
            >
              {tier.ctaText}
            </Button>
          </Link>
        ) : (
          <Button
            className={`w-full ${
              isHighlighted
                ? 'bg-circleTel-orange hover:bg-orange-600 text-white'
                : 'bg-circleTel-darkNeutral hover:bg-gray-800 text-white'
            }`}
            size={compact ? 'default' : 'lg'}
          >
            {tier.ctaText}
          </Button>
        )}
      </div>

      {/* Highlight Border Effect */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-circleTel-orange/5 to-transparent pointer-events-none rounded-lg" />
      )}
    </div>
  )
}

function getBillingCycleText(cycle: string): string {
  const cycleMap: Record<string, string> = {
    once: 'One-time payment',
    daily: 'per day',
    weekly: 'per week',
    monthly: 'per month',
    yearly: 'per year',
  }
  return cycleMap[cycle] || cycle
}