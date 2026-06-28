import Link from 'next/link';
import type { PublicOffer } from '@/lib/types/offer';

export function OfferCard({ offer }: { offer: PublicOffer }) {
  return (
    <div className="rounded-xl border-2 border-circleTel-lightNeutral p-6 hover:border-circleTel-orange transition-colors">
      <h3 className="text-lg font-bold text-circleTel-navy">{offer.title}</h3>
      {offer.description && (
        <p className="mt-2 text-sm text-circleTel-secondaryNeutral">{offer.description}</p>
      )}
      <div className="mt-4">
        <span className="text-3xl font-bold text-circleTel-orange">
          R{offer.priceInclVat.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
        </span>
        <span className="ml-2 text-xs text-circleTel-secondaryNeutral">{offer.vatLabel}</span>
      </div>
      <Link
        href={`/offers/${offer.slug}`}
        className="mt-6 inline-block rounded-lg bg-circleTel-orange px-5 py-2 text-white hover:bg-circleTel-orange-dark"
      >
        View details
      </Link>
    </div>
  );
}
