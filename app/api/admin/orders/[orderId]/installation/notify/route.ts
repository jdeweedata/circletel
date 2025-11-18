import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ClickatellService } from '@/lib/integrations/clickatell/sms-service';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';

// Vercel configuration
export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * POST /api/admin/orders/[orderId]/installation/notify
 * Send installation reminder to customer via SMS and Email
 */
export async function POST(
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
    const supabase = await createClient();
    const body = await request.json();
    const { channels = ['sms', 'email'] } = body; // Which channels to use

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('consumer_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get installation task details
    const { data: installation, error: installError } = await supabase
      .from('installation_tasks')
      .select(`
        *,
        technician:technicians(id, name, phone)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (installError) {
      console.error('Error fetching installation task:', installError);
    }

    if (!installation || !installation.scheduled_date) {
      return NextResponse.json(
        { success: false, error: 'No installation scheduled for this order' },
        { status: 400 }
      );
    }

    const results = {
      sms: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // Format date and time
    const scheduledDate = new Date(installation.scheduled_date);
    const dateStr = scheduledDate.toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeSlotMap: Record<string, string> = {
      morning: '8:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 5:00 PM',
      full_day: '8:00 AM - 5:00 PM',
    };
    const timeStr = timeSlotMap[installation.scheduled_time_slot] || installation.scheduled_time_slot;

    // Send SMS if requested
    if (channels.includes('sms')) {
      try {
        const clickatell = new ClickatellService();

        let smsText = `Hi ${order.first_name}, CircleTel installation reminder: ${dateStr}, ${timeStr}.`;

        if (installation.technician) {
          smsText += ` Technician: ${installation.technician.name} (${installation.technician.phone}).`;
        }

        smsText += ` Order: ${order.order_number}. Please ensure someone 18+ is present.`;

        const smsResult = await clickatell.sendSMS({
          to: order.phone,
          text: smsText,
        });

        results.sms.sent = smsResult.success;
        if (!smsResult.success) {
          results.sms.error = smsResult.error || 'Unknown error';
        }
      } catch (smsError: any) {
        console.error('Failed to send SMS:', smsError);
        results.sms.error = smsError.message;
      }
    }

    // Send Email if requested
    if (channels.includes('email')) {
      try {
        const emailResult = await EnhancedEmailService.sendEmail({
          to: order.email,
          templateId: 'installation_reminder',
          props: {
            customerName: `${order.first_name} ${order.last_name}`,
            orderNumber: order.order_number,
            installationDate: dateStr,
            installationTime: timeStr,
            technicianName: installation.technician?.name || 'TBD',
            technicianPhone: installation.technician?.phone || 'TBD',
            installationAddress: order.installation_address,
            packageName: order.package_name,
          },
          orderId: order.id,
          customerId: order.customer_id,
        });

        results.email.sent = emailResult.success;
        if (!emailResult.success) {
          results.email.error = emailResult.error || 'Unknown error';
        }
      } catch (emailError: any) {
        console.error('Failed to send email:', emailError);
        results.email.error = emailError.message;
      }
    }

    // Log communication
    try {
      const communications = [];

      if (channels.includes('sms')) {
        communications.push({
          order_id: orderId,
          type: 'sms',
          channel: 'sms',
          recipient: order.phone,
          subject: 'Installation Reminder',
          content: `SMS reminder sent for installation on ${dateStr}`,
          status: results.sms.sent ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: {
            scheduled_date: installation.scheduled_date,
            time_slot: installation.scheduled_time_slot,
            technician_id: installation.technician_id,
          },
        });
      }

      if (channels.includes('email')) {
        communications.push({
          order_id: orderId,
          type: 'email',
          channel: 'email',
          recipient: order.email,
          subject: 'Installation Reminder',
          content: `Email reminder sent for installation on ${dateStr}`,
          status: results.email.sent ? 'delivered' : 'failed',
          sent_at: new Date().toISOString(),
          metadata: {
            template: 'installation_reminder',
            scheduled_date: installation.scheduled_date,
            time_slot: installation.scheduled_time_slot,
          },
        });
      }

      if (communications.length > 0) {
        await supabase.from('order_communications').insert(communications);
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log communication:', logError);
    }

    // Return results
    const sentChannels = [];
    if (results.sms.sent) sentChannels.push('SMS');
    if (results.email.sent) sentChannels.push('Email');

    const success = sentChannels.length > 0;

    return NextResponse.json({
      success,
      data: {
        sms: results.sms,
        email: results.email,
        sentChannels,
        installationDate: dateStr,
        installationTime: timeStr,
      },
      message: success
        ? `Reminder sent via ${sentChannels.join(' and ')}`
        : 'Failed to send reminders',
    });
  } catch (error: any) {
    console.error('Error sending installation notification:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
