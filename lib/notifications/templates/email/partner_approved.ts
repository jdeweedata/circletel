/**
 * Email template: partner_approved
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderPartnerApproved(data: Record<string, any>): string {
  const content = `          <div class="header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
            <h1>🎉 Congratulations! You're Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.contact_person},</h2>
            <p>Great news! <strong>${data.business_name}</strong> has been approved as a CircleTel Partner!</p>

            <div class="info-box" style="background-color: #D1FAE5; border-left: 4px solid #10B981;">
              <h3 style="margin-top: 0; color: #065F46;">Your Partner Number</h3>
              <p style="font-size: 28px; font-weight: bold; color: #065F46; margin: 10px 0;">
                ${data.partner_number}
              </p>
              <p style="margin: 0; font-size: 14px; color: #065F46;">Please save this number for your records</p>
            </div>

            <h3>Your Partner Benefits</h3>
            <div class="info-box">
              <div class="info-row">
                <span class="label">Partner Tier:</span>
                <span class="value"><strong style="color: #F5831F; text-transform: capitalize;">${data.tier}</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Commission Rate:</span>
                <span class="value"><strong>${data.commission_rate}%</strong></span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value"><strong style="color: #10B981;">Active ✓</strong></span>
              </div>
            </div>

            <h3>Getting Started</h3>
            <ol>
              <li><strong>Access Your Portal</strong> - Log in to manage leads and track commissions</li>
              <li><strong>Download Marketing Materials</strong> - Access brochures and promotional content</li>
              <li><strong>Start Referring</strong> - Your unique partner code is ready for use</li>
              <li><strong>Track Earnings</strong> - Monitor your commissions in real-time</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/partner/dashboard" class="button" style="background-color: #10B981;">
                Go to Partner Dashboard
              </a>
            </div>

            <p>Need help getting started? Our partner success team is here for you at <a href="mailto:partners@circletel.co.za">partners@circletel.co.za</a></p>
          </div>
          <div class="footer">
            <p>CircleTel Partner Program</p>
            <p>Welcome to the team! 🎉</p>
            <p>partners@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
