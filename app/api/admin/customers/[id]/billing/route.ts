/**
 * Admin Customer Billing View API
 * GET /api/admin/customers/[id]/billing
 * 
 * Returns comprehensive billing details for a customer
 * Task 3.4: Admin Billing Controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/customers/[id]/billing
 * 
 * Returns:
 * - Customer billing configuration
 * - All invoices
 * - All payment transactions
 * - All active services
 * - Account balance summary
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customer_id } = await context.params;
    
    // Get authenticated admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Check admin permissions (billing:view)
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, account_status')
      .eq('id', customer_id)
      .single();
    
    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Get billing configuration
    const { data: billing } = await supabase
      .from('customer_billing')
      .select('*')
      .eq('customer_id', customer_id)
      .single();
    
    // Get all invoices
    const { data: invoices } = await supabase
      .from('customer_invoices')
      .select('*')
      .eq('customer_id', customer_id)
      .order('invoice_date', { ascending: false });
    
    // Get all payment transactions
    const { data: transactions } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('customer_id', customer_id)
      .order('transaction_date', { ascending: false });
    
    // Get all services
    const { data: services } = await supabase
      .from('customer_services')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });
    
    // Calculate summary statistics
    const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
    const totalPaid = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
    const totalOutstanding = totalInvoiced - totalPaid;
    
    const overdueInvoices = invoices?.filter(inv => 
      inv.status === 'unpaid' && 
      new Date(inv.due_date) < new Date()
    ) || [];
    
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    const activeServices = services?.filter(s => s.status === 'active') || [];
    const monthlyRecurring = activeServices.reduce((sum, s) => sum + (s.monthly_price || 0), 0);
    
    return NextResponse.json({
      customer,
      billing: billing || null,
      invoices: invoices || [],
      transactions: transactions || [],
      services: services || [],
      summary: {
        account_balance: billing?.account_balance || 0,
        credit_limit: billing?.credit_limit || 0,
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        total_outstanding: totalOutstanding,
        total_overdue: totalOverdue,
        overdue_count: overdueInvoices.length,
        active_services_count: activeServices.length,
        monthly_recurring: monthlyRecurring,
        auto_pay_enabled: billing?.auto_pay_enabled || false
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
