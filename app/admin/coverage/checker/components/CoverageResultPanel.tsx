'use client';

import type { CoveragePrediction } from '@/lib/coverage/prediction/types';
import { StatCard } from '@/components/admin/shared';
import CoverageVerdictCard from './CoverageVerdictCard';
import SalesRecommendationCard from './SalesRecommendationCard';
import CoverageMap from './CoverageMap';
import TechnicalDetailsPanel from './TechnicalDetailsPanel';
import {
  PiRulerBold, PiLightningBold, PiGaugeBold, PiCheckCircleBold,
} from 'react-icons/pi';

interface CoverageResultPanelProps {
  prediction: CoveragePrediction | null;
  baseStation: { lat: number; lng: number } | null;
  address: string;
  lat: number;
  lng: number;
}

const QUALITY_LABEL: Record<string, string> = {
  excellent: 'Excellent', good: 'Good', fair: 'Marginal', poor: 'Weak', none: 'None',
};

export default function CoverageResultPanel({
  prediction, baseStation, address, lat, lng,
}: CoverageResultPanelProps) {
  return (
    <div className="space-y-4">
      {/* Verdict */}
      <CoverageVerdictCard prediction={prediction} />

      {/* Sales recommendation */}
      <SalesRecommendationCard prediction={prediction} />

      {/* Key metrics */}
      {prediction && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      )}

      {/* Map */}
      <CoverageMap
        targetLat={lat}
        targetLng={lng}
        targetAddress={address}
        bnLat={baseStation?.lat ?? null}
        bnLng={baseStation?.lng ?? null}
        bnSiteName={prediction?.nearestBnSiteName ?? 'Unknown'}
      />

      {/* Technical details (collapsible) */}
      {prediction && (
        <TechnicalDetailsPanel
          prediction={prediction}
          bnLat={baseStation?.lat ?? null}
          bnLng={baseStation?.lng ?? null}
        />
      )}
    </div>
  );
}
