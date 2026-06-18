/**
 * Billing-ready status computation
 * Sets customers.onboarding_status = 'billing_ready' when:
 * - Latest onboarding_submissions.document_vetting_status === 'approved'
 * - At least one customer_services row with status='active'
 * - An active customer_payment_methods (method_type='debit_order', is_active=true)
 *   with encrypted_details containing BOTH account_number AND branch_code
 *
 * (Drops the signature requirement: mandate_status active + verified)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if an onboarding submission's documents are approved, the customer
 * has an active service, and valid bank details on file. If all conditions met,
 * mark the customer billing_ready.
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
    .select('id, document_vetting_status')
    .eq('customer_id', customerId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError || !submission) return false;

  // Docs must be approved
  if (submission.document_vetting_status !== 'approved') return false;

  // 2. Check for at least one active service
  const { data: activeService } = await supabase
    .from('customer_services')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .maybeSingle();

  if (!activeService) return false;

  // 3. Check for debit order payment method with bank details (account_number + branch_code)
  const { data: paymentMethods, error: pmError } = await supabase
    .from('customer_payment_methods')
    .select('id, encrypted_details')
    .eq('customer_id', customerId)
    .eq('method_type', 'debit_order')
    .eq('is_active', true);

  if (pmError || !paymentMethods || paymentMethods.length === 0) return false;

  // Verify at least one payment method has both account_number and branch_code
  const hasBankDetails = paymentMethods.some((pm: any) => {
    const details = pm.encrypted_details as any;
    return details?.account_number && details?.branch_code;
  });

  if (!hasBankDetails) return false;

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
