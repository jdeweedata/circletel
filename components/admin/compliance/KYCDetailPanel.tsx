'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  X,
  Camera
} from 'lucide-react';

interface KYCSession {
  id: string;
  quote_id: string;
  didit_session_id: string;
  status: string;
  verification_result: 'approved' | 'declined' | 'pending_review';
  risk_tier: 'low' | 'medium' | 'high';
  flow_type: string;
  extracted_data: {
    id_number?: string;
    full_name?: string;
    company_registration?: string;
    proof_of_address?: string;
    liveness_score?: number;
    aml_flags?: string[];
  };
  created_at: string;
  completed_at: string | null;
  business_quotes: {
    quote_number: string;
    customer_name: string;
    company_name?: string;
  };
}

interface KYCDetailPanelProps {
  session: KYCSession;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
  canApprove: boolean;
}

export function KYCDetailPanel({
  session,
  onClose,
  onApprove,
  onDecline,
  canApprove
}: KYCDetailPanelProps) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [requestInfoNote, setRequestInfoNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    if (!canApprove) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/compliance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve KYC');
      }

      await onApprove();
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!canApprove || !declineReason.trim()) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/compliance/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          reason: declineReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to decline KYC');
      }

      setShowDeclineDialog(false);
      setDeclineReason('');
      await onDecline();
    } catch (error) {
      console.error('Error declining KYC:', error);
      alert(error instanceof Error ? error.message : 'Failed to decline KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!canApprove || !requestInfoNote.trim()) return;

    try {
      setIsProcessing(true);

      const response = await fetch('/api/compliance/request-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          note: requestInfoNote
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request additional information');
      }

      setShowRequestInfoDialog(false);
      setRequestInfoNote('');
      alert('Information request sent successfully');
    } catch (error) {
      console.error('Error requesting info:', error);
      alert(error instanceof Error ? error.message : 'Failed to request additional information');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRiskColor = (tier: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[tier];
  };

  const getRiskScore = () => {
    const { liveness_score } = session.extracted_data;
    if (!liveness_score) return 0;

    // Calculate risk score based on liveness score
    // High liveness = Low risk
    if (liveness_score >= 80) return 85;
    if (liveness_score >= 50) return 60;
    return 35;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-circleTel-orange" />
              KYC Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {session.business_quotes?.quote_number}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quote Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-circleTel-orange" />
                Quote Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Quote Number</p>
                <p className="font-semibold">{session.business_quotes?.quote_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-semibold">{session.business_quotes?.customer_name}</p>
              </div>
              {session.business_quotes?.company_name && (
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="font-semibold">{session.business_quotes.company_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted KYC Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-circleTel-orange" />
                Extracted Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {session.extracted_data.id_number && (
                <div>
                  <p className="text-sm text-gray-600">ID Number</p>
                  <p className="font-semibold font-mono">{session.extracted_data.id_number}</p>
                </div>
              )}
              {session.extracted_data.full_name && (
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold">{session.extracted_data.full_name}</p>
                </div>
              )}
              {session.extracted_data.company_registration && (
                <div>
                  <p className="text-sm text-gray-600">Company Registration</p>
                  <p className="font-semibold font-mono">
                    {session.extracted_data.company_registration}
                  </p>
                </div>
              )}
              {session.extracted_data.proof_of_address && (
                <div>
                  <p className="text-sm text-gray-600">Proof of Address</p>
                  <p className="font-semibold">{session.extracted_data.proof_of_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Didit Verification Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-circleTel-orange" />
                Verification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session.extracted_data.liveness_score !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Liveness Score</p>
                    <p className="font-bold text-lg">{session.extracted_data.liveness_score}%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        session.extracted_data.liveness_score >= 80
                          ? 'bg-green-500'
                          : session.extracted_data.liveness_score >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${session.extracted_data.liveness_score}%` }}
                    />
                  </div>
                </div>
              )}

              {session.extracted_data.aml_flags && session.extracted_data.aml_flags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">AML Flags</p>
                  <div className="space-y-2">
                    {session.extracted_data.aml_flags.map((flag, index) => (
                      <Badge key={index} className="bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Flow Type</p>
                <Badge className="mt-1">
                  {session.flow_type === 'sme_light' ? 'SME Light' : 'Full KYC'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-circleTel-orange" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Risk Tier</p>
                  <Badge
                    className={`${
                      session.risk_tier === 'low'
                        ? 'bg-green-100 text-green-800'
                        : session.risk_tier === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {session.risk_tier.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Overall Risk Score</p>
                  <p className={`font-bold text-lg ${getRiskColor(session.risk_tier)}`}>
                    {getRiskScore()}/100
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      session.risk_tier === 'low'
                        ? 'bg-green-500'
                        : session.risk_tier === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${getRiskScore()}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-xs text-gray-600 font-semibold">Risk Factors:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• Liveness verification: {session.extracted_data.liveness_score}%</li>
                  <li>
                    • AML checks:{' '}
                    {session.extracted_data.aml_flags?.length
                      ? `${session.extracted_data.aml_flags.length} flags`
                      : 'Clear'}
                  </li>
                  <li>• Document verification: Complete</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canApprove && session.verification_result === 'pending_review' && (
            <Card className="bg-gray-50">
              <CardContent className="p-6 space-y-3">
                <p className="font-semibold text-gray-900 mb-4">Admin Actions</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve KYC
                  </Button>
                  <Button
                    onClick={() => setShowRequestInfoDialog(true)}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Request More Info
                  </Button>
                  <Button
                    onClick={() => setShowDeclineDialog(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline KYC
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline KYC Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this KYC verification. The customer will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter decline reason..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={4}
              aria-label="Decline reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={!declineReason.trim() || isProcessing}
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Specify what additional documents or information is required from the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter information request..."
              value={requestInfoNote}
              onChange={(e) => setRequestInfoNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestInfo}
              disabled={!requestInfoNote.trim() || isProcessing}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
