/**
 * Email template: admin_new_order_service_delivery
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderAdminNewOrderServiceDelivery(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
            <h1>📦 New Installation Required</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">Order ${data.order_number}</p>
          </div>
          <div class="content">
            <h2>Installation Request</h2>
            <div class="info-box" style="background-color: #DBEAFE; border-left: 4px solid #3B82F6;">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value"><strong>${data.order_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Order Date:</span>
                <span class="value">${data.created_at}</span>
              </div>
              <div class="info-row">
                <span class="label">Priority:</span>
                <span class="value"><strong style="color: ${data.urgency_color};">${data.urgency.toUpperCase()}</strong></span>
              </div>
            </div>

            <h2>Customer Contact</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value"><strong>${data.customer_name}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value"><a href="tel:${data.customer_phone}" style="font-size: 16px; font-weight: bold;">${data.customer_phone}</a></span>
              </div>
              ${data.alternate_phone !== 'N/A' ? `
              <div class="info-row">
                <span class="label">Alternate:</span>
                <span class="value"><a href="tel:${data.alternate_phone}">${data.alternate_phone}</a></span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${data.customer_email}">${data.customer_email}</a></span>
              </div>
            </div>

            <h2>Installation Location</h2>
            <div class="info-box">
              <p style="margin: 0; font-size: 16px;"><strong>${data.installation_address}</strong></p>
              <p style="margin: 5px 0 0; color: #6B7280;">
                ${data.suburb}, ${data.city}, ${data.province} ${data.postal_code}
              </p>
              ${data.preferred_installation_date !== 'Not specified' ? `
              <div class="info-row" style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #3B82F6;">
                <span class="label">Preferred Date:</span>
                <span class="value"><strong style="color: #3B82F6; font-size: 16px;">${data.preferred_installation_date}</strong></span>
              </div>
              ` : ''}
              ${data.special_instructions !== 'None' ? `
              <div style="margin-top: 15px; padding: 15px; background-color: #FEF3C7; border-radius: 6px;">
                <p style="margin: 0; font-weight: bold; color: #92400E;">⚠️ Special Instructions:</p>
                <p style="margin: 5px 0 0; color: #1F2937;">${data.special_instructions}</p>
              </div>
              ` : ''}
            </div>

            <h2>Service Package</h2>
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
                <span class="label">Router:</span>
                <span class="value">${data.router_included}</span>
              </div>
            </div>

            <h2>Payment Status</h2>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: ${data.payment_status === 'paid' ? '#10B981' : '#F59E0B'};">${data.payment_status.toUpperCase()}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Installation Fee:</span>
                <span class="value">R ${data.installation_fee.toFixed(2)}</span>
              </div>
              ${data.payment_status !== 'paid' ? `
              <p style="margin: 10px 0 0; padding: 10px; background-color: #FEF3C7; border-radius: 4px; font-size: 14px;">
                ⚠️ Note: Schedule installation only after payment confirmation
              </p>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.admin_order_url}" class="button" style="background-color: #3B82F6;">
                📋 View Full Order Details
              </a>
            </div>

            <div style="background-color: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0;">
              <p style="margin: 0;"><strong>📞 Next Steps:</strong></p>
              <ol style="margin: 10px 0 0; padding-left: 20px;">
                <li>Confirm payment received</li>
                <li>Contact customer to schedule installation</li>
                <li>Assign technician</li>
                <li>Update order status in admin panel</li>
              </ol>
            </div>
          </div>
          <div class="footer">
            <p>CircleTel Service Delivery Team</p>
            <p>This is an automated notification from the CircleTel order management system</p>
          </div>
        `;
  return baseTemplate(content);
}
