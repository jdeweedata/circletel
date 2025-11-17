/**
 * Email Template Renderer
 * Renders React Email templates to HTML for sending via Resend
 */

import { render } from '@react-email/render';
import * as React from 'react';

// Import all email templates
import OrderConfirmationEmail from '@/emails/templates/consumer/order-confirmation';
import PaymentReceivedEmail from '@/emails/templates/consumer/payment-received';
import InstallationScheduledEmail from '@/emails/templates/consumer/installation-scheduled';
import InstallationReminderEmail from '@/emails/templates/consumer/installation-reminder';
import ServiceActivatedEmail from '@/emails/templates/consumer/service-activated';
import KycUploadRequestEmail from '@/emails/templates/consumer/kyc-upload-request';
import KycApprovedEmail from '@/emails/templates/consumer/kyc-approved';
import KycRejectedEmail from '@/emails/templates/consumer/kyc-rejected';
import PaymentMethodRegistrationEmail from '@/emails/templates/consumer/payment-method-registration';

import QuoteSentEmail from '@/emails/templates/business/quote-sent';
import QuoteApprovedEmail from '@/emails/templates/business/quote-approved';
import InvoiceGeneratedEmail from '@/emails/templates/business/invoice-generated';
import ContractSignedEmail from '@/emails/templates/business/contract-signed';
import KYCVerificationCompleteEmail from '@/emails/templates/business/kyc-verification-complete';

// =============================================================================
// TYPES
// =============================================================================

export type EmailTemplateId =
  // Consumer Templates
  | 'order_confirmation'
  | 'payment_received'
  | 'payment_method_registration'
  | 'installation_scheduled'
  | 'installation_reminder'
  | 'service_activated'
  | 'kyc_upload_request'
  | 'kyc_approved'
  | 'kyc_rejected'
  // Business Templates
  | 'quote_sent'
  | 'quote_approved'
  | 'invoice_generated'
  | 'contract_signed'
  | 'kyc_verification_complete';

export interface RenderEmailOptions {
  templateId: EmailTemplateId;
  props: Record<string, any>;
  pretty?: boolean; // Format HTML for readability (dev only)
}

export interface RenderedEmail {
  html: string;
  text?: string;
  subject: string;
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

/**
 * Maps template IDs to React Email components
 */
const TEMPLATE_REGISTRY: Record<EmailTemplateId, React.FC<any>> = {
  // Consumer Templates
  order_confirmation: OrderConfirmationEmail,
  payment_received: PaymentReceivedEmail,
  payment_method_registration: PaymentMethodRegistrationEmail,
  installation_scheduled: InstallationScheduledEmail,
  installation_reminder: InstallationReminderEmail,
  service_activated: ServiceActivatedEmail,
  kyc_upload_request: KycUploadRequestEmail,
  kyc_approved: KycApprovedEmail,
  kyc_rejected: KycRejectedEmail,

  // Business Templates
  quote_sent: QuoteSentEmail,
  quote_approved: QuoteApprovedEmail,
  invoice_generated: InvoiceGeneratedEmail,
  contract_signed: ContractSignedEmail,
  kyc_verification_complete: KYCVerificationCompleteEmail,
};

/**
 * Default subject lines for each template
 * Can be overridden by passing subject in props
 */
const TEMPLATE_SUBJECTS: Record<EmailTemplateId, string> = {
  // Consumer Templates
  order_confirmation: 'Order Confirmed: {{orderNumber}}',
  payment_received: 'Payment Received: {{paymentAmount}}',
  installation_scheduled: 'Installation Scheduled: {{installationDate}}',
  installation_reminder: 'Installation Reminder: Tomorrow at {{installationTime}}',
  service_activated: 'Welcome to CircleTel - Service Activated',
  kyc_upload_request: 'Action Required: Upload KYC Documents - {{orderNumber}}',
  kyc_approved: '✅ Documents Approved - {{orderNumber}}',
  kyc_rejected: '⚠️ Documents Need Revision - {{orderNumber}}',

  // Business Templates
  quote_sent: 'Your CircleTel Quote: {{quoteNumber}}',
  quote_approved: 'Quote Approved: {{quoteNumber}}',
  invoice_generated: 'Invoice {{invoiceNumber}} - Amount Due: {{totalAmount}}',
  contract_signed: 'Contract Signed: {{contractNumber}}',
  kyc_verification_complete: 'KYC Verification Complete',
};

// =============================================================================
// EMAIL RENDERER SERVICE
// =============================================================================

export class EmailRenderer {
  /**
   * Render a React Email template to HTML
   */
  static async renderTemplate(options: RenderEmailOptions): Promise<RenderedEmail> {
    const { templateId, props, pretty = false } = options;

    // Get template component
    const TemplateComponent = TEMPLATE_REGISTRY[templateId];
    if (!TemplateComponent) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Render React component to HTML (render returns a Promise)
    const html = await render(React.createElement(TemplateComponent, props), {
      pretty,
    });

    // Generate plain text version (strip HTML tags)
    const text = this.htmlToPlainText(html);

    // Get subject line and substitute variables
    const subjectTemplate = TEMPLATE_SUBJECTS[templateId];
    const subject = this.substituteVariables(subjectTemplate, props);

    return {
      html,
      text,
      subject,
    };
  }

