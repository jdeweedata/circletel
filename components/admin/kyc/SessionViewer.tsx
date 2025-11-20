'use client';

/**
 * KYC Session Viewer Component
 * Displays KYC session details with Didit verification links
 */

import { X, User, Mail, Phone, Building2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

export default function SessionViewer({ session, onClose }: SessionViewerProps) {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get flow type label
  const getFlowTypeLabel = (flowType: string) => {
    const labels: Record<string, string> = {
      sme_light: 'SME Light (< R500k)',
      consumer_light: 'Consumer Light',
      full_kyc: 'Full KYC (≥ R500k)',
    };
    return labels[flowType] || flowType;
  };

  // Get user type badge
  const getUserTypeBadge = (userType: string) => {
    return userType === 'business' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
        <Building2 className="w-3 h-3 mr-1" />
        Business
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <User className="w-3 h-3 mr-1" />
        Consumer
      </Badge>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
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

  // Get risk tier badge
  const getRiskTierBadge = (tier?: string | null) => {
    if (!tier) return null;

    const badges: Record<string, JSX.Element> = {
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
              {getRiskTierBadge(session.risk_tier)}
            </div>
            <p className="text-sm text-gray-600">
              Flow Type: {getFlowTypeLabel(session.flow_type)}
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Customer Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
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
                    <Mail className="w-4 h-4 text-gray-400" />
                    {session.customer_email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {session.customer_phone}
                  </p>
                </div>
                {quote?.company_name && (
                  <div>
                    <p className="text-gray-600 mb-1">Company</p>
                    <p className="font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
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
                  <Package className="w-5 h-5 text-gray-600" />
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Verified</span>
                    <span className="font-medium">
                      {formatDate(session.extracted_data.verification_date)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
