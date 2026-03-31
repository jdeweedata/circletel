'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { CoveragePrediction } from '@/lib/coverage/prediction/types';
import { DetailPageHeader } from '@/components/admin/shared';
import AddressInput from './components/AddressInput';
import CoverageResultPanel from './components/CoverageResultPanel';
import RecentChecksPanel, { saveRecentCheck } from './components/RecentChecksPanel';

const MAPS_LIBRARIES: ('places')[] = ['places'];

interface CheckResult {
  prediction: CoveragePrediction | null;
  baseStation: { lat: number; lng: number } | null;
  address: string;
  lat: number;
  lng: number;
}

export default function CoverageCheckerPage() {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: MAPS_LIBRARIES,
  });

  const handleCheck = useCallback(async (lat: number, lng: number, address: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/admin/tarana/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error ${res.status}`);
      }

      const data = await res.json() as {
        prediction: CoveragePrediction | null;
        baseStation: { lat: number; lng: number } | null;
        message?: string;
      };

      const checkResult: CheckResult = {
        prediction: data.prediction,
        baseStation: data.baseStation ?? null,
        address,
        lat,
        lng,
      };
      setResult(checkResult);

      // Persist to localStorage history
      saveRecentCheck({
        id: `${Date.now()}`,
        address,
        lat,
        lng,
        signalQuality: data.prediction?.signalQuality ?? 'none',
        distanceKm: data.prediction?.distanceKm ?? 0,
        bnSiteName: data.prediction?.nearestBnSiteName ?? '',
        checkedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Coverage check failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scroll to results after load
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DetailPageHeader
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Coverage', href: '/admin/coverage' },
          { label: 'Coverage Checker' },
        ]}
        title="Tarana Coverage Checker"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Address input — only render when Maps JS is ready */}
        {mapsLoaded ? (
          <AddressInput onCheck={handleCheck} isLoading={isLoading} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            Loading maps…
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Checking coverage…</p>
            <p className="text-xs text-slate-400 mt-1">Running terrain analysis and link budget calculation</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {/* Results */}
        {result && !isLoading && (
          <div ref={resultRef}>
            <CoverageResultPanel
              prediction={result.prediction}
              baseStation={result.baseStation}
              address={result.address}
              lat={result.lat}
              lng={result.lng}
            />
          </div>
        )}

        {/* Recent checks history */}
        <RecentChecksPanel onRecheck={handleCheck} />
      </div>
    </div>
  );
}
