/**
 * Unified Product model — read-only aggregation layer.
 *
 * Normalises the four product source tables into one shape so the admin
 * "unified console" can show CircleTel services, MTN/Arlan deals, and hardware
 * together. This is a READ model only — it never writes back to any table.
 *
 * Source tables (verified against the live schema):
 *  - admin_products              → editorial/approval source (price via admin_product_pricing)
 *  - service_packages            → canonical published consumer catalogue
 *  - mtn_dealer_products         → Arlan MTN reseller deals (~25k rows)
 *  - circletel_hardware_products → curated hardware catalogue
 */

import type { AdminProduct, AdminProductPricing } from './admin-products';
import type { Product as ServicePackage } from './products';
import type { MTNDealerProduct } from './mtn-dealer-products';
import type { CircleTelHardwareProduct } from '@/lib/hardware-catalogue/types';

export type UnifiedProductSourceTable =
  | 'admin_products'
  | 'service_packages'
  | 'mtn_dealer_products'
  | 'circletel_hardware_products';

/** Display grouping shown as a source chip in the console. */
export type UnifiedProductSource = 'CircleTel' | 'MTN / Arlan' | 'Hardware';

/** Normalised lifecycle status across all sources. */
export type UnifiedProductStatus =
  | 'active'
  | 'draft'
  | 'pending'
  | 'archived'
  | 'inactive';

export interface UnifiedProduct {
  /** Stable unique key across tables: `${sourceTable}:${id}`. */
  uid: string;
  /** Raw row id within its own table. */
  id: string;
  sourceTable: UnifiedProductSourceTable;
  source: UnifiedProductSource;

  name: string;
  sku: string | null;
  /** Display category (e.g. "Connectivity", "Mobile & IoT", "Hardware"). */
  category: string;
  /** Original category value from the source row, when present. */
  rawCategory: string | null;
  /** Product type label (e.g. "Service", "MTN Deal", "Hardware"). */
  type: string;

  status: UnifiedProductStatus;
  /** Original status string from the source row. */
  rawStatus: string;

  /** Retail monthly price (ZAR). 0 when unknown (e.g. admin product without pricing). */
  price: number;
  /** Cost of sale (ZAR). 0 when not tracked on the source. */
  cost: number;
  /** Contribution margin %, rounded. 0 when price is 0 or cost is unknown. */
  margin: number;

  description: string | null;
  /** Where this product publishes to, if it is an editorial/source row. */
  publishTarget: UnifiedProductSourceTable | null;
  isPublished: boolean;

  technology: string | null;
  tags: string[];
  channels: string[];
  isFeatured: boolean;

  createdAt: string | null;
  updatedAt: string | null;

  /** Original row, for detail views. */
  raw: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Coerce Supabase numeric/decimal (number | string | null) to a finite number. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Contribution margin %, rounded. Returns 0 when price is non-positive. */
export function computeMarginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 100);
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Per-source normalisers
// ---------------------------------------------------------------------------

/**
 * admin_products — editorial source. Price comes from the latest approved
 * admin_product_pricing row (passed in separately); cost is not tracked here.
 */
export function normalizeAdminProductToUnified(
  row: AdminProduct,
  pricing?: AdminProductPricing | null
): UnifiedProduct {
  const price = toNumber(pricing?.price_regular);
  const statusMap: Record<string, UnifiedProductStatus> = {
    draft: 'draft',
    pending: 'pending',
    approved: 'active',
    archived: 'archived',
  };
  return {
    uid: `admin_products:${row.id}`,
    id: row.id,
    sourceTable: 'admin_products',
    source: 'CircleTel',
    name: row.name,
    sku: row.slug ?? null,
    category: 'Connectivity',
    rawCategory: row.category ?? null,
    type: 'Service',
    status: statusMap[row.status] ?? 'draft',
    rawStatus: row.status,
    price,
    cost: 0,
    margin: 0, // cost not tracked on admin_products
    description: row.description,
    publishTarget: 'service_packages',
    isPublished: false,
    technology: row.service_type ?? null,
    tags: compact([
      row.service_type,
      row.speed_down ? `${row.speed_down}/${row.speed_up} Mbps` : null,
    ]),
    channels: [],
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    raw: row as unknown as Record<string, unknown>,
  };
}

