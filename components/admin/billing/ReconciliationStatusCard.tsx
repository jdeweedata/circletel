'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiCheckCircleBold,
  PiWarningBold,
  PiXCircleBold,
  PiArrowClockwiseBold,
  PiClockBold,
} from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatCard } from '@/components/admin/shared/StatCard';

interface ReconciliationStatus {
  lastRun: {
    date: string;
    status: 'success' | 'partial' | 'failed';
    duration_ms: number;
  } | null;
  counts: {
    total: number;
    matched: number;
    alreadyPaid: number;
    newlyMatched: number;
    unmatched: number;
  };
  unmatchedTransactions: Array<{
    netcashRef: string;
    yourRef: string;
    amount: number;
    reason: string;
  }>;
}

const STATUS_CONFIG = {
  success: {
    Icon: PiCheckCircleBold,
    label: 'Success',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    iconClass: 'text-green-600',
  },
  partial: {
    Icon: PiWarningBold,
    label: 'Partial',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
    iconClass: 'text-amber-500',
  },
  failed: {
    Icon: PiXCircleBold,
    label: 'Failed',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    iconClass: 'text-red-600',
  },
} as const;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  });
}

function formatRands(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ReconciliationStatusCard() {
  const [status, setStatus] = useState<ReconciliationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch('/api/admin/billing/reconciliation/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: ReconciliationStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const refreshAction = (
    <button
      onClick={() => fetchStatus(true)}
      disabled={refreshing || loading}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
      title="Refresh status"
    >
      <PiArrowClockwiseBold
        className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
      />
      {refreshing ? 'Refreshing…' : 'Refresh'}
    </button>
  );

  if (loading) {
    return (
      <SectionCard title="PayNow Reconciliation" icon={PiClockBold} action={refreshAction}>
        <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
          <PiArrowClockwiseBold className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading reconciliation status…</span>
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="PayNow Reconciliation" icon={PiClockBold} action={refreshAction}>
        <div className="flex items-center gap-2 text-red-600 py-6">
          <PiXCircleBold className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load status: {error}</p>
        </div>
      </SectionCard>
    );
  }

  const lastRun = status?.lastRun ?? null;
  const counts = status?.counts ?? {
    total: 0,
    matched: 0,
    alreadyPaid: 0,
    newlyMatched: 0,
    unmatched: 0,
  };
  const unmatchedTransactions = status?.unmatchedTransactions ?? [];

  const runConfig = lastRun ? STATUS_CONFIG[lastRun.status] : null;

  return (
    <SectionCard title="PayNow Reconciliation" icon={PiClockBold} action={refreshAction}>
      <div className="space-y-6">
        {/* Last run banner */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-2 flex-1">
            <PiClockBold className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {lastRun ? (
              <span className="text-sm text-slate-600">
                Last run:{' '}
                <span className="font-semibold text-slate-900">{formatDate(lastRun.date)}</span>
                {' · '}
                <span className="text-slate-500">{formatDuration(lastRun.duration_ms)}</span>
              </span>
            ) : (
              <span className="text-sm text-slate-500 italic">No runs recorded yet</span>
            )}
          </div>

          {runConfig && lastRun && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${runConfig.badgeClass}`}
            >
              <runConfig.Icon className={`w-3.5 h-3.5 ${runConfig.iconClass}`} />
              {runConfig.label}
            </span>
          )}
        </div>

        {/* Count stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Matched" value={counts.matched} />
          <StatCard label="Already Paid" value={counts.alreadyPaid} />
          <StatCard
            label="Newly Matched"
            value={counts.newlyMatched}
            indicator={counts.newlyMatched > 0 ? 'pulse' : 'none'}
          />
          <StatCard
            label="Unmatched"
            value={counts.unmatched}
            indicator={counts.unmatched > 0 ? 'pulse' : 'none'}
          />
        </div>

        {/* Unmatched transactions table */}
        {unmatchedTransactions.length > 0 ? (
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <PiWarningBold className="w-4 h-4 text-amber-500" />
              Unmatched Transactions — Manual Review Required
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      NetCash Ref
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Your Ref
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unmatchedTransactions.map((tx, idx) => (
                    <tr key={`${tx.netcashRef}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {tx.netcashRef || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {tx.yourRef || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatRands(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600 font-medium">
                        {tx.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          counts.total > 0 && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-3">
              <PiCheckCircleBold className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">All transactions matched — no manual review needed.</p>
            </div>
          )
        )}
      </div>
    </SectionCard>
  );
}
