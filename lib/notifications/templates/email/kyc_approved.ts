/**
 * Email template: kyc_approved
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderKycApproved(data: Record<string, any>): string {
  const content = `          <div class="header">
            <h1>✅ Documents Approved</h1>
          </div>
          <div class="content">
            <h2>Good news, ${data.customer_name}!</h2>
            <p>Your KYC documents have been reviewed and approved.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #10B981;">Approved ✓</strong></span>
              </div>
            </div>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Our team will contact you within 24-48 hours to schedule installation</li>
              <li>You'll receive an email with available installation dates</li>
              <li>Our technician will install your service at the agreed time</li>
              <li>Your service will be activated and you'll receive your account details</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}" class="button">
              View Order Status
            </a>

            <p>If you have any questions, feel free to contact us at support@circletel.co.za</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
