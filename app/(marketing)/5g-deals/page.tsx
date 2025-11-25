'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Signal, Wifi, Zap, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductShowcaseCard } from '@/components/products';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SortOption = 'price-asc' | 'price-desc' | 'speed-desc' | 'featured';

export default function FiveGDealsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?service_type=5G');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching 5G deals:', err);
        setError('Failed to load 5G deals');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.price || a.base_price_zar || 0) - (b.price || b.base_price_zar || 0);
      case 'price-desc':
        return (b.price || b.base_price_zar || 0) - (a.price || a.base_price_zar || 0);
      case 'speed-desc':
        return (b.speed_down || 0) - (a.speed_down || 0);
      case 'featured':
      default:
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return (a.sort_order || 999) - (b.sort_order || 999);
    }
  });

  const handleViewDeal = (product: any) => {
    const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/products/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-circleTel-darkNeutral text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-circleTel-orange rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-3xl">
            <Badge className="bg-circleTel-orange text-white mb-4">
              <Signal className="h-3 w-3 mr-1" />
              5G Home Internet
            </Badge>

            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Lightning Fast 5G Deals
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-6 max-w-2xl">
              Experience the future of home internet with our blazing-fast 5G packages.
              No landline required, just plug in and connect.
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Zap className="h-5 w-5 text-circleTel-orange" />
                <span className="text-sm">Up to 100Mbps</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Wifi className="h-5 w-5 text-circleTel-orange" />
                <span className="text-sm">Free Router</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <Signal className="h-5 w-5 text-circleTel-orange" />
                <span className="text-sm">No Landline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Filter/Sort Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading...' : `${products.length} 5G Packages Available`}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Choose the perfect plan for your home
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="speed-desc">Fastest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-circleTel-orange mx-auto mb-4" />
              <p className="text-gray-600">Loading 5G deals...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Unable to load deals
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Signal className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No 5G packages available
              </h3>
              <p className="text-gray-600 mb-4">
                We're currently updating our 5G offerings. Please check back soon.
              </p>
              <Button
                onClick={() => router.push('/fibre-packages')}
                variant="outline"
              >
                View Fibre Packages
              </Button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProducts.map((product) => (
              <ProductShowcaseCard
                key={product.id}
                product={product}
                onViewDeal={handleViewDeal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      {!loading && products.length > 0 && (
        <section className="bg-white border-t py-12">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Need help choosing?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help you find the perfect 5G package for your needs.
              Check coverage at your address or speak to our experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/coverage')}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                Check Coverage
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/contact')}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
