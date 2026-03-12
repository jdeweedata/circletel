'use client';

import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MITSModule } from '@/lib/mits-cpq/types';

interface ModuleCardProps {
  module: MITSModule;
  quantity: number;
  onQuantityChange: (moduleCode: string, quantity: number) => void;
}

export function ModuleCard({
  module,
  quantity,
  onQuantityChange,
}: ModuleCardProps) {
  const getBillingLabel = () => {
    switch (module.billing_type) {
      case 'monthly':
        return '/mo';
      case 'once_off':
        return 'once-off';
      case 'per_user':
        return '/user/mo';
      default:
        return '';
    }
  };

  const handleIncrement = () => {
    onQuantityChange(module.module_code, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(module.module_code, quantity - 1);
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border-2 p-6 transition-all duration-200',
        quantity > 0
          ? 'border-orange bg-orange/5'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      {/* Module Name & Description */}
      <div>
        <h3 className="font-semibold text-slate-900">{module.module_name}</h3>
        {module.description && (
          <p className="text-sm text-slate-600">{module.description}</p>
        )}
      </div>

      {/* Price & Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-slate-600">Price</span>
          <span className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-orange">
              R{module.retail_price.toLocaleString('en-ZA', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-medium text-slate-600">
              {getBillingLabel()}
            </span>
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1">
          <button
            onClick={handleDecrement}
            disabled={quantity === 0}
            className="rounded p-1 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus className="h-4 w-4 text-slate-600" />
          </button>
          <span className="w-6 text-center font-semibold text-slate-900">
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="rounded p-1 transition-colors hover:bg-slate-100"
          >
            <Plus className="h-4 w-4 text-orange" />
          </button>
        </div>
      </div>
    </div>
  );
}
