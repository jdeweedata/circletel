/**
 * Email template: admin_urgent_order
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminUrgentOrder(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
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
  return baseTemplate(content);
}
