/**
 * Email template: admin_partner_compliance_review
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminPartnerComplianceReview(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
            <h1>📋 Partner Compliance Documents Submitted</h1>
          </div>
          <div class="content">
            <h2>Compliance Review Required</h2>

            <div class="info-box" style="background-color: #FEF3C7; border-left: 4px solid #F59E0B;">
              <h3 style="margin-top: 0; color: #92400E;">Partner Details</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value"><strong>${data.business_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Partner Number:</span>
                <span class="value">${data.partner_number || 'Pending'}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact:</span>
                <span class="value">${data.contact_person}</span>
              </div>
            </div>

            <h3>Documents Submitted for Review</h3>
            <ul>
              ${data.documents_submitted?.map((doc: string) => `<li>${doc}</li>`).join('') || '<li>Compliance documents uploaded</li>'}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/partners/${data.partner_id}/compliance" class="button" style="background-color: #F59E0B;">
                Review Documents
              </a>
            </div>

            <p style="font-size: 12px; color: #6B7280;">
              <strong>Partner ID:</strong> ${data.partner_id}<br>
              <strong>Submitted:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Compliance System</p>
            <p>Automated notification</p>
          </div>
        `;
  return baseTemplate(content);
}
