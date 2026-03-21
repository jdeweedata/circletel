'use client';

import { PiTrendUpBold, PiTrendDownBold, PiMinusBold, PiWifiHighBold, PiHouseBold, PiLightningBold, PiCurrencyCircleDollarBold } from 'react-icons/pi';
import React from 'react';

interface ProvinceMarketCardProps {
  province: string;
  homeInternetPct: number | null;
  fiveGCoveragePct: number | null;
  employmentChange: number | null;
  employmentTrend: 'growing' | 'shrinking' | 'stable' | null;
  avgHhExpenditure: number | null;
  electricityAccessPct: number | null;
  zoneCount?: number;
}

export function ProvinceMarketCard({
  province,
  homeInternetPct,
  fiveGCoveragePct,
  employmentChange,
  employmentTrend,
  avgHhExpenditure,
  electricityAccessPct,
  zoneCount,
}: ProvinceMarketCardProps) {
  const TrendIcon = employmentTrend === 'growing' ? PiTrendUpBold :
    employmentTrend === 'shrinking' ? PiTrendDownBold : PiMinusBold;
  const trendColor = employmentTrend === 'growing' ? 'text-green-600' :
    employmentTrend === 'shrinking' ? 'text-red-600' : 'text-gray-400';

  const internetOpportunity = homeInternetPct !== null && homeInternetPct < 15 ? 'text-green-600' :
    homeInternetPct !== null && homeInternetPct > 35 ? 'text-amber-600' : 'text-gray-700';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{province}</h3>
        {zoneCount !== undefined && (
          <span className="text-xs text-gray-400">{zoneCount} zone{zoneCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="space-y-2">
        {homeInternetPct !== null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <PiHouseBold className="h-3.5 w-3.5" />
              Home Internet
            </span>
            <span className={`text-xs font-semibold ${internetOpportunity}`}>
              {homeInternetPct.toFixed(1)}%
            </span>
          </div>
        )}

        {fiveGCoveragePct !== null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <PiWifiHighBold className="h-3.5 w-3.5" />
              5G Coverage
            </span>
            <span className="text-xs font-semibold text-gray-700">
              {fiveGCoveragePct.toFixed(0)}%
            </span>
          </div>
        )}

        {employmentChange !== null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
              Employment
            </span>
            <span className={`text-xs font-semibold ${trendColor}`}>
              {employmentChange > 0 ? '+' : ''}{employmentChange.toLocaleString()} jobs
            </span>
          </div>
        )}

        {avgHhExpenditure !== null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <PiCurrencyCircleDollarBold className="h-3.5 w-3.5" />
              HH Expenditure
            </span>
            <span className="text-xs font-semibold text-gray-700">
              R{Math.round(avgHhExpenditure).toLocaleString()}/yr
            </span>
          </div>
        )}

        {electricityAccessPct !== null && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <PiLightningBold className="h-3.5 w-3.5" />
              Electricity
            </span>
            <span className={`text-xs font-semibold ${electricityAccessPct < 85 ? 'text-amber-600' : 'text-gray-700'}`}>
              {electricityAccessPct.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
