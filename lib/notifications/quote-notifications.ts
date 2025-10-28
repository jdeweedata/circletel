/**
 * Quote Notification Service
 *
 * Handles notifications for business quote events (sales agent system)
 */

import { createClient } from '@/lib/supabase/server';
import type {
  NotificationContext,
  NotificationEvent,
  SendNotificationRequest,
  SendNotificationResponse
} from './types';

export class QuoteNotificationService {
  /**
   * Send notification for a quote event
   * Automatically fetches quote details and determines recipients
   */
  static async sendForQuoteEvent(
    event: NotificationEvent,
    quoteId: string,
    additionalContext: Partial<NotificationContext> = {}
  ): Promise<SendNotificationResponse> {
    try {
      const supabase = await createClient();

      // Fetch quote with agent details
      const { data: quote, error: quoteError } = await supabase
        .from('business_quotes')
        .select(`
          *,
          agent:sales_agents(id, full_name, email, company, commission_rate)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        return {
          success: false,
          error: 'Quote not found'
        };
      }

      // Build context
      const context: NotificationContext = {
        quote_number: quote.quote_number,
        company_name: quote.company_name,
        contact_name: quote.contact_name,
        contact_email: quote.contact_email,
        contact_phone: quote.contact_phone,
        service_address: quote.service_address,
        total_monthly: quote.total_monthly,
        total_installation: quote.total_installation,
        subtotal_monthly: quote.subtotal_monthly,
        subtotal_installation: quote.subtotal_installation,
        vat_amount_monthly: quote.vat_amount_monthly,
        vat_amount_installation: quote.vat_amount_installation,
        contract_term: quote.contract_term,
        valid_until: quote.valid_until
          ? new Date(quote.valid_until).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
          : undefined,
        agent_name: quote.agent?.full_name || 'No agent assigned',
        agent_email: quote.agent?.email,
        agent_company: quote.agent?.company,
        commission_rate: quote.agent?.commission_rate,
        commission_amount: quote.agent
          ? quote.total_monthly * (quote.agent.commission_rate / 100)
          : undefined,
        acceptance_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quotes/accept/${quote.id}`,
        agent_dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/agents/dashboard`,
        admin_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/quotes/${quote.id}`,
        ...additionalContext
      };

      // Get recipients for this event
      const recipients = this.getRecipientsForEvent(event, quote);

      if (recipients.length === 0) {
        return {
          success: false,
          error: 'No recipients found for this event'
        };
      }

      // Send to all recipients
      const results = await Promise.all(
        recipients.map(recipient =>
          this.sendNotification({
            event,
            type: 'email',
            recipient_email: recipient.email,
            quote_id: quoteId,
            agent_id: quote.agent?.id,
            context
          })
        )
      );

      const allSuccessful = results.every(r => r.success);

      return {
        success: allSuccessful,
        notification_id: results[0]?.notification_id,
        error: allSuccessful ? undefined : 'Some notifications failed'
      };

    } catch (error) {
      console.error('QuoteNotificationService.sendForQuoteEvent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(
    request: SendNotificationRequest
  ): Promise<SendNotificationResponse> {
    try {
      const supabase = await createClient();

      // 1. Fetch template
      const { data: template } = await supabase
        .from('quote_notification_templates')
        .select('*')
        .eq('event', request.event)
        .eq('delivery_type', request.type)
        .eq('enabled', true)
        .single();

      if (!template) {
        console.log(`No template found for ${request.event} / ${request.type}`);
        return {
          success: false,
          error: `Template not found: ${request.event} / ${request.type}`
        };
      }

      // 2. Substitute variables
      const subject = template.subject
        ? this.substituteVariables(template.subject, request.context)
        : null;
      const body = this.substituteVariables(template.body, request.context);

      // 3. Create notification record
      const { data: notification } = await supabase
        .from('quote_notification_log')
        .insert({
          event: request.event,
          delivery_type: request.type,
          recipient_email: request.recipient_email,
          recipient_phone: request.recipient_phone,
          subject,
          body,
          status: 'pending',
          quote_id: request.quote_id,
          agent_id: request.agent_id
        })
        .select()
        .single();

      if (!notification) {
        return { success: false, error: 'Failed to create notification record' };
      }

      // 4. Send (simulated for now)
      const sendSuccess = await this.simulateSend(request.type, {
        to: request.recipient_email || request.recipient_phone || '',
        subject: subject || '',
        body
      });

      // 5. Update status
      await supabase
        .from('quote_notification_log')
        .update({
          status: sendSuccess ? 'sent' : 'failed',
          sent_at: sendSuccess ? new Date().toISOString() : null
        })
        .eq('id', notification.id);

      return {
        success: sendSuccess,
        notification_id: notification.id
      };

    } catch (error) {
      console.error('QuoteNotificationService.sendNotification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get recipients based on event type
   */
  private static getRecipientsForEvent(event: NotificationEvent, quote: any) {
    const recipients: { email?: string; phone?: string }[] = [];
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@circletel.co.za';

    switch (event) {
      case 'quote_created':
        recipients.push({ email: adminEmail });
        break;

      case 'quote_approved':
        if (quote.agent?.email) recipients.push({ email: quote.agent.email });
        if (quote.contact_email) recipients.push({ email: quote.contact_email });
        break;

      case 'quote_sent':
      case 'quote_viewed':
      case 'quote_expired':
        if (quote.agent?.email) recipients.push({ email: quote.agent.email });
        break;

      case 'quote_accepted':
      case 'quote_rejected':
        recipients.push({ email: adminEmail });
        if (quote.agent?.email) recipients.push({ email: quote.agent.email });
        break;
    }

    return recipients.filter(r => r.email); // Only include valid emails
  }

  /**
   * Substitute {{variables}} in template
   */
  private static substituteVariables(
    template: string,
    context: NotificationContext
  ): string {
    let result = template;

    Object.entries(context).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const pattern = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(pattern, String(value));
      }
    });

    // Remove any remaining unsubstituted variables
    result = result.replace(/{{[^}]+}}/g, '');

    return result;
  }

  /**
   * Simulate sending (logs to console)
   * TODO: Integrate with Resend for email, Africa's Talking for SMS
   */
  private static async simulateSend(
    type: string,
    params: { to: string; subject?: string; body: string }
  ): Promise<boolean> {
    console.log('\n==================== NOTIFICATION ====================');
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`To: ${params.to}`);
    if (params.subject) console.log(`Subject: ${params.subject}`);
    console.log(`\nBody:\n${params.body}`);
    console.log('======================================================\n');

    // Simulate success
    return true;
  }
}
