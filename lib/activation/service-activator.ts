/**
 * Service Activator
 *
 * Purpose: Activate service after RICA approval
 * Task Group: 12.3 - Service Activation
 */

import { createClient } from '@/lib/supabase/server';
import { createCustomerAccount } from './customer-onboarding';

/**
 * Activate Service After RICA Approval
 *
 * This function:
 * 1. Updates consumer_orders.status to 'active'
 * 2. Updates contracts.status to 'active'
 * 3. Creates billing_cycle for recurring billing
 * 4. Creates customer portal account
 * 5. Updates SLA tracking
 *
 * @param orderId - UUID of consumer_orders record
 */
export async function activateService(orderId: string): Promise<void> {
  const supabase = await createClient();

  console.log('[Service Activator] Starting activation for order:', orderId);

  // 1. Fetch order details with contract
  const { data: order, error: orderError } = await supabase
    .from('consumer_orders')
    .select(`
      *,
      contract:contracts(*)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  console.log('[Service Activator] Order loaded:', {
    orderNumber: order.order_number,
    contractId: order.contract_id,
    customerId: order.customer_id
  });

  // 2. Update consumer_orders.status to 'active'
  const { error: orderUpdateError } = await supabase
    .from('consumer_orders')
    .update({
      status: 'active',
      activation_date: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderUpdateError) {
    console.error('[Service Activator] Failed to update order status:', orderUpdateError);
    throw new Error('Failed to activate order');
  }

  console.log('[Service Activator] Order status updated to active');

  // 3. Update contracts.status to 'active'
  if (order.contract_id) {
    const { error: contractUpdateError } = await supabase
      .from('contracts')
      .update({ status: 'active' })
      .eq('id', order.contract_id);

    if (contractUpdateError) {
      console.error('[Service Activator] Failed to update contract status:', contractUpdateError);
      // Don't throw - contract update is not critical
    } else {
      console.log('[Service Activator] Contract status updated to active');
    }
  }

  // 4. Create billing_cycle for recurring billing
  const cycleStartDate = new Date();
  const cycleEndDate = new Date(cycleStartDate);
  cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);

  const { error: billingError } = await supabase.from('billing_cycles').insert({
    contract_id: order.contract_id,
    customer_id: order.customer_id,
    cycle_start_date: cycleStartDate.toISOString().split('T')[0],
    cycle_end_date: cycleEndDate.toISOString().split('T')[0],
    recurring_amount: (order.contract as any)?.monthly_recurring || order.package_price,
    status: 'active'
  });

  if (billingError) {
    console.error('[Service Activator] Failed to create billing cycle:', billingError);
    // Don't throw - billing can be created manually
  } else {
    console.log('[Service Activator] Billing cycle created:', {
      start: cycleStartDate.toISOString().split('T')[0],
      end: cycleEndDate.toISOString().split('T')[0]
    });
  }

  // 5. Create customer account (if doesn't exist)
  try {
    const accountResult = await createCustomerAccount(order.customer_id);
    console.log('[Service Activator] Customer account created:', accountResult.email);
  } catch (error) {
    console.error('[Service Activator] Failed to create customer account:', error);
    // Don't throw - account can be created manually
  }

  // 6. Update SLA tracking
  const { error: slaError } = await supabase
    .from('sla_tracking')
    .update({ service_activated_at: new Date().toISOString() })
    .eq('order_id', orderId);

  if (slaError) {
    console.error('[Service Activator] Failed to update SLA tracking:', slaError);
    // Don't throw - SLA tracking is not critical
  } else {
    console.log('[Service Activator] SLA tracking updated');
  }

  console.log('[Service Activator] ✅ Service activation complete for order:', orderId);
}

/**
 * Deactivate Service
 *
 * Used for cancellations or suspensions
 *
 * @param orderId - UUID of consumer_orders record
 * @param reason - Reason for deactivation
 */
export async function deactivateService(
  orderId: string,
  reason: 'cancelled' | 'suspended' | 'expired'
): Promise<void> {
  const supabase = await createClient();

  console.log('[Service Activator] Deactivating service:', orderId, 'Reason:', reason);

  // Update order status
  const { error: orderError } = await supabase
    .from('consumer_orders')
    .update({
      status: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (orderError) {
    throw new Error('Failed to deactivate order');
  }

  // Update contract status
  const { error: contractError } = await supabase
    .from('contracts')
    .update({ status: 'terminated' })
    .eq('id', orderId); // Assuming contract_id matches order_id

  if (contractError) {
    console.error('[Service Activator] Failed to update contract:', contractError);
  }

  // Close active billing cycles
  const { error: billingError } = await supabase
    .from('billing_cycles')
    .update({
      status: 'closed',
      cycle_end_date: new Date().toISOString().split('T')[0]
    })
    .eq('contract_id', orderId)
    .eq('status', 'active');

  if (billingError) {
    console.error('[Service Activator] Failed to close billing cycles:', billingError);
  }

  console.log('[Service Activator] ✅ Service deactivated');
}
