/**
 * Email template: partner_registration_welcome
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderPartnerRegistrationWelcome(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #F5831F 0%, #FF6B00 100%);">
            <h1>🤝 Welcome to CircleTel Partner Program!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Thank you for registering <strong>${data.business_name}</strong> with the CircleTel Partner Program!</p>

            <div class="info-box" style="background-color: #FFF7ED; border-left: 4px solid #F5831F;">
              <h3 style="margin-top: 0; color: #C2410C;">Registration Received</h3>
              <p>Your application has been received and is now pending review. Our team will verify your information and compliance documents.</p>
            </div>

            <h3>What Happens Next?</h3>
            <ol>
              <li><strong>Document Verification</strong> - We'll review your FICA/CIPC compliance documents</li>
              <li><strong>Application Review</strong> - Our partnerships team will assess your application</li>
              <li><strong>Approval Notification</strong> - You'll receive an email once approved</li>
              <li><strong>Partner Number Assignment</strong> - A unique partner number will be assigned to your account</li>
            </ol>

            <div class="info-box">
              <h3 style="margin-top: 0;">Your Registration Details</h3>
              <div class="info-row">
                <span class="label">Business Name:</span>
                <span class="value">${data.business_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Business Type:</span>
                <span class="value">${data.business_type}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact Person:</span>
                <span class="value">${data.contact_person}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #F59E0B;">Pending Review</strong></span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button">
                Access Partner Portal
              </a>
            </div>

            <p>If you have any questions about the review process, please contact us at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
