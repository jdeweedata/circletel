/**
 * Email template: order_activated
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderOrderActivated(data: Record<string, any>): string {
  const content = `          <div class="header">
            <h1>🎉 Your Service is Now Active!</h1>
          </div>
          <div class="content">
            <h2>Welcome to CircleTel, ${data.customer_name}!</h2>
            <p>Great news! Your CircleTel internet service has been successfully activated and is now live.</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">Order Number:</span>
                <span class="value">${data.order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">Account Number:</span>
                <span class="value"><strong>${data.account_number}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Package:</span>
                <span class="value">${data.package_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Speed:</span>
                <span class="value">${data.package_speed}</span>
              </div>
              <div class="info-row">
                <span class="label">Monthly Fee:</span>
                <span class="value">R ${data.monthly_price.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="label">Service Start Date:</span>
                <span class="value">${data.service_start_date}</span>
              </div>
            </div>

            <h3>🔐 Your Account Details</h3>
            <div class="info-box" style="background-color: #FFF4E6; border-left: 4px solid #F5831F;">
              <p><strong>Account Number:</strong> ${data.account_number}</p>
              <p><strong>Temporary Password:</strong> ${data.temporary_password}</p>
              <p><em style="color: #4B5563; font-size: 14px;">⚠️ Please change your password after your first login for security.</em></p>
            </div>

            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/login" class="button">
              Login to Your Account
            </a>

            <h3>📊 Manage Your Service</h3>
            <p>With your CircleTel account, you can:</p>
            <ul>
              <li>View and download invoices</li>
              <li>Monitor your usage and billing</li>
              <li>Update your contact information</li>
              <li>Request technical support</li>
              <li>Upgrade or change your package</li>
            </ul>

            <h3>💡 Getting Started</h3>
            <ol>
              <li>Connect your devices to your router/modem</li>
              <li>Use the Wi-Fi credentials provided by our technician</li>
              <li>Test your connection by visiting <a href="https://fast.com">fast.com</a></li>
              <li>Login to your account and set a new password</li>
            </ol>

            ${data.invoice_number ? `
            <h3>📄 Your Invoice</h3>
            <p>Your initial invoice (${data.invoice_number}) has been generated and is available in your account portal. This includes:</p>
            <ul>
              <li>Installation Fee: R ${data.installation_fee.toFixed(2)}</li>
              ${data.router_fee ? `<li>Router/Equipment: R ${data.router_fee.toFixed(2)}</li>` : ''}
              <li>First Month Service: R ${data.monthly_price.toFixed(2)}</li>
            </ul>
            <p><strong>Total Due:</strong> R ${data.invoice_total.toFixed(2)} (incl. VAT)</p>
            <p>Payment is due within 7 days. Visit your account portal to pay online.</p>
            ` : ''}

            <h3>📞 Need Help?</h3>
            <p>Our support team is here to assist you:</p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:support@circletel.co.za">support@circletel.co.za</a></li>
              <li><strong>Phone:</strong> 0860 CIRCLE (0860 247 253)</li>
              <li><strong>WhatsApp:</strong> +27 (0)11 123 4567</li>
              <li><strong>Hours:</strong> Mon-Fri 8am-6pm, Sat 9am-1pm</li>
            </ul>

            <p>Thank you for choosing CircleTel! We're committed to providing you with fast, reliable internet service.</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>Your Connection, Our Priority</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}">circletel.co.za</a> | support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
