/**
 * Email template: admin_new_order_sales
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminNewOrderSales(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🔔 New Customer Order</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <div style="background-color: ${data.urgency === 'high' ? '#FEE2E2' : data.urgency === 'medium' ? '#FEF3C7' : '#ECFDF5'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${data.urgency_color}; margin-bottom: 20px;">
              <p style="margin: 0; font-weight: bold; color: ${data.urgency_color};">
                ${data.urgency.toUpperCase()} PRIORITY ORDER
              </p>
            </div>

            <h2>Order Details</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Order Time:</span>
                <span class="value">${data.created_at}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${data.order_status}</span>
              </div>
            </div>

            <h2>Customer Information</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.customer_email}">${data.customer_email}</a></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}">${data.customer_phone}</a></span>
              </div>
              ${data.alternate_phone !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Alternate Phone:</span>
                <span class="value">${data.alternate_phone}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Preferred Contact:</span>
                <span class="value">${data.contact_preference}</span>
              </div>
            </div>

            <h2>Package & Pricing</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value"><strong>${data.package_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Fee:</span>
                <span class="value"><strong>R ${data.package_price.toFixed(2)}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Installation Fee:</span>
                <span class="value">R ${data.installation_fee.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Router:</span>
                <span class="value">${data.router_included} ${data.router_rental_fee > 0 ? '(R ' + data.router_rental_fee.toFixed(2) + '/month)' : ''}</span>
              </div>
              <div class="info-row" style="border-top: 2px solid #E6E9EF; padding-top: 8px; margin-top: 8px;">
                <span class="label">Total Monthly:</span>
                <span class="value"><strong style="color: #F5831F; font-size: 18px;">R ${data.total_monthly.toFixed(2)}</strong></span>
              </div>
            </div>

            <h2>Installation Address</h2>
            <div class="info-box">
              <p style="margin: 0;"><strong>${data.installation_address}</strong></p>
              <p style="margin: 5px 0 0; color: #6B7280;">
                ${data.suburb}, ${data.city}, ${data.province} ${data.postal_code}
              </p>
              ${data.preferred_installation_date !== 'Not specified' ? `
              <div class="info-row" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E6E9EF;">
                <span class="label">Preferred Date:</span>
                <span class="value"><strong>${data.preferred_installation_date}</strong></span>
              </div>
              ` : ''}
              ${data.special_instructions !== 'None' ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E6E9EF;">
                <p style="margin: 0; font-weight: bold; color: #4B5563;">Special Instructions:</p>
                <p style="margin: 5px 0 0;">${data.special_instructions}</p>
              </div>
              ` : ''}
            </div>

            <h2>Payment Status</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Payment Status:</span>
                <span class="value"><strong style="color: ${data.payment_status === 'paid' ? '#10B981' : '#F59E0B'};">${data.payment_status.toUpperCase()}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Payment Method:</span>
                <span class="value">${data.payment_method}</span>
              </div>
            </div>

            <h2>Lead Source</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Source:</span>
                <span class="value">${data.lead_source}</span>
              </div>
              ${data.source_campaign !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Campaign:</span>
                <span class="value">${data.source_campaign}</span>
              </div>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #F5831F;">
                📋 View Order in Admin Panel
              </a>
              ${data.customer_profile_url ? `
              <a href="${data.customer_profile_url}" class="button" style="background-color: #3B82F6; margin-left: 10px;">
                👤 View Customer Profile
              </a>
              ` : ''}
            </div>

            <div style="background-color: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏰ ACTION REQUIRED:</strong></p>
              <p style="margin: 5px 0 0;">
                ${data.urgency === 'high' ? 'Contact this customer immediately! High-priority order.' :
                  data.urgency === 'medium' ? 'Contact within 2 hours for best conversion rate.' :
                  'Follow up within 24 hours to schedule installation.'}
              </p>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Sales Team</p>
            <p>This is an automated notification from the CircleTel order management system</p>
          </div>
        `;
  return baseTemplate(content);
}
