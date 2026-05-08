import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/data/products';
import { BizMobilePromoBanner, BizMobilePageLayout } from '@/components/business-mobile';

export function generateMetadata(): Metadata {
  const product = getProductBySlug('business-mobile');

  const title =
    product?.seo?.metaTitle ||
    'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.';
  const description =
    product?.seo?.metaDescription ||
    'Business mobile plans managed entirely by CircleTel. Zero CAPEX, one invoice, delivered to your door.';

  return {
    title,
    description,
    openGraph: {
      title: product?.name ? `${product.name} | CircleTel` : 'Business Mobile Plans | CircleTel',
      description,
      url: 'https://www.circletel.co.za/business/mobile',
    },
  };
}

export default function BusinessMobilePage() {
  return (
    <>
      <BizMobilePromoBanner
        enabled={false}
        message="Limited-time pricing active — lock in your rate today."
      />
      <BizMobilePageLayout />
    </>
  );
}
