import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { products, getProductBySlug } from '@/lib/data/products';
import { Button } from '@/components/ui/button';
import { PiWhatsappLogoBold } from 'react-icons/pi';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductPageHero } from '@/components/products/ProductPageHero';
import { PricingBar } from '@/components/products/PricingBar';
import { FeatureGrid } from '@/components/products/FeatureGrid';
import { ProductHowItWorks } from '@/components/products/ProductHowItWorks';
import { SpecificationTable } from '@/components/products/SpecificationTable';
import { WhyCircleTel } from '@/components/products/WhyCircleTel';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { BlockRenderer } from '@/components/blocks/BlockRenderer';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.seo?.metaTitle || `${product.name} | CircleTel`,
    description:
      product.seo?.metaDescription ||
      product.tagline ||
      `${product.name} connectivity solution from CircleTel`,
    openGraph: {
      title: product.seo?.metaTitle || product.name,
      description: product.seo?.metaDescription || product.tagline,
      images: product.heroImage ? [{ url: product.heroImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <ProductPageHero
        name={product.name}
        tagline={product.tagline}
        heroImage={product.heroImage}
        category={product.category}
      />

      {product.pricing && !product.pricing.showContactForPricing && (
        <PricingBar
          startingPrice={product.pricing.startingPrice}
          priceNote={product.pricing.priceNote}
        />
      )}

      <FeatureGrid
        productName={product.name}
        features={product.keyFeatures}
      />

      <ProductHowItWorks productSlug={product.slug} />

      <SpecificationTable specifications={product.specifications} />

      {product.blocks && product.blocks.length > 0 && (
        <BlockRenderer sections={product.blocks} />
      )}

      <WhyCircleTel />

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

      <RelatedProducts products={product.relatedProducts} />

      <Footer />
    </div>
  );
}
