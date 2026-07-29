/**
 * Billing-ready status computation.
 * Sets customers.onboarding_status = 'billing_ready' only when the clinic is
 * fully onboarded: documents approved, service order issued, active service,
 * and a collectible debit-order mandate.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if an onboarding submission's documents are approved, the service
 * order has been issued, the customer has an active service, and there is a
 * verified active debit-order mandate on file. If all conditions met, mark the
 * customer billing_ready.
 *
 * Returns true if status was flipped to billing_ready, false otherwise.
 * Safe to call repeatedly — idempotent.
 */
export async function maybeMarkBillingReady(
  supabase: SupabaseClient,
  customerId: string
): Promise<boolean> {
  // 1. Get the latest submission for this customer
  const { data: submission, error: subError } = await supabase
    .from('onboarding_submissions')
    .select('id, document_vetting_status, service_order_issued_at')
    .eq('customer_id', customerId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError || !submission) return false;

  // Docs must be approved
  if (submission.document_vetting_status !== 'approved') return false;

  // Service order must be issued before billing/debit-order processing unlocks.
  if (!submission.service_order_issued_at) return false;

  // 2. Check for at least one active service
  const { data: activeService } = await supabase
    .from('customer_services')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!activeService) return false;

  // 3. Check for a collectible debit-order payment method.
  const { data: paymentMethods, error: pmError } = await supabase
    .from('customer_payment_methods')
    .select('id, method_type, mandate_status, is_active, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .eq('is_active', true);

  if (pmError || !paymentMethods || paymentMethods.length === 0) return false;

  const hasCollectibleDebitOrder = paymentMethods.some((pm: any) => {
    const details = pm.encrypted_details as any;
    const verified = details?.verified === true || details?.verified === 'true';
    const mandateActive = pm.mandate_status === 'active' || pm.mandate_status === 'approved';
    return (
      mandateActive &&
      verified &&
      details?.account_number &&
      details?.branch_code
    );
  });

  if (!hasCollectibleDebitOrder) return false;

  // All conditions met: mark customer billing_ready
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('customers')
    .update({
      onboarding_status: 'billing_ready',
      onboarding_completed_at: now,
    })
    .eq('id', customerId);

  if (updateError) {
    console.error('[Billing Ready] Failed to update customer:', updateError);
    return false;
  }

  return true;
}
