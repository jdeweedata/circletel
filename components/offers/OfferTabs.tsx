'use client';
import { useState } from 'react';
import type { PublicOffer } from '@/lib/types/offer';
import { OfferCard } from './OfferCard';

type Segment = 'consumer' | 'business';

export function OfferTabs({ offers }: { offers: PublicOffer[] }) {
  const [segment, setSegment] = useState<Segment>('consumer');
  const visible = offers.filter((o) =>
    segment === 'consumer'
      ? o.customerType === 'consumer' || o.customerType === 'both'
      : o.customerType === 'business' || o.customerType === 'both',
  );

  return (
    <div>
      <div className="mb-8 flex justify-center gap-2">
        {(['consumer', 'business'] as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`rounded-full px-6 py-2 text-sm font-semibold capitalize ${
              segment === s ? 'bg-circleTel-navy text-white' : 'bg-circleTel-lightNeutral text-circleTel-navy'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {visible.map((o) => (
          <OfferCard key={o.slug} offer={o} />
        ))}
      </div>
    </div>
  );
}
