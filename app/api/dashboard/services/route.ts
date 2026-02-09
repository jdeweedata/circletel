/**
 * Customer Services API - List Endpoint
 * GET /api/dashboard/services
 *
 * Returns customer's services with current usage data
 * Task 3.3: Service Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

// Vercel configuration: Allow longer execution for services with usage data
export const runtime = 'nodejs';
export const maxDuration = 20; // Allow up to 20 seconds for complex usage calculations

/**
 * GET /api/dashboard/services
 *
 * Returns:
 * - List of customer's services
 * - Current billing cycle usage (if available)
 * - Calculated percentUsed for capped services
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  apiLogger.info('[Customer Services API] Request started');

  try {
    // Check Authorization header first (for client-side fetch requests)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: any = null;

    if (token) {
      // Use token from Authorization header
      apiLogger.info('[Customer Services API] Using token from Authorization header');
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
        apiLogger.info('[Customer Services API] Invalid token', { error: tokenError?.message });
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
      apiLogger.info('[Customer Services API] Token validated for user', { userId: user.id });
    } else {
      // Fall back to cookies (for SSR/middleware scenarios)
      apiLogger.info('[Customer Services API] No Authorization header, checking cookies');
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
        apiLogger.info('[Customer Services API] No session in cookies');
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
      apiLogger.info('[Customer Services API] Session from cookies for user', { userId: user.id });
    }

    apiLogger.info('[Customer Services API] User authenticated', { durationMs: Date.now() - startTime, userId: user.id });

    // Use service role client for database queries to bypass RLS
    const supabase = await createClient();
    apiLogger.info('[Customer Services API] Service role client created', { durationMs: Date.now() - startTime });

    // Get customer_id from auth_user_id using service role
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      apiLogger.error('[Customer Services API] Customer not found for user', { userId: user.id, error: customerError?.message });
      return NextResponse.json(
        {
          success: false,
          error: 'Customer record not found. Please contact support.',
          technical_error: customerError?.message
        },
        { status: 404 }
      );
    }
    
    // Fetch services with timeout protection
    const QUERY_TIMEOUT = 15000; // 15 second timeout
    const servicesQueryPromise = supabase
      .from('customer_services')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Customer services query timeout - Database may be experiencing issues'));
      }, QUERY_TIMEOUT);
    });

    let services, servicesError;
    try {
      const result = await Promise.race([servicesQueryPromise, timeoutPromise]);
      services = result.data;
      servicesError = result.error;
      apiLogger.info('[Customer Services API] Services query completed', { durationMs: Date.now() - startTime, servicesCount: services?.length || 0 });
    } catch (timeoutError) {
      apiLogger.error('[Customer Services API] Services query timeout', { durationMs: Date.now() - startTime });
      return NextResponse.json(
        {
          success: false,
          error: 'Services query is taking too long. Please try again.',
          technical_error: 'QUERY_TIMEOUT'
        },
        { status: 503 }
      );
    }

    if (servicesError) {
      apiLogger.error('Error fetching services', { error: servicesError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // For each service, get current billing cycle usage (with timeout protection)
    const servicesWithUsage = await Promise.all(
      (services || []).map(async (service) => {
        // Get current billing cycle dates
        const cycleStart = service.last_billing_date || service.activation_date;
        const cycleEnd = service.next_billing_date;
        
        if (!cycleStart || !cycleEnd) {
          return {
            ...service,
            current_usage: null
          };
        }
        
        // Get usage data for current cycle
        const { data: usageData } = await supabase
          .from('usage_history')
          .select('upload_mb, download_mb, total_mb')
          .eq('service_id', service.id)
          .gte('date', cycleStart)
          .lte('date', cycleEnd);
        
        // Calculate totals
        const totalUsage = usageData?.reduce((sum, record) => {
          return {
            upload: sum.upload + (record.upload_mb || 0),
            download: sum.download + (record.download_mb || 0),
            total: sum.total + (record.total_mb || 0)
          };
        }, { upload: 0, download: 0, total: 0 });
        
        // Calculate percentage used (for capped services)
        let percentUsed = null;
        if (service.data_cap && service.data_cap !== 'Unlimited') {
          // Parse data cap (e.g., "500GB" -> 500000 MB)
          const capMatch = service.data_cap.match(/(\d+)\s*(GB|MB)/i);
          if (capMatch) {
            const capValue = parseInt(capMatch[1]);
            const capUnit = capMatch[2].toUpperCase();
            const capInMB = capUnit === 'GB' ? capValue * 1024 : capValue;
            
            if (totalUsage && capInMB > 0) {
              percentUsed = Math.round((totalUsage.total / capInMB) * 100);
            }
          }
        }
        
        return {
          ...service,
          current_usage: totalUsage || null,
          percent_used: percentUsed,
          billing_cycle: {
            start: cycleStart,
            end: cycleEnd
          }
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      data: servicesWithUsage
    });
    
  } catch (error) {
    apiLogger.error('Unexpected error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
