'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { CoveragePrediction, LiveNetworkStatus } from '@/lib/coverage/prediction/types';
import type { SkyFibreOrderabilityResult } from '@/lib/coverage/skyfibre/types';
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
import MTNVerdictCard, { type MTNService } from './components/MTNVerdictCard';
import MTNProductTiers, { type MTNPackage } from './components/MTNProductTiers';
import MTNWholesaleFeasibilityCard from './components/MTNWholesaleFeasibilityCard';
import SkyFibreOrderabilityCard from './components/SkyFibreOrderabilityCard';
import RecentChecksPanel, { saveRecentCheck } from './components/RecentChecksPanel';
import {
  PiRulerBold, PiLightningBold, PiGaugeBold, PiCheckCircleBold,
  PiArrowLeftBold, PiBroadcastBold, PiClockBold, PiWarningCircleBold, PiXCircleBold,
} from 'react-icons/pi';
import Link from 'next/link';

const MAPS_LIBRARIES: ('places')[] = ['places'];

const TABS = [
  { id: 'check', label: 'Coverage Check' },
  { id: 'technical', label: 'Technical Details' },
  { id: 'history', label: 'Recent Checks' },
] as const;

type TabId = typeof TABS[number]['id'];
type ProviderType = 'tarana' | 'dfa' | 'mtn';

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excellent signal', good: 'Good signal', fair: 'Marginal signal', poor: 'Weak signal', none: 'No signal',
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

interface MTNResult {
  services: MTNService[];
  available: boolean;
  confidence?: 'high' | 'medium' | 'low';
  packages: MTNPackage[];
  address: string;
  lat: number;
  lng: number;
}

const MTN_SIGNAL_RANK: Record<string, number> = {
  excellent: 4, good: 3, fair: 2, poor: 1, none: 0,
};
const MTN_TECH_LABEL: Record<string, string> = {
  '5g': '5G', lte: 'LTE', fixed_lte: 'Fixed LTE',
};

// Best available service across the MTN results (for the KPI stat row).
function bestMtnService(services: MTNService[]): MTNService | null {
  const avail = services.filter((s) => s.available);
  if (avail.length === 0) return null;
  return avail.reduce((best, s) =>
    (MTN_SIGNAL_RANK[s.signal] ?? 0) > (MTN_SIGNAL_RANK[best.signal] ?? 0) ? s : best
  );
}

