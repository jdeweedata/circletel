'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types/products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  XCircle,
  Star,
  Archive,
  FileText,
  Wifi,
  Monitor,
  Settings,
  Box,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'price' | 'updated_at' | 'status';
type SortOrder = 'asc' | 'desc';

// Category icons and colors
const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  connectivity: { icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-100' },
  hardware: { icon: Monitor, color: 'text-purple-600', bg: 'bg-purple-100' },
  software: { icon: Settings, color: 'text-green-600', bg: 'bg-green-100' },
  services: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100' },
  bundles: { icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-100' },
};

export default function AdminProductsV2() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  // Calculate stats from all products
  const stats = useMemo(() => {
    return {
      total: allProducts.length,
      active: allProducts.filter(p => p.is_active && p.status === 'active').length,
      draft: allProducts.filter(p => p.status === 'draft').length,
      archived: allProducts.filter(p => p.status === 'archived').length,
      featured: allProducts.filter(p => p.is_featured).length,
    };
  }, [allProducts]);

  useEffect(() => {
    fetchProducts();
  }, [search, activeFilter, sortField, sortOrder, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: `${sortField}:${sortOrder}`,
      });

      if (search) params.append('search', search);

      // Map filter to API params
      if (activeFilter === 'active') {
        params.append('status', 'active');
      } else if (activeFilter === 'draft') {
        params.append('status', 'draft');
      } else if (activeFilter === 'archived') {
        params.append('status', 'archived');
      } else if (activeFilter === 'featured') {
        params.append('is_featured', 'true');
      }

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.products);
        setTotalPages(data.data.total_pages);

        // Fetch all products for stats (only on first load)
        if (allProducts.length === 0) {
          const allRes = await fetch('/api/admin/products?per_page=1000');
          const allData = await allRes.json();
          if (allData.success) {
            setAllProducts(allData.data.products);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;

    try {
      await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatPrice = (product: Product) => {
    const price = Number(product.base_price_zar) || product.pricing?.monthly || 0;
    return `R${price.toLocaleString()}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getCategoryConfig = (category: string | null) => {
    return categoryConfig[category || ''] || { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    filterKey
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    filterKey: string;
  }) => (
    <Card
      className={cn(
        "shadow-sm cursor-pointer transition-all hover:shadow-md",
        activeFilter === filterKey ? "ring-2 ring-circleTel-orange border-circleTel-orange" : "border-gray-200"
      )}
      onClick={() => {
        setActiveFilter(filterKey === activeFilter ? 'all' : filterKey);
        setPage(1);
      }}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={cn("p-2 rounded-full", color)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your product catalog
              </p>
            </div>
            <Button asChild className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Package}
            color="bg-gray-100 text-gray-600"
            filterKey="all"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
            filterKey="active"
          />
          <StatCard
            label="Draft"
            value={stats.draft}
            icon={FileText}
            color="bg-yellow-100 text-yellow-600"
            filterKey="draft"
          />
          <StatCard
            label="Archived"
            value={stats.archived}
            icon={Archive}
            color="bg-red-100 text-red-600"
            filterKey="archived"
          />
          <StatCard
            label="Featured"
            value={stats.featured}
            icon={Star}
            color="bg-purple-100 text-purple-600"
            filterKey="featured"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-white"
          />
        </div>

        {/* Products List */}
        <Card className="shadow-sm border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-circleTel-orange" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product) => {
                const catConfig = getCategoryConfig(product.category);
                const CategoryIcon = catConfig.icon;

                return (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Category Icon */}
                    <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0", catConfig.bg)}>
                      <CategoryIcon className={cn("h-6 w-6", catConfig.color)} />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-circleTel-orange transition-colors">
                          {product.name}
                        </h3>
                        {product.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="capitalize">{product.category || 'Uncategorized'}</span>
                        {product.sku && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="font-mono text-xs">{product.sku}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right hidden sm:block">
                      <p className="font-bold text-gray-900">{formatPrice(product)}</p>
                      <p className="text-xs text-gray-500">/month</p>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize font-normal flex-shrink-0',
                        product.is_active && product.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : product.status === 'draft'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : product.status === 'archived'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      )}
                    >
                      {product.is_active && product.status === 'active' ? 'Active' : product.status || 'Inactive'}
                    </Badge>

                    {/* Updated Date */}
                    <div className="text-sm text-gray-400 w-16 text-right hidden md:block">
                      {formatDate(product.updated_at)}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(product.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
