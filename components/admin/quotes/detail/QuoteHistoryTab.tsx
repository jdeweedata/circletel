'use client';

import {
  PiCalendarBold,
  PiClockBold,
  PiCheckCircleBold,
  PiPaperPlaneTiltBold,
  PiEyeBold,
  PiSignatureBold,
  PiClockCounterClockwiseBold
} from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared';
import type { QuoteDetails } from '@/lib/quotes/types';

interface QuoteHistoryTabProps {
  quote: QuoteDetails;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimelineIcon(event: string) {
  switch (event) {
    case 'created':
      return <PiClockBold className="h-5 w-5 text-slate-500" />;
    case 'approved':
      return <PiCheckCircleBold className="h-5 w-5 text-emerald-600" />;
    case 'sent':
      return <PiPaperPlaneTiltBold className="h-5 w-5 text-indigo-600" />;
    case 'viewed':
      return <PiEyeBold className="h-5 w-5 text-blue-600" />;
    case 'signed':
      return <PiSignatureBold className="h-5 w-5 text-primary" />;
    default:
      return <PiClockBold className="h-5 w-5 text-slate-500" />;
  }
}

export function QuoteHistoryTab({ quote }: QuoteHistoryTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <SectionCard title="Status Timeline" icon={PiCalendarBold}>
        <div className="relative border-l border-slate-200 ml-3 space-y-8 pl-6 py-2">
          
          <div className="relative">
            <span className="absolute -left-[35px] bg-white p-1 rounded-full border border-slate-200">
              {getTimelineIcon('created')}
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Quote Created</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(quote.created_at)}</p>
              {/* @ts-ignore */}
              {quote.created_by_admin && (
                <p className="text-xs text-slate-600 mt-1 bg-slate-50 px-2 py-1 rounded-md inline-block">
                  {/* @ts-ignore */}
                  By {quote.created_by_admin.full_name}
                </p>
              )}
            </div>
          </div>

          {quote.approved_at && (
            <div className="relative">
              <span className="absolute -left-[35px] bg-emerald-50 p-1 rounded-full border border-emerald-100">
                {getTimelineIcon('approved')}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Approved Internally</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(quote.approved_at)}</p>
                {quote.approved_by_admin && (
                  <p className="text-xs text-emerald-700 font-medium mt-1 bg-emerald-50/50 px-2 py-1 rounded-md inline-block">
                    Approved by {quote.approved_by_admin.full_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {quote.sent_at && (
            <div className="relative">
              <span className="absolute -left-[35px] bg-indigo-50 p-1 rounded-full border border-indigo-100">
                {getTimelineIcon('sent')}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Sent to Customer</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(quote.sent_at)}</p>
              </div>
            </div>
          )}

          {quote.viewed_at && (
            <div className="relative">
              <span className="absolute -left-[35px] bg-blue-50 p-1 rounded-full border border-blue-100">
                {getTimelineIcon('viewed')}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Viewed by Customer</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(quote.viewed_at)}</p>
              </div>
            </div>
          )}

          {quote.signed_at || quote.accepted_at ? (
            <div className="relative">
              <span className="absolute -left-[35px] bg-orange-50 p-1 rounded-full border border-orange-200">
                {getTimelineIcon('signed')}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Accepted & Signed</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(quote.signed_at || quote.accepted_at!)}</p>
              </div>
            </div>
          ) : null}

        </div>
      </SectionCard>

      {quote.versions && quote.versions.length > 0 && (
        <SectionCard title="Version History" icon={PiClockCounterClockwiseBold}>
          <div className="space-y-4">
            {quote.versions.map((version) => (
              <div key={version.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">v{version.version_number}.0</span>
                    <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                      {new Date(version.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {version.change_notes ? (
                  <p className="text-sm text-slate-600 bg-white p-2 border border-slate-100 rounded">
                    {version.change_notes}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No notes provided for this version update.</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
