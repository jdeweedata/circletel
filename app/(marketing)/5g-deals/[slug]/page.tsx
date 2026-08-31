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
import { getTenantConfig } from '@/lib/tenant';

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
  const { branding } = getTenantConfig();
  const deal = await getFiveGDealBySlug(slug);
  if (!deal) {
    return { title: `5G deal not found | ${branding.companyName}` };
  }

  const sell = formatFiveGPrice(getFiveGSellPrice(deal));
  const term = getFiveGOfferTerm(deal.metadata);
  const description =
    term.kind === 'mtm_sim'
      ? `${deal.name} at ${sell} per month incl. VAT. SIM only, month-to-month. Check coverage.`
      : `${deal.name} at ${sell} per month incl. VAT. 24-month contract with router included. Check coverage.`;
  const url = `${branding.websiteUrl}/5g-deals/${slug}`;

  return {
    title: `${deal.name} | 5G Deals | ${branding.companyName}`,
    description,
    openGraph: {
      title: `${deal.name} | ${branding.companyName}`,
      description,
      url,
      type: 'website',
      siteName: branding.companyName,
    },
    alternates: {
      canonical: url,
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
