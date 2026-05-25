'use client';

import { StatCard } from '@/components/admin/shared';

interface KycSession {
  flow_type: string;
  user_type: string;
  verification_result?: 'approved' | 'declined' | 'pending_review' | null;
  risk_tier?: string | null;
  created_at: string;
}

interface KycStatCardsProps {
  session: KycSession;
}

const FLOW_TYPE_LABELS: Record<string, string> = {
  sme_light: 'SME Light',
  consumer_light: 'Consumer Light',
  consumer_light_kyc: 'Consumer KYC',
  full_kyc: 'Full KYC',
};

function getFlowTypeLabel(flowType: string): string {
  return FLOW_TYPE_LABELS[flowType] || flowType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getVerificationLabel(result?: string | null): string {
  const labels: Record<string, string> = {
    approved: 'Approved',
    declined: 'Declined',
    pending_review: 'Pending Review',
  };
  return labels[result || ''] || 'Not Reviewed';
}

function getVerificationSubtitle(result?: string | null): string {
  const subtitles: Record<string, string> = {
    approved: 'Verification passed',
    declined: 'Verification failed',
    pending_review: 'Under review',
  };
  return subtitles[result || ''] || 'Awaiting verification';
}

function getRiskLabel(tier?: string | null): string {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return labels[tier || ''] || 'Unassessed';
}

function getRiskSubtitle(tier?: string | null): string {
  const subtitles: Record<string, string> = {
    low: 'Low risk profile',
    medium: 'Medium risk profile',
    high: 'High risk profile',
  };
  return subtitles[tier || ''] || 'Risk assessment pending';
}

function getSessionAge(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function capitalizeUserType(userType: string): string {
  return userType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function KycStatCards({ session }: KycStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Flow Type"
        value={getFlowTypeLabel(session.flow_type)}
        subtitle={capitalizeUserType(session.user_type)}
      />
      <StatCard
        label="Verification"
        value={getVerificationLabel(session.verification_result)}
        subtitle={getVerificationSubtitle(session.verification_result)}
        indicator={session.verification_result === 'pending_review' ? 'pulse' : 'none'}
      />
      <StatCard
        label="Risk Tier"
        value={getRiskLabel(session.risk_tier)}
        subtitle={getRiskSubtitle(session.risk_tier)}
      />
      <StatCard
        label="Session Age"
        value={getSessionAge(session.created_at)}
        subtitle={formatDate(session.created_at)}
      />
    </div>
  );
}
