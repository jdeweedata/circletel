/**
 * Email template: partner_compliance_submitted
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderPartnerComplianceSubmitted(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
            <h1>📄 Compliance Documents Received</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>We've received your compliance documents for <strong>${data.business_name}</strong>.</p>

            <div class="info-box" style="background-color: #DBEAFE; border-left: 4px solid #3B82F6;">
              <h3 style="margin-top: 0; color: #1E40AF;">Documents Under Review</h3>
              <p>Our compliance team will review your submitted documents within 2-3 business days.</p>
            </div>

            <h3>Documents Submitted</h3>
            <ul>
              ${data.documents_submitted?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Documents uploaded</li>'}
            </ul>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Partner Number:</span>
                <span class="value">${data.partner_number || 'Pending Approval'}</span>
              </div>
              <div class="info-row">
                <span class="label">Compliance Status:</span>
                <span class="value"><strong style="color: #3B82F6;">Under Review</strong></span>
              </div>
            </div>

            <p>You'll receive a notification once our review is complete. Thank you for your patience!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button" style="background-color: #3B82F6;">
                View Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Compliance Team</p>
            <p>compliance@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
