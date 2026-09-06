/**
 * Nomination follow-up email — sent when Ruth / Unjani Clinics NPC nominates a clinic.
 *
 * Voice: CircleTel writing on the nomination thread, carrying Ruth’s brief
 * (install, billing via NPC, patient vs clinic SSIDs, complimentary month).
 * Recipients: nurse To, Ruth + CircleTel ops CC.
 *
 * Speeds are never hardcoded — throughput depends on coverage at the clinic.
 */
import { UNJANI_NPC_BILL_TO } from '@/lib/billing/unjani-connect-rules';
import { apiLogger } from '@/lib/logging/logger';

const FROM = 'CircleTel Unjani Connect <onboarding@notify.circletel.co.za>';
const CIRCLETEL_OPS = 'contactus@circletel.co.za';
const CIRCLETEL_LOGO_URL =
  'https://www.circletel.co.za/images/circletel-enclosed-logo.png';

/**
 * Desk-wired WhatsApp helpdesk (084) — same line as the Unjani onboarding QR.
 * Inbound opens / syncs into Zoho Desk (support IM / desk-bridge).
 */
export const UNJANI_HELPDESK_WHATSAPP_NUMBER_DISPLAY = '084 773 9467';
export const UNJANI_HELPDESK_WHATSAPP_E164 = '27847739467';

const HELPDESK_WA_DEFAULT_TEXT =
  'Hi CircleTel Support, I need help with Unjani Connect.';

/** Static wa.me URL encoded into the helpdesk QR asset. */
export const UNJANI_HELPDESK_WHATSAPP_HREF = `https://wa.me/${UNJANI_HELPDESK_WHATSAPP_E164}?text=${encodeURIComponent(HELPDESK_WA_DEFAULT_TEXT)}`;

/**
 * QR image for email. Encodes {@link UNJANI_HELPDESK_WHATSAPP_HREF} (084 → Zoho Desk).
 * Local twin kept at public/images/partners/unjani-whatsapp-helpdesk-qr.png for deploy/CDN.
 * Uses a public QR renderer so the code renders in inboxes before the PNG is on production.
 */
