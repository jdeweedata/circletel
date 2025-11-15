/**
 * Zoho Billing Sync Service
 *
 * Syncs service_packages to Zoho Billing Plans and Items
 * Creates/updates Plans (recurring monthly charges) and Items (one-time installation/hardware)
 *
 * Epic 3.3 - Extend Publish Pipeline for Billing Sync
 */

import { ZohoBillingClient } from './billing-client';
import type {
  CreatePlanPayload,
  CreateItemPayload,
  CreateProductPayload,
} from './billing-types';

// Import ServicePackage type
interface ServicePackage {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: string | number;
  cost_price_zar?: string | number;
  pricing?: {
    monthly?: number;
    setup?: number;
    download_speed?: number;
    upload_speed?: number;
  };
  service_type?: string;
  product_category?: string;
  market_segment?: string;
  provider?: string;
  speed_down?: number;
  speed_up?: number;
  status: string;
  active?: boolean;
  valid_from?: string;
  valid_to?: string;
  is_featured?: boolean;
  promotion_price?: string | number;
  metadata?: {
    contract_months?: number;
    technology?: string;
    data_limit?: string;
    installation_days?: number;
    hardware?: {
      included?: boolean;
      model?: string;
      sku?: string;
      cost?: number;
    };
    vat_inclusive?: boolean;
  };
}

export interface BillingSyncResult {
  success: boolean;
  productId?: string;
  planId?: string;
  installationItemId?: string;
  hardwareItemId?: string;
  error?: string;
}

/**
 * Remove null/undefined/zero values from an object
 * Zoho Billing API doesn't accept null values in JSON
 * Also remove 0 values for optional numeric fields
 */
function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      // Remove null/undefined
      if (value === null || value === undefined) return false;

      // Remove 0 for optional speed fields (meaningless for mobile/5G packages)
      if ((key === 'cf_download_speed_mbps' || key === 'cf_upload_speed_mbps') && value === 0) {
        return false;
      }

      return true;
    })
  ) as Partial<T>;
}

/**
 * Build Zoho Billing Product payload from CircleTel service_package
 */
function buildProductPayload(servicePackage: ServicePackage): CreateProductPayload {
  return {
    name: servicePackage.name,
    description: servicePackage.description || `${servicePackage.name} - ${servicePackage.service_type || 'Service'}`,
  };
}

/**
 * Build Zoho Billing Plan payload from CircleTel service_package
 */
function buildZohoPlanPayload(servicePackage: ServicePackage, productId: string): CreatePlanPayload {
  // Parse monthly price
  const monthlyPrice = parseFloat(
    servicePackage.promotion_price?.toString() ||
    servicePackage.price?.toString() ||
    servicePackage.pricing?.monthly?.toString() ||
    '0'
  );

  // Parse setup fee (for plan.setup_fee field)
  const setupFee = parseFloat(
    servicePackage.pricing?.setup?.toString() ||
    servicePackage.cost_price_zar?.toString() ||
    '0'
  );

  // Determine billing cycles (contract term)
  // -1 = month-to-month (runs until cancelled)
  // N = specific contract (e.g., 12 = 12-month contract)
  const contractMonths = servicePackage.metadata?.contract_months;
  const billingCycles = contractMonths && contractMonths > 0 ? contractMonths : -1;

  return {
    plan_code: servicePackage.sku,
    name: servicePackage.name,
    description: servicePackage.description || `${servicePackage.name} - Monthly Subscription`,
    product_id: productId,

    // Pricing
    recurring_price: monthlyPrice,
    setup_fee: setupFee > 0 ? setupFee : undefined,
    currency_code: 'ZAR',

    // Billing Cycle
    interval: 1,
    interval_unit: 'months',
    billing_cycles: billingCycles, // -1 = month-to-month, N = specific contract

    // Status
    status: servicePackage.status === 'active' || servicePackage.active ? 'active' : 'inactive',

    // Note: custom_fields removed for MVP - requires pre-defined fields in Zoho Billing
    // Zoho Billing custom_fields are an array of {customfield_id, value} objects
    // We would need to create custom field definitions in Zoho Billing first
    // and then reference them by ID here
  };
}

/**
 * Build Zoho Billing Item payload for installation fee
 */
function buildInstallationItemPayload(servicePackage: ServicePackage): CreateItemPayload {
  const installationFee = parseFloat(
    servicePackage.pricing?.setup?.toString() ||
    servicePackage.cost_price_zar?.toString() ||
    '0'
  );

  return {
    sku: `${servicePackage.sku}-INSTALL`,
    item_name: `${servicePackage.name} - Installation`,
    description: 'One-time installation and activation fee',
    rate: installationFee,
    item_type: 'service',
    unit: 'unit',
    status: servicePackage.status === 'active' || servicePackage.active ? 'active' : 'inactive',
    custom_fields: removeNullValues({
      reference_id: servicePackage.id,
      cf_service_type: servicePackage.service_type,
      cf_tax_inclusive: servicePackage.metadata?.vat_inclusive || false,
    }),
  };
}

