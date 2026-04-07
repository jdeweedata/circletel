/**
 * Admin Statement Data API
 * GET /api/admin/billing/statements/[customerId]
 *
 * Fetches assembled statement data for a customer.
 * Used by the admin billing statement preview page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assembleStatementData, StatementOptions } from '@/lib/billing/statement-data';
import { apiLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await context.params;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') ?? '3m') as StatementOptions['period'];
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { statement, customerRecord } = await assembleStatementData(supabase, customerId, {
      period,
      from,
      to,
    });

    return NextResponse.json({
      success: true,
      statement,
      customer: customerRecord,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('not found')) {
      apiLogger.error('Statement customer not found', { customerId, error: message });
      return NextResponse.json(
        { success: false, error: `Customer ${customerId} not found` },
        { status: 404 }
      );
    }

    apiLogger.error('Error in statement data API', { customerId, error: message });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statement data' },
      { status: 500 }
    );
  }
}
