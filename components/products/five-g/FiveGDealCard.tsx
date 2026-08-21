import Link from 'next/link';

import { ShopCta } from '@/components/home/shop/ShopCta';
import { cn } from '@/lib/utils';
import {
  CIRCLETEL_NANO_SIM,
  HUAWEI_H155_386,
  formatFiveGPrice,
  getFiveGListPrice,
  getFiveGListingTitle,
  getFiveGSellPrice,
  getFiveGSpecLabel,
  getOp19627Promo,
  isFiveGPromoSlug,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { getFiveGOfferTerm } from '@/lib/products/five-g-offer-term';

interface FiveGDealCardProps {
  product: FiveGDealPackage;
  variant: 'featured' | 'compact';
}

export function FiveGDealCard({ product, variant }: FiveGDealCardProps) {
  const sell = getFiveGSellPrice(product);
  const list = getFiveGListPrice(product);
  const promo = getOp19627Promo(product.sku);
  const term = getFiveGOfferTerm(product.metadata);
  const title = getFiveGListingTitle(product, variant);
  const spec = getFiveGSpecLabel(product);
  const showCpe = term.kind === 'contract_router';
  const showSim = term.kind === 'mtm_sim';
  const thumb = showCpe ? HUAWEI_H155_386 : showSim ? CIRCLETEL_NANO_SIM : null;
  const href =
    product.slug && isFiveGPromoSlug(product.slug) ? `/5g-deals/${product.slug}` : '/coverage';

  if (variant === 'featured') {
    return (
      <article className="flex h-full flex-col rounded-2xl border border-ui-border bg-white p-6 shadow md:p-8">
        <span className="inline-flex w-fit rounded-md bg-circleTel-navy px-2.5 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
          Featured
        </span>
        <h3 className="mt-4 font-heading text-2xl font-bold text-circleTel-navy">{title}</h3>
        <p className="mt-6 font-body text-base text-circleTel-grey600">
          Only{' '}
          <span className="font-heading text-4xl font-extrabold text-circleTel-orange">
            {formatFiveGPrice(sell)}
          </span>{' '}
          pm
        </p>
        {promo && list > sell ? (
          <p className="mt-1 font-body text-sm text-circleTel-grey600 line-through">
            {`was ${formatFiveGPrice(list)}`}
          </p>
        ) : (
          <p className="mt-1 font-body text-sm text-circleTel-grey600">24-month · router included</p>
        )}
        <div className="mt-auto pt-6">
          <ShopCta href={href} className="w-full">
            Get this deal
          </ShopCta>
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-2xl border border-ui-border bg-white p-5 shadow">
      {thumb ? (
        <img
          src={thumb.image}
          alt={thumb.alt}
          width={80}
          height={80}
          className="h-16 w-16 object-contain"
        />
      ) : null}
      <h3 className="mt-4 font-heading text-xl font-semibold text-circleTel-navy">{title}</h3>
      <p className="mt-1 font-body text-sm text-circleTel-grey600">
        {spec}
        {term.kind === 'contract_router' ? ' · 24-month' : term.kind === 'mtm_sim' ? ' · Month-to-month' : ''}
      </p>
      <p className="mt-4 font-body text-sm text-circleTel-grey600">
        Only{' '}
        <span className="font-heading text-2xl font-extrabold text-circleTel-orange">
          {formatFiveGPrice(sell)}
        </span>{' '}
        pm
      </p>
      <div className="mt-auto pt-5">
        <Link
          href={href}
          className={cn(
            'inline-flex w-full items-center justify-center rounded-full border-2 border-circleTel-orange bg-white px-5 py-2.5 text-sm font-semibold text-circleTel-orange transition-colors',
            'hover:bg-circleTel-orange hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circleTel-orange focus-visible:ring-offset-2'
          )}
        >
          View deal
        </Link>
      </div>
    </article>
  );
}
