'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PiArrowsClockwiseBold,
  PiCalendarBlankBold,
} from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  AdminPage,
  LoadingState,
  ErrorState,
} from '@/components/backend';
import {
  DayDoneBanner,
  CashMatchStrip,
  ExceptionTable,
  SecondaryKpis,
  DeepLinks,
  ThreeWayInvoiceTable,
} from '@/components/admin/billing/recon';
import type {
  ReconHubResponse,
  ReconWindow,
} from '@/lib/billing/recon-hub/types';

const WINDOWS: Array<{ id: ReconWindow; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '48h', label: 'Last 48h' },
];

function windowLabel(summary: ReconHubResponse['summary']): string {
  const from = new Date(summary.windowFrom).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  });
  const to = new Date(summary.windowTo).toLocaleString('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Johannesburg',
  });
  return `${summary.window} · ${from} → ${to}`;
}

export default function BillingReconHubPage() {
  const [windowKey, setWindowKey] = useState<ReconWindow>('yesterday');
  const [data, setData] = useState<ReconHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHub = useCallback(async (w: ReconWindow) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/admin/billing/recon-hub?window=${encodeURIComponent(w)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error || 'Failed to load recon hub'
        );
      }

      setData((await res.json()) as ReconHubResponse);
    } catch (err) {
      console.error('Error fetching recon hub:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recon hub');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHub(windowKey);
  }, [fetchHub, windowKey]);

  const bannerUnmatched = useMemo(() => {
    if (!data) return 0;
    return (
      data.summary.unmatchedNetcashToCt + data.summary.ctPaidBooksOpenCount
    );
  }, [data]);

  if (loading && !data) {
    return (
      <AdminPage>
        <LoadingState message="Loading three-way recon…" />
      </AdminPage>
    );
  }

  if (error && !data) {
    return (
      <AdminPage>
        <ErrorState
          title="Could not load recon hub"
          message={error}
          onRetry={() => void fetchHub(windowKey)}
        />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage>
        <ErrorState
          title="No recon data"
          message="The recon hub returned an empty response."
          onRetry={() => void fetchHub(windowKey)}
        />
      </AdminPage>
    );
  }

  const { summary, exceptions, threeWayInvoices } = data;

  return (
    <AdminPage>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Cash day board
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Platform ledger invoices (SoR) · Zoho Books mirror · Netcash cash
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
              role="tablist"
              aria-label="Recon window"
            >
              {WINDOWS.map((w) => {
                const active = windowKey === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setWindowKey(w.id)}
                    className={
                      active
                        ? 'inline-flex items-center gap-1.5 rounded-md bg-circleTel-orange px-3 py-1.5 text-xs font-semibold text-white'
                        : 'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
                    }
                  >
                    <PiCalendarBlankBold className="h-3.5 w-3.5" aria-hidden />
                    {w.label}
                  </button>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchHub(windowKey)}
              disabled={loading}
            >
              <PiArrowsClockwiseBold
                className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        </div>

        <DayDoneBanner
          dayDone={summary.dayDone}
          unmatchedCount={bannerUnmatched}
          ctPaidBooksOpenCount={summary.ctPaidBooksOpenCount}
          unmatchedNetcashToCt={summary.unmatchedNetcashToCt}
          bankNetcashOnlyCount={summary.bankMatch?.netcashOnlyCount ?? 0}
          windowLabel={windowLabel(summary)}
        />

        <CashMatchStrip
          unmatchedNetcashToCt={summary.unmatchedNetcashToCt}
          netcashCompletedInWindow={summary.netcashCompletedInWindow}
          netcashMatchedInWindow={summary.netcashMatchedInWindow}
          zohoPaymentLagCount={summary.zohoPaymentLagCount}
          ctPaidBooksOpenCount={summary.ctPaidBooksOpenCount}
          paynowRecon={summary.paynowRecon}
        />

        <ThreeWayInvoiceTable invoices={threeWayInvoices} />

        <ExceptionTable exceptions={exceptions} />

        <SecondaryKpis
          openAr={summary.secondary.openAr}
          collectedLast30Days={summary.secondary.collectedLast30Days}
          activeServices={summary.secondary.activeServices}
        />

        <DeepLinks />
      </div>
    </AdminPage>
  );
}
