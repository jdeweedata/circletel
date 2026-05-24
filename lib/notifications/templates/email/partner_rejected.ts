/**
 * Email template: partner_rejected
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderPartnerRejected(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
            <h1>Partner Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Thank you for your interest in the CircleTel Partner Program.</p>

            <div class="info-box" style="background-color: #FEE2E2; border-left: 4px solid #EF4444;">
              <h3 style="margin-top: 0; color: #991B1B;">Application Not Approved</h3>
              <p>Unfortunately, we are unable to approve your partner application for <strong>${data.business_name}</strong> at this time.</p>
            </div>

            ${data.rejection_reason ? `
            <h3>Reason</h3>
            <div class="info-box">
              <p>${data.rejection_reason}</p>
            </div>
            ` : ''}

            <h3>What You Can Do</h3>
            <ul>
              <li><strong>Address the concerns</strong> mentioned above if applicable</li>
              <li><strong>Update your documents</strong> if they were incomplete or expired</li>
              <li><strong>Reapply</strong> after 30 days with updated information</li>
              <li><strong>Contact us</strong> if you have questions about this decision</li>
            </ul>

            <p>If you believe this decision was made in error or have additional information to provide, please contact our partnerships team at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
