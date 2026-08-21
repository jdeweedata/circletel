'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PiDownloadSimpleBold, PiPlayBold } from 'react-icons/pi';
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
import { SourceDot } from '@/components/admin/finance/cycle-match/SourceDot';
import { MatchWorklist } from '@/components/admin/finance/cycle-match/MatchWorklist';
import { formatZar } from '@/components/admin/finance/cycle-match/money';
import { NetworkToCashFunnel } from '@/components/admin/finance/revenue-assurance/NetworkToCashFunnel';
import type { RevenueAssurancePayload } from '@/lib/billing/cycle-match/load-workbench';
import type { LeakType } from '@/lib/billing/cycle-match/types';

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

function reconHref(month: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ month, ...extra });
  return `/admin/finance/reconciliation?${params.toString()}`;
}

const LEAK_CARDS: Array<{
  type: LeakType;
  title: string;
  tone: 'red' | 'amber' | 'yellow' | 'blue';
  hint: string;
}> = [
  {
    type: 'never_invoiced',
    title: 'Live but never invoiced',
    tone: 'red',
    hint: 'services with no Zoho invoice',
  },
  {
    type: 'under_contract',
    title: 'Invoiced below contract',
    tone: 'amber',
    hint: 'Zoho rate trails platform price',
  },
  {
    type: 'promo_expired',
    title: 'Promo expired, still discounted',
    tone: 'yellow',
    hint: 'past promo end date',
  },
  {
    type: 'cancelled_still_billing',
    title: 'Cancelled but still billing',
    tone: 'blue',
    hint: 'off-network but still charged',
  },
];

export default function RevenueAssurancePage() {
  const [month, setMonth] = useState(monthOptions()[0]);
  const [leakFilter, setLeakFilter] = useState<string>('all');
  const [data, setData] = useState<RevenueAssurancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const fetchData = useCallback(async (ym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/finance/revenue-assurance?month=${encodeURIComponent(ym)}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to load revenue assurance');
      setData(body as RevenueAssurancePayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue assurance');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(month);
  }, [fetchData, month]);

  const runSweep = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/admin/finance/cycle-match/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, sync: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Sweep failed');
      await fetchData(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sweep failed');
    } finally {
      setRunning(false);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const header = [
      'service',
      'customer',
      'leak_type',
      'platform',
      'zoho',
      'exposure',
      'action',
    ];
    const lines = data.worklist.map((row) =>
      [
        row.serviceDisplayId,
        row.customerName,
        row.leakType || '',
        row.platformExVat,
        row.zohoExVat ?? '',
        row.signedVariance,
        row.actionLabel,
      ].join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-assurance-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = useMemo(() => {
    if (!data) return [];
    if (leakFilter === 'all') return data.worklist;
    return data.worklist.filter((r) => r.leakType === leakFilter);
  }, [data, leakFilter]);

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading revenue assurance…" />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Could not load revenue assurance"
          message={error}
          onRetry={() => void fetchData(month)}
        />
      </AdminPage>
    );
  }

  if (!data) return null;

  const neverInvoiced = data.funnel.leaks.never_invoiced.count;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Payments"
        title="Revenue Assurance"
        subtitle={
          data.run
            ? `Last sweep ${new Date(data.run.finishedAt || data.run.startedAt).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} · ${data.run.servicesChecked} services checked`
            : 'No sweep yet'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions().map((ym) => (
                  <SelectItem key={ym} value={ym}>
                    Cycle: {monthLabel(ym)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={data.worklist.length === 0}
            >
              <PiDownloadSimpleBold className="mr-1.5 h-4 w-4" />
              Export leakage report
            </Button>
            <Button
              size="sm"
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              onClick={() => void runSweep()}
              disabled={running}
            >
              <PiPlayBold className="mr-1.5 h-4 w-4" />
              {running ? 'Running…' : 'Run sweep'}
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
          label="Active services on network"
          value={data.kpis.activeServices}
          subtitle={`${formatZar(data.kpis.contractedValue)} contracted value`}
          href={reconHref(month)}
        />
        <StatCard
          label="Billed and collected"
          value={`${Number(data.kpis.billedAndCollectedPct).toFixed(1)}%`}
          subtitle={`${data.kpis.billedCount} services`}
          href={reconHref(month, { tab: 'matched_3' })}
        />
        <StatCard
          label="Leakage this cycle"
          value={formatZar(data.kpis.leakage)}
          subtitle={`${data.kpis.leakServiceCount} services affected`}
          href={reconHref(month, { leak: 'any' })}
        />
        <StatCard
          label="Recovered year to date"
          value={formatZar(data.kpis.recoveredYtd)}
          subtitle={`${data.kpis.recoveredCount} services returned to billing`}
          href={reconHref(month, { tab: 'resolved_today' })}
        />
      </div>

      <NetworkToCashFunnel funnel={data.funnel} month={month} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LEAK_CARDS.map((card) => {
          const leak = data.funnel.leaks[card.type];
          return (
            <Link
              key={card.type}
              href={reconHref(month, { leak: card.type })}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-circleTel-orange hover:shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                <SourceDot tone={card.tone} />
                {card.title}
              </div>
              <p className="text-xl font-semibold">{formatZar(leak.amount)}</p>
              <p className="text-xs text-slate-500">
                {leak.count} {card.hint}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={leakFilter} onValueChange={setLeakFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All leak types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All leak types</SelectItem>
            {LEAK_CARDS.map((card) => (
              <SelectItem key={card.type} value={card.type}>
                {card.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {neverInvoiced > 0 && (
          <p className="text-sm text-slate-500">
            Push {neverInvoiced} never-invoiced services via Create invoice on each row.
          </p>
        )}
      </div>

      <MatchWorklist
        rows={rows}
        title={`Open leakage ${data.kpis.leakServiceCount} services`}
      />
    </AdminPage>
  );
}
