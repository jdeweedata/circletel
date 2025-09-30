'use client';

import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types/products';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  onProductSelect?: (product: Product) => void;
  onProductCompare?: (product: Product) => void;
  comparingProducts?: string[];
  className?: string;
  loading?: boolean;
}

export function ProductGrid({
  products,
  onProductSelect,
  onProductCompare,
  comparingProducts = [],
  className,
  loading = false
}: ProductGridProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-96"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onProductSelect}
          onCompare={onProductCompare}
          isComparing={comparingProducts.includes(product.id)}
        />
      ))}
    </div>
  );
}
