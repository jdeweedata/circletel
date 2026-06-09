/**
 * Billing-ready status computation
 * Sets customers.onboarding_status = 'billing_ready' when docs approved AND mandate verified+active
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if an onboarding submission's documents are approved and the
 * associated mandate is verified and active, then mark the customer billing_ready.
 *
 * Returns true if status was flipped to billing_ready, false otherwise.
 * Safe to call repeatedly — idempotent.
 */
export async function maybeMarkBillingReady(
  supabase: SupabaseClient,
  customerId: string
): Promise<boolean> {
  // Get the latest submission for this customer
  const { data: submission, error: subError } = await supabase
    .from('onboarding_submissions')
    .select('id, document_vetting_status')
    .eq('customer_id', customerId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError || !submission) return false;

  // Docs must be approved
  if (submission.document_vetting_status !== 'approved') return false;

  // Mandate must exist, be verified, and be active
  const { data: mandate, error: manError } = await supabase
    .from('customer_payment_methods')
    .select('mandate_status, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .maybeSingle();

  if (manError || !mandate) return false;

  const mandateActive = mandate.mandate_status === 'active' || mandate.mandate_status === 'approved';
  const verified =
    mandate.encrypted_details?.verified === true ||
    mandate.encrypted_details?.verified === 'true';

  if (!mandateActive || !verified) return false;

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
