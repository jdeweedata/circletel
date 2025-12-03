/**
 * Admin Billing Customers API
 * GET /api/admin/billing/customers
 *
 * Fetches all customers with their billing information.
 * Used by the admin billing customers page.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Fetch all customers with their service and invoice counts
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        account_number,
        account_status,
        account_type,
        business_name,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // Get invoice and service stats for each customer
    const customerIds = (customers || []).map(c => c.id);

    // Get outstanding amounts per customer
    const { data: invoiceStats } = await supabase
      .from('customer_invoices')
      .select('customer_id, amount_due, status')
      .in('customer_id', customerIds)
      .in('status', ['sent', 'partial', 'overdue']);

    // Get active services count per customer
    const { data: serviceStats } = await supabase
      .from('customer_services')
      .select('customer_id')
      .in('customer_id', customerIds)
      .eq('status', 'active');

    // Build stats maps
    const outstandingByCustomer: Record<string, number> = {};
    const servicesByCustomer: Record<string, number> = {};

    (invoiceStats || []).forEach((inv: any) => {
      const amount = parseFloat(inv.amount_due || '0');
      outstandingByCustomer[inv.customer_id] = (outstandingByCustomer[inv.customer_id] || 0) + amount;
    });

    (serviceStats || []).forEach((svc: any) => {
      servicesByCustomer[svc.customer_id] = (servicesByCustomer[svc.customer_id] || 0) + 1;
    });

    // Format customers with stats
    const formattedCustomers = (customers || []).map((customer: any) => ({
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      phone: customer.phone,
      company: customer.business_name,
      account_number: customer.account_number,
      status: customer.account_status || 'active',
      account_type: customer.account_type || 'residential',
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      outstanding_amount: outstandingByCustomer[customer.id] || 0,
      active_services: servicesByCustomer[customer.id] || 0,
    }));

    // Calculate summary stats
    const totalCustomers = formattedCustomers.length;
    const activeCustomers = formattedCustomers.filter(c => c.status === 'active').length;
    const totalOutstanding = Object.values(outstandingByCustomer).reduce((sum: number, amt: number) => sum + amt, 0);

    return NextResponse.json({
      customers: formattedCustomers,
      stats: {
        totalCustomers,
        activeCustomers,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error('Error in billing customers API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
