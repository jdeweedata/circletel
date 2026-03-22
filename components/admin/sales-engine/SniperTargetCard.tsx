'use client';

import type { SniperTarget } from '@/lib/sales-engine/briefing-service';

interface SniperTargetCardProps {
  target: SniperTarget;
  rank: number;
}

function RoutingBadge({ routing }: { routing: SniperTarget['routing'] }) {
  const config: Record<SniperTarget['routing'], { label: string; className: string }> = {
    tarana_primary: {
      label: 'TARANA',
      className: 'bg-blue-100 text-blue-800',
    },
    arlan_primary: {
      label: 'ARLAN ONLY',
      className: 'bg-orange-100 text-orange-800',
    },
    dual_funnel: {
      label: 'DUAL FUNNEL',
      className: 'bg-green-100 text-green-800',
    },
  };

  const { label, className } = config[routing];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function SniperTargetCard({ target, rank }: SniperTargetCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
            {rank}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{target.zone_name}</h3>
            <p className="text-xs text-slate-500">
              {target.suburb ? `${target.suburb}, ` : ''}
              {target.province}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900">{target.composite_score}</span>
          <span className="text-xs text-slate-500"> / 100</span>
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap gap-2">
        <RoutingBadge routing={target.routing} />
        {target.campaign_name && (
          <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
            {target.campaign_name}
          </span>
        )}
        {target.coverage_confidence === 'high' && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Strong Coverage
          </span>
        )}
      </div>

      {/* Rationale */}
      {target.rationale.length > 0 && (
        <ul className="mt-3 space-y-1">
          {target.rationale.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
              <span className="mt-0.5 text-slate-400">&bull;</span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {/* Lead With box */}
      <div className="mt-3 rounded-md bg-slate-50 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lead With</p>
        <p className="text-sm font-medium text-slate-900">{target.primary_product}</p>
        {target.routing !== 'tarana_primary' && target.arlan_deal_categories.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            Arlan: {target.arlan_deal_categories.join(', ')}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{target.business_poi_density}</p>
          <p className="text-[10px] text-slate-500">Businesses</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{target.demand_signal_count}</p>
          <p className="text-[10px] text-slate-500">Demand Signals</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900">{target.unworked_leads}</p>
          <p className="text-[10px] text-slate-500">Unworked Leads</p>
        </div>
      </div>
    </div>
  );
}
