import { getDailyBriefing } from './briefing-service';

const SLACK_WEBHOOK_URL = process.env.SLACK_SALES_WEBHOOK_URL;

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
  accessory?: unknown;
}

export async function sendDailyDigest(): Promise<{ success: boolean; error: string | null }> {
  if (!SLACK_WEBHOOK_URL) {
    return { success: false, error: 'SLACK_SALES_WEBHOOK_URL not configured' };
  }

  const briefing = await getDailyBriefing();
  if (briefing.error || !briefing.data) {
    return { success: false, error: briefing.error || 'No briefing data' };
  }

  const b = briefing.data;
  const blocks: SlackBlock[] = [];

  // Header
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: 'Daily Sales Briefing', emoji: true },
  });

  // MSC Snapshot
  if (b.msc_snapshot) {
    const msc = b.msc_snapshot;
    const progressPct = msc.required_rns > 0
      ? Math.round((msc.actual_rns / msc.required_rns) * 100)
      : 0;
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*MSC Period:* ${msc.period_label}` },
        { type: 'mrkdwn', text: `*Status:* ${msc.status.replace('_', ' ').toUpperCase()}` },
        { type: 'mrkdwn', text: `*RNs:* ${msc.actual_rns} / ${msc.required_rns} (${progressPct}%)` },
        { type: 'mrkdwn', text: `*Days Remaining:* ${msc.days_remaining}` },
      ],
    });
  }

  // Summary Stats
  blocks.push({
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Calls Needed:* ${b.summary.calls_needed}` },
      { type: 'mrkdwn', text: `*Pipeline MRR:* R${b.summary.pipeline_mrr.toLocaleString()}` },
      { type: 'mrkdwn', text: `*Deals to Close:* ${b.summary.deals_to_close}` },
    ],
  });

  blocks.push({ type: 'divider' } as SlackBlock);

  // Priority Calls (top 5)
  if (b.priority_calls.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Priority Calls (${b.priority_calls.length})*` },
    });
    const callLines = b.priority_calls.slice(0, 5).map((lead: any, i: number) => {
      const name = lead.company_name || lead.address;
      const phone = lead.phone || 'No phone';
      return `${i + 1}. *${name}* - Score: ${lead.composite_score} | ${lead.recommended_product || 'TBD'} | ${phone}`;
    });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: callLines.join('\n') },
    });
  }

  // Stalled Deals
  if (b.stalled_deals.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Stalled Deals (${b.stalled_deals.length})*` },
    });
    const stalledLines = b.stalled_deals.slice(0, 5).map((deal: any) => {
      const name = deal.company_name || deal.address;
      const mrr = deal.quote_mrr ? `R${Number(deal.quote_mrr).toLocaleString()}/mo` : '';
      return `- *${name}* - ${deal.stage_label} | ${deal.days_stuck}d stuck ${mrr ? `| ${mrr}` : ''}`;
    });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: stalledLines.join('\n') },
    });
  }

  // Zone Alerts
  if (b.zone_alerts.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Zone Alerts (${b.zone_alerts.length})*` },
    });
    const actionEmoji: Record<string, string> = {
      increase_effort: '[GREEN]',
      change_message: '[YELLOW]',
      park_zone: '[RED]',
    };
    const alertLines = b.zone_alerts.map((alert: any) => {
      const label = actionEmoji[alert.action] || '[INFO]';
      return `${label} *${alert.zone_name}* - ${alert.action.replace(/_/g, ' ')} (${alert.avg_close_rate}% close rate)`;
    });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: alertLines.join('\n') },
    });
  }

  // Footer
  blocks.push({ type: 'divider' } as SlackBlock);
  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `Generated ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} | <https://www.circletel.co.za/admin/sales-engine/briefing|View Full Briefing>` },
    ],
  });

  // POST to Slack
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      return { success: false, error: `Slack API returned ${response.status}` };
    }

    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to send Slack digest: ${message}` };
  }
}
