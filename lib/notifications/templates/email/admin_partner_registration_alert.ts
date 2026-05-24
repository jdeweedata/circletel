/**
 * Email template: admin_partner_registration_alert
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminPartnerRegistrationAlert(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
            <h1>🆕 New Partner Registration</h1>
          </div>
          <div class="content">
            <h2>New Partner Application Received</h2>

            <div class="info-box" style="background-color: #EDE9FE; border-left: 4px solid #8B5CF6;">
              <h3 style="margin-top: 0; color: #5B21B6;">Business Information</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value"><strong>${data.business_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Business Type:</span>
                <span class="value">${data.business_type}</span>
              </div>
              <div class="info-row">
                <span class="label">Registration Number:</span>
                <span class="value">${data.registration_number || 'Not provided'}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Contact Information</h3>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value">${data.contact_person}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Location</h3>
              <p style="margin: 0;">${data.street_address}</p>
              <p style="margin: 5px 0 0; color: #6B7280;">${data.city}, ${data.province} ${data.postal_code}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/partners/${data.partner_id}" class="button" style="background-color: #8B5CF6;">
                Review Application
              </a>
            </div>

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong> Review partner application and compliance documents</p>
            </div>

            <p style="font-size: 12px; color: #6B7280;">
              <strong>Partner ID:</strong> ${data.partner_id}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Admin System</p>
            <p>Automated notification</p>
          </div>
        `;
  return baseTemplate(content);
}
