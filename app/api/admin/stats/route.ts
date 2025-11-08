/**
 * Admin Stats API Route
 * GET /api/admin/stats - Fetch comprehensive dashboard statistics
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Use service role client to bypass RLS for admin stats
    const supabase = await createClient();

    // Fetch all stats in parallel for performance
    const [
      productsResult,
      quotesResult,
      ordersResult,
      customersResult,
      leadsResult
    ] = await Promise.all([
      // Products
      supabase.from('products').select('pricing, status'),

      // Business Quotes
      supabase.from('business_quotes').select('status, total_monthly, created_at'),

      // Orders
      supabase.from('consumer_orders').select('status, total_paid, created_at'),

      // Customers
      supabase.from('customers').select('id, created_at'),

      // Coverage Leads
      supabase.from('coverage_leads').select('id, created_at')
    ]);

    // Products stats
    const products = productsResult.data || [];
    const totalProducts = products.length;
    const activeProducts = products.filter((p: any) => p.status === 'active');
    const approvedProducts = activeProducts.length;
    const pendingProducts = products.filter((p: any) => p.status === 'pending').length;

    // Calculate product revenue potential
    const productRevenue = activeProducts.reduce((sum: number, p: any) => {
      const price = typeof p.pricing === 'object' && p.pricing !== null
        ? parseFloat(p.pricing.monthly?.toString() || '0')
        : 0;
      return sum + price;
    }, 0);

    // Quotes stats
    const quotes = quotesResult.data || [];
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q: any) => q.status === 'pending_approval').length;
    const acceptedQuotes = quotes.filter((q: any) => q.status === 'accepted').length;

    // Calculate quote revenue (accepted quotes only)
    const quoteRevenue = quotes
      .filter((q: any) => q.status === 'accepted')
      .reduce((sum: number, q: any) => sum + (parseFloat(q.total_monthly) || 0), 0);

    // Orders stats
    const orders = ordersResult.data || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
    const activeOrders = orders.filter((o: any) => o.status === 'active').length;

    // Calculate order revenue
    const orderRevenue = orders
      .filter((o: any) => o.status === 'active')
      .reduce((sum: number, o: any) => sum + (parseFloat(o.total_paid) || 0), 0);

    // Customers stats
    const customers = customersResult.data || [];
    const totalCustomers = customers.length;

    // New customers this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = customers.filter((c: any) =>
      new Date(c.created_at) >= startOfMonth
    ).length;

    // Coverage Leads stats
    const leads = leadsResult.data || [];
    const totalLeads = leads.length;

    // New leads this month
    const newLeadsThisMonth = leads.filter((l: any) =>
      new Date(l.created_at) >= startOfMonth
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
