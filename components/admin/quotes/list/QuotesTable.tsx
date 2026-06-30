'use client';

import {
  PiFileTextBold,
  PiCaretRightBold,
  PiBuildingsBold,
} from 'react-icons/pi';
import {
  DataTable,
  StatusBadge,
  type DataTableColumn,
  type StatusVariant,
} from '@/components/backend';
import type { BusinessQuote } from '@/lib/quotes/types';

interface QuoteWithDetails extends BusinessQuote {
  item_count: number;
  created_by_admin?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface QuotesTableProps {
  quotes: QuoteWithDetails[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  pending_approval: { label: 'Pending Approval', variant: 'warning' },
  approved: { label: 'Approved', variant: 'info' },
  sent: { label: 'Sent', variant: 'info' },
  viewed: { label: 'Viewed', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  expired: { label: 'Expired', variant: 'error' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    variant: 'neutral' as const,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function QuotesTable({ quotes, loading, onRowClick }: QuotesTableProps) {
  const columns: DataTableColumn<QuoteWithDetails>[] = [
    {
      id: 'quote',
      header: 'Quote Details',
      cell: (quote) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-gray-900">{quote.quote_number}</p>
          <p className="mt-1 text-xs text-gray-500">
            {quote.item_count} items • {quote.contract_term} mos
          </p>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (quote) => (
        <div className="min-w-[240px]">
          <div className="mb-1 flex items-center gap-1.5">
            <PiBuildingsBold className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{quote.company_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{quote.contact_name}</span>
            <StatusBadge status={quote.customer_type} variant="neutral" className="px-1.5 py-0.5 text-[10px] uppercase" />
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status & Dates',
      cell: (quote) => {
        const statusConfig = getStatusConfig(quote.status);
        return (
          <div className="flex flex-col items-start gap-1.5">
            <StatusBadge status={statusConfig.label} variant={statusConfig.variant} />
            <span className="text-xs font-medium text-gray-500" title="Created date">
              {formatDate(quote.created_at)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'value',
      header: 'Value',
      align: 'right',
      cell: (quote) => (
        <div className="min-w-[140px]">
          <p className="font-semibold text-gray-900">
            {formatCurrency(quote.total_monthly)}
            <span className="ml-0.5 text-xs font-normal text-gray-500">/mo</span>
          </p>
          {quote.total_installation > 0 && (
            <p className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              + {formatCurrency(quote.total_installation)} once-off
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'open',
      header: '',
      align: 'center',
      cell: () => <PiCaretRightBold className="mx-auto h-4 w-4 text-gray-400" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={quotes}
      getRowId={(quote) => quote.id}
      loading={loading}
      loadingMessage="Loading quotes..."
      emptyIcon={<PiFileTextBold />}
      emptyTitle="No quotes found"
      emptyDescription="Try adjusting your filters or search term."
      onRowClick={(quote) => onRowClick(quote.id)}
    />
  );
}
