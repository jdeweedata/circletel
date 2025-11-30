/**
 * ZOHO Billing Sync Logs API
 *
 * GET /api/admin/zoho-sync/logs
 *
 * Returns recent sync activity logs with filtering and pagination
 *
 * Query parameters:
 * - entity_type: Filter by entity type (customer, subscription, invoice, payment)
 * - status: Filter by status (success, failed, pending, retrying)
 * - limit: Number of records to return (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * @module app/api/admin/zoho-sync/logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/zoho-sync/logs
 *
 * Get recent sync activity logs
 */
export async function GET(request: NextRequest) {
  try {
    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Check if user is admin (match by id - the admin_users.id matches auth user id)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('zoho_sync_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error: logsError, count } = await query;

    if (logsError) {
      throw new Error(`Failed to fetch sync logs: ${logsError.message}`);
    }

    // Get entity details for recent logs (customer names, invoice numbers, etc.)
    const enrichedLogs = await Promise.all(
      (logs || []).map(async (log) => {
        let entityDetails = null;

        try {
          if (log.entity_type === 'customer') {
            const { data: customer } = await supabase
              .from('customers')
              .select('first_name, last_name, email')
              .eq('id', log.entity_id)
              .single();

            if (customer) {
              entityDetails = {
                name: `${customer.first_name} ${customer.last_name}`.trim(),
                email: customer.email
              };
            }
          } else if (log.entity_type === 'subscription') {
            const { data: service } = await supabase
              .from('customer_services')
              .select('package_name, customer:customers(first_name, last_name)')
              .eq('id', log.entity_id)
              .single();

            if (service) {
              const customer = Array.isArray(service.customer) ? service.customer[0] : service.customer;
              entityDetails = {
                package_name: service.package_name,
                customer_name: customer ? `${customer.first_name} ${customer.last_name}`.trim() : null
              };
            }
          } else if (log.entity_type === 'invoice') {
            const { data: invoice } = await supabase
              .from('customer_invoices')
              .select('invoice_number, total_amount, customer:customers(first_name, last_name)')
              .eq('id', log.entity_id)
              .single();

            if (invoice) {
              const customer = Array.isArray(invoice.customer) ? invoice.customer[0] : invoice.customer;
              entityDetails = {
                invoice_number: invoice.invoice_number,
                amount: invoice.total_amount,
                customer_name: customer ? `${customer.first_name} ${customer.last_name}`.trim() : null
              };
            }
          } else if (log.entity_type === 'payment') {
            const { data: payment } = await supabase
              .from('payment_transactions')
              .select('transaction_reference, amount, customer:customers(first_name, last_name)')
              .eq('id', log.entity_id)
              .single();

            if (payment) {
              const customer = Array.isArray(payment.customer) ? payment.customer[0] : payment.customer;
              entityDetails = {
                reference: payment.transaction_reference,
                amount: payment.amount,
                customer_name: customer ? `${customer.first_name} ${customer.last_name}`.trim() : null
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching entity details for ${log.entity_type}:`, error);
        }

        return {
          ...log,
          entity_details: entityDetails
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        logs: enrichedLogs,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > (offset + limit)
        }
      }
    });

  } catch (error) {
    console.error('ZOHO sync logs API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
