/**
 * Notification Service
 * Handles Email and SMS notifications for customer journey events
 *
 * Architecture:
 * - This file provides backward-compatible high-level notification methods
 * - Actual sending is delegated to channels: ./channels/email-channel.ts, ./channels/sms-channel.ts
 * - Template rendering uses utilities from: ./templates/base-template.ts
 * - Unified routing available via: ./notification-router.ts
 */

import type {
  ConsumerOrder,
  BusinessQuote,
  CoverageLead,
  OrderStatus,
  QuoteStatus,
  NotificationMethod,
} from '@/lib/types/customer-journey';

// Import new modular channel services
import { EmailChannel, type NotificationResult as ChannelNotificationResult } from './channels/email-channel';
import { SmsChannel } from './channels/sms-channel';
import { getOrdinalSuffix as getOrdinalSuffixUtil } from './templates/base-template';
import { renderEmailTemplate } from './templates';
import { notificationLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface EmailNotificationInput {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  from?: string; // Optional custom sender email
  tags?: EmailTags; // Optional tracking tags for Resend webhooks
  isMarketingEmail?: boolean; // Set to true for marketing/promotional emails to add List-Unsubscribe headers
}

/**
 * Tags for email tracking via Resend webhooks.
 * These are passed to Resend and returned in webhook events,
 * allowing us to link email events to specific records.
 */
export interface EmailTags {
  template_id?: string;
  order_id?: string;
  customer_id?: string;
  invoice_id?: string;
  notification_type?: string;
}

export interface SmsNotificationInput {
  to: string;
  /** Direct message content. If template is provided, this is optional */
  message?: string;
  template?: SmsTemplate;
  data?: Record<string, any>;
}

export type EmailTemplate =
  | 'order_confirmation'
  | 'payment_received'
  | 'payment_confirmation'
  | 'installation_scheduled'
  | 'installation_reminder'
  | 'order_activated'
  | 'quote_sent'
  | 'quote_reminder'
  | 'kyc_upload_request'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'lead_captured'
  | 'coverage_available'
  | 'no_coverage_lead_confirmation'
  | 'sales_coverage_lead_alert'
  | 'sales_business_quote_alert'
  | 'admin_new_order_sales'
  | 'admin_new_order_service_delivery'
  | 'admin_urgent_order'
  | 'admin_payment_received'
  | 'admin_installation_scheduled'
  | 'admin_installation_completed'
  // Partner templates
  | 'partner_registration_welcome'
  | 'partner_compliance_submitted'
  | 'partner_approved'
  | 'partner_rejected'
  | 'admin_partner_registration_alert'
  | 'admin_partner_compliance_review'
  // Billing templates
  | 'invoice_sent'
  | 'invoice_due_reminder'
  // Payment method templates
  | 'payment_method_registered';

export type SmsTemplate =
  | 'order_confirmation'
  | 'payment_reminder'
  | 'installation_reminder'
  | 'installation_technician_eta'
  | 'order_activated'
  | 'quote_reminder';

export interface NotificationResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// =============================================================================
// EMAIL NOTIFICATION SERVICE
// =============================================================================

export class EmailNotificationService {
  // Base URL for email links (used in templates)
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  /**
   * Send email using Resend API (delegates to EmailChannel)
   */
  static async send(input: EmailNotificationInput): Promise<NotificationResult> {
    const html = this.renderTemplate(input.template, input.data);

    // Delegate to EmailChannel for actual sending
    return EmailChannel.send({
      to: input.to,
      subject: input.subject,
      html,
      cc: input.cc,
      bcc: input.bcc,
      from: input.from,
      tags: input.tags,
      isMarketingEmail: input.isMarketingEmail,
    });
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(order: ConsumerOrder): Promise<NotificationResult> {
    return this.send({
      to: order.email,
      subject: `Order Confirmation - ${order.order_number}`,
      template: 'order_confirmation',
      data: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name}`,
        package_name: order.package_name,
        package_speed: order.package_speed,
        monthly_price: order.package_price,
        installation_fee: order.installation_fee,
        total_amount: order.package_price + order.installation_fee,
        installation_address: order.installation_address,
      },
    });
  }

  /**
   * Send payment confirmation email
   */
  static async sendPaymentConfirmation(order: ConsumerOrder): Promise<NotificationResult> {
    return this.send({
      to: order.email,
      subject: `Payment Confirmation - ${order.order_number}`,
      template: 'payment_confirmation',
      data: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name}`,
        package_name: order.package_name,
        monthly_price: order.package_price,
        payment_date: new Date().toLocaleDateString('en-ZA'),
      },
    });
  }

  /**
   * Send quote email to business customer
   */
  static async sendQuote(quote: BusinessQuote): Promise<NotificationResult> {
    return this.send({
      to: quote.contact_email,
      subject: `Business Quote - ${quote.quote_number}`,
      template: 'quote_sent',
      data: {
        quote_number: quote.quote_number,
        contact_name: `${quote.contact_first_name} ${quote.contact_last_name}`,
        company_name: quote.company_name,
        package_name: quote.package_name,
        package_speed: quote.package_speed,
        monthly_recurring: quote.monthly_recurring,
        installation_fee: quote.installation_fee,
        total_amount: quote.total_amount,
        valid_until: quote.valid_until,
        payment_terms: quote.payment_terms,
        contract_duration: quote.contract_duration,
      },
    });
  }

  /**
   * Send installation scheduled notification
   */
  static async sendInstallationScheduled(
    order: ConsumerOrder,
    installationDate: string,
    timeSlot: string
  ): Promise<NotificationResult> {
    return this.send({
      to: order.email,
      subject: `Installation Scheduled - ${order.order_number}`,
      template: 'installation_scheduled',
      data: {
        order_number: order.order_number,
        customer_name: `${order.first_name} ${order.last_name}`,
        installation_date: installationDate,
        time_slot: timeSlot,
        installation_address: order.installation_address,
        package_name: order.package_name,
      },
    });
  }

  /**
   * Send KYC document upload request
   */
  static async sendKycUploadRequest(
    email: string,
    name: string,
    orderNumber: string
  ): Promise<NotificationResult> {
    return this.send({
      to: email,
      subject: `Action Required: PiUploadSimpleBold KYC Documents - ${orderNumber}`,
      template: 'kyc_upload_request',
      data: {
        customer_name: name,
        order_number: orderNumber,
        upload_url: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderNumber}/kyc`,
      },
    });
  }

  /**
   * Send lead captured notification (internal)
   */
  static async sendLeadCapturedNotification(lead: CoverageLead): Promise<NotificationResult> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@circletel.co.za';

    return this.send({
      to: adminEmail,
      subject: `New Lead Captured - ${lead.customer_type.toUpperCase()}`,
      template: 'lead_captured',
      data: {
        customer_name: `${lead.first_name} ${lead.last_name}`,
        customer_type: lead.customer_type,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        lead_source: lead.lead_source,
        requested_service: lead.requested_service_type,
        requested_speed: lead.requested_speed,
        budget_range: lead.budget_range,
      },
    });
  }

  /**
   * Send service activation email
   */
  static async sendServiceActivation(data: {
    email: string;
    customer_name: string;
    order_number: string;
    account_number: string;
    package_name: string;
    package_speed: string;
    monthly_price: number;
    service_start_date: string;
    temporary_password: string;
    installation_fee?: number;
    router_fee?: number;
    invoice_number?: string;
    invoice_total?: number;
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `🎉 Your CircleTel Service is Now Active! - ${data.order_number}`,
      template: 'order_activated',
      data,
    });
  }

  /**
   * Send KYC approval email
   */
  static async sendKycApproval(
    email: string,
    customerName: string,
    orderNumber: string
  ): Promise<NotificationResult> {
    return this.send({
      to: email,
      subject: `✅ Documents Approved - ${orderNumber}`,
      template: 'kyc_approved',
      data: {
        customer_name: customerName,
        order_number: orderNumber,
      },
    });
  }

  /**
   * Send KYC rejection email
   */
  static async sendKycRejection(
    email: string,
    customerName: string,
    orderNumber: string,
    rejectionReason: string
  ): Promise<NotificationResult> {
    return this.send({
      to: email,
      subject: `⚠️ Documents Require Attention - ${orderNumber}`,
      template: 'kyc_rejected',
      data: {
        customer_name: customerName,
        order_number: orderNumber,
        rejection_reason: rejectionReason,
      },
    });
  }

  // ==========================================================================
  // PARTNER NOTIFICATION METHODS
  // ==========================================================================

  /**
   * Send welcome email to new partner registration
   */
  static async sendPartnerWelcome(data: {
    email: string;
    contact_person: string;
    business_name: string;
    business_type: string;
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `Welcome to CircleTel Partner Program - ${data.business_name}`,
      template: 'partner_registration_welcome',
      data,
    });
  }

  /**
   * Send notification when compliance documents are submitted
   */
  static async sendPartnerComplianceSubmitted(data: {
    email: string;
    contact_person: string;
    business_name: string;
    partner_number?: string;
    documents_submitted?: string[];
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `Compliance Documents Received - ${data.business_name}`,
      template: 'partner_compliance_submitted',
      data,
    });
  }

  /**
   * Send approval notification to partner
   */
  static async sendPartnerApproval(data: {
    email: string;
    contact_person: string;
    business_name: string;
    partner_number: string;
    tier: string;
    commission_rate: number;
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `🎉 Congratulations! Your Partner Application is Approved - ${data.partner_number}`,
      template: 'partner_approved',
      data,
    });
  }

  /**
   * Send rejection notification to partner
   */
  static async sendPartnerRejection(data: {
    email: string;
    contact_person: string;
    business_name: string;
    rejection_reason?: string;
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `Partner Application Update - ${data.business_name}`,
      template: 'partner_rejected',
      data,
    });
  }

  /**
   * Send admin alert for new partner registration
   */
  static async sendAdminPartnerRegistrationAlert(data: {
    partner_id: string;
    business_name: string;
    business_type: string;
    registration_number?: string;
    contact_person: string;
    email: string;
    phone: string;
    street_address: string;
    city: string;
    province: string;
    postal_code: string;
  }): Promise<NotificationResult> {
    const adminEmail = process.env.PARTNER_ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'partners@circletel.co.za';

    return this.send({
      to: adminEmail,
      subject: `🆕 New Partner Registration - ${data.business_name}`,
      template: 'admin_partner_registration_alert',
      data,
    });
  }

  /**
   * Send admin alert for compliance documents review
   */
  static async sendAdminPartnerComplianceReview(data: {
    partner_id: string;
    business_name: string;
    partner_number?: string;
    contact_person: string;
    documents_submitted?: string[];
  }): Promise<NotificationResult> {
    const adminEmail = process.env.PARTNER_ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || 'compliance@circletel.co.za';

    return this.send({
      to: adminEmail,
      subject: `📋 Partner Compliance Review Required - ${data.business_name}`,
      template: 'admin_partner_compliance_review',
      data,
    });
  }

  // ==========================================================================
  // PAYMENT METHOD NOTIFICATION METHODS
  // ==========================================================================

  /**
   * Send payment method registration confirmation to customer
   * Called when NetCash eMandate is successfully signed
   */
  static async sendPaymentMethodRegisteredEmail(data: {
    email: string;
    customer_name: string;
    order_number: string;
    account_number?: string;
    bank_name: string;
    bank_account_masked: string;
    debit_day: number;
    monthly_amount: number;
    package_name: string;
  }): Promise<NotificationResult> {
    return this.send({
      to: data.email,
      subject: `Payment Method Confirmed - ${data.order_number}`,
      template: 'payment_method_registered',
      data: {
        ...data,
        debit_day_suffix: getOrdinalSuffix(data.debit_day),
      },
    });
  }

  /**
   * Render email template with data
   */
  private static renderTemplate(template: EmailTemplate, data: Record<string, any>): string {
    return renderEmailTemplate(template, data);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 * @deprecated Use getOrdinalSuffix from ./templates/base-template instead
 */
function getOrdinalSuffix(n: number): string {
  return getOrdinalSuffixUtil(n);
}

// =============================================================================
// SMS NOTIFICATION SERVICE
// =============================================================================

export class SmsNotificationService {
  /**
   * Send SMS notification (delegates to SmsChannel)
   */
  static async send(input: SmsNotificationInput): Promise<NotificationResult> {
    const message = input.template
      ? this.renderTemplate(input.template, input.data || {})
      : input.message || '';

    // Delegate to SmsChannel for actual sending
    return SmsChannel.send({
      to: input.to,
      message,
    });
  }

  /**
   * Send order confirmation SMS
   */
  static async sendOrderConfirmation(
    phone: string,
    orderNumber: string,
    customerName: string
  ): Promise<NotificationResult> {
    return this.send({
      to: phone,
      template: 'order_confirmation',
      data: { order_number: orderNumber, customer_name: customerName },
    });
  }

  /**
   * Send installation reminder SMS
   */
  static async sendInstallationReminder(
    phone: string,
    date: string,
    timeSlot: string
  ): Promise<NotificationResult> {
    return this.send({
      to: phone,
      template: 'installation_reminder',
      data: { date, time_slot: timeSlot },
    });
  }

  /**
   * Render SMS template
   */
  private static renderTemplate(template: SmsTemplate, data: Record<string, any>): string {
    switch (template) {
      case 'order_confirmation':
        return `CircleTel: Thank you ${data.customer_name}! Your order ${data.order_number} has been received. Track status at circletel.co.za`;

      case 'installation_reminder':
        return `CircleTel: Reminder - Your installation is scheduled for ${data.date} between ${data.time_slot}. Please ensure someone is available.`;

      case 'installation_technician_eta':
        return `CircleTel: Our technician will arrive in approximately ${data.eta_minutes} minutes for your installation. Thank you!`;

      case 'order_activated':
        return `CircleTel: Great news! Your connection is now active. Welcome to CircleTel! Support: 0860 247 253`;

      default:
        return `CircleTel: You have a new notification. Visit circletel.co.za for details.`;
    }
  }
}

// =============================================================================
// UNIFIED NOTIFICATION SERVICE
// =============================================================================

export class NotificationService {
  /**
   * Send notification via customer's preferred method
   */
  static async notify(
    methods: NotificationMethod[],
    emailInput?: EmailNotificationInput,
    smsInput?: SmsNotificationInput
  ): Promise<Record<NotificationMethod, NotificationResult>> {
    const results: Record<string, NotificationResult> = {};

    for (const method of methods) {
      switch (method) {
        case 'email':
          if (emailInput) {
            results.email = await EmailNotificationService.send(emailInput);
          }
          break;

        case 'sms':
          if (smsInput) {
            results.sms = await SmsNotificationService.send(smsInput);
          }
          break;

        case 'whatsapp':
          // WhatsApp integration would go here
          results.whatsapp = {
            success: false,
            error: 'WhatsApp integration not implemented',
          };
          break;

        case 'push':
          // Push notification integration would go here
          results.push = {
            success: false,
            error: 'Push notification integration not implemented',
          };
          break;
      }
    }

    return results as Record<NotificationMethod, NotificationResult>;
  }
}
