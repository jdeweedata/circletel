'use client';

import { Badge } from '@/components/ui/badge';
import type {
  OrderStatus,
  QuoteStatus,
  CoverageLeadStatus,
  KycVerificationStatus,
} from '@/lib/types/customer-journey';
import {
  ORDER_STATUS_CONFIG,
  QUOTE_STATUS_CONFIG,
  LEAD_STATUS_CONFIG,
  KYC_STATUS_CONFIG,
} from '@/lib/types/customer-journey';

// =============================================================================
// TYPES
// =============================================================================

type StatusType = OrderStatus | QuoteStatus | CoverageLeadStatus | KycVerificationStatus;

interface OrderStatusBadgeProps {
  status: StatusType;
  type: 'order' | 'quote' | 'lead' | 'kyc';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

// =============================================================================
// COLOR MAPPING
// =============================================================================

const colorVariants = {
  default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  success: 'bg-green-100 text-green-800 hover:bg-green-200',
  warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  error: 'bg-red-100 text-red-800 hover:bg-red-200',
  info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
};

const sizeVariants = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function OrderStatusBadge({
  status,
  type,
  size = 'md',
  showIcon = true,
}: OrderStatusBadgeProps) {
  // Get configuration based on type
  const getConfig = () => {
    switch (type) {
      case 'order':
        return ORDER_STATUS_CONFIG[status as OrderStatus];
      case 'quote':
        return QUOTE_STATUS_CONFIG[status as QuoteStatus];
      case 'lead':
        return LEAD_STATUS_CONFIG[status as CoverageLeadStatus];
      case 'kyc':
        return KYC_STATUS_CONFIG[status as KycVerificationStatus];
      default:
        return {
          label: status,
          color: 'default' as const,
        };
    }
  };

  const config = getConfig();
  const colorClass = colorVariants[config.color];
  const sizeClass = sizeVariants[size];

  return (
    <Badge
      className={`${colorClass} ${sizeClass} font-medium inline-flex items-center gap-1`}
      variant="outline"
    >
      {showIcon && config.icon && (
        <span className="text-inherit">{config.icon}</span>
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

/**
 * Order status badge with order-specific styling
 */
export function ConsumerOrderStatusBadge({
  status,
  size = 'md',
}: {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <OrderStatusBadge status={status} type="order" size={size} />;
}

/**
 * Quote status badge with quote-specific styling
 */
export function BusinessQuoteStatusBadge({
  status,
  size = 'md',
}: {
  status: QuoteStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <OrderStatusBadge status={status} type="quote" size={size} />;
}

/**
 * Lead status badge with lead-specific styling
 */
export function LeadStatusBadge({
  status,
  size = 'md',
}: {
  status: CoverageLeadStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <OrderStatusBadge status={status} type="lead" size={size} />;
}

/**
 * KYC verification status badge
 */
export function KycStatusBadge({
  status,
  size = 'md',
}: {
  status: KycVerificationStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <OrderStatusBadge status={status} type="kyc" size={size} />;
}

// =============================================================================
// STATUS PROGRESS INDICATOR
// =============================================================================

interface StatusProgressProps {
  currentStatus: OrderStatus;
  className?: string;
}

/**
 * Visual progress indicator showing where an order is in the journey
 */
export function OrderStatusProgress({
  currentStatus,
  className = '',
}: StatusProgressProps) {
  // Define order flow stages
  const stages: OrderStatus[] = [
    'pending',
    'payment_received',
    'kyc_approved',
    'installation_scheduled',
    'installation_completed',
    'active',
  ];

  const currentIndex = stages.indexOf(currentStatus);

  // Handle rejected/cancelled states
  if (
    currentStatus === 'kyc_rejected' ||
    currentStatus === 'credit_check_rejected' ||
    currentStatus === 'cancelled' ||
    currentStatus === 'failed'
  ) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-2 bg-red-200 rounded-full">
          <div className="h-full bg-red-500 rounded-full w-full" />
        </div>
        <OrderStatusBadge status={currentStatus} type="order" size="sm" />
      </div>
    );
  }

  // Calculate progress percentage
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>Order Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-circleTel-orange rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {stages[0].replace(/_/g, ' ')}
        </span>
        <OrderStatusBadge status={currentStatus} type="order" size="sm" />
        <span className="text-xs text-gray-500">
          {stages[stages.length - 1].replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}
