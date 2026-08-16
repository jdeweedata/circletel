'use client';

import {
  PiFileTextBold,
  PiCaretRightBold,
  PiBuildingsBold,
} from 'react-icons/pi';
import { StatusBadge } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
import { EmptyState, LoadingState } from '@/components/backend';
import { RuledTable } from '@/components/portal/modernist/PortalModernistShell';
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

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  draft: { className: 'bg-slate-100 text-slate-600', label: 'Draft' },
  pending_approval: { className: 'bg-amber-50 text-amber-700', label: 'Pending Approval' },
  approved: { className: 'bg-blue-50 text-blue-700', label: 'Approved' },
  sent: { className: 'bg-purple-50 text-purple-700', label: 'Sent' },
  viewed: { className: 'bg-indigo-50 text-indigo-700', label: 'Viewed' },
  accepted: { className: 'bg-emerald-50 text-emerald-700', label: 'Accepted' },
  rejected: { className: 'bg-red-50 text-red-700', label: 'Rejected' },
  expired: { className: 'bg-orange-50 text-orange-700', label: 'Expired' }
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    className: 'bg-slate-100 text-slate-600',
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
  if (loading) {
    return <LoadingState message="Loading quotes…" />;
  }

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={<PiFileTextBold />}
        title="No quotes found"
        description="Try adjusting your filters or search term"
      />
    );
  }

  return (
    <RuledTable headers={['Quote details', 'Customer', 'Status & dates', 'Value', ' ']}>
      {quotes.map((quote) => {
        const statusConfig = getStatusConfig(quote.status);

        return (
          <tr
            key={quote.id}
            onClick={() => onRowClick(quote.id)}
            className="cursor-pointer hover:bg-[color-mix(in_srgb,#13274A_4%,#FFFFFF)]"
            style={{ borderBottom: '1px solid var(--pm-divider)' }}
          >
            <td className="px-4 py-3 align-top">
              <p className="font-extrabold" style={{ color: 'var(--pm-navy)' }}>
                {quote.quote_number}
              </p>
              <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>
                {quote.item_count} items • {quote.contract_term} mos
              </p>
            </td>

            <td className="px-4 py-3 align-top">
              <div className="mb-1 flex items-center gap-1.5">
                <PiBuildingsBold className="h-3.5 w-3.5" style={{ color: '#9CA3AF' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--pm-navy)' }}>
                  {quote.company_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {quote.contact_name}
                </span>
                <Badge
                  variant="outline"
                  className="h-5 text-[10px] font-medium uppercase shadow-none hover:bg-transparent"
                >
                  {quote.customer_type}
                </Badge>
              </div>
            </td>

            <td className="px-4 py-3 align-top">
              <div className="flex flex-col items-start gap-1.5">
                <StatusBadge
                  status={statusConfig.label}
                  className={statusConfig.className}
                />
                <span className="text-xs font-medium" style={{ color: '#6B7280' }} title="Created date">
                  {formatDate(quote.created_at)}
                </span>
              </div>
            </td>

            <td className="px-4 py-3 align-top text-right">
              <p className="font-extrabold tabular-nums" style={{ color: 'var(--pm-navy)' }}>
                {formatCurrency(quote.total_monthly)}
                <span className="ml-0.5 text-xs font-normal" style={{ color: '#6B7280' }}>
                  /mo
                </span>
              </p>
              {quote.total_installation > 0 && (
                <p className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium" style={{ color: '#6B7280' }}>
                  + {formatCurrency(quote.total_installation)} once-off
                </p>
              )}
            </td>

            <td className="px-4 py-3 align-middle text-center">
              <PiCaretRightBold className="mx-auto h-5 w-5" style={{ color: 'var(--pm-navy)', opacity: 0.4 }} />
            </td>
          </tr>
        );
      })}
    </RuledTable>
  );
}
