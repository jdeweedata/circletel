/**
 * ZOHO Billing Subscription Sync Service
 *
 * Syncs CircleTel active services to ZOHO Billing Subscriptions
 * ZOHO auto-generates recurring invoices from subscriptions
 *
 * Prerequisites:
 * - Customer must be synced to ZOHO first
 * - Product/Plan must exist in ZOHO (via product publish flow)
 *
 * @see docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md
 */

import { createClient } from '@/lib/supabase/server';
import { ZohoBillingClient } from './billing-client';
import { syncCustomerToZohoBilling } from './customer-sync-service';
import { logZohoSync } from './sync-service';

export interface SubscriptionSyncResult {
  success: boolean;
  zoho_subscription_id?: string;
  error?: string;
}

/**
 * Sync a CircleTel service to ZOHO Billing Subscription
 *
 * @param service_id - CircleTel customer_services UUID
 * @returns Sync result with ZOHO subscription ID or error
 */
export async function syncSubscriptionToZohoBilling(
  service_id: string
): Promise<SubscriptionSyncResult> {
  const supabase = await createClient();

  try {
    console.log('[SubscriptionSync] Starting sync for service:', service_id);

    // Update sync status to 'syncing'
    await supabase
      .from('customer_services')
      .update({ zoho_sync_status: 'syncing' })
      .eq('id', service_id);

    // Get service data from Supabase
    const { data: service, error: fetchError } = await supabase
      .from('customer_services')
      .select(`
        *,
        customer:customers(*),
        package:service_packages(
          *,
          integration:product_integrations(*)
        )
      `)
      .eq('id', service_id)
      .single();

    if (fetchError || !service) {
      throw new Error(`Service not found: ${service_id}`);
    }

    // Check if service is active
    if (service.status !== 'active') {
      throw new Error(`Service is not active: ${service.status}`);
    }

    // Check if already synced
    if (service.zoho_subscription_id) {
      console.log('[SubscriptionSync] Service already synced:', service.zoho_subscription_id);
      return {
        success: true,
        zoho_subscription_id: service.zoho_subscription_id
      };
    }

    // Prerequisite 1: Ensure customer is synced to ZOHO
    console.log('[SubscriptionSync] Checking customer sync status...');
    if (!service.customer?.zoho_billing_customer_id) {
      console.log('[SubscriptionSync] Customer not synced, syncing now...');
      const customerSyncResult = await syncCustomerToZohoBilling(service.customer_id);
      if (!customerSyncResult.success || !customerSyncResult.zoho_customer_id) {
        throw new Error(`Failed to sync customer: ${customerSyncResult.error}`);
      }
      // Refresh customer data
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('zoho_billing_customer_id')
        .eq('id', service.customer_id)
        .single();
      service.customer.zoho_billing_customer_id = updatedCustomer?.zoho_billing_customer_id;
    }

    // Prerequisite 2: Ensure product/plan is synced to ZOHO
    const planId = service.package?.integration?.[0]?.zoho_billing_plan_id;
    if (!planId) {
      throw new Error(
        `Service package not synced to ZOHO Billing. Please publish the product first. Package ID: ${service.service_package_id}`
      );
    }

    console.log('[SubscriptionSync] Prerequisites met:', {
      customer_id: service.customer.zoho_billing_customer_id,
      plan_id: planId
    });

    // Build ZOHO Billing subscription payload
    const zohoPayload = {
      customer_id: service.customer.zoho_billing_customer_id,
      plan: {
        plan_code: planId,
        quantity: 1,
        price: service.monthly_price || service.package?.monthly_price || 0,
      },
      // Start date (today or activation date)
      starts_at: service.activation_date || new Date().toISOString().split('T')[0],
      // Next billing date (from service record)
      next_billing_at: service.next_billing_date || undefined,
      // Auto-collect enabled (bill automatically)
      auto_collect: true,
      // Custom fields for CircleTel reference
      cf_circletel_service_id: service.id,
      cf_installation_address: service.installation_address || undefined,
    };

    // Remove undefined fields
    Object.keys(zohoPayload).forEach(key => {
      if (zohoPayload[key as keyof typeof zohoPayload] === undefined) {
        delete zohoPayload[key as keyof typeof zohoPayload];
      }
    });

    console.log('[SubscriptionSync] Creating ZOHO subscription:', {
      service_id,
      customer_email: service.customer.email,
      plan_id: planId
    });

    // Create subscription in ZOHO Billing
    const billingClient = new ZohoBillingClient();
    const zohoSubscription = await billingClient.createSubscription(zohoPayload);

    const zoho_subscription_id = zohoSubscription.subscription_id;

    console.log('[SubscriptionSync] Successfully created ZOHO subscription:', {
      subscription_id: zoho_subscription_id,
      subscription_number: zohoSubscription.subscription_number,
      status: zohoSubscription.status
    });

    // Update service with ZOHO subscription ID
    await supabase
      .from('customer_services')
      .update({
        zoho_subscription_id,
        zoho_sync_status: 'synced',
        zoho_last_synced_at: new Date().toISOString(),
        zoho_last_sync_error: null
      })
      .eq('id', service_id);

    // Log successful sync
    await logZohoSync({
      entity_type: 'subscription',
      entity_id: service_id,
      zoho_entity_type: 'Subscription',
      zoho_entity_id: zoho_subscription_id,
      status: 'success',
      attempt_number: 1,
      request_payload: zohoPayload,
      response_payload: zohoSubscription
    });

    return {
      success: true,
      zoho_subscription_id
    };

  } catch (error) {
    console.error('[SubscriptionSync] Error syncing subscription:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update service with error status
    await supabase
      .from('customer_services')
      .update({
        zoho_sync_status: 'failed',
        zoho_last_sync_error: errorMessage
      })
      .eq('id', service_id);

    // Log failed sync
    await logZohoSync({
      entity_type: 'subscription',
      entity_id: service_id,
      zoho_entity_type: 'Subscription',
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
 * Get sync status for a subscription
 *
 * @param service_id - CircleTel customer_services UUID
 * @returns Sync status details
 */
export async function getSubscriptionSyncStatus(service_id: string) {
  const supabase = await createClient();

  const { data: service } = await supabase
    .from('customer_services')
    .select('zoho_subscription_id, zoho_sync_status, zoho_last_synced_at, zoho_last_sync_error')
    .eq('id', service_id)
    .single();

  if (!service) {
    return null;
  }

  return {
    synced: !!service.zoho_subscription_id,
    zoho_subscription_id: service.zoho_subscription_id,
    sync_status: service.zoho_sync_status,
    last_synced_at: service.zoho_last_synced_at,
    error: service.zoho_last_sync_error
  };
}

/**
 * Find active services that need syncing
 *
 * @param limit - Maximum number of services to return
 * @returns Array of service IDs needing sync
 */
export async function findSubscriptionsNeedingSync(limit: number = 100): Promise<string[]> {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from('customer_services')
    .select('id')
    .eq('status', 'active')
    .is('zoho_subscription_id', null)
    .eq('zoho_sync_status', 'pending')
    .limit(limit);

  return services?.map(s => s.id) || [];
}
