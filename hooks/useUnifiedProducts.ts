'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  UnifiedProduct,
  UnifiedProductFilters,
  UnifiedProductSource,
} from '@/lib/types/unified-product';

export interface UseUnifiedProductsResult {
  products: UnifiedProduct[];
  total: number;
  totalPages: number;
  countsBySource: Record<UnifiedProductSource, number>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const EMPTY_COUNTS: Record<UnifiedProductSource, number> = {
  CircleTel: 0,
  'MTN / Arlan': 0,
  Hardware: 0,
};

/**
 * Build the query string for GET /api/admin/products/unified.
 * Pure + exported so it can be unit-tested without a fetch.
 */
export function buildUnifiedQuery(filters: UnifiedProductFilters): string {
  const params = new URLSearchParams();
  if (filters.source) params.set('source', filters.source);
  if (filters.status) params.set('status', filters.status);
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.sortBy) params.set('sort_by', filters.sortBy);
  params.set('page', String(filters.page ?? 1));
  params.set('per_page', String(filters.perPage ?? 20));
  return params.toString();
}

/**
 * Fetch unified products for the console. Plain fetch + useState (no React Query)
 * to match the existing hooks convention; swappable behind this interface later.
 */
export function useUnifiedProducts(filters: UnifiedProductFilters): UseUnifiedProductsResult {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [countsBySource, setCountsBySource] = useState<Record<UnifiedProductSource, number>>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable dependency key so the effect only re-runs when a filter actually changes.
  const queryKey = buildUnifiedQuery(filters);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/unified?${queryKey}`, { signal });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to load products');
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setCountsBySource(data.countsBySource ?? EMPTY_COUNTS);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
    // queryKey captures all filter inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  return {
    products,
    total,
    totalPages,
    countsBySource,
    loading,
    error,
    refetch: () => fetchProducts(),
  };
}
