/**
 * NetCash PCI Vault Tokenization Service
 *
 * Service for securely tokenizing credit cards using NetCash PCI Vault.
 * Tokens can be used for recurring credit card payments without storing
 * actual card details.
 *
 * PCI Vault Documentation: NetCash Merchant Portal > PCI Vault
 * External Tokenization Form: https://cde.netcash.co.za/Site/TokeniseCardExternal.aspx
 *
 * @module lib/payments/netcash-pci-vault-service
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TokenizationRequest {
  /** Customer ID for associating the token */
  customerId: string;
  /** URL to redirect after tokenization (with token data) */
  callbackUrl: string;
  /** Optional reference (e.g., invoice number, order ID) */
  reference?: string;
  /** Optional metadata to pass through */
  metadata?: Record<string, string>;
}

export interface TokenizationFormParams {
  /** NetCash PCI Vault Key */
  PciKey: string;
  /** Return URL after tokenization */
  ReturnUrl: string;
  /** Optional: Reference to pass through */
  Reference?: string;
}

export interface TokenizationCallbackData {
  /** Whether tokenization was successful (1 = success, 0 = failed) */
  Successful: string;
  /** The token for future charges (if successful) */
  Token?: string;
  /** Cardholder name as entered */
  CardHolderName?: string;
  /** Masked card number (e.g., ****7495) */
  MaskedCardNumber?: string;
  /** Card expiry month (1-12) */
  ExpMonth?: string;
  /** Card expiry year (4 digits) */
  ExpYear?: string;
  /** Error message if failed */
  ErrorMessage?: string;
  /** Error code if failed */
  ErrorCode?: string;
  /** Reference passed through */
  Reference?: string;
}

export interface ProcessedTokenData {
  success: boolean;
  token?: string;
  cardHolderName?: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'other';
  maskedNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  error?: string;
  errorCode?: string;
  reference?: string;
}

