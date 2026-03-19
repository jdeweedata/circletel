'use client';
import { PiCaretDownBold, PiCaretRightBold, PiWifiHighBold } from 'react-icons/pi';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface CategorySectionProps {
  title: string;
  description?: string;
  count: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  onToggle?: (isExpanded: boolean) => void;
}

/**
 * CategorySection Component
 *
 * Collapsible section for grouping products by category in the admin panel.
 * Features:
 * - Expandable/collapsible with smooth animation
 * - Category icon and color coding
 * - Product count badge
 * - Optional description
 * - Keyboard accessible
 *
 * @example
 * ```tsx
 * <CategorySection
 *   title="Connectivity"
 *   description="Fibre and wireless internet packages"
 *   count={12}
 *   icon={<PiWifiHighBold className="h-5 w-5" />}
 *   color="blue"
 *   defaultExpanded={true}
 * >
 *   {products.map(product => <AdminProductCard key={product.id} product={product} />)}
 * </CategorySection>
 * ```
 */
export function CategorySection({
  title,
  description,
  count,
  icon,
  children,
  defaultExpanded = true,
  color = 'gray',
  onToggle,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  const colorClasses = {
    blue: {
      bg: 'hover:bg-slate-50',
      text: 'text-slate-900',
      icon: 'text-blue-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-100',
      border: 'border-slate-200',
    },
    green: {
      bg: 'hover:bg-slate-50',
      text: 'text-slate-900',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      border: 'border-slate-200',
    },
    orange: {
      bg: 'hover:bg-slate-50',
      text: 'text-slate-900',
      icon: 'text-orange-500',
      badge: 'bg-orange-50 text-orange-700 border-orange-100',
      border: 'border-slate-200',
    },
    purple: {
      bg: 'hover:bg-slate-50',
      text: 'text-slate-900',
      icon: 'text-purple-500',
      badge: 'bg-purple-50 text-purple-700 border-purple-100',
      border: 'border-slate-200',
    },
    gray: {
      bg: 'hover:bg-slate-50',
      text: 'text-slate-900',
      icon: 'text-slate-500',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      border: 'border-slate-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-3 border-b transition-colors duration-200 rounded-t-lg',
          colors.bg,
          colors.border,
          'focus:outline-none focus:ring-2 focus:ring-circleTel-orange focus:ring-offset-2'
        )}
        aria-expanded={isExpanded}
        aria-controls={`category-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          {/* Expand/Collapse Icon */}
          <div className={cn('transition-transform duration-200', colors.icon)}>
            {isExpanded ? (
              <PiCaretDownBold className="h-5 w-5" />
            ) : (
              <PiCaretRightBold className="h-5 w-5" />
            )}
          </div>

          {/* Category Icon */}
          {icon && <div className={colors.icon}>{icon}</div>}

          {/* Title and Description */}
          <div className="text-left">
            <h3 className={cn('text-base font-semibold', colors.text)}>{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>

        {/* Count Badge */}
        <Badge className={cn('ml-auto', colors.badge)}>
          {count} {count === 1 ? 'product' : 'products'}
        </Badge>
      </button>

      {/* Section Content - Animated Expansion */}
      <div
        id={`category-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-[10000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  );
}
