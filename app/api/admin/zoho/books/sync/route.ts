/**
 * Zoho Books Manual Sync Trigger Endpoint
 *
 * Triggers full or entity-type specific sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZohoBooksSyncOrchestrator } from '@/lib/integrations/zoho/books-sync-orchestrator';

interface SyncRequest {
  type: 'full' | 'customers' | 'invoices' | 'payments';
}

export async function POST(request: NextRequest) {
  try {
    const body: SyncRequest = await request.json();
    const { type } = body;

    if (!['full', 'customers', 'invoices', 'payments'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid sync type. Must be: full, customers, invoices, or payments' },
        { status: 400 }
      );
    }

    const orchestrator = new ZohoBooksSyncOrchestrator();
    let result;

    switch (type) {
      case 'full':
        result = await orchestrator.runFullSync();
        break;
      case 'customers':
        result = await orchestrator.syncCustomers({});
        break;
      case 'invoices':
        result = await orchestrator.syncInvoices({});
        break;
      case 'payments':
        result = await orchestrator.syncPayments({});
        break;
    }

    return NextResponse.json({
      success: true,
      message: `${type} sync completed`,
      result,
    });
  } catch (error) {
    console.error('[ZohoBooks/Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    );
  }
}