export interface StoredCardToken {
  customerId: string;
  token: string;
  cardHolderName: string;
  cardType: string;
  maskedNumber: string;
  expiryMonth: number;
  expiryYear: number;
  createdAt: Date;
  verifiedAt?: Date;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NetCashPciVaultService {
  private pciVaultKey: string;
  private tokenizationUrl: string;
  private externalTokenizationUrl: string;

  constructor() {
    this.pciVaultKey = process.env.NETCASH_PCI_VAULT_KEY || '';
    this.tokenizationUrl = 'https://cde.netcash.co.za/Site/TokeniseCard.aspx';
    this.externalTokenizationUrl = 'https://cde.netcash.co.za/Site/TokeniseCardExternal.aspx';

    if (!this.pciVaultKey) {
      console.warn('NetCash PCI Vault Key not configured. Card tokenization will not work.');
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.pciVaultKey;
  }

  /**
   * Generate the URL for external tokenization form
   * Customer will be redirected to NetCash secure page to enter card details.
   * After tokenization, customer is redirected back to callbackUrl with token data.
   *
   * @param request - Tokenization request parameters
   * @returns Full URL to redirect customer to for tokenization
   */
  generateTokenizationUrl(request: TokenizationRequest): string {
    if (!this.isConfigured()) {
      throw new Error('NetCash PCI Vault is not configured');
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

    // Build callback URL with metadata
    const callbackUrlObj = new URL(request.callbackUrl, baseUrl);
    callbackUrlObj.searchParams.set('customer_id', request.customerId);
    if (request.reference) {
      callbackUrlObj.searchParams.set('ref', request.reference);
    }
    if (request.metadata) {
      Object.entries(request.metadata).forEach(([key, value]) => {
        callbackUrlObj.searchParams.set(key, value);
      });
    }

    const params: TokenizationFormParams = {
      PciKey: this.pciVaultKey,
      ReturnUrl: callbackUrlObj.toString(),
      Reference: request.reference,
    };

    // Build URL with parameters
    const url = new URL(this.externalTokenizationUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Process the callback data from NetCash after tokenization
   * Extracts and validates the token data returned in the callback URL
   *
   * @param callbackData - Data from the callback URL query parameters
   * @returns Processed token data with card details
   */
  processTokenizationCallback(callbackData: TokenizationCallbackData): ProcessedTokenData {
    const result: ProcessedTokenData = {
      success: false,
      reference: callbackData.Reference,
    };

    // Check if tokenization was successful
    if (callbackData.Successful !== '1') {
      result.error = callbackData.ErrorMessage || 'Tokenization failed';
      result.errorCode = callbackData.ErrorCode;
      console.error('[PCI Vault] Tokenization failed:', {
        error: result.error,
        errorCode: result.errorCode,
        reference: callbackData.Reference,
      });
      return result;
    }

    // Validate required fields
    if (!callbackData.Token) {
      result.error = 'No token returned from NetCash';
      return result;
    }

    // Extract card details
    result.success = true;
    result.token = callbackData.Token;
    result.cardHolderName = callbackData.CardHolderName;
    result.maskedNumber = callbackData.MaskedCardNumber;

    // Parse expiry
    if (callbackData.ExpMonth) {
      result.expiryMonth = parseInt(callbackData.ExpMonth, 10);
    }
    if (callbackData.ExpYear) {
      result.expiryYear = parseInt(callbackData.ExpYear, 10);
    }

    // Determine card type from masked number
    result.cardType = this.detectCardType(callbackData.MaskedCardNumber || '');

    console.log('[PCI Vault] Token created successfully:', {
      maskedNumber: result.maskedNumber,
      cardType: result.cardType,
      expiryMonth: result.expiryMonth,
      expiryYear: result.expiryYear,
      reference: result.reference,
    });

    return result;
  }

  /**
   * Detect card type from masked card number
   * Uses BIN (Bank Identification Number) prefix rules
   */
  private detectCardType(maskedNumber: string): 'visa' | 'mastercard' | 'amex' | 'other' {
    // Extract visible digits (usually first/last few)
    const digits = maskedNumber.replace(/\D/g, '');

    // Try to determine from visible digits or common patterns
    // Visa starts with 4
    // Mastercard starts with 51-55 or 2221-2720
    // Amex starts with 34 or 37

    const firstDigit = digits.charAt(0);
    const firstTwo = digits.substring(0, 2);

    if (firstDigit === '4') {
      return 'visa';
    } else if (['51', '52', '53', '54', '55'].includes(firstTwo) ||
               (parseInt(firstTwo) >= 22 && parseInt(firstTwo) <= 27)) {
      return 'mastercard';
    } else if (['34', '37'].includes(firstTwo)) {
      return 'amex';
    }

    // Check if masked number contains card type indicators
    const lowerMasked = maskedNumber.toLowerCase();
    if (lowerMasked.includes('visa')) return 'visa';
    if (lowerMasked.includes('master')) return 'mastercard';
    if (lowerMasked.includes('amex')) return 'amex';

    return 'other';
  }

  /**
   * Convert card type to NetCash card type code
   * Used in debit order batch submissions
   */
  getCardTypeCode(cardType: string): string {
    switch (cardType.toLowerCase()) {
      case 'visa': return '1';
      case 'mastercard': return '2';
      case 'amex': return '3';
      default: return '0'; // Unknown
    }
  }

  /**
   * Store tokenized card in database
   * Saves the token and card details to customer_payment_methods
   *
   * @param tokenData - Processed token data
   * @param customerId - Customer UUID
   * @returns Stored payment method record
   */
  async storeToken(
    tokenData: ProcessedTokenData,
    customerId: string
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    if (!tokenData.success || !tokenData.token) {
      return {
        success: false,
        error: 'Invalid token data',
      };
    }

    try {
      // Import Supabase client dynamically to avoid circular dependencies
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Check for existing active credit card method
      const { data: existingMethod } = await supabase
        .from('customer_payment_methods')
        .select('id')
        .eq('customer_id', customerId)
        .eq('method_type', 'credit_card')
        .eq('is_active', true)
        .single();

      // Deactivate existing card if present
      if (existingMethod) {
        await supabase
          .from('customer_payment_methods')
          .update({
            is_active: false,
            is_primary: false,
            deactivated_at: new Date().toISOString(),
          })
          .eq('id', existingMethod.id);
      }

      // Create new payment method with token
      const displayName = tokenData.maskedNumber
        ? `${tokenData.cardType?.toUpperCase() || 'Card'} ending ${tokenData.maskedNumber.slice(-4)}`
        : `Credit Card`;

      const { data: newMethod, error: insertError } = await supabase
        .from('customer_payment_methods')
        .insert({
          customer_id: customerId,
          method_type: 'credit_card',
          display_name: displayName,
          last_four: tokenData.maskedNumber?.slice(-4) || null,
          card_token: tokenData.token,
          card_holder_name: tokenData.cardHolderName || null,
          card_type: tokenData.cardType || null,
          card_masked_number: tokenData.maskedNumber || null,
          card_expiry_month: tokenData.expiryMonth || null,
          card_expiry_year: tokenData.expiryYear || null,
          token_status: 'active',
          token_created_at: new Date().toISOString(),
          is_primary: true,
          is_active: true,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[PCI Vault] Error storing token:', insertError);
        return {
          success: false,
          error: insertError.message,
        };
      }

      console.log('[PCI Vault] Token stored successfully:', {
        paymentMethodId: newMethod.id,
        customerId,
        cardType: tokenData.cardType,
        maskedNumber: tokenData.maskedNumber,
      });

      return {
        success: true,
        paymentMethodId: newMethod.id,
      };
    } catch (error) {
      console.error('[PCI Vault] Error storing token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get tokenization URL for embedded iframe (optional)
   * Returns the URL for embedding tokenization in an iframe
   *
   * @param callbackUrl - URL to receive token data
   * @returns Iframe-safe tokenization URL
   */
  getIframeTokenizationUrl(callbackUrl: string): string {
    if (!this.isConfigured()) {
      throw new Error('NetCash PCI Vault is not configured');
    }

    const params = new URLSearchParams({
      PciKey: this.pciVaultKey,
      ReturnUrl: callbackUrl,
    });

    return `${this.tokenizationUrl}?${params.toString()}`;
  }

  /**
   * Verify a token is still valid (optional health check)
   * Makes a zero-value authorization to verify the card is still active
   *
   * Note: This requires additional NetCash API setup
   */
  async verifyToken(token: string): Promise<{ valid: boolean; error?: string }> {
    // For now, we assume tokens are valid if they exist
    // Full verification would require a zero-value auth API call
    if (!token || token.length < 10) {
      return { valid: false, error: 'Invalid token format' };
    }
    return { valid: true };
  }

  /**
   * Check if a card token is expired based on expiry date
   *
   * @param expiryMonth - Card expiry month (1-12)
   * @param expiryYear - Card expiry year (4 digits)
   * @returns Whether the card is expired
   */
  isCardExpired(expiryMonth: number, expiryYear: number): boolean {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (expiryYear < currentYear) {
      return true;
    }
    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return true;
    }
    return false;
  }

  /**
   * Get expiring cards (cards expiring within N months)
   * Useful for sending renewal reminders
   *
   * @param monthsAhead - Number of months to look ahead
   * @returns Array of customer IDs with expiring cards
   */
  async getExpiringCards(monthsAhead: number = 1): Promise<Array<{
    customerId: string;
    paymentMethodId: string;
    expiryMonth: number;
    expiryYear: number;
    maskedNumber: string;
  }>> {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const now = new Date();
      let targetMonth = now.getMonth() + 1 + monthsAhead;
      let targetYear = now.getFullYear();

      if (targetMonth > 12) {
        targetMonth -= 12;
        targetYear += 1;
      }

      // Query cards expiring within the window
      const { data: expiringCards, error } = await supabase
        .from('customer_payment_methods')
        .select('id, customer_id, card_expiry_month, card_expiry_year, card_masked_number')
        .eq('method_type', 'credit_card')
        .eq('is_active', true)
        .eq('token_status', 'active')
        .lte('card_expiry_year', targetYear)
        .lte('card_expiry_month', targetMonth);

      if (error) {
        console.error('[PCI Vault] Error fetching expiring cards:', error);
        return [];
      }

      return (expiringCards || []).map(card => ({
        customerId: card.customer_id,
        paymentMethodId: card.id,
        expiryMonth: card.card_expiry_month,
        expiryYear: card.card_expiry_year,
        maskedNumber: card.card_masked_number,
      }));
    } catch (error) {
      console.error('[PCI Vault] Error fetching expiring cards:', error);
      return [];
    }
  }
}

// Export singleton instance
export const netcashPciVaultService = new NetCashPciVaultService();
