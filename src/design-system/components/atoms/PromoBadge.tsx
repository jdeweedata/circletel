import React from 'react';
import { cn } from '@/lib/utils';
import { Gift, Zap, Star, TrendingUp } from 'lucide-react';

export type PromoBadgeType = 'first-month-free' | 'launch-special' | 'limited-time' | 'most-popular';

export interface PromoBadgeProps {
  type: PromoBadgeType;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const promoConfig: Record<PromoBadgeType, {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  bgColor: string;
  textColor: string;
  pulseColor?: string;
}> = {
  'first-month-free': {
    icon: Gift,
    text: '🎁 First Month FREE',
    bgColor: 'bg-circleTel-orange',
    textColor: 'text-white',
    pulseColor: 'animate-pulse',
  },
  'launch-special': {
    icon: Star,
    text: '⭐ Launch Special',
    bgColor: 'bg-gradient-to-r from-purple-600 to-circleTel-orange',
    textColor: 'text-white',
  },
  'limited-time': {
    icon: Zap,
    text: '⚡ Limited Time',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    pulseColor: 'animate-pulse',
  },
  'most-popular': {
    icon: TrendingUp,
    text: 'Most Popular',
    bgColor: 'bg-circleTel-orange',
    textColor: 'text-white',
  },
};

const PromoBadge: React.FC<PromoBadgeProps> = ({
  type,
  size = 'md',
  animated = false,
  className,
}) => {
  const config = promoConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm font-medium',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full shadow-md border-0 transition-all duration-300',
        sizeClasses[size],
        config.bgColor,
        config.textColor,
        animated && config.pulseColor,
        'hover:scale-105 hover:shadow-lg',
        className
      )}
    >
      <Icon className={cn(iconSizes[size])} />
      <span className="whitespace-nowrap">{config.text}</span>
    </div>
  );
};

export default PromoBadge;