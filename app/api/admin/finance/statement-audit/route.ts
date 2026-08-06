/**
 * NetCash Statement Audit API (read-only)
 *
 * POST /api/admin/finance/statement-audit
 * Body: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', rails?: 'all' | 'debit' | 'paynow' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import {
  runStatementAudit,
  validateStatementAuditRange,
  type StatementAuditRails,
} from '@/lib/billing/netcash-statement-audit';

export const runtime = 'nodejs';
export const maxDuration = 300;

const RAILS: StatementAuditRails[] = ['all', 'debit', 'paynow'];

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      from?: string;
      to?: string;
      rails?: string;
    };

    const from = typeof body.from === 'string' ? body.from : '';
    const to = typeof body.to === 'string' ? body.to : '';
    const railsRaw = typeof body.rails === 'string' ? body.rails : 'all';
    const rails = (RAILS.includes(railsRaw as StatementAuditRails)
      ? railsRaw
      : null) as StatementAuditRails | null;

    if (!rails) {
      return NextResponse.json(
        { error: "rails must be one of: all | debit | paynow" },
        { status: 400 }
      );
    }

    const validated = validateStatementAuditRange(from, to);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const report = await runStatementAudit({ from, to, rails });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Statement audit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
