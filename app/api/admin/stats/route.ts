/**
 * Admin Stats API Route
 * GET /api/admin/stats - Fetch comprehensive dashboard statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

interface ServicePackageRecord {
  price: number | string | null;
  status: string | null;
  active: boolean | null;
}

interface BusinessQuoteRecord {
  status: string | null;
  total_monthly: number | string | null;
  created_at: string | null;
}

interface ConsumerOrderRecord {
  status: string | null;
  total_paid: number | string | null;
  created_at: string | null;
}

interface CustomerRecord {
  id: string;
  created_at: string | null;
}

interface CoverageLeadRecord {
  id: string;
  created_at: string | null;
}

// Vercel configuration: Allow longer execution for stats aggregation
export const runtime = 'nodejs';
export const maxDuration = 15; // Allow up to 15 seconds for stats queries

export async function GET() {
  const startTime = Date.now();
  console.log('[Stats API] ⏱️ Request started');

  try {
    // Use service role client to bypass RLS for admin stats
    const supabase = await createClient();
    console.log('[Stats API] ⏱️ Supabase client created:', Date.now() - startTime, 'ms');

    // Fetch all stats in parallel for performance with timeout protection
    const QUERY_TIMEOUT = 10000; // 10 second timeout for all queries

    const queriesPromise = Promise.all([
      // Products (migrated to service_packages - Epic 1.6)
      supabase.from('service_packages').select('price, status, active'),

      // Business Quotes
      supabase.from('business_quotes').select('status, total_monthly, created_at'),

      // Orders
      supabase.from('consumer_orders').select('status, total_paid, created_at'),

      // Customers
      supabase.from('customers').select('id, created_at'),

      // Coverage Leads
      supabase.from('coverage_leads').select('id, created_at')
    ]);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Stats queries timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let productsResult, quotesResult, ordersResult, customersResult, leadsResult;
    try {
      [productsResult, quotesResult, ordersResult, customersResult, leadsResult] =
        await Promise.race([queriesPromise, timeoutPromise]);
      console.log('[Stats API] ⏱️ All queries completed:', Date.now() - startTime, 'ms');
    } catch (timeoutError) {
      console.error('[Stats API] ❌ Queries timeout:', Date.now() - startTime, 'ms');
      return NextResponse.json(
        {
          success: false,
          error: 'Stats loading is currently slow. Please try refreshing in a moment.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    // Products stats (service_packages schema - Epic 1.6)
    const products = (productsResult.data || []) as ServicePackageRecord[];
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'active' || p.active === true);
    const approvedProducts = activeProducts.length;
    const pendingProducts = products.filter((p) => p.status === 'pending' || p.status === 'draft').length;

    // Calculate product revenue potential
    // service_packages uses 'price' field (number) instead of 'pricing.monthly' (JSONB)
    const productRevenue = activeProducts.reduce((sum: number, p) => {
      const price = parseFloat(p.price?.toString() || '0');
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    // Quotes stats
    const quotes = (quotesResult.data || []) as BusinessQuoteRecord[];
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q) => q.status === 'pending_approval').length;
    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length;

    // Calculate quote revenue (accepted quotes only)
    const quoteRevenue = quotes
      .filter((q) => q.status === 'accepted')
      .reduce((sum: number, q) => sum + (parseFloat(String(q.total_monthly)) || 0), 0);

    // Orders stats
    const orders = (ordersResult.data || []) as ConsumerOrderRecord[];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const activeOrders = orders.filter((o) => o.status === 'active').length;

    // Calculate order revenue
    const orderRevenue = orders
      .filter((o) => o.status === 'active')
      .reduce((sum: number, o) => sum + (parseFloat(String(o.total_paid)) || 0), 0);

    // Customers stats
    const customers = (customersResult.data || []) as CustomerRecord[];
    const totalCustomers = customers.length;

    // New customers this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = customers.filter((c) =>
      c.created_at ? new Date(c.created_at) >= startOfMonth : false
    ).length;

    // Coverage Leads stats
    const leads = (leadsResult.data || []) as CoverageLeadRecord[];
    const totalLeads = leads.length;

    // New leads this month
    const newLeadsThisMonth = leads.filter((l) =>
      l.created_at ? new Date(l.created_at) >= startOfMonth : false
    ).length;

    // Total revenue (orders + quotes)
    const totalRevenue = orderRevenue + quoteRevenue;

    const stats = {
      // Products
      totalProducts,
      approvedProducts,
      pendingProducts,
      productRevenue: Math.round(productRevenue),

      // Quotes
      totalQuotes,
      pendingQuotes,
      acceptedQuotes,
      quoteRevenue: Math.round(quoteRevenue),

      // Orders
      totalOrders,
      pendingOrders,
      activeOrders,
      orderRevenue: Math.round(orderRevenue),

      // Customers
      totalCustomers,
      newCustomersThisMonth,

      // Leads
      totalLeads,
      newLeadsThisMonth,

      // Overall
      totalRevenue: Math.round(totalRevenue),
      pendingApprovals: pendingProducts + pendingQuotes,

      lastUpdated: new Date().toISOString()
    };

    console.log('[Stats API] ⏱️ Total request time:', Date.now() - startTime, 'ms');
    console.log(`✅ Stats calculated successfully: ${totalOrders} orders, ${totalCustomers} customers`);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
