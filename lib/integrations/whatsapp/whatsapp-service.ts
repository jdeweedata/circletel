/**
 * WhatsApp Business API Service
 *
 * Handles sending WhatsApp messages via Meta Cloud API.
 * Follows the same lazy-load pattern as ClickatellService to avoid
 * build-time errors when env vars are missing.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import type {
  WhatsAppConfig,
  WhatsAppSendResult,
  WhatsAppBatchResult,
  WhatsAppMessageResponse,
  WhatsAppErrorResponse,
  SendTemplateRequest,
  TemplateParameter,
  CircleTelTemplate,
  InvoicePaymentParams,
  PaymentReminderParams,
  DebitFailedParams,
  PaymentReceivedParams,
  ServiceActivatedParams,
} from './types';

// =============================================================================
// WHATSAPP SERVICE
// =============================================================================

export class WhatsAppService {
  private config: WhatsAppConfig | null = null;

  /**
   * Get configuration lazily to avoid build-time errors
   */
  private getConfig(): WhatsAppConfig {
    if (!this.config) {
      this.config = {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
        baseUrl: 'https://graph.facebook.com/v21.0',
      };
    }
    return this.config;
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN
    );
  }

  /**
   * Format phone number to WhatsApp format (international without +)
   * Converts South African numbers (0821234567) to international format (27821234567)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 27 (South Africa)
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }

    // If doesn't start with country code, assume South Africa
    if (!cleaned.startsWith('27') && cleaned.length === 9) {
      cleaned = '27' + cleaned;
    }

    return cleaned;
  }

  /**
   * Send a template message
   */
  async sendTemplate(
    to: string,
    templateName: CircleTelTemplate,
    components: SendTemplateRequest['template']['components'] = [],
    languageCode = 'en_US'
  ): Promise<WhatsAppSendResult> {
    const config = this.getConfig();

    if (!config.phoneNumberId || !config.accessToken) {
      return {
        success: false,
        error: 'WhatsApp API not configured',
      };
    }

    const formattedPhone = this.formatPhoneNumber(to);

    console.log(`[WhatsApp] Sending template '${templateName}' to ${formattedPhone}`);

    const payload: SendTemplateRequest = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    try {
      const response = await fetch(
        `${config.baseUrl}/${config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json() as WhatsAppMessageResponse | WhatsAppErrorResponse;

      if (!response.ok || 'error' in data) {
        const errorData = data as WhatsAppErrorResponse;
        console.error('[WhatsApp] API error:', errorData);
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
          errorCode: errorData.error?.code,
        };
      }

      const successData = data as WhatsAppMessageResponse;
      const messageId = successData.messages?.[0]?.id;
      const waId = successData.contacts?.[0]?.wa_id;

      console.log(`[WhatsApp] Message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
        waId,
      };
    } catch (error) {
      console.error('[WhatsApp] Send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }

  // ===========================================================================
  // INVOICE PAYMENT TEMPLATE
  // ===========================================================================

  /**
   * Send invoice payment notification
   * Template: circletel_invoice_payment
   *
   * Structure:
   * - Header: Image (CircleTel logo)
   * - Body: Hi {{1}}, your CircleTel invoice {{2}} for R{{3}} is due on {{4}}.
   * - Button: Pay Now -> {{5}}
   */
  async sendInvoicePayment(
    to: string,
    params: InvoicePaymentParams
  ): Promise<WhatsAppSendResult> {
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: params.customerName },
      { type: 'text', text: params.invoiceNumber },
      { type: 'text', text: params.amount },
      { type: 'text', text: params.dueDate },
    ];

    const components: SendTemplateRequest['template']['components'] = [
      // Header with logo (configured in template)
      // Body parameters
      {
        type: 'body',
        parameters: bodyParams,
      },
      // Button URL parameter
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: params.paymentUrl }],
      },
    ];

    return this.sendTemplate(to, 'circletel_invoice_payment', components);
  }

  // ===========================================================================
  // PAYMENT REMINDER TEMPLATE
  // ===========================================================================

  /**
   * Send payment reminder
   * Template: circletel_payment_reminder
   *
   * Structure:
   * - Body: Reminder: Invoice {{1}} (R{{2}}) is {{3}} days overdue.
   * - Button: Pay Now -> {{4}}
   */
  async sendPaymentReminder(
    to: string,
    params: PaymentReminderParams
  ): Promise<WhatsAppSendResult> {
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: params.invoiceNumber },
      { type: 'text', text: params.amount },
      { type: 'text', text: params.daysOverdue },
    ];

    const components: SendTemplateRequest['template']['components'] = [
      {
        type: 'body',
        parameters: bodyParams,
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: params.paymentUrl }],
      },
    ];

    return this.sendTemplate(to, 'circletel_payment_reminder', components);
  }

  // ===========================================================================
  // DEBIT FAILED TEMPLATE
  // ===========================================================================

  /**
   * Send debit order failed notification
   * Template: circletel_debit_failed
   *
   * Structure:
   * - Body: Hi {{1}}, we couldn't collect payment for invoice {{2}} (R{{3}}).
   * - Button 1: Pay Now -> {{4}}
   * - Button 2: Update Payment -> circletel.co.za/billing (static)
   */
  async sendDebitFailed(
    to: string,
    params: DebitFailedParams
  ): Promise<WhatsAppSendResult> {
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: params.customerName },
      { type: 'text', text: params.invoiceNumber },
      { type: 'text', text: params.amount },
    ];

    const components: SendTemplateRequest['template']['components'] = [
      {
        type: 'body',
        parameters: bodyParams,
      },
      // First button - Pay Now (dynamic URL)
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [{ type: 'text', text: params.paymentUrl }],
      },
      // Second button - Update Payment (static URL in template)
    ];

    return this.sendTemplate(to, 'circletel_debit_failed', components);
  }

  // ===========================================================================
  // PAYMENT RECEIVED TEMPLATE
  // ===========================================================================

  /**
   * Send payment received confirmation
   * Template: circletel_payment_received
   *
   * Structure:
   * - Body: Hi {{1}}, we received your payment of R{{3}} for invoice {{2}} on {{4}}.
   */
  async sendPaymentReceived(
    to: string,
    params: PaymentReceivedParams
  ): Promise<WhatsAppSendResult> {
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: params.customerName },
      { type: 'text', text: params.invoiceNumber },
      { type: 'text', text: params.amount },
      { type: 'text', text: params.paymentDate },
    ];

    const components: SendTemplateRequest['template']['components'] = [
      {
        type: 'body',
        parameters: bodyParams,
      },
    ];

    return this.sendTemplate(to, 'circletel_payment_received', components);
  }

  // ===========================================================================
  // SERVICE ACTIVATED TEMPLATE
  // ===========================================================================

  /**
   * Send service activated notification
   * Template: circletel_service_activated
   *
   * Structure:
   * - Body: Hi {{1}}, your {{2}} service is now active! Account: {{3}}
   */
  async sendServiceActivated(
    to: string,
    params: ServiceActivatedParams
  ): Promise<WhatsAppSendResult> {
    const bodyParams: TemplateParameter[] = [
      { type: 'text', text: params.customerName },
      { type: 'text', text: params.serviceName },
      { type: 'text', text: params.accountNumber },
    ];

    const components: SendTemplateRequest['template']['components'] = [
      {
        type: 'body',
        parameters: bodyParams,
      },
    ];

    return this.sendTemplate(to, 'circletel_service_activated', components);
  }

  // ===========================================================================
  // BATCH SENDING
  // ===========================================================================

  /**
   * Send messages to multiple recipients
   * Respects rate limits with delays between messages
   */
  async sendBatch<T extends CircleTelTemplate>(
    recipients: Array<{
      phone: string;
      template: T;
      params: T extends 'circletel_invoice_payment' ? InvoicePaymentParams
        : T extends 'circletel_payment_reminder' ? PaymentReminderParams
        : T extends 'circletel_debit_failed' ? DebitFailedParams
        : T extends 'circletel_payment_received' ? PaymentReceivedParams
        : ServiceActivatedParams;
    }>,
    options: {
      delayMs?: number; // Delay between messages (default: 100ms)
      maxConcurrent?: number; // Max concurrent sends (default: 1 - sequential)
    } = {}
  ): Promise<WhatsAppBatchResult> {
    const { delayMs = 100 } = options;

    const results: WhatsAppBatchResult = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      results: [],
      errors: [],
    };

    for (const recipient of recipients) {
      let result: WhatsAppSendResult;

      // Route to correct template method
      switch (recipient.template) {
        case 'circletel_invoice_payment':
          result = await this.sendInvoicePayment(
            recipient.phone,
            recipient.params as InvoicePaymentParams
          );
          break;
        case 'circletel_payment_reminder':
          result = await this.sendPaymentReminder(
            recipient.phone,
            recipient.params as PaymentReminderParams
          );
          break;
        case 'circletel_debit_failed':
          result = await this.sendDebitFailed(
            recipient.phone,
            recipient.params as DebitFailedParams
          );
          break;
        case 'circletel_payment_received':
          result = await this.sendPaymentReceived(
            recipient.phone,
            recipient.params as PaymentReceivedParams
          );
          break;
        case 'circletel_service_activated':
          result = await this.sendServiceActivated(
            recipient.phone,
            recipient.params as ServiceActivatedParams
          );
          break;
        default:
          result = { success: false, error: `Unknown template: ${recipient.template}` };
      }

      results.results.push({ phone: recipient.phone, result });

      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${recipient.phone}: ${result.error}`);
        }
      }

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  // ===========================================================================
  // WEBHOOK VERIFICATION
  // ===========================================================================

  /**
   * Verify webhook subscription (GET request from Meta)
   */
  verifyWebhook(
    mode: string | null,
    token: string | null,
    challenge: string | null
  ): { valid: boolean; challenge?: string } {
    const config = this.getConfig();

    if (
      mode === 'subscribe' &&
      token === config.webhookVerifyToken
    ) {
      console.log('[WhatsApp] Webhook verified successfully');
      return { valid: true, challenge: challenge || '' };
    }

    console.warn('[WhatsApp] Webhook verification failed', { mode, token });
    return { valid: false };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const whatsAppService = new WhatsAppService();
