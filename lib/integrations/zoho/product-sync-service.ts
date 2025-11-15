import { createClient } from '@/lib/supabase/server';
import { createZohoAuthService } from './auth-service';
import type { Product as ServicePackage } from '@/lib/types/products';

export interface ZohoProductSyncResult {
  success: boolean;
  zohoProductId?: string;
  error?: string;
}

const ZOHO_CRM_BASE_URL = 'https://www.zohoapis.com/crm/v2';

/**
 * Build Zoho CRM Product payload from a service_packages row.
 * Maps core identity, pricing, classification and lifecycle fields
 * according to PRODUCT_CATALOGUE_ZOHO_FIELD_MAPPING.md.
 */
function buildZohoProductPayload(servicePackage: ServicePackage): Record<string, unknown> {
  const basePrice = parseFloat(servicePackage.base_price_zar ?? '0');
  const unitPrice = Number.isFinite(basePrice) ? basePrice : 0;

  const setupFromPricing = servicePackage.pricing?.setup ?? 0;
  const setupFromCost = parseFloat(servicePackage.cost_price_zar ?? '0') || 0;
  const installationFee = setupFromPricing || setupFromCost;

  const metadata: Record<string, any> = (servicePackage.metadata || {}) as Record<string, any>;
  const contractMonths = metadata.contract_months ?? null;

  const downloadSpeed = servicePackage.speed_down ?? servicePackage.download_speed ?? null;
  const uploadSpeed = servicePackage.speed_up ?? servicePackage.upload_speed ?? null;

  return {
    // Identity & classification
    Product_Name: servicePackage.name,
    Product_Code: servicePackage.sku,
    Description: servicePackage.description ?? null,
    Product_Category: servicePackage.category ?? null,

    ct_product_id: servicePackage.source_admin_product_id ?? null,
    ct_service_package_id: servicePackage.id,
    ct_service_type: servicePackage.service_type ?? null,
    ct_market_segment: servicePackage.market_segment ?? null,
    ct_provider: servicePackage.provider ?? null,

    // Pricing
    Unit_Price: unitPrice,
    ct_installation_fee: installationFee,

    // Technical characteristics
    ct_download_speed_mbps: downloadSpeed,
    ct_upload_speed_mbps: uploadSpeed,
    ct_contract_term_months: contractMonths,

    // Lifecycle
    Product_Active: servicePackage.status === 'active',
    ct_valid_from: servicePackage.valid_from ?? null,
    ct_valid_to: servicePackage.valid_to ?? null,
  };
}

async function upsertProductIntegrationRow(params: {
  adminProductId: string | null;
  servicePackageId: string;
  zohoProductId: string | null;
  status: 'pending' | 'ok' | 'failed';
  error?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('product_integrations')
    .upsert(
      {
        admin_product_id: params.adminProductId,
        service_package_id: params.servicePackageId,
        zoho_crm_product_id: params.zohoProductId,
        sync_status: params.status,
        last_synced_at: now,
        last_sync_error: params.error ?? null,
      },
      {
        onConflict: 'service_package_id',
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error('[ZohoProductSync] Failed to upsert product_integrations row:', error);
  }
}

async function upsertZohoCRMProduct(
  accessToken: string,
  servicePackage: ServicePackage
): Promise<string> {
  const payload = buildZohoProductPayload(servicePackage);

  // Strategy: we treat SKU as the primary business key in Zoho (Product_Code).
  // For the first slice we always create or update based on Product_Code search.
  const sku = servicePackage.sku;

  // If we have a SKU, try to find an existing Product in Zoho to avoid duplicates.
  let existingId: string | null = null;

  if (sku) {
    try {
      const criteria = `(Product_Code:equals:${sku})`;
      const searchResponse = await fetch(
        `${ZOHO_CRM_BASE_URL}/Products/search?criteria=${encodeURIComponent(criteria)}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData: any = await searchResponse.json();
        if (Array.isArray(searchData.data) && searchData.data.length > 0) {
          existingId = searchData.data[0].id as string;
        }
      }
    } catch (error) {
      console.warn('[ZohoProductSync] Zoho product search failed, will attempt create:', error);
    }
  }

  if (existingId) {
    // Update existing Product
    const response = await fetch(`${ZOHO_CRM_BASE_URL}/Products/${existingId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [payload] }),
    });

    if (!response.ok) {
      throw new Error(`Zoho CRM Products update failed: ${response.status} ${response.statusText}`);
    }

    const result: any = await response.json();
    const first = result?.data?.[0];
    if (!first || first.code !== 'SUCCESS') {
      throw new Error(`Zoho CRM Products update error: ${first?.message ?? 'Unknown error'}`);
    }

    return existingId;
  }

  // Create new Product
  const createResponse = await fetch(`${ZOHO_CRM_BASE_URL}/Products`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [payload] }),
  });

  if (!createResponse.ok) {
    throw new Error(`Zoho CRM Products create failed: ${createResponse.status} ${createResponse.statusText}`);
  }

  const createResult: any = await createResponse.json();
  const first = createResult?.data?.[0];
  if (!first || first.code !== 'SUCCESS' || !first.details?.id) {
    throw new Error(`Zoho CRM Products create error: ${first?.message ?? 'Unknown error'}`);
  }

  return first.details.id as string;
}

/**
 * Sync a single service_packages row to Zoho CRM Product module.
 *
 * - Uses SKU (Product_Code) as the business key in Zoho.
 * - On success, upserts into product_integrations with sync_status='ok'.
 * - On failure, records sync_status='failed' and last_sync_error.
 * - Never throws to callers: returns a ZohoProductSyncResult instead.
 */
export async function syncServicePackageToZohoCRM(
  servicePackage: ServicePackage
): Promise<ZohoProductSyncResult> {
  const adminProductId = servicePackage.source_admin_product_id ?? null;

  try {
    const auth = createZohoAuthService();
    let accessToken = await auth.getAccessToken();

    let zohoProductId: string;

    try {
      zohoProductId = await upsertZohoCRMProduct(accessToken, servicePackage);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('401')) {
        console.warn(
          '[ZohoProductSync] Received 401 from Zoho CRM, forcing token refresh and retrying once'
        );
        accessToken = await auth.forceRefresh();
        zohoProductId = await upsertZohoCRMProduct(accessToken, servicePackage);
      } else {
        throw error;
      }
    }

    await upsertProductIntegrationRow({
      adminProductId,
      servicePackageId: servicePackage.id,
      zohoProductId,
      status: 'ok',
      error: null,
    });

    return {
      success: true,
      zohoProductId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error during Zoho CRM sync';

    console.error('[ZohoProductSync] Failed to sync service package to Zoho CRM:', error);

    try {
      await upsertProductIntegrationRow({
        adminProductId,
        servicePackageId: servicePackage.id,
        zohoProductId: null,
        status: 'failed',
        error: message,
      });
    } catch (dbError) {
      console.error('[ZohoProductSync] Additionally failed to record sync failure in product_integrations:', dbError);
    }

    return {
      success: false,
      error: message,
    };
  }
}
