import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernStatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  href?: string;
}

export function ModernStatCard({
  title,
  value,
  trend,
  subtitle,
  description,
  icon,
  href,
}: ModernStatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.value === 0) {
      return <Minus className="h-4 w-4" />;
    }

    return trend.isPositive ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value === 0) return 'text-gray-500';
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  };

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden border border-gray-200 bg-white shadow-sm transition-all duration-200",
      href && "cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-circleTel-orange/30"
    )}>
      <div className="p-6">
        {/* Header with title and trend */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon && <div className="text-gray-400">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-700">
              {subtitle}
            </p>
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
      </div>
    </Card>
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
