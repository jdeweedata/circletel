'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiArrowSquareOutBold,
  PiBankBold,
  PiCheckBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiClockBold,
  PiFileTextBold,
  PiInfoBold,
  PiMapPinBold,
  PiUserBold,
  PiWarningCircleBold,
  PiXBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/backend';
import { requiredDocsFor, type DocRequirement } from '@/lib/onboarding/document-requirements';
import { cn } from '@/lib/utils';

interface SubmissionStep2 {
  entityName?: string;
  entityType?: string;
  regNumber?: string;
  vat?: string;
  vatNumber?: string;
  [key: string]: unknown;
}

interface SubmissionDetail {
  id: string;
  customer_id: string;
  segment: string;
  status: string;
  document_vetting_status: string;
  submission_data: {
    step2?: SubmissionStep2;
    [key: string]: unknown;
  } | null;
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
    clinic_details?: {
      site_address?: string;
      lat?: string | number;
      lng?: string | number;
      [key: string]: unknown;
    };
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
    encrypted_details: {
      account_holder_name?: string;
      bank_name?: string;
      account_type?: string;
      account_number?: string;
      branch_code?: string;
      [key: string]: unknown;
    } | null;
  }>;
  nameMatch: boolean;
}

interface RequiredDocItem {
  requirement: DocRequirement;
  document: SubmissionDetail['documents'][number] | null;
}

type DocumentActionStatus = 'approved' | 'rejected' | 'under_review';

const dateTimeFormatter = new Intl.DateTimeFormat('en-ZA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('en-ZA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateTimeFormatter.format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
}

function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

function vettingStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'under_review':
      return 'info';
    case 'documents_pending':
      return 'warning';
    default:
      return 'neutral';
  }
}

function documentStatusMeta(status: string): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon: React.ReactNode;
} {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        variant: 'success',
        icon: <PiCheckCircleBold className="h-4 w-4 text-green-600" />,
      };
    case 'rejected':
      return {
        label: 'Changes requested',
        variant: 'error',
        icon: <PiXCircleBold className="h-4 w-4 text-red-600" />,
      };
    case 'under_review':
      return {
        label: 'Under review',
        variant: 'info',
        icon: <PiInfoBold className="h-4 w-4 text-blue-600" />,
      };
    case 'pending':
    default:
      return {
        label: 'Needs review',
        variant: 'warning',
        icon: <PiWarningCircleBold className="h-4 w-4 text-amber-600" />,
      };
  }
}

function maskAccountNumber(value: string | undefined) {
  if (!value) return '-';
  const lastFour = value.slice(-4);
  return lastFour ? `****${lastFour}` : '-';
}

function isPdfDocument(documentPath: string | undefined, signedUrl: string | null) {
  const target = `${documentPath ?? ''} ${signedUrl ?? ''}`.toLowerCase();
  return target.includes('.pdf');
}

