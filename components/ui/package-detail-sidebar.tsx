'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PackageDetailSidebarProps {
  // Package identification
  packageId?: string;

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

  // Provider
  providerName?: string;
  providerLogo?: string;

  // Benefits
  benefits?: string[];

  // Additional information (expandable)
  additionalInfo?: {
    title?: string;
    items?: string[];
  };

  // Actions
  onOrderClick?: () => void;
  onClose?: () => void;

  // Styling
  className?: string;
  isOpen?: boolean;
}

/**
 * PackageDetailSidebar Component
 *
 * Sticky sidebar panel that displays detailed package information.
 * Based on WebAfrica's package detail sidebar pattern.
 *
 * Features:
 * - Sticky positioning that follows scroll
 * - Provider branding with logo
 * - Promotional pricing display
 * - Speed indicators or data limit
 * - Benefits list with checkmarks
 * - Expandable additional information section
 * - Order CTA button
 * - Close button for mobile overlay mode
 *
 * @example
 * ```tsx
 * <PackageDetailSidebar
 *   promoPrice={459}
 *   originalPrice={589}
 *   promoDescription="first 2 months"
 *   downloadSpeed={25}
 *   uploadSpeed={25}
 *   providerName="MetroFibre NEXUS"
 *   providerLogo="/providers/metrofibre.png"
 *   benefits={["Free setup worth R1699", "Fully insured, free-to-use router"]}
 *   additionalInfo={{
 *     items: ["Month-to-month contract", "Free installation", "24/7 support"]
 *   }}
 *   onOrderClick={() => handleOrder()}
 * />
 * ```
 */
export function PackageDetailSidebar({
  packageId,
  promoPrice,
  originalPrice,
  currency = 'R',
  period = 'pm',
  promoDescription,
  name,
  type = 'uncapped',
  dataLimit,
  downloadSpeed,
  uploadSpeed,
  speedUnit = 'Mbps',
  providerName,
  providerLogo,
  benefits,
  additionalInfo,
  onOrderClick,
  onClose,
  className,
  isOpen = true,
}: PackageDetailSidebarProps) {
  const [isAdditionalInfoExpanded, setIsAdditionalInfoExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg overflow-hidden',
        'border border-gray-200',
        // Sticky positioning
        'sticky top-4',
        // Mobile: full screen overlay
        'fixed md:static inset-0 md:inset-auto z-50 md:z-auto',
        // Mobile: add padding for close button
        'p-4 md:p-0',
        className
      )}
      role="complementary"
      aria-label="Package details"
    >
      {/* Mobile Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close package details"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}

      <div className="p-6">
        {/* Provider Logo and Name */}
        {(providerLogo || providerName) && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            {providerLogo && (
              <img
                src={providerLogo}
                alt={providerName || 'Provider'}
                className="h-12 object-contain mb-2"
              />
            )}
            {providerName && !providerLogo && (
              <div className="text-lg font-semibold text-circleTel-darkNeutral">
                {providerName}
              </div>
            )}
          </div>
        )}

        {/* Package Name (if provided) */}
        {name && (
          <div className="text-xl font-bold text-circleTel-darkNeutral mb-2">
            {name}
          </div>
        )}

        {/* Package Type Badge */}
        <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-4 capitalize">
          {type}
        </div>

        {/* Pricing Section */}
        <div className="mb-6">
          {originalPrice && originalPrice !== promoPrice && (
            <div className="text-lg text-gray-500 line-through mb-1">
              {currency}{originalPrice.toLocaleString()}{period}
            </div>
          )}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-bold text-circleTel-darkNeutral">
              {currency}{promoPrice.toLocaleString()}
            </span>
            <span className="text-xl text-circleTel-secondaryNeutral">
              {period}
            </span>
          </div>
          {promoDescription && (
            <div className="text-sm text-gray-600">
              / {promoDescription}
            </div>
          )}
        </div>

        {/* Speed Indicators or Data Limit */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          {dataLimit ? (
            // Capped plan - show data limit
            <div className="flex justify-center">
              <div className="bg-blue-100 text-blue-700 font-bold py-3 px-5 rounded-full text-xl">
                {dataLimit}
              </div>
            </div>
          ) : (
            // Uncapped plan - show speeds
            downloadSpeed !== undefined && uploadSpeed !== undefined && (
              <div className="space-y-3">
                <SpeedRow
                  label="Download"
                  speed={downloadSpeed}
                  unit={speedUnit}
                  icon={<ArrowDown className="w-5 h-5 text-blue-600" />}
                />
                <SpeedRow
                  label="Upload"
                  speed={uploadSpeed}
                  unit={speedUnit}
                  icon={<ArrowUp className="w-5 h-5 text-blue-600" />}
                />
              </div>
            )
          )}
        </div>

        {/* Benefits Section */}
        {benefits && benefits.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-pink-600 font-semibold text-sm mb-3 uppercase tracking-wide">
              What you get for free:
            </h3>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-circleTel-secondaryNeutral">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Information (Expandable) */}
        {additionalInfo && additionalInfo.items && additionalInfo.items.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsAdditionalInfoExpanded(!isAdditionalInfoExpanded)}
              className="flex items-center justify-between w-full text-left font-semibold text-circleTel-darkNeutral hover:text-circleTel-orange transition-colors"
              aria-expanded={isAdditionalInfoExpanded}
            >
              <span className="text-sm uppercase tracking-wide">
                {additionalInfo.title || 'What else you should know'}
              </span>
              {isAdditionalInfoExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {isAdditionalInfoExpanded && (
              <div className="mt-3 space-y-2 pl-2">
                {additionalInfo.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-circleTel-orange flex-shrink-0 mt-2" />
                    <span className="text-sm text-circleTel-secondaryNeutral">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Button */}
        {onOrderClick && (
          <Button
            onClick={onOrderClick}
            className="w-full bg-circleTel-darkNeutral hover:bg-circleTel-darkNeutral/90 text-white font-semibold py-4 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
            size="lg"
          >
            Order Now
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * SpeedRow Component
 *
 * Displays a single speed metric (download or upload) in a row format.
 * Used within the PackageDetailSidebar for speed display.
 */
interface SpeedRowProps {
  label: string;
  speed: number;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
}

function SpeedRow({
  label,
  speed,
  unit = 'Mbps',
  icon,
  className,
}: SpeedRowProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      aria-label={`${label} speed: ${speed} ${unit}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-circleTel-secondaryNeutral">
          {label}
        </span>
      </div>
      <span className="text-lg font-bold text-circleTel-darkNeutral">
        {speed}{unit}
      </span>
    </div>
  );
}

/**
 * MobilePackageDetailOverlay Component
 *
 * Mobile-optimized overlay version of the package detail sidebar.
 * Renders as a modal overlay on mobile devices with full-screen display.
 *
 * @example
 * ```tsx
 * <MobilePackageDetailOverlay
 *   isOpen={selectedPackage !== null}
 *   onClose={() => setSelectedPackage(null)}
 *   {...packageDetails}
 * />
 * ```
 */
export function MobilePackageDetailOverlay(props: PackageDetailSidebarProps) {
  return (
    <PackageDetailSidebar
      {...props}
      className={cn(
        // Mobile-specific styling
        'md:hidden',
        // Full screen with backdrop
        'fixed inset-0 z-50 bg-white',
        // Slide up animation
        'animate-in slide-in-from-bottom duration-300',
        props.className
      )}
    />
  );
}
