/**
 * Fulfillment Order Processor
 *
 * Purpose: Create consumer_orders from invoices after payment
 * Task Group: 12.5 - Order Creation from Invoice
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Create Order from Invoice After Payment
 *
 * This function is triggered when an invoice is paid
 * It creates a consumer_orders record with all details from:
 * - invoice (payment details)
 * - contract (package, pricing)
 * - quote (installation address, customer info)
 * - customer (contact details)
 *
 * @param invoiceId - UUID of invoices record
 * @returns Order ID
 */
export async function createOrderFromInvoice(invoiceId: string): Promise<string> {
  const supabase = await createClient();

  console.log('[Fulfillment] Creating order from invoice:', invoiceId);

  // 1. Fetch invoice with contract, quote, and customer details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      contract:contracts(
        *,
        quote:business_quotes(*)
      ),
      customer:customers(*)
    `)
    .eq('id', invoiceId)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  console.log('[Fulfillment] Invoice loaded:', {
    invoiceNumber: invoice.invoice_number,
    amount: invoice.total_amount,
    customerId: invoice.customer_id
  });

  // 2. Get KYC session ID from contract (needed for RICA submission later)
  const kycSessionId = (invoice.contract as any)?.kyc_session_id;

  if (!kycSessionId) {
    console.warn('[Fulfillment] No KYC session found - RICA submission may fail');
  }

  // 3. Extract customer name parts
  const customerName = (invoice.customer as any)?.name || 'Customer';
  const nameParts = customerName.split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  // 4. Create consumer_orders record
  const { data: order, error: orderError } = await supabase
    .from('consumer_orders')
    .insert({
      // Order identification
      order_number: `ORD-${Date.now()}`, // Temporary - use DB trigger for proper numbering

      // References
      customer_id: invoice.customer_id,
      contract_id: invoice.contract_id,
      invoice_id: invoiceId,

      // Customer details
      first_name: firstName,
      last_name: lastName,
      email: (invoice.customer as any)?.email || '',
      phone: (invoice.customer as any)?.phone || '',

      // Installation address (from quote)
      installation_address: (invoice.contract as any)?.quote?.installation_address || '',
      billing_same_as_installation: true,

      // Package details (from contract/quote)
      service_package_id: (invoice.contract as any)?.quote?.package_id,
      package_name: (invoice.contract as any)?.quote?.package_name || 'Package',
      package_price: (invoice.contract as any)?.monthly_recurring || 0,
      installation_fee: (invoice.contract as any)?.installation_fee || 0,
      router_included: true, // Default assumption

      // Payment details
      payment_method: 'eft', // Default - can be updated based on actual payment method
      payment_status: 'paid',
      payment_reference: invoice.invoice_number,
      total_paid: invoice.total_amount,

      // Order status
      status: 'pending_installation',

      // Tracking
      lead_source: 'quote_conversion',

      // Timestamps
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (orderError) {
    console.error('[Fulfillment] Failed to create order:', orderError);
    throw new Error('Failed to create order');
  }

  console.log('[Fulfillment] Order created:', {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status
  });

  // 5. Create SLA tracking record
  const { error: slaError } = await supabase.from('sla_tracking').insert({
    order_id: order.id,
    order_placed_at: new Date().toISOString()
  });

  if (slaError) {
    console.error('[Fulfillment] Failed to create SLA tracking:', slaError);
    // Don't throw - SLA tracking is not critical
  } else {
    console.log('[Fulfillment] SLA tracking created');
  }

  // 6. Return order ID
  console.log('[Fulfillment] ✅ Order creation complete:', order.id);
  return order.id;
}

/**
 * Schedule Installation After Order Creation
 *
 * @param orderId - UUID of consumer_orders record
 * @param scheduledDate - Installation date
 * @param timeSlot - morning | afternoon | full_day
 * @param technicianId - UUID of technician (optional)
 */
export async function scheduleInstallation(
  orderId: string,
  scheduledDate: string,
  timeSlot: 'morning' | 'afternoon' | 'full_day',
  technicianId?: string
): Promise<void> {
  const supabase = await createClient();

  console.log('[Fulfillment] Scheduling installation:', {
    orderId,
    date: scheduledDate,
    slot: timeSlot
  });

  // Create installation schedule
  const { error } = await supabase.from('installation_schedules').insert({
    order_id: orderId,
    technician_id: technicianId || null,
    scheduled_date: scheduledDate,
    time_slot: timeSlot,
    status: 'scheduled'
  });

  if (error) {
    console.error('[Fulfillment] Failed to schedule installation:', error);
    throw new Error('Failed to schedule installation');
  }

  // Update order status
  await supabase
    .from('consumer_orders')
    .update({
      status: 'installation_scheduled',
      installation_scheduled_date: scheduledDate
    })
    .eq('id', orderId);

  console.log('[Fulfillment] ✅ Installation scheduled');
}

/**
 * Complete Installation
 *
 * @param installationScheduleId - UUID of installation_schedules record
 * @param completionData - Equipment serials, speed test, photos, signature
 */
export async function completeInstallation(
  installationScheduleId: string,
  completionData: {
    equipmentSerials: Record<string, string>;
    speedTestResults: Record<string, number>;
    photos?: string[];
    customerSignature?: string;
    notes?: string;
  }
): Promise<void> {
  const supabase = await createClient();

  console.log('[Fulfillment] Completing installation:', installationScheduleId);

  // Update installation schedule
  const { error } = await supabase
    .from('installation_schedules')
    .update({
      status: 'completed',
      completed_date: new Date().toISOString(),
      equipment_serials: completionData.equipmentSerials,
      speed_test_results: completionData.speedTestResults,
      installation_photos: completionData.photos || [],
      customer_signature: completionData.customerSignature || '',
      completion_notes: completionData.notes || ''
    })
    .eq('id', installationScheduleId);

  if (error) {
    console.error('[Fulfillment] Failed to complete installation:', error);
    throw new Error('Failed to complete installation');
  }

  // Get order_id from installation schedule
  const { data: schedule } = await supabase
    .from('installation_schedules')
    .select('order_id')
    .eq('id', installationScheduleId)
    .single();

  if (schedule?.order_id) {
    // Update order status
    await supabase
      .from('consumer_orders')
      .update({
        status: 'pending_activation',
        installation_completed_date: new Date().toISOString()
      })
      .eq('id', schedule.order_id);

    // Update SLA tracking
    await supabase
      .from('sla_tracking')
      .update({ installation_completed_at: new Date().toISOString() })
      .eq('order_id', schedule.order_id);
  }

  console.log('[Fulfillment] ✅ Installation completed');
}
