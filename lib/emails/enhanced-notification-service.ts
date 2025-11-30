/**
 * Enhanced Notification Service with React Email Integration
 * Uses EmailRenderer to send beautifully designed emails
 */

import { EmailRenderer, type EmailTemplateId } from './email-renderer';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

export interface SendEmailOptions {
  to: string | string[];
  templateId: EmailTemplateId;
  props: Record<string, any>;
  cc?: string[];
  bcc?: string[];
  from?: string;
  replyTo?: string;
  // Tracking metadata
  orderId?: string;
  customerId?: string;
}

export interface EmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

// =============================================================================
// ENHANCED EMAIL SERVICE
// =============================================================================

export class EnhancedEmailService {
  private static apiKey = process.env.RESEND_API_KEY;
  private static fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@notifications.circletelsa.co.za';
  private static fromName = 'CircleTel';
  private static replyToEmail = process.env.RESEND_REPLY_TO_EMAIL || 'contactus@circletel.co.za';

  /**
   * Send email using React Email template
   */
  static async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const {
        to,
        templateId,
        props,
        cc,
        bcc,
        from,
        replyTo,
        orderId,
        customerId,
      } = options;

      // Check API key
      if (!this.apiKey) {
        console.warn('⚠️ RESEND_API_KEY not configured, email not sent');
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      // Render template
      const { html, text, subject } = await EmailRenderer.renderTemplate({
        templateId,
        props,
        pretty: false, // Compact HTML for production
      });

      console.log(`📧 Sending email: ${subject} to ${Array.isArray(to) ? to.join(', ') : to}`);

      // Send via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || `${this.fromName} <${this.fromEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
          cc,
          bcc,
          reply_to: replyTo || this.replyToEmail,
          tags: [
            { name: 'template', value: templateId },
            orderId ? { name: 'order_id', value: orderId } : null,
            customerId ? { name: 'customer_id', value: customerId } : null,
          ].filter(Boolean),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      const result = await response.json();

      console.log(`✅ Email sent successfully! Message ID: ${result.id}`);

      // Record notification tracking
      await this.recordEmailSent({
        message_id: result.id,
        email: Array.isArray(to) ? to[0] : to,
        order_id: orderId,
        customer_id: customerId,
        template_id: templateId,
        subject,
      });

      // Increment template send count
      await this.incrementTemplateSendCount(templateId);

      return {
        success: true,
        message_id: result.id,
      };
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Record email sent event in notification_tracking table
   */
  private static async recordEmailSent(data: {
    message_id: string;
    email: string;
    order_id?: string;
    customer_id?: string;
    template_id: string;
    subject: string;
  }): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('notification_tracking').insert({
        message_id: data.message_id,
        event_type: 'sent',
        notification_type: 'email',
        email: data.email,
        order_id: data.order_id,
        customer_id: data.customer_id,
        timestamp: new Date().toISOString(),
        metadata: {
          template_id: data.template_id,
          subject: data.subject,
        },
      });
    } catch (error) {
      console.error('Failed to record email tracking:', error);
      // Don't fail the email send if tracking fails
    }
  }

  /**
   * Increment send count for email template
   */
  private static async incrementTemplateSendCount(templateId: string): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.rpc('increment_email_template_send_count', {
        p_template_id: templateId,
      });
    } catch (error) {
      console.error('Failed to increment template send count:', error);
      // Don't fail the email send if this fails
    }
  }

  /**
   * Send order confirmation email
   */
  static async sendOrderConfirmation(order: {
    id: string;
    order_number: string;
    email: string;
    first_name: string;
    last_name: string;
    package_name: string;
    package_speed: string;
    package_price: number;
    installation_fee: number;
    installation_address: string;
    installation_date?: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: order.email,
      templateId: 'order_confirmation',
      props: {
        customerName: `${order.first_name} ${order.last_name}`,
        orderNumber: order.order_number,
        orderUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.order_number}`,
        packageName: order.package_name,
        packageSpeed: order.package_speed,
        monthlyAmount: `R ${order.package_price.toFixed(2)}`,
        installationFee: `R ${order.installation_fee.toFixed(2)}`,
        totalAmount: `R ${(order.package_price + order.installation_fee).toFixed(2)}`,
        installationAddress: order.installation_address,
        installationDate: order.installation_date || 'To be scheduled',
      },
      orderId: order.id,
    });
  }

  /**
   * Send payment received email
   */
  static async sendPaymentReceived(payment: {
    order_id: string;
    email: string;
    customer_name: string;
    payment_amount: number;
    payment_method: string;
    order_number: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: payment.email,
      templateId: 'payment_received',
      props: {
        customerName: payment.customer_name,
        paymentAmount: `R ${payment.payment_amount.toFixed(2)}`,
        paymentMethod: payment.payment_method,
        orderNumber: payment.order_number,
        receiptUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${payment.order_number}/receipt`,
      },
      orderId: payment.order_id,
    });
  }

  /**
   * Send installation scheduled email
   */
  static async sendInstallationScheduled(installation: {
    order_id: string;
    email: string;
    customer_name: string;
    installation_date: string;
    installation_time: string;
    installation_address: string;
    technician_name?: string;
    technician_phone?: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: installation.email,
      templateId: 'installation_scheduled',
      props: {
        customerName: installation.customer_name,
        installationDate: installation.installation_date,
        installationTime: installation.installation_time,
        installationAddress: installation.installation_address,
        technicianName: installation.technician_name,
        technicianPhone: installation.technician_phone,
      },
      orderId: installation.order_id,
    });
  }

  /**
   * Send quote sent email (B2B)
   */
  static async sendQuoteSent(quote: {
    email: string;
    customer_name: string;
    company_name: string;
    quote_number: string;
    quote_url: string;
    quote_amount: string;
    valid_until: string;
    agent_name?: string;
    agent_email?: string;
    agent_phone?: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: quote.email,
      templateId: 'quote_sent',
      props: {
        customerName: quote.customer_name,
        companyName: quote.company_name,
        quoteNumber: quote.quote_number,
        quoteUrl: quote.quote_url,
        quoteAmount: quote.quote_amount,
        validUntil: quote.valid_until,
        agentName: quote.agent_name,
        agentEmail: quote.agent_email,
        agentPhone: quote.agent_phone,
      },
    });
  }

  /**
   * Send quote approved email (B2B)
   */
  static async sendQuoteApproved(quote: {
    email: string;
    customer_name: string;
    company_name: string;
    quote_number: string;
    acceptance_url: string;
    quote_amount: string;
    valid_until: string;
    package_name?: string;
    monthly_amount?: string;
    installation_amount?: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: quote.email,
      templateId: 'quote_approved',
      props: {
        customerName: quote.customer_name,
        companyName: quote.company_name,
        quoteNumber: quote.quote_number,
        acceptanceUrl: quote.acceptance_url,
        quoteAmount: quote.quote_amount,
        validUntil: quote.valid_until,
        packageName: quote.package_name,
        monthlyAmount: quote.monthly_amount,
        installationAmount: quote.installation_amount,
      },
    });
  }

  /**
   * Send invoice generated email
   */
  static async sendInvoiceGenerated(invoice: {
    invoice_id: string;
    customer_id: string;
    email: string;
    customer_name: string;
    company_name?: string;
    invoice_number: string;
    total_amount: number;
    subtotal: number;
    vat_amount: number;
    due_date: string;
    account_number?: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
  }): Promise<EmailResult> {
    // Format line items for email template
    const formattedLineItems = invoice.line_items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: `R ${item.unit_price.toFixed(2)}`,
      total: `R ${item.amount.toFixed(2)}`,
    }));

    // Format due date
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

    return this.sendEmail({
      to: invoice.email,
      templateId: 'invoice_generated',
      props: {
        customerName: invoice.customer_name,
        companyName: invoice.company_name || invoice.customer_name,
        invoiceNumber: invoice.invoice_number,
        invoiceUrl: `${baseUrl}/dashboard/invoices/${invoice.invoice_id}`,
        paymentUrl: `${baseUrl}/dashboard/invoices/${invoice.invoice_id}/pay`,
        totalAmount: `R ${invoice.total_amount.toFixed(2)}`,
        dueDate,
        lineItems: formattedLineItems,
        subtotal: `R ${invoice.subtotal.toFixed(2)}`,
        vatAmount: `R ${invoice.vat_amount.toFixed(2)}`,
        accountNumber: invoice.account_number,
      },
      customerId: invoice.customer_id,
    });
  }

  /**
   * Send test email (for testing)
   */
  static async sendTestEmail(to: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      templateId: 'order_confirmation',
      props: {
        customerName: 'Test User',
        orderNumber: 'ORD-TEST-001',
        orderUrl: 'https://www.circletel.co.za/orders/test',
        packageName: '100Mbps Fibre Test',
        packageSpeed: '100Mbps',
        monthlyAmount: 'R 799.00',
        installationFee: 'R 0.00',
        totalAmount: 'R 799.00',
        installationAddress: '123 Test Street, Test City',
        installationDate: 'To be scheduled',
      },
    });
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export const sendEmail = EnhancedEmailService.sendEmail.bind(EnhancedEmailService);
export const sendOrderConfirmation = EnhancedEmailService.sendOrderConfirmation.bind(EnhancedEmailService);
export const sendPaymentReceived = EnhancedEmailService.sendPaymentReceived.bind(EnhancedEmailService);
export const sendInstallationScheduled = EnhancedEmailService.sendInstallationScheduled.bind(EnhancedEmailService);
export const sendQuoteSent = EnhancedEmailService.sendQuoteSent.bind(EnhancedEmailService);
export const sendQuoteApproved = EnhancedEmailService.sendQuoteApproved.bind(EnhancedEmailService);
export const sendInvoiceGenerated = EnhancedEmailService.sendInvoiceGenerated.bind(EnhancedEmailService);
export const sendTestEmail = EnhancedEmailService.sendTestEmail.bind(EnhancedEmailService);
