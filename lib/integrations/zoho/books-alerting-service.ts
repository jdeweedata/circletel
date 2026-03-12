/**
 * Zoho Books Alerting Service
 *
 * Sends alerts via Resend email for critical sync issues:
 * - OAuth/authentication failures (require human intervention)
 * - Retry count exceeded (5 attempts)
 * - Unmatched payments > R500
 * - Invoice number conflicts
 *
 * Alert recipient: billing@circletel.co.za
 */

import { Resend } from 'resend';
import { zohoLogger } from '@/lib/logging';

// ============================================================================
// Types
// ============================================================================

export interface ZohoBooksAlertPayload {
  type:
    | 'oauth_failure'
    | 'retry_exhausted'
    | 'unmatched_payment'
    | 'invoice_conflict'
    | 'sync_error';
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// Alert Service
// ============================================================================

const ALERT_EMAIL = process.env.BILLING_ALERT_EMAIL || 'billing@circletel.co.za';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'billing@notify.circletel.co.za';

/**
 * Send a Zoho Books sync alert
 */
export async function sendZohoBooksAlert(payload: ZohoBooksAlertPayload): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    zohoLogger.warn('[BooksAlert] RESEND_API_KEY not configured, skipping alert');
    return;
  }

  const resend = new Resend(resendApiKey);

  const subject = getAlertSubject(payload.type);
  const html = buildAlertHtml(payload);

  try {
    zohoLogger.info('[BooksAlert] Sending alert', {
      type: payload.type,
      to: ALERT_EMAIL,
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ALERT_EMAIL],
      subject,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    zohoLogger.info('[BooksAlert] Alert sent successfully', {
      id: result.data?.id,
    });
  } catch (error) {
    zohoLogger.error('[BooksAlert] Failed to send alert', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getAlertSubject(type: ZohoBooksAlertPayload['type']): string {
  const subjects: Record<ZohoBooksAlertPayload['type'], string> = {
    oauth_failure: '🚨 [CircleTel] Zoho Books OAuth Failure - Action Required',
    retry_exhausted: '⚠️ [CircleTel] Zoho Books Sync Retry Exhausted',
    unmatched_payment: '💰 [CircleTel] Unmatched Payment Detected',
    invoice_conflict: '🔢 [CircleTel] Invoice Number Conflict',
    sync_error: '❌ [CircleTel] Zoho Books Sync Error',
  };

  return subjects[type] || '❌ [CircleTel] Zoho Books Alert';
}

function buildAlertHtml(payload: ZohoBooksAlertPayload): string {
  const timestamp = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
  });

  const priorityBadge = getPriorityBadge(payload.type);
  const actionRequired = getActionRequired(payload.type);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zoho Books Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
              <table width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px;">CircleTel Billing Alert</h1>
                    <p style="margin: 4px 0 0 0; color: #90cdf4; font-size: 14px;">Zoho Books Sync</p>
                  </td>
                  <td align="right">
                    ${priorityBadge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #1e3a5f; font-size: 18px;">
                ${getAlertTitle(payload.type)}
              </h2>

              <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                ${payload.message}
              </p>

              ${payload.details ? buildDetailsSection(payload.details) : ''}

              <!-- Action Required -->
              <table width="100%" style="margin-top: 24px; background-color: #fff3cd; border-radius: 6px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">
                      ⚡ Action Required
                    </p>
                    <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                      ${actionRequired}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7fafc; padding: 16px 24px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin: 0; color: #718096; font-size: 12px;">
                      Timestamp: ${timestamp}
                    </p>
                  </td>
                  <td align="right">
                    <a href="https://www.circletel.co.za/admin/billing/zoho" style="color: #1e3a5f; font-size: 12px; text-decoration: none;">
                      View in Admin →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin-top: 16px; color: #a0aec0; font-size: 11px;">
          This is an automated alert from CircleTel billing system.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPriorityBadge(type: ZohoBooksAlertPayload['type']): string {
  const badges: Record<ZohoBooksAlertPayload['type'], { bg: string; text: string; label: string }> = {
    oauth_failure: { bg: '#ef4444', text: '#ffffff', label: 'CRITICAL' },
    retry_exhausted: { bg: '#f59e0b', text: '#ffffff', label: 'WARNING' },
    unmatched_payment: { bg: '#f59e0b', text: '#ffffff', label: 'WARNING' },
    invoice_conflict: { bg: '#3b82f6', text: '#ffffff', label: 'INFO' },
    sync_error: { bg: '#ef4444', text: '#ffffff', label: 'ERROR' },
  };

  const badge = badges[type];
  return `
    <span style="background-color: ${badge.bg}; color: ${badge.text}; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;">
      ${badge.label}
    </span>
  `;
}

function getAlertTitle(type: ZohoBooksAlertPayload['type']): string {
  const titles: Record<ZohoBooksAlertPayload['type'], string> = {
    oauth_failure: 'OAuth Authentication Failed',
    retry_exhausted: 'Sync Retry Limit Exceeded',
    unmatched_payment: 'Unmatched Payment Detected',
    invoice_conflict: 'Invoice Number Conflict',
    sync_error: 'Sync Error Occurred',
  };

  return titles[type];
}

function getActionRequired(type: ZohoBooksAlertPayload['type']): string {
  const actions: Record<ZohoBooksAlertPayload['type'], string> = {
    oauth_failure:
      'Refresh the Zoho OAuth token immediately. Go to Zoho API Console → Self Client → Generate new refresh token with ZohoBooks.fullaccess.all scope. Update ZOHO_REFRESH_TOKEN in Vercel environment variables.',
    retry_exhausted:
      'Review the failed entities in the admin panel. Check Zoho Books for any conflicts, then reset the retry count or manually sync the affected records.',
    unmatched_payment:
      'This payment could not be automatically matched to an invoice. Review in PayNow reconciliation dashboard and manually reconcile.',
    invoice_conflict:
      'An invoice number conflict was detected. Check if the invoice already exists in Zoho Books and resolve the duplicate.',
    sync_error:
      'Review the error details and check the Zoho Books API status. If the issue persists, contact support.',
  };

  return actions[type];
}

function buildDetailsSection(details: Record<string, any>): string {
  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const displayValue =
        typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #718096; font-size: 13px; width: 140px;">
            ${displayKey}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #2d3748; font-size: 13px; word-break: break-all;">
            ${typeof value === 'object' ? `<pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${displayValue}</pre>` : displayValue}
          </td>
        </tr>
      `;
    })
    .join('');

  if (!rows) return '';

  return `
    <table width="100%" style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 6px; border-collapse: collapse;">
      <tr>
        <td colspan="2" style="background-color: #f7fafc; padding: 12px; font-weight: 600; color: #4a5568; font-size: 13px; border-bottom: 1px solid #e2e8f0;">
          Details
        </td>
      </tr>
      ${rows}
    </table>
  `;
}