export default function B2BVettingDetailPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [reviewReasonText, setReviewReasonText] = useState<string>('');
  const [reviewReasonError, setReviewReasonError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mandateConfirming, setMandateConfirming] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setSubmissionId(p.submissionId);
    });
  }, [params]);

  const fetchSubmission = useCallback(async (options?: { showLoading?: boolean }) => {
    if (!submissionId) return;

    const showLoading = options?.showLoading ?? true;
    if (showLoading) setLoading(true);
    setActionError(null);
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
      setActionError('Failed to load submission');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  const step2 = submission?.submission_data?.step2;

  const requiredDocItems = useMemo<RequiredDocItem[]>(() => {
    if (!submission) return [];

    return requiredDocsFor(submission.segment as any, {
      vatRegistered: step2?.vat === 'Yes',
      entityType: step2?.entityType || '',
    })
      .filter((requirement) => requirement.required)
      .map((requirement) => ({
        requirement,
        document:
          submission.documents.find(
            (document) => document.document_type === requirement.type
          ) ?? null,
      }));
  }, [submission, step2?.entityType, step2?.vat]);

  const selectedDocument = useMemo(() => {
    if (!submission || !selectedDoc) return null;
    return submission.documents.find((document) => document.id === selectedDoc) ?? null;
  }, [selectedDoc, submission]);

  const selectedRequirement = useMemo(() => {
    return (
      requiredDocItems.find((item) => item.document?.id === selectedDocument?.id)
        ?.requirement ?? null
    );
  }, [requiredDocItems, selectedDocument?.id]);

  const docCounts = useMemo(() => {
    const requiredWithDocs = requiredDocItems.filter((item) => item.document);
    const approved = requiredWithDocs.filter(
      (item) => item.document?.verification_status === 'approved'
    ).length;
    const changesRequested = requiredWithDocs.filter(
      (item) => item.document?.verification_status === 'rejected'
    ).length;
    const missing = requiredDocItems.filter((item) => !item.document).length;
    const needsDecision = requiredWithDocs.filter(
      (item) => item.document?.verification_status !== 'approved'
    ).length;

    return {
      approved,
      changesRequested,
      missing,
      needsDecision,
      total: requiredDocItems.length,
    };
  }, [requiredDocItems]);

  useEffect(() => {
    if (!submission) return;

    const selectedStillExists =
      selectedDoc && submission.documents.some((document) => document.id === selectedDoc);
    if (selectedStillExists) return;

    const firstRequiredDocument =
      requiredDocItems.find((item) => item.document)?.document ??
      submission.documents[0] ??
      null;

    setSelectedDoc(firstRequiredDocument?.id ?? null);
  }, [requiredDocItems, selectedDoc, submission]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocUrl(documentId: string, filePath: string) {
      setDocLoading(true);
      setDocUrl(null);
      setDocError(null);

      try {
        const response = await fetch(
          `/api/admin/kyc/document-url?path=${encodeURIComponent(filePath)}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
            },
          }
        );

        if (!response.ok) throw new Error('Failed to get document URL');

        const data = await response.json();
        if (!cancelled && selectedDoc === documentId) {
          setDocUrl(data.url);
        }
      } catch (error) {
        console.error('Error fetching document URL:', error);
        if (!cancelled) {
          setDocError('Document preview could not be loaded.');
        }
      } finally {
        if (!cancelled) {
          setDocLoading(false);
        }
      }
    }

    if (!selectedDocument) {
      setDocUrl(null);
      setDocLoading(false);
      setDocError(null);
      return;
    }

    fetchDocUrl(selectedDocument.id, selectedDocument.file_path);

    return () => {
      cancelled = true;
    };
  }, [docRefreshKey, selectedDoc, selectedDocument]);

  const handleDocumentAction = async (
    documentId: string,
    status: DocumentActionStatus,
    reason?: string
  ) => {
    const trimmedReason = reason?.trim() ?? '';

    if (status === 'rejected' && !trimmedReason) {
      setReviewReasonError('Add a clear reason before sending the change request.');
      return;
    }

    const actionKey = `${documentId}-${status}`;
    setActionInFlight(actionKey);
    setActionError(null);

    try {
      const body: {
        documentId: string;
        status: DocumentActionStatus;
        rejectionReason?: string;
        notes?: string;
      } = { documentId, status };

      if (status === 'rejected') {
        body.rejectionReason = trimmedReason;
      } else if (status === 'under_review' && trimmedReason) {
        body.notes = trimmedReason;
      }

      const response = await fetch('/api/admin/kyc/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to update document');
      }

      setChangeRequestOpen(false);
      setReviewReasonText('');
      setReviewReasonError(null);
      await fetchSubmission({ showLoading: false });
    } catch (error) {
      console.error('Error updating document:', error);
      setActionError(
        error instanceof Error ? error.message : 'Failed to update document'
      );
    } finally {
      setActionInFlight(null);
    }
  };

  const handleConfirmMandate = async () => {
    if (!submission?.customers?.id) return;

    setMandateConfirming(true);
    setActionError(null);

    try {
      const response = await fetch('/api/admin/b2b/mandate-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({ customerId: submission.customers.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to confirm mandate');
      }

      await fetchSubmission({ showLoading: false });
    } catch (error) {
      console.error('Error confirming mandate:', error);
      setActionError(
        error instanceof Error ? error.message : 'Failed to confirm mandate'
      );
    } finally {
      setMandateConfirming(false);
    }
  };

  if (!submissionId) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState message="Loading submission…" />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState message="Loading vetting submission…" />
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState
          title="Submission not found"
          message={actionError ?? 'The selected vetting submission could not be loaded.'}
          onRetry={fetchSubmission}
        />
      </main>
    );
  }

  const selectedStatus = selectedDocument
    ? documentStatusMeta(selectedDocument.verification_status)
    : null;
  const selectedIsApproved = selectedDocument?.verification_status === 'approved';
  const selectedIsRejected = selectedDocument?.verification_status === 'rejected';
  const selectedActionPrefix = selectedDocument?.id ?? '';
  const decisionDisabled =
    !selectedDocument || docLoading || Boolean(docError) || actionInFlight?.startsWith(selectedActionPrefix);
  const selectedIsPdf = isPdfDocument(selectedDocument?.file_path, docUrl);
  const primaryPaymentMethod = submission.paymentMethods[0];
  const primaryBanking = primaryPaymentMethod?.encrypted_details ?? {};

  return (
    <main className="max-w-[1500px] mx-auto px-4 py-8">
      <PageHeader
        title={submission.customers?.business_name || 'Vetting submission'}
        subtitle={`${submission.customers?.account_number ?? 'No account number'} · ${submission.segment} · Submitted ${formatDateTime(submission.submitted_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={formatStatusLabel(submission.document_vetting_status)}
              variant={vettingStatusVariant(submission.document_vetting_status)}
              showDot
              className="capitalize"
            />
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/admin/b2b/vetting">
                <PiArrowLeftBold className="h-4 w-4" />
                Back to Vetting Queue
              </Link>
            </Button>
          </div>
        }
      />

      {actionError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-700">{actionError}</p>
          </CardContent>
        </Card>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Document Progress"
          value={`${docCounts.approved}/${docCounts.total}`}
          subtitle="Required docs approved"
          icon={<PiFileTextBold className="h-5 w-5" />}
        />
        <StatCard
          label="Needs Decision"
          value={docCounts.needsDecision}
          subtitle={
            docCounts.changesRequested > 0
              ? `${docCounts.changesRequested} with changes requested`
              : 'Open items remaining'
          }
          icon={<PiClipboardTextBold className="h-5 w-5" />}
        />
        <StatCard
          label="Missing Documents"
          value={docCounts.missing}
          subtitle="Required uploads not found"
          icon={<PiWarningCircleBold className="h-5 w-5" />}
        />
        <StatCard
          label="Last Reviewed"
          value={formatDate(submission.admin_reviewed_at)}
          subtitle={submission.admin_reviewed_at ? formatDateTime(submission.admin_reviewed_at) : 'No review yet'}
          icon={<PiClockBold className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Required documents</CardTitle>
            <CardDescription>Select a document before making a decision.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {requiredDocItems.map((item) => {
              const document = item.document;
              const status = document
                ? documentStatusMeta(document.verification_status)
                : {
                    label: 'Missing',
                    variant: 'neutral' as const,
                    icon: <PiFileTextBold className="h-4 w-4 text-gray-400" />,
                  };
              const active = document?.id === selectedDocument?.id;

              return (
                <button
                  key={item.requirement.type}
                  type="button"
                  disabled={!document}
                  onClick={() => {
                    if (!document) return;
                    setSelectedDoc(document.id);
                    setChangeRequestOpen(false);
                    setReviewReasonText('');
                    setReviewReasonError(null);
                  }}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    active
                      ? 'border-circleTel-orange bg-circleTel-orange-light'
                      : 'border-gray-200 bg-white hover:bg-gray-50',
                    !document && 'cursor-not-allowed opacity-70'
                  )}
                  aria-pressed={active}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{status.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{item.requirement.label}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge
                          status={status.label}
                          variant={status.variant}
                          className="capitalize"
                        />
                        {document && (
                          <span className="text-xs text-gray-500">
                            Reviewed {formatDate(document.verified_at)}
                          </span>
                        )}
                      </div>
                      {document?.rejection_reason && (
                        <p className="mt-2 rounded-md bg-red-50 p-2 text-xs font-medium text-red-700">
                          {document.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>{selectedRequirement?.label ?? 'Document preview'}</CardTitle>
                <CardDescription>
                  {selectedDocument
                    ? `File type: ${selectedIsPdf ? 'PDF' : 'image or document'}`
                    : 'Select a document from the checklist.'}
                </CardDescription>
              </div>
              {selectedStatus && (
                <StatusBadge
                  status={selectedStatus.label}
                  variant={selectedStatus.variant}
                  icon={selectedStatus.icon}
                />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-sm font-medium text-gray-600">
                  {docLoading
                    ? 'Loading document…'
                    : docError
                      ? 'Preview failed to load'
                      : docUrl
                        ? 'Preview opened'
                        : 'No preview selected'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDocRefreshKey((key) => key + 1)}
                    disabled={!selectedDocument || docLoading}
                  >
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
                    disabled={!docUrl}
                    className="gap-1"
                  >
                    <PiArrowSquareOutBold className="h-4 w-4" />
                    Open original
                  </Button>
                </div>
              </div>

              <div className="min-h-[520px] rounded-lg border border-gray-200 bg-gray-100 p-3">
                {!selectedDocument && (
                  <EmptyState
                    icon={<PiFileTextBold />}
                    title="No document selected"
                    description="Choose a required document to inspect it."
                    className="min-h-[480px]"
                  />
                )}

                {selectedDocument && docLoading && (
                  <LoadingState
                    message="Loading document…"
                    className="min-h-[480px]"
                  />
                )}

                {selectedDocument && !docLoading && docError && (
                  <ErrorState
                    title="Document preview unavailable"
                    message={docError}
                    onRetry={() => setDocRefreshKey((key) => key + 1)}
                    className="min-h-[480px]"
                  />
                )}

                {selectedDocument && !docLoading && !docError && docUrl && selectedIsPdf && (
                  <iframe
                    src={docUrl}
                    className="h-[620px] w-full rounded-md bg-white"
                    title={`${selectedRequirement?.label ?? 'Selected document'} preview`}
                  />
                )}

                {selectedDocument && !docLoading && !docError && docUrl && !selectedIsPdf && (
                  <div className="flex min-h-[620px] items-center justify-center rounded-md bg-white p-4">
                    <img
                      src={docUrl}
                      alt={`${selectedRequirement?.label ?? 'Selected document'} preview`}
                      className="max-h-[580px] max-w-full rounded object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedDocument && (
            <Card>
              <CardHeader>
                <CardTitle>Decision for selected document</CardTitle>
                <CardDescription>
                  Make the call while the document and comparison context are visible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {!selectedIsApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDocumentAction(selectedDocument.id, 'approved')
                      }
                      disabled={decisionDisabled}
                      className="gap-1 text-green-700 hover:text-green-800"
                    >
                      <PiCheckBold className="h-4 w-4" />
                      {actionInFlight === `${selectedDocument.id}-approved`
                        ? 'Approving…'
                        : 'Approve Document'}
                    </Button>
                  )}

                  {!selectedIsRejected && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setChangeRequestOpen(true);
                        setReviewReasonText(selectedDocument.rejection_reason ?? '');
                        setReviewReasonError(null);
                      }}
                      disabled={decisionDisabled}
                      className="gap-1 text-red-700 hover:text-red-800"
                    >
                      <PiXBold className="h-4 w-4" />
                      Request Changes
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDocumentAction(selectedDocument.id, 'under_review')
                    }
                    disabled={decisionDisabled}
                    className="gap-1 text-blue-700 hover:text-blue-800"
                  >
                    <PiClipboardTextBold className="h-4 w-4" />
                    {actionInFlight === `${selectedDocument.id}-under_review`
                      ? 'Updating…'
                      : 'Mark Under Review'}
                  </Button>
                </div>

                {changeRequestOpen && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <label
                      htmlFor="changeRequestReason"
                      className="flex items-center justify-between gap-3 text-sm font-semibold text-gray-900"
                    >
                      Change request reason
                      <span className="text-xs font-medium text-red-700">Required</span>
                    </label>
                    <textarea
                      id="changeRequestReason"
                      name="changeRequestReason"
                      value={reviewReasonText}
                      onChange={(event) => {
                        setReviewReasonText(event.target.value);
                        if (event.target.value.trim()) setReviewReasonError(null);
                      }}
                      aria-invalid={Boolean(reviewReasonError)}
                      aria-describedby={
                        reviewReasonError
                          ? 'changeRequestHelp changeRequestError'
                          : 'changeRequestHelp'
                      }
                      rows={4}
                      placeholder="Example: Please upload a bank confirmation letter that shows the account holder and account number clearly."
                      className={cn(
                        'mt-2 w-full resize-y rounded-md border bg-white p-3 text-sm focus:outline-none focus:ring-2',
                        reviewReasonError
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-circleTel-orange/20'
                      )}
                    />
                    <p id="changeRequestHelp" className="mt-2 text-xs text-gray-600">
                      This feedback is sent to the clinic contact with the re-upload link.
                    </p>
                    {reviewReasonError && (
                      <p
                        id="changeRequestError"
                        className="mt-2 text-xs font-semibold text-red-700"
                      >
                        {reviewReasonError}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setChangeRequestOpen(false);
                          setReviewReasonText('');
                          setReviewReasonError(null);
                        }}
                        disabled={actionInFlight === `${selectedDocument.id}-rejected`}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleDocumentAction(
                            selectedDocument.id,
                            'rejected',
                            reviewReasonText
                          )
                        }
                        disabled={actionInFlight === `${selectedDocument.id}-rejected`}
                        className="gap-1"
                      >
                        <PiXBold className="h-4 w-4" />
                        {actionInFlight === `${selectedDocument.id}-rejected`
                          ? 'Sending…'
                          : 'Send Change Request'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiFileTextBold className="h-5 w-5 text-circleTel-orange" />
                Entity information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Business name" value={step2?.entityName || '-'} />
              <InfoRow label="Entity type" value={step2?.entityType || '-'} />
              <InfoRow
                label="Registration"
                value={<span className="font-mono">{step2?.regNumber || '-'}</span>}
              />
              {step2?.vat === 'Yes' && (
                <InfoRow
                  label="VAT number"
                  value={<span className="font-mono">{step2?.vatNumber || '-'}</span>}
                />
              )}
              {!submission.nameMatch && (
                <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs font-medium text-amber-800">
                  <PiWarningCircleBold className="mt-0.5 h-4 w-4 shrink-0" />
                  Account holder should match the registered entity name.
                </div>
              )}
            </CardContent>
          </Card>

          {primaryPaymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiBankBold className="h-5 w-5 text-circleTel-orange" />
                  Banking details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow
                  label="Account holder"
                  value={primaryBanking.account_holder_name || '-'}
                />
                <InfoRow label="Bank" value={primaryBanking.bank_name || '-'} />
                <InfoRow label="Account type" value={primaryBanking.account_type || '-'} />
                <InfoRow
                  label="Account no."
                  value={
                    <span className="font-mono">
                      {maskAccountNumber(primaryBanking.account_number)}
                    </span>
                  }
                />
                <InfoRow
                  label="Branch code"
                  value={<span className="font-mono">{primaryBanking.branch_code || '-'}</span>}
                />
                <div className="flex items-center justify-between gap-3 pt-2">
                  <StatusBadge
                    status={primaryPaymentMethod.mandate_status}
                    variant={
                      primaryPaymentMethod.mandate_status === 'active'
                        ? 'success'
                        : 'warning'
                    }
                    className="capitalize"
                  />
                  {primaryPaymentMethod.mandate_status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleConfirmMandate}
                      disabled={mandateConfirming}
                      className="gap-1 text-blue-700 hover:text-blue-800"
                    >
                      <PiCheckBold className="h-3 w-3" />
                      {mandateConfirming ? 'Confirming…' : 'Confirm Active'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiUserBold className="h-5 w-5 text-circleTel-orange" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow
                label="Email"
                value={
                  <span className="break-all">{submission.customers?.email || '-'}</span>
                }
              />
              <InfoRow label="Phone" value={submission.customers?.phone || '-'} />
            </CardContent>
          </Card>

          {submission.customers?.clinic_details && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiMapPinBold className="h-5 w-5 text-circleTel-orange" />
                  Clinic location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {submission.customers.clinic_details.site_address && (
                  <InfoRow
                    label="Address"
                    value={submission.customers.clinic_details.site_address}
                  />
                )}
                {submission.customers.clinic_details.lat &&
                  submission.customers.clinic_details.lng && (
                    <>
                      <InfoRow
                        label="Coordinates"
                        value={
                          <span className="font-mono">
                            {submission.customers.clinic_details.lat},{' '}
                            {submission.customers.clinic_details.lng}
                          </span>
                        }
                      />
                      <a
                        href={`https://www.google.com/maps?q=${submission.customers.clinic_details.lat},${submission.customers.clinic_details.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-circleTel-orange hover:underline"
                      >
                        View on Google Maps
                        <PiArrowSquareOutBold className="h-3 w-3" />
                      </a>
                    </>
                  )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiClockBold className="h-5 w-5 text-circleTel-orange" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Submitted" value={formatDateTime(submission.submitted_at)} />
              <InfoRow
                label="Last reviewed"
                value={formatDateTime(submission.admin_reviewed_at)}
              />
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[116px_minmax(0,1fr)] gap-3">
      <p className="text-gray-500">{label}</p>
      <div className="min-w-0 font-medium text-gray-900">{value}</div>
    </div>
  );
}
