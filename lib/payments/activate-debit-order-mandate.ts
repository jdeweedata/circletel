/**
 * Activate Debit-Order Mandate
 *
 * Shared persistence for turning a CustomerPaymentMethodWrite into the live
 * source-of-truth records. Used by BOTH activation paths so they never diverge:
 *  - NetCash eMandate webhook (app/api/webhooks/netcash/emandate)
 *  - Manual admin approval   (app/api/admin/orders/[orderId]/approve-validation)
 *
 * Writes:
 *  1. `customer_payment_methods` — upsert by unique `mandate_id` (idempotent for
 *     duplicate postbacks), the table the debit-order batch reads.
 *  2. Demotes any other payment method for the customer so there is one primary.
 *  3. `customer_billing` — sets payment_method='debit_order' + billing_day (real columns).
 *
 * @module lib/payments/activate-debit-order-mandate
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CustomerPaymentMethodWrite } from '@/lib/payments/payment-method-mapper';

export interface ActivateMandateResult {
  paymentMethodId: string | null;
  errors: string[];
}

export async function activateDebitOrderMandate(
  supabase: SupabaseClient,
  customerId: string,
  pmWrite: CustomerPaymentMethodWrite
): Promise<ActivateMandateResult> {
  const errors: string[] = [];
  let cpmId: string | null = null;

  // Idempotent upsert keyed by the unique mandate_id (handles duplicate postbacks).
  if (pmWrite.mandate_id) {
    const { data: existing } = await supabase
      .from('customer_payment_methods')
      .select('id')
      .eq('mandate_id', pmWrite.mandate_id)
      .maybeSingle();
    cpmId = existing?.id ?? null;
  }

  if (cpmId) {
    const { error } = await supabase
      .from('customer_payment_methods')
      .update(pmWrite)
      .eq('id', cpmId);
    if (error) errors.push(`update customer_payment_methods: ${error.message}`);
  } else {
    const { data: inserted, error } = await supabase
      .from('customer_payment_methods')
      .insert(pmWrite)
      .select('id')
      .single();
    if (error) errors.push(`insert customer_payment_methods: ${error.message}`);
    else cpmId = inserted?.id ?? null;
  }

  // Ensure a single primary method for the customer.
  if (cpmId) {
    const { error } = await supabase
      .from('customer_payment_methods')
      .update({ is_primary: false })
      .eq('customer_id', customerId)
      .neq('id', cpmId);
    if (error) errors.push(`demote other methods: ${error.message}`);
  }

  // customer_billing — real columns only (Gap 3 fix).
  const billingDay = pmWrite.encrypted_details.debit_day;
  const billingPayload = {
    payment_method: 'debit_order',
    billing_day: billingDay,
    payment_method_details: {
      provider: 'netcash',
      mandate_reference: pmWrite.mandate_id,
      debit_day: billingDay,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existingBilling } = await supabase
    .from('customer_billing')
    .select('id')
    .eq('customer_id', customerId)
    .maybeSingle();

  const { error: billingError } = existingBilling
    ? await supabase.from('customer_billing').update(billingPayload).eq('id', existingBilling.id)
    : await supabase.from('customer_billing').insert({ customer_id: customerId, ...billingPayload });

  if (billingError) errors.push(`customer_billing: ${billingError.message}`);

  return { paymentMethodId: cpmId, errors };
}
