/**
 * Submit (or dry-run) the circletel_lead_qualification cold-send template.
 *
 * MARKETING template with a FLOW button bound to the published F1 Flow
 * (WHATSAPP_FLOW_LEAD_QUALIFICATION_ID). Required for outbound F1 outside
 * the 24h customer-care window (Meta error 131047 re-engagement).
 *
 * Doc: docs/integrations/whatsapp/2026-07-31-lead-qualification-template.md
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   npx tsx scripts/submit-whatsapp-lead-qualification-template.ts           # dry-run
 *   npx tsx scripts/submit-whatsapp-lead-qualification-template.ts --execute # POST Graph
 *
 * Status check:
 *   npx tsx scripts/submit-whatsapp-lead-qualification-template.ts --status
 */

const GRAPH = 'https://graph.facebook.com/v21.0';
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WABA = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
const FLOW_ID =
  process.env.WHATSAPP_FLOW_LEAD_QUALIFICATION_ID || '2044303956204342';

export const F1_COLD_TEMPLATE_NAME = 'circletel_lead_qualification';
export const F1_COLD_TEMPLATE_LANGUAGE = 'en_ZA';

/** Payload submitted to Meta (also used by sendFlowTemplate). */
export const leadQualificationTemplate = {
  name: F1_COLD_TEMPLATE_NAME,
  language: F1_COLD_TEMPLATE_LANGUAGE,
  category: 'MARKETING' as const,
  components: [
    {
      type: 'BODY',
      text: 'Hi {{1}}, thanks for your interest in CircleTel. Tap below to share a few details so we can check coverage and recommend the right package. Takes about a minute.',
      example: { body_text: [['Jeffrey']] },
    },
    {
      type: 'FOOTER',
      text: 'CircleTel SA (Pty) Ltd',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'FLOW',
          text: 'Get started',
          flow_id: FLOW_ID,
          flow_action: 'navigate',
          navigate_screen: 'CONTACT',
        },
      ],
    },
  ],
};

async function checkStatus(): Promise<void> {
  if (!TOKEN || !WABA) {
    console.error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_BUSINESS_ACCOUNT_ID');
    process.exit(1);
  }
  const url = new URL(`${GRAPH}/${WABA}/message_templates`);
  url.searchParams.set('name', F1_COLD_TEMPLATE_NAME);
  url.searchParams.set(
    'fields',
    'name,status,category,language,rejected_reason,components'
  );
  url.searchParams.set('limit', '5');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

async function main() {
  const execute = process.argv.includes('--execute');
  const status = process.argv.includes('--status');

  if (status) {
    await checkStatus();
    return;
  }

  console.log(execute ? 'EXECUTE — submit to Meta' : 'DRY-RUN — payload only');
  console.log(JSON.stringify(leadQualificationTemplate, null, 2));
  console.log('\nBound FLOW_ID:', FLOW_ID);

  if (!execute) {
    console.log(
      '\nRe-run with --execute to POST. After PENDING → APPROVED, cold-send with sendFlowTemplate / admin use_template.'
    );
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
    body: JSON.stringify(leadQualificationTemplate),
  });
  const json = await res.json().catch(() => ({}));
  console.log(res.ok ? '✅ Submitted' : '❌ Failed', JSON.stringify(json, null, 2));
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
