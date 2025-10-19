'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  speed: string;
  price: number;
  promo_price?: number | null;
  installation_fee: number;
  router_model?: string | null;
  router_included: boolean;
  router_rental_fee?: number | null;
  category: string;
  metadata?: any;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const url = selectedCategory === 'all'
        ? '/api/products'
        : `/api/products?category=${encodeURIComponent(selectedCategory)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleProductSelect(productId: string) {
    // Navigate to coverage checker or order page
    router.push(`/coverage?product=${productId}`);
  }

  // Group products by category
  const categories = Array.from(new Set(products.map(p => p.category)));
  const allCategories = ['all', ...categories];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">
              Our Internet Packages
            </h1>
            <p className="text-lg text-circleTel-secondaryNeutral">
              High-speed, reliable internet connectivity for your home or business.
              Choose the perfect package for your needs.
            </p>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="all">All Packages</TabsTrigger>
              <TabsTrigger value="BizFibre Connect">BizFibre</TabsTrigger>
              <TabsTrigger value="Wireless">Wireless</TabsTrigger>
              <TabsTrigger value="Enterprise">Enterprise</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-circleTel-secondaryNeutral mb-4">
                No products available in this category
              </p>
              <Button
                onClick={() => setSelectedCategory('all')}
                variant="outline"
              >
                View All Packages
              </Button>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={handleProductSelect}
                    featured={index === 1} // Mark middle product as featured
                  />
                ))}
              </div>

              {/* Call to Action */}
              <div className="bg-circleTel-lightNeutral rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
                  Not sure which package is right for you?
                </h2>
                <p className="text-circleTel-secondaryNeutral mb-6">
                  Check if our services are available in your area and get personalized recommendations
                </p>
                <Button
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                  onClick={() => router.push('/coverage')}
                >
                  Check Coverage in Your Area
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
