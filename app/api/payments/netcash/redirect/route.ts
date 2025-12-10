/**
 * NetCash Payment Redirect Handler
 *
 * POST /api/payments/netcash/redirect
 *
 * NetCash sends a POST request after payment completion.
 * This handler receives the POST data and redirects the user
 * to the appropriate page via GET.
 *
 * @module app/api/payments/netcash/redirect
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

  try {
    // Parse form data from NetCash POST
    const formData = await request.formData();

    // Extract NetCash response fields
    const transactionAccepted = formData.get('TransactionAccepted');
    const reason = formData.get('Reason');
    const reference = formData.get('Reference') || formData.get('Extra1');

    console.log('[NetCash Redirect] Received POST:', {
      transactionAccepted,
      reason,
      reference,
      allFields: Object.fromEntries(formData.entries())
    });

    // Determine redirect URL based on transaction status
    let redirectUrl: string;

    if (transactionAccepted === 'true' || transactionAccepted === true) {
      // Payment successful
      redirectUrl = `${baseUrl}/dashboard/billing?payment_method=success`;
      if (reference) {
        redirectUrl += `&ref=${encodeURIComponent(String(reference))}`;
      }
      console.log('[NetCash Redirect] Payment successful, redirecting to:', redirectUrl);
    } else {
      // Payment cancelled or failed
      redirectUrl = `${baseUrl}/dashboard/billing?payment_method=cancelled`;
      if (reason) {
        redirectUrl += `&reason=${encodeURIComponent(String(reason))}`;
      }
      console.log('[NetCash Redirect] Payment cancelled/failed, redirecting to:', redirectUrl);
    }

    // Redirect user to billing page via GET
    return NextResponse.redirect(redirectUrl, { status: 303 }); // 303 See Other for POST->GET redirect

  } catch (error) {
    console.error('[NetCash Redirect] Error processing redirect:', error);

    // On error, redirect to billing page with error status
    const errorUrl = `${baseUrl}/dashboard/billing?payment_method=error`;
    return NextResponse.redirect(errorUrl, { status: 303 });
  }
}

// Also handle GET requests in case NetCash uses GET
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;

  // Extract parameters
  const transactionAccepted = searchParams.get('TransactionAccepted');
  const reason = searchParams.get('Reason');
  const reference = searchParams.get('Reference') || searchParams.get('Extra1');

  console.log('[NetCash Redirect] Received GET:', {
    transactionAccepted,
    reason,
    reference
  });

  let redirectUrl: string;

  if (transactionAccepted === 'true') {
    redirectUrl = `${baseUrl}/dashboard/billing?payment_method=success`;
    if (reference) {
      redirectUrl += `&ref=${encodeURIComponent(String(reference))}`;
    }
  } else {
    redirectUrl = `${baseUrl}/dashboard/billing?payment_method=cancelled`;
    if (reason) {
      redirectUrl += `&reason=${encodeURIComponent(String(reason))}`;
    }
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
