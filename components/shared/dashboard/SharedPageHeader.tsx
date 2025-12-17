'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { SharedPageHeaderProps } from './types';

/**
 * SharedPageHeader Component
 *
 * A consistent page header with title, subtitle, and optional action slot.
 * Used across all dashboards for consistent page layouts.
 *
 * @example
 * ```tsx
 * <SharedPageHeader
 *   title="Customers"
 *   subtitle="Manage your customer accounts"
 *   action={<Button>Add Customer</Button>}
 * />
 * ```
 */
export function SharedPageHeader({
  title,
  subtitle,
  action,
  className,
}: SharedPageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/**
 * SharedSectionHeader Component
 *
 * A smaller section header for card sections within a page.
 *
 * @example
 * ```tsx
 * <SharedSectionHeader
 *   title="Quick Actions"
 *   subtitle="Common tasks and shortcuts"
 * />
 * ```
 */
export function SharedSectionHeader({
  title,
  subtitle,
  action,
  className,
}: SharedPageHeaderProps) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
