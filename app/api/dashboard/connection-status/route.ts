/**
 * Customer Connection Status API
 * GET /api/dashboard/connection-status
 *
 * Returns real-time PPPoE connection status for the authenticated customer.
 * Uses Interstellio Telemetry API to check session status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getInterstellioClient } from '@/lib/interstellio';
import { apiLogger } from '@/lib/logging/logger';

interface ConnectionStatus {
  isConnected: boolean;
  ipAddress: string | null;
  sessionDuration: number | null; // seconds
  sessionStart: string | null; // ISO timestamp
  lastSeen: string | null;
  totalSessionsToday: number;
  terminateCauses: Record<string, number>;
  subscriberId: string | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user: { id: string } | null = null;

    if (token) {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);

      if (tokenError || !tokenUser) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      user = tokenUser;
    } else {
      const sessionClient = await createClientWithSession();
      const { data: { session }, error: authError } = await sessionClient.auth.getSession();

      if (authError || !session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      user = session.user;
    }

    // Get customer and their Interstellio subscriber ID
    const supabase = await createClient();

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        full_name,
        customer_services (
          id,
          interstellio_subscriber_id,
          status
        )
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Find active service with Interstellio subscriber
    const services = Array.isArray(customer.customer_services)
      ? customer.customer_services
      : customer.customer_services ? [customer.customer_services] : [];

    const activeService = services.find(
      (s: { status: string; interstellio_subscriber_id?: string }) =>
        s.status === 'active' && s.interstellio_subscriber_id
    );

    if (!activeService?.interstellio_subscriber_id) {
      // No Interstellio service - return unknown status
      const response: ConnectionStatus = {
        isConnected: false,
        ipAddress: null,
        sessionDuration: null,
        sessionStart: null,
        lastSeen: null,
        totalSessionsToday: 0,
        terminateCauses: {},
        subscriberId: null,
        error: 'No active internet service found'
      };
      return NextResponse.json(response);
    }

    // Query Interstellio for session status
    const interstellio = getInterstellioClient();

    try {
      const analysis = await interstellio.analyzeSessionStatus(
        activeService.interstellio_subscriber_id
      );

      const response: ConnectionStatus = {
        isConnected: analysis.isActive,
        ipAddress: analysis.lastSession?.calling_station_id || null,
        sessionDuration: analysis.lastSession?.duration || null,
        sessionStart: analysis.lastSession?.start_time || null,
        lastSeen: analysis.lastSession?.update_time || null,
        totalSessionsToday: analysis.totalSessionsToday,
        terminateCauses: analysis.terminateCauses,
        subscriberId: activeService.interstellio_subscriber_id
      };

      return NextResponse.json(response);

    } catch (interstellioError: unknown) {
      apiLogger.warn('Interstellio API error', {
        error: interstellioError instanceof Error ? interstellioError.message : 'Unknown error',
        subscriberId: activeService.interstellio_subscriber_id
      });

      // Return graceful degradation
      const response: ConnectionStatus = {
        isConnected: false,
        ipAddress: null,
        sessionDuration: null,
        sessionStart: null,
        lastSeen: null,
        totalSessionsToday: 0,
        terminateCauses: {},
        subscriberId: activeService.interstellio_subscriber_id,
        error: 'Unable to check connection status. Please try again.'
      };

      return NextResponse.json(response);
    }

  } catch (error) {
    apiLogger.error('Connection status API error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
