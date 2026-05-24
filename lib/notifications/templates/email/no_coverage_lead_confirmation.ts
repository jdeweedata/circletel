/**
 * Email template: no_coverage_lead_confirmation
 * Auto-extracted from notification-service.ts renderTemplate method.
 */

import { baseTemplate } from '../base-wrapper';

export function renderNoCoverageLeadConfirmation(data: Record<string, any>): string {
  const content = `          <div class="header">
            <h1>We're Expanding to Your Area!</h1>
          </div>
          <div class="content">
            <h2>Thank you, ${data.customer_name}!</h2>
            <p>We've received your interest in CircleTel services for:</p>

            <div class="info-box">
              <div class="info-row">
                <span class="label">📍 Address:</span>
                <span class="value">${data.address}</span>
              </div>
              ${data.estimated_timeline ? `
              <div class="info-row">
                <span class="label">⏱️ Estimated Timeline:</span>
                <span class="value">${data.estimated_timeline}</span>
              </div>
              ` : ''}
            </div>

            <h3>What happens next?</h3>
            <p>We're rapidly expanding our fibre and wireless network across South Africa. Here's what you can expect:</p>
            <ul>
              <li><strong>Network Expansion:</strong> Our team is actively working on bringing coverage to your area</li>
              <li><strong>Email Notification:</strong> We'll notify you as soon as service becomes available</li>
              <li><strong>Priority Access:</strong> You'll be among the first to know when we can connect you</li>
              <li><strong>No Obligation:</strong> This is just a notification request - no commitment required</li>
            </ul>

            <p><strong>In the meantime:</strong></p>
            <p>Check out our <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}/wireless">Wireless Solutions</a> - available in most areas with quick deployment!</p>

            <p>Questions? Our team is here to help at <a href="mailto:support@circletel.co.za">support@circletel.co.za</a> or 0860 CIRCLE (0860 247 253).</p>
          </div>
          <div class="footer">
            <p>CircleTel (Pty) Ltd</p>
            <p>Your Connection, Our Priority</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://circletel.co.za'}">circletel.co.za</a> | support@circletel.co.za | 0860 CIRCLE (0860 247 253)</p>
          </div>
        `;
  return baseTemplate(content);
}
