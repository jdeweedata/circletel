import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EmailNotificationService } from '@/lib/notifications/notification-service';
import { AdminNotificationService } from '@/lib/notifications/admin-notifications';
import type { ConsumerOrder } from '@/lib/types/customer-journey';
import { notificationLogger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or orderNumber' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch the order
    let query = supabase
      .from('consumer_orders')
      .select('*');

    if (orderId) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderNumber);
    }

    const { data: order, error: fetchError } = await query.single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Send customer confirmation email
    const emailResult = await EmailNotificationService.sendOrderConfirmation(order as ConsumerOrder);

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error },
        { status: 500 }
      );
    }

    // Optionally send admin notifications too
    const adminResults = await AdminNotificationService.notifyNewOrder(order as ConsumerOrder);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      message_id: emailResult.message_id,
      customer_email: order.email,
      order_number: order.order_number,
      admin_notifications: {
        sales: adminResults.sales.success,
        serviceDelivery: adminResults.serviceDelivery.success
      }
    });
  } catch (error) {
    notificationLogger.error('Error sending order notification', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification'
      },
      { status: 500 }
    );
  }
}

