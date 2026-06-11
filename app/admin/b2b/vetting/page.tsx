'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PiCheckCircleBold,
  PiFilesBold,
  PiHourglassBold,
  PiMagnifyingGlassBold,
  PiWarningBold,
} from 'react-icons/pi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/backend';
import { cn } from '@/lib/utils';

// ---------- Types (mirror /api/admin/b2b/vetting) ----------

interface QueueSubmission {
  id: string;
  customer_id: string;
  segment: string;
  status: string;
  document_vetting_status: string;
  submitted_at: string | null;
  vetting_due_date: string | null;
  docs_total: number;
  docs_approved: number;
  docs_rejected: number;
  customers: {
    id: string;
    account_number: string;
    business_name: string;
    onboarding_status: string;
  } | null;
}

// ---------- Vetting status model ----------

interface VettingStatusMeta {
  id: string;
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const VETTING_STATUSES: VettingStatusMeta[] = [
  { id: 'documents_pending', label: 'Awaiting review', variant: 'warning' },
  { id: 'under_review', label: 'Under review', variant: 'info' },
  { id: 'rejected', label: 'Changes requested', variant: 'error' },
  { id: 'approved', label: 'Approved', variant: 'success' },
];

const STATUS_META = Object.fromEntries(VETTING_STATUSES.map((s) => [s.id, s]));

function statusMeta(status: string): VettingStatusMeta {
  return STATUS_META[status] ?? { id: status, label: status, variant: 'neutral' };
}

const SEGMENTS = [
  { value: 'all', label: 'All segments' },
  { value: 'unjani', label: 'Unjani' },
  { value: 'smb', label: 'SMB' },
  { value: 'edu', label: 'Education' },
];

// ---------- SLA helpers (vetting target: 2 business days from submission) ----------

type SlaStatus = 'ok' | 'warn' | 'err';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days until the vetting due date (negative = overdue). Null when no due date or already decided. */
function slaDaysLeft(s: QueueSubmission): number | null {
  if (!s.vetting_due_date) return null;
  if (s.document_vetting_status === 'approved') return null; // decided — SLA no longer runs
  return Math.ceil((new Date(s.vetting_due_date).getTime() - Date.now()) / MS_PER_DAY);
}

function slaStatus(s: QueueSubmission): SlaStatus | null {
  const days = slaDaysLeft(s);
  if (days === null) return null;
  if (days < 0) return 'err';
  if (days <= 1) return 'warn';
  return 'ok';
}

const SLA_TEXT: Record<SlaStatus, string> = {
  ok: 'text-green-600',
  warn: 'text-amber-600',
  err: 'text-red-600',
};

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-ZA') : '—';
}

// ---------- Page ----------

