import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/quotes/business/admin/analytics
 *
 * Get quote analytics and statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // TODO: Verify admin permissions

    // Get query params for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build base query
    let query = supabase.from('business_quotes').select('status, total_monthly, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: quotes, error: quotesError } = await query;

    if (quotesError) {
      console.error('Analytics fetch error:', quotesError);
      return NextResponse.json(
        {
          success: false,
          error: quotesError.message || 'Failed to fetch analytics'
        },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalQuotes = quotes?.length || 0;
    const quotesByStatus = quotes?.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const acceptedQuotes = quotes?.filter(q => q.status === 'accepted') || [];
    const totalAcceptedValue = acceptedQuotes.reduce((sum, q) => sum + (q.total_monthly || 0), 0);
    const averageQuoteValue = acceptedQuotes.length > 0
      ? totalAcceptedValue / acceptedQuotes.length
      : 0;

    // Calculate conversion rate
    const sentQuotes = quotes?.filter(q =>
      ['sent', 'viewed', 'accepted', 'rejected', 'expired'].includes(q.status)
    ).length || 0;
    const conversionRate = sentQuotes > 0
      ? (acceptedQuotes.length / sentQuotes) * 100
      : 0;

    // Calculate average time to accept (using updated_at as proxy for acceptance time)
    const acceptanceTimes = acceptedQuotes
      .filter(q => q.created_at)
      .map(q => {
        const created = new Date(q.created_at).getTime();
        const now = new Date().getTime();
        return (now - created) / (1000 * 60 * 60 * 24); // Days
      });

    const averageTimeToSign = acceptanceTimes.length > 0
      ? acceptanceTimes.reduce((sum, time) => sum + time, 0) / acceptanceTimes.length
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        total_quotes: totalQuotes,
        quotes_by_status: quotesByStatus,
        accepted_quotes: acceptedQuotes.length,
        total_accepted_value: totalAcceptedValue,
        average_quote_value: averageQuoteValue,
        conversion_rate: conversionRate,
        average_time_to_sign_days: averageTimeToSign,
        period: {
          start_date: startDate || null,
          end_date: endDate || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics'
      },
      { status: 500 }
    );
  }
}
