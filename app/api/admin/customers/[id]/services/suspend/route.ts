/**
 * Admin Service Suspension API
 * POST /api/admin/customers/[id]/services/suspend
 * 
 * Suspend an active service
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
    const { service_id, suspension_type, reason, notes, skip_billing } = body;
    
    if (!service_id || !suspension_type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: service_id, suspension_type, reason' },
        { status: 400 }
      );
    }
    
    // Validate suspension_type
    const validTypes = ['non_payment', 'customer_request', 'technical', 'fraud', 'policy_violation', 'other'];
    if (!validTypes.includes(suspension_type)) {
      return NextResponse.json(
        { error: `Invalid suspension_type. Must be one of: ${validTypes.join(', ')}` },
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
    
    const result = await ServiceManager.suspendService({
      service_id,
      admin_user_id: user.id,
      suspension_type,
      reason,
      notes,
      skip_billing
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to suspend service' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Service suspended successfully',
      service: result.service
    });
    
  } catch (error: any) {
    console.error('Service suspension failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
