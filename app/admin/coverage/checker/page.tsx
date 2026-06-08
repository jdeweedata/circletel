'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { CoveragePrediction, LiveNetworkStatus } from '@/lib/coverage/prediction/types';
import {
  StatCard, StatusBadge, UnderlineTabs, TabPanel,
} from '@/components/admin/shared';
import AddressInput from './components/AddressInput';
import CoverageVerdictCard from './components/CoverageVerdictCard';
import SalesRecommendationCard from './components/SalesRecommendationCard';
import CoverageMap from './components/CoverageMap';
import TechnicalDetailsPanel from './components/TechnicalDetailsPanel';
import TierEligibilityTable from './components/TierEligibilityTable';
import NetworkStatusCard from './components/NetworkStatusCard';
import ProviderSelector from './components/ProviderSelector';
import DFAVerdictCard from './components/DFAVerdictCard';
import DFAProductTiers from './components/DFAProductTiers';
import DFAInstallationEstimate from './components/DFAInstallationEstimate';
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
type ProviderType = 'tarana' | 'dfa';

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Good', fair: 'Marginal', poor: 'Weak', none: 'None',
};

const QUALITY_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  excellent: 'success', good: 'success', fair: 'warning', poor: 'error', none: 'neutral',
};

interface NetworkInfo {
  regionName: string;
  marketId: number | null;
  siteName: string;
  cellName: string | null;
  sectorName: string | null;
}

interface CheckResult {
  prediction: CoveragePrediction | null;
  baseStation: { lat: number; lng: number } | null;
  networkInfo: NetworkInfo | null;
  liveStatus: LiveNetworkStatus | null;
  address: string;
  lat: number;
  lng: number;
}

interface DFAResult {
  coverageType: 'connected' | 'near-net' | 'none';
  message: string;
  connected?: { buildingId: string; status: string; ftth: string | null; broadband: string | null; precinct: string | null; };
  nearNet?: { distanceMeters: number; display: string; timeline: string; note: string; };
  products: Array<{ id: string; name: string; download_speed: number; upload_speed: number; price: number; coverage_details: any; description?: string; }>;
  recommendedProduct: any | null;
  installationEstimate: { estimatedCost: string; estimatedDays: string; notes: string; };
  coordinates: { lat: number; lng: number };
  address: string;
}

