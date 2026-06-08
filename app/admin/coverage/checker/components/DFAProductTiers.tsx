'use client';

import { SectionCard } from '@/components/admin/shared';
import { PiCheckCircleBold, PiPackageBold } from 'react-icons/pi';

interface DFAProduct {
  id: string;
  name: string;
  download_speed: number;
  upload_speed: number;
  price: number;
  description?: string;
}

interface DFAProductTiersProps {
  products: DFAProduct[];
  recommended: DFAProduct | null;
}

function formatPrice(price: number): string {
  return `R${price.toLocaleString()}/mo`;
}

function formatSpeed(dl: number, ul: number): string {
  return `${dl}/${ul} Mbps`;
}

export default function DFAProductTiers({ products, recommended }: DFAProductTiersProps) {
  if (products.length === 0) return null;

  return (
    <SectionCard title="Available BizFibreConnect Tiers" icon={PiPackageBold}>
      <div className={`grid gap-3 ${products.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {products.map(product => {
          const isRecommended = recommended?.id === product.id;
          return (
            <div
              key={product.id}
              className={`relative rounded-lg border-2 p-3 transition-all ${
                isRecommended
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Recommended
                </span>
              )}
              <p className="text-xs font-semibold text-slate-500 mb-0.5">
                {formatSpeed(product.download_speed, product.upload_speed)}
              </p>
              <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{formatPrice(product.price)}</p>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <PiCheckCircleBold className="text-emerald-500" />
                Business · Symmetrical
              </p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
