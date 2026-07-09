import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BusinessQuote {
  id: string;
  quote_number: string;
  company_name: string;
  amount: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  sales_rep: string | null;
}

interface SalesRepData {
  [key: string]: {
    dealsClosed: number;
    totalValue: number;
    totalQuotes: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all business quotes with status filtering
    const { data: quotes, error: quotesError } = await supabase
      .from('business_quotes')
      .select('id, quote_number, company_name, amount, status, created_at, updated_at, sales_rep')
      .order('updated_at', { ascending: false });

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return NextResponse.json(
        { error: 'Failed to fetch quotes' },
        { status: 500 }
      );
    }

    const allQuotes = (quotes || []) as BusinessQuote[];

    // Calculate KPIs
    const activeDeals = allQuotes.filter(
      (q) => q.status === 'pending_approval' || q.status === 'accepted'
    ).length;

    const acceptedQuotes = allQuotes.filter((q) => q.status === 'accepted');
    const pipelineValue = acceptedQuotes.reduce((sum, q) => sum + (q.amount || 0), 0);

    // Calculate win rate (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentQuotes = allQuotes.filter(
      (q) => new Date(q.created_at) >= ninetyDaysAgo
    );

    const acceptedCount = recentQuotes.filter((q) => q.status === 'accepted').length;
    const rejectedCount = recentQuotes.filter((q) => q.status === 'rejected').length;
    const winRate = (acceptedCount + rejectedCount) > 0
      ? (acceptedCount / (acceptedCount + rejectedCount)) * 100
      : 0;

    // Calculate average deal size
    const avgDealSize = acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum, q) => sum + (q.amount || 0), 0) / acceptedQuotes.length
      : 0;

    // Deal Pipeline (Prospects -> Proposals -> Accepted -> Completed)
    const prospects = allQuotes.filter((q) => q.status === 'pending_approval').length;
    const proposals = allQuotes.filter((q) => q.status === 'pending_approval').length;
    const accepted = acceptedQuotes.length;
    const completed = allQuotes.filter((q) => q.status === 'completed').length;

    const dealPipelineData = [
      { name: 'Prospects', value: Math.max(prospects, 1) },
      { name: 'Proposals', value: Math.max(proposals, 1) },
      { name: 'Accepted', value: Math.max(accepted, 1) },
      { name: 'Completed', value: Math.max(completed, 1) },
    ];

    // Quote Status Breakdown
    const statusCounts: { [key: string]: number } = {};
    const statusColors: { [key: string]: string } = {
      pending_approval: '#F59E0B',
      accepted: '#10B981',
      rejected: '#EF4444',
      expired: '#6B7280',
      completed: '#8B5CF6',
    };

    allQuotes.forEach((q) => {
      statusCounts[q.status] = (statusCounts[q.status] || 0) + 1;
    });

    const quoteStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value: count,
      color: statusColors[status] || '#E87A1E',
    }));

    // Monthly Sales Trend (last 6 months)
    const monthlySalesData: { [key: string]: number } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    allQuotes.forEach((q) => {
      if (q.amount && q.status === 'accepted' && new Date(q.created_at) >= sixMonthsAgo) {
        const date = new Date(q.created_at);
        const monthKey = date.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' });
        monthlySalesData[monthKey] = (monthlySalesData[monthKey] || 0) + q.amount;
      }
    });

    const monthlySalesChartData = Object.entries(monthlySalesData)
      .map(([month, sales]) => ({ month, sales }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Sales by Territory (using customer_name as placeholder if territory data not available)
    const territoryData: { [key: string]: number } = {};
    acceptedQuotes.forEach((q) => {
      const territory = q.company_name?.split(' ')[0] || 'Other';
      territoryData[territory] = (territoryData[territory] || 0) + (q.amount || 0);
    });

    const salesByTerritoryData = Object.entries(territoryData)
      .map(([territory, value]) => ({ territory, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Top Performers
    const salesRepStats: SalesRepData = {};
    allQuotes.forEach((q) => {
      const rep = q.sales_rep || 'Unassigned';
      if (!salesRepStats[rep]) {
        salesRepStats[rep] = { dealsClosed: 0, totalValue: 0, totalQuotes: 0 };
      }
      if (q.status === 'accepted') {
        salesRepStats[rep].dealsClosed += 1;
        salesRepStats[rep].totalValue += q.amount || 0;
      }
      salesRepStats[rep].totalQuotes += 1;
    });

    const topPerformers = Object.entries(salesRepStats)
      .map(([name, stats]) => ({
        name,
        dealsClosed: stats.dealsClosed,
        totalValue: stats.totalValue,
        conversionRate: stats.totalQuotes > 0
          ? (stats.dealsClosed / stats.totalQuotes) * 100
          : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    // Return all data
    return NextResponse.json({
      success: true,
      data: {
        activeDeals,
        pipelineValue,
        winRate,
        avgDealSize,
        quotes: allQuotes.slice(0, 20),
        topPerformers,
        dealPipelineData,
        quoteStatusData,
        monthlySalesData: monthlySalesChartData,
        salesByTerritoryData,
      },
    });
  } catch (error) {
    console.error('Error in sales dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
