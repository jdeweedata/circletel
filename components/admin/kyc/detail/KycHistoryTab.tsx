'use client';

import { PiClockBold, PiNoteBold, PiCodeBold } from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared';

interface KycSession {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  extracted_data?: any;
}

interface KycHistoryTabProps {
  session: KycSession;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function KycHistoryTab({ session }: KycHistoryTabProps) {
  const timelineEvents: Array<{
    label: string;
    date: string;
    color: string;
    detail?: string;
  }> = [];

  // Session Created event
  timelineEvents.push({
    label: 'Session Created',
    date: formatDate(session.created_at),
    color: 'bg-blue-500',
  });

  // Session Completed event
  if (session.completed_at) {
    timelineEvents.push({
      label: 'Session Completed',
      date: formatDate(session.completed_at),
      color: 'bg-green-500',
    });
  }

  // Verification Completed event
  if (session.extracted_data?.verification_date) {
    timelineEvents.push({
      label: 'Verification Completed',
      date: formatDate(session.extracted_data.verification_date),
      color: 'bg-emerald-500',
      detail: session.extracted_data.verified_by
        ? `by ${session.extracted_data.verified_by}`
        : undefined,
    });
  }

  // Last Admin Update event
  if (session.extracted_data?.last_admin_update) {
    timelineEvents.push({
      label: 'Last Admin Update',
      date: formatDate(session.extracted_data.last_admin_update),
      color: 'bg-orange-500',
      detail: session.extracted_data.updated_by
        ? `by ${session.extracted_data.updated_by}`
        : undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Timeline Section */}
      <SectionCard title="Session Timeline" icon={PiClockBold}>
        <div className="space-y-4">
          {timelineEvents.map((event, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${event.color}`} />
                {i < timelineEvents.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-slate-900">
                  {event.label}
                </p>
                <p className="text-xs text-slate-500">{event.date}</p>
                {event.detail && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {event.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Admin Notes Section */}
      {session.extracted_data?.admin_notes && (
        <SectionCard title="Admin Notes" icon={PiNoteBold}>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {session.extracted_data.admin_notes}
          </p>
        </SectionCard>
      )}

      {/* Raw Data Section */}
      {session.extracted_data &&
        Object.keys(session.extracted_data).length > 0 && (
          <SectionCard title="Raw Session Data" icon={PiCodeBold}>
            <div className="bg-slate-50 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
              <pre>{JSON.stringify(session.extracted_data, null, 2)}</pre>
            </div>
          </SectionCard>
        )}
    </div>
  );
}
