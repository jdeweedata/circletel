/**
 * API Route: Initiate Payment for Invoice
 * POST /api/invoices/initiate-payment
 * Task Group 10: Invoice Generation & NetCash Payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { netcashService } from '@/lib/payments/netcash-service';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

/**
 * POST /api/invoices/initiate-payment
 *
 * Initiates NetCash payment for an invoice
 * Fetches invoice details and generates payment URL
 *
 * Request body:
 * {
 *   "invoiceId": "uuid-string"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "paymentUrl": "https://netcash.co.za/...",
 *     "transactionReference": "CT-invoice-789-1730467200000",
 *     "invoiceNumber": "INV-2025-001",
 *     "amount": 1607.70
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { invoiceId } = body;

    // Validate required fields
    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: invoiceId'
        },
        { status: 400 }
      );
    }

    // Authorize: an admin may initiate payment for any invoice; a customer may
    // only initiate payment for an invoice they own.
    const adminAuth = await authenticateAdmin(request);
    if (!adminAuth.success) {
      // Not an admin — resolve the customer session (header token or cookies)
      let userId: string | null = null;
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

      if (token) {
        const tokenClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data, error } = await tokenClient.auth.getUser(token);
        if (!error && data?.user) userId = data.user.id;
      } else {
        try {
          const sessionClient = await createClientWithSession();
          const { data } = await sessionClient.auth.getUser();
          if (data?.user) userId = data.user.id;
        } catch {
          /* fall through to 401 */
        }
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Verify the invoice belongs to this customer
      const supabase = await createClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }

      const { data: invoice } = await supabase
        .from('customer_invoices')
        .select('id')
        .eq('id', invoiceId)
        .eq('customer_id', customer.id)
        .maybeSingle();

      if (!invoice) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }
    }

    // Check if NetCash service is configured
    if (!netcashService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway is not configured'
        },
        { status: 500 }
      );
    }

    // Initiate payment for invoice
    const paymentData = await netcashService.initiatePaymentForInvoice(invoiceId);

    apiLogger.info('[Invoice Payment API] Payment initiated for invoice', {
      invoiceId,
      transactionReference: paymentData.transactionReference
    });

    // Return payment URL and details
    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentData.paymentUrl,
        transactionReference: paymentData.transactionReference,
        invoiceNumber: paymentData.formData.m6, // Extra field 3 (Order Number)
        amount: parseFloat(paymentData.formData.Amount) / 100 // Convert from cents
      }
    });

  } catch (error: unknown) {
    apiLogger.error('[Invoice Payment API] Error initiating payment', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment'
      },
      { status: 500 }
    );
  }
}
