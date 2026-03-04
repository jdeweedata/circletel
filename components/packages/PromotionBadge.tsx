'use client';
import { PiLightningBold, PiTagBold, PiTrendDownBold } from 'react-icons/pi';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PromotionBadgeProps {
  type: 'promo' | 'savings' | 'popular' | 'limited' | 'new';
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const badgeConfig = {
  promo: {
    icon: PiTagBold,
    defaultText: 'Promo',
    className: 'bg-green-500 text-white border-green-600'
  },
  savings: {
    icon: PiTrendDownBold,
    defaultText: 'Save',
    className: 'bg-red-500 text-white border-red-600'
  },
  popular: {
    icon: PiLightningBold,
    defaultText: 'Most Popular',
    className: 'bg-orange-500 text-white border-orange-600'
  },
  limited: {
    icon: PiTagBold,
    defaultText: 'Limited Time',
    className: 'bg-purple-500 text-white border-purple-600'
  },
  new: {
    icon: PiLightningBold,
    defaultText: 'New',
    className: 'bg-blue-500 text-white border-blue-600'
  }
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5'
};

export function PromotionBadge({
  type,
  text,
  className,
  size = 'md'
}: PromotionBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;
  const displayText = text || config.defaultText;

  return (
    <Badge
      className={cn(
        'font-bold uppercase tracking-wide shadow-md',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      <Icon className="inline h-3 w-3 mr-1" />
      {displayText}
    </Badge>
  );
}
