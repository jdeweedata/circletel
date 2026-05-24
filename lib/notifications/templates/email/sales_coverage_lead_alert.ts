/**
 * Email template: sales_coverage_lead_alert
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderSalesCoverageLeadAlert(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🔔 New Coverage Lead</h1>
          </div>
          <div class="content">
            <h2>New ${data.customer_type} Lead Captured</h2>

            <div class="info-box" style="background-color: #FFF7ED; border-left: 4px solid #F5831F;">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              ${data.company_name ? `
              <div class="info-row">
                <span class="label">Company:</span>
                <span class="value"><strong>${data.company_name}</strong></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.email}">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.phone}">${data.phone}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Customer Type:</span>
                <span class="value">${data.customer_type}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Requirements</h3>
              <div class="info-row">
                <span class="label">Requested Service:</span>
                <span class="value">${data.requested_service}</span>
              </div>
              <div class="info-row">
                <span class="label">Requested Speed:</span>
                <span class="value">${data.requested_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Budget Range:</span>
                <span class="value">${data.budget_range}</span>
              </div>
              <div class="info-row">
                <span class="label">Coverage Available:</span>
                <span class="value"><strong style="color: ${data.coverage_available === 'Yes' ? '#10B981' : '#EF4444'};">${data.coverage_available} ${data.coverage_available === 'Yes' ? '✓' : '✗'}</strong></span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Location</h3>
              <p><strong>Address:</strong><br>${data.address}</p>
              ${data.suburb ? `<p><strong>Suburb:</strong> ${data.suburb}</p>` : ''}
              ${data.city ? `<p><strong>City:</strong> ${data.city}</p>` : ''}
              ${data.province ? `<p><strong>Province:</strong> ${data.province}</p>` : ''}
              ${data.postal_code ? `<p><strong>Postal Code:</strong> ${data.postal_code}</p>` : ''}
            </div>

            ${data.source_campaign ? `
            <div class="info-box" style="background-color: #F3F4F6;">
              <div class="info-row">
                <span class="label">Campaign Source:</span>
                <span class="value">${data.source_campaign}</span>
              </div>
            </div>
            ` : ''}

            ${data.zoho_lead_url ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.zoho_lead_url}" class="button" style="background-color: #3B82F6;">
                🔗 Open in Zoho CRM
              </a>
            </div>
            ` : ''}

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong> Contact this lead within 30 minutes for best conversion rate!</p>
            </div>

            <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">
              <strong>Lead ID:</strong> ${data.lead_id}<br>
              ${data.zoho_lead_id ? `<strong>Zoho Lead ID:</strong> ${data.zoho_lead_id}<br>` : ''}
              <strong>Lead Source:</strong> ${data.lead_source || 'Website - Coverage Checker'}<br>
              <strong>Received:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>
          </div>
          <div class="footer">
            <p>CircleTel Sales Team</p>
            <p>sales@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
