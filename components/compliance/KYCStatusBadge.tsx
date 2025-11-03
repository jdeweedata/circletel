import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface KYCStatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'declined';
  verificationResult?: 'approved' | 'declined' | 'pending_review';
  verifiedDate?: string;
  riskTier?: 'low' | 'medium' | 'high';
  className?: string;
}

export function KYCStatusBadge({
  status,
  verificationResult,
  verifiedDate,
  riskTier,
  className
}: KYCStatusBadgeProps) {
  // Determine badge content and styling based on status and verification result
  const getBadgeContent = () => {
    // If status is completed, show verification result
    if (status === 'completed' && verificationResult) {
      switch (verificationResult) {
        case 'approved':
          return {
            icon: <CheckCircle className="w-3.5 h-3.5" />,
            text: 'KYC Verified',
            className: 'bg-green-500 text-white hover:bg-green-600',
          };
        case 'declined':
          return {
            icon: <XCircle className="w-3.5 h-3.5" />,
            text: 'KYC Declined',
            className: 'bg-red-500 text-white hover:bg-red-600',
          };
        case 'pending_review':
          return {
            icon: <Clock className="w-3.5 h-3.5" />,
            text: 'Pending Review',
            className: 'bg-yellow-500 text-white hover:bg-yellow-600',
          };
      }
    }

    // Otherwise, show status
    switch (status) {
      case 'in_progress':
        return {
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
          text: 'In Progress',
          className: 'bg-blue-500 text-white hover:bg-blue-600',
        };
      case 'abandoned':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          text: 'Abandoned',
          className: 'bg-gray-400 text-white hover:bg-gray-500',
        };
      case 'declined':
        return {
          icon: <XCircle className="w-3.5 h-3.5" />,
          text: 'Declined',
          className: 'bg-red-500 text-white hover:bg-red-600',
        };
      case 'not_started':
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          text: 'Not Started',
          className: 'bg-gray-300 text-gray-700 hover:bg-gray-400',
        };
    }
  };

  const { icon, text, className: badgeClassName } = getBadgeContent();

  // Format verified date if available
  const formattedDate = verifiedDate
    ? new Date(verifiedDate).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex flex-col gap-1">
      <Badge
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
          badgeClassName,
          className
        )}
      >
        {icon}
        <span>{text}</span>
      </Badge>

      {formattedDate && (
        <span className="text-xs text-circleTel-secondaryNeutral">
          Verified: {formattedDate}
        </span>
      )}

      {riskTier && verificationResult === 'approved' && (
        <span className={cn(
          'text-xs font-medium',
          riskTier === 'low' && 'text-green-600',
          riskTier === 'medium' && 'text-yellow-600',
          riskTier === 'high' && 'text-red-600'
        )}>
          Risk: {riskTier.charAt(0).toUpperCase() + riskTier.slice(1)}
        </span>
      )}
    </div>
  );
}
