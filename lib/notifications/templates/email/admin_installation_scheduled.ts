/**
 * Email template: admin_installation_scheduled
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminInstallationScheduled(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
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
  return baseTemplate(content);
}
