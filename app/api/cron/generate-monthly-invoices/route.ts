/**
 * Monthly Invoice Generation Cron
 *
 * Runs on 1st of month at 06:00 SAST (04:00 UTC)
 * Generates invoices for all active services, syncs to ZOHO, sends Pay Now notifications
 *
 * Test modes:
 * - POST { "dryRun": true } - Preview what would be billed
 * - POST { "customerId": "xxx" } - Bill single customer
 * - POST { "billingDay": 15 } - Override billing day
 *
 * Vercel Cron: 0 4 1 * * (04:00 UTC on 1st = 06:00 SAST)
 *
 * @module app/api/cron/generate-monthly-invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';
import { cronLogger } from '@/lib/logging';

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max for full billing run

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if no secret configured (dev mode) or if secret matches
  if (!cronSecret) {
    cronLogger.warn('CRON_SECRET not configured - allowing request');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      cronLogger.warn('Unauthorized cron request attempted');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      dryRun = false,
      billingDay,
      customerId,
      skipZohoSync,
      skipPayNow,
    } = body as {
      dryRun?: boolean;
      billingDay?: number;
      customerId?: string;
      skipZohoSync?: boolean;
      skipPayNow?: boolean;
    };

    cronLogger.info('Monthly invoice generation cron started', {
      dryRun,
      billingDay: billingDay || 'today',
      customerId: customerId || 'all',
      skipZohoSync,
      skipPayNow,
    });

    // Run invoice generation
    const generator = new MonthlyInvoiceGenerator();
    const result = await generator.generateMonthlyInvoices({
      dryRun,
      billingDay,
      customerId,
      skipZohoSync,
      skipPayNow,
    });

    const duration = Date.now() - startTime;

    cronLogger.info('Monthly invoice generation cron completed', {
      duration: `${duration}ms`,
      runId: result.runId,
      servicesProcessed: result.summary.processed,
      invoicesCreated: result.summary.successful,
      failed: result.summary.failed,
      skipped: result.summary.skipped,
    });

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      runId: result.runId,
      billingDay: result.billingDay,
      dryRun: result.dryRun,
      servicesProcessed: result.summary.processed,
      invoicesCreated: result.summary.successful,
      failed: result.summary.failed,
      skipped: result.summary.skipped,
      totalServices: result.summary.totalServices,
      results: result.results,
      _version: 'v1-2026-02-17',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    cronLogger.error('Monthly invoice generation cron failed', {
      duration: `${duration}ms`,
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel cron (cron jobs use GET by default)
export async function GET(request: NextRequest) {
  // Verify authorization for GET as well
  if (!verifyCronSecret(request)) {
    cronLogger.warn('Unauthorized cron GET request attempted');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true';

  // Create a mock POST request with same headers
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ dryRun }),
  });

  return POST(mockRequest);
}
