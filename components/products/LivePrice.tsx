'use client';

import { useEffect, useState } from 'react';

interface LivePriceProps {
  productSlug: string;
  staticPrice?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Displays a price that auto-updates from the products API.
 * Falls back to staticPrice while loading or on error.
 */
export function LivePrice({ productSlug, staticPrice, className, prefix = 'R', suffix = '' }: LivePriceProps) {
  const [livePrice, setLivePrice] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) return;
        const data = await res.json();
        const match = data.products?.find((p: { slug: string }) => p.slug === productSlug);
        if (match) {
          setLivePrice(match.pricing?.monthly ?? match.price);
        }
      } catch {
        // Keep static price
      }
    }
    fetchPrice();
  }, [productSlug]);

  const displayPrice = livePrice ?? staticPrice;
  if (displayPrice == null) return null;

  return (
    <span className={className}>
      {prefix}{displayPrice.toLocaleString()}{suffix}
    </span>
  );
}
