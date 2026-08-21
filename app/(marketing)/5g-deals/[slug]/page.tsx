import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FiveGProductPage } from '@/components/products/five-g/FiveGProductPage';
import {
  FIVE_G_PROMO_PAGES,
  formatFiveGPrice,
  getFiveGPromoPage,
  getFiveGSellPrice,
  isFiveGPromoSlug,
  toFiveGDealPackage,
} from '@/lib/products/five-g-deals';
import { ProductsService } from '@/lib/services/products';

export const dynamic = 'force-dynamic';

interface FiveGDealProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(FIVE_G_PROMO_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: FiveGDealProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getFiveGPromoPage(slug);
  if (!page) {
    return { title: '5G deal not found | CircleTel' };
  }

  const product = await ProductsService.getProductBySlug(slug);
  if (!product) {
    return { title: '5G deal not found | CircleTel' };
  }

  const deal = toFiveGDealPackage(product as unknown as Record<string, unknown>);
  const sell = formatFiveGPrice(getFiveGSellPrice(deal));

  return {
    title: `${deal.name} | 5G Deals | CircleTel`,
    description: `${deal.name} at ${sell} per month incl. VAT. 24-month contract with router included. Check coverage to order.`,
    openGraph: {
      title: `${deal.name} | CircleTel`,
      description: `Promo ${sell} per month incl. VAT. Check coverage at your address.`,
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
  if (!isFiveGPromoSlug(slug)) {
    notFound();
  }

  const product = await ProductsService.getProductBySlug(slug);
  const expectedSku = FIVE_G_PROMO_PAGES[slug].sku;
  if (!product || product.sku !== expectedSku) {
    notFound();
  }

  return (
    <FiveGProductPage
      product={toFiveGDealPackage(product as unknown as Record<string, unknown>)}
      slug={slug}
    />
  );
}
