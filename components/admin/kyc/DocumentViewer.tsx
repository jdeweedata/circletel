'use client';

/**
 * KYC Document Viewer Component
 * Displays KYC documents (PDF/images) with approve/reject functionality
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KycDocument {
  id: string;
  consumer_order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  document_type: string;
  document_title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  verification_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface DocumentViewerProps {
  document: KycDocument;
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function DocumentViewer({
  document,
  onClose,
  onStatusChange,
}: DocumentViewerProps) {
  const [verificationNotes, setVerificationNotes] = useState(
    document.verification_notes || ''
  );
  const [rejectionReason, setRejectionReason] = useState(
    document.rejection_reason || ''
  );
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Get signed URL for document
  const fetchDocumentUrl = async () => {
    try {
      const response = await fetch(
        `/api/admin/kyc/document-url?path=${encodeURIComponent(document.file_path)}`
      );
      const data = await response.json();
      if (data.success) {
        setDocumentUrl(data.url);
      }
    } catch (error) {
      console.error('Failed to fetch document URL:', error);
    }
  };

  // Load document URL on mount
  useState(() => {
    fetchDocumentUrl();
  });

  // Handle approve
  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          status: 'approved',
          notes: verificationNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange?.();
        onClose();
      } else {
        alert('Failed to approve document: ' + data.error);
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve document');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kyc/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          status: 'rejected',
          notes: verificationNotes,
          rejectionReason,
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange?.();
        onClose();
      } else {
        alert('Failed to reject document: ' + data.error);
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject document');
    } finally {
      setLoading(false);
    }
  };

  // Download document
  const handleDownload = () => {
    if (documentUrl) {
      const link = window.document.createElement('a');
      link.href = documentUrl;
      link.download = document.file_name;
      link.click();
    }
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_document: 'ID Document',
      proof_of_address: 'Proof of Address',
      bank_statement: 'Bank Statement',
      company_registration: 'Company Registration',
      tax_certificate: 'Tax Certificate',
      vat_certificate: 'VAT Certificate',
      director_id: 'Director ID',
      shareholder_agreement: 'Shareholder Agreement',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Pending
        </Badge>
      ),
      under_review: (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Under Review
        </Badge>
      ),
      approved: (
        <Badge variant="default" className="bg-green-500">
          Approved
        </Badge>
      ),
      rejected: <Badge variant="destructive">Rejected</Badge>,
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{document.document_title}</h2>
              {getStatusBadge(document.verification_status)}
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Customer:</strong> {document.customer_name} (
                {document.customer_email})
              </p>
              <p>
                <strong>Type:</strong>{' '}
                {getDocumentTypeLabel(document.document_type)}
              </p>
              <p>
                <strong>File:</strong> {document.file_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="p-6">
          <Card className="mb-6">
            <CardContent className="p-6">
              {documentUrl ? (
                <>
                  {isPDF && (
                    <iframe
                      src={documentUrl}
                      className="w-full h-[600px] border rounded"
                      title="Document Preview"
                    />
                  )}
                  {isImage && (
                    <img
                      src={documentUrl}
                      alt="Document Preview"
                      className="w-full h-auto max-h-[600px] object-contain border rounded"
                    />
                  )}
                  {!isPDF && !isImage && (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600">
                        Preview not available for this file type
                      </p>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="mt-4"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-600 mt-2">Loading document...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Verification Notes
            </label>
            <Textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add any notes about this document..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-red-600">
                Rejection Reason *
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejecting this document..."
                rows={3}
                disabled={loading}
                className="border-red-300 focus:border-red-500"
              />
            </div>
          )}

          {/* Actions */}
          {document.verification_status !== 'approved' &&
            document.verification_status !== 'rejected' && (
              <div className="flex items-center justify-end gap-3">
                {showRejectForm ? (
                  <>
                    <Button
                      onClick={() => setShowRejectForm(false)}
                      variant="outline"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Confirm Rejection
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve Document
                    </Button>
                  </>
                )}
              </div>
            )}

          {/* Already processed message */}
          {(document.verification_status === 'approved' ||
            document.verification_status === 'rejected') && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                This document has already been{' '}
                {document.verification_status === 'approved'
                  ? 'approved'
                  : 'rejected'}
                .
              </p>
              {document.verified_at && (
                <p className="text-sm text-gray-500 mt-1">
                  Processed on{' '}
                  {new Date(document.verified_at).toLocaleString('en-ZA')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
