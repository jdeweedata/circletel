/**
 * Admin Service Activation API
 * POST /api/admin/customers/[id]/services/activate
 * 
 * Activate a pending service
 * Task 3.2: Admin Service Control API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ServiceManager } from '@/lib/services/service-manager';

/**
 * POST /api/admin/customers/[id]/services/activate
 * 
 * Body:
 * {
 *   service_id: string (required),
 *   reason: string (required),
 *   notes: string (optional),
 *   activation_date: string (optional, ISO date)
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customer_id } = await context.params;
    
    // Get authenticated admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Check admin permissions (services:activate)
    // For now, assume service_role or authenticated user is admin
    
    // Parse request body
    const body = await request.json();
    const { service_id, reason, notes, activation_date } = body;
    
    // Validate required fields
    if (!service_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: service_id, reason' },
        { status: 400 }
      );
    }
    
    // Verify service belongs to customer
    const { data: service, error: serviceError } = await supabase
      .from('customer_services')
      .select('customer_id')
      .eq('id', service_id)
      .single();
    
    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    if (service.customer_id !== customer_id) {
      return NextResponse.json(
        { error: 'Service does not belong to this customer' },
        { status: 400 }
      );
    }
    
    // Activate service
    const result = await ServiceManager.activateService({
      service_id,
      admin_user_id: user.id,
      reason,
      notes,
      activation_date: activation_date ? new Date(activation_date) : undefined
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to activate service' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Service activated successfully',
      service: result.service,
      invoice: result.invoice,
      balance_updated: result.balance_updated
    });
    
  } catch (error: any) {
    console.error('Service activation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
