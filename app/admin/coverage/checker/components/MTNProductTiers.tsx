'use client';

import { SectionCard } from '@/components/admin/shared';
import { PiCheckCircleBold, PiPackageBold, PiInfoBold } from 'react-icons/pi';

export interface MTNPackage {
  id: string;
  name: string;
  download_speed: number;
  upload_speed: number;
  price: number;
  description?: string;
}

interface MTNProductTiersProps {
  products: MTNPackage[];
  fiveGAvailable: boolean;
}

function formatPrice(price: number): string {
  return `R${price.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/mo`;
}

function formatSpeed(dl: number, ul: number): string {
  return dl > 0 ? `${dl}/${ul} Mbps` : 'Best Effort';
}

// Best value = highest download-per-rand among speed-rated tiers.
function pickRecommended(products: MTNPackage[]): MTNPackage | null {
  const rated = products.filter((p) => p.download_speed > 0 && p.price > 0);
  if (rated.length === 0) return null;
  return rated.reduce((best, p) =>
    p.download_speed / p.price > best.download_speed / best.price ? p : best
  );
}

export default function MTNProductTiers({ products, fiveGAvailable }: MTNProductTiersProps) {
  const recommended = pickRecommended(products);
  const showTiers = fiveGAvailable && products.length > 0;

  return (
    <SectionCard title="Recommended Packages" icon={PiPackageBold}>
      {showTiers ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const isRecommended = recommended?.id === product.id;
            return (
              <div
                key={product.id}
                className={`relative rounded-lg border-2 p-3 transition-all ${
                  isRecommended ? 'border-yellow-500 bg-yellow-50 shadow-sm' : 'border-slate-200 bg-white'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                    Best Value
                  </span>
                )}
                <p className="text-xs font-semibold text-slate-500 mb-0.5">
                  {formatSpeed(product.download_speed, product.upload_speed)}
                </p>
                <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{formatPrice(product.price)}</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <PiCheckCircleBold className="text-emerald-500" />
                  5G · Consumer
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-500 flex items-center gap-2">
          <PiInfoBold className="text-slate-400 shrink-0" />
          {fiveGAvailable
            ? 'No active 5G packages in the catalogue yet.'
            : '5G is not available at this location — no 5G packages to recommend.'}
        </div>
      )}

      {/* Honest catalogue note: LTE/Fixed-LTE have no active products today */}
      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
        <PiInfoBold className="text-slate-300" />
        LTE and Fixed-LTE packages are not yet in the catalogue — only 5G is available to sell today.
      </p>
    </SectionCard>
  );
}
