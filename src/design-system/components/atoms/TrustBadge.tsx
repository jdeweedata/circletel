import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Award, Check, MapPin, Phone, Clock } from 'lucide-react';

export type TrustBadgeType =
  | 'popia-compliant'
  | 'sa-owned'
  | 'no-hidden-costs'
  | 'money-back'
  | 'first-month-free'
  | 'local-support'
  | 'power-ready'
  | 'reliable-partners'
  | '24-7-support'
  | 'setup-24hrs';

export interface TrustBadgeProps {
  type: TrustBadgeType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  className?: string;
}

const badgeConfig: Record<TrustBadgeType, {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  description?: string;
  color: string;
}> = {
  'popia-compliant': {
    icon: Shield,
    text: 'POPIA Compliant',
    description: 'Your data is protected according to SA law',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  'sa-owned': {
    icon: MapPin,
    text: '100% SA Owned',
    description: 'Proudly South African business',
    color: 'text-circleTel-orange bg-orange-50 border-orange-200',
  },
  'no-hidden-costs': {
    icon: Check,
    text: 'No Hidden Costs',
    description: 'Transparent pricing, always',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  'money-back': {
    icon: Award,
    text: '30-Day Money Back',
    description: 'Risk-free guarantee',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  'first-month-free': {
    icon: Award,
    text: 'First Month FREE',
    description: 'Special launch offer',
    color: 'text-circleTel-orange bg-orange-50 border-orange-200',
  },
  'local-support': {
    icon: Phone,
    text: 'Local SA Support',
    description: '087 087 6305',
    color: 'text-circleTel-orange bg-orange-50 border-orange-200',
  },
  'power-ready': {
    icon: Shield,
    text: 'Power Outage Ready',
    description: 'UPS backup solutions',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  'reliable-partners': {
    icon: Award,
    text: 'Reliable Network Partners',
    description: 'MTN, Vodacom, Telkom',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  '24-7-support': {
    icon: Clock,
    text: '24/7 Support',
    description: 'Always here when you need us',
    color: 'text-circleTel-orange bg-orange-50 border-orange-200',
  },
  'setup-24hrs': {
    icon: Clock,
    text: 'Setup in 24 Hours',
    description: 'Fast deployment guaranteed',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
};

const TrustBadge: React.FC<TrustBadgeProps> = ({
  type,
  size = 'md',
  variant = 'default',
  className,
}) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: config.color,
    outline: `border-2 ${config.color.split('bg-')[0]} bg-transparent`,
    subtle: `${config.color} bg-opacity-30`,
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-200 hover:scale-105',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      title={config.description}
    >
      <Icon className={cn(iconSizes[size])} />
      <span className="whitespace-nowrap">{config.text}</span>
    </div>
  );
};

export default TrustBadge;