import { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { client, previewClient } from '@/lib/sanity/client';
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
} from '@/lib/sanity/queries/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  PiShieldCheckBold,
  PiPhoneBold,
  PiGlobeBold,
  PiChatCircleBold,
  PiWifiHighBold,
  PiHardDrivesBold,
  PiReceiptBold,
  PiArrowUpBold,
  PiLayoutBold,
  PiChartBarBold,
  PiSimCardBold,
  PiCheckCircleBold,
  PiWhatsappLogoBold,
} from 'react-icons/pi';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductHowItWorks } from '@/components/products/ProductHowItWorks';
import { WhyCircleTel } from '@/components/products/WhyCircleTel';
import { BlockRenderer } from '@/components/sanity/BlockRenderer';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: PiShieldCheckBold,
  phone: PiPhoneBold,
  globe: PiGlobeBold,
  'message-circle': PiChatCircleBold,
  wifi: PiWifiHighBold,
  router: PiHardDrivesBold,
  receipt: PiReceiptBold,
  'arrow-up': PiArrowUpBold,
  layout: PiLayoutBold,
  chart: PiChartBarBold,
  'sim-card': PiSimCardBold,
};

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(PRODUCT_SLUGS_QUERY);
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch(PRODUCT_BY_SLUG_QUERY, { slug });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.seo?.title || `${product.name} | CircleTel`,
    description:
      product.seo?.description ||
      product.tagline ||
      `${product.name} connectivity solution from CircleTel`,
    openGraph: {
      title: product.seo?.title || product.name,
      description: product.seo?.description || product.tagline,
      images: product.heroImage ? [{ url: product.heroImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { isEnabled: isDraftMode } = await draftMode();

  // Use preview client when in draft mode to see unpublished changes
  const sanityClient = isDraftMode ? previewClient : client;
  const product = await sanityClient.fetch(PRODUCT_BY_SLUG_QUERY, { slug });

  if (!product) {
    notFound();
  }

  const categoryLabels: Record<string, string> = {
    consumer: 'Consumer',
    soho: 'Work From Home',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center">
        {product.heroImage && (
          <Image
            src={product.heroImage}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Strong gradient overlay for text contrast - darker on left where text sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl lg:max-w-2xl">
            <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
              {categoryLabels[product.category] || product.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {product.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/95 mb-8 drop-shadow-md">
              {product.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white" asChild>
                <Link href="/">Get Started</Link>
              </Button>
              <Button size="lg" className="bg-[#25D366] hover:bg-[#1da851] text-white" asChild>
                <Link href="https://wa.me/27824873900" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                  <PiWhatsappLogoBold className="w-5 h-5" />
                  WhatsApp Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Bar */}
      {product.pricing && !product.pricing.showContactForPricing && (
        <section className="bg-slate-900 text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <span className="text-slate-400 text-sm">Starting from</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    R{product.pricing.startingPrice?.toLocaleString()}
                  </span>
                  <span className="text-slate-400">
                    {product.pricing.priceNote}
                  </span>
                </div>
              </div>
              <Button size="lg" variant="outline" className="border-2 border-white text-white bg-transparent rounded-lg hover:bg-white hover:text-slate-900 transition-all duration-200" asChild>
                <Link href="/">Check Coverage & Order</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Key Features */}
      {product.keyFeatures && product.keyFeatures.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose {product.name}?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {product.keyFeatures.map(
                (
                  feature: {
                    _key: string;
                    title: string;
                    description: string;
                    icon?: string;
                  },
                  index: number
                ) => {
                  const IconComponent = feature.icon
                    ? iconMap[feature.icon]
                    : PiCheckCircleBold;
                  return (
                    <Card key={feature._key || index} className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        {IconComponent && (
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <h3 className="text-lg font-semibold mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <ProductHowItWorks productSlug={product.slug} />

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Technical Specifications
            </h2>
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <dl className="divide-y divide-slate-100">
                    {product.specifications.map(
                      (
                        spec: { _key: string; label: string; value: string },
                        index: number
                      ) => (
                        <div
                          key={spec._key || index}
                          className="flex justify-between py-4 px-6"
                        >
                          <dt className="font-medium text-slate-900">
                            {spec.label}
                          </dt>
                          <dd className="text-slate-600">{spec.value}</dd>
                        </div>
                      )
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Additional Blocks (Pricing Tiers, etc.) */}
      {product.blocks && product.blocks.length > 0 && (
        <BlockRenderer sections={product.blocks} />
      )}

      {/* Why CircleTel */}
      <WhyCircleTel />

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-[#F5831F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Connected?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Check your coverage and order {product.name} today. Free installation
            on 24-month contracts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all duration-200" asChild>
              <Link href="/">Check Coverage</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 hover:scale-105 transition-all duration-200" asChild>
              <Link href="https://wa.me/27824873900" className="flex items-center gap-2">
                <PiWhatsappLogoBold className="w-5 h-5" />
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              You Might Also Like
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {product.relatedProducts.map(
                (related: {
                  _id: string;
                  name: string;
                  slug: string;
                  tagline: string;
                  heroImage: string;
                  pricing: { startingPrice: number; priceNote: string };
                }) => (
                  <Link
                    key={related._id}
                    href={`/products/${related.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      {related.heroImage && (
                        <div className="relative h-48">
                          <Image
                            src={related.heroImage}
                            alt={related.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-1">
                          {related.name}
                        </h3>
                        <p className="text-slate-600 text-sm mb-2">
                          {related.tagline}
                        </p>
                        {related.pricing && (
                          <p className="text-primary font-medium">
                            From R{related.pricing.startingPrice?.toLocaleString()}
                            /mo
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
