/**
 * Submit (or dry-run) the circletel_sales_lead_alert internal alert template.
 *
 * UTILITY template sent to CircleTel's OWN sales WhatsApp number — never to
 * customers. The daily new-signup-followup Inngest job cannot assume an open 24h
 * customer-service window, so free-form sendText() is unreliable on a schedule;
 * an approved template is required.
 *
 * Once APPROVED, set SALES_ALERT_TEMPLATE_NAME=circletel_sales_lead_alert so the
 * cron sends via template instead of free-form text.
 *
 * Usage:
 *   set -a && source /home/circletel/.env.local && set +a
 *   npx tsx scripts/submit-sales-lead-alert-template.ts            # dry-run
 *   npx tsx scripts/submit-sales-lead-alert-template.ts --execute  # POST to Meta
 *   npx tsx scripts/submit-sales-lead-alert-template.ts --status   # check approval
 */

const GRAPH = 'https://graph.facebook.com/v21.0';
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

export const SALES_ALERT_TEMPLATE_NAME = 'circletel_sales_lead_alert';
export const SALES_ALERT_TEMPLATE_LANGUAGE = 'en_ZA';

/** Payload submitted to Meta. Body variables: {{1}} count, {{2}} oldest, {{3}} tickets. */
export const salesLeadAlertTemplate = {
  name: SALES_ALERT_TEMPLATE_NAME,
  language: SALES_ALERT_TEMPLATE_LANGUAGE,
  category: 'UTILITY' as const,
  components: [
    {
      type: 'BODY',
      text:
        'CircleTel sales alert: {{1}} new signup(s) with no order need follow-up. ' +
        'Oldest: {{2}}. Zoho Desk Sales tickets created: {{3}}. ' +
        'Open the Sales queue in Zoho Desk to action them.',
      example: { body_text: [['6', 'Ishmael Kassim, 8 day(s)', '6']] },
    },
    {
      type: 'FOOTER',
      text: 'CircleTel SA (Pty) Ltd',
    },
  ],
};

async function checkStatus(): Promise<void> {
  if (!TOKEN || !WABA) {
    console.error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_BUSINESS_ACCOUNT_ID');
    process.exit(1);
  }
  const url = new URL(`${GRAPH}/${WABA}/message_templates`);
  url.searchParams.set('name', SALES_ALERT_TEMPLATE_NAME);
  url.searchParams.set(
    'fields',
    'name,status,category,language,rejected_reason,components'
  );
  url.searchParams.set('limit', '5');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

async function main() {
  const execute = process.argv.includes('--execute');
  const status = process.argv.includes('--status');

  if (status) {
    await checkStatus();
    return;
  }

  console.log(execute ? 'EXECUTE — submit to Meta' : 'DRY-RUN — payload only');
  console.log(JSON.stringify(salesLeadAlertTemplate, null, 2));

  if (!execute) {
    console.log('\nRe-run with --execute to POST.');
    return;
  }

  if (!TOKEN || !WABA) {
    console.error(
      'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_BUSINESS_ACCOUNT_ID — source .env.local'
    );
    process.exit(1);
  }

  const res = await fetch(`${GRAPH}/${WABA}/message_templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(salesLeadAlertTemplate),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));

  if (!res.ok) {
    console.error('\nSubmission failed.');
    process.exit(1);
  }
  console.log(
    `\nSubmitted. Poll with --status until APPROVED, then set SALES_ALERT_TEMPLATE_NAME=${SALES_ALERT_TEMPLATE_NAME}.`
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
