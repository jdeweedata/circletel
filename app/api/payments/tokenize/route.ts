/**
 * NetCash PCI Vault Tokenization Initiation
 * GET /api/payments/tokenize
 *
 * Initiates the card tokenization flow by redirecting to NetCash PCI Vault.
 * Requires customer authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { netcashPciVaultService } from '@/lib/payments/netcash-pci-vault-service';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'dashboard';
    const returnPath = searchParams.get('return') || '/dashboard/billing/payment-methods';
    const reference = searchParams.get('ref');

    // Check if PCI Vault is configured
    if (!netcashPciVaultService.isConfigured()) {
      console.error('[Tokenize] PCI Vault not configured');
      return NextResponse.redirect(
        new URL(`${returnPath}?error=gateway_not_configured`, request.url)
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Tokenize] User not authenticated:', authError);
      // Redirect to auth login, with return to the verify-card page (not the API route)
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent('/dashboard/billing/verify-card')}`, request.url)
      );
    }

    // Get customer ID from user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      console.error('[Tokenize] Customer not found:', customerError);
      return NextResponse.redirect(
        new URL(`${returnPath}?error=customer_not_found`, request.url)
      );
    }

    // Build the callback URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/payments/tokenize/callback`;

    // Generate tokenization URL
    const tokenizationUrl = netcashPciVaultService.generateTokenizationUrl({
      customerId: customer.id,
      callbackUrl,
      reference: reference || undefined,
      metadata: {
        return_url: returnPath,
        source,
      },
    });

    console.log('[Tokenize] Redirecting to NetCash PCI Vault:', {
      customerId: customer.id,
      source,
      reference,
    });

    // Redirect to NetCash tokenization page
    return NextResponse.redirect(tokenizationUrl);

  } catch (error) {
    console.error('[Tokenize] Error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/billing/payment-methods?error=system_error', request.url)
    );
  }
}
