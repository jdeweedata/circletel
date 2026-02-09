/**
 * Business Dashboard Summary API
 *
 * GET /api/business-dashboard/summary - Get aggregated dashboard data
 *
 * @module app/api/business-dashboard/summary/route
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BusinessJourneyService } from '@/lib/business/journey-service';
import { apiLogger } from '@/lib/logging/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business customer record
    const { data: businessCustomer, error: customerError } = await supabase
      .from('business_customers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') {
      apiLogger.error('Error fetching business customer', { error: customerError });
    }

    // If no business customer found, return minimal data
    if (!businessCustomer) {
      return NextResponse.json({
        success: true,
        data: {
          businessCustomer: null,
          journey: null,
          stats: {
            activeServices: 0,
            pendingQuotes: 0,
            openTickets: 0,
            unpaidInvoices: 0,
          },
          recentActivity: [],
        },
      });
    }

    // Get journey status
    const journey = await BusinessJourneyService.getJourneyStatus(businessCustomer.id);

    // Get stats
    const [quotesResult, servicesResult, ticketsResult, invoicesResult] = await Promise.all([
      // Pending quotes count
      supabase
        .from('business_quotes')
        .select('id', { count: 'exact', head: true })
        .eq('customer_email', businessCustomer.primary_contact_email)
        .in('status', ['draft', 'pending', 'sent']),

      // Active services count
      supabase
        .from('customer_services')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', businessCustomer.id)
        .eq('status', 'active'),

      // Open tickets count
      supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', businessCustomer.id)
        .in('status', ['open', 'pending', 'in_progress']),

      // Unpaid invoices count
      supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', businessCustomer.id)
        .in('status', ['pending', 'overdue']),
    ]);

    // Get recent activity (last 10 items from various sources)
    const { data: recentQuotes } = await supabase
      .from('business_quotes')
      .select('id, quote_number, status, created_at')
      .eq('customer_email', businessCustomer.primary_contact_email)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: recentJourneyStages } = await supabase
      .from('business_journey_stages')
      .select('id, stage, status, updated_at')
      .eq('business_customer_id', businessCustomer.id)
      .order('updated_at', { ascending: false })
      .limit(3);

    // Combine and format recent activity
    const recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: string;
    }> = [];

    recentQuotes?.forEach((quote) => {
      recentActivity.push({
        id: `quote-${quote.id}`,
        type: 'quote',
        title: `Quote ${quote.quote_number}`,
        description: `Status: ${quote.status}`,
        timestamp: quote.created_at,
      });
    });

    recentJourneyStages?.forEach((stage) => {
      if (stage.status !== 'pending') {
        recentActivity.push({
          id: `journey-${stage.id}`,
          type: 'journey',
          title: `Journey: ${stage.stage.replace('_', ' ')}`,
          description: `Status: ${stage.status}`,
          timestamp: stage.updated_at,
        });
      }
    });

    // Sort by timestamp
    recentActivity.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: {
        businessCustomer: {
          id: businessCustomer.id,
          company_name: businessCustomer.company_name,
          account_number: businessCustomer.account_number,
          account_status: businessCustomer.account_status,
          kyc_status: businessCustomer.kyc_status,
          primary_contact_name: businessCustomer.primary_contact_name,
          primary_contact_email: businessCustomer.primary_contact_email,
        },
        journey,
        stats: {
          activeServices: servicesResult.count || 0,
          pendingQuotes: quotesResult.count || 0,
          openTickets: ticketsResult.count || 0,
          unpaidInvoices: invoicesResult.count || 0,
        },
        recentActivity: recentActivity.slice(0, 10),
      },
    });
  } catch (error) {
    apiLogger.error('Error fetching business dashboard summary', { error });
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
