'use client';

import { useState } from 'react';
import type { CoveragePrediction } from '@/lib/coverage/prediction/types';
import { SectionCard, InfoRow } from '@/components/admin/shared';
import { PiGearBold, PiCaretDownBold } from 'react-icons/pi';

interface TechnicalDetailsPanelProps {
  prediction: CoveragePrediction;
  bnLat: number | null;
  bnLng: number | null;
}

function bearingDeg(fromLat: number, fromLng: number, toLat: number, toLng: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(toLng - fromLng)) * Math.cos(toRad(toLat));
  const x =
    Math.cos(toRad(fromLat)) * Math.sin(toRad(toLat)) -
    Math.sin(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.cos(toRad(toLng - fromLng));
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const cardinal = dirs[Math.round(bearing / 45)];
  return `${bearing.toFixed(1)}° ${cardinal}`;
}

export default function TechnicalDetailsPanel({ prediction, bnLat, bnLng }: TechnicalDetailsPanelProps) {
  const [open, setOpen] = useState(false);

  const bearing = bnLat !== null && bnLng !== null
    ? bearingDeg(bnLat, bnLng, prediction.targetLat, prediction.targetLng)
    : '—';

  const fresnel = prediction.fresnelAnalysis;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <PiGearBold className="text-slate-500" />
          Technical Details
        </span>
        <PiCaretDownBold className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2">
          <SectionCard title="Link Analysis" compact>
            <div className="divide-y divide-slate-100">
              <InfoRow label="Base Node" value={`${prediction.nearestBnSiteName} (${prediction.nearestBnSerial})`} />
              <InfoRow label="Distance to BN" value={`${prediction.distanceKm.toFixed(2)} km`} />
              <InfoRow label="Bearing from BN" value={bearing} />
              <InfoRow label="Terrain Obstruction Loss" value={`${prediction.terrainObstructionLossDb.toFixed(1)} dB`} />
              {fresnel && (
                <>
                  <InfoRow label="Fresnel Clearance" value={`${(fresnel.clearanceRatioMin * 100).toFixed(0)}%`} />
                  <InfoRow label="Line of Sight" value={fresnel.isLineOfSight ? '✅ Clear' : '⚠️ Obstructed'} />
                </>
              )}
              <InfoRow label="Predicted Rx Power" value={`${prediction.predictedRxPowerDbm.toFixed(1)} dBm`} />
              <InfoRow
                label="Calibration"
                value={
                  prediction.calibrationApplied
                    ? `Applied (${prediction.calibrationCorrectionDb > 0 ? '+' : ''}${prediction.calibrationCorrectionDb.toFixed(1)} dB correction)`
                    : 'Not applied (insufficient data)'
                }
              />
              <InfoRow
                label="Estimated DL Throughput"
                value={`${prediction.estimatedThroughputDl}–${prediction.estimatedThroughputDlMax} Mbps`}
              />
              <InfoRow label="Elevated Install Required" value={prediction.requiresElevatedInstall ? 'Yes' : 'No'} />
              <InfoRow label="Model Confidence" value={prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} />
              <InfoRow label="Computed At" value={new Date(prediction.computedAt).toLocaleString('en-ZA')} />
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