/**
 * Build Zoho Billing Item payload for hardware (router, CPE)
 */
function buildHardwareItemPayload(servicePackage: ServicePackage): CreateItemPayload | null {
  if (!servicePackage.metadata?.hardware?.included) {
    return null;
  }

  const hardware = servicePackage.metadata.hardware;

  return {
    sku: hardware.sku || `${servicePackage.sku}-HARDWARE`,
    item_name: hardware.model || `${servicePackage.name} - Hardware`,
    description: `Hardware included with ${servicePackage.name}`,
    rate: hardware.cost || 0,
    item_type: 'goods', // Physical product
    unit: 'unit',
    status: servicePackage.status === 'active' || servicePackage.active ? 'active' : 'inactive',
    custom_fields: removeNullValues({
      reference_id: servicePackage.id,
      cf_service_type: servicePackage.service_type,
    }),
  };
}

/**
 * Sync a service_package to Zoho Billing
 * Creates/updates Plan (recurring) and Items (one-time)
 */
export async function syncServicePackageToZohoBilling(
  servicePackage: ServicePackage
): Promise<BillingSyncResult> {
  const client = new ZohoBillingClient();

  try {
    console.log('[BillingSync] Syncing service_package to Zoho Billing:', {
      id: servicePackage.id,
      sku: servicePackage.sku,
      name: servicePackage.name,
    });

    // 1. Sync Product (required for Plan creation)
    const productPayload = buildProductPayload(servicePackage);
    const productId = await client.upsertProduct(servicePackage.name, productPayload);

    console.log('[BillingSync] Product synced:', {
      product_id: productId,
      name: servicePackage.name,
    });

    // 2. Sync Plan (recurring monthly subscription)
    const planPayload = buildZohoPlanPayload(servicePackage, productId);
    const planId = await client.upsertPlan(servicePackage.sku, planPayload);

    console.log('[BillingSync] Plan synced:', {
      plan_id: planId,
      plan_code: servicePackage.sku,
      recurring_price: planPayload.recurring_price,
    });

    // 3. Sync Installation Item (one-time fee)
    const installationPayload = buildInstallationItemPayload(servicePackage);
    const installationItemId = await client.upsertItem(
      installationPayload.sku!,
      installationPayload
    );

    console.log('[BillingSync] Installation item synced:', {
      item_id: installationItemId,
      sku: installationPayload.sku,
      rate: installationPayload.rate,
    });

    // 4. Sync Hardware Item (if applicable)
    let hardwareItemId: string | undefined;
    const hardwarePayload = buildHardwareItemPayload(servicePackage);

    if (hardwarePayload) {
      hardwareItemId = await client.upsertItem(hardwarePayload.sku!, hardwarePayload);

      console.log('[BillingSync] Hardware item synced:', {
        item_id: hardwareItemId,
        sku: hardwarePayload.sku,
        rate: hardwarePayload.rate,
      });
    }

    return {
      success: true,
      productId,
      planId,
      installationItemId,
      hardwareItemId,
    };
  } catch (error) {
    console.error('[BillingSync] Error syncing to Zoho Billing:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get sync status for a service_package
 * Checks if Plan and Items exist in Zoho Billing
 */
export async function getBillingSyncStatus(servicePackage: ServicePackage): Promise<{
  planExists: boolean;
  planId?: string;
  installationItemExists: boolean;
  installationItemId?: string;
  hardwareItemExists: boolean;
  hardwareItemId?: string;
}> {
  const client = new ZohoBillingClient();

  try {
    // Check Plan
    const plan = await client.searchPlans(servicePackage.sku);

    // Check Installation Item
    const installationSku = `${servicePackage.sku}-INSTALL`;
    const installationItem = await client.searchItems(installationSku);

    // Check Hardware Item (if applicable)
    let hardwareItem = null;
    if (servicePackage.metadata?.hardware?.included && servicePackage.metadata.hardware.sku) {
      hardwareItem = await client.searchItems(servicePackage.metadata.hardware.sku);
    }

    return {
      planExists: !!plan,
      planId: plan?.plan_id,
      installationItemExists: !!installationItem,
      installationItemId: installationItem?.item_id,
      hardwareItemExists: !!hardwareItem,
      hardwareItemId: hardwareItem?.item_id,
    };
  } catch (error) {
    console.error('[BillingSync] Error checking sync status:', error);
    throw error;
  }
}
