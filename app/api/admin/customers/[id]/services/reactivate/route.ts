/**
 * Admin Service Reactivation API
 * POST /api/admin/customers/[id]/services/reactivate
 * 
 * Reactivate a suspended service
 * Task 3.2: Admin Service Control API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ServiceManager } from '@/lib/services/service-manager';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: customer_id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { service_id, reason, notes } = body;
    
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
    
    if (serviceError || !service || service.customer_id !== customer_id) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    
    const result = await ServiceManager.reactivateService({
      service_id,
      admin_user_id: user.id,
      reason,
      notes
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reactivate service' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Service reactivated successfully',
      service: result.service,
      invoice: result.invoice,
      balance_updated: result.balance_updated
    });
    
  } catch (error: any) {
    console.error('Service reactivation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
