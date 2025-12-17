'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SharedEmptyStateProps } from './types';

/**
 * SharedEmptyState Component
 *
 * A consistent empty state component with icon, message, and optional CTA.
 * Used when lists or sections have no data to display.
 *
 * @example
 * ```tsx
 * <SharedEmptyState
 *   title="No Services Yet"
 *   description="You don't have any active services. Browse our packages to get started."
 *   icon={Wifi}
 *   ctaText="Browse Packages"
 *   ctaHref="/packages"
 * />
 * ```
 */
export function SharedEmptyState({
  title,
  description,
  icon: Icon = Package,
  ctaText,
  ctaHref,
  ctaOnClick,
  className,
}: SharedEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {/* Icon container */}
      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>

      {/* CTA Button */}
      {(ctaText && (ctaHref || ctaOnClick)) && (
        <div className="mt-4">
          {ctaHref ? (
            <Link href={ctaHref}>
              <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                {ctaText}
              </Button>
            </Link>
          ) : (
            <Button
              onClick={ctaOnClick}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
            >
              {ctaText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SharedEmptyStateInline Component
 *
 * A smaller inline empty state for use within cards or compact spaces.
 *
 * @example
 * ```tsx
 * <SharedEmptyStateInline
 *   title="No invoices"
 *   description="Your invoices will appear here"
 * />
 * ```
 */
export function SharedEmptyStateInline({
  title,
  description,
  icon: Icon = Package,
  className,
}: Omit<SharedEmptyStateProps, 'ctaText' | 'ctaHref' | 'ctaOnClick'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
      <Icon className="h-10 w-10 text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}
