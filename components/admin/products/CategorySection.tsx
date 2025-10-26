'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
 *   icon={<Wifi className="h-5 w-5" />}
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
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50 hover:bg-green-100',
      text: 'text-green-900',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-800',
      border: 'border-green-200',
    },
    orange: {
      bg: 'bg-orange-50 hover:bg-orange-100',
      text: 'text-orange-900',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800',
      border: 'border-orange-200',
    },
    purple: {
      bg: 'bg-purple-50 hover:bg-purple-100',
      text: 'text-purple-900',
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      border: 'border-purple-200',
    },
    gray: {
      bg: 'bg-gray-50 hover:bg-gray-100',
      text: 'text-gray-900',
      icon: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800',
      border: 'border-gray-200',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200',
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
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>

          {/* Category Icon */}
          {icon && <div className={colors.icon}>{icon}</div>}

          {/* Title and Description */}
          <div className="text-left">
            <h3 className={cn('text-lg font-bold', colors.text)}>{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-0.5">{description}</p>
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
