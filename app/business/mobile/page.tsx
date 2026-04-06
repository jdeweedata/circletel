import type { Metadata } from 'next';
import Image from 'next/image';
import { sanityFetch } from '@/lib/sanity/fetch';
import { urlFor } from '@/lib/sanity/image';
import { BlockRenderer } from '@/components/sanity/BlockRenderer';
import { SanitySection } from '@/lib/sanity/types';
import { BizMobilePromoBanner } from '@/components/business-mobile';
import { getWhatsAppLink } from '@/lib/constants/contact';

const SLUG = 'business-mobile';

const BUSINESS_MOBILE_QUERY = `*[_type == "productPage" && slug.current == $slug][0]{
  _id,
  name,
  tagline,
  heroImage { asset->{url}, alt },
  pricing,
  seo,
  promoBanner { enabled, message, endsAt },
  blocks[]{ _key, _type, ... }
}`;

interface PageData {
  _id: string;
  name: string;
  tagline?: string;
  heroImage?: { asset?: { url?: string }; alt?: string };
  pricing?: { startingPrice?: number; priceNote?: string; showContactForPricing?: boolean };
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: { asset?: { url?: string } } };
  promoBanner?: { enabled?: boolean; message?: string; endsAt?: string };
  blocks?: SanitySection[];
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await sanityFetch<PageData | null>({
    query: BUSINESS_MOBILE_QUERY,
    params: { slug: SLUG },
    tags: [`product:${SLUG}`, 'products'],
  });

  const title = page?.seo?.metaTitle || 'Business Mobile Plans | CircleTel — One Invoice. All Your Connectivity.';
  const description = page?.seo?.metaDescription ||
    'Business mobile plans managed entirely by CircleTel. BusinessMobile, OfficeConnect, WorkConnect Mobile, and FleetConnect — zero CAPEX, one invoice, delivered to your door.';

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

  const heroImageUrl = page?.heroImage?.asset?.url
    ? urlFor(page.heroImage).width(1920).height(1080).url()
    : null;

  return (
    <main className="min-h-screen bg-white">
      <BizMobilePromoBanner
        enabled={page?.promoBanner?.enabled}
        promoEndsAt={page?.promoBanner?.endsAt}
        message={page?.promoBanner?.message ?? 'Limited-time pricing active — lock in your rate today.'}
      />

      {heroImageUrl ? (
        <section className="relative min-h-[520px] flex items-end pb-16 md:items-center md:pb-0">
          <div className="absolute inset-0 z-0">
            <Image
              src={heroImageUrl}
              alt={page?.heroImage?.alt || page?.name || 'Business Mobile Plans'}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          </div>
          <div className="container mx-auto px-4 relative z-10 py-24">
            <div className="max-w-2xl">
              <span className="inline-block text-sm font-semibold text-[#F5831F] uppercase tracking-widest mb-3">
                Business Mobile
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
                {page?.name || 'Business Mobile Plans'}
              </h1>
              {page?.tagline && (
                <p className="text-xl md:text-2xl text-white/90 mb-6">{page.tagline}</p>
              )}
              {page?.pricing?.startingPrice && !page.pricing.showContactForPricing && (
                <p className="text-2xl font-bold text-white mb-8">
                  From R{page.pricing.startingPrice.toLocaleString()}
                  {page.pricing.priceNote && (
                    <span className="text-lg font-normal text-white/80"> {page.pricing.priceNote}</span>
                  )}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#bundles"
                  className="inline-flex items-center bg-[#F5831F] hover:bg-[#e0721a] text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  View Plans
                </a>
                <a
                  href={getWhatsAppLink('Hi, I want to get a quote for Business Mobile plans')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div id="bundles">
        {page?.blocks && page.blocks.length > 0 && (
          <BlockRenderer sections={page.blocks} />
        )}
      </div>
    </main>
  );
}
