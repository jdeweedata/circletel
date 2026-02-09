/**
 * Customer Payment Method Detail API
 * PATCH /api/dashboard/payment-methods/[id] - Set as primary
 * DELETE /api/dashboard/payment-methods/[id] - Remove payment method
 * 
 * Task 2.6: Payment Method API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PaymentMethodService } from '@/lib/billing/payment-method-service';
import { paymentLogger } from '@/lib/logging/logger';

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
    const { id } = await context.params;

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
    paymentLogger.error('Error updating payment method', { error: error.message || error, id: (await context.params).id });
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
    const { id } = await context.params;

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

    // Remove payment method (soft delete)
    await PaymentMethodService.removePaymentMethod(id, customer.id);

    return NextResponse.json({
      message: 'Payment method removed successfully'
    });

  } catch (error: any) {
    paymentLogger.error('Error removing payment method', { error: error.message || error, id: (await context.params).id });

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
