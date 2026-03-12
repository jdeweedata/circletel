'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PricingBreakdown } from '@/components/mits-cpq/shared';
import { useMITSTiers } from '@/lib/mits-cpq/hooks';
import type { MITSStepData, MITSPricingData } from '@/lib/mits-cpq/types';

interface PricingStepProps {
  stepData: MITSStepData;
  isAdmin: boolean;
  onUpdate: (data: MITSPricingData) => void;
}

const CONTRACT_TERM_OPTIONS = [
  { value: '1', label: 'Month-to-Month (no discount)' },
  { value: '12', label: '12 Months (5% discount)' },
  { value: '24', label: '24 Months (10% discount)' },
  { value: '36', label: '36 Months (15% discount)' },
];

const EMPTY_PRICING: MITSPricingData = {
  contract_term_months: 12,
  discount_percent: 0,
  base_tier_price: 0,
  additional_m365_price: 0,
  add_ons_mrc: 0,
  add_ons_nrc: 0,
  contract_discount_percent: 0,
  subtotal_mrc: 0,
  discount_amount: 0,
  total_mrc: 0,
  gross_margin_percent: 0,
};

export function PricingStep({ stepData, isAdmin, onUpdate }: PricingStepProps) {
  const { tiers } = useMITSTiers();

  const [contractTermMonths, setContractTermMonths] = useState<number>(
    stepData.pricing?.contract_term_months ?? 12
  );
  const [discountPercent, setDiscountPercent] = useState<number>(
    stepData.pricing?.discount_percent ?? 0
  );
  const [computedPricing, setComputedPricing] = useState<MITSPricingData>(
    stepData.pricing ?? EMPTY_PRICING
  );
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTierCode = stepData.tier_selection?.selected_tier_code;
  const selectedTier = tiers.find((t) => t.tier_code === selectedTierCode);

  // Call pricing API whenever relevant inputs change
  useEffect(() => {
    if (!selectedTierCode) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setPricingLoading(true);
      setPricingError(null);

      try {
        const body = {
          tier_code: selectedTierCode,
          additional_licences: stepData.m365_config?.additional_licences ?? 0,
          selected_modules: stepData.add_ons?.selected_modules ?? [],
          contract_term_months: contractTermMonths,
          manual_discount_percent: discountPercent,
        };

        const res = await fetch('/api/mits-cpq/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`Pricing API error: ${res.status} ${res.statusText}`);
        }

        const json = await res.json() as { pricing?: MITSPricingData; error?: string };
        if (json.error) throw new Error(json.error);

        if (json.pricing) {
          const updated: MITSPricingData = {
            ...json.pricing,
            contract_term_months: contractTermMonths,
            discount_percent: discountPercent,
          };
          setComputedPricing(updated);
          onUpdate(updated);
        }
      } catch (err) {
        setPricingError(err instanceof Error ? err.message : String(err));
      } finally {
        setPricingLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTierCode, contractTermMonths, discountPercent, stepData.m365_config?.additional_licences, stepData.add_ons?.selected_modules]);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
    setDiscountPercent(val);
  };

  if (!selectedTierCode) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Please select a tier in the previous step before configuring pricing.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Contract Term */}
      <div className="space-y-2">
        <Label htmlFor="contract-term" className="text-base font-semibold text-slate-900">
          Contract Term
        </Label>
        <p className="text-sm text-slate-600">
          Longer terms receive automatic discounts applied to the monthly total.
        </p>
        <Select
          value={String(contractTermMonths)}
          onValueChange={(val) => setContractTermMonths(parseInt(val, 10))}
        >
          <SelectTrigger id="contract-term" className="w-72">
            <SelectValue placeholder="Select contract term" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TERM_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Admin Discount Override */}
      {isAdmin && (
        <div className="space-y-2">
          <Label htmlFor="discount-percent" className="text-base font-semibold text-slate-900">
            Manual Discount Override
          </Label>
          <p className="text-sm text-slate-600">
            Admin only. Applied in addition to any contract term discount. Combined discounts are
            capped at 100%.
          </p>
          <div className="flex items-center gap-4">
            <Input
              id="discount-percent"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={discountPercent}
              onChange={handleDiscountChange}
              className="w-32"
            />
            <span className="text-sm text-slate-600">%</span>
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Pricing Summary</h3>

        {pricingLoading && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Calculating pricing...
          </div>
        )}

        {pricingError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pricingError}
          </div>
        )}

        {!pricingLoading && !pricingError && (
          <PricingBreakdown
            pricing={computedPricing}
            tierName={selectedTier?.tier_name}
            showMargin={isAdmin}
          />
        )}
      </div>
    </div>
  );
}
