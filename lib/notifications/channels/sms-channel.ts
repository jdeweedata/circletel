/**
 * SMS Notification Channel
 * Handles sending SMS messages via configured SMS provider
 */

import { notificationLogger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface SmsNotificationInput {
  to: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// ============================================================================
// SMS CHANNEL SERVICE
// ============================================================================

export class SmsChannel {
  private static apiEndpoint = process.env.SMS_API_ENDPOINT;
  private static apiKey = process.env.SMS_API_KEY;
  private static senderId = 'CircleTel';

  /**
   * Send SMS via configured provider
   */
  static async send(input: SmsNotificationInput): Promise<NotificationResult> {
    try {
      if (!this.apiEndpoint || !this.apiKey) {
        notificationLogger.warn('SMS service not configured, skipping SMS notification');
        return {
          success: false,
          error: 'SMS service not configured',
        };
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: input.to,
          from: this.senderId,
          message: input.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send SMS');
      }

      const result = await response.json();

      notificationLogger.info('SMS sent successfully', {
        to: input.to,
        messageId: result.message_id,
      });

      return {
        success: true,
        message_id: result.message_id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationLogger.error('Error sending SMS notification', { error: errorMessage, to: input.to });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// ============================================================================
// SMS TEMPLATES
// ============================================================================

export type SmsTemplate =
  | 'order_confirmation'
  | 'payment_reminder'
  | 'installation_reminder'
  | 'installation_technician_eta'
  | 'order_activated'
  | 'quote_reminder';

/**
 * Render SMS template with data
 */
export function renderSmsTemplate(template: SmsTemplate, data: Record<string, unknown>): string {
  switch (template) {
    case 'order_confirmation':
      return `CircleTel: Thank you ${data.customer_name}! Your order ${data.order_number} has been received. Track status at circletel.co.za`;

    case 'installation_reminder':
      return `CircleTel: Reminder - Your installation is scheduled for ${data.date} between ${data.time_slot}. Please ensure someone is available.`;

    case 'installation_technician_eta':
      return `CircleTel: Our technician will arrive in approximately ${data.eta_minutes} minutes for your installation. Thank you!`;

    case 'order_activated':
      return `CircleTel: Great news! Your connection is now active. Welcome to CircleTel! Support: 0860 247 253`;

    case 'payment_reminder':
      return `CircleTel: Payment reminder for invoice ${data.invoice_number}. Amount due: R${data.amount}. Pay at circletel.co.za/pay`;

    case 'quote_reminder':
      return `CircleTel: Your quote ${data.quote_number} expires on ${data.expiry_date}. Accept now at circletel.co.za/quotes/${data.quote_number}`;

    default:
      return `CircleTel: You have a new notification. Visit circletel.co.za for details.`;
  }
}

/**
 * Helper to send templated SMS
 */
export async function sendTemplatedSms(
  to: string,
  template: SmsTemplate,
  data: Record<string, unknown>
): Promise<NotificationResult> {
  const message = renderSmsTemplate(template, data);
  return SmsChannel.send({ to, message });
}
