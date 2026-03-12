/**
 * Zoho Books Failed Entities Endpoint
 *
 * Returns paginated list of entities that failed to sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface FailedEntity {
  type: 'customer' | 'invoice' | 'payment';
  id: string;
  displayId: string;
  error: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastAttempt: string;
}

interface FailedEntitiesResponse {
  entities: FailedEntity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const offset = (page - 1) * pageSize;

  const supabase = await createClient();
  const entities: FailedEntity[] = [];

  // Get failed customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, account_number, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at')
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (customers) {
    for (const c of customers) {
      entities.push({
        type: 'customer',
        id: c.id,
        displayId: c.account_number || c.id.substring(0, 8),
        error: c.zoho_sync_error || 'Unknown error',
        retryCount: c.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: c.zoho_books_next_retry_at,
        lastAttempt: c.updated_at,
      });
    }
  }

  // Get failed invoices
  const { data: invoices } = await supabase
    .from('customer_invoices')
    .select('id, invoice_number, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at')
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (invoices) {
    for (const inv of invoices) {
      entities.push({
        type: 'invoice',
        id: inv.id,
        displayId: inv.invoice_number || inv.id.substring(0, 8),
        error: inv.zoho_sync_error || 'Unknown error',
        retryCount: inv.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: inv.zoho_books_next_retry_at,
        lastAttempt: inv.updated_at,
      });
    }
  }

  // Get failed payments
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id, reference, zoho_sync_error, zoho_books_retry_count, zoho_books_next_retry_at, updated_at')
    .eq('zoho_sync_status', 'failed')
    .order('updated_at', { ascending: false });

  if (payments) {
    for (const p of payments) {
      entities.push({
        type: 'payment',
        id: p.id,
        displayId: p.reference || p.id.substring(0, 8),
        error: p.zoho_sync_error || 'Unknown error',
        retryCount: p.zoho_books_retry_count || 0,
        maxRetries: 5,
        nextRetryAt: p.zoho_books_next_retry_at,
        lastAttempt: p.updated_at,
      });
    }
  }

  // Sort all by lastAttempt descending
  entities.sort((a, b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime());

  // Paginate
  const total = entities.length;
  const paginatedEntities = entities.slice(offset, offset + pageSize);

  const response: FailedEntitiesResponse = {
    entities: paginatedEntities,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };

  return NextResponse.json(response);
}
