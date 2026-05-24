/**
 * Email template: order_confirmation
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderOrderConfirmation(data: Record<string, any>): string {
  const content = `          <div class="header">
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
  return baseTemplate(content);
}