export default function B2BVettingQueuePage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<QueueSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [segment, setSegment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      const url = new URL('/api/admin/b2b/vetting', window.location.origin);
      if (segment !== 'all') url.searchParams.set('segment', segment);
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data.submissions || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useEffect(() => {
    setLoading(true);
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ---------- Derived ----------

  const counts = useMemo(() => {
    const byStatus = (id: string) =>
      submissions.filter((s) => s.document_vetting_status === id).length;
    const weekAgo = Date.now() - 7 * MS_PER_DAY;
    return {
      awaiting: byStatus('documents_pending') + byStatus('under_review'),
      changes: byStatus('rejected'),
      approvedThisWeek: submissions.filter(
        (s) =>
          s.document_vetting_status === 'approved' &&
          s.submitted_at !== null &&
          new Date(s.submitted_at).getTime() >= weekAgo
      ).length,
      overdue: submissions.filter((s) => slaStatus(s) === 'err').length,
    };
  }, [submissions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = submissions.filter(
      (s) =>
        (!statusFilter || s.document_vetting_status === statusFilter) &&
        (!q ||
          `${s.customers?.business_name ?? ''} ${s.customers?.account_number ?? ''}`
            .toLowerCase()
            .includes(q))
    );
    // Queue order: most urgent first — overdue, then closest due date, then decided items
    return list.sort((a, b) => {
      const da = slaDaysLeft(a);
      const db = slaDaysLeft(b);
      if (da === null && db === null) {
        return (
          new Date(b.submitted_at ?? 0).getTime() - new Date(a.submitted_at ?? 0).getTime()
        );
      }
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [submissions, statusFilter, query]);

  // ---------- Render ----------

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <LoadingState message="Loading vetting queue…" />
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ErrorState
          title="Failed to load the vetting queue"
          message="Your session may lack the kyc:verify permission, or the server may be unavailable."
          onRetry={() => {
            setLoading(true);
            fetchSubmissions();
          }}
        />
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader
        title="Document Vetting"
        subtitle={`${counts.awaiting} awaiting review · vetting target 2 business days from submission`}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Awaiting review"
          value={counts.awaiting}
          icon={<PiHourglassBold className="w-5 h-5" />}
          description="documents pending or under review"
        />
        <StatCard
          label="Changes requested"
          value={counts.changes}
          icon={<PiFilesBold className="w-5 h-5" />}
          description="waiting on the nurse to re-upload"
        />
        <StatCard
          label="Approved (last 7 days)"
          value={counts.approvedThisWeek}
          icon={<PiCheckCircleBold className="w-5 h-5" />}
          description="submissions fully approved"
        />
        <StatCard
          label="Overdue SLA"
          value={counts.overdue}
          icon={<PiWarningBold className="w-5 h-5" />}
          description="past the 2-business-day target"
          badge={
            counts.overdue > 0 ? (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                Attention
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search business name or account number…"
            aria-label="Search submissions"
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
          />
        </div>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          aria-label="Filter by segment"
          className="rounded-md border border-gray-200 bg-white py-2 px-3 text-sm text-gray-700"
        >
          {SEGMENTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {VETTING_STATUSES.map((s) => {
            const active = statusFilter === s.id;
            const count = submissions.filter((x) => x.document_vetting_status === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(active ? '' : s.id)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  active
                    ? 'border-circleTel-orange bg-circleTel-orange-light text-circleTel-orange-accessible'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-circleTel-orange'
                )}
              >
                {s.label}
                <span className="tabular-nums text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<PiFilesBold />}
            title={
              submissions.length === 0
                ? 'No submissions to review'
                : 'No submissions match these filters'
            }
            description={
              submissions.length === 0
                ? 'When a clinic completes the onboarding wizard, its documents land here.'
                : 'Clear the search or a filter to see the queue.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Vetting status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const meta = statusMeta(s.document_vetting_status);
                  const st = slaStatus(s);
                  const days = slaDaysLeft(s);
                  const progressPct = s.docs_total
                    ? Math.round((s.docs_approved / s.docs_total) * 100)
                    : 0;
                  return (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/admin/b2b/vetting/${s.id}`)}
                    >
                      <TableCell>
                        <div className="font-semibold text-gray-900">
                          {s.customers?.business_name || '—'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">
                          {s.customers?.account_number || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.segment} variant="neutral" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={meta.label} variant={meta.variant} showDot />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 whitespace-nowrap">
                          <span className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            <span
                              className={cn(
                                'block h-full rounded-full',
                                s.docs_rejected > 0 ? 'bg-amber-500' : 'bg-green-600'
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </span>
                          {s.docs_approved}/{s.docs_total} approved
                          {s.docs_rejected > 0 && (
                            <span className="text-red-600">· {s.docs_rejected} rejected</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {st === null || days === null ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <span
                            className={cn(
                              'text-xs font-semibold whitespace-nowrap',
                              SLA_TEXT[st]
                            )}
                          >
                            {days < 0
                              ? `${Math.abs(days)}d overdue`
                              : days === 0
                                ? 'due today'
                                : `${days}d left`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(s.submitted_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
          <span>
            Showing {filtered.length} of {submissions.length} submissions · most urgent first
          </span>
          <span>Click a row to review its documents</span>
        </div>
      </div>
    </main>
  );
}
