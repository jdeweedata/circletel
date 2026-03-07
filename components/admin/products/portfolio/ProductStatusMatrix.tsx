'use client';

import { PiRocketBold, PiCodeBold, PiFlaskBold, PiArchiveBold } from 'react-icons/pi';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { ProductStatusGroup, ProductLifecycleStatus } from '@/lib/types/product-portfolio';
import { cn } from '@/lib/utils';

interface ProductStatusMatrixProps {
  groups: ProductStatusGroup[];
}

const STATUS_CONFIG: Record<
  ProductLifecycleStatus,
  { icon: typeof PiRocketBold; bg: string; border: string; headerBg: string; text: string }
> = {
  active: {
    icon: PiRocketBold,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
  development: {
    icon: PiCodeBold,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    headerBg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  pilot: {
    icon: PiFlaskBold,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    headerBg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  sunset: {
    icon: PiArchiveBold,
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    headerBg: 'bg-slate-100',
    text: 'text-slate-700',
  },
};

export function ProductStatusMatrix({ groups }: ProductStatusMatrixProps) {
  return (
    <SectionCard title="Product Lifecycle Status" icon={PiRocketBold}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => {
          const config = STATUS_CONFIG[group.status];
          const Icon = config.icon;

          return (
            <div
              key={group.status}
              className={cn(
                'rounded-lg border overflow-hidden',
                config.border,
                config.bg
              )}
            >
              {/* Header */}
              <div className={cn('px-4 py-3 flex items-center gap-2', config.headerBg)}>
                <Icon className={cn('h-5 w-5', config.text)} />
                <h4 className={cn('font-semibold', config.text)}>{group.label}</h4>
                <span className={cn(
                  'ml-auto text-xs font-medium px-2 py-0.5 rounded-full',
                  config.bg,
                  config.text
                )}>
                  {group.products.length}
                </span>
              </div>

              {/* Product List */}
              <div className="p-3 space-y-2 min-h-[100px]">
                {group.products.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">No products</p>
                ) : (
                  group.products.map((product) => (
                    <div
                      key={product.productId}
                      className="bg-white rounded-md p-2 border border-slate-100 shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {product.category.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <PiRocketBold className="h-4 w-4 text-emerald-600" />
            <span><strong>Active:</strong> Live in production, available to customers</span>
          </div>
          <div className="flex items-center gap-2">
            <PiCodeBold className="h-4 w-4 text-blue-600" />
            <span><strong>Development:</strong> Being built, not yet available</span>
          </div>
          <div className="flex items-center gap-2">
            <PiFlaskBold className="h-4 w-4 text-purple-600" />
            <span><strong>Pilot:</strong> Limited rollout, testing with select customers</span>
          </div>
          <div className="flex items-center gap-2">
            <PiArchiveBold className="h-4 w-4 text-slate-600" />
            <span><strong>Sunset:</strong> Being phased out or archived</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
