'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TierCard } from '@/components/mits-cpq/shared';
import { useMITSTiers } from '@/lib/mits-cpq/hooks';
import { recommendTier } from '@/lib/mits-cpq/pricing-calculator';
import type { MITSTierSelectionData } from '@/lib/mits-cpq/types';

interface TierSelectionStepProps {
  data: MITSTierSelectionData | undefined;
  onUpdate: (data: MITSTierSelectionData) => void;
}

export function TierSelectionStep({ data, onUpdate }: TierSelectionStepProps) {
  const { tiers, loading, error } = useMITSTiers();

  const [userCount, setUserCount] = useState<number>(data?.user_count ?? 5);
  const [selectedTierCode, setSelectedTierCode] = useState<string | null>(
    data?.selected_tier_code ?? null
  );
  const [tierOverridden, setTierOverridden] = useState<boolean>(
    data?.tier_overridden ?? false
  );

  // Auto-recommend a tier when user count or tiers change (unless user manually overrode)
  useEffect(() => {
    if (tiers.length === 0) return;
    if (tierOverridden) return;

    const recommended = recommendTier(userCount, tiers);
    if (recommended) {
      setSelectedTierCode(recommended.tier_code);
    }
  }, [userCount, tiers, tierOverridden]);

  // Propagate state up on every change
  useEffect(() => {
    onUpdate({
      user_count: userCount,
      selected_tier_code: selectedTierCode,
      tier_overridden: tierOverridden,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCount, selectedTierCode, tierOverridden]);

  const handleTierSelect = (tierCode: string) => {
    const recommended = recommendTier(userCount, tiers);
    const isRecommended = recommended?.tier_code === tierCode;
    setSelectedTierCode(tierCode);
    setTierOverridden(!isRecommended);
  };

  const handleUserCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1));
    setUserCount(val);
    // Reset override when user count changes — let recommendation update
    setTierOverridden(false);
  };

  const recommendedTier = tiers.length > 0 ? recommendTier(userCount, tiers) : null;

  return (
    <div className="space-y-8">
      {/* User Count Input */}
      <div className="space-y-2">
        <Label htmlFor="user-count" className="text-base font-semibold text-slate-900">
          How many users does this solution need to support?
        </Label>
        <p className="text-sm text-slate-600">
          We will recommend the best tier for your team size.
        </p>
        <div className="flex items-center gap-4">
          <Input
            id="user-count"
            type="number"
            min={1}
            max={500}
            value={userCount}
            onChange={handleUserCountChange}
            className="w-32"
          />
          <span className="text-sm text-slate-600">users (1–500)</span>
        </div>
      </div>

      {/* Tier Grid */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          Loading tiers...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load tiers: {error}
        </div>
      )}

      {!loading && !error && tiers.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <TierCard
              key={tier.tier_code}
              tier={tier}
              selected={selectedTierCode === tier.tier_code}
              recommended={recommendedTier?.tier_code === tier.tier_code}
              onSelect={handleTierSelect}
            />
          ))}
        </div>
      )}

      {tierOverridden && recommendedTier && selectedTierCode !== recommendedTier.tier_code && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Note:</strong> You have selected a tier that differs from our recommendation for{' '}
          {userCount} users. The recommended tier is{' '}
          <strong>{recommendedTier.tier_name}</strong>.
        </div>
      )}
    </div>
  );
}
