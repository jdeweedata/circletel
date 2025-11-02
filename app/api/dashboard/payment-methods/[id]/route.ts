/**
 * Customer Payment Method Detail API
 * PATCH /api/dashboard/payment-methods/[id] - Set as primary
 * DELETE /api/dashboard/payment-methods/[id] - Remove payment method
 * 
 * Task 2.6: Payment Method API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';

/**
 * PATCH /api/dashboard/payment-methods/[id]
 * 
 * Set payment method as primary
 * 
 * Body:
 * {
 *   is_primary: true
 * }
 */
export async function PATCH(
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
    
    // Parse request body
    const body = await request.json();
    const { is_primary } = body;
    
    if (is_primary !== true) {
      return NextResponse.json(
        { error: 'Only is_primary: true is supported for PATCH' },
        { status: 400 }
      );
    }
    
    // Set as primary
    await PaymentMethodService.setPrimaryMethod(id, customer.id);
    
    return NextResponse.json({
      message: 'Payment method set as primary successfully'
    });
    
  } catch (error: any) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/payment-methods/[id]
 * 
 * Soft delete payment method
 * 
 * Restrictions:
 * - Cannot delete primary method with outstanding balance
 */
export async function DELETE(
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
    
    // Remove payment method (soft delete)
    await PaymentMethodService.removePaymentMethod(id, customer.id);
    
    return NextResponse.json({
      message: 'Payment method removed successfully'
    });
    
  } catch (error: any) {
    console.error('Error removing payment method:', error);
    
    // Check for specific error messages
    if (error.message.includes('outstanding balance')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
