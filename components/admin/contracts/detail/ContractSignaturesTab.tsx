'use client';

import { SectionCard, InfoRow, StatusBadge } from '@/components/admin/shared';
import { Button } from '@/components/ui/button';
import {
  PiPenNibBold,
  PiPaperPlaneTiltBold,
  PiCheckCircleBold,
  PiClockBold,
} from 'react-icons/pi';

interface Signature {
  zohoSignRequestId: string | null;
  customerSignatureDate: string | null;
  circletelSignatureDate: string | null;
  fullySignedDate: string | null;
}

interface ContractSignaturesTabProps {
  contract: {
    status: string;
    customer_signature_date: string | null;
    circletel_signature_date: string | null;
    zoho_sign_request_id: string | null;
  };
  signature: Signature;
  onResend?: () => void;
  isResending?: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface SignatureStatusProps {
  label: string;
  signedDate: string | null;
}

function SignatureStatus({ label, signedDate }: SignatureStatusProps) {
  const isSigned = !!signedDate;

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2">
        {isSigned ? (
          <PiCheckCircleBold className="w-5 h-5 text-emerald-600" />
        ) : (
          <PiClockBold className="w-5 h-5 text-amber-500" />
        )}
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge
          status={isSigned ? 'Signed' : 'Pending'}
          variant={isSigned ? 'success' : 'warning'}
        />
        {isSigned && (
          <span className="text-xs text-slate-500">{formatDate(signedDate)}</span>
        )}
      </div>
    </div>
  );
}

export function ContractSignaturesTab({
  contract,
  signature,
  onResend,
  isResending = false,
}: ContractSignaturesTabProps) {
  // Use signature prop for dates (camelCase from API)
  const customerSignatureDate = signature.customerSignatureDate || contract.customer_signature_date;
  const circletelSignatureDate = signature.circletelSignatureDate || contract.circletel_signature_date;
  const zohoSignRequestId = signature.zohoSignRequestId || contract.zoho_sign_request_id;

  const hasCustomerSigned = !!customerSignatureDate;
  const hasCircleTelSigned = !!circletelSignatureDate;
  const isPendingSignature = !hasCustomerSigned || !hasCircleTelSigned;
  const hasZohoRequest = !!zohoSignRequestId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Signature Status */}
      <SectionCard title="Signature Status" icon={PiPenNibBold}>
        <SignatureStatus
          label="Customer Signature"
          signedDate={customerSignatureDate}
        />
        <SignatureStatus
          label="CircleTel Signature"
          signedDate={circletelSignatureDate}
        />
      </SectionCard>

      {/* Zoho Sign Details */}
      <SectionCard title="Zoho Sign Integration" icon={PiPaperPlaneTiltBold}>
        <InfoRow
          label="Request ID"
          value={zohoSignRequestId || 'Not sent'}
        />
        <InfoRow
          label="Status"
          value={
            hasZohoRequest ? (
              isPendingSignature ? (
                <StatusBadge status="Awaiting Signatures" variant="warning" />
              ) : (
                <StatusBadge status="Completed" variant="success" />
              )
            ) : (
              <StatusBadge status="Not Initiated" variant="neutral" />
            )
          }
        />

        {/* Resend Button */}
        {isPendingSignature && hasZohoRequest && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={isResending}
              className="w-full flex items-center justify-center gap-2"
            >
              <PiPaperPlaneTiltBold className="w-4 h-4" />
              {isResending ? 'Sending...' : 'Resend Signature Request'}
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
