import {
  PiBroadcastBold,
  PiCalendarBold,
  PiCheckBold,
  PiDatabaseBold,
  PiGaugeBold,
  PiWifiHighBold,
  PiWifiXBold,
} from 'react-icons/pi';
import Link from 'next/link';

import { FiveGProductActions } from '@/components/products/five-g/FiveGProductActions';
import { getWhatsAppLink } from '@/lib/constants/contact';
import { getCoveragePromoBadge } from '@/lib/products/coverage-package-inclusions';
import type { FiveGCashCpeRouter } from '@/lib/products/five-g-cash-cpe';
import {
  formatFiveGPrice,
  getFiveGListPrice,
  getFiveGProductMedia,
  getFiveGSellPrice,
  getFiveGSpecLabel,
  getOp19627Promo,
  HUAWEI_H155_386,
  type FiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { getFiveGCardDataCap, getFiveGOfferTerm } from '@/lib/products/five-g-offer-term';
import { getTenantConfig } from '@/lib/tenant';

interface FiveGProductPageProps {
  product: FiveGDealPackage;
  cashCpeRouters?: FiveGCashCpeRouter[];
}

function formatFup(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1).replace(/\.0$/, '')}TB`;
  return `${gb}GB`;
}

function speedLabel(product: FiveGDealPackage): string {
  const typical = product.metadata?.typical_speed?.trim();
  if (typical) return typical.replace(/-/g, '–');
  if (product.speed_down && product.speed_down > 0) {
    return `${product.speed_down} Mbps`;
  }
  return 'Full 5G speed';
}

function summaryHeadline(product: FiveGDealPackage, isSim: boolean): string {
  const cap = getFiveGCardDataCap(product.metadata);
  if (cap.unit === 'GB') return `Full 5G speed. ${cap.displayData}GB hard cap.`;
  if (product.metadata?.typical_speed) return `${speedLabel(product)}. ${getFiveGSpecLabel(product)}.`;
  if (product.speed_down && product.speed_down > 0) {
    return isSim ? `${product.speed_down} Mbps 5G. SIM only.` : `${product.speed_down} Mbps 5G. Router included.`;
  }
  return isSim ? 'SIM only. No router included.' : 'Router included.';
}

function benefits(product: FiveGDealPackage): { title: string; body: string }[] {
  const term = getFiveGOfferTerm(product.metadata);
  const cap = getFiveGCardDataCap(product.metadata);
  const spec = getFiveGSpecLabel(product);
  const fup = product.metadata?.fup_limit_gb;

  if (term.kind === 'mtm_sim') {
    if (cap.unit === 'GB') {
      return [
        { title: `${cap.displayData}GB hard cap`, body: 'You will not be billed for out-of-bundle data.' },
        { title: 'No speed limit', body: 'Full 5G speed until the data cap is reached.' },
        { title: 'Month-to-month', body: 'Cancel anytime. No 24-month contract.' },
      ];
    }
    return [
      {
        title: fup ? `${formatFup(fup)} Fair Usage Policy` : spec,
        body: 'Fair Usage Policy applies after the monthly threshold.',
      },
      { title: speedLabel(product), body: product.metadata?.typical_speed ? 'Best effort on the 5G network.' : 'Speed at your address depends on coverage.' },
      { title: 'Month-to-month', body: 'Cancel anytime. No 24-month contract.' },
    ];
  }

  return [
    { title: 'Router included', body: `${HUAWEI_H155_386.model} on the 24-month plan.` },
    {
      title: fup ? `${formatFup(fup)} Fair Usage Policy` : spec,
      body: fup ? 'Uncapped data with a Fair Usage Policy.' : 'Uncapped data.',
    },
    { title: '24-month contract', body: getOp19627Promo(product.sku) ? 'Promo to 30 Sep. Ts&Cs apply.' : 'Router included for the contract term.' },
  ];
}

function specTiles(product: FiveGDealPackage): { label: string; value: string; hint: string }[] {
  const cap = getFiveGCardDataCap(product.metadata);
  const fup = product.metadata?.fup_limit_gb;
  const term = getFiveGOfferTerm(product.metadata);
  const tiles = [
    {
      label: product.metadata?.typical_speed ? 'Typical speeds' : 'Speed',
      value: speedLabel(product),
      hint: product.metadata?.typical_speed ? 'Best effort' : product.speed_down ? 'Download' : 'No speed cap',
    },
    {
      label: cap.unit === 'GB' ? 'Hard cap' : 'Fair Usage Policy',
      value: cap.unit === 'GB' ? `${cap.displayData}GB` : fup ? formatFup(fup) : 'Uncapped',
      hint: cap.unit === 'GB' ? 'Per month' : 'Per month',
    },
  ];
  if (term.kind === 'contract_router' && product.speed_up && product.speed_up > 0 && !product.metadata?.typical_speed) {
    tiles.push({ label: 'Upload', value: `${product.speed_up} Mbps`, hint: 'Typical' });
  }
  return tiles;
}

export function FiveGProductPage({ product, cashCpeRouters = [] }: FiveGProductPageProps) {
  const sell = getFiveGSellPrice(product);
  const list = getFiveGListPrice(product);
  const term = getFiveGOfferTerm(product.metadata);
  const isSim = term.kind === 'mtm_sim';
  const promoPrice =
    product.promotion_price != null && Number(product.promotion_price) > 0
      ? Number(product.promotion_price)
      : undefined;
  const badge = getCoveragePromoBadge(product.sku, promoPrice);
  const media = getFiveGProductMedia(product);
  const whatsappHref = getWhatsAppLink(
    `Hi ${getTenantConfig().branding.companyName}, I'm interested in ${product.name}`
  );
  const items = benefits(product);
  const tiles = specTiles(product);

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

        <article className="mt-6 grid gap-8 rounded-2xl border border-ui-border bg-white p-6 shadow md:grid-cols-2 md:p-10">
          <div>
            <div className="overflow-hidden rounded-xl bg-ui-bg">
              <img
                src={media.image}
                alt={media.alt}
                width={800}
                height={600}
                className="h-full w-full object-contain p-8"
              />
            </div>
            <div className="mt-6">
              <span className="inline-flex rounded-md bg-circleTel-orange px-2.5 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
                5G
              </span>
              <p className="mt-3 font-heading text-2xl font-bold text-circleTel-navy">
                {summaryHeadline(product, isSim)}
              </p>
              <p className="mt-2 font-body text-sm text-circleTel-grey600">
                {isSim ? 'SIM only. No router included.' : '24-month plan. Router included.'}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div>
                <PiBroadcastBold className="mx-auto h-6 w-6 text-circleTel-orange" aria-hidden="true" />
                <p className="mt-2 font-heading text-[11px] font-bold uppercase tracking-wide text-circleTel-navy">
                  5G network
                </p>
              </div>
              <div>
                <PiGaugeBold className="mx-auto h-6 w-6 text-circleTel-orange" aria-hidden="true" />
                <p className="mt-2 font-heading text-[11px] font-bold uppercase tracking-wide text-circleTel-navy">
                  {speedLabel(product)}
                </p>
              </div>
              <div>
                <PiDatabaseBold className="mx-auto h-6 w-6 text-circleTel-orange" aria-hidden="true" />
                <p className="mt-2 font-heading text-[11px] font-bold uppercase tracking-wide text-circleTel-navy">
                  {getFiveGSpecLabel(product)}
                </p>
              </div>
            </div>
            {isSim ? (
              <p className="mt-6 flex items-start gap-3 rounded-xl border border-ui-border bg-ui-bg p-4 font-body text-sm text-circleTel-navy">
                <PiWifiXBold className="mt-0.5 h-5 w-5 shrink-0 text-circleTel-orange" aria-hidden="true" />
                Please note: this is a SIM only product. No router or equipment included.
              </p>
            ) : (
              <p className="mt-6 flex items-start gap-3 rounded-xl border border-ui-border bg-ui-bg p-4 font-body text-sm text-circleTel-navy">
                <PiWifiHighBold className="mt-0.5 h-5 w-5 shrink-0 text-circleTel-orange" aria-hidden="true" />
                {HUAWEI_H155_386.model} included on this 24-month plan.
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              {badge ? (
                <span className="inline-flex rounded-full bg-circleTel-orange px-3 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                  {badge}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full border border-ui-border bg-ui-bg px-3 py-1 font-body text-xs font-semibold text-circleTel-navy">
                <PiCalendarBold className="h-3.5 w-3.5" aria-hidden="true" />
                {isSim ? 'Month-to-month' : '24-month'}
              </span>
              <span className="inline-flex rounded-full border border-ui-border bg-ui-bg px-3 py-1 font-body text-xs font-semibold text-circleTel-navy">
                {isSim ? 'SIM only' : 'Router included'}
              </span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-extrabold text-circleTel-navy md:text-4xl">
              {product.name}
            </h1>
            {product.description ? (
              <p className="mt-3 font-body text-base leading-7 text-circleTel-grey600">{product.description}</p>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {tiles.map((tile) => (
                <div key={tile.label} className="rounded-xl border border-ui-border bg-ui-bg p-4">
                  <p className="font-heading text-[11px] font-bold uppercase tracking-wide text-circleTel-grey600">
                    {tile.label}
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold text-circleTel-navy">{tile.value}</p>
                  <p className="mt-1 font-body text-xs text-circleTel-grey600">{tile.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="font-heading text-4xl font-extrabold text-circleTel-orange">
                {`${formatFiveGPrice(sell)} pm`}
              </span>
              {list > sell ? (
                <span className="font-body text-lg text-circleTel-grey600 line-through">
                  {formatFiveGPrice(list)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 font-body text-sm text-circleTel-grey600">VAT incl.</p>

            <ul className="mt-6 space-y-3">
              {items.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-circleTel-orange text-white">
                    <PiCheckBold className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="font-heading text-sm font-semibold text-circleTel-navy">{item.title}</span>
                    <span className="mt-0.5 block font-body text-sm text-circleTel-grey600">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <FiveGProductActions
              dealSku={product.sku}
              dealName={product.name}
              isSim={isSim}
              routers={cashCpeRouters}
              whatsappHref={whatsappHref}
            />
          </div>
        </article>
      </div>
    </div>
  );
}
