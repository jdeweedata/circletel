import { NextRequest, NextResponse } from 'next/server';
import {
  getCapitalSnapshot,
  recordCapitalTransaction,
  getCapitalForecast,
} from '@/lib/sales-engine/capital-tracker-service';

// GET /api/admin/sales-engine/capital-tracker
// Returns capital position, channel-split MRR, burn rate, MSC status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forecast = searchParams.get('forecast');

    if (forecast) {
      const months = parseInt(forecast) || 3;
      const result = await getCapitalForecast(months);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, forecast: result.data });
    }

    const result = await getCapitalSnapshot();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, snapshot: result.data });
  } catch (error) {
    console.error('[capital-tracker] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get capital snapshot' },
      { status: 500 }
    );
  }
}

// POST /api/admin/sales-engine/capital-tracker
// Record a capital transaction (spend or revenue inflow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, description, amount, transaction_date, related_milestone } = body;

    if (!category || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'category, description, and amount are required' },
        { status: 400 }
      );
    }

    const result = await recordCapitalTransaction({
      category,
      description,
      amount,
      transaction_date,
      related_milestone,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: result.data });
  } catch (error) {
    console.error('[capital-tracker] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
