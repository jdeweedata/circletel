/**
 * Email template: installation_scheduled
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderInstallationScheduled(data: Record<string, any>): string {
  const content = `          <div class="header">
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
  return baseTemplate(content);
}
