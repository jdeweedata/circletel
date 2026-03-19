'use client';

import {
  PiFileTextBold,
  PiCaretRightBold,
  PiBuildingsBold,
  PiSpinnerBold
} from 'react-icons/pi';
import { StatusBadge } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
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
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-24 flex flex-col items-center justify-center">
        <PiSpinnerBold className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-slate-500 font-medium">Loading quotes...</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-16 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <PiFileTextBold className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium text-lg">No quotes found</p>
        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-6 py-4">Quote Details</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status & Dates</th>
              <th className="px-6 py-4 text-right">Value</th>
              <th className="px-6 py-4 w-12 text-center text-slate-300">
                <PiCaretRightBold className="w-4 h-4 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => {
              const statusConfig = getStatusConfig(quote.status);
              
              return (
                <tr
                  key={quote.id}
                  onClick={() => onRowClick(quote.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 align-top">
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {quote.quote_number}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {quote.item_count} items • {quote.contract_term} mos
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <PiBuildingsBold className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-900 text-sm">{quote.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">{quote.contact_name}</span>
                        <Badge variant="outline" className="text-[10px] uppercase shadow-none font-medium h-5 hover:bg-transparent">
                          {quote.customer_type}
                        </Badge>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge
                        status={statusConfig.label}
                        className={statusConfig.className}
                      />
                      <span className="text-xs text-slate-500 font-medium tooltip" title="Created date">
                        {formatDate(quote.created_at)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-top text-right">
                    <div>
                      <p className="font-bold text-slate-900">
                        {formatCurrency(quote.total_monthly)}
                        <span className="text-xs text-slate-500 font-normal ml-0.5">/mo</span>
                      </p>
                      {quote.total_installation > 0 && (
                        <p className="text-xs text-slate-500 mt-1 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block">
                          + {formatCurrency(quote.total_installation)} once-off
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle text-center">
                    <PiCaretRightBold className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors mx-auto" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
