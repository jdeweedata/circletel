'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  CheckCircle,
  FileText,
  Archive,
  Star,
  TrendingUp,
} from 'lucide-react';

export interface ProductStatsWidgetProps {
  stats: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    featured: number;
    popular: number;
  };
  className?: string;
}

/**
 * ProductStatsWidget Component
 *
 * Visual dashboard showing product statistics with color-coded cards.
 * Displays:
 * - Total products
 * - Active products (green)
 * - Draft products (gray)
 * - Archived products (red)
 * - Featured products (yellow)
 * - Popular products (blue)
 *
 * @example
 * ```tsx
 * <ProductStatsWidget
 *   stats={{
 *     total: 17,
 *     active: 15,
 *     draft: 2,
 *     archived: 0,
 *     featured: 3,
 *     popular: 5
 *   }}
 * />
 * ```
 */
export function ProductStatsWidget({ stats, className }: ProductStatsWidgetProps) {
  const statCards = [
    {
      label: 'Total Products',
      value: stats.total,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    {
      label: 'Drafts',
      value: stats.draft,
      icon: FileText,
      color: 'gray',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-900',
    },
    {
      label: 'Featured',
      value: stats.featured,
      icon: Star,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    {
      label: 'Popular',
      value: stats.popular,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    {
      label: 'Archived',
      value: stats.archived,
      icon: Archive,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={cn(
              'border-2 transition-all duration-200 hover:shadow-lg hover:scale-105',
              stat.bgColor
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn('h-6 w-6', stat.iconColor)} />
              </div>
              <div className={cn('text-2xl font-bold mb-1', stat.textColor)}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
