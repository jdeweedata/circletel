import type { Metadata } from 'next';
import { sanityFetch } from '@/lib/sanity/fetch';
import { BizMobilePromoBanner, BizMobilePageLayout } from '@/components/business-mobile';

const SLUG = 'business-mobile';

const BUSINESS_MOBILE_QUERY = `*[_type == "productPage" && slug.current == $slug][0]{
  _id,
  name,
  seo,
  promoBanner { enabled, message, endsAt }
}`;

interface PageData {
  _id: string;
  name: string;
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: { asset?: { url?: string } } };
  promoBanner?: { enabled?: boolean; message?: string; endsAt?: string };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await sanityFetch<PageData | null>({
    query: BUSINESS_MOBILE_QUERY,
    params: { slug: SLUG },
    tags: [`product:${SLUG}`, 'products'],
  });

  const title =
    page?.seo?.metaTitle ||
    'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.';
  const description =
    page?.seo?.metaDescription ||
    'Business mobile plans managed entirely by CircleTel. Zero CAPEX, one invoice, delivered to your door.';

  return {
    title,
    description,
    openGraph: {
      title: page?.name ? `${page.name} | CircleTel` : 'Business Mobile Plans | CircleTel',
      description,
      url: 'https://www.circletel.co.za/business/mobile',
      ...(page?.seo?.ogImage?.asset?.url
        ? { images: [{ url: page.seo.ogImage.asset.url }] }
        : {}),
    },
  };
}

export default async function BusinessMobilePage() {
  const page = await sanityFetch<PageData | null>({
    query: BUSINESS_MOBILE_QUERY,
    params: { slug: SLUG },
    tags: [`product:${SLUG}`, 'products'],
  });

  return (
    <>
      <BizMobilePromoBanner
        enabled={page?.promoBanner?.enabled}
        promoEndsAt={page?.promoBanner?.endsAt}
        message={page?.promoBanner?.message ?? 'Limited-time pricing active — lock in your rate today.'}
      />
      <BizMobilePageLayout />
    </>
  );
}
