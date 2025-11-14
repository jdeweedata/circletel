import React from 'react';
import { KYCStatusBadge } from '@/components/compliance/KYCStatusBadge';

interface KYBSubjectKYCStatusProps {
  kycStatus: 'not_started' | 'in_progress' | 'approved' | 'declined' | 'pending_review' | 'abandoned' | 'expired' | null;
  riskTier?: 'low' | 'medium' | 'high' | null;
  verifiedDate?: string | null;
  className?: string;
}

export function KYBSubjectKYCStatus({
  kycStatus,
  riskTier,
  verifiedDate,
  className,
}: KYBSubjectKYCStatusProps) {
  let status: 'not_started' | 'in_progress' | 'completed' | 'abandoned' | 'declined';
  let verificationResult: 'approved' | 'declined' | 'pending_review' | undefined;

  switch (kycStatus) {
    case 'approved':
      status = 'completed';
      verificationResult = 'approved';
      break;
    case 'declined':
      status = 'completed';
      verificationResult = 'declined';
      break;
    case 'pending_review':
      status = 'completed';
      verificationResult = 'pending_review';
      break;
    case 'in_progress':
      status = 'in_progress';
      verificationResult = undefined;
      break;
    case 'abandoned':
    case 'expired':
      status = 'abandoned';
      verificationResult = undefined;
      break;
    case 'not_started':
    default:
      status = 'not_started';
      verificationResult = undefined;
      break;
  }

  return (
    <KYCStatusBadge
      status={status}
      verificationResult={verificationResult}
      riskTier={riskTier ?? undefined}
      verifiedDate={verifiedDate ?? undefined}
      className={className}
    />
  );
}
