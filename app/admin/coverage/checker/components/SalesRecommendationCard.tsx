'use client';

import { useState } from 'react';
import type { CoveragePrediction, SignalQuality } from '@/lib/coverage/prediction/types';
import { SectionCard } from '@/components/admin/shared';
import { PiSparkleBold, PiCheckCircleBold, PiWarningBold, PiBuildingsBold, PiHouseBold } from 'react-icons/pi';

interface SalesRecommendationCardProps {
  prediction: CoveragePrediction | null;
}

// ── Product catalogue (source of truth: products/connectivity/) ──────────────
interface Tier {
  name: string;
  speed: string;
  dl: number;
  ul: number;
  price: string;          // display string
  priceNum: number;       // for sorting / logic
  recommended: boolean;
  available: boolean;
}

const RESIDENTIAL_TIERS: Tier[] = [
  { name: 'SkyFibre Home Plus', speed: '50/12.5 Mbps',  dl: 50,  ul: 12.5, price: 'R899/mo',  priceNum: 899,  recommended: false, available: true },
  { name: 'SkyFibre Home Max',  speed: '100/25 Mbps',   dl: 100, ul: 25,   price: 'R999/mo',  priceNum: 999,  recommended: false, available: true },
];

const SMB_TIERS: Tier[] = [
  { name: 'SkyFibre Business 50',  speed: '50/12.5 Mbps', dl: 50,  ul: 12.5, price: 'R1,299/mo excl. VAT', priceNum: 1299, recommended: false, available: true },
  { name: 'SkyFibre Business 100', speed: '100/25 Mbps',  dl: 100, ul: 25,   price: 'R1,499/mo excl. VAT', priceNum: 1499, recommended: false, available: true },
  { name: 'SkyFibre Business 200', speed: '200/50 Mbps',  dl: 200, ul: 50,   price: 'R1,899/mo excl. VAT', priceNum: 1899, recommended: false, available: true },
];

type CustomerType = 'smb' | 'residential';

function getRecommendation(
  prediction: CoveragePrediction | null,
  customerType: CustomerType,
): { text: string; tiers: Tier[]; warning: string | null } {
  const baseTiers = customerType === 'residential' ? RESIDENTIAL_TIERS : SMB_TIERS;
  const allUnavailable = baseTiers.map(t => ({ ...t, available: false, recommended: false }));

  if (!prediction || prediction.signalQuality === 'none') {
    return {
      text: 'This address is not currently serviceable via Tarana FWB. No base stations are within viable range.',
      tiers: allUnavailable,
      warning: 'Consider recommending alternative technologies (fibre, LTE/5G) or registering interest for future coverage expansion.',
    };
  }

  const bn = prediction.nearestBnSiteName;
  const dist = prediction.distanceKm.toFixed(1);

  switch (prediction.signalQuality as SignalQuality) {
    case 'excellent':
    case 'good': {
      // Recommend top tier
      const tiers = baseTiers.map((t, i) => ({
        ...t,
        recommended: i === baseTiers.length - 1,
      }));
      const topTier = tiers[tiers.length - 1];
      return {
        text: `${prediction.signalQuality === 'excellent' ? 'Excellent' : 'Good'} Tarana FWB coverage from ${bn} (${dist} km). All tiers available — recommend ${topTier.name} for maximum performance.`,
        tiers,
        warning: null,
      };
    }
    case 'fair': {
      // Recommend middle tier; top tier unavailable
      const midIndex = Math.floor(baseTiers.length / 2);
      const tiers = baseTiers.map((t, i) => ({
        ...t,
        recommended: i === midIndex,
        available: i <= midIndex,
      }));
      return {
        text: `Marginal Tarana coverage from ${bn} (${dist} km). Recommend ${tiers[midIndex].name} for reliable performance.`,
        tiers,
        warning: 'Higher speed tiers may experience reduced performance at this signal level. Site survey recommended.',
      };
    }
    case 'poor': {
      // Entry-level only
      const tiers = baseTiers.map((t, i) => ({
        ...t,
        recommended: i === 0,
        available: i === 0,
      }));
      return {
        text: `Weak Tarana coverage from ${bn} (${dist} km). Only the entry-level ${tiers[0].name} is recommended.`,
        tiers,
        warning: 'An elevated antenna installation (10 m+ mast) and site survey will likely be required before activation.',
      };
    }
    default:
      return {
        text: 'Unable to determine coverage recommendation.',
        tiers: allUnavailable,
        warning: null,
      };
  }
}

export default function SalesRecommendationCard({ prediction }: SalesRecommendationCardProps) {
  const [customerType, setCustomerType] = useState<CustomerType>('smb');
  const { text, tiers, warning } = getRecommendation(prediction, customerType);
  const noService = !prediction || prediction.signalQuality === 'none';

  return (
    <SectionCard title="Sales Recommendation" icon={PiSparkleBold}>

      {/* Customer type toggle */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setCustomerType('smb')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            customerType === 'smb'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PiBuildingsBold />
          Business
        </button>
        <button
          type="button"
          onClick={() => setCustomerType('residential')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            customerType === 'residential'
              ? 'bg-white shadow-sm text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PiHouseBold />
          Residential
        </button>
      </div>

      <p className="text-sm text-slate-700 mb-4">{text}</p>

      {!noService && (
        <div className={`grid gap-3 mb-4 ${tiers.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {tiers.map(tier => (
            <div
              key={tier.name}
              className={`relative rounded-lg border-2 p-3 transition-all ${
                tier.recommended
                  ? 'border-orange-400 bg-orange-50 shadow-sm'
                  : tier.available
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50 opacity-40'
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
              <p className="text-xs font-semibold text-slate-500 mb-0.5">{tier.speed}</p>
              <p className="text-sm font-bold text-slate-900 leading-tight">{tier.name}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{tier.price}</p>
              {tier.available && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <PiCheckCircleBold className="text-emerald-500" />
                  {customerType === 'residential' ? 'Residential' : 'Business'} · Uncapped
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
