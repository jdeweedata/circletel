'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

export interface CompactPackageCardProps {
  // Pricing
  promoPrice: number;
  originalPrice?: number;
  currency?: string;
  period?: string;

  // Package details
  name?: string;
  type?: 'uncapped' | 'capped';
  downloadSpeed?: number;
  uploadSpeed?: number;
  speedUnit?: string;

  // Promotional
  promoBadge?: string; // e.g., "2-MONTH PROMO"
  badgeColor?: 'pink' | 'orange' | 'yellow' | 'blue';

  // Interaction
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

/**
 * CompactPackageCard Component
 *
 * Small, clickable package card inspired by WebAfrica's design.
 * Designed for grid layouts with 6-8 visible cards.
 *
 * Features:
 * - Fixed compact dimensions (141px × 135px mobile, 188px × 140px desktop)
 * - Selected state with dark blue background
 * - Promo badge at top
 * - Minimal content: price + speed indicators
 * - Click to view full details in sidebar
 *
 * @example
 * ```tsx
 * <CompactPackageCard
 *   promoPrice={459}
 *   originalPrice={589}
 *   promoBadge="2-MONTH PROMO"
 *   downloadSpeed={25}
 *   uploadSpeed={25}
 *   selected={isSelected}
 *   onClick={() => handleSelect(package)}
 * />
 * ```
 */
export function CompactPackageCard({
  promoPrice,
  originalPrice,
  currency = 'R',
  period = 'pm',
  name,
  type = 'uncapped',
  downloadSpeed,
  uploadSpeed,
  speedUnit = 'Mbps',
  promoBadge,
  badgeColor = 'pink',
  onClick,
  selected = false,
  className,
}: CompactPackageCardProps) {
  const hasPromo = !!promoBadge;

  return (
    <div
      className={cn(
        // Base styles with fixed dimensions (WebAfrica pattern)
        'relative w-[141px] xl:w-[188px] h-[135px] xl:h-[140px]',
        'flex flex-col rounded-2xl cursor-pointer',
        'transition-all duration-200',

        // Selected state: dark blue background with white text
        selected && 'bg-[#1E4B85] text-white',

        // Unselected state: light blue background
        !selected && 'bg-[#E6F2FE]',

        // Hover effect
        'hover:shadow-lg hover:scale-105',

        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      aria-label={`${name || 'Package'} - ${currency}${promoPrice}${period}`}
    >
      {/* Promotional Badge (Top of Card) */}
      {hasPromo && (
        <div
          className={cn(
            'flex h-[20px] md:h-[22px] pt-1 md:pt-[6px] md:py-1 px-2 md:px-3',
            'justify-center rounded-t-2xl',
            'text-center text-white align-center items-center',
            'text-[10px] md:text-xs uppercase font-bold tracking-wide',
            // Badge color variations
            badgeColor === 'pink' && 'bg-primary-900',
            badgeColor === 'orange' && 'bg-gradient-to-r from-orange-600 to-orange-500',
            badgeColor === 'yellow' && 'bg-gradient-to-r from-yellow-600 to-yellow-500',
            badgeColor === 'blue' && 'bg-gradient-to-r from-sky-600 to-sky-500'
          )}
        >
          {promoBadge}
        </div>
      )}

      {/* Package Type Label */}
      <div className="h-5 pt-2 px-4">
        <div className={cn(
          'flex w-full flex-col text-center md:text-left text-[10px] md:text-xs font-semibold gap-1 capitalize',
          selected ? 'text-white' : 'text-gray-700'
        )}>
          {type}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="flex flex-col px-3 pt-2">
        <div className="flex md:flex-row flex-wrap flex-col-reverse items-center">
          {/* Promotional Price (Large) */}
          <div className={cn(
            'flex-col w-full text-center md:text-left text-xl xl:text-2xl font-bold block order-2 md:order-1',
            selected ? 'text-white' : 'text-[#1E4B85]'
          )}>
            {currency}{promoPrice.toLocaleString()}{period}
          </div>

          {/* Original Price (Small, Strikethrough) */}
          {originalPrice && originalPrice !== promoPrice && (
            <div className={cn(
              'flex-col w-full text-center md:text-left text-xs block order-1 md:order-2 line-through',
              selected ? 'text-blue-200' : 'text-gray-500'
            )}>
              {currency}{originalPrice.toLocaleString()}{period}
            </div>
          )}
        </div>

        {/* Speed Indicators */}
        {downloadSpeed !== undefined && uploadSpeed !== undefined && (
          <div className={cn(
            'w-full text-center md:text-left px-3 mt-3',
            selected ? 'text-white' : 'text-[#1E4B85]'
          )}>
            <div className="flex gap-3 items-center justify-center md:justify-start">
              {/* Download Speed */}
              <div className="flex items-center gap-1" title={`Download: ${downloadSpeed}${speedUnit}`}>
                <ArrowDown className="w-3 h-3" aria-hidden="true" />
                <span className="text-xs font-semibold">{downloadSpeed}{speedUnit}</span>
              </div>

              {/* Upload Speed */}
              <div className="flex items-center gap-1" title={`Upload: ${uploadSpeed}${speedUnit}`}>
                <ArrowUp className="w-3 h-3" aria-hidden="true" />
                <span className="text-xs font-semibold">{uploadSpeed}{speedUnit}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