function normalizeName(value: string | null | undefined): string {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function hasBaseStationMismatch(
  prediction: CoveragePrediction | null,
  orderability: SkyFibreOrderabilityResult | null
): boolean {
  const rfBn = normalizeName(prediction?.nearestBnSiteName);
  const gateBn = normalizeName(orderability?.tcsCoverage.nearestStation?.siteName);
  return Boolean(rfBn && gateBn && rfBn !== gateBn);
}

function getSalesDecisionBanner(params: {
  orderability: SkyFibreOrderabilityResult | null;
  checking: boolean;
  error: string | null;
  bnMismatch: boolean;
}) {
  const { orderability, checking, error, bnMismatch } = params;

  if (checking) {
    return {
      title: 'Checking SkyFibre availability',
      text: 'Running the combined TCS and MTN CSP gate. Wait for this result before advising the customer.',
      badge: 'Checking',
      variant: 'info' as const,
      icon: PiClockBold,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
    };
  }

  if (error) {
    return {
      title: 'Unable to confirm SkyFibre availability',
      text: 'Do not quote SkyFibre yet. Retry the CSP orderability check or capture the lead for manual review.',
      badge: 'Unable to confirm',
      variant: 'warning' as const,
      icon: PiWarningCircleBold,
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }

  if (!orderability) return null;

  if (bnMismatch) {
    return {
      title: 'Manual review required',
      text: 'The RF model and TCS gate matched different base stations. Capture the lead and ask operations to confirm serviceability before quoting.',
      badge: 'Manual review',
      variant: 'warning' as const,
      icon: PiWarningCircleBold,
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    };
  }

  switch (orderability.decision) {
    case 'orderable': {
      const needsInstallReview =
        orderability.tcsCoverage.nearestBnActiveRnCount === 0 ||
        orderability.tcsCoverage.confidence === 'low';

      if (needsInstallReview) {
        return {
          title: 'CSP orderable - site survey recommended',
          text: 'MTN CSP accepts this SkyFibre order. TCS has low confidence or no active RN evidence, so confirm install details before committing the installation date.',
          badge: 'CSP orderable',
          variant: 'warning' as const,
          icon: PiWarningCircleBold,
          className: 'border-amber-200 bg-amber-50 text-amber-900',
        };
      }

      return {
        title: 'Available to sell',
        text: 'TCS coverage evidence is acceptable and MTN CSP will accept the selected SkyFibre order.',
        badge: 'Orderable',
        variant: 'success' as const,
        icon: PiCheckCircleBold,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
      };
    }
    case 'covered_not_orderable':
      return {
        title: 'Covered, but not orderable',
        text: 'The RF model is promising, but MTN CSP will not accept an order at this address. Capture the lead for sales follow-up.',
        badge: 'Do not order',
        variant: 'warning' as const,
        icon: PiWarningCircleBold,
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    case 'manual_review':
      return {
        title: 'Manual review required',
        text: 'SkyFibre may be possible, but the coverage evidence is not strong enough for a quick sale. Request site survey or operations review.',
        badge: 'Manual review',
        variant: 'warning' as const,
        icon: PiWarningCircleBold,
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    case 'not_covered':
      return {
        title: 'Not currently covered for SkyFibre',
        text: 'Do not quote SkyFibre at this address. Recommend another access technology or capture demand for future expansion.',
        badge: 'Not covered',
        variant: 'error' as const,
        icon: PiXCircleBold,
        className: 'border-red-200 bg-red-50 text-red-900',
      };
    case 'error':
      return {
        title: 'Unable to confirm SkyFibre availability',
        text: 'The orderability gate returned an error. Do not quote SkyFibre until the check succeeds.',
        badge: 'Error',
        variant: 'warning' as const,
        icon: PiWarningCircleBold,
        className: 'border-amber-200 bg-amber-50 text-amber-900',
      };
    default:
      return null;
  }
}

export default function CoverageCheckerPage() {
  const [provider, setProvider] = useState<ProviderType>('tarana');
  // Tarana state
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skyFibreOrderability, setSkyFibreOrderability] = useState<SkyFibreOrderabilityResult | null>(null);
  const [skyFibreOrderabilityChecking, setSkyFibreOrderabilityChecking] = useState(false);
  const [skyFibreOrderabilityError, setSkyFibreOrderabilityError] = useState<string | null>(null);
  // DFA state
  const [dfaResult, setDfaResult] = useState<DFAResult | null>(null);
  const [dfaLoading, setDfaLoading] = useState(false);
  const [dfaError, setDfaError] = useState<string | null>(null);
  // MTN LTE/5G state
  const [mtnResult, setMtnResult] = useState<MTNResult | null>(null);
  const [mtnLoading, setMtnLoading] = useState(false);
  const [mtnError, setMtnError] = useState<string | null>(null);
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
    setSkyFibreOrderability(null);
    setSkyFibreOrderabilityChecking(false);
    setSkyFibreOrderabilityError(null);
    setDfaResult(null);
    setMtnResult(null);
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
    setMtnResult(null);
    setSkyFibreOrderability(null);
    setSkyFibreOrderabilityChecking(false);
    setSkyFibreOrderabilityError(null);
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

  // ── MTN LTE/5G check ──
  const handleMtnCheck = useCallback(async (lat: number, lng: number, address: string) => {
    setMtnLoading(true);
    setMtnError(null);
    setMtnResult(null);
    setResult(null);
    setDfaResult(null);
    setActiveTab('check');

    try {
      const res = await fetch('/api/coverage/mtn/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinates: { lat, lng },
          serviceTypes: ['5g', 'lte', 'fixed_lte'],
          includeSignalStrength: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'MTN coverage check failed');

      // Fetch sellable packages in parallel (5G is the only active catalogue today)
      const packages = await fetch('/api/coverage/mtn/packages')
        .then((r) => r.json())
        .then((p) => (p.success && Array.isArray(p.products) ? (p.products as MTNPackage[]) : []))
        .catch(() => [] as MTNPackage[]);

      setMtnResult({
        services: Array.isArray(data.data?.services) ? data.data.services : [],
        available: Boolean(data.data?.available),
        confidence: data.data?.confidence,
        packages,
        address,
        lat,
        lng,
      });
    } catch (err) {
      setMtnError(err instanceof Error ? err.message : 'MTN coverage check failed');
    } finally {
      setMtnLoading(false);
    }
  }, []);

  // Scroll stats row into view after result loads
  useEffect(() => {
    if ((result || dfaResult || mtnResult) && statsRef.current) {
      statsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result, dfaResult, mtnResult]);

  const prediction = result?.prediction ?? null;
  const mtnBest = mtnResult ? bestMtnService(mtnResult.services) : null;
  const mtnTopSpeed = mtnResult
    ? mtnResult.services
        .filter((s) => s.available && s.estimatedSpeed)
        .reduce((max, s) => Math.max(max, s.estimatedSpeed!.download), 0)
    : 0;
  const loading = provider === 'tarana' ? isLoading : provider === 'dfa' ? dfaLoading : mtnLoading;
  const currentError = provider === 'tarana' ? error : provider === 'dfa' ? dfaError : mtnError;
  const hasResult = provider === 'tarana' ? result !== null : provider === 'dfa' ? dfaResult !== null : mtnResult !== null;
  const bnMismatch = provider === 'tarana' && hasBaseStationMismatch(prediction, skyFibreOrderability);
  const salesDecisionBanner = provider === 'tarana' && result
    ? getSalesDecisionBanner({
        orderability: skyFibreOrderability,
        checking: skyFibreOrderabilityChecking,
        error: skyFibreOrderabilityError,
        bnMismatch,
      })
    : null;
  const effectiveSkyFibreOrderability = bnMismatch && skyFibreOrderability
    ? { ...skyFibreOrderability, decision: 'manual_review' as const }
    : skyFibreOrderability;

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
                  {mtnResult && (
                    <StatusBadge
                      status={mtnResult.available ? 'Coverage Available' : 'No Coverage'}
                      variant={mtnResult.available ? 'success' : 'error'}
                    />
                  )}
                </div>
                {(result?.address || dfaResult?.address || mtnResult?.address) && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate max-w-md">
                    {result?.address || dfaResult?.address || mtnResult?.address}
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

      {/* ── Stat Cards (MTN LTE/5G — shown after first result) ── */}
      {provider === 'mtn' && mtnResult && (
        <div ref={statsRef} className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<PiBroadcastBold />}
                label="Best Technology"
                value={mtnBest ? (MTN_TECH_LABEL[mtnBest.type] ?? mtnBest.type) : 'None'}
                subtitle={mtnBest ? 'Available at location' : 'No MTN coverage'}
                iconBgColor="bg-yellow-50"
                iconColor="text-yellow-500"
              />
              <StatCard
                icon={<PiLightningBold />}
                label="Best Signal"
                value={mtnBest ? (QUALITY_LABEL[mtnBest.signal] ?? '—') : 'None'}
                subtitle={mtnBest ? (MTN_TECH_LABEL[mtnBest.type] ?? mtnBest.type) : '—'}
                iconBgColor="bg-orange-50"
                iconColor="text-orange-500"
              />
              <StatCard
                icon={<PiGaugeBold />}
                label="Top Est. Speed"
                value={mtnTopSpeed > 0 ? `${mtnTopSpeed} Mbps` : '—'}
                subtitle="Downlink (est.)"
                iconBgColor="bg-violet-50"
                iconColor="text-violet-500"
              />
              <StatCard
                icon={<PiCheckCircleBold />}
                label="Map Confidence"
                value={mtnResult.confidence ? mtnResult.confidence.charAt(0).toUpperCase() + mtnResult.confidence.slice(1) : '—'}
                subtitle="MTN coverage maps"
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
          <ProviderSelector provider={provider} onChange={(p) => {
            setProvider(p);
            setResult(null);
            setDfaResult(null);
            setMtnResult(null);
            setError(null);
            setDfaError(null);
            setMtnError(null);
            setSkyFibreOrderability(null);
            setSkyFibreOrderabilityChecking(false);
            setSkyFibreOrderabilityError(null);
          }} />

          {/* Address input */}
          {mapsLoaded ? (
            <AddressInput
              onCheck={provider === 'tarana' ? handleCheck : provider === 'dfa' ? handleDFACheck : handleMtnCheck}
              isLoading={loading}
              subtitle={
                provider === 'tarana'
                  ? 'Check Tarana FWB coverage availability'
                  : provider === 'dfa'
                    ? 'Check DFA fibre coverage availability'
                    : 'Check MTN LTE / 5G coverage availability'
              }
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
                {provider === 'tarana'
                  ? 'Checking coverage…'
                  : provider === 'dfa'
                    ? 'Checking DFA fibre coverage…'
                    : 'Checking MTN LTE / 5G coverage…'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {provider === 'tarana'
                  ? 'Running terrain analysis and link budget calculation'
                  : provider === 'dfa'
                    ? 'Querying DFA ArcGIS connected and near-net buildings'
                    : 'Querying MTN coverage maps (business + consumer)'}
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
              {salesDecisionBanner && (
                <section className={`rounded-xl border p-5 shadow-sm ${salesDecisionBanner.className}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <salesDecisionBanner.icon className="mt-0.5 h-6 w-6 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Final Sales Decision</p>
                        <h2 className="mt-1 text-xl font-bold">{salesDecisionBanner.title}</h2>
                        <p className="mt-1 text-sm">{salesDecisionBanner.text}</p>
                      </div>
                    </div>
                    <StatusBadge status={salesDecisionBanner.badge} variant={salesDecisionBanner.variant} />
                  </div>
                </section>
              )}
              <CoverageVerdictCard prediction={result.prediction} liveStatus={result.liveStatus} />
              <SkyFibreOrderabilityCard
                lat={result.lat}
                lng={result.lng}
                address={result.address}
                autoCheck
                onCheckingChange={setSkyFibreOrderabilityChecking}
                onResult={setSkyFibreOrderability}
                onError={setSkyFibreOrderabilityError}
              />
              {result.prediction && (
                <TierEligibilityTable prediction={result.prediction} />
              )}
              {result.liveStatus && (
                <NetworkStatusCard liveStatus={result.liveStatus} />
              )}
              <SalesRecommendationCard
                prediction={result.prediction}
                liveStatus={result.liveStatus}
                orderabilityResult={effectiveSkyFibreOrderability}
                orderabilityChecking={skyFibreOrderabilityChecking}
                orderabilityError={skyFibreOrderabilityError}
              />
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

          {/* ── MTN LTE/5G Results ── */}
          {provider === 'mtn' && mtnResult && !mtnLoading && (
            <div className="space-y-4">
              <MTNVerdictCard services={mtnResult.services} confidence={mtnResult.confidence} />
              <MTNWholesaleFeasibilityCard
                lat={mtnResult.lat}
                lng={mtnResult.lng}
                address={mtnResult.address}
                autoCheck
              />
              <MTNProductTiers
                products={mtnResult.packages}
                fiveGAvailable={mtnResult.services.some((s) => s.type === '5g' && s.available)}
              />
              <CoverageMap
                targetLat={mtnResult.lat}
                targetLng={mtnResult.lng}
                targetAddress={mtnResult.address}
                mode="mtn"
                mtnAvailable={mtnResult.available}
              />
            </div>
          )}

          {/* Empty state */}
          {!hasResult && !loading && !currentError && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-sm text-slate-400">
                {provider === 'tarana'
                  ? 'Enter an address above to check Tarana FWB coverage'
                  : provider === 'dfa'
                    ? 'Enter an address above to check DFA fibre coverage'
                    : 'Enter an address above to check MTN LTE / 5G coverage'}
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
