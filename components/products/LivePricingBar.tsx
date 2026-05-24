'use client';

import { useEffect, useState } from 'react';
import { PiSpinnerBold } from 'react-icons/pi';

interface LivePricingBarProps {
  productSlug: string;
  staticPrice?: number;
  staticPriceNote?: string;
}

export function LivePricingBar({ productSlug, staticPrice, staticPriceNote }: LivePricingBarProps) {
  const [livePricing, setLivePricing] = useState<{ monthly?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const data = await res.json();
        const match = data.products?.find((p: { slug: string }) => p.slug === productSlug);
        if (match) {
          setLivePricing({ monthly: match.pricing?.monthly ?? match.price });
        }
      } catch {
        // Fall back to static price
      } finally {
        setLoading(false);
      }
    }
    fetchPricing();
  }, [productSlug]);

  const displayPrice = livePricing?.monthly ?? staticPrice;
  if (!displayPrice) return null;

  return (
    <section className="bg-slate-900 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="text-slate-400 text-sm">
              {loading ? 'Loading price...' : 'Starting from'}
            </span>
            <div className="flex items-baseline gap-1">
              {loading ? (
                <PiSpinnerBold className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="text-3xl font-bold">
                    R{displayPrice.toLocaleString()}
                  </span>
                  <span className="text-slate-400">
                    {staticPriceNote || '/month'}
                  </span>
                </>
              )}
            </div>
          </div>
          <a
            href="/get-connected"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-200 font-medium"
          >
            Get a Custom Quote
          </a>
        </div>
      </div>
    </section>
  );
}
