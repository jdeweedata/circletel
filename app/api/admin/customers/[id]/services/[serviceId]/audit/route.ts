/**
 * Service Audit Log API
 * GET /api/admin/customers/[id]/services/[serviceId]/audit
 * 
 * Returns audit trail for a specific service
 * Task 3.5: Service Audit Log API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/customers/[id]/services/[serviceId]/audit
 * 
 * Returns:
 * - Complete audit log for the service
 * - Admin user details for each action
 * - Ordered chronologically (newest first)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customer_id, serviceId: service_id } = await context.params;
    
    // Get authenticated admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Check admin permissions (services:view_audit)
    
    // Verify service belongs to customer
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('id')
      .eq('id', service_id)
      .eq('customer_id', customer_id)
      .single();
    
    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Get audit logs with admin user details
    const { data: auditLogs, error: auditError } = await supabase
      .from('service_action_log')
      .select(`
        *,
        admin:admin_users(
          id,
          name,
          email
        )
      `)
      .eq('service_id', service_id)
      .order('created_at', { ascending: false });
    
    if (auditError) {
      console.error('Error fetching audit logs:', auditError);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }
    
    // Get suspension history
    const { data: suspensions } = await supabase
      .from('service_suspensions')
      .select('*')
      .eq('service_id', service_id)
      .order('suspended_at', { ascending: false });
    
    return NextResponse.json({
      audit_logs: auditLogs || [],
      suspension_history: suspensions || [],
      total_actions: auditLogs?.length || 0
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
