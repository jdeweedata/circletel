/**
 * Customer Usage Tracking API
 * GET /api/dashboard/usage
 * 
 * Returns usage data for a specific service
 * Task 3.6: Usage Tracking API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard/usage
 *
 * Query parameters:
 * - service_id: UUID (required)
 * - start_date: ISO date string (optional, defaults to current billing cycle start)
 * - end_date: ISO date string (optional, defaults to today)
 *
 * Returns:
 * - Daily usage records
 * - Aggregated totals (upload, download, total)
 * - Billing cycle information
 * - Usage percentage (for capped services)
 */
export async function GET(request: NextRequest) {
  try {
    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      // Use token from Authorization header
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
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
    } else {
      // Fall back to cookies (for SSR/middleware scenarios)
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
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
    }

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();

    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found'
        },
        { status: 404 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const service_id = searchParams.get('service_id');
    
    if (!service_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: service_id' },
        { status: 400 }
      );
    }
    
    // Verify service ownership
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('id', service_id)
      .eq('customer_id', customer.id)
      .single();
    
    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Determine date range
    let start_date = searchParams.get('start_date');
    let end_date = searchParams.get('end_date');
    
    // Default to current billing cycle
    if (!start_date) {
      start_date = service.last_billing_date || service.activation_date || new Date().toISOString().split('T')[0];
    }
    
    if (!end_date) {
      end_date = new Date().toISOString().split('T')[0];
    }
    
    // Fetch usage data
    const { data: usageRecords, error: usageError } = await supabase
      .from('usage_history')
      .select('*')
      .eq('service_id', service_id)
      .gte('date', start_date)
      .lte('date', end_date)
      .order('date', { ascending: true });
    
    if (usageError) {
      console.error('Error fetching usage data:', usageError);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }
    
    // Calculate totals
    const totals = (usageRecords || []).reduce((sum, record) => {
      return {
        upload_mb: sum.upload_mb + (record.upload_mb || 0),
        download_mb: sum.download_mb + (record.download_mb || 0),
        total_mb: sum.total_mb + (record.total_mb || 0)
      };
    }, { upload_mb: 0, download_mb: 0, total_mb: 0 });
    
    // Calculate usage percentage (for capped services)
    let usage_percentage = null;
    let data_cap_mb = null;
    
    if (service.data_cap && service.data_cap !== 'Unlimited') {
      // Parse data cap (e.g., "500GB" -> 500000 MB)
      const capMatch = service.data_cap.match(/(\d+)\s*(GB|MB)/i);
      if (capMatch) {
        const capValue = parseInt(capMatch[1]);
        const capUnit = capMatch[2].toUpperCase();
        data_cap_mb = capUnit === 'GB' ? capValue * 1024 : capValue;
        
        if (data_cap_mb > 0) {
          usage_percentage = Math.round((totals.total_mb / data_cap_mb) * 100);
        }
      }
    }
    
    // Get billing cycle dates
    const billing_cycle = {
      start: service.last_billing_date || service.activation_date,
      end: service.next_billing_date
    };
    
    return NextResponse.json({
      service: {
        id: service.id,
        package_name: service.package_name,
        data_cap: service.data_cap,
        data_cap_mb
      },
      date_range: {
        start: start_date,
        end: end_date
      },
      billing_cycle,
      usage_records: usageRecords || [],
      totals: {
        upload_mb: Math.round(totals.upload_mb * 100) / 100,
        download_mb: Math.round(totals.download_mb * 100) / 100,
        total_mb: Math.round(totals.total_mb * 100) / 100,
        upload_gb: Math.round((totals.upload_mb / 1024) * 100) / 100,
        download_gb: Math.round((totals.download_mb / 1024) * 100) / 100,
        total_gb: Math.round((totals.total_mb / 1024) * 100) / 100
      },
      usage_percentage,
      threshold_warnings: {
        warning_80: usage_percentage && usage_percentage >= 80,
        critical_95: usage_percentage && usage_percentage >= 95
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
