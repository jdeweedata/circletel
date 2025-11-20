/**
 * ZOHO Billing Sync Retry API
 *
 * POST /api/admin/zoho-sync/retry
 *
 * Manually retry a failed sync operation
 *
 * Request body:
 * {
 *   "entity_type": "customer" | "subscription" | "invoice" | "payment",
 *   "entity_id": "uuid"
 * }
 *
 * @module app/api/admin/zoho-sync/retry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncCustomerToZohoBilling } from '@/lib/integrations/zoho/customer-sync-service';
import { syncSubscriptionToZohoBilling } from '@/lib/integrations/zoho/subscription-sync-service';
import { syncInvoiceToZohoBilling } from '@/lib/integrations/zoho/invoice-sync-service';
import { syncPaymentToZohoBilling } from '@/lib/integrations/zoho/payment-sync-service';

/**
 * POST /api/admin/zoho-sync/retry
 *
 * Manually retry failed sync
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { entity_type, entity_id } = body;

    // Validate input
    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type and entity_id' },
        { status: 400 }
      );
    }

    const validEntityTypes = ['customer', 'subscription', 'invoice', 'payment'];
    if (!validEntityTypes.includes(entity_type)) {
      return NextResponse.json(
        { error: `Invalid entity_type. Must be one of: ${validEntityTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Trigger appropriate sync service
    let result;

    console.log(`[Manual Retry] Starting sync for ${entity_type}: ${entity_id}`);

    switch (entity_type) {
      case 'customer':
        result = await syncCustomerToZohoBilling(entity_id);
        break;

      case 'subscription':
        result = await syncSubscriptionToZohoBilling(entity_id);
        break;

      case 'invoice':
        result = await syncInvoiceToZohoBilling(entity_id);
        break;

      case 'payment':
        result = await syncPaymentToZohoBilling(entity_id);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    if (result.success) {
      console.log(`[Manual Retry] Success:`, result);

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${entity_type}`,
        data: {
          entity_type,
          entity_id,
          zoho_id: result.zoho_customer_id || result.zoho_subscription_id ||
                   result.zoho_invoice_id || result.zoho_payment_id
        }
      });
    } else {
      console.error(`[Manual Retry] Failed:`, result.error);

      return NextResponse.json({
        success: false,
        message: `Failed to sync ${entity_type}`,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('ZOHO sync retry API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
