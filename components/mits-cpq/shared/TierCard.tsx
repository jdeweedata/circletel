'use client';

import { Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MITSTier } from '@/lib/mits-cpq/types';

interface TierCardProps {
  tier: MITSTier;
  selected: boolean;
  recommended?: boolean;
  onSelect: (tierCode: string) => void;
}

export function TierCard({
  tier,
  selected,
  recommended = false,
  onSelect,
}: TierCardProps) {
  return (
    <button
      onClick={() => onSelect(tier.tier_code)}
      className={cn(
        'relative flex flex-col gap-4 rounded-lg border-2 p-6 text-left transition-all duration-200',
        selected
          ? 'border-orange bg-orange/5'
          : 'border-slate-200 bg-white hover:border-orange/50',
        recommended && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute -top-3 right-6 flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
          <Star className="h-3 w-3 fill-current" />
          Recommended
        </div>
      )}

      {/* Selected Checkmark */}
      {selected && (
        <div className="absolute -top-3 -right-3 rounded-full bg-orange p-1.5">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Tier Name */}
      <div>
        <h3 className="text-lg font-bold text-slate-900">{tier.tier_name}</h3>
        {tier.description && (
          <p className="text-sm text-slate-600">{tier.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-orange">
            R{tier.retail_price.toLocaleString('en-ZA', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
          <span className="text-sm font-medium text-slate-600">/month</span>
        </div>
      </div>

      {/* Key Details */}
      <div className="space-y-2 text-sm text-slate-700">
        <div className="flex justify-between">
          <span className="text-slate-600">Users:</span>
          <span className="font-medium">
            {tier.target_users_min}-{tier.target_users_max}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Speed:</span>
          <span className="font-medium">
            {tier.connectivity_speed_dl}Mbps↓ /{tier.connectivity_speed_ul}Mbps↑
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">M365 Licences:</span>
          <span className="font-medium">{tier.m365_included_licences}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Support:</span>
          <span className="font-medium">{tier.support_hours}</span>
        </div>
      </div>
    </button>
  );
}
