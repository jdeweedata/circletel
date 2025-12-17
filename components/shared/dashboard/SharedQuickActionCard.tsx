'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SharedQuickActionCardProps } from './types';
import { iconColorMap } from './types';

/**
 * SharedQuickActionCard Component
 *
 * A reusable quick action card with colored icon background.
 * Features hover effects with scale and orange border accent.
 *
 * @example
 * ```tsx
 * <SharedQuickActionCard
 *   title="View Orders"
 *   description="Manage customer orders"
 *   icon={Package}
 *   colorVariant="blue"
 *   href="/admin/orders"
 * />
 * ```
 */
export function SharedQuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  colorVariant = 'orange',
  iconBg,
  iconColor,
  className,
}: SharedQuickActionCardProps) {
  const colors = iconColorMap[colorVariant];
  const finalIconBg = iconBg || colors.bg;
  const finalIconColor = iconColor || colors.color;

  const cardContent = (
    <div
      className={cn(
        'relative overflow-hidden border border-gray-200 bg-white',
        'shadow-sm hover:shadow-lg transition-all duration-200',
        'rounded-lg p-6 h-full flex flex-col',
        'cursor-pointer hover:scale-[1.02] hover:border-circleTel-orange/30',
        className
      )}
      onClick={!href ? onClick : undefined}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', finalIconBg)}>
            <Icon className={cn('h-5 w-5', finalIconColor)} />
          </div>
        </div>
      </div>

      {/* Title and Description */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

/**
 * SharedQuickActionCardCompact Component
 *
 * Compact version for smaller spaces - horizontal layout with icon and title.
 *
 * @example
 * ```tsx
 * <SharedQuickActionCardCompact
 *   title="View Orders"
 *   icon={Package}
 *   colorVariant="blue"
 *   href="/admin/orders"
 * />
 * ```
 */
export function SharedQuickActionCardCompact({
  title,
  icon: Icon,
  href,
  onClick,
  colorVariant = 'orange',
  iconBg,
  iconColor,
  className,
}: Omit<SharedQuickActionCardProps, 'description'>) {
  const colors = iconColorMap[colorVariant];
  const finalIconBg = iconBg || colors.bg;
  const finalIconColor = iconColor || colors.color;

  const cardContent = (
    <div
      className={cn(
        'group flex items-center gap-3 p-4',
        'bg-white border-2 border-gray-200 rounded-lg',
        'hover:border-circleTel-orange hover:shadow-md',
        'transition-all duration-200 hover:scale-[1.02]',
        'cursor-pointer',
        className
      )}
      onClick={!href ? onClick : undefined}
    >
      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', finalIconBg)}>
        <Icon className={cn('h-5 w-5', finalIconColor)} />
      </div>

      <span className="font-semibold text-sm text-gray-900 group-hover:text-circleTel-orange transition-colors">
        {title}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
