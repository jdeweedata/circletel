/**
 * Admin Statement PDF API
 * GET /api/admin/billing/statements/[customerId]/pdf
 *
 * Generates and streams a jsPDF statement PDF for a customer.
 * Query params: period (3m|6m|12m|all), from, to, download
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { assembleStatementData, StatementOptions } from '@/lib/billing/statement-data';
import { generateStatementPDFBuffer } from '@/lib/billing/statement-pdf-generator';
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

    const { statement } = await assembleStatementData(supabase, customerId, {
      period,
      from,
      to,
    });

    const pdfBuffer = generateStatementPDFBuffer(statement);
    const accountNumber = statement.customer.accountNumber || customerId;
    const filename = `CircleTel_Statement_${accountNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('not found')) {
      apiLogger.error('Statement PDF: customer not found', { customerId, error: message });
      return NextResponse.json(
        { success: false, error: `Customer ${customerId} not found` },
        { status: 404 }
      );
    }

    apiLogger.error('Error generating statement PDF', { customerId, error: message });
    return NextResponse.json(
      { success: false, error: 'Failed to generate statement PDF' },
      { status: 500 }
    );
  }
}
