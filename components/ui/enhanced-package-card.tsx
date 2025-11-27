'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EnhancedPackageCardProps {
  // Pricing
  promoPrice: number;
  originalPrice?: number;
  currency?: string;
  period?: string;
  promoDescription?: string; // e.g., "first 2 months"

  // Package details
  name?: string;
  type?: 'uncapped' | 'capped';
  dataLimit?: string;
  downloadSpeed?: number;
  uploadSpeed?: number;
  speedUnit?: string;

  // Promotional
  promoBadge?: string; // e.g., "2-MONTH PROMO"
  savingsAmount?: number;
  recommended?: boolean;
  badgeColor?: 'pink' | 'orange' | 'yellow' | 'blue'; // Color variation for promo badge

  // Provider
  providerName?: string;
  providerLogo?: string;

  // Benefits
  benefits?: string[];

  // Styling & Interaction
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  onOrderClick?: () => void;
}

/**
 * EnhancedPackageCard Component
 *
 * Enhanced package card with promotional badges and improved design.
 * Based on WebAfrica's card pattern with CircleTel branding.
 *
 * Features:
 * - Promotional badges (2-MONTH PROMO, SAVE UP TO RX)
 * - Speed indicators with icons (download/upload)
 * - Recommended tag
 * - Benefits list with checkmarks
 * - Hover effects and selected state
 * - Provider branding support
 *
 * @example
 * ```tsx
 * <EnhancedPackageCard
 *   promoPrice={459}
 *   originalPrice={589}
 *   promoBadge="2-MONTH PROMO"
 *   promoDescription="first 2 months"
 *   downloadSpeed={25}
 *   uploadSpeed={25}
 *   type="uncapped"
 *   recommended
 *   benefits={["Free setup worth R1699", "Free router included"]}
 *   onOrderClick={() => console.log('Order clicked')}
 * />
 * ```
 */
export function EnhancedPackageCard({
  promoPrice,
  originalPrice,
  currency = 'R',
  period = 'pm',
  promoDescription,
  name,
  type = 'uncapped',
  badgeColor = 'pink',
  dataLimit,
  downloadSpeed,
  uploadSpeed,
  speedUnit = 'Mbps',
  promoBadge,
  savingsAmount,
  recommended,
  providerName,
  providerLogo,
  benefits,
  className,
  onClick,
  selected = false,
  onOrderClick,
}: EnhancedPackageCardProps) {
  const hasPromo = promoBadge || savingsAmount;

  return (
    <div
      className={cn(
        'relative bg-white rounded-lg shadow-md overflow-hidden',
        'transition-all duration-200',
        'hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        selected && 'ring-4 ring-circleTel-orange shadow-xl',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Recommended Badge (Top, Above Card) */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white text-xs font-bold py-1 px-4 rounded-full uppercase shadow-md">
            Recommended
          </div>
        </div>
      )}

      {/* Promotional Badge (Top of Card) */}
      {hasPromo && (
        <div className={cn(
          'text-white text-xs font-bold py-2 px-3 text-center uppercase tracking-wide',
          badgeColor === 'pink' && 'bg-gradient-to-r from-pink-600 to-pink-500',
          badgeColor === 'orange' && 'bg-gradient-to-r from-orange-600 to-orange-500',
          badgeColor === 'yellow' && 'bg-gradient-to-r from-yellow-600 to-yellow-500',
          badgeColor === 'blue' && 'bg-gradient-to-r from-sky-600 to-sky-500'
        )}>
          {promoBadge || `SAVE UP TO ${currency}${savingsAmount}`}
        </div>
      )}

      {/* Card Content */}
      <div className={cn('p-6', hasPromo && 'pt-4')}>
        {/* Provider Logo (if provided) */}
        {providerLogo && (
          <div className="mb-3">
            <img
              src={providerLogo}
              alt={providerName || 'Provider'}
              className="h-10 object-contain"
            />
          </div>
        )}

        {/* Package Name (if provided) */}
        {name && (
          <div className="text-lg font-semibold text-circleTel-darkNeutral mb-2">
            {name}
          </div>
        )}

        {/* Package Type */}
        <div className="text-sm font-semibold text-circleTel-darkNeutral mb-3 capitalize">
          {type}
        </div>

        {/* Pricing */}
        <div className="mb-4">
          {originalPrice && originalPrice !== promoPrice && (
            <div className="text-sm text-gray-500 line-through mb-1">
              {currency}{originalPrice.toLocaleString()}{period}
            </div>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-circleTel-darkNeutral">
              {currency}{promoPrice.toLocaleString()}
            </span>
            <span className="text-lg text-circleTel-secondaryNeutral">
              {period}
            </span>
          </div>
        </div>

        {/* Speed Indicators or Data Limit */}
        {dataLimit ? (
          // Capped plan - show data limit
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-full text-lg">
              {dataLimit}
            </div>
          </div>
        ) : downloadSpeed !== undefined && uploadSpeed !== undefined ? (
          // Uncapped plan - show speeds
          <div className="flex gap-4 items-center justify-center mb-4">
            <SpeedIndicator
              direction="download"
              speed={downloadSpeed}
              unit={speedUnit}
            />
            <SpeedIndicator
              direction="upload"
              speed={uploadSpeed}
              unit={speedUnit}
            />
          </div>
        ) : null}

        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="text-pink-600 font-semibold text-sm mb-2">
              What you get for free:
            </div>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-circleTel-secondaryNeutral">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Order Button (if onOrderClick provided) */}
        {onOrderClick && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onOrderClick();
            }}
            className="w-full mt-4 bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Order Now
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * SpeedIndicator Component
 *
 * Displays download or upload speed with icon.
 * Uses lucide-react icons for modern appearance.
 */
interface SpeedIndicatorProps {
  direction: 'download' | 'upload';
  speed: number;
  unit?: string;
  className?: string;
}

function SpeedIndicator({
  direction,
  speed,
  unit = 'Mbps',
  className,
}: SpeedIndicatorProps) {
  const Icon = direction === 'download' ? ArrowDown : ArrowUp;
  const label = direction === 'download' ? 'Download' : 'Upload';

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      title={`${label} speed: ${speed}${unit}`}
      aria-label={`${label} speed: ${speed} ${unit}`}
    >
      <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
      <span className="font-semibold text-circleTel-darkNeutral">
        {speed}{unit}
      </span>
    </div>
  );
}

/**
 * CompactEnhancedPackageCard Component
 *
 * Smaller version for grid layouts with many packages.
 * Reduces padding and font sizes while maintaining functionality.
 */
export function CompactEnhancedPackageCard(props: EnhancedPackageCardProps) {
  return (
    <EnhancedPackageCard
      {...props}
      className={cn('scale-95', props.className)}
    />
  );
}
