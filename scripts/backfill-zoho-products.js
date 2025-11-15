/**
 * Backfill Script: Sync existing service_packages to Zoho CRM
 *
 * Epic 2.4 - Initial backfill of existing offerings to Zoho CRM
 *
 * This script:
 * 1. Fetches all active service_packages from Supabase
 * 2. Syncs each one to Zoho CRM Products
 * 3. Records sync status in product_integrations table
 * 4. Provides detailed progress reporting
 *
 * Usage:
 *   node scripts/backfill-zoho-products.js [options]
 *
 * Options:
 *   --dry-run          Show what would be synced without actually syncing
 *   --limit N          Only process first N products (for testing)
 *   --status STATUS    Only sync products with specific status (default: active)
 *   --force            Re-sync products even if already synced
 */

require('dotenv').config({ path: '.env.local' });

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
  status: args.includes('--status') ? args[args.indexOf('--status') + 1] : 'active',
  force: args.includes('--force'),
};

console.log('='.repeat(70));
console.log('ZOHO CRM PRODUCT BACKFILL SCRIPT');
console.log('='.repeat(70));
console.log();
console.log('Options:', JSON.stringify(options, null, 2));
console.log();

// Supabase setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Zoho setup
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
  console.error('ERROR: Missing Zoho credentials');
  console.error('Required: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN');
  process.exit(1);
}

const ZOHO_CRM_BASE_URL = 'https://www.zohoapis.com/crm/v2';

// Helper: Get Zoho access token
async function getZohoAccessToken() {
  const params = {
    grant_type: 'refresh_token',
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
  };

  // Add redirect_uri if available (required by some OAuth providers)
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  if (redirectUri) {
    params.redirect_uri = redirectUri;
  }

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    throw new Error(`Zoho auth failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Zoho auth error: ${data.error}`);
  }

  return data.access_token;
}

// Helper: Fetch all service_packages from Supabase
async function fetchServicePackages() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/service_packages`);
  url.searchParams.append('select', '*');
  url.searchParams.append('status', `eq.${options.status}`);

  if (options.limit) {
    url.searchParams.append('limit', options.limit.toString());
  }

  url.searchParams.append('order', 'created_at.desc');

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status}`);
  }

  return await response.json();
}

