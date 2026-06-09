import { createClient } from '@supabase/supabase-js';
import { generateToken, hashToken, tokenExpiry } from './token-service';

export function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function buildMagicLinkUrl(base: string, token: string): string {
  return `${base.replace(/\/+$/, '')}/onboarding/${token}`;
}

/** Issue a fresh single-use token for a customer; returns the plaintext token. */
export async function issueToken(customerId: string, sentVia: string): Promise<string> {
  const supabase = svc();
  const token = generateToken();
  const { error } = await supabase.from('onboarding_tokens').insert({
    customer_id: customerId,
    token_hash: hashToken(token),
    expires_at: tokenExpiry(),
    sent_via: sentVia,
    sent_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to issue token: ${error.message}`);
  return token;
}

/** Resolve a plaintext token to a customer id, enforcing expiry + single use. */
export async function resolveToken(token: string): Promise<{ customerId: string; tokenId: string } | null> {
  const supabase = svc();
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('id, customer_id, expires_at, used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return { customerId: data.customer_id, tokenId: data.id };
}

/** Pre-fill payload for the wizard from the existing customer record. */
export async function getClinicPrefill(customerId: string) {
  const supabase = svc();
  const { data: c, error } = await supabase
    .from('customers')
    .select('id, account_number, business_name, business_registration, tax_number, email, phone, onboarding_status, clinic_details')
    .eq('id', customerId)
    .single();
  if (error || !c) return null;
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price, billing_day, activation_date')
    .eq('customer_id', customerId)
    .limit(1)
    .maybeSingle();
  return { customer: c, service: svcRow };
}
