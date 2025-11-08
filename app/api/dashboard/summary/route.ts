/**
 * Dashboard Summary API
 * GET /api/dashboard/summary
 *
 * Returns comprehensive dashboard summary aggregating all customer data
 * Task 3.7: Dashboard Summary API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';

// Vercel configuration: Allow longer execution for comprehensive dashboard queries
export const runtime = 'nodejs';
export const maxDuration = 20; // Allow up to 20 seconds for multiple table queries

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
  const startTime = Date.now();
  console.log('[Dashboard Summary API] ⏱️ Request started');

  try {
    // Get authenticated user session from cookies (fast - no API call)
    const sessionClient = await createClientWithSession();
    const { data: { session }, error: authError } = await sessionClient.auth.getSession();

    if (authError || !session?.user) {
      console.log('[Dashboard Summary API] ❌ Auth failed:', authError?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }

    const user = session.user;

    console.log('[Dashboard Summary API] ⏱️ User authenticated:', Date.now() - startTime, 'ms', `(user_id: ${user.id})`);

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();
    console.log('[Dashboard Summary API] ⏱️ Service role client created:', Date.now() - startTime, 'ms');

    // Get customer details using service role
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, account_status, created_at')
      .eq('auth_user_id', user.id)
      .single();

    console.log('[Dashboard Summary API] ⏱️ Customer fetched:', Date.now() - startTime, 'ms');

    // If customer doesn't exist, return error (don't auto-create)
    if (customerError || !customer) {
      console.error('[Dashboard Summary API] ❌ Customer not found for user:', user.id, customerError?.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Customer record not found. Please contact support.',
          technical_error: customerError?.message
        },
        { status: 404 }
      );
    }
    
    // Parallel queries for better performance with timeout protection
    const QUERY_TIMEOUT = 15000; // 15 second timeout for all parallel queries
    const parallelQueriesPromise = Promise.all([
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
        .order('initiated_at', { ascending: false })
        .limit(5)
    ]);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Dashboard summary queries timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let servicesResult, billingResult, ordersResult, invoicesResult, transactionsResult;
    try {
      const results = await Promise.race([parallelQueriesPromise, timeoutPromise]);
      [servicesResult, billingResult, ordersResult, invoicesResult, transactionsResult] = results;
      console.log('[Dashboard Summary API] ⏱️ All queries completed:', Date.now() - startTime, 'ms');
    } catch (timeoutError) {
      console.error('[Dashboard Summary API] ❌ Queries timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Dashboard summary queries are taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }
    
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
    
    // Build summary response matching DashboardData interface
    const summary = {
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        customerSince: customer.created_at,
        accountNumber: customer.account_number || ''
      },

      services: services.map(s => ({
        id: s.id,
        package_name: s.package_name,
        service_type: s.service_type,
        status: s.status,
        monthly_price: s.monthly_price,
        installation_address: s.installation_address,
        speed_down: s.speed_down || 0,
        speed_up: s.speed_up || 0
      })),

      billing: billing ? {
        account_balance: billing.account_balance || 0,
        payment_method: primaryPaymentMethod?.payment_type || 'Not set',
        payment_status: (billing.account_balance || 0) > 0 ? 'overdue' : 'current',
        next_billing_date: nextBillingDate || '',
        days_overdue: overdueInvoices.length > 0 ?
          Math.max(...overdueInvoices.map(inv => {
            const dueDate = new Date(inv.due_date);
            const now = new Date();
            return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          })) : 0
      } : null,

      orders: orders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        total_amount: o.total_paid || 0,
        created_at: o.created_at
      })),

      invoices: invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        total_amount: inv.total_amount,
        amount_due: inv.amount_due,
        status: inv.status
      })),

      stats: {
        activeServices: activeServices.length,
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        overdueInvoices: overdueInvoices.length,
        accountBalance: billing?.account_balance || 0
      }
    };

    console.log('[Dashboard Summary API] ✅ Summary built successfully:', Date.now() - startTime, 'ms', `(${services.length} services, ${orders.length} orders, ${invoices.length} invoices)`);

    return NextResponse.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
