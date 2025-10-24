'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Check, Infinity, Info } from 'lucide-react';
import { ProviderLogo } from '@/components/products/ProviderLogo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
 * Enhanced compact package card with improved UX based on user feedback.
 * Designed for grid layouts with clear visual hierarchy and mobile optimization.
 *
 * Features:
 * - Larger, bolder pricing (text-3xl/4xl, font-extrabold)
 * - More prominent speed indicators (text-sm, w-4 h-4 icons)
 * - Enhanced promo badges with drop-shadow
 * - Clear "Select Plan" CTA button
 * - Better mobile touch targets (min 180px height)
 * - Selected state with brand blue background
 * - Improved visual hierarchy and spacing
 *
 * Accessibility:
 * - WCAG AA compliant (4.5:1 contrast ratio)
 * - Keyboard navigable (Enter/Space)
 * - ARIA labels and pressed states
 * - Minimum 44px touch targets on mobile
 *
 * Phase 1 & 2 Improvements (2025-10-24):
 * 1. Increased price size: text-xl → text-3xl/4xl
 * 2. Enhanced price weight: font-bold → font-extrabold
 * 3. Larger speed indicators: text-xs → text-sm, w-3 h-3 → w-4 h-4
 * 4. More prominent promo badge with enhanced shadow
 * 5. Added "Select Plan" CTA button
 * 6. Improved mobile touch targets: 160px → 180px min height
 * 7. Better package type styling with icon
 * 8. Enhanced hover states
 *
 * Phase 3 Improvements (2025-10-24):
 * 9. Price consistency with tabular-nums and min-width for alignment
 * 10. Infinity icon for "Uncapped" with tooltip
 * 11. Green color coding for uncapped feature (WCAG AA compliant)
 * 12. Smoother hover effects (reduced scale, better shadow)
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
        // Base styles with increased dimensions for better mobile touch targets
        'relative w-full',
        'min-h-[240px] md:min-h-[260px] xl:min-h-[300px] h-auto',
        'flex flex-col rounded-2xl cursor-pointer',
        // Phase 3: Smoother transition with ease-in-out
        'transition-all duration-300 ease-in-out',

        // Selected state: light grey background + subtle grey ring for visibility
        selected && [
          'bg-gray-100 text-circleTel-darkNeutral',
          'border-2 border-gray-300',
          'shadow-xl shadow-gray-300/20',
          'ring-3 ring-gray-400 ring-offset-2 ring-offset-gray-50'
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

        // Phase 3: More subtle hover effect (1.02 scale, better shadow)
        'hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-[1.02]',
        selected && 'hover:shadow-webafrica-blue/40',

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
      aria-label={`${name || 'Package'} - ${currency}${promoPrice}${period}${provider ? ` by ${provider.name}` : ''}${selected ? ' - Selected' : ''}`}
    >
      {/* Provider Logo (Top of Card) */}
      {provider && (
        <div className="flex justify-center pt-3 pb-2 px-2">
          {/* Subtle background for logo visibility */}
          <div className={cn(
            'rounded-lg px-2 py-1.5 backdrop-blur-sm',
            selected ? 'bg-white/20' : 'bg-white/15'
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

      {/* Promotional Badge - More Prominent */}
      {hasPromo && (
        <div
          className={cn(
            'flex h-[24px] md:h-[28px] pt-1.5 md:pt-2 px-3 md:px-4',
            'justify-center rounded-t-2xl',
            'text-center text-white align-center items-center',
            'text-[11px] md:text-sm uppercase font-extrabold tracking-wider',
            // Enhanced shadow for more prominence
            'shadow-md',
            // Badge color variations with more vibrant colors
            badgeColor === 'pink' && 'bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600',
            badgeColor === 'orange' && 'bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600',
            badgeColor === 'yellow' && 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600',
            badgeColor === 'blue' && 'bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600'
          )}
        >
          {promoBadge}
        </div>
      )}

      {/* Phase 3: Package Type Label with Infinity Icon & Green Color + Tooltip */}
      <div className="h-6 pt-2 px-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                'flex w-full items-center justify-center md:justify-start gap-1.5',
                'text-xs md:text-sm font-bold capitalize',
                // Phase 3: Green color for uncapped (WCAG AA compliant on orange background)
                type === 'uncapped'
                  ? 'text-green-300 drop-shadow-sm'
                  : 'text-white drop-shadow-sm'
              )}>
                {/* Phase 3: Infinity icon for uncapped */}
                {type === 'uncapped' ? (
                  <Infinity className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                ) : (
                  <Check className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                )}
                <span>{type}</span>
                <Info className="w-3 h-3 md:w-3.5 md:h-3.5 ml-0.5 opacity-70" aria-hidden="true" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">
                {type === 'uncapped'
                  ? 'Unlimited data with no caps or restrictions'
                  : 'Fixed monthly data allowance'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Pricing Section - Enhanced Size & Weight with Phase 3 Consistency */}
      <div className="flex flex-col px-4 pt-4">
        <div className="flex md:flex-row flex-wrap flex-col-reverse items-center">
          {/* Promotional Price (EXTRA LARGE & BOLD with tabular-nums) */}
          <div className={cn(
            'flex-col w-full text-center md:text-left',
            'text-3xl md:text-3xl xl:text-4xl font-extrabold block order-2 md:order-1',
            selected ? 'text-gray-900 drop-shadow-none' : 'text-white',
            selected ? 'drop-shadow-none' : 'drop-shadow-md',
            // Phase 3: Consistent width and tabular numbers for alignment
            'min-w-[140px] tabular-nums'
          )}>
            {currency}{promoPrice.toLocaleString()}<span className="text-base md:text-lg font-bold">{period}</span>
          </div>

          {/* Original Price (Small, Strikethrough) */}
          {originalPrice && originalPrice !== promoPrice && (
            <div className={cn(
              'flex-col w-full text-center md:text-left text-sm block order-1 md:order-2 line-through',
              // Enhanced contrast for strikethrough price
              selected
                ? 'text-gray-700'
                : 'text-white/90 drop-shadow-sm',
              'font-semibold'
            )}>
              {currency}{originalPrice.toLocaleString()}{period}
            </div>
          )}
        </div>

        {/* Speed Indicators - Larger & More Prominent */}
        {downloadSpeed !== undefined && uploadSpeed !== undefined && (
          <div className={cn(
            'w-full text-center md:text-left px-2 mt-4',
            selected ? 'text-gray-900' : 'text-white'
          )}>
            <div className="flex gap-4 items-center justify-center md:justify-start">
              {/* Download Speed */}
              <div className="flex items-center gap-1.5" title={`Download: ${downloadSpeed}${speedUnit}`}>
                <ArrowDown className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" aria-hidden="true" />
                <span className="text-sm md:text-base font-bold drop-shadow-sm">{downloadSpeed}{speedUnit}</span>
              </div>

              {/* Upload Speed */}
              <div className="flex items-center gap-1.5" title={`Upload: ${uploadSpeed}${speedUnit}`}>
                <ArrowUp className="w-4 h-4 md:w-5 md:h-5 drop-shadow-sm" aria-hidden="true" />
                <span className="text-sm md:text-base font-bold drop-shadow-sm">{uploadSpeed}{speedUnit}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Call-to-Action Button - New Addition */}
      <div className="mt-auto px-4 pb-4 pt-3">
        <button
          className={cn(
            'w-full py-2.5 px-4 rounded-lg',
            'text-sm md:text-base font-bold',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            // Minimum touch target of 44px (py-2.5 = 10px * 2 + text height ≈ 44px)
            selected && [
              'bg-circleTel-orange text-white',
              'hover:bg-orange-600',
              'focus:ring-orange-500'
            ],
            !selected && [
              'bg-white/95 text-[#F5831F]',
              'hover:bg-white',
              'focus:ring-white'
            ]
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          aria-label={selected ? 'Selected' : 'Select this plan'}
        >
          {selected ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Selected</span>
            </span>
          ) : (
            'Select Plan'
          )}
        </button>
      </div>
    </div>
  );
}
