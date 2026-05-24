/**
 * Email template: sales_business_quote_alert
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderSalesBusinessQuoteAlert(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, ${data.urgency_color || '#FF9800'} 0%, #F5831F 100%);">
            <h1>🚨 New Business Quote Request</h1>
            ${data.urgency ? `<p style="margin: 0; font-size: 16px; color: white; font-weight: bold;">${data.urgency.toUpperCase()} PRIORITY</p>` : ''}
          </div>
          <div class="content">
            <h2>Business Quote Request Received</h2>

            <div class="info-box" style="background-color: ${data.urgency === 'high' ? '#FEE2E2' : data.urgency === 'medium' ? '#FEF3C7' : '#D1FAE5'}; border-left: 4px solid ${data.urgency_color || '#FF9800'};">
              <h3 style="margin-top: 0;">Company Information</h3>
              <div class="info-row">
                <span class="label">Company Name:</span>
                <span class="value"><strong>${data.company_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value"><strong>${data.contact_name}</strong></span>
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
              <h3 style="margin-top: 0;">Quote Requirements</h3>
              <div class="info-row">
                <span class="label">Requested Service:</span>
                <span class="value">${data.requested_service}</span>
              </div>
              ${data.number_of_users ? `
              <div class="info-row">
                <span class="label">Number of Users:</span>
                <span class="value">${data.number_of_users}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Budget:</span>
                <span class="value">${data.budget}</span>
              </div>
              <div class="info-row">
                <span class="label">Urgency:</span>
                <span class="value"><strong style="color: ${data.urgency_color};">${data.urgency?.toUpperCase() || 'MEDIUM'}</strong></span>
              </div>
            </div>

            ${data.notes ? `
            <div class="info-box" style="background-color: #F9FAFB;">
              <h3 style="margin-top: 0;">Additional Notes</h3>
              <p>${data.notes}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/leads/${data.lead_id}" class="button">
                📋 View Lead Details
              </a>
            </div>

            ${data.urgency === 'high' ? `
            <div style="background-color: #FEE2E2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 20px 0;">
              <p style="margin: 0;"><strong>🔥 HIGH PRIORITY:</strong> This is a high-value lead. Contact immediately!</p>
            </div>
            ` : data.urgency === 'medium' ? `
            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ MEDIUM PRIORITY:</strong> Contact within 2 hours for best results.</p>
            </div>
            ` : ''}

            <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">
              <strong>Lead ID:</strong> ${data.lead_id}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Business Sales Team</p>
            <p>business@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
