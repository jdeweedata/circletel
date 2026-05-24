/**
 * Email template: quote_sent
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderQuoteSent(data: Record<string, any>): string {
  const content = `          <div class="header">
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
  return baseTemplate(content);
}
