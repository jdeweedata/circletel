'use client';

import {
  PiCaretRightBold,
  PiPaperPlaneTiltBold,
  PiDownloadSimpleBold,
  PiArrowsClockwiseBold,
} from 'react-icons/pi';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/shared';
import type { StatusVariant } from '@/components/admin/shared';

interface ContractHeaderProps {
  contract: {
    id: string;
    contract_number: string;
    status: string;
    company_name: string;
    pdf_url?: string | null;
  };
  onSendForSignature?: () => void;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<string, { variant: StatusVariant; label: string }> = {
  draft: { variant: 'info', label: 'Draft' },
  pending_signature: { variant: 'warning', label: 'Pending Signature' },
  partially_signed: { variant: 'warning', label: 'Partially Signed' },
  fully_signed: { variant: 'success', label: 'Fully Signed' },
  active: { variant: 'success', label: 'Active' },
  expired: { variant: 'error', label: 'Expired' },
  terminated: { variant: 'error', label: 'Terminated' },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    variant: 'neutral' as StatusVariant,
    label: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
}

export function ContractHeader({
  contract,
  onSendForSignature,
  onRefresh,
}: ContractHeaderProps) {
  const statusConfig = getStatusConfig(contract.status);

  const handleDownloadPdf = () => {
    if (contract.pdf_url) {
      window.open(contract.pdf_url, '_blank');
    }
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/admin" className="hover:text-primary">Admin</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <Link href="/admin/contracts" className="hover:text-primary">Contracts</Link>
          <PiCaretRightBold className="w-3 h-3" />
          <span className="text-slate-900">{contract.contract_number}</span>
        </div>

        {/* Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 mt-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {contract.contract_number}
            </h2>
            <StatusBadge status={statusConfig.label} variant={statusConfig.variant} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Grouped icon buttons */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Send for Signature"
                aria-label="Send for Signature"
                onClick={onSendForSignature}
              >
                <PiPaperPlaneTiltBold className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200 disabled:opacity-50"
                title="Download PDF"
                aria-label="Download PDF"
                onClick={handleDownloadPdf}
                disabled={!contract.pdf_url}
              >
                <PiDownloadSimpleBold className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2.5 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                title="Refresh"
                aria-label="Refresh"
                onClick={onRefresh}
              >
                <PiArrowsClockwiseBold className="w-5 h-5" />
              </button>
            </div>

            {/* Primary action button */}
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!contract.pdf_url}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <PiDownloadSimpleBold className="w-5 h-5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
