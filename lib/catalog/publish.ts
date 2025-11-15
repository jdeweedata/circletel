import { createClient } from '@/lib/supabase/server';
import type {
  AdminProduct,
  AdminProductContext,
  AdminProductPricing,
  AdminProductFeature,
  AdminProductHardware,
} from '@/lib/types/admin-products';
import type { Product as ServicePackage } from '@/lib/types/products';
import type { AuthenticatedUser } from '@/lib/auth/api-auth';

export interface ServicePackagePayload {
  id?: string;
  source_admin_product_id: string;

  name: string;
  slug: string;
  sku: string | null;
  service_type: string;
  product_category: string | null;

  description: string | null;
  features: string[];

  pricing: {
    monthly: number;
    setup: number;
    download_speed: number;
    upload_speed: number;
    currency?: string;
    vat_inclusive?: boolean;
  };

  base_price_zar: number;
  cost_price_zar: number;
  promotion_price?: number | null;

  speed_down: number;
  speed_up: number;

  metadata: Record<string, unknown>;

  status: 'active' | 'inactive' | 'archived' | 'draft';
  valid_from?: string | null;
  valid_to?: string | null;

  is_featured: boolean;
  is_popular: boolean;
  sort_order: number;

  market_segment?: string | null;
  provider?: string | null;

  logical_key?: string | null;
}

/**
 * Load admin product + related entities needed to publish into service_packages.
 */
export async function getAdminProductContext(
  productId: string,
  _options?: { contractTerm?: number; marketSegment?: string }
): Promise<AdminProductContext> {
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from('admin_products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    throw new Error('Admin product not found');
  }

  const { data: pricingRows, error: pricingError } = await supabase
    .from('admin_product_pricing')
    .select('*')
    .eq('product_id', productId)
    .eq('approval_status', 'approved')
    .order('effective_from', { ascending: false })
    .limit(1);

  if (pricingError) {
    console.error('[publish] Failed to load admin product pricing:', pricingError);
  }

  const pricing: AdminProductPricing | null = pricingRows?.[0] ?? null;

  const { data: featureRows, error: featureError } = await supabase
    .from('admin_product_features')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (featureError) {
    console.error('[publish] Failed to load admin product features:', featureError);
  }

  const { data: hardwareRows, error: hardwareError } = await supabase
    .from('admin_product_hardware')
    .select('*')
    .eq('product_id', productId);

  if (hardwareError) {
    console.error('[publish] Failed to load admin product hardware:', hardwareError);
  }

  const ctx: AdminProductContext = {
    product: product as AdminProduct,
    pricing,
    features: (featureRows || []) as AdminProductFeature[],
    hardware: (hardwareRows || []) as AdminProductHardware[],
  };

  return ctx;
}

/**
 * Validate that an admin product is ready to be published.
 * Returns an array of error messages. Empty array means valid.
 */
export function validateAdminProductForPublish(ctx: AdminProductContext): string[] {
  const errors: string[] = [];

  if (ctx.product.status !== 'approved') {
    errors.push('Product status must be "approved" before publishing.');
  }

  if (!ctx.pricing) {
    errors.push('Approved pricing record is required before publishing.');
  }

  if (!ctx.product.name || ctx.product.name.trim().length === 0) {
    errors.push('Product name is required.');
  }

  if (!ctx.product.service_type) {
    errors.push('Service type is required.');
  }

  if (ctx.product.speed_down <= 0 || ctx.product.speed_up <= 0) {
    errors.push('Download and upload speeds must be greater than 0.');
  }

  if (ctx.pricing && ctx.pricing.price_regular <= 0) {
    errors.push('Regular monthly price must be greater than 0.');
  }

  return errors;
}

/**
 * Map AdminProductContext into a ServicePackagePayload according to catalogue rules.
 */
export function buildServicePackagePayload(
  ctx: AdminProductContext,
  options?: { marketSegment?: string; provider?: string }
): ServicePackagePayload {
  if (!ctx.pricing) {
    throw new Error('Cannot build service package payload without pricing');
  }

  const product = ctx.product;
  const pricing = ctx.pricing;

  const monthly = pricing.price_regular;
  const setup = pricing.installation_fee ?? 0;

  const features: string[] = (ctx.features || []).map((f) => f.feature_name);

  const metadata: Record<string, unknown> = {
    contract_months: Array.isArray(product.contract_terms) && product.contract_terms.length > 0
      ? product.contract_terms[0]
      : undefined,
    contract_terms: product.contract_terms,
    installation_days: undefined,
    hardware: (ctx.hardware || []).map((hw) => ({
      model: hw.hardware_model,
      type: hw.hardware_type,
      is_included: hw.is_included,
      retail_value: hw.retail_value,
      dealer_cost: hw.dealer_cost,
      specifications: hw.specifications,
    })),
  };

  const marketSegment = options?.marketSegment ?? null;
  const provider = options?.provider ?? null;

  const sku = product.slug ?? null; // TODO: introduce explicit SKU on admin_products if needed
  const primaryTerm = Array.isArray(product.contract_terms) && product.contract_terms.length > 0
    ? product.contract_terms[0]
    : null;

  const logicalKey = sku
    ? [sku, primaryTerm ?? 'na', marketSegment ?? 'any'].join(':')
    : null;

  const payload: ServicePackagePayload = {
    source_admin_product_id: product.id,

    name: product.name,
    slug: product.slug,
    sku,
    service_type: product.service_type,
    product_category: product.category,

    description: product.description,
    features,

    pricing: {
      monthly,
      setup,
      download_speed: product.speed_down,
      upload_speed: product.speed_up,
    },

    base_price_zar: monthly,
    cost_price_zar: setup,
    promotion_price: pricing.price_promo ?? null,

    speed_down: product.speed_down,
    speed_up: product.speed_up,

    metadata,

    status: 'active',
    valid_from: pricing.effective_from,
    valid_to: pricing.effective_to,

    is_featured: product.is_featured,
    is_popular: false,
    sort_order: product.sort_order,

    market_segment: marketSegment,
    provider,

    logical_key: logicalKey,
  };

  return payload;
}

