/**
 * Payment Method Management Service
 * 
 * Handles payment method CRUD operations with encryption, masking,
 * and primary method enforcement.
 * 
 * @module lib/billing/payment-method-service
 */

import { createClient } from '@/lib/supabase/server';
import { encrypt, decryptToObject, isEncryptedData, type EncryptedData } from '@/lib/security/encryption';
import { paymentLogger } from '@/lib/logging';
import type {
  PaymentMethodType,
  PaymentMethodDisplay,
  BankAccountDetails,
  CardDetails
} from './types';

/**
 * Add payment method parameters
 */
export interface AddPaymentMethodParams {
  customer_id: string;
  method_type: PaymentMethodType;
  details: BankAccountDetails | CardDetails;
  is_primary?: boolean;
  mandate_id?: string;
}

/**
 * Payment Method Service
 * 
 * Manages customer payment methods with encryption, masking,
 * and primary method enforcement.
 */
export class PaymentMethodService {
  
  /**
   * Encrypt sensitive payment details using AES-256-GCM
   *
   * Uses lib/security/encryption.ts with environment-based key management.
   * Requires PAYMENT_ENCRYPTION_KEY environment variable.
   *
   * @param details - Payment method details
   * @returns Encrypted data object for JSONB storage
   */
  private static encryptDetails(details: BankAccountDetails | CardDetails): EncryptedData {
    try {
      return encrypt(details);
    } catch (error) {
      paymentLogger.error('Failed to encrypt payment details', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to secure payment details. Please contact support.');
    }
  }

  /**
   * Decrypt payment details (for internal processing only)
   *
   * WARNING: Only use when necessary for payment processing.
   * Never expose decrypted details to API responses.
   *
   * @param encrypted - Encrypted data from database
   * @returns Decrypted payment details
   */
  private static decryptDetails<T extends BankAccountDetails | CardDetails>(
    encrypted: EncryptedData | unknown
  ): T {
    if (!isEncryptedData(encrypted)) {
      // Legacy unencrypted data - log warning and return as-is
      paymentLogger.warn('Encountered unencrypted payment details - consider migration');
      return encrypted as T;
    }

    try {
      return decryptToObject<T>(encrypted);
    } catch (error) {
      paymentLogger.error('Failed to decrypt payment details', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to retrieve payment details. Please contact support.');
    }
  }
  
  /**
   * Generate masked display name for payment method
   * 
   * @param method_type - Payment method type
   * @param details - Payment method details
   * @returns Masked display name (e.g., "Debit Order - FNB ***1234")
   */
  private static generateDisplayName(
    method_type: PaymentMethodType,
    details: BankAccountDetails | CardDetails
  ): { display_name: string; last_four?: string } {
    
    if (method_type === 'debit_order') {
      const bankDetails = details as BankAccountDetails;
      const accountNumber = bankDetails.account_number;
      const lastFour = accountNumber.slice(-4);
      
      return {
        display_name: `Debit Order - ${bankDetails.bank_name} ***${lastFour}`,
        last_four: lastFour
      };
    }
    
    if (method_type === 'card') {
      const cardDetails = details as CardDetails;
      const cardNumber = cardDetails.card_number;
      const lastFour = cardNumber.slice(-4);
      const cardType = cardDetails.card_type.toUpperCase();
      
      return {
        display_name: `${cardType} Card ***${lastFour}`,
        last_four: lastFour
      };
    }
    
    if (method_type === 'eft') {
      return {
        display_name: 'EFT Payment',
        last_four: undefined
      };
    }
    
    return {
      display_name: 'Unknown Payment Method',
      last_four: undefined
    };
  }
  
  /**
   * Add new payment method
   * 
   * Encrypts sensitive details, generates masked display name,
   * and optionally sets as primary method.
   * 
   * @param params - Payment method parameters
   * @returns Created payment method (with masked details only)
   */
  static async addPaymentMethod(params: AddPaymentMethodParams): Promise<PaymentMethodDisplay> {
    const supabase = await createClient();
    const { customer_id, method_type, details, is_primary = false, mandate_id } = params;
    
    // Generate display name and extract last 4 digits
    const { display_name, last_four } = this.generateDisplayName(method_type, details);
    
    // Encrypt full details
    const encrypted_details = this.encryptDetails(details);
    
    // If setting as primary, unset any existing primary methods
    if (is_primary) {
      await supabase
        .from('customer_payment_methods')
        .update({ is_primary: false })
        .eq('customer_id', customer_id)
        .eq('is_active', true);
    }
    
    // Insert new payment method
    const { data: paymentMethod, error } = await supabase
      .from('customer_payment_methods')
      .insert({
        customer_id,
        method_type,
        display_name,
        last_four,
        encrypted_details,
        mandate_id,
        is_primary,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
    
    // If set as primary, update customer_billing table
    if (is_primary && paymentMethod) {
      await supabase
        .from('customer_billing')
        .update({
          primary_payment_method_id: paymentMethod.id,
          payment_method_type: method_type
        })
        .eq('customer_id', customer_id);
    }
    
    // Return masked response (never expose encrypted_details)
    return {
      id: paymentMethod!.id,
      display_name: paymentMethod!.display_name,
      last_four: paymentMethod!.last_four || undefined,
      method_type: paymentMethod!.method_type as PaymentMethodType,
      is_primary: paymentMethod!.is_primary,
      is_active: paymentMethod!.is_active,
      mandate_status: paymentMethod!.mandate_status || undefined
    };
  }
  
  /**
   * Set payment method as primary
   * 
   * Ensures only one primary method per customer.
   * 
   * @param payment_method_id - Payment method UUID
   * @param customer_id - Customer UUID (for validation)
   */
  static async setPrimaryMethod(payment_method_id: string, customer_id: string) {
    const supabase = await createClient();
    
    // Verify ownership
    const { data: method, error: fetchError } = await supabase
      .from('customer_payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .single();
    
    if (fetchError || !method) {
      throw new Error('Payment method not found or not accessible');
    }
    
    // Unset all other primary methods for this customer
    await supabase
      .from('customer_payment_methods')
      .update({ is_primary: false })
      .eq('customer_id', customer_id)
      .eq('is_active', true);
    
    // Set this method as primary
    const { error: updateError } = await supabase
      .from('customer_payment_methods')
      .update({ is_primary: true })
      .eq('id', payment_method_id);
    
    if (updateError) {
      throw new Error(`Failed to set primary method: ${updateError.message}`);
    }
    
    // Update customer_billing table
    await supabase
      .from('customer_billing')
      .update({
        primary_payment_method_id: payment_method_id,
        payment_method_type: method.method_type
      })
      .eq('customer_id', customer_id);
    
    return { success: true };
  }
  
  /**
   * Soft delete payment method
   * 
   * Prevents deletion if:
   * - Method is primary and customer has outstanding balance
   * 
   * @param payment_method_id - Payment method UUID
   * @param customer_id - Customer UUID (for validation)
   */
  static async removePaymentMethod(payment_method_id: string, customer_id: string) {
    const supabase = await createClient();
    
    // Get payment method details
    const { data: method, error: fetchError } = await supabase
      .from('customer_payment_methods')
      .select('is_primary')
      .eq('id', payment_method_id)
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .single();
    
    if (fetchError || !method) {
      throw new Error('Payment method not found or not accessible');
    }
    
    // If primary method, check for outstanding balance
    if (method.is_primary) {
      const { data: billing } = await supabase
        .from('customer_billing')
        .select('account_balance')
        .eq('customer_id', customer_id)
        .single();
      
      if (billing && billing.account_balance > 0) {
        throw new Error('Cannot delete primary payment method with outstanding balance. Please set a different payment method as primary first.');
      }
    }
    
    // Soft delete (set is_active = false)
    const { error: updateError } = await supabase
      .from('customer_payment_methods')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', payment_method_id);
    
    if (updateError) {
      throw new Error(`Failed to remove payment method: ${updateError.message}`);
    }
    
    // If this was the primary method, clear it from customer_billing
    if (method.is_primary) {
      await supabase
        .from('customer_billing')
        .update({
          primary_payment_method_id: null,
          payment_method_type: null
        })
        .eq('customer_id', customer_id);
    }
    
    return { success: true };
  }
  
  /**
   * Get customer payment methods
   * 
   * Returns only active methods with masked details.
   * Never returns encrypted_details.
   * 
   * @param customer_id - Customer UUID
   * @returns Array of payment methods (masked)
   */
  static async getPaymentMethods(customer_id: string): Promise<PaymentMethodDisplay[]> {
    const supabase = await createClient();
    
    const { data: methods, error } = await supabase
      .from('customer_payment_methods')
      .select('id, display_name, last_four, method_type, is_primary, is_active, mandate_status')
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }
    
    return (methods || []).map(m => ({
      id: m.id,
      display_name: m.display_name,
      last_four: m.last_four || undefined,
      method_type: m.method_type as PaymentMethodType,
      is_primary: m.is_primary,
      is_active: m.is_active,
      mandate_status: m.mandate_status || undefined
    }));
  }
  
  /**
   * Get primary payment method
   * 
   * @param customer_id - Customer UUID
   * @returns Primary payment method or null
   */
  static async getPrimaryMethod(customer_id: string): Promise<PaymentMethodDisplay | null> {
    const supabase = await createClient();
    
    const { data: method, error } = await supabase
      .from('customer_payment_methods')
      .select('id, display_name, last_four, method_type, is_primary, is_active, mandate_status')
      .eq('customer_id', customer_id)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();
    
    if (error || !method) {
      return null;
    }
    
    return {
      id: method.id,
      display_name: method.display_name,
      last_four: method.last_four || undefined,
      method_type: method.method_type as PaymentMethodType,
      is_primary: method.is_primary,
      is_active: method.is_active,
      mandate_status: method.mandate_status || undefined
    };
  }
}