/** service_packages — canonical published catalogue. */
export function normalizeServicePackageToUnified(row: ServicePackage): UnifiedProduct {
  const price = toNumber(row.base_price_zar) || toNumber(row.price);
  const cost = toNumber(row.cost_price_zar);
  const active = (row as { active?: boolean }).active;
  const rawStatus = row.status ?? (active ? 'active' : 'inactive');
  const statusMap: Record<string, UnifiedProductStatus> = {
    active: 'active',
    inactive: 'inactive',
    draft: 'draft',
    archived: 'archived',
  };
  return {
    uid: `service_packages:${row.id}`,
    id: row.id,
    sourceTable: 'service_packages',
    source: 'CircleTel',
    name: row.name,
    sku: row.sku ?? row.slug ?? null,
    category: (row as { product_category?: string }).product_category || 'Connectivity',
    rawCategory: (row as { product_category?: string }).product_category ?? null,
    type: Array.isArray(row.bundle_components) && row.bundle_components.length > 0 ? 'Bundle' : 'Service',
    status: statusMap[rawStatus] ?? 'active',
    rawStatus,
    price,
    cost,
    margin: computeMarginPct(price, cost),
    description: row.description,
    publishTarget: null,
    isPublished: active === true || rawStatus === 'active',
    technology: row.service_type ?? null,
    tags: compact([row.service_type]),
    channels: ['Public'],
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    raw: row as unknown as Record<string, unknown>,
  };
}

/** mtn_dealer_products — Arlan MTN reseller deals. */
export function normalizeMTNDealToUnified(row: MTNDealerProduct): UnifiedProduct {
  const price = toNumber(row.selling_price_incl_vat) || toNumber(row.mtn_price_incl_vat);
  const cost = toNumber(row.mtn_price_incl_vat);
  const statusMap: Record<string, UnifiedProductStatus> = {
    active: 'active',
    draft: 'draft',
    inactive: 'inactive',
    archived: 'archived',
  };
  return {
    uid: `mtn_dealer_products:${row.id}`,
    id: row.id,
    sourceTable: 'mtn_dealer_products',
    source: 'MTN / Arlan',
    name: row.price_plan,
    sku: row.deal_id ?? null,
    category: 'Mobile & IoT',
    rawCategory: row.business_use_case ?? null,
    type: 'MTN Deal',
    status: statusMap[row.status] ?? 'draft',
    rawStatus: row.status,
    price,
    cost,
    margin: computeMarginPct(price, cost),
    description: row.package_description ?? row.tariff_description ?? null,
    publishTarget: null,
    isPublished: row.status === 'active' && Boolean(row.is_visible_on_frontend),
    technology: row.technology ?? null,
    tags: compact([row.technology, row.contract_term_label, row.data_bundle, row.device_name]),
    channels: compact([
      row.available_on_helios ? 'Helios' : null,
      row.available_on_ilula ? 'iLula' : null,
    ]),
    isFeatured: row.curation_status === 'featured',
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    raw: row as unknown as Record<string, unknown>,
  };
}

/** circletel_hardware_products — curated hardware catalogue. */
export function normalizeHardwareToUnified(row: CircleTelHardwareProduct): UnifiedProduct {
  const price = toNumber(row.retail_price);
  const cost = toNumber(row.cost_price);
  const statusMap: Record<string, UnifiedProductStatus> = {
    published: 'active',
    draft: 'draft',
    archived: 'archived',
  };
  return {
    uid: `circletel_hardware_products:${row.id}`,
    id: row.id,
    sourceTable: 'circletel_hardware_products',
    source: 'Hardware',
    name: row.name,
    sku: row.slug ?? null,
    category: 'Hardware',
    rawCategory: row.category ?? null,
    type: 'Hardware',
    status: statusMap[row.status] ?? 'draft',
    rawStatus: row.status,
    price,
    cost,
    margin: computeMarginPct(price, cost),
    description: row.description,
    publishTarget: null,
    isPublished: row.status === 'published',
    technology: null,
    tags: compact([row.category, row.primary_supplier_code]),
    channels: ['Public'],
    isFeatured: Boolean(row.is_featured),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    raw: row as unknown as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// Query / response contracts
// ---------------------------------------------------------------------------

export interface UnifiedProductFilters {
  /** Restrict to a single display source. Omit for all sources. */
  source?: UnifiedProductSource;
  status?: UnifiedProductStatus;
  /** Free-text search across name / sku / description. */
  search?: string;
  sortBy?: 'updated_desc' | 'created_desc' | 'name_asc' | 'price_desc' | 'price_asc';
  page?: number;
  perPage?: number;
}

export interface UnifiedProductListResult {
  products: UnifiedProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  /** Row counts per source (after filters), for the console's source pills. */
  countsBySource: Record<UnifiedProductSource, number>;
}

/** Map a display source to the table(s) it reads from. */
export const SOURCE_TO_TABLES: Record<UnifiedProductSource, UnifiedProductSourceTable[]> = {
  CircleTel: ['service_packages', 'admin_products'],
  'MTN / Arlan': ['mtn_dealer_products'],
  Hardware: ['circletel_hardware_products'],
};
