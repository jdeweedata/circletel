'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PiSpinnerBold } from 'react-icons/pi';

interface ServicePackage {
  id: string;
  name: string;
  slug: string | null;
  product_category: string | null;
  description: string | null;
  price: number;
  pricing: {
    monthly?: number;
    setup?: number;
    download_speed?: number;
    upload_speed?: number;
  } | null;
  metadata: Record<string, unknown> | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  startingPrice: number;
  priceNote: string;
}

const categoryLabels: Record<string, string> = {
  consumer: 'Consumer',
  soho: 'Work From Home',
  business: 'Business',
  enterprise: 'Enterprise',
  connectivity: 'Connectivity',
  'managed-connectivity': 'Managed Connectivity',
};

const categoryDescriptions: Record<string, string> = {
  business:
    'Enterprise-grade connectivity for growing businesses with automatic failover and dedicated support.',
  soho: 'Professional home office solutions that keep you connected when it matters most.',
  consumer: 'Reliable home connectivity for streaming, gaming, and everyday use.',
  enterprise: 'Custom solutions for large organisations with complex requirements.',
  connectivity: 'Fast, reliable internet for home and business.',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();

        const mapped: Product[] = (data.products || []).map((p: ServicePackage) => {
          const monthlyPrice = p.pricing?.monthly ?? p.price;
          return {
            id: p.id,
            name: p.name,
            slug: p.slug || '',
            category: p.product_category || 'other',
            tagline: p.description || '',
            startingPrice: monthlyPrice,
            priceNote: monthlyPrice > 0 ? '/month' : 'Contact us',
          };
        });

        setProducts(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

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

  const categoryOrder = ['business', 'soho', 'consumer', 'connectivity', 'enterprise'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

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
                  {categoryDescriptions[category] || 'Explore our range of connectivity solutions.'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                        <p className="text-slate-600 mb-4">{product.tagline}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-primary">
                            R{product.startingPrice.toLocaleString()}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {product.priceNote}
                          </span>
                        </div>
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
