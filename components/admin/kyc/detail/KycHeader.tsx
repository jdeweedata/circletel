'use client';

import Link from 'next/link';
import { PiCaretRightBold, PiPencilSimpleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/shared';

interface KycSession {
  id: string;
  didit_session_id: string;
  flow_type: string;
  user_type: string;
  status: string;
  extracted_data?: any;
  verification_result?: 'approved' | 'declined' | 'pending_review' | null;
  risk_tier?: string | null;
  created_at: string;
  completed_at?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order?: { id: string; order_number: string; status: string; } | null;
  quote?: { id: string; contact_name: string; contact_email: string; company_name?: string; }[] | null;
}

interface KycHeaderProps {
  session: KycSession;
  onEdit: () => void;
}

const FLOW_TYPE_LABELS: Record<string, string> = {
  sme_light: 'SME Light (< R500k)',
  consumer_light: 'Consumer Light',
  consumer_light_kyc: 'Consumer Light KYC',
  full_kyc: 'Full KYC (≥ R500k)',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  not_started: 'neutral',
  in_progress: 'info',
  completed: 'success',
  abandoned: 'warning',
  declined: 'error',
};

const USER_TYPE_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  business: 'info',
  consumer: 'success',
};

const RISK_TIER_LABELS: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

const RISK_TIER_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

const VERIFICATION_VARIANTS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  approved: 'success',
  declined: 'error',
  pending_review: 'warning',
};

function getStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function KycHeader({ session, onEdit }: KycHeaderProps) {
  const statusVariant = STATUS_VARIANTS[session.status] || 'neutral';
  const userTypeVariant = USER_TYPE_VARIANTS[session.user_type] || 'neutral';
  const flowTypeLabel = FLOW_TYPE_LABELS[session.flow_type] || session.flow_type;
  const displayName = session.customer_name || session.didit_session_id.substring(0, 8);

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/kyc" className="hover:text-primary">KYC Review</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{displayName}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {displayName}
            </h2>
            <StatusBadge status={getStatusLabel(session.status)} variant={statusVariant} />
            <StatusBadge
              status={session.user_type.charAt(0).toUpperCase() + session.user_type.slice(1)}
              variant={userTypeVariant}
            />
            {session.risk_tier && (
              <StatusBadge
                status={RISK_TIER_LABELS[session.risk_tier] || session.risk_tier}
                variant={RISK_TIER_VARIANTS[session.risk_tier] || 'neutral'}
              />
            )}
            {session.verification_result && (
              <StatusBadge
                status={
                  session.verification_result === 'pending_review'
                    ? 'Pending Review'
                    : session.verification_result.charAt(0).toUpperCase() +
                      session.verification_result.slice(1)
                }
                variant={VERIFICATION_VARIANTS[session.verification_result] || 'neutral'}
              />
            )}
          </div>

          {/* Edit Button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onEdit}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <PiPencilSimpleBold className="w-5 h-5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-slate-500 mt-1">Flow Type: {flowTypeLabel}</p>
      </div>
    </div>
  );
}
