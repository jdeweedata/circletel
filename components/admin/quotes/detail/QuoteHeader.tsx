'use client';

import {
  PiCaretRightBold,
  PiCheckCircleBold,
  PiDotsThreeBold,
  PiPencilSimpleBold,
  PiEyeBold,
  PiShareBold,
  PiChartBarBold,
  PiEnvelopeBold,
  PiXCircleBold,
  PiSpinnerBold,
  PiPlusBold
} from 'react-icons/pi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/shared';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { QuoteDetails } from '@/lib/quotes/types';

interface QuoteHeaderProps {
  quote: QuoteDetails;
  actionLoading: boolean;
  sharingLoading: boolean;
  onApprove: () => void;
  onSend: () => void;
  onRejectClick: () => void;
  onGenerateShareLink: () => void;
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

export function QuoteHeader({
  quote,
  actionLoading,
  sharingLoading,
  onApprove,
  onSend,
  onRejectClick,
  onGenerateShareLink
}: QuoteHeaderProps) {
  const router = useRouter();
  const statusConfig = getStatusConfig(quote.status);

  const canApprove = quote.status === 'pending_approval' || quote.status === 'draft';
  const canReject = ['draft', 'pending_approval', 'sent', 'viewed'].includes(quote.status);
  const canSend = quote.status === 'approved';

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin/quotes" className="hover:text-primary">Quotes</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/quotes" className="hover:text-primary">Business Quotes</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{quote.quote_number}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {quote.quote_number}
                </h2>
                <StatusBadge status={statusConfig.label} className={statusConfig.className} />
                <Badge variant="outline" className="text-xs uppercase bg-white">
                  {quote.customer_type}
                </Badge>
              </div>
              <p className="text-slate-500 mt-1 font-medium">{quote.company_name}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/quotes/new')}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <PiPlusBold className="w-4 h-4 mr-2" />
              New Quote
            </Button>

            {canApprove && (
              <Button
                onClick={onApprove}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {actionLoading ? (
                  <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <PiCheckCircleBold className="w-4 h-4 mr-2" />
                )}
                Approve Quote
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm">
                  <PiDotsThreeBold className="w-4 h-4 mr-1" />
                  <span>More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {['draft', 'pending_approval', 'approved', 'sent', 'viewed'].includes(quote.status) && (
                  <DropdownMenuItem onClick={() => router.push(`/admin/quotes/${quote.id}/edit`)}>
                    <PiPencilSimpleBold className="w-4 h-4 mr-2 text-slate-500" />
                    Edit quote
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => window.open(`/quotes/business/${quote.id}/preview`, '_blank')}>
                  <PiEyeBold className="w-4 h-4 mr-2 text-slate-500" />
                  Preview quote
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (!actionLoading) onGenerateShareLink();
                  }}
                >
                  {sharingLoading ? (
                    <PiSpinnerBold className="w-4 h-4 mr-2 animate-spin text-slate-500" />
                  ) : (
                    <PiShareBold className="w-4 h-4 mr-2 text-slate-500" />
                  )}
                  Share quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/admin/quotes/${quote.id}/analytics`)}>
                  <PiChartBarBold className="w-4 h-4 mr-2 text-slate-500" />
                  View analytics
                </DropdownMenuItem>
                {canSend && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!actionLoading) onSend();
                    }}
                  >
                    <PiEnvelopeBold className="w-4 h-4 mr-2 text-slate-500" />
                    Send to customer
                  </DropdownMenuItem>
                )}
                {canReject && (
                  <DropdownMenuItem
                    onClick={() => {
                      if (!actionLoading) onRejectClick();
                    }}
                    className="text-red-600 focus:text-red-700"
                  >
                    <PiXCircleBold className="w-4 h-4 mr-2" />
                    Reject quote
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
