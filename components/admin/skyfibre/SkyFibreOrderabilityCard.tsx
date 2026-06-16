'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PiCheckCircleBold,
  PiClockBold,
  PiRadioBold,
  PiSpinnerBold,
  PiWarningCircleBold,
  PiXCircleBold,
} from 'react-icons/pi';
import { StatusBadge } from '@/components/admin/shared';
import {
  buildAdminSkyFibreOrderabilityRequest,
  getSkyFibreDecisionLabel,
} from '@/lib/coverage/skyfibre/admin-ui';
import type {
  SkyFibreCapacityMbps,
  SkyFibreOrderabilityDecision,
  SkyFibreOrderabilityResult,
} from '@/lib/coverage/skyfibre/types';

interface SkyFibreOrderabilityCardProps {
  lat: number;
  lng: number;
  address: string;
  leadId?: string | null;
  packageName?: string;
  initialCapacityMbps?: SkyFibreCapacityMbps;
  autoCheck?: boolean;
  onCheckingChange?: (isChecking: boolean) => void;
  onResult?: (result: SkyFibreOrderabilityResult | null) => void;
  onError?: (error: string | null) => void;
}

const CAPACITIES: SkyFibreCapacityMbps[] = [50, 100, 200];

const DECISION_STYLES: Record<SkyFibreOrderabilityDecision, {
  icon: typeof PiCheckCircleBold;
  variant: 'success' | 'warning' | 'error' | 'neutral';
  panelClass: string;
  iconClass: string;
}> = {
  orderable: {
    icon: PiCheckCircleBold,
    variant: 'success',
    panelClass: 'border-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-600',
  },
  covered_not_orderable: {
    icon: PiXCircleBold,
    variant: 'warning',
    panelClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
  },
  manual_review: {
    icon: PiWarningCircleBold,
    variant: 'warning',
    panelClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
  },
  not_covered: {
    icon: PiXCircleBold,
    variant: 'error',
    panelClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
  },
  error: {
    icon: PiWarningCircleBold,
    variant: 'error',
    panelClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
  },
};

export default function SkyFibreOrderabilityCard({
  lat,
  lng,
  address,
  leadId,
  packageName,
  initialCapacityMbps = 100,
  autoCheck = false,
  onCheckingChange,
  onResult,
  onError,
}: SkyFibreOrderabilityCardProps) {
  const [capacityMbps, setCapacityMbps] = useState<SkyFibreCapacityMbps>(initialCapacityMbps);
  const [result, setResult] = useState<SkyFibreOrderabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastAutoCheckKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setCapacityMbps(initialCapacityMbps);
    setResult(null);
    setError(null);
  }, [initialCapacityMbps, lat, lng, leadId]);

  const checkOrderability = useCallback(async (capacityOverride?: SkyFibreCapacityMbps) => {
    const selectedCapacity = capacityOverride ?? capacityMbps;
    setIsChecking(true);
    setError(null);
    onCheckingChange?.(true);
    onError?.(null);

    try {
      const response = await fetch('/api/coverage/skyfibre/orderability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildAdminSkyFibreOrderabilityRequest({ leadId, lat, lng, capacityMbps: selectedCapacity })
        ),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.success) {
        throw new Error(body?.error || 'SkyFibre orderability check failed');
      }

      const nextResult = body.data as SkyFibreOrderabilityResult;
      setResult(nextResult);
      onResult?.(nextResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SkyFibre orderability check failed';
      setResult(null);
      setError(message);
      onResult?.(null);
      onError?.(message);
    } finally {
      setIsChecking(false);
      onCheckingChange?.(false);
    }
  }, [capacityMbps, lat, leadId, lng, onCheckingChange, onError, onResult]);

  useEffect(() => {
    if (!autoCheck) return;

    const autoCheckKey = `${leadId || 'coords'}:${lat}:${lng}:${initialCapacityMbps}`;
    if (lastAutoCheckKeyRef.current === autoCheckKey) return;

    lastAutoCheckKeyRef.current = autoCheckKey;
    void checkOrderability(initialCapacityMbps);
  }, [autoCheck, checkOrderability, initialCapacityMbps, lat, leadId, lng]);

  const decision = result?.decision;
  const style = decision ? DECISION_STYLES[decision] : null;
  const DecisionIcon = style?.icon;

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-orange-50 p-2 text-circleTel-orange">
            <PiRadioBold className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">SkyFibre Orderability</h2>
              <StatusBadge status="MTN CSP" variant="info" />
            </div>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Confirm whether MTN CSP will accept a SkyFibre order at this Tarana location.
            </p>
            {packageName && (
              <p className="mt-2 text-xs font-semibold text-slate-600">{packageName}</p>
            )}
            <p className="mt-1 text-xs text-slate-400 truncate max-w-2xl">{address}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {CAPACITIES.map((capacity) => (
              <button
                key={capacity}
                type="button"
                onClick={() => setCapacityMbps(capacity)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  capacityMbps === capacity
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-pressed={capacityMbps === capacity}
              >
                {capacity} Mbps
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => checkOrderability()}
            disabled={isChecking}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-circleTel-orange px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C45A30] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isChecking ? (
              <PiSpinnerBold className="h-4 w-4 animate-spin" />
            ) : (
              <PiClockBold className="h-4 w-4" />
            )}
            {isChecking ? 'Checking...' : 'Check CSP Orderability'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && style && DecisionIcon && (
        <div className={`mt-4 rounded-lg border px-4 py-4 ${style.panelClass}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <DecisionIcon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {getSkyFibreDecisionLabel(result.decision)}
                  </p>
                  <StatusBadge status={`CSP: ${result.cspOrderability?.status ?? 'not checked'}`} variant={style.variant} />
                  <StatusBadge status={`TCS: ${result.tcsCoverage.confidence} confidence`} variant={style.variant} />
                </div>
                <p className="mt-2 text-sm text-slate-700">{result.tcsCoverage.reason}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 sm:grid-cols-4 md:text-right">
              <div>
                <dt className="text-slate-400">Speed</dt>
                <dd className="font-semibold text-slate-800">{result.capacityMbps} Mbps</dd>
              </div>
              <div>
                <dt className="text-slate-400">Method</dt>
                <dd className="font-semibold text-slate-800">{result.cspOrderability?.method ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">RN Evidence</dt>
                <dd className="font-semibold text-slate-800">{result.tcsCoverage.nearestBnActiveRnCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Zone</dt>
                <dd className="font-semibold text-slate-800">{result.cspOrderability?.taranaZone ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
