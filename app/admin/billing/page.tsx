'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PiArrowsClockwiseBold,
  PiClockBold,
  PiFileTextBold,
  PiPlayBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPage,
  LoadingState,
  ErrorState,
} from '@/components/backend';
import {
  CashMatchStrip,
  DayDoneBanner,
  DeepLinks,
  ExceptionTable,
  SecondaryKpis,
} from '@/components/admin/billing/recon';
import type {
  ReconHubResponse,
  ReconWindow,
} from '@/lib/billing/recon-hub/types';

const WINDOW_OPTIONS: Array<{ value: ReconWindow; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '48h', label: 'Last 48 hours' },
];

function windowLabel(window: ReconWindow): string {
  return WINDOW_OPTIONS.find((o) => o.value === window)?.label ?? window;
}

export default function BillingDashboard() {
  const [window, setWindow] = useState<ReconWindow>('yesterday');
  const [data, setData] = useState<ReconHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const fetchHub = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/admin/billing/recon-hub?window=${encodeURIComponent(window)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || 'Failed to load recon hub'
        );
      }

      const body = (await res.json()) as ReconHubResponse;
      setData(body);
    } catch (err) {
      console.error('Error fetching recon hub:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recon hub');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [window]);

  useEffect(() => {
    fetchHub();
  }, [fetchHub]);

  const handleTriggerPayNow = async () => {
    setTriggerLoading(true);
    try {
      const res = await fetch('/api/admin/billing/reconciliation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'paynow' }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error || 'Failed to trigger PayNow recon'
        );
      }
      await fetchHub();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to trigger PayNow recon'
      );
    } finally {
      setTriggerLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading cash-match recon hub..." />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Unable to load recon hub"
          message={error}
          onRetry={fetchHub}
        />
      </AdminPage>
    );
  }

  const summary = data?.summary;

  return (
    <AdminPage>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Finance / Billing / Cash Match</p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Billing</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Daily cash match — NetCash completed payments to CircleTel invoices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={window} onValueChange={(value) => setWindow(value as ReconWindow)}>
            <SelectTrigger className="w-[160px] rounded-lg border-slate-200" aria-label="Recon window">
              <SelectValue placeholder="Window" />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchHub} disabled={loading || triggerLoading}>
            <PiArrowsClockwiseBold className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerPayNow}
            disabled={triggerLoading || loading}
          >
            <PiPlayBold className="w-4 h-4 mr-2" />
            {triggerLoading ? 'Triggering…' : 'Trigger PayNow recon'}
          </Button>
          <Button size="sm" className="bg-circleTel-orange hover:bg-circleTel-orange-dark" asChild>
            <Link href="/admin/billing/invoices">
              <PiFileTextBold className="w-4 h-4 mr-2" />
              View All Invoices
            </Link>
          </Button>
        </div>
      </div>

      {error && data && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50/80 shadow-sm px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
          Supabase recon hub
        </Badge>
        <span className="text-xs text-slate-400">Window · {windowLabel(window)}</span>
        {summary ? (
          <span className="text-xs text-slate-500">
            {summary.netcashCompletedInWindow} NetCash completed ·{' '}
            {summary.netcashMatchedInWindow} matched
          </span>
        ) : null}
      </div>

      {summary && (
        <>
          <DayDoneBanner
            dayDone={summary.dayDone}
            unmatchedCount={summary.unmatchedNetcashToCt}
            windowLabel={windowLabel(window)}
          />

          <CashMatchStrip
            unmatchedNetcashToCt={summary.unmatchedNetcashToCt}
            netcashCompletedInWindow={summary.netcashCompletedInWindow}
            netcashMatchedInWindow={summary.netcashMatchedInWindow}
            zohoPaymentLagCount={summary.zohoPaymentLagCount}
            paynowRecon={summary.paynowRecon}
          />

          <SecondaryKpis
            openAr={summary.secondary.openAr}
            collectedLast30Days={summary.secondary.collectedLast30Days}
            activeServices={summary.secondary.activeServices}
          />
        </>
      )}

      <ExceptionTable exceptions={data?.exceptions ?? []} />

      <DeepLinks />

      <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <PiClockBold className="w-4 h-4" aria-hidden="true" />
          {loading ? 'Refreshing…' : `Recon window · ${windowLabel(window)}`}
        </span>
      </div>
    </AdminPage>
  );
}
