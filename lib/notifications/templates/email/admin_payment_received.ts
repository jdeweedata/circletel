/**
 * Email template: admin_payment_received
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminPaymentReceived(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
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
  return baseTemplate(content);
}
