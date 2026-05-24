/**
 * Email template: kyc_rejected
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderKycRejected(data: Record<string, any>): string {
  const content = `          <div class="header">
            <h1>⚠️ Documents Require Attention</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>We've reviewed your KYC documents for order <strong>${data.order_number}</strong>, but unfortunately we need you to re-submit some documents.</p>

            <div class="info-box" style="background-color: #FEE2E2; border-left: 4px solid #EF4444;">
              <p><strong>Reason for rejection:</strong></p>
              <p>${data.rejection_reason}</p>
            </div>

            <p><strong>Please re-upload your documents with the following in mind:</strong></p>
            <ul>
              <li>Documents must be clear and legible</li>
              <li>ID documents must be valid and not expired</li>
              <li>Proof of address must not be older than 3 months</li>
              <li>All information must be visible (no cut-off edges)</li>
              <li>Documents must be in PDF, JPG, or PNG format</li>
            </ul>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.order_number}/kyc" class="button">
              Upload Documents Again
            </a>

            <p>Once we receive your updated documents, we'll review them within 24 hours and proceed with your installation.</p>

            <p>Need help? Contact us at support@circletel.co.za or 0860 CIRCLE (0860 247 253)</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
