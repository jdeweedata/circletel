'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PiBroadcastBold,
  PiCheckCircleBold,
  PiSpinnerBold,
  PiWarningCircleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { StatusBadge } from '@/components/admin/shared';

interface MTNWholesaleFeasibilityCardProps {
  lat: number;
  lng: number;
  address: string;
  autoCheck?: boolean;
}

interface FwbResult {
  feasible: boolean;
  region: string | null;
  capacityMbps: number | null;
  medium: string | null;
  nni: string | null;
  upNode: string | null;
  reference: string | null;
}

export default function MTNWholesaleFeasibilityCard({
  lat,
  lng,
  address,
  autoCheck = true,
}: MTNWholesaleFeasibilityCardProps) {
  const [result, setResult] = useState<FwbResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastAutoCheckKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [lat, lng]);

  const checkFeasibility = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/coverage/mtn/csp-feasibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, capacityMbps: 100 }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(
          (body?.error as string) || `MTN CSP feasibility check failed (${response.status})`
        );
      }

      setResult(body.data as FwbResult);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'MTN Wholesale feasibility check failed');
    } finally {
      setIsChecking(false);
    }
  }, [address, lat, lng]);

  useEffect(() => {
    if (!autoCheck) return;
    const key = `${lat}:${lng}`;
    if (lastAutoCheckKeyRef.current === key) return;
    lastAutoCheckKeyRef.current = key;
    void checkFeasibility();
  }, [autoCheck, checkFeasibility, lat, lng]);

  const panelClass = result?.feasible
    ? 'border-emerald-200 bg-emerald-50'
    : 'border-red-200 bg-red-50';
  const PanelIcon = result?.feasible ? PiCheckCircleBold : PiXCircleBold;
  const iconClass = result?.feasible ? 'text-emerald-600' : 'text-red-600';

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-orange-50 p-2 text-circleTel-orange">
            <PiBroadcastBold className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Fixed Wireless Broadband
              </h2>
              <StatusBadge status="MTN Wholesale" variant="info" />
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              MTN National Wholesale CSP feasibility — the product the LTE / 5G coverage maps don&apos;t cover.
            </p>
            <p className="mt-1 text-xs text-slate-400 truncate max-w-2xl">{address}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => checkFeasibility()}
          disabled={isChecking}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-circleTel-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C45A30] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isChecking ? (
            <PiSpinnerBold className="h-4 w-4 animate-spin" />
          ) : (
            <PiBroadcastBold className="h-4 w-4" />
          )}
          {isChecking ? 'Checking…' : 'Re-check Feasibility'}
        </button>
      </div>

      {isChecking && !result && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <PiSpinnerBold className="h-4 w-4 animate-spin" />
          Querying MTN Wholesale feasibility…
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <PiWarningCircleBold className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className={`mt-4 rounded-lg border px-4 py-4 ${panelClass}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <PanelIcon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {result.feasible ? 'Feasible at this location' : 'Not feasible at this location'}
                  </p>
                  <StatusBadge
                    status={result.feasible ? 'Feasible' : 'Not feasible'}
                    variant={result.feasible ? 'success' : 'error'}
                  />
                </div>
                {result.region && (
                  <p className="mt-2 text-sm text-slate-700">Region: {result.region}</p>
                )}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 sm:grid-cols-4 md:text-right">
              <div>
                <dt className="text-slate-400">Capacity</dt>
                <dd className="font-semibold text-slate-800">
                  {result.capacityMbps != null ? `${result.capacityMbps} Mbps` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Medium</dt>
                <dd className="font-semibold text-slate-800">{result.medium ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">NNI</dt>
                <dd className="font-semibold text-slate-800">{result.nni ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Up Node</dt>
                <dd className="font-semibold text-slate-800">{result.upNode ?? '—'}</dd>
              </div>
            </dl>
          </div>
          {result.reference && (
            <p className="mt-3 text-xs text-slate-400">Feasibility ref: {result.reference}</p>
          )}
        </div>
      )}
    </section>
  );
}
