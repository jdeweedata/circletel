'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowLeftBold,
  PiArrowSquareOutBold,
  PiArrowsClockwiseBold,
  PiArrowsOutBold,
  PiCheckBold,
  PiCheckCircleBold,
  PiClipboardTextBold,
  PiFileTextBold,
  PiInfoBold,
  PiLockBold,
  PiMinusBold,
  PiPlusBold,
  PiWarningCircleBold,
  PiXBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/backend';
import { requiredDocsFor, type DocRequirement } from '@/lib/onboarding/document-requirements';
import { cn } from '@/lib/utils';
import {
  buildAutomatedChecks,
  buildDocumentDrawerSummary,
  buildVettingSummaryItems,
  formatDateTime,
  formatStatusLabel,
  isImageDocument,
  isPdfDocument,
  type AutomatedCheck,
  type DocumentDrawerSummary,
  type VettingSummaryItem,
} from './workbench-utils';

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
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mandateConfirming, setMandateConfirming] = useState(false);
  const [documentDrawerOpen, setDocumentDrawerOpen] = useState(false);
  const [mismatchAck, setMismatchAck] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setSubmissionId(p.submissionId);
    });
  }, [params]);

  useEffect(() => {
    setMismatchAck(false);
  }, [submissionId]);

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
    setZoom(100);
    setRotation(0);
    if (!selectedDocument) {
      setDocumentDrawerOpen(false);
    }
  }, [selectedDocument]);

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
  const approveBlocked = Boolean(submission && !submission.nameMatch && !mismatchAck);
  const selectedIsPdf = isPdfDocument(selectedDocument?.file_path, docUrl);
  const selectedIsImage = isImageDocument(selectedDocument?.file_path, docUrl);
  const primaryPaymentMethod = submission.paymentMethods[0];
  const primaryBanking = primaryPaymentMethod?.encrypted_details ?? {};
  const summaryItems = buildVettingSummaryItems({
    approved: docCounts.approved,
    total: docCounts.total,
    needsDecision: docCounts.needsDecision,
    missing: docCounts.missing,
    changesRequested: docCounts.changesRequested,
    lastReviewedAt: submission.admin_reviewed_at,
  });
  const drawerSummary = selectedDocument
    ? buildDocumentDrawerSummary({
        requirementLabel: selectedRequirement?.label ?? null,
        documentType: selectedDocument.document_type,
        fileType: selectedIsPdf ? 'PDF' : selectedIsImage ? 'Image' : 'Document',
      })
    : null;

  return (
    <>
      <main className="min-h-[calc(100vh-64px)] max-w-none px-4 py-5 lg:px-6">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-gray-950">
            {submission.customers?.business_name || 'Vetting submission'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {submission.customers?.account_number ?? 'No account number'} · {submission.segment} · Submitted{' '}
            {formatDateTime(submission.submitted_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
      </div>

      {actionError && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm font-medium text-red-700">{actionError}</p>
          </CardContent>
        </Card>
      )}

      <section className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:grid-cols-4">
        {summaryItems.map((item) => (
          <SummaryItem key={item.label} item={item} />
        ))}
      </section>

      <section className="grid grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:h-[calc(100vh-220px)] xl:min-h-[680px] xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col border-b border-gray-200 bg-gray-50/80 xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
                <p className="mt-1 text-xs text-gray-500">{docCounts.total} required files</p>
              </div>
              <StatusBadge status={`${docCounts.approved}/${docCounts.total}`} variant="neutral" />
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
            {requiredDocItems.map((item, index) => {
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
                <div
                  key={item.requirement.type}
                  className={cn(
                    'group rounded-lg border transition-colors',
                    active
                      ? 'border-circleTel-orange bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    !document && 'opacity-70'
                  )}
                >
                  <button
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
                      'grid w-full grid-cols-[34px_minmax(0,1fr)] gap-2.5 px-2.5 pb-1.5 pt-2 text-left',
                      !document && 'cursor-not-allowed'
                    )}
                    aria-pressed={active}
                    title={item.requirement.label}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-md border bg-white text-xs font-bold',
                        active ? 'border-circleTel-orange text-circleTel-orange' : 'border-gray-200 text-gray-400'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
                        {item.requirement.label}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge
                          status={status.label}
                          variant={status.variant}
                          icon={status.icon}
                          className="capitalize"
                        />
                        {document && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                            {isPdfDocument(document.file_path, null) ? 'PDF' : 'File'}
                          </span>
                        )}
                      </div>
                      {document?.rejection_reason && (
                        <p className="mt-2 line-clamp-2 rounded-md bg-red-50 p-2 text-xs font-medium text-red-700">
                          {document.rejection_reason}
                        </p>
                      )}
                    </div>
                  </button>
                  {document && (
                    <div className="flex items-center justify-end border-t border-gray-100 px-2.5 py-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1.5 px-2 text-xs text-gray-700 hover:bg-white"
                        onClick={() => {
                          setSelectedDoc(document.id);
                          setDocumentDrawerOpen(true);
                        }}
                      >
                        <PiArrowSquareOutBold className="h-3.5 w-3.5" />
                        View document
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col bg-[#f4f5f7]">
          <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <PiFileTextBold className="h-5 w-5 shrink-0 text-circleTel-orange" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-gray-900">
                  {drawerSummary?.title ?? 'Selected document'}
                </h2>
                <p className="truncate text-xs text-gray-500">
                  {drawerSummary?.subtitle ?? 'Select a document to preview and review.'}
                </p>
              </div>
            </div>
          </div>

          <DocumentViewer
            title={drawerSummary?.title ?? selectedRequirement?.label ?? 'Selected document'}
            selectedDocument={selectedDocument}
            docUrl={docUrl}
            docLoading={docLoading}
            docError={docError}
            selectedIsPdf={selectedIsPdf}
            selectedIsImage={selectedIsImage}
            zoom={zoom}
            rotation={rotation}
            onZoomIn={() => setZoom((z) => Math.min(140, z + 10))}
            onZoomOut={() => setZoom((z) => Math.max(70, z - 10))}
            onReset={() => {
              setZoom(100);
              setRotation(0);
            }}
            onRotate={() => setRotation((r) => (r + 90) % 360)}
            onReload={() => setDocRefreshKey((key) => key + 1)}
            onOpenOriginal={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
            onExpand={() => selectedDocument && setDocumentDrawerOpen(true)}
            variant="inline"
          />
        </section>

        <aside className="flex min-h-0 flex-col border-t border-gray-200 bg-white xl:border-l xl:border-t-0">
          <div className="shrink-0 border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Document inspector</h2>
            <p className="mt-1 text-xs text-gray-500">Decision tools and review context</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selectedDocument && (
              <EmptyState
                icon={<PiFileTextBold />}
                title="Select a document"
                description="Inspector controls appear after a document is selected."
              />
            )}

            {selectedDocument && (
              <div className="space-y-4">
                {!submission.nameMatch && (
                  <section
                    className={cn(
                      'rounded-lg border p-4',
                      mismatchAck ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {mismatchAck ? (
                        <PiCheckCircleBold className="h-4 w-4 text-amber-600" />
                      ) : (
                        <PiWarningCircleBold className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          mismatchAck ? 'text-amber-700' : 'text-red-700'
                        )}
                      >
                        {mismatchAck ? 'Mismatch acknowledged' : 'Entity name mismatch'}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Registered entity
                        </p>
                        <p className="mt-0.5 font-mono text-sm text-gray-900">
                          {step2?.entityName || '-'}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'rounded-md border bg-white px-3 py-2',
                          mismatchAck ? 'border-gray-200' : 'border-red-200'
                        )}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          Account holder on file
                        </p>
                        <p
                          className={cn(
                            'mt-0.5 font-mono text-sm',
                            mismatchAck ? 'text-gray-700' : 'text-red-700'
                          )}
                        >
                          {primaryBanking.account_holder_name || '-'}
                        </p>
                      </div>
                    </div>
                    {mismatchAck ? (
                      <p className="mt-3 text-xs text-gray-500">
                        Override recorded against your reviewer ID. Approval is now permitted.
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setMismatchAck(true)}
                        className="mt-3 w-full bg-red-600 text-white hover:bg-red-700"
                      >
                        Acknowledge &amp; override
                      </Button>
                    )}
                  </section>
                )}

                <InspectorSection title="Decision">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">Document status</span>
                    {selectedStatus && (
                      <StatusBadge
                        status={selectedStatus.label}
                        variant={selectedStatus.variant}
                        icon={selectedStatus.icon}
                      />
                    )}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {!selectedIsApproved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDocumentAction(selectedDocument.id, 'approved')}
                        disabled={decisionDisabled || approveBlocked}
                        className="justify-start gap-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 disabled:opacity-60"
                      >
                        {approveBlocked ? (
                          <PiLockBold className="h-4 w-4" />
                        ) : (
                          <PiCheckBold className="h-4 w-4" />
                        )}
                        {approveBlocked
                          ? 'Resolve the flag first'
                          : actionInFlight === `${selectedDocument.id}-approved`
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
                        className="justify-start gap-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      >
                        <PiXBold className="h-4 w-4" />
                        Request Changes
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDocumentAction(selectedDocument.id, 'under_review')}
                      disabled={decisionDisabled}
                      className="justify-start gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                      <PiClipboardTextBold className="h-4 w-4" />
                      {actionInFlight === `${selectedDocument.id}-under_review`
                        ? 'Updating…'
                        : 'Mark Under Review'}
                    </Button>
                  </div>
                  {changeRequestOpen && (
                    <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3">
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
                        <p id="changeRequestError" className="mt-2 text-xs font-semibold text-red-700">
                          {reviewReasonError}
                        </p>
                      )}
                      <div className="mt-3 flex justify-end gap-2">
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
                            handleDocumentAction(selectedDocument.id, 'rejected', reviewReasonText)
                          }
                          disabled={actionInFlight === `${selectedDocument.id}-rejected`}
                        >
                          {actionInFlight === `${selectedDocument.id}-rejected`
                            ? 'Sending…'
                            : 'Send'}
                        </Button>
                      </div>
                    </div>
                  )}
                </InspectorSection>

                <InspectorSection title="Automated checks">
                  <div>
                    {buildAutomatedChecks({
                      nameMatch: submission.nameMatch,
                      mismatchAcknowledged: mismatchAck,
                      regNumber: step2?.regNumber,
                      hasSelectedDocument: Boolean(selectedDocument),
                      submittedAt: submission.submitted_at,
                    }).map((check, index, all) => (
                      <AutomatedCheckRow
                        key={check.key}
                        check={check}
                        last={index === all.length - 1}
                      />
                    ))}
                  </div>
                </InspectorSection>

                <InspectorSection title="Comparison context">
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Business" value={step2?.entityName || '-'} />
                    <InfoRow label="Reg no." value={<span className="font-mono">{step2?.regNumber || '-'}</span>} />
                    <InfoRow label="Bank" value={primaryBanking.bank_name || '-'} />
                    <InfoRow label="Holder" value={primaryBanking.account_holder_name || '-'} />
                    {!submission.nameMatch && (
                      <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs font-medium text-amber-800">
                        <PiWarningCircleBold className="mt-0.5 h-4 w-4 shrink-0" />
                        Account holder should match the registered entity name.
                      </div>
                    )}
                  </div>
                </InspectorSection>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>

      <Sheet open={documentDrawerOpen} onOpenChange={setDocumentDrawerOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col gap-0 bg-white p-0 sm:max-w-none md:w-[min(92vw,1100px)]"
        >
          <SheetHeader className="shrink-0 border-b border-gray-200 px-5 py-4 pr-14 text-left">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <SheetTitle className="truncate text-lg font-semibold text-gray-950">
                    {drawerSummary?.title ?? 'Document viewer'}
                  </SheetTitle>
                  {selectedStatus && (
                    <StatusBadge
                      status={selectedStatus.label}
                      variant={selectedStatus.variant}
                      icon={selectedStatus.icon}
                    />
                  )}
                </div>
                <SheetDescription className="mt-1 text-sm text-gray-500">
                  {drawerSummary?.subtitle ?? 'Select a document to preview and review.'}
                </SheetDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
                disabled={!docUrl}
                className="gap-2"
              >
                <PiArrowSquareOutBold className="h-4 w-4" />
                Open original
              </Button>
            </div>
          </SheetHeader>

          <DocumentViewer
            title={drawerSummary?.title ?? selectedRequirement?.label ?? 'Selected document'}
            selectedDocument={selectedDocument}
            docUrl={docUrl}
            docLoading={docLoading}
            docError={docError}
            selectedIsPdf={selectedIsPdf}
            selectedIsImage={selectedIsImage}
            zoom={zoom}
            rotation={rotation}
            onZoomIn={() => setZoom((z) => Math.min(140, z + 10))}
            onZoomOut={() => setZoom((z) => Math.max(70, z - 10))}
            onReset={() => {
              setZoom(100);
              setRotation(0);
            }}
            onRotate={() => setRotation((r) => (r + 90) % 360)}
            onReload={() => setDocRefreshKey((key) => key + 1)}
            onOpenOriginal={() => docUrl && window.open(docUrl, '_blank', 'noopener,noreferrer')}
            onClose={() => setDocumentDrawerOpen(false)}
            variant="fullscreen"
          />
        </SheetContent>
      </Sheet>
    </>
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

function AutomatedCheckRow({ check, last }: { check: AutomatedCheck; last: boolean }) {
  return (
    <div className={cn('flex gap-2.5 py-2', !last && 'border-b border-gray-100')}>
      <div
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full',
          check.pass ? 'bg-green-100' : 'bg-red-100'
        )}
      >
        {check.pass ? (
          <PiCheckBold className="h-3 w-3 text-green-700" />
        ) : (
          <PiXBold className="h-3 w-3 text-red-700" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{check.label}</p>
        <p className={cn('mt-0.5 text-xs', check.pass ? 'text-gray-500' : 'text-red-600')}>
          {check.note}
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ item }: { item: VettingSummaryItem }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-r border-gray-100 px-4 py-3 last:border-r-0 lg:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {item.label}
        </p>
        <p className="mt-1 truncate text-xs text-gray-500">{item.helper}</p>
      </div>
      <p
        className={cn(
          'shrink-0 text-xl font-semibold tabular-nums',
          item.tone === 'danger' && 'text-red-700',
          item.tone === 'warning' && 'text-amber-700',
          item.tone === 'neutral' && 'text-gray-950'
        )}
      >
        {item.value}
      </p>
    </div>
  );
}
function DocumentViewer({
  title,
  selectedDocument,
  docUrl,
  docLoading,
  docError,
  selectedIsPdf,
  selectedIsImage,
  zoom,
  rotation,
  onZoomIn,
  onZoomOut,
  onReset,
  onRotate,
  onReload,
  onOpenOriginal,
  onExpand,
  onClose,
  variant,
}: {
  title: string;
  selectedDocument: SubmissionDetail['documents'][number] | null;
  docUrl: string | null;
  docLoading: boolean;
  docError: string | null;
  selectedIsPdf: boolean;
  selectedIsImage: boolean;
  zoom: number;
  rotation: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRotate: () => void;
  onReload: () => void;
  onOpenOriginal: () => void;
  onExpand?: () => void;
  onClose?: () => void;
  variant: 'inline' | 'fullscreen';
}) {
  const transform = `scale(${zoom / 100}) rotate(${rotation}deg)`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 px-3 py-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomOut}
          disabled={!selectedDocument || zoom <= 70}
          aria-label="Zoom out"
          className="h-8 w-8 px-0"
        >
          <PiMinusBold className="h-4 w-4" />
        </Button>
        <span className="min-w-14 text-center text-sm font-semibold tabular-nums text-gray-700">
          {zoom}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={onZoomIn}
          disabled={!selectedDocument || zoom >= 140}
          aria-label="Zoom in"
          className="h-8 w-8 px-0"
        >
          <PiPlusBold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReset}
          disabled={!selectedDocument}
          className="h-8 px-2 text-xs font-semibold text-gray-700"
        >
          Fit
        </Button>
        {selectedIsImage && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRotate}
            disabled={!selectedDocument}
            aria-label="Rotate"
            className="h-8 w-8 px-0 text-gray-700"
          >
            <PiArrowsClockwiseBold className="h-4 w-4" />
          </Button>
        )}
        <div className="mx-1 h-6 w-px bg-gray-200" />
        <Button
          size="sm"
          variant="ghost"
          onClick={onReload}
          disabled={!selectedDocument || docLoading}
          aria-label="Reload"
          className="h-8 gap-1.5 px-2 text-xs text-gray-700"
        >
          <PiArrowsClockwiseBold className="h-4 w-4" />
          <span className="hidden sm:inline">Reload</span>
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenOriginal}
          disabled={!docUrl}
          className="h-8 gap-1.5 px-2 text-xs"
        >
          <PiArrowSquareOutBold className="h-4 w-4" />
          <span className="hidden sm:inline">Open original</span>
        </Button>
        {variant === 'inline' && onExpand && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onExpand}
            disabled={!selectedDocument}
            aria-label="Expand"
            className="h-8 w-8 px-0 text-gray-700"
          >
            <PiArrowsOutBold className="h-4 w-4" />
          </Button>
        )}
        {variant === 'fullscreen' && onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 px-0 text-gray-700"
          >
            <PiXBold className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#f4f5f7] p-4">
        <div className="mx-auto flex min-h-full max-w-5xl items-start justify-center">
          {!selectedDocument && (
            <EmptyState
              icon={<PiFileTextBold />}
              title="No document selected"
              description="Choose a required document to inspect it."
              className="min-h-[420px]"
            />
          )}
          {selectedDocument && docLoading && (
            <LoadingState message="Loading document…" className="min-h-[420px]" />
          )}
          {selectedDocument && !docLoading && docError && (
            <ErrorState
              title="Document preview unavailable"
              message={docError}
              onRetry={onReload}
              className="min-h-[420px]"
            />
          )}
          {selectedDocument && !docLoading && !docError && docUrl && selectedIsPdf && (
            <iframe
              src={docUrl}
              className="h-[calc(100vh-300px)] min-h-[560px] w-full max-w-5xl rounded-md bg-white shadow-lg"
              style={{ transform, transformOrigin: 'top center' }}
              title={`${title} preview`}
            />
          )}
          {selectedDocument && !docLoading && !docError && docUrl && selectedIsImage && (
            <img
              src={docUrl}
              alt={`${title} preview`}
              className="max-w-full rounded object-contain shadow-lg"
              style={{ transform, transformOrigin: 'top center' }}
            />
          )}
          {selectedDocument &&
            !docLoading &&
            !docError &&
            docUrl &&
            !selectedIsPdf &&
            !selectedIsImage && (
              <div className="flex w-full flex-col items-center justify-center rounded-md bg-white p-6 text-center">
                <PiFileTextBold className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm font-semibold text-gray-900">
                  Preview opened in document frame
                </p>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                  Some formats depend on the browser. Use Open original if the frame does not render.
                </p>
                <iframe
                  src={docUrl}
                  className="mt-5 h-[calc(100vh-360px)] min-h-[420px] w-full max-w-4xl rounded-md border bg-white"
                  title={`${title} preview`}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}
