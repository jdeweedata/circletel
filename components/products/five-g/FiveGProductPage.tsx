import { PiArrowDownBold, PiArrowUpBold, PiWifiHighBold } from 'react-icons/pi';
import Link from 'next/link';

import { ShopCta } from '@/components/home/shop/ShopCta';
import { getWhatsAppLink } from '@/lib/constants/contact';
import { getCoveragePromoBadge } from '@/lib/products/coverage-package-inclusions';
import {
  formatFiveGPrice,
  getFiveGListPrice,
  getFiveGPromoPage,
  getFiveGSellPrice,
  HUAWEI_H155_386,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { getFiveGCardDataCap, getFiveGOfferTerm } from '@/lib/products/five-g-offer-term';

interface FiveGProductPageProps {
  product: FiveGDealPackage;
  slug: string;
}

function fupLine(product: FiveGDealPackage): string {
  const cap = getFiveGCardDataCap(product.metadata);
  const fupGb = product.metadata?.fup_limit_gb;

  if (cap.unit === 'GB') {
    return `${cap.displayData} GB monthly hard cap`;
  }
  if (fupGb && fupGb > 0) {
    const label = fupGb >= 1000 ? `${(fupGb / 1000).toFixed(1).replace(/\.0$/, '')}TB` : `${fupGb}GB`;
    return `Uncapped with ${label} Fair Usage Policy`;
  }
  return 'Uncapped data';
}

export function FiveGProductPage({ product, slug }: FiveGProductPageProps) {
  const page = getFiveGPromoPage(slug);
  const sell = getFiveGSellPrice(product);
  const list = getFiveGListPrice(product);
  const term = getFiveGOfferTerm(product.metadata);
  const badge = getCoveragePromoBadge(product.sku, sell);
  const routerModel = product.metadata?.router_model?.trim() || HUAWEI_H155_386.model;
  const cpeImage = page?.cpeImage || HUAWEI_H155_386.image;
  const cpeAlt = page?.cpeAlt || HUAWEI_H155_386.alt;
  const whatsappHref = getWhatsAppLink(`Hi CircleTel, I'm interested in ${product.name}`);

  return (
    <div className="bg-ui-bg">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <nav className="font-body text-sm text-circleTel-grey600">
          <Link href="/5g-deals" className="hover:text-circleTel-orange-accessible">
            5G deals
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="text-circleTel-navy">{product.name}</span>
        </nav>

        <article className="mt-6 grid items-center gap-8 rounded-2xl border border-ui-border bg-white p-6 shadow md:grid-cols-2 md:p-10">
          <div className="overflow-hidden rounded-xl bg-ui-bg">
            <img
              src={cpeImage}
              alt={cpeAlt}
              width={800}
              height={600}
              className="h-full w-full object-contain p-8"
            />
          </div>

          <div>
            {badge ? (
              <p className="font-heading text-xs font-extrabold uppercase tracking-[0.18em] text-circleTel-orange-accessible">
                {badge}
              </p>
            ) : null}
            <h1 className="mt-2 font-heading text-3xl font-extrabold text-circleTel-navy md:text-4xl">
              {product.name}
            </h1>
            {product.description ? (
              <p className="mt-3 font-body text-base leading-7 text-circleTel-grey600">{product.description}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-heading text-4xl font-extrabold text-circleTel-orange">
                {formatFiveGPrice(sell)}
              </span>
              {list > sell ? (
                <span className="font-body text-lg text-circleTel-grey600 line-through">
                  {formatFiveGPrice(list)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 font-body text-sm text-circleTel-grey600">
              {term.priceHint || 'per month incl. VAT'}
            </p>

            {term.label ? (
              <p className="mt-4 inline-flex rounded-full border border-ui-border bg-ui-bg px-4 py-1.5 font-body text-sm font-semibold text-circleTel-navy">
                {term.label}
              </p>
            ) : null}
            <p className="mt-3 font-body text-sm text-circleTel-grey600">{fupLine(product)}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ShopCta href="/coverage">Check coverage</ShopCta>
              <ShopCta href={whatsappHref} variant="outline-navy">
                WhatsApp us
              </ShopCta>
            </div>
          </div>
        </article>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {product.speed_down ? (
            <div className="rounded-2xl border border-ui-border bg-white p-5">
              <PiArrowDownBold className="h-5 w-5 text-circleTel-orange" aria-hidden="true" />
              <p className="mt-3 font-heading text-2xl font-bold text-circleTel-navy">
                {`${product.speed_down} Mbps`}
              </p>
              <p className="mt-1 font-body text-sm text-circleTel-grey600">Download</p>
            </div>
          ) : null}
          {product.speed_up ? (
            <div className="rounded-2xl border border-ui-border bg-white p-5">
              <PiArrowUpBold className="h-5 w-5 text-circleTel-orange" aria-hidden="true" />
              <p className="mt-3 font-heading text-2xl font-bold text-circleTel-navy">
                {`${product.speed_up} Mbps`}
              </p>
              <p className="mt-1 font-body text-sm text-circleTel-grey600">Upload</p>
            </div>
          ) : null}
          <div className="rounded-2xl border border-ui-border bg-white p-5">
            <PiWifiHighBold className="h-5 w-5 text-circleTel-orange" aria-hidden="true" />
            <p className="mt-3 font-heading text-lg font-bold text-circleTel-navy">{routerModel}</p>
            <p className="mt-1 font-body text-sm text-circleTel-grey600">Preferred router</p>
          </div>
        </section>
      </div>
    </div>
  );
}
