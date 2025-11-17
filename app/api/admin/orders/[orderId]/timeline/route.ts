import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'communication' | 'installation' | 'payment';
  timestamp: string;
  title: string;
  description?: string;
  details: Record<string, any>;
  icon?: string;
}

/**
 * GET /api/admin/orders/[orderId]/timeline
 * Returns complete timeline of order events including:
 * - Status changes
 * - Communications (email/SMS/WhatsApp)
 * - Installation updates
 * - Payment events
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('id, order_number, status, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const timeline: TimelineEvent[] = [];

    // 1. Fetch status history (using existing table structure)
    const { data: statusHistory, error: statusError } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('entity_id', orderId)
      .eq('entity_type', 'consumer_order')
      .order('created_at', { ascending: true });

    if (statusError) {
      console.error('Error fetching status history:', statusError);
    } else if (statusHistory) {
      statusHistory.forEach((change) => {
        timeline.push({
          id: change.id,
          type: 'status_change',
          timestamp: change.status_changed_at || change.created_at,
          title: `Status changed to ${change.new_status}`,
          description: change.change_reason || change.notes,
          details: {
            fromStatus: change.old_status,
            toStatus: change.new_status,
            changedBy: 'Admin', // TODO: Get from changed_by FK
            automated: change.automated,
            customerNotified: change.customer_notified,
          },
          icon: 'status',
        });
      });
    }

    // 2. Fetch communications
    const { data: communications, error: commError } = await supabase
      .from('order_communications')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (commError) {
      console.error('Error fetching communications:', commError);
    } else if (communications) {
      communications.forEach((comm) => {
        let title = '';
        switch (comm.type) {
          case 'email':
            title = `Email sent: ${comm.subject || 'Notification'}`;
            break;
          case 'sms':
            title = 'SMS sent';
            break;
          case 'whatsapp':
            title = 'WhatsApp message sent';
            break;
          case 'call':
            title = 'Phone call logged';
            break;
          case 'internal_note':
            title = 'Internal note added';
            break;
          default:
            title = 'System notification';
        }

        timeline.push({
          id: comm.id,
          type: 'communication',
          timestamp: comm.created_at,
          title,
          description: comm.message,
          details: {
            type: comm.type,
            channel: comm.channel,
            status: comm.status,
            recipient: comm.recipient_email || comm.recipient_phone || comm.recipient_name,
            templateName: comm.template_name,
            sentAt: comm.sent_at,
            deliveredAt: comm.delivered_at,
            failedAt: comm.failed_at,
            failureReason: comm.failure_reason,
          },
          icon: comm.type,
        });
      });
    }

    // 3. Fetch installation tasks
    const { data: installations, error: installError } = await supabase
      .from('installation_tasks')
      .select(`
        *,
        technician:technicians(name, phone, email)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (installError) {
      console.error('Error fetching installations:', installError);
    } else if (installations) {
      installations.forEach((task) => {
        // Installation scheduled event
        timeline.push({
          id: `${task.id}-scheduled`,
          type: 'installation',
          timestamp: task.created_at,
          title: 'Installation scheduled',
          description: `Scheduled for ${task.scheduled_date}${
            task.scheduled_time_slot ? ` (${task.scheduled_time_slot})` : ''
          }`,
          details: {
            taskId: task.id,
            scheduledDate: task.scheduled_date,
            timeSlot: task.scheduled_time_slot,
            technician: task.technician?.name,
            status: task.status,
          },
          icon: 'calendar',
        });

        // Installation started event
        if (task.started_at) {
          timeline.push({
            id: `${task.id}-started`,
            type: 'installation',
            timestamp: task.started_at,
            title: 'Installation started',
            description: `Technician ${task.technician?.name || 'assigned'} started installation`,
            details: {
              taskId: task.id,
              technician: task.technician?.name,
            },
            icon: 'tool',
          });
        }

        // Installation completed event
        if (task.completed_at) {
          timeline.push({
            id: `${task.id}-completed`,
            type: 'installation',
            timestamp: task.completed_at,
            title: 'Installation completed',
            description: task.technician_notes,
            details: {
              taskId: task.id,
              technician: task.technician?.name,
              duration: task.actual_duration_minutes,
              equipmentInstalled: task.equipment_installed,
              routerModel: task.router_model,
              routerSerial: task.router_serial,
              customerRating: task.customer_rating,
              customerFeedback: task.customer_feedback,
            },
            icon: 'check',
          });
        }
      });
    }

    // 4. Add order creation event
    timeline.unshift({
      id: `${order.id}-created`,
      type: 'status_change',
      timestamp: order.created_at,
      title: 'Order created',
      description: `Order ${order.order_number} was created`,
      details: {
        orderNumber: order.order_number,
        initialStatus: order.status,
      },
      icon: 'create',
    });

    // Sort timeline by timestamp (ascending - oldest first)
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.order_number,
          currentStatus: order.status,
        },
        timeline,
        stats: {
          totalEvents: timeline.length,
          statusChanges: timeline.filter((e) => e.type === 'status_change').length,
          communications: timeline.filter((e) => e.type === 'communication').length,
          installationEvents: timeline.filter((e) => e.type === 'installation').length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching order timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
