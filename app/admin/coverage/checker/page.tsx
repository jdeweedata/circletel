'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { CoveragePrediction } from '@/lib/coverage/prediction/types';
import {
  StatCard, StatusBadge, UnderlineTabs, TabPanel,
} from '@/components/admin/shared';
import AddressInput from './components/AddressInput';
import CoverageVerdictCard from './components/CoverageVerdictCard';
import SalesRecommendationCard from './components/SalesRecommendationCard';
import CoverageMap from './components/CoverageMap';
import TechnicalDetailsPanel from './components/TechnicalDetailsPanel';
import RecentChecksPanel, { saveRecentCheck } from './components/RecentChecksPanel';
import {
  PiRulerBold, PiLightningBold, PiGaugeBold, PiCheckCircleBold,
  PiArrowLeftBold,
} from 'react-icons/pi';
import Link from 'next/link';

const MAPS_LIBRARIES: ('places')[] = ['places'];

const TABS = [
  { id: 'check', label: 'Coverage Check' },
  { id: 'technical', label: 'Technical Details' },
  { id: 'history', label: 'Recent Checks' },
] as const;

type TabId = typeof TABS[number]['id'];

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Good', fair: 'Marginal', poor: 'Weak', none: 'None',
};

const QUALITY_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  excellent: 'success', good: 'success', fair: 'warning', poor: 'error', none: 'neutral',
};

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
  const [activeTab, setActiveTab] = useState<TabId>('check');
  const statsRef = useRef<HTMLDivElement>(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: MAPS_LIBRARIES,
  });

  const handleCheck = useCallback(async (lat: number, lng: number, address: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveTab('check');

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

  // Scroll stats row into view after result loads
  useEffect(() => {
    if (result && statsRef.current) {
      statsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result]);

  const prediction = result?.prediction ?? null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
            <Link href="/admin" className="hover:text-slate-700 transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-slate-400">Coverage</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">Coverage Checker</span>
          </div>

          {/* Title row */}
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              >
                <PiArrowLeftBold className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">Tarana Coverage Checker</h1>
                  {prediction && (
                    <StatusBadge
                      status={QUALITY_LABEL[prediction.signalQuality] ?? '—'}
                      variant={QUALITY_VARIANT[prediction.signalQuality] ?? 'neutral'}
                    />
                  )}
                </div>
                {result?.address && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">{result.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <UnderlineTabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabId)}
          />
        </div>
      </div>

      {/* ── Stat Cards (shown after first result) ── */}
      {prediction && (
        <div ref={statsRef} className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<PiRulerBold />}
                label="Distance to BN"
                value={`${prediction.distanceKm.toFixed(2)} km`}
                subtitle={prediction.nearestBnSiteName}
                iconBgColor="bg-blue-50"
                iconColor="text-blue-500"
              />
              <StatCard
                icon={<PiLightningBold />}
                label="Signal Level"
                value={`${prediction.predictedRxPowerDbm.toFixed(0)} dBm`}
                subtitle={QUALITY_LABEL[prediction.signalQuality] ?? '—'}
                iconBgColor="bg-orange-50"
                iconColor="text-orange-500"
              />
              <StatCard
                icon={<PiGaugeBold />}
                label="Est. Throughput"
                value={`${prediction.estimatedThroughputDl}–${prediction.estimatedThroughputDlMax} Mbps`}
                subtitle="Downlink range"
                iconBgColor="bg-violet-50"
                iconColor="text-violet-500"
              />
              <StatCard
                icon={<PiCheckCircleBold />}
                label="Model Confidence"
                value={prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
                subtitle={prediction.calibrationApplied ? 'Empirically calibrated' : 'Theoretical model'}
                iconBgColor="bg-emerald-50"
                iconColor="text-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Coverage Check Tab */}
        <TabPanel id="check" activeTab={activeTab} className="space-y-5">

          {/* Address input */}
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
              <div className="w-8 h-8 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
            <div className="space-y-4">
              <CoverageVerdictCard prediction={result.prediction} />
              <SalesRecommendationCard prediction={result.prediction} />
              <CoverageMap
                targetLat={result.lat}
                targetLng={result.lng}
                targetAddress={result.address}
                bnLat={result.baseStation?.lat ?? null}
                bnLng={result.baseStation?.lng ?? null}
                bnSiteName={result.prediction?.nearestBnSiteName ?? 'Unknown'}
              />
            </div>
          )}

          {/* Empty state */}
          {!result && !isLoading && !error && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">Enter an address above to check Tarana FWB coverage</p>
            </div>
          )}
        </TabPanel>

        {/* Technical Details Tab */}
        <TabPanel id="technical" activeTab={activeTab} className="space-y-5">
          {result?.prediction ? (
            <TechnicalDetailsPanel
              prediction={result.prediction}
              bnLat={result.baseStation?.lat ?? null}
              bnLng={result.baseStation?.lng ?? null}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">Run a coverage check to see technical details</p>
            </div>
          )}
        </TabPanel>

        {/* Recent Checks Tab */}
        <TabPanel id="history" activeTab={activeTab}>
          <RecentChecksPanel onRecheck={handleCheck} />
        </TabPanel>

      </div>
    </div>
  );
}