export default function CoverageCheckerPage() {
  const [provider, setProvider] = useState<ProviderType>('tarana');
  // Tarana state
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // DFA state
  const [dfaResult, setDfaResult] = useState<DFAResult | null>(null);
  const [dfaLoading, setDfaLoading] = useState(false);
  const [dfaError, setDfaError] = useState<string | null>(null);
  // Shared
  const [activeTab, setActiveTab] = useState<TabId>('check');
  const statsRef = useRef<HTMLDivElement>(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: MAPS_LIBRARIES,
  });

  // ── Tarana check ──
  const handleCheck = useCallback(async (lat: number, lng: number, address: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setDfaResult(null);
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
        networkInfo: NetworkInfo | null;
        liveStatus: LiveNetworkStatus | null;
        message?: string;
      };

      const checkResult: CheckResult = {
        prediction: data.prediction,
        baseStation: data.baseStation ?? null,
        networkInfo: data.networkInfo ?? null,
        liveStatus: data.liveStatus ?? null,
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

  // ── DFA check ──
  const handleDFACheck = useCallback(async (lat: number, lng: number, address: string) => {
    setDfaLoading(true);
    setDfaError(null);
    setDfaResult(null);
    setResult(null);
    setActiveTab('check');

    try {
      const res = await fetch('/api/admin/coverage/dfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: { lat, lng }, address }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'DFA check failed');

      setDfaResult({ ...data.data, address });
    } catch (err) {
      setDfaError(err instanceof Error ? err.message : 'DFA coverage check failed');
    } finally {
      setDfaLoading(false);
    }
  }, []);

  // Scroll stats row into view after result loads
  useEffect(() => {
    if ((result || dfaResult) && statsRef.current) {
      statsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result, dfaResult]);

  const prediction = result?.prediction ?? null;
  const loading = provider === 'tarana' ? isLoading : dfaLoading;
  const currentError = provider === 'tarana' ? error : dfaError;
  const hasResult = provider === 'tarana' ? result !== null : dfaResult !== null;

  function getMcsLevel(rssi: number): number {
    if (rssi >= -65)   return 16;
    if (rssi >= -68)   return 15;
    if (rssi >= -70.4) return 12;
    if (rssi >= -73)   return 10;
    if (rssi >= -75.4) return 9;
    if (rssi >= -79.7) return 6;
    if (rssi >= -82)   return 4;
    if (rssi >= -85.8) return 2;
    return 0;
  }

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
                  <h1 className="text-xl font-bold text-slate-900">Coverage Checker</h1>
                  {prediction && (
                    <StatusBadge
                      status={QUALITY_LABEL[prediction.signalQuality] ?? '—'}
                      variant={QUALITY_VARIANT[prediction.signalQuality] ?? 'neutral'}
                    />
                  )}
                  {dfaResult && (
                    <StatusBadge
                      status={dfaResult.coverageType === 'connected' ? 'Connected' : dfaResult.coverageType === 'near-net' ? 'Near-Net' : 'No Coverage'}
                      variant={dfaResult.coverageType === 'connected' ? 'success' : dfaResult.coverageType === 'near-net' ? 'warning' : 'error'}
                    />
                  )}
                </div>
                {(result?.address || dfaResult?.address) && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">
                    {result?.address || dfaResult?.address}
                  </p>
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

      {/* ── Stat Cards (Tarana only — shown after first result) ── */}
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
                subtitle={`MCS ${getMcsLevel(prediction.predictedRxPowerDbm)} · ${QUALITY_LABEL[prediction.signalQuality] ?? '—'}`}
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

          {/* Provider Selector */}
          <ProviderSelector provider={provider} onChange={(p) => { setProvider(p); setResult(null); setDfaResult(null); setError(null); setDfaError(null); }} />

          {/* Address input */}
          {mapsLoaded ? (
            <AddressInput
              onCheck={provider === 'tarana' ? handleCheck : handleDFACheck}
              isLoading={loading}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              Loading maps…
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-8 h-8 border-[3px] border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">
                {provider === 'tarana' ? 'Checking coverage…' : 'Checking DFA fibre coverage…'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {provider === 'tarana'
                  ? 'Running terrain analysis and link budget calculation'
                  : 'Querying DFA ArcGIS connected and near-net buildings'}
              </p>
            </div>
          )}

          {/* Error state */}
          {currentError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <span className="font-semibold">Error: </span>{currentError}
            </div>
          )}

          {/* ── Tarana Results ── */}
          {provider === 'tarana' && result && !isLoading && (
            <div className="space-y-4">
              <CoverageVerdictCard prediction={result.prediction} liveStatus={result.liveStatus} />
              {result.prediction && (
                <TierEligibilityTable prediction={result.prediction} />
              )}
              {result.liveStatus && (
                <NetworkStatusCard liveStatus={result.liveStatus} />
              )}
              <SalesRecommendationCard prediction={result.prediction} liveStatus={result.liveStatus} />
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

          {/* ── DFA Results ── */}
          {provider === 'dfa' && dfaResult && !dfaLoading && (
            <div className="space-y-4">
              <DFAVerdictCard result={dfaResult} />
              {dfaResult.coverageType !== 'none' && dfaResult.products.length > 0 && (
                <DFAProductTiers products={dfaResult.products} recommended={dfaResult.recommendedProduct} />
              )}
              {dfaResult.coverageType !== 'none' && (
                <DFAInstallationEstimate estimate={dfaResult.installationEstimate} />
              )}
              <CoverageMap
                targetLat={dfaResult.coordinates.lat}
                targetLng={dfaResult.coordinates.lng}
                targetAddress={dfaResult.address}
                mode="dfa"
                dfaCoverageType={dfaResult.coverageType}
              />
            </div>
          )}

          {/* Empty state */}
          {!hasResult && !loading && !currentError && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">
                {provider === 'tarana'
                  ? 'Enter an address above to check Tarana FWB coverage'
                  : 'Enter an address above to check DFA fibre coverage'}
              </p>
            </div>
          )}
        </TabPanel>

        {/* Technical Details Tab */}
        <TabPanel id="technical" activeTab={activeTab} className="space-y-5">
          {provider === 'tarana' && result?.prediction ? (
            <TechnicalDetailsPanel
              prediction={result.prediction}
              bnLat={result.baseStation?.lat ?? null}
              bnLng={result.baseStation?.lng ?? null}
              networkInfo={result.networkInfo}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">
                {provider === 'dfa'
                  ? 'Technical details are available for Tarana FWB checks. Switch to Tarana and run a check.'
                  : 'Run a Tarana coverage check to see technical details'}
              </p>
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
