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
import { apiLogger } from '@/lib/logging';

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
  apiLogger.info('[Dashboard Summary API] Request started');

  try {
    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let user: any = null;
    
    if (token) {
      // Use token from Authorization header
      apiLogger.info('[Dashboard Summary API] Using token from Authorization header');
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      
      if (tokenError || !tokenUser) {
        apiLogger.info('[Dashboard Summary API] Invalid token', { error: tokenError?.message });
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'Invalid or expired session token'
          },
          { status: 401 }
        );
      }
      
      user = tokenUser;
      apiLogger.info('[Dashboard Summary API] Token validated for user', { userId: user.id });
    } else {
      // Fall back to cookies (for SSR/middleware scenarios)
      apiLogger.info('[Dashboard Summary API] No Authorization header, checking cookies');
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
        apiLogger.info('[Dashboard Summary API] No session in cookies');
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            details: 'No session found. Please login again.'
          },
          { status: 401 }
        );
      }
      
      user = session.user;
      apiLogger.info('[Dashboard Summary API] Session from cookies for user', { userId: user.id });
    }

    apiLogger.info('[Dashboard Summary API] User authenticated', { durationMs: Date.now() - startTime, userId: user.id });

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();
    apiLogger.info('[Dashboard Summary API] Service role client created', { durationMs: Date.now() - startTime });

    // Get customer details using service role
    let { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone, account_number, account_status, created_at')
      .eq('auth_user_id', user.id)
      .single();

    apiLogger.info('[Dashboard Summary API] Customer fetched', { durationMs: Date.now() - startTime });

    // If customer doesn't exist, auto-create one from auth user data
    if (customerError || !customer) {
      apiLogger.info('[Dashboard Summary API] Customer not found, auto-creating for user', { userId: user.id });
      
      // Generate account number
      const accountNumber = `CT-${Date.now().toString().slice(-8)}`;
      
      // Create customer record from auth user data
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'Customer',
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          phone: user.user_metadata?.phone || user.phone || '',
          account_number: accountNumber,
          account_status: 'active',
          account_type: 'personal',
        })
        .select('id, first_name, last_name, email, phone, account_number, account_status, created_at')
        .single();
      
      if (createError || !newCustomer) {
        apiLogger.error('[Dashboard Summary API] Failed to create customer', { error: createError?.message });
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create customer profile. Please contact support.',
            technical_error: createError?.message
          },
          { status: 500 }
        );
      }
      
      apiLogger.info('[Dashboard Summary API] Customer auto-created', { customerId: newCustomer.id });
      customer = newCustomer;
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
        .limit(5),

      // Get snapshot from 30 days ago for trend calculation
      (async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const snapshotDate = thirtyDaysAgo.toISOString().split('T')[0];

        return supabase
          .from('customer_stats_snapshots')
          .select('*')
          .eq('customer_id', customer.id)
          .lte('snapshot_date', snapshotDate)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single();
      })()
    ]);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Dashboard summary queries timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let servicesResult, billingResult, ordersResult, invoicesResult, transactionsResult, snapshotResult;
    try {
      const results = await Promise.race([parallelQueriesPromise, timeoutPromise]);
      [servicesResult, billingResult, ordersResult, invoicesResult, transactionsResult, snapshotResult] = results;
      apiLogger.info('[Dashboard Summary API] All queries completed', { durationMs: Date.now() - startTime });
    } catch (timeoutError) {
      apiLogger.error('[Dashboard Summary API] Queries timeout', { durationMs: Date.now() - startTime });
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
    const oldSnapshot = snapshotResult?.data || null;

    // Helper function to calculate trend percentage
    const calculateTrend = (current: number, old: number | null | undefined, invertPositive = false) => {
      if (old === null || old === undefined) {
        // No historical data yet
        return { value: 0, isPositive: true, hasData: false };
      }
      if (old === 0) {
        // Avoid division by zero - show absolute change
        return {
          value: current > 0 ? 100 : 0,
          isPositive: invertPositive ? current <= 0 : current > 0,
          hasData: true
        };
      }
      const percentChange = Math.round(((current - old) / Math.abs(old)) * 100);
      return {
        value: Math.abs(percentChange),
        isPositive: invertPositive ? percentChange <= 0 : percentChange >= 0,
        hasData: true
      };
    };
    
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
        payment_method: primaryPaymentMethod?.method_type || 'Not set',
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
        activeServicesTrend: calculateTrend(activeServices.length, oldSnapshot?.active_services),
        totalOrders: orders.length,
        totalOrdersTrend: calculateTrend(orders.length, oldSnapshot?.total_orders),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        pendingOrdersTrend: calculateTrend(
          orders.filter(o => o.status === 'pending').length,
          oldSnapshot?.pending_orders,
          true // Fewer pending is positive
        ),
        overdueInvoices: overdueInvoices.length,
        overdueInvoicesTrend: calculateTrend(
          overdueInvoices.length,
          oldSnapshot?.overdue_invoices,
          true // Fewer overdue is positive
        ),
        accountBalance: billing?.account_balance || 0,
        accountBalanceTrend: calculateTrend(
          billing?.account_balance || 0,
          oldSnapshot?.account_balance,
          true // Lower balance (less owed) is positive
        )
      }
    };

    apiLogger.info('[Dashboard Summary API] Summary built successfully', { durationMs: Date.now() - startTime, servicesCount: services.length, ordersCount: orders.length, invoicesCount: invoices.length });

    return NextResponse.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    apiLogger.error('Unexpected error', { error });
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
