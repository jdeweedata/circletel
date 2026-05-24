/**
 * Email Template Registry
 * Maps EmailTemplate enum values to render functions extracted from notification-service.ts.
 */

import type { EmailTemplate } from '../notification-service';
import { baseTemplate } from './base-wrapper';
import { renderOrderConfirmation } from './email/order_confirmation';
import { renderQuoteSent } from './email/quote_sent';
import { renderInstallationScheduled } from './email/installation_scheduled';
import { renderKycUploadRequest } from './email/kyc_upload_request';
import { renderNoCoverageLeadConfirmation } from './email/no_coverage_lead_confirmation';
import { renderOrderActivated } from './email/order_activated';
import { renderKycApproved } from './email/kyc_approved';
import { renderKycRejected } from './email/kyc_rejected';
import { renderSalesCoverageLeadAlert } from './email/sales_coverage_lead_alert';
import { renderSalesBusinessQuoteAlert } from './email/sales_business_quote_alert';
import { renderAdminNewOrderSales } from './email/admin_new_order_sales';
import { renderAdminNewOrderServiceDelivery } from './email/admin_new_order_service_delivery';
import { renderAdminUrgentOrder } from './email/admin_urgent_order';
import { renderAdminPaymentReceived } from './email/admin_payment_received';
import { renderAdminInstallationScheduled } from './email/admin_installation_scheduled';
import { renderAdminInstallationCompleted } from './email/admin_installation_completed';
import { renderPartnerRegistrationWelcome } from './email/partner_registration_welcome';
import { renderPartnerComplianceSubmitted } from './email/partner_compliance_submitted';
import { renderPartnerApproved } from './email/partner_approved';
import { renderPartnerRejected } from './email/partner_rejected';
import { renderAdminPartnerRegistrationAlert } from './email/admin_partner_registration_alert';
import { renderAdminPartnerComplianceReview } from './email/admin_partner_compliance_review';
import { renderInvoiceSent } from './email/invoice_sent';
import { renderInvoiceDueReminder } from './email/invoice_due_reminder';
import { renderPaymentMethodRegistered } from './email/payment_method_registered';

export const emailTemplateRegistry: Partial<Record<EmailTemplate, (data: Record<string, any>) => string>> = {
  'order_confirmation': renderOrderConfirmation,
  'quote_sent': renderQuoteSent,
  'installation_scheduled': renderInstallationScheduled,
  'kyc_upload_request': renderKycUploadRequest,
  'no_coverage_lead_confirmation': renderNoCoverageLeadConfirmation,
  'order_activated': renderOrderActivated,
  'kyc_approved': renderKycApproved,
  'kyc_rejected': renderKycRejected,
  'sales_coverage_lead_alert': renderSalesCoverageLeadAlert,
  'sales_business_quote_alert': renderSalesBusinessQuoteAlert,
  'admin_new_order_sales': renderAdminNewOrderSales,
  'admin_new_order_service_delivery': renderAdminNewOrderServiceDelivery,
  'admin_urgent_order': renderAdminUrgentOrder,
  'admin_payment_received': renderAdminPaymentReceived,
  'admin_installation_scheduled': renderAdminInstallationScheduled,
  'admin_installation_completed': renderAdminInstallationCompleted,
  'partner_registration_welcome': renderPartnerRegistrationWelcome,
  'partner_compliance_submitted': renderPartnerComplianceSubmitted,
  'partner_approved': renderPartnerApproved,
  'partner_rejected': renderPartnerRejected,
  'admin_partner_registration_alert': renderAdminPartnerRegistrationAlert,
  'admin_partner_compliance_review': renderAdminPartnerComplianceReview,
  'invoice_sent': renderInvoiceSent,
  'invoice_due_reminder': renderInvoiceDueReminder,
  'payment_method_registered': renderPaymentMethodRegistered,
};

/** Render an email template by name with fallback */
export function renderEmailTemplate(template: EmailTemplate, data: Record<string, any>): string {
  const renderer = emailTemplateRegistry[template];
  if (!renderer) {
    const content = `
      <div class="header"><h1>CircleTel Notification</h1></div>
      <div class="content"><pre>${JSON.stringify(data, null, 2)}</pre></div>
      <div class="footer"><p>CircleTel (Pty) Ltd</p></div>`;
    return baseTemplate(content);
  }
  return renderer(data);
}
