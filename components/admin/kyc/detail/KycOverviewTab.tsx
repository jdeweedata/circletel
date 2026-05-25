'use client';

import Link from 'next/link';
import { PiUserBold, PiPackageBold, PiShieldBold } from 'react-icons/pi';
import { SectionCard, InfoRow } from '@/components/admin/shared';

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
  order?: { id: string; order_number: string; status: string } | null;
  quote?: { id: string; contact_name: string; contact_email: string; company_name?: string }[] | null;
}

interface KycOverviewTabProps {
  session: KycSession;
}

const FLOW_TYPE_LABELS: Record<string, string> = {
  sme_light: 'SME Light (< R500k)',
  consumer_light: 'Consumer Light',
  consumer_light_kyc: 'Consumer Light KYC',
  full_kyc: 'Full KYC (≥ R500k)',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFlowTypeLabel(flowType: string): string {
  return FLOW_TYPE_LABELS[flowType] || flowType;
}

export function KycOverviewTab({ session }: KycOverviewTabProps) {
  const quote =
    Array.isArray(session.quote) && session.quote.length > 0
      ? session.quote[0]
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Customer Information */}
      <SectionCard title="Customer Information" icon={PiUserBold}>
        <div className="space-y-1">
          <InfoRow label="Name" value={session.customer_name} />
          <InfoRow label="Email" value={session.customer_email} />
          <InfoRow label="Phone" value={session.customer_phone} />
          {quote?.company_name && (
            <InfoRow label="Company" value={quote.company_name} />
          )}
        </div>
      </SectionCard>

      {/* Center: Order/Quote Link */}
      <SectionCard
        title={session.order ? 'Order Information' : 'Quote Information'}
        icon={PiPackageBold}
      >
        {session.order ? (
          <div className="space-y-1">
            <InfoRow
              label="Order Number"
              value={
                <Link
                  href={`/admin/orders/${session.order.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {session.order.order_number}
                </Link>
              }
            />
            <InfoRow
              label="Status"
              value={session.order.status
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            />
          </div>
        ) : quote ? (
          <div className="space-y-1">
            <InfoRow label="Contact" value={quote.contact_name} />
            <InfoRow label="Email" value={quote.contact_email} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">No linked order or quote</p>
        )}
      </SectionCard>

      {/* Right: Session Details */}
      <SectionCard title="Session Details" icon={PiShieldBold}>
        <div className="space-y-1">
          <InfoRow
            label="Session ID"
            value={
              <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                {session.didit_session_id.slice(0, 12)}...
              </code>
            }
          />
          <InfoRow
            label="Flow Type"
            value={getFlowTypeLabel(session.flow_type)}
          />
          <InfoRow label="Created" value={formatDate(session.created_at)} />
          {session.completed_at && (
            <InfoRow
              label="Completed"
              value={formatDate(session.completed_at)}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
