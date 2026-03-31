'use client';

import type { CoveragePrediction, SignalQuality } from '@/lib/coverage/prediction/types';
import { SectionCard } from '@/components/admin/shared';
import { PiSparkleBold, PiCheckCircleBold, PiWarningBold } from 'react-icons/pi';

interface SalesRecommendationCardProps {
  prediction: CoveragePrediction | null;
}

interface SkyFibreTier {
  speed: string;
  dl: number;
  ul: number;
  price: number;
  recommended: boolean;
  available: boolean;
}

function getRecommendation(prediction: CoveragePrediction | null): {
  text: string;
  tiers: SkyFibreTier[];
  warning: string | null;
} {
  const BASE_TIERS: SkyFibreTier[] = [
    { speed: '50/12.5 Mbps',  dl: 50,  ul: 12.5, price: 1299, recommended: false, available: true },
    { speed: '100/25 Mbps',   dl: 100, ul: 25,   price: 1499, recommended: false, available: true },
    { speed: '200/50 Mbps',   dl: 200, ul: 50,   price: 1899, recommended: false, available: true },
  ];

  if (!prediction || prediction.signalQuality === 'none') {
    return {
      text: 'This address is not currently serviceable via Tarana FWB. No base stations are within viable range.',
      tiers: BASE_TIERS.map(t => ({ ...t, available: false, recommended: false })),
      warning: 'Consider recommending alternative technologies (fibre, LTE/5G) or registering interest for future coverage expansion.',
    };
  }

  const bn = prediction.nearestBnSiteName;
  const dist = prediction.distanceKm.toFixed(1);

  switch (prediction.signalQuality as SignalQuality) {
    case 'excellent':
    case 'good':
      return {
        text: `This address has ${prediction.signalQuality} Tarana FWB coverage from ${bn} (${dist} km away). All SkyFibre tiers are available — we recommend the 200/50 Mbps plan for maximum performance.`,
        tiers: [
          { ...BASE_TIERS[0], recommended: false },
          { ...BASE_TIERS[1], recommended: false },
          { ...BASE_TIERS[2], recommended: true },
        ],
        warning: null,
      };
    case 'fair':
      return {
        text: `This address has marginal Tarana coverage from ${bn} (${dist} km away). We recommend SkyFibre 100/25 Mbps for reliable performance.`,
        tiers: [
          { ...BASE_TIERS[0], recommended: false },
          { ...BASE_TIERS[1], recommended: true },
          { ...BASE_TIERS[2], available: false },
        ],
        warning: 'Higher speed tiers may experience reduced performance. A site survey is recommended before committing to 200/50.',
      };
    case 'poor':
      return {
        text: `This address has weak Tarana coverage from ${bn} (${dist} km away). Only the entry-level 50/12.5 Mbps plan is recommended.`,
        tiers: [
          { ...BASE_TIERS[0], recommended: true },
          { ...BASE_TIERS[1], available: false },
          { ...BASE_TIERS[2], available: false },
        ],
        warning: 'A site survey and elevated antenna installation (10m+ mast) will likely be required before installation.',
      };
    default:
      return {
        text: 'Unable to determine coverage recommendation.',
        tiers: BASE_TIERS.map(t => ({ ...t, available: false })),
        warning: null,
      };
  }
}

export default function SalesRecommendationCard({ prediction }: SalesRecommendationCardProps) {
  const { text, tiers, warning } = getRecommendation(prediction);
  const noService = !prediction || prediction.signalQuality === 'none';

  return (
    <SectionCard
      title="Sales Recommendation"
      icon={PiSparkleBold}
    >
      <p className="text-sm text-slate-700 mb-4">{text}</p>

      {!noService && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {tiers.map(tier => (
            <div
              key={tier.speed}
              className={`relative rounded-lg border-2 p-3 transition-all ${
                tier.recommended
                  ? 'border-orange-400 bg-orange-50 shadow-sm'
                  : tier.available
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50 opacity-50'
              }`}
            >
              {tier.recommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Recommended
                </span>
              )}
              {!tier.available && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-slate-400 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Not Available
                </span>
              )}
              <p className="text-xs font-semibold text-slate-700">{tier.speed}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                R{tier.price.toLocaleString()}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </p>
              {tier.available && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <PiCheckCircleBold className="text-emerald-500" />
                  SkyFibre Business
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <PiWarningBold className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">{warning}</p>
        </div>
      )}
    </SectionCard>
  );
}