  /**
   * Convert HTML to plain text (basic implementation)
   * For production, consider using a library like html-to-text
   */
  private static htmlToPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .trim();
  }

  /**
   * Substitute {{variables}} in a string
   */
  private static substituteVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  /**
   * Get list of available template IDs
   */
  static getAvailableTemplates(): EmailTemplateId[] {
    return Object.keys(TEMPLATE_REGISTRY) as EmailTemplateId[];
  }

  /**
   * Check if a template exists
   */
  static templateExists(templateId: string): boolean {
    return templateId in TEMPLATE_REGISTRY;
  }

  /**
   * Get template metadata
   */
  static getTemplateInfo(templateId: EmailTemplateId) {
    return {
      id: templateId,
      exists: this.templateExists(templateId),
      subjectTemplate: TEMPLATE_SUBJECTS[templateId],
      component: TEMPLATE_REGISTRY[templateId]?.name || 'Unknown',
    };
  }

  /**
   * Render multiple templates in parallel (for testing/preview)
   */
  static async renderMultiple(
    templates: RenderEmailOptions[]
  ): Promise<RenderedEmail[]> {
    return Promise.all(
      templates.map((options) => this.renderTemplate(options))
    );
  }

  /**
   * Preview template in development (pretty HTML)
   */
  static async previewTemplate(
    templateId: EmailTemplateId,
    props: Record<string, any>
  ): Promise<string> {
    const { html } = await this.renderTemplate({
      templateId,
      props,
      pretty: true,
    });
    return html;
  }
}

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

/**
 * Quick render function for common use cases
 */
export async function renderEmail(
  templateId: EmailTemplateId,
  props: Record<string, any>
): Promise<RenderedEmail> {
  return EmailRenderer.renderTemplate({ templateId, props });
}

/**
 * Render email to HTML only (no text or subject)
 */
export async function renderEmailHtml(
  templateId: EmailTemplateId,
  props: Record<string, any>
): Promise<string> {
  const { html } = await EmailRenderer.renderTemplate({ templateId, props });
  return html;
}

/**
 * Get email subject line with variables substituted
 */
export function getEmailSubject(
  templateId: EmailTemplateId,
  props: Record<string, any>
): string {
  const subjectTemplate = TEMPLATE_SUBJECTS[templateId];
  return EmailRenderer['substituteVariables'](subjectTemplate, props);
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

/*
// Example 1: Render order confirmation
const email = await renderEmail('order_confirmation', {
  customerName: 'John Doe',
  orderNumber: 'ORD-20251108-9841',
  orderUrl: 'https://www.circletel.co.za/orders/123',
  packageName: '100Mbps Fibre',
  totalAmount: 'R 799.00',
  installationDate: '15 November 2025',
});

console.log(email.subject); // "Order Confirmed: ORD-20251108-9841"
console.log(email.html);    // Full HTML email
console.log(email.text);    // Plain text version

// Example 2: Preview template in browser
const html = await EmailRenderer.previewTemplate('quote_sent', {
  customerName: 'Jane Smith',
  companyName: 'ABC Corp',
  quoteNumber: 'QT-2025-001',
  quoteUrl: 'https://www.circletel.co.za/quotes/123',
});

// Example 3: Check if template exists
if (EmailRenderer.templateExists('order_confirmation')) {
  const info = EmailRenderer.getTemplateInfo('order_confirmation');
  console.log(info);
}

// Example 4: Render multiple templates
const emails = await EmailRenderer.renderMultiple([
  { templateId: 'order_confirmation', props: {...} },
  { templateId: 'payment_received', props: {...} },
]);
*/
