import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FiveGProductPage } from '@/components/products/five-g/FiveGProductPage';
import { getFiveGCashCpeRouters } from '@/lib/products/five-g-cash-cpe';
import {
  FIVE_G_DEAL_SLUGS,
  formatFiveGPrice,
  getFiveGDealBySlug,
  getFiveGSellPrice,
} from '@/lib/products/five-g-deals';
import { getFiveGOfferTerm } from '@/lib/products/five-g-offer-term';

export const dynamic = 'force-dynamic';

interface FiveGDealProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return FIVE_G_DEAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: FiveGDealProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getFiveGDealBySlug(slug);
  if (!deal) {
    return { title: '5G deal not found | CircleTel' };
  }

  const sell = formatFiveGPrice(getFiveGSellPrice(deal));
  const term = getFiveGOfferTerm(deal.metadata);
  const description =
    term.kind === 'mtm_sim'
      ? `${deal.name} at ${sell} per month incl. VAT. SIM only, month-to-month. Check coverage.`
      : `${deal.name} at ${sell} per month incl. VAT. 24-month contract with router included. Check coverage.`;

  return {
    title: `${deal.name} | 5G Deals | CircleTel`,
    description,
    openGraph: {
      title: `${deal.name} | CircleTel`,
      description,
      url: `https://www.circletel.co.za/5g-deals/${slug}`,
      type: 'website',
      siteName: 'CircleTel',
    },
    alternates: {
      canonical: `https://www.circletel.co.za/5g-deals/${slug}`,
    },
  };
}

export default async function FiveGDealProductRoute({ params }: FiveGDealProductPageProps) {
  const { slug } = await params;
  const deal = await getFiveGDealBySlug(slug);
  if (!deal) {
    notFound();
  }

  const term = getFiveGOfferTerm(deal.metadata);
  const cashCpeRouters = term.kind === 'mtm_sim' ? await getFiveGCashCpeRouters() : [];

  return <FiveGProductPage product={deal} cashCpeRouters={cashCpeRouters} />;
}
