/**
 * Notification Router
 * Unified service for routing notifications to appropriate channels
 */

import { EmailChannel, type EmailNotificationInput, type NotificationResult } from './channels/email-channel';
import { SmsChannel, type SmsNotificationInput } from './channels/sms-channel';
import { notificationLogger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationMethod = 'email' | 'sms' | 'whatsapp' | 'push';

export interface NotificationRequest {
  methods: NotificationMethod[];
  email?: Omit<EmailNotificationInput, 'html'> & { html: string };
  sms?: SmsNotificationInput;
}

export type NotificationResults = Record<NotificationMethod, NotificationResult>;

// ============================================================================
// NOTIFICATION ROUTER
// ============================================================================

export class NotificationRouter {
  /**
   * Send notification via customer's preferred methods
   */
  static async notify(request: NotificationRequest): Promise<NotificationResults> {
    const results: Partial<NotificationResults> = {};

    const sendPromises = request.methods.map(async (method) => {
      switch (method) {
        case 'email':
          if (request.email) {
            results.email = await EmailChannel.send(request.email);
          } else {
            results.email = { success: false, error: 'No email input provided' };
          }
          break;

        case 'sms':
          if (request.sms) {
            results.sms = await SmsChannel.send(request.sms);
          } else {
            results.sms = { success: false, error: 'No SMS input provided' };
          }
          break;

        case 'whatsapp':
          // WhatsApp integration placeholder
          results.whatsapp = {
            success: false,
            error: 'WhatsApp integration not implemented',
          };
          notificationLogger.debug('WhatsApp notification skipped - not implemented');
          break;

        case 'push':
          // Push notification placeholder
          results.push = {
            success: false,
            error: 'Push notification integration not implemented',
          };
          notificationLogger.debug('Push notification skipped - not implemented');
          break;
      }
    });

    await Promise.all(sendPromises);

    return results as NotificationResults;
  }

  /**
   * Send email-only notification (convenience method)
   */
  static async sendEmail(input: EmailNotificationInput): Promise<NotificationResult> {
    return EmailChannel.send(input);
  }

  /**
   * Send SMS-only notification (convenience method)
   */
  static async sendSms(input: SmsNotificationInput): Promise<NotificationResult> {
    return SmsChannel.send(input);
  }

  /**
   * Send to all channels (email + SMS)
   */
  static async sendAll(
    emailInput: EmailNotificationInput,
    smsInput: SmsNotificationInput
  ): Promise<NotificationResults> {
    return this.notify({
      methods: ['email', 'sms'],
      email: emailInput,
      sms: smsInput,
    });
  }
}

// ============================================================================
// CHANNEL STATUS
// ============================================================================

export interface ChannelStatus {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
}

/**
 * Check which notification channels are configured
 */
export function getChannelStatus(): ChannelStatus {
  return {
    email: !!process.env.RESEND_API_KEY,
    sms: !!(process.env.SMS_API_ENDPOINT && process.env.SMS_API_KEY),
    whatsapp: false, // Not implemented
    push: false, // Not implemented
  };
}
