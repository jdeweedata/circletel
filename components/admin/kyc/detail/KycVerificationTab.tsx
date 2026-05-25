'use client';

import { useState } from 'react';
import {
  PiFloppyDiskBold,
  PiSpinnerBold,
  PiIdentificationCardBold,
  PiNoteBold,
} from 'react-icons/pi';
import {
  SectionCard,
  InfoRow,
  StatusBadge,
} from '@/components/admin/shared';
import DiditVerificationLinks from '@/components/admin/kyc/DiditVerificationLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  quote?: {
    id: string;
    contact_name: string;
    contact_email: string;
    company_name?: string;
  }[] | null;
}

interface KycVerificationTabProps {
  session: KycSession;
  editing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function KycVerificationTab({
  session,
  editing,
  onSave,
  onCancel,
}: KycVerificationTabProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [verificationResult, setVerificationResult] = useState(
    session.verification_result || ''
  );
  const [riskTier, setRiskTier] = useState(session.risk_tier || '');
  const [fullName, setFullName] = useState(
    session.extracted_data?.full_name || ''
  );
  const [idNumber, setIdNumber] = useState(
    session.extracted_data?.id_number || ''
  );
  const [companyReg, setCompanyReg] = useState(
    session.extracted_data?.company_registration || ''
  );
  const [proofOfAddress, setProofOfAddress] = useState(
    session.extracted_data?.proof_of_address || ''
  );
  const [adminNotes, setAdminNotes] = useState(
    session.extracted_data?.admin_notes || ''
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/kyc/sessions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          verification_result: verificationResult || undefined,
          risk_tier: riskTier || undefined,
          extracted_data: {
            id_number: idNumber || undefined,
            full_name: fullName || undefined,
            company_registration: companyReg || undefined,
            proof_of_address: proofOfAddress || undefined,
          },
          admin_notes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update session');
        return;
      }

      onSave();
    } catch (err) {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setVerificationResult(session.verification_result || '');
    setRiskTier(session.risk_tier || '');
    setFullName(session.extracted_data?.full_name || '');
    setIdNumber(session.extracted_data?.id_number || '');
    setCompanyReg(session.extracted_data?.company_registration || '');
    setProofOfAddress(session.extracted_data?.proof_of_address || '');
    setAdminNotes(session.extracted_data?.admin_notes || '');
    setError(null);
    onCancel();
  };

  // Helper to map verification result to status variant
  const getVerificationVariant = (
    result?: string | null
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    if (!result) return 'neutral';
    if (result === 'approved') return 'success';
    if (result === 'declined') return 'error';
    if (result === 'pending_review') return 'warning';
    return 'neutral';
  };

  // Helper to map risk tier to status variant
  const getRiskVariant = (
    tier?: string | null
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    if (!tier) return 'neutral';
    if (tier === 'low') return 'success';
    if (tier === 'medium') return 'warning';
    if (tier === 'high') return 'error';
    return 'neutral';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Didit Verification Links */}
        <DiditVerificationLinks
          sessionId={session.id}
          diditSessionId={session.didit_session_id}
          extractedData={session.extracted_data}
          verificationResult={session.verification_result}
          status={session.status}
        />

        {/* Verification Status (non-editing mode) */}
        {!editing && (
          <SectionCard
            title="Verification Status"
            icon={PiIdentificationCardBold}
          >
            <div className="space-y-3">
              <InfoRow
                label="Verification Result"
                value={
                  session.verification_result ? (
                    <StatusBadge
                      status={session.verification_result
                        .split('_')
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')}
                      variant={getVerificationVariant(
                        session.verification_result
                      )}
                    />
                  ) : (
                    '—'
                  )
                }
              />
              <InfoRow
                label="Risk Tier"
                value={
                  session.risk_tier ? (
                    <StatusBadge
                      status={session.risk_tier.charAt(0).toUpperCase() + session.risk_tier.slice(1)}
                      variant={getRiskVariant(session.risk_tier)}
                    />
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Edit Mode: Verification Form */}
        {editing && (
          <SectionCard title="Update Verification">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Verification Result
                </label>
                <Select value={verificationResult} onValueChange={setVerificationResult}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select result..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Risk Tier
                </label>
                <Select value={riskTier} onValueChange={setRiskTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Extracted Data (non-editing mode) or Edit Form (editing mode) */}
        {!editing ? (
          <SectionCard
            title="Extracted Data"
            icon={PiIdentificationCardBold}
          >
            <div className="space-y-3">
              <InfoRow
                label="Full Name"
                value={session.extracted_data?.full_name || '—'}
              />
              <InfoRow
                label="ID Number"
                value={session.extracted_data?.id_number || '—'}
              />
              <InfoRow
                label="Company Registration"
                value={session.extracted_data?.company_registration || '—'}
              />
              <InfoRow
                label="Proof of Address"
                value={session.extracted_data?.proof_of_address || '—'}
              />
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Update Extracted Data">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name from ID document"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ID Number
                </label>
                <Input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="SA ID or passport number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Registration
                </label>
                <Input
                  value={companyReg}
                  onChange={(e) => setCompanyReg(e.target.value)}
                  placeholder="Company registration number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Proof of Address
                </label>
                <Input
                  value={proofOfAddress}
                  onChange={(e) => setProofOfAddress(e.target.value)}
                  placeholder="Address verification status"
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Admin Notes (non-editing mode) or Edit Form (editing mode) */}
        {!editing ? (
          session.extracted_data?.admin_notes && (
            <SectionCard title="Admin Notes" icon={PiNoteBold}>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {session.extracted_data.admin_notes}
              </p>
            </SectionCard>
          )
        ) : (
          <SectionCard title="Admin Notes">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this KYC session..."
                rows={3}
              />
            </div>
          </SectionCard>
        )}

        {/* Save/Cancel Buttons (editing mode) */}
        {editing && (
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {saving ? (
                <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PiFloppyDiskBold className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
