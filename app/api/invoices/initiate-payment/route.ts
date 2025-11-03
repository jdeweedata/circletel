/**
 * API Route: Initiate Payment for Invoice
 * POST /api/invoices/initiate-payment
 * Task Group 10: Invoice Generation & NetCash Payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { netcashService } from '@/lib/payments/netcash-service';

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

    console.log('[Invoice Payment API] Payment initiated for invoice:', invoiceId);
    console.log('[Invoice Payment API] Transaction reference:', paymentData.transactionReference);

    // Return payment URL and details
    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentData.paymentUrl,
        transactionReference: paymentData.transactionReference,
        invoiceNumber: paymentData.formData.m8, // Extra2 contains invoice number
        amount: parseFloat(paymentData.formData.m4) / 100 // Convert from cents
      }
    });

  } catch (error: any) {
    console.error('[Invoice Payment API] Error initiating payment:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initiate payment'
      },
      { status: 500 }
    );
  }
}
