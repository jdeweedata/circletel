/**
 * Mandate Manual Confirmation API
 *
 * Manually confirms a debit-order mandate as active when NetCash webhook
 * is unreliable or delayed. Sets mandate_status='active' + verified flag.
 *
 * POST /api/admin/b2b/mandate-confirm
 * Body: { customerId: string }
 *
 * Requires admin auth + kyc:verify permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { maybeMarkBillingReady } from '@/lib/onboarding/billing-ready';
import { apiLogger } from '@/lib/logging/logger';

interface ConfirmMandateRequest {
  customerId: string;
}

interface ConfirmMandateResponse {
  success: boolean;
  billingReadyMarked?: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ConfirmMandateResponse>> {
  try {
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) return authResult.response as any;

    const perm = requirePermission(authResult.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm as any;

    const supabase = await createServerClient();

    const body = (await request.json()) as ConfirmMandateRequest;
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Find the debit-order payment method for this customer
    const { data: paymentMethod, error: pmError } = await supabase
      .from('customer_payment_methods')
      .select('id, encrypted_details')
      .eq('customer_id', customerId)
      .eq('method_type', 'debit_order')
      .maybeSingle();

    if (pmError) {
      apiLogger.error('Failed to fetch payment method', { error: pmError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment method' },
        { status: 500 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'No debit-order payment method found for customer' },
        { status: 404 }
      );
    }

    // Update payment method: set mandate_status='active', mark verified, set is_active=true
    const updatedDetails = {
      ...(typeof paymentMethod.encrypted_details === 'object'
        ? paymentMethod.encrypted_details
        : {}),
      verified: true,
    };

    const { error: updateError } = await supabase
      .from('customer_payment_methods')
      .update({
        mandate_status: 'active',
        encrypted_details: updatedDetails,
        is_active: true,
      })
      .eq('id', paymentMethod.id);

    if (updateError) {
      apiLogger.error('Failed to update payment method', { error: updateError });
      return NextResponse.json(
        { success: false, error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    // Try to mark customer billing_ready if all conditions are met
    const billingReadyMarked = await maybeMarkBillingReady(supabase, customerId);

    // Audit log
    apiLogger.info('[Admin] Mandate confirmed manually', {
      customerId,
      billingReadyMarked,
      adminId: authResult.adminUser.id,
    });

    return NextResponse.json({
      success: true,
      billingReadyMarked,
    });
  } catch (error: unknown) {
    apiLogger.error('API error', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
