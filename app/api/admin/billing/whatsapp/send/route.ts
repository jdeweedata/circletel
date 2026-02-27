/**
 * Admin WhatsApp Send API
 *
 * Sends a WhatsApp PayNow notification for a specific invoice.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WhatsAppPayNowService } from '@/lib/billing/whatsapp-paynow-service';
import { apiLogger } from '@/lib/logging';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id, notification_type = 'invoice_payment', days_overdue = 0 } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'invoice_id is required' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['invoice_payment', 'payment_reminder', 'debit_failed'];
    if (!validTypes.includes(notification_type)) {
      return NextResponse.json(
        { error: 'Invalid notification_type' },
        { status: 400 }
      );
    }

    // Get admin user from session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin permission
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role_id')
      .eq('id', user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    apiLogger.info('[Admin WhatsApp] Sending notification', {
      invoiceId: invoice_id,
      notificationType: notification_type,
      adminId: adminUser.id,
    });

    // Send WhatsApp notification
    const result = await WhatsAppPayNowService.sendPayNowWhatsApp(
      invoice_id,
      notification_type,
      {
        daysOverdue: days_overdue,
        createdBy: `admin:${adminUser.id}`,
      }
    );

    if (result.success) {
      apiLogger.info('[Admin WhatsApp] Sent successfully', {
        invoiceId: invoice_id,
        invoiceNumber: result.invoiceNumber,
        messageId: result.messageId,
      });

      return NextResponse.json({
        success: true,
        invoice_number: result.invoiceNumber,
        message_id: result.messageId,
        wa_id: result.waId,
      });
    } else {
      apiLogger.error('[Admin WhatsApp] Send failed', {
        invoiceId: invoice_id,
        error: result.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send WhatsApp notification',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Admin WhatsApp] Error', { error: errorMsg });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
