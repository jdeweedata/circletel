/**
 * Email Notification Channel
 * Handles sending emails via Resend API
 */

import { notificationLogger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailNotificationInput {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  from?: string;
  tags?: EmailTags;
  isMarketingEmail?: boolean;
}

export interface EmailTags {
  template_id?: string;
  order_id?: string;
  customer_id?: string;
  invoice_id?: string;
  notification_type?: string;
}

export interface NotificationResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// ============================================================================
// EMAIL CHANNEL SERVICE
// ============================================================================

export class EmailChannel {
  private static apiKey = process.env.RESEND_API_KEY;
  private static fromEmail = 'noreply@notifications.circletelsa.co.za';
  private static fromName = 'CircleTel';
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  /**
   * Generate List-Unsubscribe header for Microsoft/Gmail compliance
   * RFC 8058 compliant one-click unsubscribe
   */
  private static generateUnsubscribeHeaders(email: string): {
    'List-Unsubscribe': string;
    'List-Unsubscribe-Post': string;
  } {
    const encodedEmail = encodeURIComponent(email);
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64url');

    return {
      'List-Unsubscribe': `<${this.baseUrl}/unsubscribe?email=${encodedEmail}&token=${token}>, <mailto:unsubscribe@circletel.co.za?subject=Unsubscribe%20${encodedEmail}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }

  /**
   * Send email via Resend API
   */
  static async send(input: EmailNotificationInput): Promise<NotificationResult> {
    try {
      if (!this.apiKey) {
        notificationLogger.warn('RESEND_API_KEY not configured, skipping email notification');
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      // Build request body with optional tags
      const requestBody: Record<string, unknown> = {
        from: input.from || `${this.fromName} <${this.fromEmail}>`,
        to: input.to,
        subject: input.subject,
        html: input.html,
        cc: input.cc,
        bcc: input.bcc,
      };

      // Add tags if provided (for webhook tracking)
      if (input.tags && Object.keys(input.tags).length > 0) {
        requestBody.tags = input.tags;
      }

      // Add List-Unsubscribe headers for marketing emails (required by Microsoft/Gmail)
      if (input.isMarketingEmail) {
        requestBody.headers = this.generateUnsubscribeHeaders(input.to);
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      const result = await response.json();

      notificationLogger.info('Email sent successfully', {
        to: input.to,
        subject: input.subject,
        messageId: result.id,
      });

      return {
        success: true,
        message_id: result.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notificationLogger.error('Error sending email notification', { error: errorMessage, to: input.to });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the base URL for email links
   */
  static getBaseUrl(): string {
    return this.baseUrl;
  }
}
