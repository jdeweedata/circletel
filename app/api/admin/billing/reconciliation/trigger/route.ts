import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, admin_user_id, reconciliation_date, year, month, dry_run } = body as {
      type: 'eft' | 'paynow' | 'monthly-sweep';
      admin_user_id?: string;
      reconciliation_date?: string;
      year?: number;
      month?: number;
      dry_run?: boolean;
    };

    if (!type) {
      return NextResponse.json(
        { error: 'type is required (eft | paynow | monthly-sweep)' },
        { status: 400 }
      );
    }

    let eventName: string;
    let eventData: Record<string, unknown>;

    switch (type) {
      case 'eft':
        eventName = 'eft/reconciliation.requested';
        eventData = {
          triggered_by: 'manual',
          admin_user_id,
          reconciliation_date,
          options: { dryRun: dry_run ?? false },
        };
        break;

      case 'paynow':
        eventName = 'paynow/reconciliation.requested';
        eventData = {
          triggered_by: 'manual',
          admin_user_id,
          reconciliation_date,
          options: { dryRun: dry_run ?? false },
        };
        break;

      case 'monthly-sweep':
        eventName = 'reconciliation/monthly-sweep.requested';
        eventData = {
          triggered_by: 'manual',
          admin_user_id,
          year,
          month,
          options: { dryRun: dry_run ?? false },
        };
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}` },
          { status: 400 }
        );
    }

    await inngest.send({ name: eventName, data: eventData } as any);

    return NextResponse.json({
      success: true,
      message: `${type} reconciliation triggered`,
      dry_run: dry_run ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
