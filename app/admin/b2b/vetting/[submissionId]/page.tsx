'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiArrowLeftBold,
  PiCheckCircleBold,
  PiXCircleBold,
  PiWarningCircleBold,
  PiDownloadSimpleBold,
  PiEyeBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { requiredDocsFor } from '@/lib/onboarding/document-requirements';

interface SubmissionDetail {
  id: string;
  customer_id: string;
  segment: string;
  status: string;
  document_vetting_status: string;
  submission_data: any;
  admin_reviewed_at: string | null;
  admin_reviewed_by: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  customers: {
    id: string;
    account_number: string;
    business_name: string;
    email: string;
    phone: string;
  } | null;
  documents: Array<{
    id: string;
    document_type: string;
    file_path: string;
    verification_status: string;
    rejection_reason: string | null;
    verified_at: string | null;
  }>;
  paymentMethods: Array<{
    id: string;
    display_name: string;
    mandate_status: string;
    encrypted_details: any;
  }>;
  nameMatch: boolean;
}

function getVettingStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'text-green-600 bg-green-50';
    case 'rejected':
      return 'text-red-600 bg-red-50';
    case 'under_review':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function getDocStatusIcon(status: string) {
  switch (status) {
    case 'approved':
      return <PiCheckCircleBold className="w-4 h-4 text-green-600" />;
    case 'rejected':
      return <PiXCircleBold className="w-4 h-4 text-red-600" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-300" />;
  }
}

export default function B2BVettingDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string>('');

  // Handle async params
  useEffect(() => {
    params.then((p) => {
      setSubmissionId(p.submissionId);
    });
  }, [params]);

  // Fetch submission details
  useEffect(() => {
    if (!submissionId) return;

    async function fetchSubmission() {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/b2b/vetting/${submissionId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }

        const data = await response.json();
        setSubmission(data.submission);
      } catch (error) {
        console.error('Error fetching submission:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId]);

  // Fetch signed URL for selected document
  useEffect(() => {
    if (!selectedDoc || !submission) return;

    async function fetchDocUrl(sub: SubmissionDetail) {
      try {
        const doc = sub.documents.find((d) => d.id === selectedDoc);
        if (!doc) return;

        const response = await fetch(
          `/api/admin/kyc/document-url?path=${encodeURIComponent(doc.file_path)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to get document URL');

        const data = await response.json();
        setDocUrl(data.url);
      } catch (error) {
        console.error('Error fetching document URL:', error);
      }
    }

    fetchDocUrl(submission);
  }, [selectedDoc, submission]);

  if (!submissionId) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-600">Submission not found</p>
      </main>
    );
  }

  const step2 = submission.submission_data?.step2;
  const requiredDocs = requiredDocsFor(submission.segment as any, {
    vatRegistered: step2?.vat === 'Yes',
    entityType: step2?.entityType || '',
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <PiArrowLeftBold /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {submission.customers?.business_name || 'Submission'}
          </h1>
          <p className="text-gray-600">
            {submission.customers?.account_number} · {submission.segment}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`mb-6 ${getVettingStatusColor(submission.document_vetting_status)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {submission.document_vetting_status === 'approved' && (
                <PiCheckCircleBold className="w-6 h-6" />
              )}
              {submission.document_vetting_status === 'rejected' && (
                <PiXCircleBold className="w-6 h-6" />
              )}
              {['documents_pending', 'under_review'].includes(
                submission.document_vetting_status
              ) && <PiWarningCircleBold className="w-6 h-6" />}

              <div>
                <p className="font-semibold capitalize">
                  {submission.document_vetting_status.replace(/_/g, ' ')}
                </p>
                {submission.admin_reviewed_at && (
                  <p className="text-sm opacity-75">
                    Reviewed{' '}
                    {new Date(submission.admin_reviewed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Document Checklist</CardTitle>
              <CardDescription>
                Upload and verification status of required documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {requiredDocs
                .filter((d) => d.required)
                .map((req) => {
                  const doc = submission.documents.find(
                    (d) => d.document_type === req.type
                  );
                  return (
                    <div
                      key={req.type}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{req.label}</p>
                        {doc && (
                          <p className="text-sm text-gray-600">
                            {doc.verification_status === 'approved' && (
                              <span className="text-green-600">Approved</span>
                            )}
                            {doc.verification_status === 'rejected' && (
                              <span className="text-red-600">
                                Rejected:{' '}
                                {doc.rejection_reason && (
                                  <span className="block text-xs mt-1">
                                    {doc.rejection_reason}
                                  </span>
                                )}
                              </span>
                            )}
                            {doc.verification_status === 'pending' && (
                              <span className="text-amber-600">Pending</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc && getDocStatusIcon(doc.verification_status)}
                        {doc && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedDoc(doc.id)}
                            className="gap-1"
                          >
                            <PiEyeBold className="w-4 h-4" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          {/* Document Viewer */}
          {selectedDoc && docUrl && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Document Preview</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(docUrl, '_blank')}
                  className="gap-1"
                >
                  <PiDownloadSimpleBold className="w-4 h-4" />
                  Open
                </Button>
              </CardHeader>
              <CardContent>
                {docUrl.toLowerCase().includes('.pdf') ? (
                  <div className="bg-gray-100 rounded p-4 h-96">
                    <iframe
                      src={docUrl}
                      className="w-full h-full rounded"
                      title="Document preview"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded p-4 h-96 flex items-center justify-center">
                    <img
                      src={docUrl}
                      alt="Document"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          {/* Entity Information */}
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Business Name</p>
                <p className="font-medium">{step2?.entityName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Entity Type</p>
                <p className="font-medium">{step2?.entityType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Registration Number</p>
                <p className="font-mono text-sm">{step2?.regNumber || '-'}</p>
              </div>
              {step2?.vat === 'Yes' && (
                <div>
                  <p className="text-sm text-gray-600">VAT Number</p>
                  <p className="font-mono text-sm">{step2?.vatNumber || '-'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banking Information */}
          {submission.paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Banking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.paymentMethods.map((pm) => {
                  const encrypted = pm.encrypted_details || {};
                  return (
                    <div key={pm.id} className="space-y-2 p-3 border rounded">
                      <div>
                        <p className="text-sm text-gray-600">Account Holder</p>
                        <p className="font-medium text-sm">
                          {encrypted.account_holder_name || '-'}
                        </p>
                        {!submission.nameMatch && (
                          <div className="flex gap-2 items-start mt-2 p-2 bg-amber-50 rounded">
                            <PiWarningCircleBold className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                              Account holder should match registered entity name
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bank</p>
                        <p className="font-medium text-sm">{encrypted.bank_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Account Type</p>
                        <p className="text-sm">{encrypted.account_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Account Number</p>
                        <p className="font-mono text-sm">
                          ****{encrypted.account_number?.slice(-4) || '****'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Branch Code</p>
                        <p className="font-mono text-sm">{encrypted.branch_code || '-'}</p>
                      </div>
                      <div className="pt-2">
                        <Badge
                          variant={
                            pm.mandate_status === 'active' ? 'default' : 'secondary'
                          }
                        >
                          {pm.mandate_status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm break-all">{submission.customers?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-sm">{submission.customers?.phone || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Submitted Date */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-sm">
                  {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
