/**
 * Email template: payment_method_registered
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderPaymentMethodRegistered(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
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
  return baseTemplate(content);
}
