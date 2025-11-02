/**
 * Dashboard Summary API
 * GET /api/dashboard/summary
 * 
 * Returns comprehensive dashboard summary aggregating all customer data
 * Task 3.7: Dashboard Summary API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';

/**
 * GET /api/dashboard/summary
 * 
 * Returns:
 * - Customer details (account_number, account_status)
 * - Services list with current status
 * - Billing summary (balance, next payment)
 * - Recent orders (from consumer_orders)
 * - Recent invoices (last 5)
 * - Stats (active services, orders, overdue invoices)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, account_status, created_at')
      .eq('auth_user_id', user.id)
      .single();
    
    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Parallel queries for better performance
    const [
      servicesResult,
      billingResult,
      ordersResult,
      invoicesResult,
      transactionsResult
    ] = await Promise.all([
      // Get all services
      supabase
        .from('customer_services')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false }),
      
      // Get billing info
      supabase
        .from('customer_billing')
        .select('*')
        .eq('customer_id', customer.id)
        .single(),
      
      // Get recent orders
      supabase
        .from('consumer_orders')
        .select('id, order_number, status, total_paid, created_at, package_name')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Get recent invoices
      supabase
        .from('customer_invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .order('invoice_date', { ascending: false })
        .limit(5),
      
      // Get recent transactions
      supabase
        .from('payment_transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('transaction_date', { ascending: false })
        .limit(5)
    ]);
    
    const services = servicesResult.data || [];
    const billing = billingResult.data;
    const orders = ordersResult.data || [];
    const invoices = invoicesResult.data || [];
    const transactions = transactionsResult.data || [];
    
    // Get primary payment method
    const primaryPaymentMethod = await PaymentMethodService.getPrimaryMethod(customer.id);
    
    // Calculate statistics
    const activeServices = services.filter(s => s.status === 'active');
    const pendingServices = services.filter(s => s.status === 'pending');
    const suspendedServices = services.filter(s => s.status === 'suspended');
    
    const today = new Date().toISOString().split('T')[0];
    const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');
    const overdueInvoices = unpaidInvoices.filter(inv => inv.due_date < today);
    
    const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    // Get next billing date from active services
    const nextBillingDates = activeServices
      .map(s => s.next_billing_date)
      .filter(d => d)
      .sort();
    const nextBillingDate = nextBillingDates.length > 0 ? nextBillingDates[0] : null;
    
    // Calculate monthly recurring
    const monthlyRecurring = activeServices.reduce((sum, s) => sum + (s.monthly_price || 0), 0);
    
    // Build summary response
    const summary = {
      // Customer info
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.phone,
        account_number: customer.account_number,
        account_status: customer.account_status,
        customer_since: customer.created_at
      },
      
      // Services overview
      services: {
        total: services.length,
        active: activeServices.length,
        pending: pendingServices.length,
        suspended: suspendedServices.length,
        list: services.map(s => ({
          id: s.id,
          package_name: s.package_name,
          service_type: s.service_type,
          status: s.status,
          monthly_price: s.monthly_price,
          next_billing_date: s.next_billing_date,
          installation_address: s.installation_address
        }))
      },
      
      // Billing overview
      billing: {
        account_balance: billing?.account_balance || 0,
        credit_limit: billing?.credit_limit || 0,
        next_billing_date: nextBillingDate,
        monthly_recurring: monthlyRecurring,
        primary_payment_method: primaryPaymentMethod,
        auto_pay_enabled: billing?.auto_pay_enabled || false,
        preferred_billing_date: billing?.preferred_billing_date || 1
      },
      
      // Invoices overview
      invoices: {
        recent: invoices,
        unpaid_count: unpaidInvoices.length,
        overdue_count: overdueInvoices.length,
        total_unpaid: totalUnpaid,
        total_overdue: totalOverdue
      },
      
      // Transactions overview
      transactions: {
        recent: transactions
      },
      
      // Orders overview
      orders: {
        recent: orders,
        total: orders.length
      },
      
      // Quick stats
      stats: {
        active_services: activeServices.length,
        pending_orders: orders.filter(o => o.status === 'pending').length,
        overdue_invoices: overdueInvoices.length,
        account_balance: billing?.account_balance || 0,
        monthly_recurring: monthlyRecurring
      },
      
      // Alerts/Warnings
      alerts: [
        ...(overdueInvoices.length > 0 ? [{
          type: 'warning',
          message: `You have ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`,
          amount: totalOverdue
        }] : []),
        ...(suspendedServices.length > 0 ? [{
          type: 'info',
          message: `${suspendedServices.length} service${suspendedServices.length > 1 ? 's are' : ' is'} currently suspended`
        }] : []),
        ...((billing?.account_balance || 0) < 0 ? [{
          type: 'info',
          message: `You have a credit balance of R${Math.abs(billing?.account_balance || 0).toFixed(2)}`
        }] : [])
      ]
    };
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
