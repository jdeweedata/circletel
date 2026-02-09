/**
 * NetCash PCI Vault Tokenization Callback
 * GET /api/payments/tokenize/callback
 *
 * Receives the callback from NetCash after card tokenization.
 * Processes the token data and stores it in the database.
 * Redirects user to appropriate page based on success/failure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { netcashPciVaultService, TokenizationCallbackData } from '@/lib/payments/netcash-pci-vault-service';
import { createClient } from '@supabase/supabase-js';
import { paymentLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract NetCash callback parameters
    const callbackData: TokenizationCallbackData = {
      Successful: searchParams.get('Successful') || '0',
      Token: searchParams.get('Token') || undefined,
      CardHolderName: searchParams.get('CardHolderName') || undefined,
      MaskedCardNumber: searchParams.get('MaskedCardNumber') || undefined,
      ExpMonth: searchParams.get('ExpMonth') || undefined,
      ExpYear: searchParams.get('ExpYear') || undefined,
      ErrorMessage: searchParams.get('ErrorMessage') || undefined,
      ErrorCode: searchParams.get('ErrorCode') || undefined,
      Reference: searchParams.get('Reference') || undefined,
    };

    // Extract our custom parameters
    const customerId = searchParams.get('customer_id');
    const returnUrl = searchParams.get('return_url') || '/dashboard/billing/payment-methods';
    const source = searchParams.get('source') || 'dashboard'; // dashboard, checkout, reverify

    paymentLogger.info('[Tokenization Callback] Received:', {
      successful: callbackData.Successful,
      hasToken: !!callbackData.Token,
      customerId,
      reference: callbackData.Reference,
      source,
    });

    // Validate customer ID
    if (!customerId) {
      paymentLogger.error('[Tokenization Callback] Missing customer_id');
      return NextResponse.redirect(
        new URL(`${returnUrl}?error=missing_customer_id`, request.url)
      );
    }

    // Process the callback data
    const tokenData = netcashPciVaultService.processTokenizationCallback(callbackData);

    // Log to audit table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabase.from('payment_audit_logs').insert({
      event_type: 'card_tokenization_callback',
      status: tokenData.success ? 'success' : 'failed',
      request_body: JSON.stringify({
        customer_id: customerId,
        reference: callbackData.Reference,
        card_type: tokenData.cardType,
        masked_number: tokenData.maskedNumber,
        error: tokenData.error,
        error_code: tokenData.errorCode,
        source,
      }),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      created_at: new Date().toISOString(),
    });

    if (!tokenData.success) {
      paymentLogger.error('[Tokenization Callback] Tokenization failed:', tokenData.error);
      const errorUrl = new URL(returnUrl, request.url);
      errorUrl.searchParams.set('error', 'tokenization_failed');
      errorUrl.searchParams.set('message', tokenData.error || 'Card tokenization failed');
      return NextResponse.redirect(errorUrl);
    }

    // Store the token
    const storeResult = await netcashPciVaultService.storeToken(tokenData, customerId);

    if (!storeResult.success) {
      paymentLogger.error('[Tokenization Callback] Failed to store token:', storeResult.error);
      const errorUrl = new URL(returnUrl, request.url);
      errorUrl.searchParams.set('error', 'storage_failed');
      errorUrl.searchParams.set('message', 'Failed to save card details');
      return NextResponse.redirect(errorUrl);
    }

    // Update customer's preferred payment method if this is their first card
    await supabase
      .from('customers')
      .update({
        preferred_payment_method: 'credit_card',
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .is('preferred_payment_method', null); // Only update if not already set

    paymentLogger.info('[Tokenization Callback] Token stored successfully:', {
      customerId,
      paymentMethodId: storeResult.paymentMethodId,
      cardType: tokenData.cardType,
      maskedNumber: tokenData.maskedNumber,
    });

    // Redirect to success page
    const successUrl = new URL(returnUrl, request.url);
    successUrl.searchParams.set('success', 'card_added');
    successUrl.searchParams.set('card', tokenData.maskedNumber?.slice(-4) || 'card');
    return NextResponse.redirect(successUrl);

  } catch (error) {
    paymentLogger.error('[Tokenization Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/billing/payment-methods?error=system_error', request.url)
    );
  }
}
