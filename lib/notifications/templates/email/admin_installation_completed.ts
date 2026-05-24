/**
 * Email template: admin_installation_completed
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminInstallationCompleted(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>Installation Completed</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number} - Quality Review Required</p>
          </div>
          <div class="content">
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 20px;">
              <p style="margin: 0; color: #92400E; font-weight: bold;">
                Action Required: Please verify installation quality and approve for activation.
              </p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">Installation Details</h3>
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
              <div class="info-row">
                <span class="label">Completed:</span>
                <span class="value">${data.completion_date}</span>
              </div>
            </div>

            <div style="margin: 20px 0; padding: 15px; border-radius: 8px; ${data.document_uploaded ? 'background-color: #D1FAE5; border-left: 4px solid #10B981;' : 'background-color: #FEE2E2; border-left: 4px solid #EF4444;'}">
              <h4 style="margin: 0 0 8px; color: ${data.document_uploaded ? '#065F46' : '#991B1B'};">
                ${data.document_uploaded ? 'Installation Document Uploaded' : 'No Document Uploaded'}
              </h4>
              ${data.document_uploaded ? `
                <p style="margin: 0; font-size: 14px; color: #047857;">
                  File: ${data.document_name || 'Document attached'}
                </p>
                ${data.document_url ? `<p style="margin: 8px 0 0;"><a href="${data.document_url}" style="color: #047857; text-decoration: underline;">View Installation Report</a></p>` : ''}
              ` : `
                <p style="margin: 0; font-size: 14px; color: #B91C1C;">
                  The technician did not upload installation documentation. Please follow up.
                </p>
              `}
            </div>

            ${data.notes ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
              <h4 style="margin: 0 0 8px; color: #374151;">Technician Notes</h4>
              <p style="margin: 0; font-size: 14px; color: #4B5563; white-space: pre-wrap;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin: 20px 0; padding: 15px; background-color: #F8F9FA; border-radius: 8px;">
              <h4 style="margin: 0 0 10px; color: #374151;">Quality Verification Checklist</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4B5563; line-height: 1.8;">
                <li>Installation report/photos uploaded and verified</li>
                <li>Equipment properly installed and secured</li>
                <li>Connection tested and working</li>
                <li>Customer signed off on installation</li>
                <li>No outstanding issues reported</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #10B981;">
                Review Order & Verify Quality
              </a>
            </div>

            <p style="text-align: center; font-size: 14px; color: #6B7280;">
              Once verified, the order can proceed to <strong>Activation</strong>.
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Service Delivery Team</p>
          </div>
        `;
  return baseTemplate(content);
}
