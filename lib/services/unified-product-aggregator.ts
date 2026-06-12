/**
 * UnifiedProductAggregator — read-only service that normalises the four product
 * source tables into a single list for the admin unified console.
 *
 * Design notes:
 *  - Filtering, search and counts are pushed DOWN to each source table so we
 *    never load large tables (mtn_dealer_products has ~25k rows) into memory.
 *  - For an "all sources" query we fetch only `offset + perPage` rows per source
 *    (ordered by updated_at desc), merge, globally sort, then slice — so the
 *    default (updated_desc) pagination is globally correct without a SQL view.
 *  - Price/margin sorting is applied across the fetched window (best-effort for
 *    multi-source); a SQL view can make it exact in a later phase.
 *
 * Read-only: this service never writes to any table.
 */

import { createClient } from '@/lib/supabase/server';
import type { AdminProduct, AdminProductPricing } from '@/lib/types/admin-products';
import type { Product as ServicePackage } from '@/lib/types/products';
import type { MTNDealerProduct } from '@/lib/types/mtn-dealer-products';
import type { CircleTelHardwareProduct } from '@/lib/hardware-catalogue/types';
import {
  normalizeAdminProductToUnified,
  normalizeServicePackageToUnified,
  normalizeMTNDealToUnified,
  normalizeHardwareToUnified,
  SOURCE_TO_TABLES,
  type UnifiedProduct,
  type UnifiedProductFilters,
  type UnifiedProductListResult,
  type UnifiedProductSource,
  type UnifiedProductSourceTable,
  type UnifiedProductStatus,
} from '@/lib/types/unified-product';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ALL_TABLES: UnifiedProductSourceTable[] = [
  'service_packages',
  'admin_products',
  'mtn_dealer_products',
  'circletel_hardware_products',
];

const TABLE_TO_SOURCE: Record<UnifiedProductSourceTable, UnifiedProductSource> = {
  service_packages: 'CircleTel',
  admin_products: 'CircleTel',
  mtn_dealer_products: 'MTN / Arlan',
  circletel_hardware_products: 'Hardware',
};

/** Columns used for free-text search, per table. */
const SEARCH_COLUMNS: Record<UnifiedProductSourceTable, string[]> = {
  service_packages: ['name', 'description', 'slug'],
  admin_products: ['name', 'description', 'slug'],
  mtn_dealer_products: ['price_plan', 'package_description', 'deal_id'],
  circletel_hardware_products: ['name', 'description', 'slug'],
};

export class UnifiedProductAggregator {
  /**
   * List unified products across the requested source(s), with DB-level
   * filtering/search/counts and globally-sorted pagination.
   */
  async aggregateAll(filters: UnifiedProductFilters = {}): Promise<UnifiedProductListResult> {
    const supabase = await createClient();

    const page = Math.max(1, filters.page ?? 1);
    const perPage = Math.min(100, Math.max(1, filters.perPage ?? 20));
    const sortBy = filters.sortBy ?? 'updated_desc';
    const offset = (page - 1) * perPage;
    const windowSize = offset + perPage; // enough rows per source to satisfy this page after merge

    const tables = filters.source ? SOURCE_TO_TABLES[filters.source] : ALL_TABLES;

    const countsBySource: Record<UnifiedProductSource, number> = {
      CircleTel: 0,
      'MTN / Arlan': 0,
      Hardware: 0,
    };

    const windows = await Promise.all(
      tables.map((table) =>
        this.fetchTableWindow(supabase, table, {
          status: filters.status,
          search: filters.search,
          windowSize,
        })
      )
    );

    let merged: UnifiedProduct[] = [];
    let total = 0;

    windows.forEach(({ table, rows, count }) => {
      countsBySource[TABLE_TO_SOURCE[table]] += count;
      total += count;
      merged = merged.concat(rows);
    });

    sortUnified(merged, sortBy);
    const products = merged.slice(offset, offset + perPage);

    return {
      products,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      countsBySource,
    };
  }

