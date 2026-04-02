import { createClient } from '@supabase/supabase-js';

export interface VerificationGateResult {
  canProcess: boolean;
  missingSteps: string[];
  details: Record<string, boolean>;
}

/**
 * Checks whether a customer has completed all required verification steps
 * before an order can progress to activation.
 *
 * Steps required:
 * 1. Real email (not phantom @phone.circletel.co.za)
 * 2. Email verified
 * 3. Phone verified
 * 4. Installation address set on the order
 * 5. KYC documents approved (id_document + proof_of_address)
 */
export async function checkOrderVerificationStatus(
  customerId: string,
  orderId: string
): Promise<VerificationGateResult> {
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch customer
  const { data: customer } = await serviceSupabase
    .from('customers')
    .select('email, email_verified, phone_verified_at')
    .eq('id', customerId)
    .single();

  // Fetch order
  const { data: order } = await serviceSupabase
    .from('consumer_orders')
    .select('installation_address')
    .eq('id', orderId)
    .single();

  // Fetch approved KYC documents for this order
  const { data: kycDocs } = await serviceSupabase
    .from('kyc_documents')
    .select('document_type, verification_status')
    .eq('order_id', orderId)
    .eq('verification_status', 'approved');

  const approvedTypes = new Set((kycDocs ?? []).map((d) => d.document_type));

  const hasRealEmail = !!customer?.email && !customer.email.endsWith('@phone.circletel.co.za');
  const emailVerified = !!customer?.email_verified && hasRealEmail;
  const phoneVerified = !!customer?.phone_verified_at;
  const addressSet = !!order?.installation_address?.trim();
  const idDocApproved = approvedTypes.has('id_document');
  const proofOfAddressApproved = approvedTypes.has('proof_of_address');
  const kycComplete = idDocApproved && proofOfAddressApproved;

  const details: Record<string, boolean> = {
    email_verified: emailVerified,
    phone_verified: phoneVerified,
    address_added: addressSet,
    kyc_id_document: idDocApproved,
    kyc_proof_of_address: proofOfAddressApproved,
  };

  const missingSteps: string[] = [];
  if (!emailVerified) missingSteps.push('email_verified');
  if (!phoneVerified) missingSteps.push('phone_verified');
  if (!addressSet) missingSteps.push('address_added');
  if (!kycComplete) missingSteps.push('kyc_complete');

  return {
    canProcess: missingSteps.length === 0,
    missingSteps,
    details,
  };
}
