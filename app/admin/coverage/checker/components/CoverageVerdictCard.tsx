'use client';

import type { CoveragePrediction, SignalQuality } from '@/lib/coverage/prediction/types';
import { StatusBadge } from '@/components/admin/shared';

interface CoverageVerdictCardProps {
  prediction: CoveragePrediction | null;
}

const QUALITY_CONFIG: Record<SignalQuality, {
  label: string;
  verdict: string;
  variant: 'success' | 'warning' | 'error' | 'neutral';
  bars: number;
  bgClass: string;
  borderClass: string;
}> = {
  excellent: { label: 'Excellent Coverage', verdict: 'COVERED', variant: 'success', bars: 5, bgClass: 'bg-emerald-50', borderClass: 'border-emerald-400' },
  good:      { label: 'Good Coverage',      verdict: 'COVERED', variant: 'success', bars: 4, bgClass: 'bg-emerald-50', borderClass: 'border-emerald-400' },
  fair:      { label: 'Marginal Coverage',  verdict: 'MARGINAL', variant: 'warning', bars: 3, bgClass: 'bg-amber-50', borderClass: 'border-amber-400' },
  poor:      { label: 'Weak Coverage',      verdict: 'MARGINAL', variant: 'warning', bars: 2, bgClass: 'bg-orange-50', borderClass: 'border-orange-400' },
  none:      { label: 'No Coverage',        verdict: 'NOT COVERED', variant: 'error', bars: 0, bgClass: 'bg-red-50', borderClass: 'border-red-400' },
};

const CONFIDENCE_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'info'> = {
  high: 'success', medium: 'warning', low: 'neutral', none: 'neutral',
};

function SignalBars({ filled, total = 5 }: { filled: number; total?: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {Array.from({ length: total }).map((_, i) => {
        const height = 8 + i * 4;
        const active = i < filled;
        return (
          <div
            key={i}
            style={{ height, width: 6 }}
            className={`rounded-sm ${active ? 'bg-current' : 'bg-slate-200'}`}
          />
        );
      })}
    </div>
  );
}

export default function CoverageVerdictCard({ prediction }: CoverageVerdictCardProps) {
  if (!prediction) {
    const cfg = QUALITY_CONFIG.none;
    return (
      <div className={`rounded-xl border-l-4 ${cfg.borderClass} ${cfg.bgClass} p-5 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`text-red-400`}>
            <SignalBars filled={0} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-0.5">Coverage Status</p>
            <StatusBadge variant="error" status="No Coverage" />
          </div>
        </div>
        <p className="text-sm text-slate-500">No Tarana base stations within 8 km</p>
      </div>
    );
  }

  const cfg = QUALITY_CONFIG[prediction.signalQuality] ?? QUALITY_CONFIG.none;
  const colorClass = prediction.signalQuality === 'excellent' || prediction.signalQuality === 'good'
    ? 'text-emerald-500'
    : prediction.signalQuality === 'fair' || prediction.signalQuality === 'poor'
    ? 'text-amber-500'
    : 'text-red-400';

  return (
    <div className={`rounded-xl border-l-4 ${cfg.borderClass} ${cfg.bgClass} p-5`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className={colorClass}>
            <SignalBars filled={cfg.bars} />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">Coverage Status</p>
            <StatusBadge variant={cfg.variant} status={cfg.label} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Confidence:</span>
          <StatusBadge
            variant={CONFIDENCE_VARIANT[prediction.confidence] ?? 'neutral'}
            status={prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)}
          />
          {prediction.calibrationApplied && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Calibrated
            </span>
          )}
        </div>
      </div>
      {prediction.requiresElevatedInstall && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
          ⚠️ Elevated installation may be required (10m+ antenna mast) for optimal signal at this location.
        </p>
      )}
    </div>
  );
}
