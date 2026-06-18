/**
 * Unjani clinic onboarding email — a WhatsApp/SMS fallback for nurses without
 * WhatsApp. Sends a branded email listing what the clinic needs to complete the
 * online onboarding, with a magic-link button to the /onboarding/<token> wizard.
 *
 * Uses Resend directly (same pattern as the eMandate reminder email) rather than
 * the React-Email template system, to keep this self-contained.
 */
import { apiLogger } from '@/lib/logging/logger';

export interface OnboardingEmailParams {
  to: string;
  clinicName: string;
  accountNumber: string;
  url: string;            // magic-link onboarding URL
  validDays?: number;     // link validity (default 7)
}

export interface OnboardingEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Send the onboarding requirements + link email. Best-effort; returns a result. */
export async function sendOnboardingEmail(
  params: OnboardingEmailParams
): Promise<OnboardingEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Email service not configured (RESEND_API_KEY missing)' };
  }

  const html = buildOnboardingEmailHtml(params);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CircleTel Onboarding <onboarding@notify.circletel.co.za>',
        to: [params.to],
        reply_to: 'contactus@circletel.co.za',
        subject: `Complete your CircleTel ClinicConnect setup — ${params.clinicName}`,
        html,
        tags: [{ name: 'type', value: 'clinic-onboarding' }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      apiLogger.warn('[Onboarding] email send failed', { to: params.to, error: err });
      return { success: false, error: err.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Onboarding] email send exception', { to: params.to, error: message });
    return { success: false, error: message };
  }
}

/** Branded onboarding email HTML — Unjani-specific requirements + CTA. */
export function buildOnboardingEmailHtml(params: OnboardingEmailParams): string {
  const { clinicName, accountNumber, url, validDays = 7 } = params;

  const documents = [
    'CIPC company registration certificate',
    'VAT certificate <span style="color:#6B7280">(only if the clinic is VAT-registered)</span>',
    'Bank confirmation letter or a recent bank statement',
    'Owner / director ID (SA ID or passport)',
    'Proof of business address <span style="color:#6B7280">(not older than 3 months)</span>',
  ];

  const steps = [
    'Confirm your clinic details (name, account number, contact, address)',
    'Enter your business details — CIPC registration number and VAT status',
    'Add your banking details and approve the monthly debit order (DebiCheck)',
    'Upload the documents listed above',
    'Pick a payment date and accept the Service Order',
  ];

  const li = (items: string[]) =>
    items
      .map(
        (t) =>
          `<li style="margin-bottom:8px;color:#374151;font-size:15px;line-height:22px;">${t}</li>`
      )
      .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4;">
    <tr><td style="padding:32px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background-color:#E87A1E;padding:28px 30px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">CircleTel ClinicConnect</h1>
        </td></tr>

        <!-- Intro -->
        <tr><td style="padding:34px 30px 8px;">
          <h2 style="color:#1B2A4A;margin:0 0 14px;font-size:21px;">Let's get ${clinicName} connected</h2>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 8px;">
            This is your secure link to complete your CircleTel onboarding online. It takes about
            <strong>10 minutes</strong> on your phone or computer — no WhatsApp needed.
          </p>
          <p style="color:#6B7280;font-size:14px;line-height:21px;margin:0;">
            Account number: <strong style="color:#1B2A4A;">${accountNumber}</strong>
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 30px;text-align:center;">
          <a href="${url}" style="display:inline-block;background-color:#E87A1E;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:15px 44px;border-radius:8px;">Start onboarding</a>
          <p style="color:#9CA3AF;font-size:13px;margin:12px 0 0;">This link is unique to your clinic and valid for ${validDays} days.</p>
        </td></tr>

        <!-- What you'll need -->
        <tr><td style="padding:8px 30px 0;">
          <div style="background-color:#FEF3E7;border:1px solid #E87A1E;border-radius:8px;padding:18px 22px;margin-bottom:22px;">
            <p style="color:#9A4A06;font-size:16px;font-weight:bold;margin:0 0 10px;">Have these documents ready</p>
            <ul style="margin:0;padding-left:20px;">${li(documents)}</ul>
            <p style="color:#6B7280;font-size:13px;margin:12px 0 0;">Photos from your phone are fine — PDF, JPG or PNG, under 5MB each.</p>
          </div>
        </td></tr>

        <!-- Steps -->
        <tr><td style="padding:0 30px;">
          <p style="color:#1B2A4A;font-size:16px;font-weight:bold;margin:0 0 12px;">What you'll do online</p>
          <ol style="margin:0 0 8px;padding-left:20px;">${li(steps)}</ol>
        </td></tr>

        <!-- Cost note -->
        <tr><td style="padding:18px 30px 6px;">
          <p style="color:#374151;font-size:14px;line-height:21px;margin:0;">
            The CircleTel ClinicConnect service is <strong>R450 + VAT = R517.50 per month</strong> per clinic,
            collected by monthly debit order. Your first month is pro-rated, and nothing is charged until your
            service is activated. <strong>Tip:</strong> your bank account holder name must match the clinic's
            registered name, or the debit order may be rejected.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#F9FAFB;padding:26px 30px;text-align:center;border-top:1px solid #E5E7EB;">
          <p style="color:#6B7280;font-size:14px;margin:0 0 8px;">
            Need help? Contact us at <a href="mailto:contactus@circletel.co.za" style="color:#E87A1E;">contactus@circletel.co.za</a>
          </p>
          <p style="color:#9CA3AF;font-size:12px;margin:0;">CircleTel SA (Pty) Ltd · South Africa</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
