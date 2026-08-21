import { ShopCta } from '@/components/home/shop/ShopCta';
import { getCoveragePromoBadge } from '@/lib/products/coverage-package-inclusions';
import {
  HUAWEI_H155_386,
  formatFiveGPrice,
  getFiveGListPrice,
  getFiveGSellPrice,
  getOp19627Promo,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { getFiveGCardDataCap, getFiveGOfferTerm } from '@/lib/products/five-g-offer-term';

interface FiveGDealCardProps {
  product: FiveGDealPackage;
  cta: 'view-deal' | 'coverage';
}

export function FiveGDealCard({ product, cta }: FiveGDealCardProps) {
  const sell = getFiveGSellPrice(product);
  const list = getFiveGListPrice(product);
  const promo = getOp19627Promo(product.sku);
  const term = getFiveGOfferTerm(product.metadata);
  const cap = getFiveGCardDataCap(product.metadata);
  const promoPrice =
    product.promotion_price != null && Number(product.promotion_price) > 0
      ? Number(product.promotion_price)
      : undefined;
  const badge = getCoveragePromoBadge(product.sku, promoPrice);
  const showCpe = term.kind === 'contract_router';
  const href =
    cta === 'view-deal' && product.slug ? `/5g-deals/${product.slug}` : '/coverage';
  const ctaLabel = cta === 'view-deal' ? 'View deal' : 'Check coverage';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ui-border bg-white shadow">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-ui-bg">
        {showCpe ? (
          <img
            src={HUAWEI_H155_386.image}
            alt={HUAWEI_H155_386.alt}
            width={640}
            height={480}
            className="h-full w-full object-contain p-6"
          />
        ) : (
          <div className="px-6 text-center">
            <p className="font-heading text-5xl font-extrabold text-circleTel-navy">
              {cap.displayData}
              {cap.unit ? <span className="ml-1 text-2xl text-circleTel-grey600">{cap.unit}</span> : null}
            </p>
            <p className="mt-2 font-body text-sm font-semibold uppercase tracking-wide text-circleTel-orange-accessible">
              {cap.caption}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {badge ? (
          <p className="font-heading text-xs font-extrabold uppercase tracking-[0.16em] text-circleTel-orange-accessible">
            {badge}
          </p>
        ) : null}
        <h3 className="mt-2 font-heading text-xl font-semibold text-circleTel-navy">{product.name}</h3>
        {term.label ? (
          <p className="mt-1 font-body text-sm text-circleTel-grey600">{term.label}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-3xl font-extrabold text-circleTel-orange">
            {formatFiveGPrice(sell)}
          </span>
          {promo && list > sell ? (
            <span className="font-body text-base text-circleTel-grey600 line-through">
              {formatFiveGPrice(list)}
            </span>
          ) : null}
        </div>
        {promo ? (
          <p className="mt-1 font-body text-sm text-circleTel-grey600">
            {`MTN shop ${formatFiveGPrice(promo.mtnRetailInclVat)}`}
          </p>
        ) : null}
        <p className="mt-1 font-body text-sm text-circleTel-grey600">
          {term.priceHint || 'per month incl. VAT'}
        </p>

        <div className="mt-auto pt-5">
          <ShopCta href={href} className="w-full px-5 py-2.5">
            {ctaLabel}
          </ShopCta>
        </div>
      </div>
    </article>
  );
}