// Helper: Check if product already synced to Zoho
async function checkExistingSync(servicePackageId) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/product_integrations`);
  url.searchParams.append('select', 'zoho_crm_product_id,sync_status,last_synced_at');
  url.searchParams.append('service_package_id', `eq.${servicePackageId}`);
  url.searchParams.append('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data && data.length > 0 ? data[0] : null;
}

// Helper: Build Zoho product payload (same as product-sync-service.ts)
function buildZohoProductPayload(servicePackage) {
  const basePrice = parseFloat(servicePackage.base_price_zar ?? '0');
  const unitPrice = Number.isFinite(basePrice) ? basePrice : 0;

  const setupFromPricing = servicePackage.pricing?.setup ?? 0;
  const setupFromCost = parseFloat(servicePackage.cost_price_zar ?? '0') || 0;
  const installationFee = setupFromPricing || setupFromCost;

  const metadata = servicePackage.metadata || {};
  const contractMonths = metadata.contract_months ?? null;

  const downloadSpeed = servicePackage.speed_down ?? servicePackage.download_speed ?? null;
  const uploadSpeed = servicePackage.speed_up ?? servicePackage.upload_speed ?? null;

  return {
    Product_Name: servicePackage.name,
    Product_Code: servicePackage.sku,
    Description: servicePackage.description ?? null,
    Product_Category: servicePackage.category ?? null,

    ct_product_id: servicePackage.source_admin_product_id ?? null,
    ct_service_package_id: servicePackage.id,
    ct_service_type: servicePackage.service_type ?? null,
    ct_market_segment: servicePackage.market_segment ?? null,
    ct_provider: servicePackage.provider ?? null,

    Unit_Price: unitPrice,
    ct_installation_fee: installationFee,

    ct_download_speed_mbps: downloadSpeed,
    ct_upload_speed_mbps: uploadSpeed,
    ct_contract_term_months: contractMonths,

    Product_Active: servicePackage.status === 'active',
    ct_valid_from: servicePackage.valid_from ?? null,
    ct_valid_to: servicePackage.valid_to ?? null,
  };
}

// Helper: Sync single product to Zoho CRM with retry tracking
async function syncProductToZoho(accessToken, servicePackage) {
  const payload = buildZohoProductPayload(servicePackage);
  const sku = servicePackage.sku;

  // Try to find existing product by SKU
  let existingId = null;
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
        const searchData = await searchResponse.json();
        if (Array.isArray(searchData.data) && searchData.data.length > 0) {
          existingId = searchData.data[0].id;
        }
      }
    } catch (error) {
      console.warn(`  Warning: Product search failed for SKU ${sku}:`, error.message);
    }
  }

  if (existingId) {
    // Update existing product
    const response = await fetch(`${ZOHO_CRM_BASE_URL}/Products/${existingId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [payload] }),
    });

    if (!response.ok) {
      throw new Error(`Zoho update failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const first = result?.data?.[0];
    if (!first || first.code !== 'SUCCESS') {
      throw new Error(`Zoho update error: ${first?.message ?? 'Unknown error'}`);
    }

    return { zohoProductId: existingId, action: 'updated' };
  }

  // Create new product
  const createResponse = await fetch(`${ZOHO_CRM_BASE_URL}/Products`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [payload] }),
  });

  if (!createResponse.ok) {
    throw new Error(`Zoho create failed: ${createResponse.status} ${createResponse.statusText}`);
  }

  const createResult = await createResponse.json();
  const first = createResult?.data?.[0];
  if (!first || first.code !== 'SUCCESS' || !first.details?.id) {
    throw new Error(`Zoho create error: ${first?.message ?? 'Unknown error'}`);
  }

  return { zohoProductId: first.details.id, action: 'created' };
}

// Helper: Record sync result in product_integrations with retry tracking
async function recordSyncResult(servicePackage, zohoProductId, status, error = null) {
  const url = `${SUPABASE_URL}/rest/v1/product_integrations`;
  const now = new Date().toISOString();

  // Calculate next retry timestamp if failed (5 minutes from now)
  let nextRetryAt = null;
  if (status === 'failed') {
    const retry = new Date();
    retry.setMinutes(retry.getMinutes() + 5);
    nextRetryAt = retry.toISOString();
  }

  const payload = {
    admin_product_id: servicePackage.source_admin_product_id,
    service_package_id: servicePackage.id,
    zoho_crm_product_id: zohoProductId,
    sync_status: status,
    last_synced_at: now,
    last_sync_error: error,
    retry_count: status === 'failed' ? 0 : 0,
    next_retry_at: nextRetryAt,
    sync_error_details: error ? {
      message: error,
      timestamp: now,
      attemptNumber: 0,
      payload: {
        productId: servicePackage.id,
        productName: servicePackage.name,
        sku: servicePackage.sku,
      }
    } : null,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.warn(`  Warning: Failed to record sync result: ${response.status}`);
  }
}

// Main backfill function
async function runBackfill() {
  try {
    // Step 1: Fetch all service_packages
    console.log('Step 1: Fetching service_packages from Supabase...');
    const products = await fetchServicePackages();
    console.log(`  Found ${products.length} products with status="${options.status}"`);
    console.log();

    if (products.length === 0) {
      console.log('No products to sync. Exiting.');
      return;
    }

    // Step 2: Get Zoho access token
    if (!options.dryRun) {
      console.log('Step 2: Authenticating with Zoho CRM...');
      var accessToken = await getZohoAccessToken();
      console.log('  ✓ Access token obtained');
      console.log();
    } else {
      console.log('Step 2: [DRY RUN] Skipping Zoho authentication');
      console.log();
    }

    // Step 3: Process each product
    console.log(`Step 3: Processing ${products.length} products...`);
    console.log();

    const results = {
      total: products.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const num = i + 1;
      const sku = product.sku || 'NO-SKU';
      const name = product.name || 'Unnamed Product';

      console.log(`[${num}/${products.length}] ${name} (${sku})`);

      try {
        // Check if already synced (unless --force)
        if (!options.force) {
          const existingSync = await checkExistingSync(product.id);
          if (existingSync && existingSync.zoho_crm_product_id && existingSync.sync_status === 'ok') {
            console.log(`  ⊙ Already synced (Zoho ID: ${existingSync.zoho_crm_product_id})`);
            results.skipped++;
            console.log();
            continue;
          }
        }

        if (options.dryRun) {
          console.log('  [DRY RUN] Would sync to Zoho CRM');
          results.skipped++;
        } else {
          // Sync to Zoho
          const { zohoProductId, action } = await syncProductToZoho(accessToken, product);

          // Record result
          await recordSyncResult(product, zohoProductId, 'ok');

          if (action === 'created') {
            console.log(`  ✓ Created in Zoho (ID: ${zohoProductId})`);
            results.created++;
          } else {
            console.log(`  ✓ Updated in Zoho (ID: ${zohoProductId})`);
            results.updated++;
          }
        }
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        results.failed++;
        results.errors.push({
          product: { id: product.id, sku, name },
          error: error.message,
        });

        if (!options.dryRun) {
          await recordSyncResult(product, null, 'failed', error.message);
        }
      }

      console.log();
    }

    // Step 4: Summary
    console.log('='.repeat(70));
    console.log('BACKFILL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total products processed: ${results.total}`);
    console.log(`✓ Created in Zoho:        ${results.created}`);
    console.log(`✓ Updated in Zoho:        ${results.updated}`);
    console.log(`⊙ Skipped (already OK):   ${results.skipped}`);
    console.log(`✗ Failed:                 ${results.failed}`);
    console.log();

    if (results.errors.length > 0) {
      console.log('ERRORS:');
      results.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.product.name} (${err.product.sku})`);
        console.log(`     ${err.error}`);
      });
      console.log();
    }

    if (options.dryRun) {
      console.log('NOTE: This was a dry run. No changes were made to Zoho CRM.');
      console.log('Run without --dry-run to perform actual sync.');
    }

    console.log('='.repeat(70));

    // Exit with error code if any failures
    if (results.failed > 0 && !options.dryRun) {
      process.exit(1);
    }
  } catch (error) {
    console.error();
    console.error('FATAL ERROR:', error.message);
    console.error();
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the backfill
runBackfill();
