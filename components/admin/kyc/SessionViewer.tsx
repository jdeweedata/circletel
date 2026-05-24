'use client';
import { PiBuildingsBold, PiEnvelopeBold, PiFloppyDiskBold, PiPackageBold, PiPencilSimpleBold, PiPhoneBold, PiSpinnerBold, PiUserBold, PiXBold } from 'react-icons/pi';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DiditVerificationLinks from './DiditVerificationLinks';

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
  order?: {
    id: string;
    order_number: string;
    status: string;
  } | null;
  quote?: {
    id: string;
    contact_name: string;
    contact_email: string;
    company_name?: string;
  }[] | null;
}

interface SessionViewerProps {
  session: KycSession;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function SessionViewer({ session, onClose, onStatusChange }: SessionViewerProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState(session.verification_result || '');
  const [riskTier, setRiskTier] = useState(session.risk_tier || '');
  const [idNumber, setIdNumber] = useState(session.extracted_data?.id_number || '');
  const [fullName, setFullName] = useState(session.extracted_data?.full_name || '');
  const [companyReg, setCompanyReg] = useState(session.extracted_data?.company_registration || '');
  const [proofOfAddress, setProofOfAddress] = useState(session.extracted_data?.proof_of_address || '');
  const [adminNotes, setAdminNotes] = useState(session.extracted_data?.admin_notes || '');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFlowTypeLabel = (flowType: string) => {
    const labels: Record<string, string> = {
      sme_light: 'SME Light (< R500k)',
      consumer_light: 'Consumer Light',
      consumer_light_kyc: 'Consumer Light KYC',
      full_kyc: 'Full KYC (≥ R500k)',
    };
    return labels[flowType] || flowType;
  };

  const getUserTypeBadge = (userType: string) => {
    return userType === 'business' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <PiBuildingsBold className="w-3 h-3 mr-1" />
        Business
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <PiUserBold className="w-3 h-3 mr-1" />
        Consumer
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.JSX.Element> = {
      not_started: (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Not Started
        </Badge>
      ),
      in_progress: (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          In Progress
        </Badge>
      ),
      completed: (
        <Badge variant="default" className="bg-green-500">
          Completed
        </Badge>
      ),
      abandoned: (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Abandoned
        </Badge>
      ),
      declined: <Badge variant="destructive">Declined</Badge>,
    };
    return badges[status] || badges.not_started;
  };

  const getRiskTierBadge = (tier?: string | null) => {
    if (!tier) return null;

    const badges: Record<string, React.JSX.Element> = {
      low: (
        <Badge variant="default" className="bg-green-500">
          Low Risk
        </Badge>
      ),
      medium: (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Medium Risk
        </Badge>
      ),
      high: <Badge variant="destructive">High Risk</Badge>,
    };
    return badges[tier];
  };

  const getVerificationResultBadge = (result?: string | null) => {
    if (!result) return null;
    const badges: Record<string, React.JSX.Element> = {
      approved: <Badge variant="default" className="bg-green-500">Approved</Badge>,
      declined: <Badge variant="destructive">Declined</Badge>,
      pending_review: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>,
    };
    return badges[result];
  };

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

      setEditing(false);
      onStatusChange?.();
    } catch (err) {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setVerificationResult(session.verification_result || '');
    setRiskTier(session.risk_tier || '');
    setIdNumber(session.extracted_data?.id_number || '');
    setFullName(session.extracted_data?.full_name || '');
    setCompanyReg(session.extracted_data?.company_registration || '');
    setProofOfAddress(session.extracted_data?.proof_of_address || '');
    setAdminNotes(session.extracted_data?.admin_notes || '');
    setEditing(false);
    setError(null);
  };

  const quote = Array.isArray(session.quote) && session.quote.length > 0 ? session.quote[0] : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between rounded-t-lg">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-2xl font-bold">KYC Session Details</h2>
              {getStatusBadge(session.status)}
              {getUserTypeBadge(session.user_type)}
              {!editing && getRiskTierBadge(session.risk_tier)}
              {!editing && getVerificationResultBadge(session.verification_result)}
            </div>
            <p className="text-sm text-gray-600">
              Flow Type: {getFlowTypeLabel(session.flow_type)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                <PiPencilSimpleBold className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm">
              <PiXBold className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Edit Section — Verification & Risk */}
          {editing && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <PiPencilSimpleBold className="w-5 h-5 text-orange-600" />
                  Update Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>
          )}

          {/* Edit Section — Extracted Data */}
          {editing && (
            <Card className="border-orange-200 bg-orange-50/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Customer KYC Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name from ID document" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID Number</label>
                    <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="SA ID or passport number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Registration</label>
                    <Input value={companyReg} onChange={(e) => setCompanyReg(e.target.value)} placeholder="Company registration number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Proof of Address</label>
                    <Input value={proofOfAddress} onChange={(e) => setProofOfAddress(e.target.value)} placeholder="Address verification status" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes about this KYC session..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <PiUserBold className="w-5 h-5 text-gray-600" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Name</p>
                  <p className="font-medium">{session.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <PiEnvelopeBold className="w-4 h-4 text-gray-400" />
                    {session.customer_email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <PiPhoneBold className="w-4 h-4 text-gray-400" />
                    {session.customer_phone}
                  </p>
                </div>
                {quote?.company_name && (
                  <div>
                    <p className="text-gray-600 mb-1">Company</p>
                    <p className="font-medium flex items-center gap-2">
                      <PiBuildingsBold className="w-4 h-4 text-gray-400" />
                      {quote.company_name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order/Quote Information */}
          {(session.order || quote) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <PiPackageBold className="w-5 h-5 text-gray-600" />
                  {session.order ? 'Order Information' : 'Quote Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {session.order && (
                    <>
                      <div>
                        <p className="text-gray-600 mb-1">Order Number</p>
                        <p className="font-medium">{session.order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Order Status</p>
                        <p className="font-medium">{session.order.status}</p>
                      </div>
                    </>
                  )}
                  {quote && !session.order && (
                    <>
                      <div>
                        <p className="text-gray-600 mb-1">Quote Contact</p>
                        <p className="font-medium">{quote.contact_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Quote Email</p>
                        <p className="font-medium">{quote.contact_email}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Didit Verification Links */}
          <DiditVerificationLinks
            sessionId={session.id}
            diditSessionId={session.didit_session_id}
            extractedData={session.extracted_data}
            verificationResult={session.verification_result}
            status={session.status}
          />

          {/* Session Timeline */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">Session Timeline</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDate(session.created_at)}</span>
                </div>
                {session.completed_at && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium">{formatDate(session.completed_at)}</span>
                  </div>
                )}
                {session.extracted_data?.verification_date && (
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Verified</span>
                    <span className="font-medium">
                      {formatDate(session.extracted_data.verification_date)}
                    </span>
                  </div>
                )}
                {session.extracted_data?.last_admin_update && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Admin Update</span>
                    <span className="font-medium text-orange-600">
                      {formatDate(session.extracted_data.last_admin_update)}
                      {session.extracted_data?.updated_by && (
                        <span className="text-gray-400 ml-2">by {session.extracted_data.updated_by}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes (read-only when not editing) */}
          {!editing && session.extracted_data?.admin_notes && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Admin Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.extracted_data.admin_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Raw Webhook Data (for debugging) */}
          {session.extracted_data && Object.keys(session.extracted_data).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-4">Additional Data</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                  <pre>{JSON.stringify(session.extracted_data, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end gap-3">
            {editing ? (
              <>
                <Button onClick={handleCancel} variant="outline" disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                  {saving ? (
                    <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PiFloppyDiskBold className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
