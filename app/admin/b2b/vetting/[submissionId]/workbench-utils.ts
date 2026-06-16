export interface DocumentMetadataDraft {
  title: string;
  description: string;
  tags: string[];
  access: string;
  fileType: string;
}

export type SummaryTone = 'neutral' | 'warning' | 'danger';

export interface VettingSummaryInput {
  approved: number;
  total: number;
  needsDecision: number;
  missing: number;
  changesRequested: number;
  lastReviewedAt: string | null;
}

export interface VettingSummaryItem {
  label: string;
  value: string;
  helper: string;
  tone: SummaryTone;
}

export interface DocumentDrawerSummaryInput {
  requirementLabel: string | null;
  documentType: string;
  fileType: string;
}

export interface DocumentDrawerSummary {
  title: string;
  subtitle: string;
}

interface DocumentMetadataSource {
  document_type: string;
  file_path: string;
  verification_status: string;
}

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

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateTimeFormatter.format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

export function isPdfDocument(documentPath: string | undefined, signedUrl: string | null) {
  const target = `${documentPath ?? ''} ${signedUrl ?? ''}`.toLowerCase();
  return target.includes('.pdf');
}

export function isImageDocument(documentPath: string | undefined, signedUrl: string | null) {
  const target = `${documentPath ?? ''} ${signedUrl ?? ''}`.toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some((extension) =>
    target.includes(extension)
  );
}

export function buildDocumentMetadataDraft(
  requirementLabel: string | null,
  document: DocumentMetadataSource,
  signedUrl: string | null,
  isPdf: boolean
): DocumentMetadataDraft {
  const documentType = document.document_type || 'document';
  const status = document.verification_status || 'pending';
  const fileType = isPdf
    ? 'PDF'
    : isImageDocument(document.file_path, signedUrl)
      ? 'Image'
      : 'Document';

  return {
    title: requirementLabel || formatStatusLabel(documentType),
    description: `Review ${documentType} for KYC/KYB approval.`,
    tags: [documentType, status, fileType.toLowerCase()],
    access: 'KYC reviewers only',
    fileType,
  };
}

export function buildVettingSummaryItems({
  approved,
  total,
  needsDecision,
  missing,
  changesRequested,
  lastReviewedAt,
}: VettingSummaryInput): VettingSummaryItem[] {
  const reviewedDate = formatDate(lastReviewedAt);
  const reviewedTime =
    lastReviewedAt === null
      ? 'No review yet'
      : formatDateTime(lastReviewedAt).split(', ').pop() ?? 'No review yet';

  return [
    {
      label: 'Approved',
      value: `${approved}/${total}`,
      helper: 'Required docs',
      tone: 'neutral',
    },
    {
      label: 'Needs decision',
      value: String(needsDecision),
      helper:
        changesRequested > 0
          ? `${changesRequested} changes requested`
          : 'Open items',
      tone: needsDecision > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Missing',
      value: String(missing),
      helper: 'Required uploads',
      tone: missing > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Last reviewed',
      value: reviewedDate,
      helper: reviewedTime,
      tone: 'neutral',
    },
  ];
}

export function buildDocumentDrawerSummary({
  requirementLabel,
  documentType,
  fileType,
}: DocumentDrawerSummaryInput): DocumentDrawerSummary {
  return {
    title: requirementLabel || formatStatusLabel(documentType),
    subtitle: `${fileType} · ${documentType}`,
  };
}
