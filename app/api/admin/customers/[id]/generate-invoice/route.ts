/**
 * Generate invoice for a customer's service
 * Uses the MonthlyInvoiceGenerator with single customer mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { serviceId, dryRun = false } = body;

    const generator = new MonthlyInvoiceGenerator();

    const result = await generator.generateMonthlyInvoices({
      customerId,
      dryRun,
      billingDay: new Date().getDate(), // Use current day to bypass billing_day filter
    });

    if (!result.results || result.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active services found for billing',
      }, { status: 400 });
    }

    const serviceResult = serviceId
      ? result.results.find(r => r.serviceId === serviceId)
      : result.results[0];

    if (!serviceResult) {
      return NextResponse.json({
        success: false,
        error: 'Service not found or not eligible for billing',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: serviceResult.success,
      dryRun,
      invoice: serviceResult.success ? {
        id: serviceResult.invoiceId,
        invoice_number: serviceResult.invoiceNumber,
        amount: serviceResult.amount,
      } : null,
      zohoSynced: serviceResult.zohoSynced,
      emailSent: serviceResult.emailSent,
      smsSent: serviceResult.smsSent,
      errors: serviceResult.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
