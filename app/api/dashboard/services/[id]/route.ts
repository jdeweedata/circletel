/**
 * Customer Service Detail API
 * GET /api/dashboard/services/[id]
 * 
 * Returns single service with historical usage data
 * Task 3.3: Service Dashboard API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/services/[id]
 * 
 * Returns:
 * - Full service details
 * - Historical usage data (last 90 days)
 * - Recent audit logs (last 10 actions)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get customer_id from auth_user_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Fetch service (verify ownership)
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('*')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .single();
    
    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Get historical usage data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: usageHistory } = await supabase
      .from('usage_history')
      .select('*')
      .eq('service_id', id)
      .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    // Get recent audit logs (last 10 actions)
    const { data: auditLogs } = await supabase
      .from('service_action_log')
      .select(`
        *,
        admin:admin_users(
          id,
          name,
          email
        )
      `)
      .eq('service_id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get active suspension (if any)
    const { data: activeSuspension } = await supabase
      .from('service_suspensions')
      .select('*')
      .eq('service_id', id)
      .is('reactivated_at', null)
      .order('suspended_at', { ascending: false })
      .limit(1)
      .single();
    
    return NextResponse.json({
      service,
      usage_history: usageHistory || [],
      recent_actions: auditLogs || [],
      active_suspension: activeSuspension || null
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
