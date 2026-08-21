'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PiPlayBold, PiQueueBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from '@/components/backend';
import { ThreeSourcePanel } from '@/components/admin/finance/cycle-match/ThreeSourcePanel';
import { MatchWorklist } from '@/components/admin/finance/cycle-match/MatchWorklist';
import { formatZar } from '@/components/admin/finance/cycle-match/money';
import { SourceDot } from '@/components/admin/finance/cycle-match/SourceDot';
import type { CycleMatchWorkbench } from '@/lib/billing/cycle-match/load-workbench';

type TabId = 'all' | 'matched_3' | 'matched_2' | 'unmatched' | 'resolved_today';

function monthOptions(): string[] {
  const out: string[] = [];
  const now = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' })
  );
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-ZA', {
    month: 'short',
    year: 'numeric',
  });
}

export default function ReconciliationWorkbenchPage() {
  const [month, setMonth] = useState(monthOptions()[0]);
  const [tab, setTab] = useState<TabId>('all');
  const [data, setData] = useState<CycleMatchWorkbench | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const fetchData = useCallback(async (ym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/finance/cycle-match?month=${encodeURIComponent(ym)}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load cycle match');
      setData(body as CycleMatchWorkbench);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycle match');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(month);
  }, [fetchData, month]);

  const runMatch = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/finance/cycle-match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, sync: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to run match');
      await fetchData(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run match');
    } finally {
      setRunning(false);
    }
  };

  const rows = useMemo(() => {
    if (!data) return [];
    if (tab === 'all') return data.worklist;
    if (tab === 'resolved_today') {
      return data.worklist.filter((r) => r.exceptionId && data.tabs.resolved_today);
    }
    return data.worklist.filter((r) => r.matchState === tab);
  }, [data, tab]);

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading reconciliation…" />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState title="Could not load reconciliation" message={error} onRetry={() => void fetchData(month)} />
      </AdminPage>
    );
  }

  if (!data) return null;

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: 'all', label: 'All', count: data.tabs.all },
    { id: 'matched_3', label: 'Matched', count: data.tabs.matched_3 },
    { id: 'matched_2', label: '2 of 3', count: data.tabs.matched_2 },
    { id: 'unmatched', label: 'Unmatched', count: data.tabs.unmatched },
    { id: 'resolved_today', label: 'Resolved today', count: data.tabs.resolved_today },
  ];

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Payments"
        title="Reconciliation"
        subtitle={`Cycle ${data.monthLabel}${data.run ? ` · ${data.run.servicesChecked} services` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-2 hidden items-center gap-3 text-xs text-slate-500 sm:flex">
              <span className="inline-flex items-center gap-1.5">
                <SourceDot tone="platform" /> ISP Platform
              </span>
              <span className="inline-flex items-center gap-1.5">
                <SourceDot tone="zoho" /> Zoho Books
              </span>
              <span className="inline-flex items-center gap-1.5">
                <SourceDot tone="netcash" /> Netcash
              </span>
            </div>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Cycle" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions().map((ym) => (
                  <SelectItem key={ym} value={ym}>
                    Cycle: {monthLabel(ym)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/finance/reconciliation/cash-queue">
                <PiQueueBold className="mr-1.5 h-4 w-4" />
                Cash queue
              </Link>
            </Button>
            <Button
              size="sm"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              onClick={() => void runMatch()}
              disabled={running}
            >
              <PiPlayBold className="mr-1.5 h-4 w-4" />
              {running ? 'Running…' : 'Run match'}
            </Button>
          </div>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Matched 3 of 3"
          value={data.kpis.matched3Count}
          subtitle={`${formatZar(data.kpis.matched3Amount)} · ${data.kpis.matched3Pct}% of cycle`}
        />
        <StatCard
          label="Matched 2 of 3"
          value={data.kpis.matched2Count}
          subtitle={`${formatZar(data.kpis.matched2Amount)} · needs review`}
        />
        <StatCard
          label="Unmatched"
          value={data.kpis.unmatchedCount}
          subtitle={`${formatZar(data.kpis.unmatchedAmount)} · one source only`}
        />
        <StatCard
          label="Net variance to clear"
          value={formatZar(data.kpis.netVariance)}
          subtitle={`${data.kpis.openExceptions} open exceptions${
            data.kpis.oldestOpenDays != null ? ` · oldest ${data.kpis.oldestOpenDays}d` : ''
          }`}
        />
      </div>

      {data.selected && <ThreeSourcePanel panel={data.selected} />}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Match state">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={
                active
                  ? 'rounded-lg bg-circleTel-orange px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
              }
            >
              {t.label} {t.count}
            </button>
          );
        })}
      </div>

      <MatchWorklist rows={rows} title="Exceptions worklist" />
    </AdminPage>
  );
}
