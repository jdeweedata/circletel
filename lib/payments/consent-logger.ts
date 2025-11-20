/**
 * Consent Logger Service
 *
 * Logs customer consent acceptance to payment_consents table
 * for POPIA compliance and audit trail.
 *
 * Usage:
 * - Call logPaymentConsents() when initiating payment
 * - Call logQuoteConsents() when submitting business quote
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentPolicyVersions } from '@/lib/constants/policy-versions';
import type { PaymentConsents } from '@/components/payments/PaymentConsentCheckboxes';
import type { B2BConsents } from '@/components/payments/PaymentConsentCheckboxes';

export interface ConsentLogRequest {
  // Transaction References
  payment_transaction_id?: string;
  order_id?: string;
  quote_id?: string;
  customer_email: string;
  customer_id?: string;

  // Consents (from form)
  consents: PaymentConsents | B2BConsents;

  // Audit Trail
  ip_address?: string;
  user_agent?: string;

  // Metadata
  consent_type?: 'payment' | 'quote' | 'subscription';
}

/**
 * Logs payment consents to database
 */
export async function logPaymentConsents(
  request: ConsentLogRequest
): Promise<{ success: boolean; consent_id?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const policyVersions = getCurrentPolicyVersions();

    // Check if consents is B2BConsents by checking for B2B-specific fields
    const isB2B = 'dataProcessing' in request.consents;

    const consentRecord = {
      // Transaction References
      payment_transaction_id: request.payment_transaction_id || null,
      order_id: request.order_id || null,
      quote_id: request.quote_id || null,
      customer_email: request.customer_email,
      customer_id: request.customer_id || null,

      // Policy Versions
      terms_version: policyVersions.terms_version,
      privacy_version: policyVersions.privacy_version,
      payment_terms_version: policyVersions.payment_terms_version,
      refund_policy_version: policyVersions.refund_policy_version,

      // Standard Consent Flags
      terms_accepted: request.consents.terms || false,
      privacy_accepted: request.consents.privacy || false,
      payment_terms_accepted: request.consents.paymentTerms || false,
      refund_policy_acknowledged: request.consents.refundPolicy || false,
      recurring_payment_authorized: request.consents.recurringPayment || false,
      marketing_consent: request.consents.marketing || false,

      // B2B-specific Consents
      data_processing_consent: isB2B ? (request.consents as B2BConsents).dataProcessing || false : false,
      third_party_disclosure_consent: isB2B ? (request.consents as B2BConsents).thirdPartyDisclosure || false : false,
      business_verification_consent: isB2B ? (request.consents as B2BConsents).businessVerification || false : false,

      // Audit Trail
      ip_address: request.ip_address || null,
      user_agent: request.user_agent || null,
      consent_timestamp: new Date().toISOString(),

      // Metadata
      consent_type: request.consent_type || 'payment',
      additional_metadata: {
        is_b2b: isB2B,
        timestamp: new Date().toISOString()
      }
    };

    const { data, error } = await supabase
      .from('payment_consents')
      .insert(consentRecord)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log payment consents:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      consent_id: data?.id
    };
  } catch (error) {
    console.error('Exception in logPaymentConsents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Retrieves consent logs for a customer
 */
export async function getCustomerConsents(
  customerEmail: string,
  limit: number = 10
): Promise<{ success: boolean; consents?: any[]; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payment_consents')
      .select('*')
      .eq('customer_email', customerEmail)
      .order('consent_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to retrieve customer consents:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      consents: data || []
    };
  } catch (error) {
    console.error('Exception in getCustomerConsents:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Retrieves consent log for a specific transaction
 */
export async function getTransactionConsent(
  transactionId: string
): Promise<{ success: boolean; consent?: any; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payment_consents')
      .select('*')
      .eq('payment_transaction_id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to retrieve transaction consent:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      consent: data || null
    };
  } catch (error) {
    console.error('Exception in getTransactionConsent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function extractIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Helper to extract User-Agent from request headers
 */
export function extractUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
