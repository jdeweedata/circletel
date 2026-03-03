import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/lib/sanity/client';
import { urlFor } from '@/lib/sanity/image';
import { WORKCONNECT_PRODUCT_QUERY, WORKCONNECT_SLUGS_QUERY } from '@/lib/sanity/queries';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Wifi,
  Cloud,
  Mail,
  Headphones,
  Shield,
  Zap,
  ArrowRight,
  MapPin,
  Info
} from 'lucide-react';

interface WorkConnectProduct {
  _id: string;
  name: string;
  tagline: string;
  slug: string;
  category: string;
  heroImage?: {
    asset: {
      _id: string;
      url: string;
    };
    alt?: string;
  };
  pricing: {
    startingPrice: number;
    priceNote?: string;
  };
  keyFeatures: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  specifications: Array<{
    label: string;
    value: string;
  }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  relatedProducts?: Array<{
    name: string;
    slug: string;
    tagline: string;
    pricing: { startingPrice: number };
  }>;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  cloud: Cloud,
  mail: Mail,
  headphones: Headphones,
  shield: Shield,
  zap: Zap,
};

export async function generateStaticParams() {
  const products = await client.fetch<Array<{ slug: string }>>(WORKCONNECT_SLUGS_QUERY);
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch<WorkConnectProduct>(WORKCONNECT_PRODUCT_QUERY, { slug });

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.seo?.metaTitle || `${product.name} | CircleTel WorkConnect`,
    description: product.seo?.metaDescription || product.tagline,
  };
}

export default async function WorkConnectProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await client.fetch<WorkConnectProduct>(WORKCONNECT_PRODUCT_QUERY, { slug });

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-circleTel-grey200 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-circleTel-orange/10 rounded-full mb-6">
                <Wifi className="w-4 h-4 text-circleTel-orange" />
                <span className="text-sm font-medium text-circleTel-orange">
                  WorkConnect SOHO
                </span>
              </div>

              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-circleTel-navy mb-4">
                {product.name}
              </h1>

              <p className="font-body text-xl text-circleTel-orange font-semibold mb-4">
                {product.tagline}
              </p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-heading text-5xl font-bold text-circleTel-navy">
                  R{product.pricing.startingPrice.toLocaleString()}
                </span>
                <span className="text-circleTel-grey600 text-lg">
                  {product.pricing.priceNote || '/month'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white"
                  asChild
                >
                  <Link href="/?segment=wfh">
                    Check Coverage
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-circleTel-navy text-circleTel-navy"
                  asChild
                >
                  <Link href="/workconnect">
                    Compare Plans
                  </Link>
                </Button>
              </div>

              {/* Quick features */}
              <div className="flex flex-wrap gap-4 text-sm text-circleTel-grey600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No contracts
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Free installation
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Uncapped data
                </span>
              </div>
            </div>

            {/* Hero Image */}
            {product.heroImage?.asset?.url && (
              <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={urlFor(product.heroImage).width(800).height(500).url()}
                  alt={product.heroImage.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-4">
            What&apos;s Included
          </h2>
          <p className="font-body text-circleTel-grey600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to work productively from home
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {product.keyFeatures.map((feature, idx) => {
              const IconComponent = feature.icon ? iconMap[feature.icon] || Zap : Zap;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="w-12 h-12 bg-circleTel-orange/10 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-circleTel-orange" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-circleTel-grey600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="bg-circleTel-grey200 py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-12">
            Technical Specifications
          </h2>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {product.specifications.map((spec, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-6 py-4 font-medium text-circleTel-navy">
                      {spec.label}
                    </td>
                    <td className="px-6 py-4 text-circleTel-grey600 text-right">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technology Note */}
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Upload Speed Note</p>
                <p>
                  Upload speeds vary by technology: FTTH delivers symmetrical speeds (equal upload/download).
                  Fixed Wireless (FWB) operates at 4:1 ratio (e.g., 100/25 Mbps). 5G/LTE speeds are variable.
                  Your actual speed depends on coverage at your address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-circleTel-navy text-center mb-12">
              Other WorkConnect Plans
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {product.relatedProducts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/workconnect/${related.slug}`}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-circleTel-orange transition-all"
                >
                  <h3 className="font-heading text-lg font-semibold text-circleTel-navy mb-1">
                    {related.name}
                  </h3>
                  <p className="text-sm text-circleTel-grey600 mb-3">
                    {related.tagline}
                  </p>
                  <p className="font-heading text-2xl font-bold text-circleTel-orange">
                    R{related.pricing.startingPrice.toLocaleString()}
                    <span className="text-sm font-normal text-circleTel-grey600">/mo</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-circleTel-navy py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to upgrade your home office?
          </h2>
          <p className="font-body text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Check coverage at your address and get connected in as little as 24 hours.
          </p>

          <div className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-circleTel-orange z-10" />
                <input
                  type="text"
                  placeholder="Enter your address"
                  className="w-full pl-12 pr-4 py-4 h-14 text-base rounded-xl border-2 border-gray-600 bg-white/10 text-white placeholder:text-gray-400 focus:border-circleTel-orange focus:outline-none"
                />
              </div>
              <Button
                size="lg"
                className="h-14 px-8 bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-semibold rounded-xl"
                asChild
              >
                <Link href="/?segment=wfh">
                  Check Coverage
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
