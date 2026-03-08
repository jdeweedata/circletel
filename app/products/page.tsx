import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/lib/sanity/client';
import { PRODUCT_LIST_QUERY } from '@/lib/sanity/queries/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Products | CircleTel',
  description:
    'Explore CircleTel connectivity solutions - Business Complete for SMEs, Remote+ for work-from-home professionals, and Venue+ for commercial WiFi.',
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  heroImage: string;
  pricing: {
    startingPrice: number;
    priceNote: string;
    showContactForPricing: boolean;
  };
}

const categoryLabels: Record<string, string> = {
  consumer: 'Consumer',
  soho: 'Work From Home',
  business: 'Business',
  enterprise: 'Enterprise',
};

const categoryDescriptions: Record<string, string> = {
  business:
    'Enterprise-grade connectivity for growing businesses with automatic failover and dedicated support.',
  soho: 'Professional home office solutions that keep you connected when it matters most.',
  consumer: 'Reliable home connectivity for streaming, gaming, and everyday use.',
  enterprise: 'Custom solutions for large organisations with complex requirements.',
};

export default async function ProductsPage() {
  const products = await client.fetch<Product[]>(PRODUCT_LIST_QUERY);

  // Group products by category
  const productsByCategory = products.reduce(
    (acc, product) => {
      const category = product.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, Product[]>
  );

  // Define category order
  const categoryOrder = ['business', 'soho', 'consumer', 'enterprise'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Connectivity Solutions
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              From home offices to commercial venues, we have the right package
              for your connectivity needs. All with automatic failover, WhatsApp
              support, and one simple bill.
            </p>
            <Button size="lg" asChild>
              <Link href="/get-connected">Check Your Coverage</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Products by Category */}
      {categoryOrder.map((category) => {
        const categoryProducts = productsByCategory[category];
        if (!categoryProducts || categoryProducts.length === 0) return null;

        return (
          <section key={category} className="py-16 md:py-24 even:bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  {categoryLabels[category] || category}
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {categoryDescriptions[category]}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow">
                      {product.heroImage && (
                        <div className="relative h-56">
                          <Image
                            src={product.heroImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-xl font-bold text-white">
                              {product.name}
                            </h3>
                          </div>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <p className="text-slate-600 mb-4">{product.tagline}</p>
                        {product.pricing &&
                          !product.pricing.showContactForPricing && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-primary">
                                R{product.pricing.startingPrice?.toLocaleString()}
                              </span>
                              <span className="text-slate-500 text-sm">
                                {product.pricing.priceNote}
                              </span>
                            </div>
                          )}
                        {product.pricing?.showContactForPricing && (
                          <span className="text-primary font-medium">
                            Contact for pricing
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Not Sure Which Package Is Right?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Our team can help you choose the perfect solution for your needs.
            Chat with us on WhatsApp or check your coverage to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/get-connected">Check Coverage</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href="https://wa.me/27824873900">WhatsApp Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
