/**
 * API Route: Create Invoice from Contract
 * POST /api/invoices/create-from-contract
 * Task Group 10: Invoice Generation & NetCash Payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceFromContract } from '@/lib/invoices/invoice-generator';
import { generateInvoicePDF } from '@/lib/invoices/pdf-generator';
import { apiLogger } from '@/lib/logging/logger';

/**
 * POST /api/invoices/create-from-contract
 *
 * Creates an invoice from a signed contract
 * Automatically generates invoice number (INV-YYYY-NNN)
 * Calculates line items: Installation + Router (if applicable) + First Month
 *
 * Request body:
 * {
 *   "contractId": "uuid-string"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "invoiceId": "uuid-string",
 *     "invoiceNumber": "INV-2025-001",
 *     "totalAmount": 1607.70,
 *     "pdfUrl": "https://..."
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { contractId } = body;

    // Validate required fields
    if (!contractId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: contractId'
        },
        { status: 400 }
      );
    }

    // Create invoice from contract
    const invoice = await createInvoiceFromContract(contractId);

    apiLogger.info('[Invoice API] Invoice created', { invoiceNumber: invoice.invoiceNumber });

    // Generate PDF for invoice
    const pdfUrl = await generateInvoicePDF(invoice.invoiceId);

    apiLogger.info('[Invoice API] PDF generated', { pdfUrl });

    // Return invoice details
    return NextResponse.json({
      success: true,
      data: {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        items: invoice.items,
        pdfUrl
      }
    });

  } catch (error: any) {
    apiLogger.error('[Invoice API] Error creating invoice', { error });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create invoice'
      },
      { status: 500 }
    );
  }
}
