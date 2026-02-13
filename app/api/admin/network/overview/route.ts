/**
 * Admin Network Overview API
 * GET /api/admin/network/overview
 *
 * Returns network health summary for admin dashboard:
 * - Provider status
 * - Active sessions count
 * - Recent connection events
 * - Open outages
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

interface ProviderHealth {
  provider_name: string;
  status: 'up' | 'degraded' | 'down' | 'maintenance' | 'unknown';
  latency_ms: number | null;
  checked_at: string | null;
}

interface NetworkOverview {
  providers: ProviderHealth[];
  activeSessionsCount: number;
  totalSubscribers: number;
  recentEvents: Array<{
    id: string;
    customer_id: string;
    customer_name?: string;
    event_type: string;
    terminate_cause: string | null;
    created_at: string;
  }>;
  openOutages: Array<{
    id: string;
    incident_number: string;
    title: string;
    severity: string;
    status: string;
    started_at: string;
    affected_customer_count: number;
  }>;
  stats: {
    eventsToday: number;
    disconnectsToday: number;
    avgLatency: number | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch provider health (latest status per provider)
    const { data: providerStatus } = await supabase
      .from('provider_status_logs')
      .select('provider_name, status, latency_ms, checked_at')
      .order('checked_at', { ascending: false })
      .limit(10);

    // Deduplicate to get latest per provider
    const providerMap = new Map<string, ProviderHealth>();
    const defaultProviders = ['interstellio', 'mtn', 'openserve'];

    defaultProviders.forEach(name => {
      providerMap.set(name, {
        provider_name: name,
        status: 'unknown',
        latency_ms: null,
        checked_at: null
      });
    });

    providerStatus?.forEach(p => {
      if (!providerMap.has(p.provider_name) ||
          (providerMap.get(p.provider_name)?.checked_at || '') < p.checked_at) {
        providerMap.set(p.provider_name, p as ProviderHealth);
      }
    });

    const providers = Array.from(providerMap.values());

    // Get recent connection events (last 20)
    const { data: recentEvents } = await supabase
      .from('customer_connection_logs')
      .select(`
        id,
        customer_id,
        event_type,
        terminate_cause,
        created_at,
        customers (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    const formattedEvents = (recentEvents || []).map(e => ({
      id: e.id,
      customer_id: e.customer_id,
      customer_name: Array.isArray(e.customers) ? e.customers[0]?.full_name : (e.customers as any)?.full_name,
      event_type: e.event_type,
      terminate_cause: e.terminate_cause,
      created_at: e.created_at
    }));

    // Get open outages
    const { data: openOutages } = await supabase
      .from('outage_incidents')
      .select('id, incident_number, title, severity, status, started_at, affected_customer_count')
      .neq('status', 'resolved')
      .order('started_at', { ascending: false })
      .limit(5);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: eventsToday } = await supabase
      .from('customer_connection_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { count: disconnectsToday } = await supabase
      .from('customer_connection_logs')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'disconnected')
      .gte('created_at', today.toISOString());

    // Calculate average latency from recent checks
    const { data: latencyData } = await supabase
      .from('provider_status_logs')
      .select('latency_ms')
      .not('latency_ms', 'is', null)
      .gte('checked_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .limit(100);

    const avgLatency = latencyData && latencyData.length > 0
      ? Math.round(latencyData.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / latencyData.length)
      : null;

    // Get subscriber counts from customer_services
    const { count: totalSubscribers } = await supabase
      .from('customer_services')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // For active sessions, we'd need to query Interstellio
    // For now, return the subscriber count as a proxy
    const activeSessionsCount = totalSubscribers || 0;

    const overview: NetworkOverview = {
      providers,
      activeSessionsCount,
      totalSubscribers: totalSubscribers || 0,
      recentEvents: formattedEvents,
      openOutages: openOutages || [],
      stats: {
        eventsToday: eventsToday || 0,
        disconnectsToday: disconnectsToday || 0,
        avgLatency
      }
    };

    return NextResponse.json(overview);

  } catch (error) {
    adminLogger.error('Network overview API error', { error });
    return NextResponse.json(
      { error: 'Failed to fetch network overview' },
      { status: 500 }
    );
  }
}
