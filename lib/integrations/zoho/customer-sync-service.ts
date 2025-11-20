/**
 * ZOHO Billing Customer Sync Service
 *
 * Syncs CircleTel customers to ZOHO Billing as Contacts
 * Uses async "Supabase-First" pattern with retry logic
 *
 * @see docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md
 */

import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from './billing-client';
import { logZohoSync } from './billing-sync-logger';

export interface CustomerSyncResult {
  success: boolean;
  zoho_customer_id?: string;
  error?: string;
}

/**
 * Sync a CircleTel customer to ZOHO Billing
 *
 * @param customer_id - CircleTel customer UUID
 * @returns Sync result with ZOHO customer ID or error
 */
export async function syncCustomerToZohoBilling(
  customer_id: string
): Promise<CustomerSyncResult> {
  const supabase = await createClient();

  try {
    console.log('[CustomerSync] Starting sync for customer:', customer_id);

    // Update sync status to 'syncing'
    await supabase
      .from('customers')
      .update({ zoho_sync_status: 'syncing' })
      .eq('id', customer_id);

    // Get customer data from Supabase
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (fetchError || !customer) {
      throw new Error(`Customer not found: ${customer_id}`);
    }

    // Check if already synced
    if (customer.zoho_billing_customer_id) {
      console.log('[CustomerSync] Customer already synced:', customer.zoho_billing_customer_id);
      return {
        success: true,
        zoho_customer_id: customer.zoho_billing_customer_id
      };
    }

    // Build ZOHO Billing customer payload
    const zohoPayload = {
      display_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
      first_name: customer.first_name || undefined,
      last_name: customer.last_name || undefined,
      email: customer.email,
      phone: customer.phone || undefined,
      mobile: customer.phone || undefined,
      company_name: customer.company_name || undefined,

      // Billing address (if available)
      street: customer.billing_address?.street || customer.address?.street || undefined,
      city: customer.billing_address?.city || customer.address?.city || undefined,
      state: customer.billing_address?.state || customer.address?.state || undefined,
      zip: customer.billing_address?.postal_code || customer.address?.postal_code || undefined,
      country: customer.billing_address?.country || customer.address?.country || 'South Africa',

      // Custom fields for CircleTel reference
      cf_circletel_customer_id: customer.id,
      cf_account_number: customer.account_number || undefined,
    };

    // Remove undefined fields
    Object.keys(zohoPayload).forEach(key => {
      if (zohoPayload[key as keyof typeof zohoPayload] === undefined) {
        delete zohoPayload[key as keyof typeof zohoPayload];
      }
    });

    console.log('[CustomerSync] Syncing to ZOHO Billing:', {
      customer_id,
      email: customer.email,
      display_name: zohoPayload.display_name
    });

    // Sync to ZOHO Billing
    const billingClient = new ZohoBillingClient();
    const zoho_customer_id = await billingClient.upsertCustomer(
      customer.email,
      zohoPayload
    );

    console.log('[CustomerSync] Successfully synced to ZOHO:', zoho_customer_id);

    // Update customer with ZOHO ID and sync status
    await supabase
      .from('customers')
      .update({
        zoho_billing_customer_id: zoho_customer_id,
        zoho_sync_status: 'synced',
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null
      })
      .eq('id', customer_id);

    // Log successful sync
    await logZohoSync({
      entity_type: 'customer',
      entity_id: customer_id,
      zoho_entity_type: 'Contacts',
      zoho_entity_id: zoho_customer_id,
      status: 'success',
      attempt_number: 1,
      request_payload: zohoPayload,
      response_payload: { customer_id: zoho_customer_id }
    });

    return {
      success: true,
      zoho_customer_id
    };

  } catch (error) {
    console.error('[CustomerSync] Error syncing customer:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update customer with error status
    await supabase
      .from('customers')
      .update({
        zoho_sync_status: 'failed',
        zoho_last_sync_error: errorMessage
      })
      .eq('id', customer_id);

    // Log failed sync
    await logZohoSync({
      entity_type: 'customer',
      entity_id: customer_id,
      zoho_entity_type: 'Contacts',
      zoho_entity_id: null,
      status: 'failed',
      attempt_number: 1,
      error_message: errorMessage,
      request_payload: null,
      response_payload: null
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get sync status for a customer
 *
 * @param customer_id - CircleTel customer UUID
 * @returns Sync status details
 */
export async function getCustomerSyncStatus(customer_id: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from('customers')
    .select('zoho_billing_customer_id, zoho_sync_status, zoho_last_synced_at, zoho_last_sync_error')
    .eq('id', customer_id)
    .single();

  if (!customer) {
    return null;
  }

  return {
    synced: !!customer.zoho_billing_customer_id,
    zoho_customer_id: customer.zoho_billing_customer_id,
    sync_status: customer.zoho_sync_status,
    last_synced_at: customer.zoho_last_synced_at,
    error: customer.zoho_last_sync_error
  };
}

/**
 * Find customers that need syncing
 *
 * @param limit - Maximum number of customers to return
 * @returns Array of customer IDs needing sync
 */
export async function findCustomersNeedingSync(limit: number = 100): Promise<string[]> {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from('customers')
    .select('id')
    .is('zoho_billing_customer_id', null)
    .eq('zoho_sync_status', 'pending')
    .limit(limit);

  return customers?.map(c => c.id) || [];
}