export function unjaniHelpdeskWhatsAppQrSrc(): string {
  const hosted =
    process.env.UNJANI_HELPDESK_QR_HOSTED_URL?.trim() ||
    'https://www.circletel.co.za/images/partners/unjani-whatsapp-helpdesk-qr.png';
  if (process.env.UNJANI_HELPDESK_QR_USE_HOSTED === 'true') {
    return hosted;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=13274A&bgcolor=FFFFFF&data=${encodeURIComponent(UNJANI_HELPDESK_WHATSAPP_HREF)}`;
}

export function unjaniHelpdeskWhatsAppHref(clinicName?: string): string {
  const clinic = clinicName?.trim();
  const text = clinic
    ? `Hi CircleTel Support, I need help with Unjani Connect at ${clinic}.`
    : HELPDESK_WA_DEFAULT_TEXT;
  return `https://wa.me/${UNJANI_HELPDESK_WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}

/**
 * Official Unjani Clinic wordmark from unjaniclinic.co.za (also mirrored under
 * public/images/partners/ for Circletel hosting after deploy).
 */
export const UNJANI_CLINIC_LOGO_URL =
  'https://www.unjaniclinic.co.za/wp-content/uploads/2022/07/logo-300x85.png';

export function unjaniClinicLogoSrc(): string {
  const origin = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (origin && !/localhost|127\.0\.0\.1/i.test(origin)) {
    return `${origin}/images/partners/unjani-clinic-logo-email.png`;
  }
  return UNJANI_CLINIC_LOGO_URL;
}

export interface UnjaniIntroductionEmailParams {
  /** Clinic nurse / on-site contact. */
  to: string;
  clinicName: string;
  /** Nurse / clinic contact first name (or full name) for the greeting. */
  nurseName?: string;
  /** Optional extra CC (e.g. coverage lead). Ruth + CircleTel always included. */
  cc?: string[];
}

export interface UnjaniIntroductionEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function unjaniIntroductionGreeting(nurseName?: string): string {
  const name = nurseName?.trim();
  if (!name) return 'Hello Sr,';
  // "Sr" = Sister (clinic nurse title)
  return `Hello Sr ${name},`;
}

/** Email-safe numbered step row (table layout — no external icon host required). */
function nextStepRow(opts: {
  step: number;
  title: string;
  body: string;
  icon: string;
  last?: boolean;
}): string {
  const mb = opts.last ? '0' : '14px';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 ${mb};">
  <tr>
    <td width="48" valign="top" style="width:48px;padding:0 14px 0 0;vertical-align:top;">
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr>
        <td width="40" height="40" align="center" valign="middle" style="width:40px;height:40px;background-color:#FFFFFF;border:2px solid #F58926;border-radius:20px;text-align:center;line-height:40px;font-size:18px;">
          ${opts.icon}
        </td>
      </tr></table>
      <p style="color:#F58926;font-size:11px;font-weight:bold;text-align:center;margin:4px 0 0;letter-spacing:0.04em;">STEP ${opts.step}</p>
    </td>
    <td valign="top" style="padding:4px 0 0;vertical-align:top;border-left:2px solid ${opts.last ? 'transparent' : '#F5C79A'};padding-left:14px;">
      <p style="color:#1B2A4A;font-size:14px;font-weight:bold;margin:0 0 4px;line-height:20px;">${opts.title}</p>
      <p style="color:#374151;font-size:14px;line-height:20px;margin:0;">${opts.body}</p>
    </td>
  </tr>
</table>`;
}

export function unjaniIntroductionRecipients(params: UnjaniIntroductionEmailParams): {
  to: string[];
  cc: string[];
} {
  const nurse = params.to.trim().toLowerCase();
  const ccList = [
    UNJANI_NPC_BILL_TO.packTo,
    CIRCLETEL_OPS,
    ...(params.cc ?? []),
  ].filter((email, i, all) => {
    const lower = email.trim().toLowerCase();
    if (!lower || lower === nurse) return false;
    return all.findIndex((e) => e.trim().toLowerCase() === lower) === i;
  });

  return { to: [params.to.trim()], cc: ccList };
}

export function unjaniIntroductionSubject(clinicName: string): string {
  return `Unjani Connect — CircleTel following your nomination (${clinicName})`;
}

/** Pure HTML builder — used by send + unit tests. */
export function buildUnjaniIntroductionEmailHtml(
  params: Pick<UnjaniIntroductionEmailParams, 'clinicName' | 'nurseName'>
): string {
  const clinic = params.clinicName.trim() || 'your clinic';
  const greeting = escapeHtml(unjaniIntroductionGreeting(params.nurseName));
  const unjaniLogoSrc = unjaniClinicLogoSrc();
  const whatsappHref = unjaniHelpdeskWhatsAppHref(clinic);
  const whatsappQrSrc = unjaniHelpdeskWhatsAppQrSrc();

  const nextStepsHtml = [
    nextStepRow({
      step: 1,
      title: 'Confirm clinic details',
      body: 'We guide you through Unjani Connect onboarding (per the onboarding guide) so site and contact details are correct.',
      icon: '&#128203;', // clipboard
    }),
    nextStepRow({
      step: 2,
      title: 'Schedule installation',
      body: 'Once clinic details are confirmed, we arrange a suitable install date with you on this thread.',
      icon: '&#128197;', // calendar
    }),
    nextStepRow({
      step: 3,
      title: 'Install day &amp; handover',
      body: 'Please be present if possible — meet our team, observe the install, and receive the handover pack (fault reporting + WhatsApp QR).',
      icon: '&#128295;', // wrench
    }),
    nextStepRow({
      step: 4,
      title: 'Compare &amp; record',
      body: 'We demonstrate previous Wi-Fi vs the new service. That photo is kept on record.',
      icon: '&#128247;', // camera
    }),
    nextStepRow({
      step: 5,
      title: 'Service active',
      body: 'Your service is live. The 30-day complimentary period begins on the installation date and is monitored by CircleTel throughout.',
      icon: '&#128994;', // green circle / active
      last: true,
    }),
  ].join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4;">
    <tr><td style="padding:32px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background-color:#ffffff;padding:28px 30px 16px;text-align:center;border-bottom:3px solid #F58926;">
          <a href="https://www.circletel.co.za/" style="text-decoration:none;">
            <img src="${CIRCLETEL_LOGO_URL}" alt="CircleTel" width="120" style="display:block;margin:0 auto;width:120px;height:auto;border:0;" />
          </a>
          <p style="color:#1B2A4A;font-size:13px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;margin:14px 0 12px;">Unjani Connect</p>
          <a href="https://www.unjaniclinic.co.za/" style="text-decoration:none;">
            <img src="${unjaniLogoSrc}" alt="Unjani Clinic" width="160" style="display:block;margin:0 auto;width:160px;max-width:55%;height:auto;border:0;opacity:0.95;" />
          </a>
        </td></tr>

        <tr><td style="padding:34px 30px 8px;">
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">${greeting}</p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            Trust you are all keeping well.
          </p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            <strong>Ruth Butcher</strong> at Unjani Clinics NPC has nominated
            <strong>${escapeHtml(clinic)}</strong> for Unjani Connect and asked us to introduce
            ourselves on this thread.
          </p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            We are <strong>CircleTel</strong> — the Wi-Fi service partner who will assist with the
            installation and ongoing support of the new Wi-Fi service at your clinic. Ruth and the
            NPC remain copied so everyone stays informed.
          </p>
        </td></tr>

        <tr><td style="padding:8px 30px 0;">
          <div style="background-color:#FEF3E7;border:1px solid #E87A1E;border-radius:8px;padding:18px 20px;margin-bottom:18px;">
            <p style="color:#9A4A06;font-size:15px;font-weight:bold;margin:0 0 16px;">What happens next</p>
            ${nextStepsHtml}
            <p style="color:#6B7280;font-size:13px;line-height:19px;margin:14px 0 0;padding-top:12px;border-top:1px solid #F5C79A;">
              Please keep the NPC copied on every reply so Ruth’s team can assist where needed.
            </p>
          </div>
        </td></tr>

        <tr><td style="padding:8px 30px 0;">
          <p style="color:#1B2A4A;font-size:15px;font-weight:bold;margin:0 0 10px;">The service</p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 10px;">
            The new service provides two separate Wi-Fi connections. Speeds depend on coverage
            at your clinic location and are confirmed after the site survey — they are not a
            fixed rate for every site.
          </p>
          <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:15px;line-height:22px;">
            <li style="margin-bottom:8px;"><strong>Patient connection</strong> — free Wi-Fi for patients while they wait</li>
            <li style="margin-bottom:0;"><strong>Clinic connection</strong> — secure Wi-Fi for clinic operations and staff</li>
          </ul>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            Please ensure patients use only the patient connection and clinic staff use the clinic
            connection. Keeping these separate protects the clinic’s access and information.
          </p>
        </td></tr>

        <tr><td style="padding:8px 30px 0;">
          <p style="color:#1B2A4A;font-size:15px;font-weight:bold;margin:0 0 10px;">Billing (NPC-managed)</p>
          <ul style="margin:0 0 14px;padding-left:20px;color:#374151;font-size:15px;line-height:22px;">
            <li style="margin-bottom:8px;">The complimentary month begins on the installation date. Please do not cancel existing Wi-Fi until that month ends, in case signal or device issues need sorting.</li>
            <li style="margin-bottom:8px;">After the complimentary month, we invoice the NPC (pro-rata for the following billing period, then monthly in advance). The NPC settles our invoices and recovers the applicable costs from the clinic.</li>
            <li style="margin-bottom:8px;"><strong>Please do not</strong> provide us with company, banking, or billing information — all monthly premium billing is managed centrally through the NPC. If you are unsure about anything, contact Ruth immediately.</li>
            <li style="margin-bottom:0;">We are contracted for the agreed Wi-Fi offering only. Any additional work, upgrades, or products must go through the NPC first — we are not authorised to market, quote, agree to, or undertake extra work directly with the clinic. Approved extras are billed to the clinic, not recovered monthly.</li>
          </ul>
        </td></tr>

        <tr><td style="padding:8px 30px 0;">
          <p style="color:#1B2A4A;font-size:15px;font-weight:bold;margin:0 0 10px;">Confirm details &amp; schedule installation</p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            This email follows Ruth’s nomination of your clinic. The Unjani Connect agreement is
            already in place with Unjani Clinics NPC. Before we install, we will confirm your clinic
            details through onboarding, then book the installation visit.
          </p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            Questions during onboarding? Reply on this thread (keep the NPC copied), or message us
            on WhatsApp using the button or QR below. After go-live, the same WhatsApp line is your
            helpdesk for service issues — you will also receive it again in the handover pack.
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;background-color:#F0F7F4;border:1px solid #25D366;border-radius:8px;">
            <tr>
              <td style="padding:18px 16px;width:140px;text-align:center;vertical-align:middle;">
                <a href="${whatsappHref}" style="text-decoration:none;">
                  <img src="${whatsappQrSrc}" alt="Scan to WhatsApp CircleTel Support" width="120" height="120" style="display:block;margin:0 auto;width:120px;height:120px;border:0;" />
                </a>
                <p style="color:#6B7280;font-size:11px;line-height:15px;margin:8px 0 0;">Scan with your phone camera</p>
              </td>
              <td style="padding:18px 18px 18px 8px;vertical-align:middle;">
                <p style="color:#1B2A4A;font-size:15px;font-weight:bold;margin:0 0 6px;">CircleTel WhatsApp</p>
                <p style="color:#374151;font-size:14px;line-height:20px;margin:0 0 12px;">
                  ${UNJANI_HELPDESK_WHATSAPP_NUMBER_DISPLAY} · Mon–Fri business hours
                </p>
                <a href="${whatsappHref}" style="display:inline-block;background-color:#25D366;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 18px;border-radius:6px;">
                  Message us on WhatsApp
                </a>
              </td>
            </tr>
          </table>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            After installation, the first month is the complimentary testing period, after which the
            longer-term contract continues. If the service is not a meaningful improvement, or
            significant issues remain unresolved as that complimentary period ends, please notify
            the NPC in advance so Ruth’s team can review with us before the longer-term term starts.
          </p>
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 14px;">
            Please keep the NPC copied on all emails to us, and we will do the same.
          </p>
        </td></tr>

        <tr><td style="padding:8px 30px 24px;">
          <p style="color:#374151;font-size:15px;line-height:23px;margin:0 0 18px;">
            We are confident the new service will be a positive improvement for your clinic and
            its patients. Thank you for your cooperation — reply on this thread if you have any
            questions, or contact Ruth if the matter is for the NPC.
          </p>
          <p style="color:#1B2A4A;font-size:15px;font-weight:bold;margin:0 0 4px;">CircleTel · Unjani Connect</p>
          <p style="color:#374151;font-size:14px;line-height:21px;margin:0 0 16px;">
            Installation &amp; support partner for Unjani Clinics NPC<br/>
            <a href="mailto:contactus@circletel.co.za" style="color:#E87A1E;">contactus@circletel.co.za</a>
            · <a href="https://www.circletel.co.za/" style="color:#E87A1E;">www.circletel.co.za</a>
          </p>
          <p style="color:#6B7280;font-size:13px;line-height:20px;margin:0;padding-top:12px;border-top:1px solid #E5E7EB;">
            <strong style="color:#1B2A4A;">Ruth Butcher</strong> (copied) · Business Development Manager · Unjani Clinic<br/>
            +27 12 534 4341 · +27 79 651 9527 ·
            <a href="mailto:rbutcher@unjani.org" style="color:#E87A1E;">rbutcher@unjani.org</a>
          </p>
        </td></tr>

        <tr><td style="background-color:#F9FAFB;padding:20px 30px;text-align:center;border-top:1px solid #E5E7EB;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">
            CircleTel · Partner of Unjani Clinics NPC · Empowering healthcare connectivity
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendUnjaniIntroductionEmail(
  params: UnjaniIntroductionEmailParams
): Promise<UnjaniIntroductionEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Email service not configured (RESEND_API_KEY missing)' };
  }

  if (!params.to?.trim()) {
    return { success: false, error: 'Nurse / clinic email is required' };
  }

  const { to, cc } = unjaniIntroductionRecipients(params);
  const html = buildUnjaniIntroductionEmailHtml(params);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        cc,
        reply_to: [UNJANI_NPC_BILL_TO.packTo, CIRCLETEL_OPS],
        subject: unjaniIntroductionSubject(params.clinicName),
        html,
        tags: [
          { name: 'type', value: 'unjani-npc-introduction' },
          { name: 'product', value: 'unjani-connect' },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      apiLogger.warn('[Unjani intro] email send failed', {
        to: params.to,
        error: err,
      });
      return { success: false, error: err.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    apiLogger.error('[Unjani intro] email send exception', {
      to: params.to,
      error: message,
    });
    return { success: false, error: message };
  }
}
