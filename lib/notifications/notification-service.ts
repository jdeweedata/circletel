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
  | 'sales_business_quote_alert';

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
  private static fromEmail = 'noreply@circletel.co.za';
  private static fromName = 'CircleTel';

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

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: input.to,
          subject: input.subject,
          html,
          cc: input.cc,
          bcc: input.bcc,
        }),
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