  /**
   * Fetch a single unified product by its composite uid (`${table}:${id}`).
   * Returns null when not found.
   */
  async aggregateOne(uid: string): Promise<UnifiedProduct | null> {
    const sep = uid.indexOf(':');
    if (sep === -1) return null;
    const table = uid.slice(0, sep) as UnifiedProductSourceTable;
    const id = uid.slice(sep + 1);
    if (!ALL_TABLES.includes(table) || !id) return null;

    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;

    if (table === 'admin_products') {
      const pricing = await this.fetchLatestApprovedPricing(supabase, [id]);
      const costs = await this.fetchProductCosts(supabase, [id]);
      return normalizeAdminProductToUnified(data as AdminProduct, pricing.get(id) ?? null, costs.get(id));
    }
    return this.normalizeRow(table, data);
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async fetchTableWindow(
    supabase: SupabaseServerClient,
    table: UnifiedProductSourceTable,
    opts: { status?: UnifiedProductStatus; search?: string; windowSize: number }
  ): Promise<{ table: UnifiedProductSourceTable; rows: UnifiedProduct[]; count: number }> {
    // Count query (head only — no rows transferred).
    let countQuery = supabase.from(table).select('id', { count: 'exact', head: true });
    countQuery = applyStatusFilter(countQuery, table, opts.status);
    countQuery = applySearchFilter(countQuery, table, opts.search);
    const { count, error: countError } = await countQuery;
    if (countError) {
      throw new Error(`[unified] count failed for ${table}: ${countError.message}`);
    }

    // Windowed data query.
    let dataQuery = supabase.from(table).select('*');
    dataQuery = applyStatusFilter(dataQuery, table, opts.status);
    dataQuery = applySearchFilter(dataQuery, table, opts.search);
    const { data, error: dataError } = await dataQuery
      .order('updated_at', { ascending: false })
      .range(0, Math.max(0, opts.windowSize - 1));
    if (dataError) {
      throw new Error(`[unified] fetch failed for ${table}: ${dataError.message}`);
    }

    const rawRows = (data ?? []) as Record<string, unknown>[];

    let rows: UnifiedProduct[];
    if (table === 'admin_products') {
      const ids = rawRows.map((r) => String(r.id));
      const pricing = await this.fetchLatestApprovedPricing(supabase, ids);
      const costs = await this.fetchProductCosts(supabase, ids);
      rows = rawRows.map((r) =>
        normalizeAdminProductToUnified(
          r as unknown as AdminProduct,
          pricing.get(String(r.id)) ?? null,
          costs.get(String(r.id))
        )
      );
    } else {
      rows = rawRows.map((r) => this.normalizeRow(table, r));
    }

    return { table, rows, count: count ?? 0 };
  }

  private normalizeRow(
    table: Exclude<UnifiedProductSourceTable, 'admin_products'>,
    row: Record<string, unknown>
  ): UnifiedProduct {
    switch (table) {
      case 'service_packages':
        return normalizeServicePackageToUnified(row as unknown as ServicePackage);
      case 'mtn_dealer_products':
        return normalizeMTNDealToUnified(row as unknown as MTNDealerProduct);
      case 'circletel_hardware_products':
        return normalizeHardwareToUnified(row as unknown as CircleTelHardwareProduct);
    }
  }

  /** Batch-load the latest approved pricing row per admin product id. */
  private async fetchLatestApprovedPricing(
    supabase: SupabaseServerClient,
    productIds: string[]
  ): Promise<Map<string, AdminProductPricing>> {
    const map = new Map<string, AdminProductPricing>();
    if (productIds.length === 0) return map;

    const { data, error } = await supabase
      .from('admin_product_pricing')
      .select('*')
      .in('product_id', productIds)
      .eq('approval_status', 'approved')
      .order('effective_from', { ascending: false });

    if (error || !data) return map;

    // First row per product_id wins (already ordered newest-first).
    for (const row of data as AdminProductPricing[]) {
      if (!map.has(row.product_id)) map.set(row.product_id, row);
    }
    return map;
  }

  /** Batch-load and sum cost components per admin product id. */
  private async fetchProductCosts(
    supabase: SupabaseServerClient,
    productIds: string[]
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (productIds.length === 0) return map;

    // Cost components are linked via package_id to service_packages.
    // We query by treating the admin_product.id as a potential package_id
    // (as done in the cost-components API route).
    const { data, error } = await supabase
      .from('product_cost_components')
      .select('package_id, cost_amount')
      .in('package_id', productIds);

    if (error || !data) return map;

    // Sum cost_amount per product_id
    for (const row of data as Array<{ package_id: string; cost_amount: number | string | null }>) {
      const productId = row.package_id;
      const amount = (typeof row.cost_amount === 'string' ? Number(row.cost_amount) : row.cost_amount) || 0;
      map.set(productId, (map.get(productId) ?? 0) + amount);
    }
    return map;
  }
}

// ---------------------------------------------------------------------------
// Query-builder filter helpers (kept outside the class for reuse/testing)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

function applyStatusFilter(query: any, table: UnifiedProductSourceTable, status?: UnifiedProductStatus): any {
  if (!status) return query;

  switch (table) {
    case 'service_packages':
      if (status === 'active') return query.eq('active', true);
      if (status === 'inactive') return query.eq('active', false);
      if (status === 'draft' || status === 'archived') return query.eq('status', status);
      return query; // no 'pending' on service_packages
    case 'admin_products':
      if (status === 'active') return query.eq('status', 'approved');
      if (status === 'draft' || status === 'pending' || status === 'archived') return query.eq('status', status);
      return query; // no 'inactive' on admin_products
    case 'mtn_dealer_products':
      if (status === 'active' || status === 'draft' || status === 'inactive' || status === 'archived') {
        return query.eq('status', status);
      }
      return query; // no 'pending'
    case 'circletel_hardware_products':
      if (status === 'active') return query.eq('status', 'published');
      if (status === 'draft' || status === 'archived') return query.eq('status', status);
      return query;
    default:
      return query;
  }
}

function applySearchFilter(query: any, table: UnifiedProductSourceTable, search?: string): any {
  const term = search?.trim();
  if (!term) return query;
  // Escape commas/parens which are significant in PostgREST `or` syntax.
  const safe = term.replace(/[,()]/g, ' ');
  const clause = SEARCH_COLUMNS[table].map((col) => `${col}.ilike.%${safe}%`).join(',');
  return query.or(clause);
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function sortUnified(rows: UnifiedProduct[], sortBy: NonNullable<UnifiedProductFilters['sortBy']>): void {
  const cmp: Record<typeof sortBy, (a: UnifiedProduct, b: UnifiedProduct) => number> = {
    updated_desc: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
    created_desc: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    name_asc: (a, b) => a.name.localeCompare(b.name),
    price_desc: (a, b) => b.price - a.price,
    price_asc: (a, b) => a.price - b.price,
  };
  rows.sort(cmp[sortBy]);
}

/** Shared singleton for convenience. */
export const unifiedProductAggregator = new UnifiedProductAggregator();
