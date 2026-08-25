'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiDownloadSimpleBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  AdminPage,
  LoadingState,
  ErrorState,
} from '@/components/backend';
import {
  AgingBucketsChart,
  HealthStatCards,
  MrrCollectionsChart,
  OverdueInvoiceRegister,
  SuspensionWatchlist,
  csvCell,
  downloadCsv,
  formatRand,
} from '@/components/admin/billing/health';
import { AGING_BUCKET_LABELS } from '@/lib/billing/health/aging';
import type {
  AgingBucketKey,
  BillingHealthResponse,
} from '@/lib/billing/health/types';

function exportArAgingCsv(data: BillingHealthResponse) {
  const lines: Array<string | number>[] = [
    ['AR Aging Summary'],
    ['Bucket', 'Amount'],
    ...(Object.keys(AGING_BUCKET_LABELS) as AgingBucketKey[]).map((key) => [
      AGING_BUCKET_LABELS[key],
      csvCell(formatRand(data.aging[key])),
    ]),
    ['Total unpaid', csvCell(formatRand(data.pastDue.totalAmount))],
    [''],
    ['Overdue Invoice Register'],
    ['Invoice #', 'Customer', 'Package', 'Due date', 'Days overdue', 'Aging', 'Amount due'],
    ...data.overdueInvoices.map((row) => [
      csvCell(row.invoiceNumber),
      csvCell(row.customerName),
      csvCell(row.packageName ?? ''),
      csvCell(row.dueDate),
      row.daysOverdue,
      AGING_BUCKET_LABELS[row.agingBucket],
      csvCell(formatRand(row.amountDue)),
    ]),
  ];

  downloadCsv(`ar-aging-${data.generatedAt.slice(0, 10)}.csv`, lines);
}

export default function BillingDashboard() {
  const [data, setData] = useState<BillingHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/admin/billing/health');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || 'Failed to load billing health'
        );
      }

      setData((await res.json()) as BillingHealthResponse);
    } catch (err) {
      console.error('Error fetching billing health:', err);
      setError(err instanceof Error ? err.message : 'Failed to load billing health');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading billing health..." />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Unable to load billing health"
          message={error}
          onRetry={fetchHealth}
        />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Billing Health
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Receivables, collections, and suspension queue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">Auto-updated daily 08:00 SAST</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchHealth}
            disabled={loading}
            aria-label="Refresh billing health"
          >
            <PiArrowsClockwiseBold className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => data && exportArAgingCsv(data)}
            disabled={!data}
          >
            <PiDownloadSimpleBold className="mr-2 h-4 w-4" />
            Export AR aging
          </Button>
        </div>
      </div>

      {error && data && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800 shadow-sm"
        >
          {error}
        </div>
      )}

      {data && (
        <>
          <HealthStatCards
            data={{
              mrr: data.mrr,
              pastDue: data.pastDue,
              suspension: data.suspension,
              unpaid: data.unpaid,
            }}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              <MrrCollectionsChart data={data.trend} />
            </div>
            <div className="min-w-0">
              <AgingBucketsChart aging={data.aging} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              <SuspensionWatchlist
                entries={data.watchlist}
                policyDays={data.suspension.policyDays}
                onSuspended={fetchHealth}
              />
            </div>
            <div className="min-w-0">
              <OverdueInvoiceRegister
                rows={data.overdueInvoices}
                totalOverdue={data.unpaid.overdue}
              />
            </div>
          </div>
        </>
      )}
    </AdminPage>
  );
}
