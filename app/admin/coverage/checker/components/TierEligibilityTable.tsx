'use client';

import type { CoveragePrediction } from '@/lib/coverage/prediction/types';
import { SectionCard } from '@/components/admin/shared';
import { PiTableBold, PiCheckCircleBold, PiXCircleBold, PiWarningBold } from 'react-icons/pi';

// Tarana G1 MCS/RSSI thresholds — 40 MHz single channel, standard 4.5:1 frame profile
// Source: Tarana Google Network Planner RSSI to Throughput Table R2
const TIER_THRESHOLDS = [
  {
    speedLabel: '50 / 12.5 Mbps',
    minRssiDbm: -85.8,
    mcs: 2,
    residential: { name: 'SkyFibre Home Plus', sku: 'SKY-HOME-50', price: 'R899/mo incl. VAT' },
    smb: { name: 'SkyFibre Business 50', price: 'R1,299/mo excl. VAT' },
  },
  {
    speedLabel: '100 / 25 Mbps',
    minRssiDbm: -79.7,
    mcs: 6,
    residential: { name: 'SkyFibre Home Max', sku: 'SKY-HOME-100', price: 'R999/mo incl. VAT' },
    smb: { name: 'SkyFibre Business 100', price: 'R1,499/mo excl. VAT' },
  },
  {
    speedLabel: '200 / 50 Mbps',
    minRssiDbm: -70.4,
    mcs: 12,
    residential: null, // No residential 200 Mbps product
    smb: { name: 'SkyFibre Business 200', price: 'R1,899/mo excl. VAT' },
  },
] as const;

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

interface TierEligibilityTableProps {
  prediction: CoveragePrediction;
}

export default function TierEligibilityTable({ prediction }: TierEligibilityTableProps) {
  const rssi = prediction.predictedRxPowerDbm;
  const mcs = getMcsLevel(rssi);

  return (
    <SectionCard title="Service Tier Eligibility" icon={PiTableBold}>
      <p className="text-xs text-slate-500 mb-3">
        Based on Tarana G1 published MCS thresholds · Measured RSSI{' '}
        <span className="font-semibold text-slate-700">{rssi.toFixed(1)} dBm</span>
        {' '}(MCS {mcs})
      </p>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Speed Tier</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Min RSSI</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Headroom</th>
              <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Residential</th>
              <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TIER_THRESHOLDS.map((tier) => {
              const headroom = rssi - tier.minRssiDbm;
              const eligible = headroom >= 0;
              const marginal = eligible && headroom < 5;

              return (
                <tr key={tier.speedLabel} className={eligible ? '' : 'opacity-50'}>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-slate-800">{tier.speedLabel}</span>
                    <span className="ml-2 text-xs text-slate-400">MCS {tier.mcs}+</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-600 tabular-nums">{tier.minRssiDbm} dBm</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      !eligible
                        ? 'bg-red-50 text-red-700'
                        : marginal
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {!eligible
                        ? <PiXCircleBold />
                        : marginal
                        ? <PiWarningBold />
                        : <PiCheckCircleBold />}
                      {eligible ? `+${headroom.toFixed(1)} dB` : `${headroom.toFixed(1)} dB`}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    {tier.residential ? (
                      <div>
                        <p className={`text-xs font-medium ${eligible ? 'text-slate-800' : 'text-slate-400'}`}>
                          {tier.residential.name}
                        </p>
                        <p className="text-xs text-slate-500">{tier.residential.price}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No residential tier</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div>
                      <p className={`text-xs font-medium ${eligible ? 'text-slate-800' : 'text-slate-400'}`}>
                        {tier.smb.name}
                      </p>
                      <p className="text-xs text-slate-500">{tier.smb.price}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stack */}
      <div className="sm:hidden space-y-2">
        {TIER_THRESHOLDS.map((tier) => {
          const headroom = rssi - tier.minRssiDbm;
          const eligible = headroom >= 0;
          const marginal = eligible && headroom < 5;

          return (
            <div
              key={tier.speedLabel}
              className={`rounded-lg border p-3 ${
                !eligible ? 'border-slate-100 bg-slate-50 opacity-50'
                  : marginal ? 'border-amber-200 bg-amber-50'
                  : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-800">{tier.speedLabel}</span>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  !eligible ? 'bg-red-100 text-red-700'
                    : marginal ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {eligible ? `+${headroom.toFixed(1)} dB` : `${headroom.toFixed(1)} dB`}
                </span>
              </div>
              <div className="space-y-0.5">
                {tier.residential && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Residential:</span> {tier.residential.name} · {tier.residential.price}
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  <span className="font-medium">Business:</span> {tier.smb.name} · {tier.smb.price}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
        Thresholds from Tarana G1 Network Planner spec. 200/50 uses conservative −70.4 dBm (MCS 12) threshold.
        All products operate on 4:1 DL:UL ratio set at MTN network level.
      </p>
    </SectionCard>
  );
}
