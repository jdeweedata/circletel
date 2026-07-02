/**
 * Debit Batch Authorisation Alert
 *
 * Interim measure while NetCash Auto Auth is pending (error 322,
 * feat/netcash-batch-authorise unmerged): emails the finance team when a
 * submitted debit batch requires MANUAL authorisation in the NetCash portal.
 *
 * The NetCash account (52552945156) has "Auto forward action date" OFF —
 * a batch not authorised before cut-off silently misses its collection date.
 *
 * A notification failure must never fail the calling cron: this module
 * never throws; all failures resolve to { success: false, error }.
 *
 * @module lib/billing/debit-batch-alert
 */

import { cronLogger } from '@/lib/logging';

const DEFAULT_RECIPIENTS = [
  'jeffrey.de.wee@circletel.co.za',
  'jeffrey@newgengroup.co.za',
  'finance@circletel.co.za',
];

const FROM = 'CircleTel Billing <billing@notify.circletel.co.za>';
const NETCASH_PORTAL_URL = 'https://merchant.netcash.co.za';

export interface BatchAuthorisationAlertDetails {
  batchType: 'bank_debit_order' | 'credit_card';
  batchName: string;
  fileToken?: string;
  itemCount: number;
  totalAmount: number;      // Rands
  actionDate: string;       // YYYY-MM-DD — the collection date at risk
  loadReportStatus?: string;
  reason?: string;          // e.g. why auto-authorisation failed
}

export function resolveAlertRecipients(
  raw: string | undefined = process.env.DEBIT_BATCH_ALERT_EMAILS
): string[] {
  if (!raw) return DEFAULT_RECIPIENTS;
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.includes('@'));
  return parsed.length > 0 ? parsed : DEFAULT_RECIPIENTS;
}

function formatRands(amount: number): string {
  // en-US grouping (comma thousands, dot decimal) — en-ZA formats as
  // "4 050,00" which reads ambiguously in email clients.
  return `R${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildAlertHtml(details: BatchAuthorisationAlertDetails): string {
  const typeLabel =
    details.batchType === 'credit_card' ? 'Credit card' : 'Bank debit order';
  const submittedAt = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows: Array<[string, string]> = [
    ['Batch type', typeLabel],
    ['Batch name', details.batchName],
    ['File token', details.fileToken || 'n/a'],
    ['Items', String(details.itemCount)],
    ['Total', formatRands(details.totalAmount)],
    ['Action date', details.actionDate],
    ['Submitted', `${submittedAt} (SAST)`],
  ];
  if (details.loadReportStatus) {
    rows.push(['Load report', details.loadReportStatus]);
  }
  if (details.reason) {
    rows.push(['Reason', details.reason]);
  }

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;">${label}</td><td style="padding:4px 0;font-weight:600;">${value}</td></tr>`
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4A;">
      <h2 style="color:#E87A1E;">Debit batch awaiting authorisation</h2>
      <p>A ${typeLabel.toLowerCase()} batch was submitted to NetCash and
      <strong>requires manual authorisation</strong> before the cut-off for its action date.</p>
      <table style="border-collapse:collapse;font-size:14px;">${tableRows}</table>
      <p style="margin-top:16px;">
        <a href="${NETCASH_PORTAL_URL}"
           style="background:#E87A1E;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">
          Authorise in NetCash portal
        </a>
      </p>
      <p style="font-size:12px;color:#999;">
        Auto forward action date is OFF on this account — if the batch is not
        authorised in time, the collection is missed (not rolled forward).
        This alert is an interim measure until NetCash Auto Auth is enabled.
      </p>
    </div>
  `;
}

export async function sendBatchAuthorisationAlert(
  details: BatchAuthorisationAlertDetails
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    cronLogger.warn('[DebitBatchAlert] RESEND_API_KEY not configured, skipping alert email');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const subject = `⚠ Action required: authorise debit batch ${details.batchName} — ${formatRands(details.totalAmount)} (${details.itemCount} items)`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: resolveAlertRecipients(),
        subject,
        html: buildAlertHtml(details),
        tags: [{ name: 'type', value: 'debit-batch-auth-alert' }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as { message?: string }));
      const error = errorData.message || `HTTP ${response.status}`;
      cronLogger.warn('[DebitBatchAlert] Resend rejected alert email', { error });
      return { success: false, error };
    }

    cronLogger.info('[DebitBatchAlert] Authorisation alert sent', {
      batchName: details.batchName,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.warn('[DebitBatchAlert] Failed to send alert email', { error: message });
    return { success: false, error: message };
  }
}
