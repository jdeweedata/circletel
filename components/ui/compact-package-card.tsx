'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { ProviderLogo } from '@/components/products/ProviderLogo';

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

  // Provider information
  provider?: {
    code: string;
    name: string;
    logo_url: string;
    logo_dark_url?: string;
    logo_light_url?: string;
    logo_format?: string;
    logo_aspect_ratio?: number;
  };

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
 * Color Improvements (2025-10-24):
 * - Uses brand orange (#F5831F) with subtle gradient
 * - Enhanced contrast for better accessibility
 * - Professional shadow instead of visible border
 * - Logo background for better visibility
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
  provider,
  onClick,
  selected = false,
  className,
}: CompactPackageCardProps) {
  const hasPromo = !!promoBadge;

  return (
    <div
      className={cn(
        // Base styles with bigger dimensions
        'relative w-[180px] xl:w-[220px] h-[160px] xl:h-[170px]',
        'flex flex-col rounded-2xl cursor-pointer',
        'transition-all duration-200',

        // Selected state: dark blue background with white text
        selected && [
          'bg-webafrica-blue text-white',
          'border-2 border-webafrica-blue',
          'shadow-md shadow-webafrica-blue/20'
        ],

        // Unselected state: brand orange with professional gradient and shadow
        !selected && [
          // Use brand orange with a subtle darker gradient for depth
          'bg-gradient-to-br from-[#F5831F] via-[#F5831F] to-[#e67516]',
          'text-white',
          // Professional shadow for depth (no visible border)
          'shadow-lg shadow-orange-500/25',
          'border border-orange-500/30'
        ],

        // Hover effect
        'hover:shadow-xl hover:scale-105',
        selected && 'hover:shadow-webafrica-blue/30',
        !selected && 'hover:shadow-orange-500/40',

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
      aria-label={`${name || 'Package'} - ${currency}${promoPrice}${period}${provider ? ` by ${provider.name}` : ''}`}
    >
      {/* Provider Logo (Top of Card) */}
      {provider && (
        <div className="flex justify-center pt-2 pb-1 px-2">
          {/* Subtle background for logo visibility */}
          <div className={cn(
            'rounded-lg px-2 py-1 backdrop-blur-sm',
            selected
              ? 'bg-white/10'
              : 'bg-white/15'
          )}>
            <ProviderLogo
              providerCode={provider.code}
              providerName={provider.name}
              logoUrl={provider.logo_url}
              logoDarkUrl={provider.logo_dark_url}
              logoLightUrl={provider.logo_light_url}
              logoFormat={(provider.logo_format as 'svg' | 'png' | 'jpg') || 'svg'}
              variant="grayscale"
              size="small"
              priority={false}
            />
          </div>
        </div>
      )}

      {/* Promotional Badge */}
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
          'text-white'
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
            'text-white drop-shadow-sm'
          )}>
            {currency}{promoPrice.toLocaleString()}{period}
          </div>

          {/* Original Price (Small, Strikethrough) */}
          {originalPrice && originalPrice !== promoPrice && (
            <div className={cn(
              'flex-col w-full text-center md:text-left text-xs block order-1 md:order-2 line-through',
              // Enhanced contrast for strikethrough price
              selected
                ? 'text-blue-200 drop-shadow-sm'
                : 'text-white/85 drop-shadow-sm'
            )}>
              {currency}{originalPrice.toLocaleString()}{period}
            </div>
          )}
        </div>

        {/* Speed Indicators */}
        {downloadSpeed !== undefined && uploadSpeed !== undefined && (
          <div className={cn(
            'w-full text-center md:text-left px-3 mt-3',
            'text-white'
          )}>
            <div className="flex gap-3 items-center justify-center md:justify-start">
              {/* Download Speed */}
              <div className="flex items-center gap-1" title={`Download: ${downloadSpeed}${speedUnit}`}>
                <ArrowDown className="w-3 h-3 drop-shadow-sm" aria-hidden="true" />
                <span className="text-xs font-semibold drop-shadow-sm">{downloadSpeed}{speedUnit}</span>
              </div>

              {/* Upload Speed */}
              <div className="flex items-center gap-1" title={`Upload: ${uploadSpeed}${speedUnit}`}>
                <ArrowUp className="w-3 h-3 drop-shadow-sm" aria-hidden="true" />
                <span className="text-xs font-semibold drop-shadow-sm">{uploadSpeed}{speedUnit}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
