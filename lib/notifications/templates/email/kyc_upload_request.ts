/**
 * Email template: kyc_upload_request
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderKycUploadRequest(data: Record<string, any>): string {
  const content = `          <div class="header">
            <h1>Action Required: PiUploadSimpleBold Documents</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            <p>To complete your order <strong>${data.order_number}</strong>, we need you to upload your FICA documents.</p>

            <p><strong>Required documents:</strong></p>
            <ul>
              <li>Copy of ID document (SA ID, passport, or driver's license)</li>
              <li>Proof of address (utility bill, bank statement - not older than 3 months)</li>
            </ul>

            <a href="${data.upload_url}" class="button">
              Upload Documents Now
            </a>

            <p>Once we receive and verify your documents, we'll proceed with scheduling your installation.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
