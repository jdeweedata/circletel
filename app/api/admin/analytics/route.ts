import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Allow longer execution for aggregation
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();
    // Last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // 1. Fetch Data (Last 12 Months)
    const [ordersResult, quotesResult, customersResult] = await Promise.all([
      supabase
        .from('consumer_orders')
        .select('id, created_at, total_paid, status, payment_status')
        .gte('created_at', twelveMonthsAgo.toISOString()),
      supabase
        .from('business_quotes')
        .select('id, created_at, total_monthly, status')
        .gte('created_at', twelveMonthsAgo.toISOString()),
      supabase
        .from('customers')
        .select('id, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (quotesResult.error) throw quotesResult.error;
    if (customersResult.error) throw customersResult.error;

    // 2. Initialize Monthly Buckets
    const months: Record<string, { name: string; revenue: number; orders: number; customers: number }> = {};
    
    // Generate keys for last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        name: d.toLocaleDateString('en-US', { month: 'short' }), // e.g., "Nov"
        revenue: 0,
        orders: 0,
        customers: 0
      };
    }

    // 3. Aggregate Data
    
    // Orders Revenue & Count
    ordersResult.data.forEach(order => {
      const date = new Date(order.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key]) {
        months[key].orders += 1;
        
        // Calculate Revenue (Paid orders + Active orders with paid amounts)
        // Using total_paid is the most accurate tracking of cash flow
        if (order.total_paid > 0) {
             months[key].revenue += Number(order.total_paid);
        }
      }
    });

    // Business Quotes Revenue (Signed Value)
    // We add this to revenue to show "Deal Value" generated
    quotesResult.data.forEach(quote => {
      const date = new Date(quote.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key] && quote.status === 'accepted') {
        months[key].revenue += Number(quote.total_monthly) || 0;
      }
    });

    // Customer Acquisition
    customersResult.data.forEach(customer => {
      const date = new Date(customer.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key]) {
        months[key].customers += 1;
      }
    });

    // 4. Format for Recharts
    const history = Object.entries(months)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, data]) => data);

    // 5. Order Status Distribution (Snapshot of fetched orders)
    // Using the fetched 12-month window as "Recent Order Distribution"
    const orderStatusDistribution = ordersResult.data.reduce((acc: Record<string, number>, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const orderStatus = Object.entries(orderStatusDistribution)
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Format: "payment_pending" -> "Payment Pending"
        value
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending

    return NextResponse.json({
      success: true,
      data: {
        history,
        orderStatus,
        summary: {
          totalOrdersProcessed: ordersResult.data.length,
          totalRevenueGenerated: history.reduce((acc, curr) => acc + curr.revenue, 0),
          newCustomers: customersResult.data.length
        }
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
