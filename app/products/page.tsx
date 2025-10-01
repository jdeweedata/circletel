'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductComparison } from '@/components/products/ProductComparison';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, ShoppingCart, Loader2 } from 'lucide-react';
import type { Product, ProductFilters as IProductFilters } from '@/lib/types/products';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparingProducts, setComparingProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<IProductFilters>({
    category: searchParams.get('category') as any || undefined,
    service_type: searchParams.get('service_type') as any || undefined,
    search: searchParams.get('search') || undefined,
    sort_by: searchParams.get('sort') as any || 'popular',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { ProductsClientService } = await import('@/lib/services/products-client');

      const response = await ProductsClientService.getProducts(
        filters,
        pagination.page,
        pagination.limit
      );

      setProducts(response.products);
      setPagination({
        page: response.page,
        limit: response.per_page,
        total: response.total,
        totalPages: response.total_pages,
        hasNext: response.page < response.total_pages,
        hasPrev: response.page > 1,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // Fetch products on mount and filter changes
  useEffect(() => {
    fetchProducts();
  }, [filters, pagination.page]);

  // Handle search
  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery });
    setPagination({ ...pagination, page: 1 });
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: IProductFilters) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  // Handle product comparison
  const handleProductCompare = (product: Product) => {
    if (comparingProducts.find(p => p.id === product.id)) {
      setComparingProducts(comparingProducts.filter(p => p.id !== product.id));
      toast.success(`${product.name} removed from comparison`);
    } else if (comparingProducts.length >= 3) {
      toast.error('You can compare up to 3 products at a time');
    } else {
      setComparingProducts([...comparingProducts, product]);
      toast.success(`${product.name} added to comparison`);
    }
  };

  // Handle product selection (add to cart or navigate)
  const handleProductSelect = (product: Product) => {
    // For now, navigate to order page with product
    router.push(`/order?product=${product.slug}`);
  };

  // Clear comparison
  const handleClearComparison = () => {
    setComparingProducts([]);
    toast.success('Comparison cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Our Products & Services
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choose from our range of connectivity and IT service solutions
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <ProductFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </aside>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing {products.length} of {pagination.total} products
                </p>
                {comparingProducts.length > 0 && (
                  <Badge variant="secondary">
                    Comparing {comparingProducts.length} products
                  </Badge>
                )}
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs
              value={filters.category || 'all'}
              onValueChange={(value) => 
                handleFiltersChange({ 
                  ...filters, 
                  category: value === 'all' ? undefined : value as any 
                })
              }
              className="mb-6"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
                <TabsTrigger value="it_services">IT Services</TabsTrigger>
                <TabsTrigger value="bundle">Bundles</TabsTrigger>
                <TabsTrigger value="add_on">Add-ons</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Product Grid */}
            <ProductGrid
              products={products}
              onProductSelect={handleProductSelect}
              onProductCompare={handleProductCompare}
              comparingProducts={comparingProducts.map(p => p.id)}
              loading={loading}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrev}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <span className="text-muted-foreground">...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNext}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Product Comparison */}
        {comparingProducts.length > 0 && (
          <ProductComparison
            products={comparingProducts}
            onRemove={handleProductCompare}
            onClear={handleClearComparison}
            className="mt-12"
          />
        )}
      </section>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
