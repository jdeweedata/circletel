'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Provider Logo Component
 *
 * Displays network infrastructure provider logos on product cards.
 * Supports grayscale styling (as per CircleTel design) with hover effect to show brand colors.
 *
 * @example
 * ```tsx
 * <ProviderLogo
 *   providerCode="dfa"
 *   providerName="Dark Fibre Africa"
 *   logoUrl="/images/providers/dfa-dark.png"
 *   variant="grayscale"
 * />
 * ```
 */

export interface ProviderLogoProps {
  /** Provider code (e.g., 'mtn', 'dfa', 'vumatel') */
  providerCode: string;

  /** Provider display name */
  providerName: string;

  /** Logo URL (can be absolute or relative path) */
  logoUrl: string;

  /** Dark variant logo URL (for dark backgrounds) */
  logoDarkUrl?: string;

  /** Light variant logo URL (for light backgrounds) */
  logoLightUrl?: string;

  /** Logo format (svg, png, jpg) */
  logoFormat?: 'svg' | 'png' | 'jpg';

  /** Logo aspect ratio for responsive scaling */
  aspectRatio?: number;

  /** Display variant */
  variant?: 'default' | 'grayscale';

  /** Additional CSS classes */
  className?: string;

  /** Image loading priority (use true for above-the-fold images) */
  priority?: boolean;

  /** Size preset */
  size?: 'small' | 'medium' | 'large';

  /** Theme context for logo selection */
  theme?: 'light' | 'dark';
}

/**
 * Size configurations based on WebAfrica analysis
 * Desktop: 175px × 48px
 * Tablet: 150px × 41px
 * Mobile: 120px × 33px
 */
const sizeConfig = {
  small: {
    width: 120,
    height: 33,
    className: 'w-[120px] h-[33px]'
  },
  medium: {
    width: 150,
    height: 41,
    className: 'w-[150px] h-[41px] md:w-[175px] md:h-[48px]'
  },
  large: {
    width: 175,
    height: 48,
    className: 'w-[175px] h-[48px]'
  }
};

export function ProviderLogo({
  providerCode,
  providerName,
  logoUrl,
  logoDarkUrl,
  logoLightUrl,
  logoFormat = 'svg',
  aspectRatio,
  variant = 'grayscale',
  className,
  priority = false,
  size = 'medium',
  theme = 'light'
}: ProviderLogoProps) {
  // Select appropriate logo based on theme
  const selectedLogoUrl = React.useMemo(() => {
    if (theme === 'dark' && logoDarkUrl) {
      return logoDarkUrl;
    }
    if (theme === 'light' && logoLightUrl) {
      return logoLightUrl;
    }
    return logoUrl;
  }, [theme, logoUrl, logoDarkUrl, logoLightUrl]);

  // Get size configuration
  const sizeStyles = sizeConfig[size];

  // Build CSS classes
  const containerClasses = cn(
    'provider-logo-container',
    'relative inline-flex items-center justify-center',
    'transition-all duration-300 ease-in-out',
    sizeStyles.className,
    className
  );

  const imageClasses = cn(
    'provider-logo',
    'object-contain',
    'transition-all duration-300 ease-in-out',
    {
      // Grayscale variant (CircleTel requested style)
      'grayscale opacity-70 hover:grayscale-0 hover:opacity-100': variant === 'grayscale',
      // Default variant (full brand colors)
      'opacity-100': variant === 'default'
    }
  );

  // Fallback for missing logos
  if (!selectedLogoUrl) {
    return (
      <div
        className={cn(
          containerClasses,
          'bg-circleTel-lightNeutral rounded-md',
          'flex items-center justify-center'
        )}
        title={providerName}
      >
        <span className="text-xs text-circleTel-secondaryNeutral font-medium truncate px-2">
          {providerName}
        </span>
      </div>
    );
  }

  // Handle external URLs vs local paths
  const isExternalUrl = selectedLogoUrl.startsWith('http://') || selectedLogoUrl.startsWith('https://');

  return (
    <div className={containerClasses} title={providerName}>
      {isExternalUrl ? (
        // External URL: use regular img tag
        <img
          src={selectedLogoUrl}
          alt={`${providerName} logo`}
          className={imageClasses}
          loading={priority ? 'eager' : 'lazy'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      ) : (
        // Local path: use Next.js Image for optimization
        <Image
          src={selectedLogoUrl}
          alt={`${providerName} logo`}
          width={sizeStyles.width}
          height={sizeStyles.height}
          className={imageClasses}
          priority={priority}
          unoptimized={logoFormat === 'svg'} // SVGs don't need optimization
          style={{
            objectFit: 'contain'
          }}
        />
      )}
    </div>
  );
}

/**
 * Compact variant for small spaces (e.g., badges, filters)
 */
export function ProviderLogoBadge({
  providerCode,
  providerName,
  logoUrl,
  className
}: Pick<ProviderLogoProps, 'providerCode' | 'providerName' | 'logoUrl' | 'className'>) {
  return (
    <ProviderLogo
      providerCode={providerCode}
      providerName={providerName}
      logoUrl={logoUrl}
      variant="default"
      size="small"
      className={cn('inline-flex', className)}
    />
  );
}

/**
 * Provider logo with text label
 */
export interface ProviderLogoWithLabelProps extends ProviderLogoProps {
  showLabel?: boolean;
  labelPosition?: 'top' | 'bottom' | 'right';
}

export function ProviderLogoWithLabel({
  providerCode,
  providerName,
  logoUrl,
  logoDarkUrl,
  logoLightUrl,
  logoFormat,
  aspectRatio,
  variant = 'grayscale',
  className,
  priority,
  size = 'medium',
  theme,
  showLabel = true,
  labelPosition = 'bottom'
}: ProviderLogoWithLabelProps) {
  const containerClasses = cn(
    'provider-logo-with-label',
    'flex items-center gap-2',
    {
      'flex-col': labelPosition === 'top' || labelPosition === 'bottom',
      'flex-col-reverse': labelPosition === 'top',
      'flex-row': labelPosition === 'right'
    },
    className
  );

  return (
    <div className={containerClasses}>
      <ProviderLogo
        providerCode={providerCode}
        providerName={providerName}
        logoUrl={logoUrl}
        logoDarkUrl={logoDarkUrl}
        logoLightUrl={logoLightUrl}
        logoFormat={logoFormat}
        aspectRatio={aspectRatio}
        variant={variant}
        priority={priority}
        size={size}
        theme={theme}
      />
      {showLabel && (
        <span className="text-xs text-circleTel-secondaryNeutral font-medium">
          {providerName}
        </span>
      )}
    </div>
  );
}

/**
 * Provider logo skeleton for loading states
 */
export function ProviderLogoSkeleton({
  size = 'medium',
  className
}: {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}) {
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        'provider-logo-skeleton',
        'animate-pulse bg-circleTel-lightNeutral rounded-md',
        sizeStyles.className,
        className
      )}
      aria-label="Loading provider logo"
    />
  );
}

export default ProviderLogo;