/**
 * Insert or update a row in service_packages for the given payload.
 */
export async function upsertServicePackage(
  payload: ServicePackagePayload
): Promise<{ servicePackage: ServicePackage; wasCreated: boolean }> {
  const supabase = await createClient();

  // Determine match condition: prefer logical_key, fallback to source_admin_product_id
  let matchColumn: 'logical_key' | 'source_admin_product_id';
  let matchValue: string;

  if (payload.logical_key) {
    matchColumn = 'logical_key';
    matchValue = payload.logical_key;
  } else {
    matchColumn = 'source_admin_product_id';
    matchValue = payload.source_admin_product_id;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('service_packages')
    .select('id')
    .eq(matchColumn, matchValue)
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  const hasExisting = existingRows && existingRows.length > 0;
  const now = new Date().toISOString();

  const dbPayload: Record<string, unknown> = {
    source_admin_product_id: payload.source_admin_product_id,
    name: payload.name,
    slug: payload.slug,
    sku: payload.sku,
    service_type: payload.service_type,
    product_category: payload.product_category,
    description: payload.description,
    features: payload.features,
    pricing: payload.pricing,
    base_price_zar: payload.base_price_zar,
    cost_price_zar: payload.cost_price_zar,
    promotion_price: payload.promotion_price ?? null,
    speed_down: payload.speed_down,
    speed_up: payload.speed_up,
    metadata: payload.metadata,
    status: payload.status,
    valid_from: payload.valid_from ?? null,
    valid_to: payload.valid_to ?? null,
    is_featured: payload.is_featured,
    is_popular: payload.is_popular,
    sort_order: payload.sort_order,
    market_segment: payload.market_segment ?? null,
    provider: payload.provider ?? null,
    logical_key: payload.logical_key ?? null,
    updated_at: now,
  };

  if (!hasExisting) {
    // Insert new row
    const { data, error } = await supabase
      .from('service_packages')
      .insert({
        ...dbPayload,
        created_at: now,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('Failed to insert service package');
    }

    return { servicePackage: data as ServicePackage, wasCreated: true };
  }

  const existingId = existingRows![0].id as string;

  const { data, error } = await supabase
    .from('service_packages')
    .update(dbPayload)
    .eq('id', existingId)
    .select('*')
    .single();

  if (error || !data) {
    throw error || new Error('Failed to update service package');
  }

  return { servicePackage: data as ServicePackage, wasCreated: false };
}

/**
 * Archive previous versions of the same logical offering so only one stays active.
 */
export async function archivePreviousVersions(
  current: ServicePackage,
  payload: ServicePackagePayload
): Promise<void> {
  const supabase = await createClient();

  if (payload.logical_key) {
    const { error } = await supabase
      .from('service_packages')
      .update({ status: 'archived', active: false })
      .eq('logical_key', payload.logical_key)
      .neq('id', current.id);

    if (error) {
      console.error('[publish] Failed to archive previous versions by logical_key:', error);
    }

    return;
  }

  const { error } = await supabase
    .from('service_packages')
    .update({ status: 'archived', active: false })
    .eq('source_admin_product_id', payload.source_admin_product_id)
    .neq('id', current.id);

  if (error) {
    console.error('[publish] Failed to archive previous versions by source_admin_product_id:', error);
  }
}

/**
 * Update the latest audit log entry for the service package with user attribution.
 * Relies on the trigger in enhance_service_packages.sql to create the row.
 */
export async function logPublishAudit(
  user: AuthenticatedUser,
  servicePackage: ServicePackage,
  changeReason: string = 'Published from admin product catalogue',
  auditMeta?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('service_packages_audit_logs')
      .update({
        changed_by_email: user.email,
        changed_by_name: user.full_name,
        change_reason: changeReason,
        ip_address: auditMeta?.ipAddress ?? null,
        user_agent: auditMeta?.userAgent ?? null,
      })
      .eq('package_id', servicePackage.id)
      .order('changed_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('[publish] Failed to update service_packages_audit_logs with user info:', error);
    }
  } catch (error) {
    console.warn('[publish] Unexpected error while logging publish audit:', error);
  }
}
