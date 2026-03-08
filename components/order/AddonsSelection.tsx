'use client';

import { useState, useEffect } from 'react';
import { PiCheckCircleBold, PiGlobeBold, PiHeadsetBold, PiPlusBold, PiSpinnerBold, PiWifiHighBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProductAddon, SelectedAddon } from '@/lib/order/types';

interface AddonsSelectionProps {
  productCategory?: string;
  selectedAddons: SelectedAddon[];
  onAddonsChange: (addons: SelectedAddon[]) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: PiGlobeBold,
  headset: PiHeadsetBold,
  wifi: PiWifiHighBold,
};

export function AddonsSelection({
  productCategory,
  selectedAddons,
  onAddonsChange,
  className,
}: AddonsSelectionProps) {
  const [addons, setAddons] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAddons();
  }, [productCategory]);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = productCategory
        ? `/api/products/addons?category=${encodeURIComponent(productCategory)}`
        : '/api/products/addons';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch add-ons');
      }

      const data = await response.json();
      setAddons(data.addons || []);
    } catch (err) {
      console.error('Error fetching addons:', err);
      setError('Unable to load add-ons');
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (addonId: string) => {
    return selectedAddons.some((sa) => sa.addon.id === addonId);
  };

  const toggleAddon = (addon: ProductAddon) => {
    if (isSelected(addon.id)) {
      // Remove addon
      onAddonsChange(selectedAddons.filter((sa) => sa.addon.id !== addon.id));
    } else {
      // Add addon
      onAddonsChange([...selectedAddons, { addon, quantity: 1 }]);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <PiSpinnerBold className="h-6 w-6 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error || addons.length === 0) {
    return null; // Don't show section if no addons available
  }

  const totalAddonsPrice = selectedAddons.reduce(
    (sum, sa) => sum + sa.addon.price_incl_vat * sa.quantity,
    0
  );

  return (
    <div className={cn('bg-white rounded-2xl border border-gray-200 p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <PiPlusBold className="h-5 w-5 text-circleTel-orange" />
          Customize Your Package
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Add optional services to enhance your connectivity
        </p>
      </div>

      <div className="space-y-3">
        {addons.map((addon) => {
          const selected = isSelected(addon.id);
          const IconComponent = ICON_MAP[addon.icon || ''] || PiPlusBold;

          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggleAddon(addon)}
              className={cn(
                'w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                selected
                  ? 'border-circleTel-orange bg-circleTel-orange/5'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  selected ? 'bg-circleTel-orange text-white' : 'bg-gray-200 text-gray-600'
                )}
              >
                {selected ? (
                  <PiCheckCircleBold className="h-5 w-5" />
                ) : (
                  <IconComponent className="h-5 w-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-circleTel-orange">
                      +R{addon.price_incl_vat}
                    </span>
                    <span className="text-xs text-gray-500">/month</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {addon.short_description || addon.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedAddons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} selected
            </span>
            <span className="font-bold text-circleTel-orange">
              +R{totalAddonsPrice}/month
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
