/**
 * Notification Service
 * Handles Email and SMS notifications for customer journey events
 */

import type {
  ConsumerOrder,
  BusinessQuote,
  CoverageLead,
  OrderStatus,
  QuoteStatus,
  NotificationMethod,
} from '@/lib/types/customer-journey';

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
  message: string;
  template?: SmsTemplate;
  data?: Record<string, any>;
}

export type EmailTemplate =
  | 'order_confirmation'
  | 'payment_received'
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
  private static apiKey = process.env.RESEND_API_KEY;
  private static fromEmail = 'noreply@notifications.circletelsa.co.za'; // Verified Resend domain
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
   * Send email using Resend API
   */
  static async send(input: EmailNotificationInput): Promise<NotificationResult> {
    try {
      if (!this.apiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email notification');
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      const html = this.renderTemplate(input.template, input.data);

      // Build request body with optional tags
      const requestBody: Record<string, unknown> = {
        from: input.from || `${this.fromName} <${this.fromEmail}>`,
        to: input.to,
        subject: input.subject,
        html,
        cc: input.cc,
        bcc: input.bcc,
      };

      // Add tags if provided (for webhook tracking)
      if (input.tags && Object.keys(input.tags).length > 0) {
        requestBody.tags = input.tags;
      }

      // Add List-Unsubscribe headers for marketing emails (required by Microsoft/Gmail)
      // This significantly improves deliverability to Microsoft 365, Outlook, and Hotmail
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

      return {
        success: true,
        message_id: result.id,
      };
    } catch (error: any) {
      console.error('Error sending email notification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
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
      subject: `Action Required: Upload KYC Documents - ${orderNumber}`,
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
    // Base email template wrapper
    const baseTemplate = (content: string) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #F5831F;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #E6E9EF;
            border-top: none;
          }
          .footer {
            background-color: #E6E9EF;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #4B5563;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #F5831F;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .info-box {
            background-color: #E6E9EF;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: bold;
            color: #4B5563;
          }
          .value {
            color: #1F2937;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    // Template-specific content
    let content = '';

    switch (template) {
      case 'order_confirmation':
        content = `
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order, ${data.customer_name}!</h2>
            <p>Your order has been successfully received and is being processed.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Cost:</span>
                <span class="value">R ${data.monthly_price.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Installation Fee:</span>
                <span class="value">R ${data.installation_fee.toFixed(2)}</span>
              </div>
            </div>

            <h3>Installation Address</h3>
            <p>${data.installation_address}</p>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Complete payment (if not already done)</li>
              <li>Upload your FICA documents</li>
              <li>We'll contact you to schedule installation</li>
              <li>Our technicians will install your connection</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}" class="button">
              View Order Status
            </a>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'quote_sent':
        content = `
          <div class="header">
            <h1>Your Business Quote</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_name},</h2>
            <p>Thank you for your interest in CircleTel business services. Please find your quote details below:</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Quote Number:</span>
                <span class="value">${data.quote_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Company:</span>
                <span class="value">${data.company_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Recurring:</span>
                <span class="value">R ${data.monthly_recurring.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Total (incl. VAT):</span>
                <span class="value"><strong>R ${data.total_amount.toFixed(2)}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Valid Until:</span>
                <span class="value">${data.valid_until}</span>
              </div>
            </div>

            <p><strong>Payment Terms:</strong> ${data.payment_terms}</p>
            <p><strong>Contract Duration:</strong> ${data.contract_duration} months</p>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/business/quotes/${data.quote_number}" class="button">
              View Full Quote
            </a>

            <p>If you have any questions, please don't hesitate to contact your account manager.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>business@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'installation_scheduled':
        content = `
          <div class="header">
            <h1>Installation Scheduled</h1>
          </div>
          <div class="content">
            <h2>Great news, ${data.customer_name}!</h2>
            <p>Your installation has been scheduled.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Installation Date:</span>
                <span class="value">${data.installation_date}</span>
              </div>
              <div class="info-row">
                <span class="label">Time Slot:</span>
                <span class="value">${data.time_slot}</span>
              </div>
              <div class="info-row">
                <span class="label">Address:</span>
                <span class="value">${data.installation_address}</span>
              </div>
            </div>

            <p><strong>Please ensure:</strong></p>
            <ul>
              <li>Someone 18+ is present during installation</li>
              <li>Access to the property is available</li>
              <li>Any pets are secured</li>
            </ul>

            <p>Our technician will contact you 30 minutes before arrival.</p>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}" class="button">
              View Order Details
            </a>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'kyc_upload_request':
        content = `
          <div class="header">
            <h1>Action Required: Upload Documents</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>To complete your order <strong>${data.order_number}</strong>, we need you to upload your FICA documents.</p>

            <p><strong>Required documents:</strong></p>
            <ul>
              <li>Copy of ID document (SA ID, passport, or driver's license)</li>
              <li>Proof of address (utility bill, bank statement - not older than 3 months)</li>
            </ul>

            <a href="${data.upload_url}" class="button">
              Upload Documents Now
            </a>

            <p>Once we receive and verify your documents, we'll proceed with scheduling your installation.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'no_coverage_lead_confirmation':
        content = `
          <div class="header">
            <h1>We're Expanding to Your Area!</h1>
          </div>
          <div class="content">
            <h2>Thank you, ${data.customer_name}!</h2>
            <p>We've received your interest in CircleTel services for:</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">📍 Address:</span>
                <span class="value">${data.address}</span>
              </div>
              ${data.estimated_timeline ? `
              <div class="info-row">
                <span class="label">⏱️ Estimated Timeline:</span>
                <span class="value">${data.estimated_timeline}</span>
              </div>
              ` : ''}
            </div>

            <h3>What happens next?</h3>
            <p>We're rapidly expanding our fibre and wireless network across South Africa. Here's what you can expect:</p>
            <ul>
              <li><strong>Network Expansion:</strong> Our team is actively working on bringing coverage to your area</li>
              <li><strong>Email Notification:</strong> We'll notify you as soon as service becomes available</li>
              <li><strong>Priority Access:</strong> You'll be among the first to know when we can connect you</li>
              <li><strong>No Obligation:</strong> This is just a notification request - no commitment required</li>
            </ul>

            <p><strong>In the meantime:</strong></p>
            <p>Check out our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/wireless">Wireless Solutions</a> - available in most areas with quick deployment!</p>

            <p>Questions? Our team is here to help at <a href="mailto:support@circletel.co.za">support@circletel.co.za</a> or 0860 CIRCLE (0860 247 253).</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>Your Connection, Our Priority</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}">circletel.co.za</a> | support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'order_activated':
        content = `
          <div class="header">
            <h1>🎉 Your Service is Now Active!</h1>
          </div>
          <div class="content">
            <h2>Welcome to CircleTel, ${data.customer_name}!</h2>
            <p>Great news! Your CircleTel internet service has been successfully activated and is now live.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value"><strong>${data.account_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Fee:</span>
                <span class="value">R ${data.monthly_price.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Service Start Date:</span>
                <span class="value">${data.service_start_date}</span>
              </div>
            </div>

            <h3>🔐 Your Account Details</h3>
            <div class="info-box" style="background-color: #FFF4E6; border-left: 4px solid #F5831F;">
              <p><strong>Account Number:</strong> ${data.account_number}</p>
              <p><strong>Temporary Password:</strong> ${data.temporary_password}</p>
              <p><em style="color: #4B5563; font-size: 14px;">⚠️ Please change your password after your first login for security.</em></p>
            </div>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/login" class="button">
              Login to Your Account
            </a>

            <h3>📊 Manage Your Service</h3>
            <p>With your CircleTel account, you can:</p>
            <ul>
              <li>View and download invoices</li>
              <li>Monitor your usage and billing</li>
              <li>Update your contact information</li>
              <li>Request technical support</li>
              <li>Upgrade or change your package</li>
            </ul>

            <h3>💡 Getting Started</h3>
            <ol>
              <li>Connect your devices to your router/modem</li>
              <li>Use the Wi-Fi credentials provided by our technician</li>
              <li>Test your connection by visiting <a href="https://fast.com">fast.com</a></li>
              <li>Login to your account and set a new password</li>
            </ol>

            ${data.invoice_number ? `
            <h3>📄 Your Invoice</h3>
            <p>Your initial invoice (${data.invoice_number}) has been generated and is available in your account portal. This includes:</p>
            <ul>
              <li>Installation Fee: R ${data.installation_fee.toFixed(2)}</li>
              ${data.router_fee ? `<li>Router/Equipment: R ${data.router_fee.toFixed(2)}</li>` : ''}
              <li>First Month Service: R ${data.monthly_price.toFixed(2)}</li>
            </ul>
            <p><strong>Total Due:</strong> R ${data.invoice_total.toFixed(2)} (incl. VAT)</p>
            <p>Payment is due within 7 days. Visit your account portal to pay online.</p>
            ` : ''}

            <h3>📞 Need Help?</h3>
            <p>Our support team is here to assist you:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:support@circletel.co.za">support@circletel.co.za</a></li>
              <li><strong>Phone:</strong> 0860 CIRCLE (0860 247 253)</li>
              <li><strong>WhatsApp:</strong> +27 (0)11 123 4567</li>
              <li><strong>Hours:</strong> Mon-Fri 8am-6pm, Sat 9am-1pm</li>
            </ul>

            <p>Thank you for choosing CircleTel! We're committed to providing you with fast, reliable internet service.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>Your Connection, Our Priority</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}">circletel.co.za</a> | support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'kyc_approved':
        content = `
          <div class="header">
            <h1>✅ Documents Approved</h1>
          </div>
          <div class="content">
            <h2>Good news, ${data.customer_name}!</h2>
            <p>Your KYC documents have been reviewed and approved.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #10B981;">Approved ✓</strong></span>
              </div>
            </div>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Our team will contact you within 24-48 hours to schedule installation</li>
              <li>You'll receive an email with available installation dates</li>
              <li>Our technician will install your service at the agreed time</li>
              <li>Your service will be activated and you'll receive your account details</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}" class="button">
              View Order Status
            </a>

            <p>If you have any questions, feel free to contact us at support@circletel.co.za</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'kyc_rejected':
        content = `
          <div class="header">
            <h1>⚠️ Documents Require Attention</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>We've reviewed your KYC documents for order <strong>${data.order_number}</strong>, but unfortunately we need you to re-submit some documents.</p>

            <div class="info-box" style="background-color: #FEE2E2; border-left: 4px solid #EF4444;">
              <p><strong>Reason for rejection:</strong></p>
              <p>${data.rejection_reason}</p>
            </div>

            <p><strong>Please re-upload your documents with the following in mind:</strong></p>
            <ul>
              <li>Documents must be clear and legible</li>
              <li>ID documents must be valid and not expired</li>
              <li>Proof of address must not be older than 3 months</li>
              <li>All information must be visible (no cut-off edges)</li>
              <li>Documents must be in PDF, JPG, or PNG format</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}/kyc" class="button">
              Upload Documents Again
            </a>

            <p>Once we receive your updated documents, we'll review them within 24 hours and proceed with your installation.</p>

            <p>Need help? Contact us at support@circletel.co.za or 0860 CIRCLE (0860 247 253)</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'sales_coverage_lead_alert':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🔔 New Coverage Lead</h1>
          </div>
          <div class="content">
            <h2>New ${data.customer_type} Lead Captured</h2>

            <div class="info-box" style="background-color: #FFF7ED; border-left: 4px solid #F5831F;">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              ${data.company_name ? `
              <div class="info-row">
                <span class="label">Company:</span>
                <span class="value"><strong>${data.company_name}</strong></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Customer Type:</span>
                <span class="value">${data.customer_type}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Requirements</h3>
              <div class="info-row">
                <span class="label">Requested Service:</span>
                <span class="value">${data.requested_service}</span>
              </div>
              <div class="info-row">
                <span class="label">Requested Speed:</span>
                <span class="value">${data.requested_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Budget Range:</span>
                <span class="value">${data.budget_range}</span>
              </div>
              <div class="info-row">
                <span class="label">Coverage Available:</span>
                <span class="value"><strong style="color: ${data.coverage_available === 'Yes' ? '#10B981' : '#EF4444'};">${data.coverage_available} ${data.coverage_available === 'Yes' ? '✓' : '✗'}</strong></span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Location</h3>
              <p><strong>Address:</strong><br>${data.address}</p>
              ${data.suburb ? `<p><strong>Suburb:</strong> ${data.suburb}</p>` : ''}
              ${data.city ? `<p><strong>City:</strong> ${data.city}</p>` : ''}
              ${data.province ? `<p><strong>Province:</strong> ${data.province}</p>` : ''}
              ${data.postal_code ? `<p><strong>Postal Code:</strong> ${data.postal_code}</p>` : ''}
            </div>

            ${data.source_campaign ? `
            <div class="info-box" style="background-color: #F3F4F6;">
              <div class="info-row">
                <span class="label">Campaign Source:</span>
                <span class="value">${data.source_campaign}</span>
              </div>
            </div>
            ` : ''}

            ${data.zoho_lead_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.zoho_lead_url}" class="button" style="background-color: #3B82F6;">
                🔗 Open in Zoho CRM
              </a>
            </div>
            ` : ''}

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong> Contact this lead within 30 minutes for best conversion rate!</p>
            </div>

            <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">
              <strong>Lead ID:</strong> ${data.lead_id}<br>
              ${data.zoho_lead_id ? `<strong>Zoho Lead ID:</strong> ${data.zoho_lead_id}<br>` : ''}
              <strong>Lead Source:</strong> ${data.lead_source || 'Website - Coverage Checker'}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Sales Team</p>
            <p>sales@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'sales_business_quote_alert':
        content = `
          <div class="header" style="background: linear-gradient(135deg, ${data.urgency_color || '#FF9800'} 0%, #F5831F 100%);">
            <h1>🚨 New Business Quote Request</h1>
            ${data.urgency ? `<p style="margin: 0; font-size: 16px; color: white; font-weight: bold;">${data.urgency.toUpperCase()} PRIORITY</p>` : ''}
          </div>
          <div class="content">
            <h2>Business Quote Request Received</h2>

            <div class="info-box" style="background-color: ${data.urgency === 'high' ? '#FEE2E2' : data.urgency === 'medium' ? '#FEF3C7' : '#D1FAE5'}; border-left: 4px solid ${data.urgency_color || '#FF9800'};">
              <h3 style="margin-top: 0;">Company Information</h3>
              <div class="info-row">
                <span class="label">Company Name:</span>
                <span class="value"><strong>${data.company_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value"><strong>${data.contact_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Quote Requirements</h3>
              <div class="info-row">
                <span class="label">Requested Service:</span>
                <span class="value">${data.requested_service}</span>
              </div>
              ${data.number_of_users ? `
              <div class="info-row">
                <span class="label">Number of Users:</span>
                <span class="value">${data.number_of_users}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Budget:</span>
                <span class="value">${data.budget}</span>
              </div>
              <div class="info-row">
                <span class="label">Urgency:</span>
                <span class="value"><strong style="color: ${data.urgency_color};">${data.urgency?.toUpperCase() || 'MEDIUM'}</strong></span>
              </div>
            </div>

            ${data.notes ? `
            <div class="info-box" style="background-color: #F9FAFB;">
              <h3 style="margin-top: 0;">Additional Notes</h3>
              <p>${data.notes}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${data.lead_id}" class="button">
                📋 View Lead Details
              </a>
            </div>

            ${data.urgency === 'high' ? `
            <div style="background-color: #FEE2E2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 20px 0;">
              <p style="margin: 0;"><strong>🔥 HIGH PRIORITY:</strong> This is a high-value lead. Contact immediately!</p>
            </div>
            ` : data.urgency === 'medium' ? `
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ MEDIUM PRIORITY:</strong> Contact within 2 hours for best results.</p>
            </div>
            ` : ''}

            <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">
              <strong>Lead ID:</strong> ${data.lead_id}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Business Sales Team</p>
            <p>business@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'admin_new_order_sales':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🔔 New Customer Order</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <div style="background-color: ${data.urgency === 'high' ? '#FEE2E2' : data.urgency === 'medium' ? '#FEF3C7' : '#ECFDF5'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${data.urgency_color}; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; color: ${data.urgency_color};">
                ${data.urgency.toUpperCase()} PRIORITY ORDER
              </p>
            </div>

            <h2>Order Details</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Order Time:</span>
                <span class="value">${data.created_at}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${data.order_status}</span>
              </div>
            </div>

            <h2>Customer Information</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.customer_email}">${data.customer_email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></span>
              </div>
              ${data.alternate_phone !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Alternate Phone:</span>
                <span class="value">${data.alternate_phone}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Preferred Contact:</span>
                <span class="value">${data.contact_preference}</span>
              </div>
            </div>

            <h2>Package & Pricing</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value"><strong>${data.package_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Fee:</span>
                <span class="value"><strong>R ${data.package_price.toFixed(2)}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Installation Fee:</span>
                <span class="value">R ${data.installation_fee.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Router:</span>
                <span class="value">${data.router_included} ${data.router_rental_fee > 0 ? '(R ' + data.router_rental_fee.toFixed(2) + '/month)' : ''}</span>
              </div>
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 8px; margin-top: 8px;">
                <span class="label">Total Monthly:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 18px;">R ${data.total_monthly.toFixed(2)}</strong></span>
              </div>
            </div>

            <h2>Installation Address</h2>
            <div class="info-box">
              <p style="margin: 0;"><strong>${data.installation_address}</strong></p>
              <p style="margin: 5px 0 0; color: #6B7280;">
                ${data.suburb}, ${data.city}, ${data.province} ${data.postal_code}
              </p>
              ${data.preferred_installation_date !== 'Not specified' ? `
              <div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E6E9EF;">
                <span class="label">Preferred Date:</span>
                <span class="value"><strong>${data.preferred_installation_date}</strong></span>
              </div>
              ` : ''}
              ${data.special_instructions !== 'None' ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E6E9EF;">
                <p style="margin: 0; font-weight: bold; color: #4B5563;">Special Instructions:</p>
                <p style="margin: 5px 0 0;">${data.special_instructions}</p>
              </div>
              ` : ''}
            </div>

            <h2>Payment Status</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Payment Status:</span>
                <span class="value"><strong style="color: ${data.payment_status === 'paid' ? '#10B981' : '#F59E0B'};">${data.payment_status.toUpperCase()}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${data.payment_method}</span>
              </div>
            </div>

            <h2>Lead Source</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Source:</span>
                <span class="value">${data.lead_source}</span>
              </div>
              ${data.source_campaign !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Campaign:</span>
                <span class="value">${data.source_campaign}</span>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #F5831F;">
                📋 View Order in Admin Panel
              </a>
              ${data.customer_profile_url ? `
              <a href="${data.customer_profile_url}" class="button" style="background-color: #3B82F6; margin-left: 10px;">
                👤 View Customer Profile
              </a>
              ` : ''}
            </div>

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong></p>
              <p style="margin: 5px 0 0;">
                ${data.urgency === 'high' ? 'Contact this customer immediately! High-priority order.' :
                  data.urgency === 'medium' ? 'Contact within 2 hours for best conversion rate.' :
                  'Follow up within 24 hours to schedule installation.'}
              </p>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Sales Team</p>
            <p>This is an automated notification from the CircleTel order management system</p>
          </div>
        `;
        break;

      case 'admin_new_order_service_delivery':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
            <h1>📦 New Installation Required</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <h2>Installation Request</h2>
            <div class="info-box" style="background-color: #DBEAFE; border-left: 4px solid #3B82F6;">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Order Date:</span>
                <span class="value">${data.created_at}</span>
              </div>
              <div class="info-row">
                <span class="label">Priority:</span>
                <span class="value"><strong style="color: ${data.urgency_color};">${data.urgency.toUpperCase()}</strong></span>
              </div>
            </div>

            <h2>Customer Contact</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}" style="font-size: 16px; font-weight: bold;">${data.customer_phone}</a></span>
              </div>
              ${data.alternate_phone !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Alternate:</span>
                <span class="value"><a href="tel:${data.alternate_phone}">${data.alternate_phone}</a></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.customer_email}">${data.customer_email}</a></span>
              </div>
            </div>

            <h2>Installation Location</h2>
            <div class="info-box">
              <p style="margin: 0; font-size: 16px;"><strong>${data.installation_address}</strong></p>
              <p style="margin: 5px 0 0; color: #6B7280;">
                ${data.suburb}, ${data.city}, ${data.province} ${data.postal_code}
              </p>
              ${data.preferred_installation_date !== 'Not specified' ? `
              <div class="info-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #3B82F6;">
                <span class="label">Preferred Date:</span>
                <span class="value"><strong style="color: #3B82F6; font-size: 16px;">${data.preferred_installation_date}</strong></span>
              </div>
              ` : ''}
              ${data.special_instructions !== 'None' ? `
              <div style="margin-top: 15px; padding: 15px; background-color: #FEF3C7; border-radius: 6px;">
                <p style="margin: 0; font-weight: bold; color: #92400E;">⚠️ Special Instructions:</p>
                <p style="margin: 5px 0 0; color: #1F2937;">${data.special_instructions}</p>
              </div>
              ` : ''}
            </div>

            <h2>Service Package</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value"><strong>${data.package_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Router:</span>
                <span class="value">${data.router_included}</span>
              </div>
            </div>

            <h2>Payment Status</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: ${data.payment_status === 'paid' ? '#10B981' : '#F59E0B'};">${data.payment_status.toUpperCase()}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Installation Fee:</span>
                <span class="value">R ${data.installation_fee.toFixed(2)}</span>
              </div>
              ${data.payment_status !== 'paid' ? `
              <p style="margin: 10px 0 0; padding: 10px; background-color: #FEF3C7; border-radius: 4px; font-size: 14px;">
                ⚠️ Note: Schedule installation only after payment confirmation
              </p>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #3B82F6;">
                📋 View Full Order Details
              </a>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <p style="margin: 0;"><strong>📞 Next Steps:</strong></p>
              <ol style="margin: 10px 0 0; padding-left: 20px;">
                <li>Confirm payment received</li>
                <li>Contact customer to schedule installation</li>
                <li>Assign technician</li>
                <li>Update order status in admin panel</li>
              </ol>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Service Delivery Team</p>
            <p>This is an automated notification from the CircleTel order management system</p>
          </div>
        `;
        break;

      case 'admin_urgent_order':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
            <h1>🚨 URGENT ORDER ALERT</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Immediate Action Required</p>
          </div>
          <div class="content">
            <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; border: 2px solid #EF4444; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px; color: #991B1B;">⚠️ ${data.urgency_reason}</h2>
              <p style="margin: 0; color: #991B1B; font-weight: bold;">This order requires immediate attention!</p>
            </div>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong style="font-size: 18px;">${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}" style="font-size: 16px; font-weight: bold;">${data.customer_phone}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name} (R ${data.package_price}/month)</span>
              </div>
              <div class="info-row">
                <span class="label">Location:</span>
                <span class="value">${data.installation_address}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #EF4444; font-size: 16px; padding: 15px 30px;">
                🚨 Handle Urgent Order Now
              </a>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Management Team</p>
            <p>Urgent notification - respond immediately</p>
          </div>
        `;
        break;

      case 'admin_payment_received':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>💰 Payment Received</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <div style="background-color: #D1FAE5; padding: 20px; border-radius: 8px; border-left: 4px solid #10B981; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px; color: #065F46;">✓ Payment Confirmed</h2>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #065F46;">
                R ${data.payment_amount.toFixed(2)}
              </p>
            </div>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">${data.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${data.payment_method}</span>
              </div>
              <div class="info-row">
                <span class="label">Transaction ID:</span>
                <span class="value">${data.transaction_id}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #10B981;">
                📋 View Order
              </a>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ol style="margin: 10px 0 0; padding-left: 20px;">
                <li>Update order status to "payment_received"</li>
                <li>Process KYC documents if pending</li>
                <li>Schedule installation</li>
              </ol>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Accounting Team</p>
          </div>
        `;
        break;

      case 'admin_installation_scheduled':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
            <h1>📅 Installation Scheduled</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <div style="background-color: #EDE9FE; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6; margin-bottom: 20px;">
              <h2 style="margin: 0 0 5px; color: #5B21B6;">Installation Date</h2>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #5B21B6;">
                ${data.installation_date}
              </p>
              <p style="margin: 5px 0 0; font-size: 16px; color: #5B21B6;">
                ${data.time_slot}
              </p>
            </div>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">${data.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Address:</span>
                <span class="value">${data.installation_address}</span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Technician:</span>
                <span class="value"><strong>${data.technician_name}</strong></span>
              </div>
              ${data.special_instructions !== 'None' ? `
              <div style="margin-top: 15px; padding: 15px; background-color: #FEF3C7; border-radius: 6px;">
                <p style="margin: 0; font-weight: bold;">Special Instructions:</p>
                <p style="margin: 5px 0 0;">${data.special_instructions}</p>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #8B5CF6;">
                📋 View Order
              </a>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Service Delivery Team</p>
          </div>
        `;
        break;

      case 'admin_installation_completed':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>Installation Completed</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number} - Quality Review Required</p>
          </div>
          <div class="content">
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400E; font-weight: bold;">
                Action Required: Please verify installation quality and approve for activation.
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">Installation Details</h3>
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Customer:</span>
                <span class="value">${data.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Address:</span>
                <span class="value">${data.installation_address}</span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Technician:</span>
                <span class="value"><strong>${data.technician_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Completed:</span>
                <span class="value">${data.completion_date}</span>
              </div>
            </div>

            <div style="margin: 20px 0; padding: 15px; border-radius: 8px; ${data.document_uploaded ? 'background-color: #D1FAE5; border-left: 4px solid #10B981;' : 'background-color: #FEE2E2; border-left: 4px solid #EF4444;'}">
              <h4 style="margin: 0 0 8px; color: ${data.document_uploaded ? '#065F46' : '#991B1B'};">
                ${data.document_uploaded ? 'Installation Document Uploaded' : 'No Document Uploaded'}
              </h4>
              ${data.document_uploaded ? `
                <p style="margin: 0; font-size: 14px; color: #047857;">
                  File: ${data.document_name || 'Document attached'}
                </p>
                ${data.document_url ? `<p style="margin: 8px 0 0;"><a href="${data.document_url}" style="color: #047857; text-decoration: underline;">View Installation Report</a></p>` : ''}
              ` : `
                <p style="margin: 0; font-size: 14px; color: #B91C1C;">
                  The technician did not upload installation documentation. Please follow up.
                </p>
              `}
            </div>

            ${data.notes ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
              <h4 style="margin: 0 0 8px; color: #374151;">Technician Notes</h4>
              <p style="margin: 0; font-size: 14px; color: #4B5563; white-space: pre-wrap;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin: 20px 0; padding: 15px; background-color: #F8F9FA; border-radius: 8px;">
              <h4 style="margin: 0 0 10px; color: #374151;">Quality Verification Checklist</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4B5563; line-height: 1.8;">
                <li>Installation report/photos uploaded and verified</li>
                <li>Equipment properly installed and secured</li>
                <li>Connection tested and working</li>
                <li>Customer signed off on installation</li>
                <li>No outstanding issues reported</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #10B981;">
                Review Order & Verify Quality
              </a>
            </div>

            <p style="text-align: center; font-size: 14px; color: #6B7280;">
              Once verified, the order can proceed to <strong>Activation</strong>.
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Service Delivery Team</p>
          </div>
        `;
        break;

      // =======================================================================
      // PARTNER EMAIL TEMPLATES
      // =======================================================================

      case 'partner_registration_welcome':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🤝 Welcome to CircleTel Partner Program!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Thank you for registering <strong>${data.business_name}</strong> with the CircleTel Partner Program!</p>

            <div class="info-box" style="background-color: #FFF7ED; border-left: 4px solid #F5831F;">
              <h3 style="margin-top: 0; color: #C2410C;">Registration Received</h3>
              <p>Your application has been received and is now pending review. Our team will verify your information and compliance documents.</p>
            </div>

            <h3>What Happens Next?</h3>
            <ol>
              <li><strong>Document Verification</strong> - We'll review your FICA/CIPC compliance documents</li>
              <li><strong>Application Review</strong> - Our partnerships team will assess your application</li>
              <li><strong>Approval Notification</strong> - You'll receive an email once approved</li>
              <li><strong>Partner Number Assignment</strong> - A unique partner number will be assigned to your account</li>
            </ol>

            <div class="info-box">
              <h3 style="margin-top: 0;">Your Registration Details</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value">${data.business_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Business Type:</span>
                <span class="value">${data.business_type}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value">${data.contact_person}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #F59E0B;">Pending Review</strong></span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button">
                Access Partner Portal
              </a>
            </div>

            <p>If you have any questions about the review process, please contact us at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'partner_compliance_submitted':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
            <h1>📄 Compliance Documents Received</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>We've received your compliance documents for <strong>${data.business_name}</strong>.</p>

            <div class="info-box" style="background-color: #DBEAFE; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0; color: #1E40AF;">Documents Under Review</h3>
              <p>Our compliance team will review your submitted documents within 2-3 business days.</p>
            </div>

            <h3>Documents Submitted</h3>
            <ul>
              ${data.documents_submitted?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Documents uploaded</li>'}
            </ul>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Partner Number:</span>
                <span class="value">${data.partner_number || 'Pending Approval'}</span>
              </div>
              <div class="info-row">
                <span class="label">Compliance Status:</span>
                <span class="value"><strong style="color: #3B82F6;">Under Review</strong></span>
              </div>
            </div>

            <p>You'll receive a notification once our review is complete. Thank you for your patience!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button" style="background-color: #3B82F6;">
                View Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Compliance Team</p>
            <p>compliance@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'partner_approved':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>🎉 Congratulations! You're Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Great news! <strong>${data.business_name}</strong> has been approved as a CircleTel Partner!</p>

            <div class="info-box" style="background-color: #D1FAE5; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #065F46;">Your Partner Number</h3>
              <p style="font-size: 28px; font-weight: bold; color: #065F46; margin: 10px 0;">
                ${data.partner_number}
              </p>
              <p style="margin: 0; font-size: 14px; color: #065F46;">Please save this number for your records</p>
            </div>

            <h3>Your Partner Benefits</h3>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Partner Tier:</span>
                <span class="value"><strong style="color: #F5831F; text-transform: capitalize;">${data.tier}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Commission Rate:</span>
                <span class="value"><strong>${data.commission_rate}%</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #10B981;">Active ✓</strong></span>
              </div>
            </div>

            <h3>Getting Started</h3>
            <ol>
              <li><strong>Access Your Portal</strong> - Log in to manage leads and track commissions</li>
              <li><strong>Download Marketing Materials</strong> - Access brochures and promotional content</li>
              <li><strong>Start Referring</strong> - Your unique partner code is ready for use</li>
              <li><strong>Track Earnings</strong> - Monitor your commissions in real-time</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button" style="background-color: #10B981;">
                Go to Partner Dashboard
              </a>
            </div>

            <p>Need help getting started? Our partner success team is here for you at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>Welcome to the team! 🎉</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'partner_rejected':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
            <h1>Partner Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Thank you for your interest in the CircleTel Partner Program.</p>

            <div class="info-box" style="background-color: #FEE2E2; border-left: 4px solid #EF4444;">
              <h3 style="margin-top: 0; color: #991B1B;">Application Not Approved</h3>
              <p>Unfortunately, we are unable to approve your partner application for <strong>${data.business_name}</strong> at this time.</p>
            </div>

            ${data.rejection_reason ? `
            <h3>Reason</h3>
            <div class="info-box">
              <p>${data.rejection_reason}</p>
            </div>
            ` : ''}

            <h3>What You Can Do</h3>
            <ul>
              <li><strong>Address the concerns</strong> mentioned above if applicable</li>
              <li><strong>Update your documents</strong> if they were incomplete or expired</li>
              <li><strong>Reapply</strong> after 30 days with updated information</li>
              <li><strong>Contact us</strong> if you have questions about this decision</li>
            </ul>

            <p>If you believe this decision was made in error or have additional information to provide, please contact our partnerships team at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      case 'admin_partner_registration_alert':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
            <h1>🆕 New Partner Registration</h1>
          </div>
          <div class="content">
            <h2>New Partner Application Received</h2>

            <div class="info-box" style="background-color: #EDE9FE; border-left: 4px solid #8B5CF6;">
              <h3 style="margin-top: 0; color: #5B21B6;">Business Information</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value"><strong>${data.business_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Business Type:</span>
                <span class="value">${data.business_type}</span>
              </div>
              <div class="info-row">
                <span class="label">Registration Number:</span>
                <span class="value">${data.registration_number || 'Not provided'}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Contact Information</h3>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value">${data.contact_person}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Location</h3>
              <p style="margin: 0;">${data.street_address}</p>
              <p style="margin: 5px 0 0; color: #6B7280;">${data.city}, ${data.province} ${data.postal_code}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/partners/${data.partner_id}" class="button" style="background-color: #8B5CF6;">
                Review Application
              </a>
            </div>

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong> Review partner application and compliance documents</p>
            </div>

            <p style="font-size: 12px; color: #6B7280;">
              <strong>Partner ID:</strong> ${data.partner_id}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Admin System</p>
            <p>Automated notification</p>
          </div>
        `;
        break;

      case 'admin_partner_compliance_review':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
            <h1>📋 Partner Compliance Documents Submitted</h1>
          </div>
          <div class="content">
            <h2>Compliance Review Required</h2>

            <div class="info-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
              <h3 style="margin-top: 0; color: #92400E;">Partner Details</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value"><strong>${data.business_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Partner Number:</span>
                <span class="value">${data.partner_number || 'Pending'}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact:</span>
                <span class="value">${data.contact_person}</span>
              </div>
            </div>

            <h3>Documents Submitted for Review</h3>
            <ul>
              ${data.documents_submitted?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Compliance documents uploaded</li>'}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/partners/${data.partner_id}/compliance" class="button" style="background-color: #F59E0B;">
                Review Documents
              </a>
            </div>

            <p style="font-size: 12px; color: #6B7280;">
              <strong>Partner ID:</strong> ${data.partner_id}<br>
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Compliance System</p>
            <p>Automated notification</p>
          </div>
        `;
        break;

      // =======================================================================
      // BILLING EMAIL TEMPLATES
      // =======================================================================

      case 'invoice_sent':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>📄 Your Invoice is Ready</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: white;">Invoice ${data.invoice_number}</p>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>Your invoice is now available for viewing and payment.</p>

            <div class="info-box" style="background-color: #D1FAE5; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #065F46;">Invoice Summary</h3>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Invoice Date:</span>
                <span class="value">${data.invoice_date}</span>
              </div>
              <div class="info-row">
                <span class="label">Due Date:</span>
                <span class="value"><strong style="color: #065F46;">${data.due_date}</strong></span>
              </div>
              ${data.period_start && data.period_end ? `
              <div class="info-row">
                <span class="label">Service Period:</span>
                <span class="value">${data.period_start} to ${data.period_end}</span>
              </div>
              ` : ''}
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
                <span class="label">Total Amount:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 22px;">R ${typeof data.total_amount === 'number' ? data.total_amount.toFixed(2) : data.total_amount}</strong></span>
              </div>
            </div>

            ${data.pdf_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.pdf_url}" class="button" style="background-color: #10B981;">
                📥 Download Invoice PDF
              </a>
            </div>
            ` : ''}

            <h3>💳 Payment Options</h3>
            <div class="info-box">
              <p><strong>EFT / Bank Transfer:</strong></p>
              <div class="info-row">
                <span class="label">Bank:</span>
                <span class="value">First National Bank (FNB)</span>
              </div>
              <div class="info-row">
                <span class="label">Account Name:</span>
                <span class="value">CircleTel (Pty) Ltd</span>
              </div>
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value">62956619547</span>
              </div>
              <div class="info-row">
                <span class="label">Branch Code:</span>
                <span class="value">250655</span>
              </div>
              <div class="info-row">
                <span class="label">Reference:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <p style="margin: 0;"><strong>💡 Tip:</strong> Please use your invoice number <strong>${data.invoice_number}</strong> as the payment reference to ensure your payment is allocated correctly.</p>
            </div>

            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

            <p>Thank you for choosing CircleTel!</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
            ${data.account_number ? `<p>Account Number: ${data.account_number}</p>` : ''}
          </div>
        `;
        break;

      case 'invoice_due_reminder':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
            <h1>⏰ Payment Reminder</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: white;">Invoice ${data.invoice_number} due in ${data.days_until_due} days</p>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>This is a friendly reminder that payment for your invoice is due in <strong>${data.days_until_due} days</strong>.</p>

            <div class="info-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
              <h3 style="margin-top: 0; color: #92400E;">Invoice Details</h3>
              <div class="info-row">
                <span class="label">Invoice Number:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Invoice Date:</span>
                <span class="value">${data.invoice_date}</span>
              </div>
              <div class="info-row">
                <span class="label">Due Date:</span>
                <span class="value"><strong style="color: #D97706;">${data.due_date}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Service:</span>
                <span class="value">${data.service_description}</span>
              </div>
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
                <span class="label">Amount Due:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 20px;">R ${typeof data.amount_due === 'number' ? data.amount_due.toFixed(2) : data.amount_due}</strong></span>
              </div>
            </div>

            <h3>💳 Payment Options</h3>
            <div class="info-box">
              <p><strong>EFT / Bank Transfer:</strong></p>
              <div class="info-row">
                <span class="label">Bank:</span>
                <span class="value">First National Bank (FNB)</span>
              </div>
              <div class="info-row">
                <span class="label">Account Name:</span>
                <span class="value">CircleTel (Pty) Ltd</span>
              </div>
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value">62956619547</span>
              </div>
              <div class="info-row">
                <span class="label">Branch Code:</span>
                <span class="value">250655</span>
              </div>
              <div class="info-row">
                <span class="label">Reference:</span>
                <span class="value"><strong>${data.invoice_number}</strong></span>
              </div>
            </div>

            ${data.pdf_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.pdf_url}" class="button" style="background-color: #F5831F;">
                📄 View Invoice PDF
              </a>
            </div>
            ` : ''}

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⚠️ Important:</strong> Please use your invoice number <strong>${data.invoice_number}</strong> as the payment reference to ensure your payment is allocated correctly.</p>
            </div>

            <p>If you have already made this payment, please disregard this reminder. If you have any questions about your invoice, please don't hesitate to contact us.</p>

            <p>Thank you for being a valued CircleTel customer!</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
            ${data.account_number ? `<p>Account Number: ${data.account_number}</p>` : ''}
          </div>
        `;
        break;

      case 'payment_method_registered':
        content = `
          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>Payment Method Confirmed</h1>
            <p style="margin: 5px 0 0; font-size: 14px; color: white;">Your debit order mandate has been signed</p>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>Great news! Your debit order mandate has been successfully signed and registered.</p>

            <div class="info-box" style="background-color: #D1FAE5; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #065F46;">Debit Order Details</h3>
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              ${data.account_number ? `
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value">${data.account_number}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Bank:</span>
                <span class="value">${data.bank_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Account:</span>
                <span class="value">${data.bank_account_masked}</span>
              </div>
              <div class="info-row">
                <span class="label">Service:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 10px; margin-top: 10px;">
                <span class="label">Monthly Amount:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 20px;">R ${typeof data.monthly_amount === 'number' ? data.monthly_amount.toFixed(2) : data.monthly_amount}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Debit Day:</span>
                <span class="value">${data.debit_day}${data.debit_day_suffix || ''} of each month</span>
              </div>
            </div>

            <div class="info-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
              <p style="margin: 0;"><strong>Important:</strong> Your first payment will only be processed after your service has been installed and activated. You will receive a pro-rata invoice based on your activation date.</p>
            </div>

            <h3>What happens next?</h3>
            <ol>
              <li>Our team will contact you to schedule your installation</li>
              <li>A technician will visit to install your connection</li>
              <li>Once activated, your first pro-rata invoice will be generated</li>
              <li>Monthly payments will be collected on the ${data.debit_day}${data.debit_day_suffix || ''} of each month</li>
            </ol>

            <p>If you have any questions about your payment setup, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>accounts@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
        break;

      default:
        content = `
          <div class="header">
            <h1>CircleTel Notification</h1>
          </div>
          <div class="content">
            <p>You have a new notification from CircleTel.</p>
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
          </div>
        `;
    }

    return baseTemplate(content);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// =============================================================================
// SMS NOTIFICATION SERVICE
// =============================================================================

export class SmsNotificationService {
  private static apiEndpoint = process.env.SMS_API_ENDPOINT;
  private static apiKey = process.env.SMS_API_KEY;
  private static senderId = 'CircleTel';

  /**
   * Send SMS notification
   */
  static async send(input: SmsNotificationInput): Promise<NotificationResult> {
    try {
      if (!this.apiEndpoint || !this.apiKey) {
        console.warn('SMS service not configured, skipping SMS notification');
        return {
          success: false,
          error: 'SMS service not configured',
        };
      }

      const message = input.template
        ? this.renderTemplate(input.template, input.data || {})
        : input.message;

      // Example SMS API call (adjust based on your SMS provider)
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: input.to,
          from: this.senderId,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send SMS');
      }

      const result = await response.json();

      return {
        success: true,
        message_id: result.message_id,
      };
    } catch (error: any) {
      console.error('Error sending SMS notification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
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
