'use client';

import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/mits-cpq/shared';
import { useMITSModules } from '@/lib/mits-cpq/hooks';
import type { MITSAddOnsData, MITSSelectedModule } from '@/lib/mits-cpq/types';

interface AddOnsStepProps {
  tierCode: string;
  data: MITSAddOnsData | undefined;
  onUpdate: (data: MITSAddOnsData) => void;
}

export function AddOnsStep({ tierCode, data, onUpdate }: AddOnsStepProps) {
  const { loading, error, getAvailableModules } = useMITSModules();

  // Map of moduleCode -> quantity
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (data?.selected_modules) {
      for (const mod of data.selected_modules) {
        initial[mod.module_code] = mod.quantity;
      }
    }
    return initial;
  });

  const availableModules = getAvailableModules(tierCode);

  // Propagate selected_modules array up whenever quantities change
  useEffect(() => {
    const selected_modules: MITSSelectedModule[] = availableModules
      .filter((mod) => (quantities[mod.module_code] ?? 0) > 0)
      .map((mod) => {
        const qty = quantities[mod.module_code] ?? 1;
        return {
          module_code: mod.module_code,
          module_name: mod.module_name,
          quantity: qty,
          unit_price: mod.retail_price,
          total_price: mod.retail_price * qty,
          billing_type: mod.billing_type,
        };
      });

    onUpdate({ selected_modules });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantities, tierCode]);

  const handleQuantityChange = (moduleCode: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [moduleCode]: quantity,
    }));
  };

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-600">
          Enhance the solution with optional add-on modules. Modules available for the selected tier
          are shown below. Adjust quantities or set to 0 to exclude.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500">
          Loading add-on modules...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load modules: {error}
        </div>
      )}

      {!loading && !error && availableModules.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 py-12">
          <p className="text-slate-500">No add-on modules available for this tier.</p>
        </div>
      )}

      {!loading && !error && availableModules.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableModules.map((module) => (
              <ModuleCard
                key={module.module_code}
                module={module}
                quantity={quantities[module.module_code] ?? 0}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>

          {selectedCount > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <strong>{selectedCount} add-on{selectedCount !== 1 ? 's' : ''}</strong> selected.
              Pricing will be reflected in the next step.
            </div>
          )}
        </>
      )}
    </div>
  );
}
