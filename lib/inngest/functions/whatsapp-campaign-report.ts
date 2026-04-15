// lib/inngest/functions/whatsapp-campaign-report.ts
/**
 * WhatsApp Campaign Daily Report — Inngest Cron Function
 *
 * Schedule: 0 6 * * * (06:00 UTC = 08:00 SAST)
 * Retries: 2
 *
 * Pipeline:
 *  1. fetch-all-campaign-tickets — GET all "whatsapp lead" tickets (paginated)
 *  2. fetch-conversations — GET conversations for each ticket (batched 10 at a time)
 *  3. extract-intelligence — Run ConversationIntelligence on each ticket
 *  4. cross-reference-orders — Batch query consumer_orders by email/phone
 *  5. upsert-ticket-snapshots — Upsert all rows to campaign_ticket_snapshots
 *  6. compute-daily-aggregate — Compute metrics for previous calendar day
 *  7. write-report-snapshot — Insert/upsert to campaign_report_snapshots
 *  8. send-email-report — Send digest via Resend
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  createCampaignZohoDeskService,
  ConversationIntelligence,
  type CampaignTicket,
  type CampaignConversation,
  type InsightStatus,
  type LeadProfile,
} from '@/lib/integrations/zoho/desk-campaign-service';
import { zohoLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

interface EnrichedTicket {
  ticket: CampaignTicket;
  conversations: CampaignConversation[];
  profile: LeadProfile;
  insightStatus: InsightStatus;
  isSigned_up: boolean;
  orderId: string | null;
  firstResponseAt: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Format milliseconds as "2h 14m" */
function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Get first outbound conversation timestamp */
function getFirstResponseAt(conversations: CampaignConversation[]): string | null {
  const firstOut = conversations.find((c) => c.direction === 'out');
  return firstOut?.timestamp ?? null;
}

/** Build the plain-text + HTML email body */
function buildEmailHtml(params: {
  reportDate: string;
  newLeadsToday: number;
  conversionsToday: number;
  conversionRate: number;
  unassigned: number;
  openTickets: number;
  closedTickets: number;
  cumulative: number;
  avgFirstResponseMs: number | null;
  agentBreakdown: Record<string, number>;
  pipelineBreakdown: Record<string, number>;
  newSignUps: EnrichedTicket[];
}): { html: string; text: string } {
  const {
    reportDate, newLeadsToday, conversionsToday, conversionRate,
    unassigned, openTickets, closedTickets, cumulative,
    avgFirstResponseMs, agentBreakdown, pipelineBreakdown, newSignUps,
  } = params;

  const convRateFmt = conversionRate.toFixed(1);
  const avgRespFmt = avgFirstResponseMs ? formatDuration(avgFirstResponseMs) : 'N/A';
  const agentLines = Object.entries(agentBreakdown)
    .map(([name, count]) => `  ${name}: ${count} tickets`)
    .join('\n');
  const pipelineOrder: InsightStatus[] = [
    'signed_up', 'completed', 'in_progress', 'awaiting_details',
    'no_coverage', 'awaiting_agent', 'unresponsive', 'closed_resolved',
  ];
  const pipelineLines = pipelineOrder
    .filter((k) => (pipelineBreakdown[k] ?? 0) > 0)
    .map((k) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const icon = k === 'signed_up' ? '  ✅' : k === 'awaiting_agent' ? '  ⚠' : '  ';
      return `${icon} ${label}: ${pipelineBreakdown[k]}`;
    })
    .join('\n');
  const signUpLines = newSignUps
    .map((e) => {
      const p = e.profile;
      const name = p.name ?? e.ticket.contactName ?? 'Unknown';
      const email = p.email ?? e.ticket.contactEmail ?? 'N/A';
      const phone = p.phone ?? e.ticket.contactPhone ?? 'N/A';
      const address = p.address ?? 'N/A';
      return `  • ${name} | ${email} | ${phone}\n    ${address}`;
    })
    .join('\n');

  const text = `─────────────────────────────────────────
CircleTel | WhatsApp Lead Campaign Report
${reportDate}
─────────────────────────────────────────

YESTERDAY AT A GLANCE
  New Leads:         ${newLeadsToday}
  Conversions:       ${conversionsToday}   (${convRateFmt}% rate)
  Unassigned:        ${unassigned}${unassigned > 0 ? '   ⚠' : ''}

TICKET STATUS
  Open:              ${openTickets}
  Closed:            ${closedTickets}
  Total (all time):  ${cumulative}

AGENT RESPONSE
  Avg. First Response:  ${avgRespFmt}
${agentLines}

LEAD PIPELINE (all time)
${pipelineLines}

${newSignUps.length > 0 ? `NEW SIGN-UPS YESTERDAY\n${signUpLines}\n` : ''}View full dashboard: https://www.circletel.co.za/admin/integrations/whatsapp-campaign
─────────────────────────────────────────`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: monospace; background: #f8fafc; padding: 24px; }
  pre { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 20px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
  a { color: #F5831F; }
</style></head>
<body><pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;

  return { html, text };
}

// =============================================================================
// INNGEST FUNCTION
// =============================================================================

export const whatsappCampaignReportFunction = inngest.createFunction(
  {
    id: 'whatsapp-campaign-daily-report',
    name: 'WhatsApp Campaign Daily Report',
    retries: 2,
  },
  { cron: '0 6 * * *' }, // 06:00 UTC = 08:00 SAST
  async ({ step }) => {
    const campaignService = createCampaignZohoDeskService();
    const supabase = await createClient();

    // ── Step 1: Fetch all campaign tickets ────────────────────────────────
    const allTickets = await step.run('fetch-all-campaign-tickets', async () => {
      return await campaignService.fetchAllCampaignTickets();
    });

    // ── Step 2: Fetch conversations (batched 10 at a time) ────────────────
    const conversationMap = await step.run('fetch-conversations', async () => {
      const result: Record<string, CampaignConversation[]> = {};
      const batchSize = 10;
      for (let i = 0; i < allTickets.length; i += batchSize) {
        const batch = allTickets.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((t) => campaignService.fetchConversations(t.id))
        );
        for (let j = 0; j < batch.length; j++) {
          const r = batchResults[j];
          result[batch[j].id] = r.status === 'fulfilled' ? r.value : [];
        }
      }
      return result;
    });

    // ── Step 3: Extract intelligence ──────────────────────────────────────
    const enriched: EnrichedTicket[] = await step.run('extract-intelligence', async () => {
      return allTickets.map((ticket) => {
        const conversations = conversationMap[ticket.id] ?? [];
        const ci = new ConversationIntelligence(conversations, ticket.status);
        const profile = ci.extractLeadProfile();
        const firstResponseAt = getFirstResponseAt(conversations);
        return {
          ticket,
          conversations,
          profile,
          insightStatus: ci.deriveInsightStatus({ isSigned_up: false }), // sign-up resolved in step 4
          isSigned_up: false,
          orderId: null,
          firstResponseAt,
        };
      });
    });

    // ── Step 4: Cross-reference consumer_orders ───────────────────────────
    const enrichedWithSignUps = await step.run('cross-reference-orders', async () => {
      const emails = enriched.map((e) => e.profile.email).filter(Boolean) as string[];
      const phones = enriched.map((e) => e.profile.phone).filter(Boolean) as string[];

      const { data: orders } = await supabase
        .from('consumer_orders')
        .select('id, email, phone')
        .or(
          [...emails.map((e) => `email.eq.${e}`), ...phones.map((p) => `phone.eq.${p}`)].join(',')
        );

      const ordersByEmail = new Map<string, string>();
      const ordersByPhone = new Map<string, string>();
      for (const o of orders ?? []) {
        if (o.email) ordersByEmail.set(o.email.toLowerCase(), o.id);
        if (o.phone) ordersByPhone.set(o.phone, o.id);
      }

      return enriched.map((e) => {
        const email = e.profile.email?.toLowerCase();
        const phone = e.profile.phone;
        const orderId =
          (email ? ordersByEmail.get(email) : null) ??
          (phone ? ordersByPhone.get(phone) : null) ??
          null;
        const isSigned_up = orderId !== null;
        const ci = new ConversationIntelligence(e.conversations, e.ticket.status);
        return {
          ...e,
          isSigned_up,
          orderId,
          insightStatus: ci.deriveInsightStatus({ isSigned_up }),
        };
      });
    });

    // ── Step 5: Upsert ticket snapshots ───────────────────────────────────
    await step.run('upsert-ticket-snapshots', async () => {
      const rows = enrichedWithSignUps.map((e) => ({
        ticket_id: e.ticket.id,
        ticket_number: e.ticket.ticketNumber,
        subject: e.ticket.subject,
        status: e.ticket.status,
        assigned_agent: e.ticket.assigneeName ?? (e.ticket.assigneeName === null ? 'Unassigned' : null),
        contact_name: e.ticket.contactName,
        contact_phone: e.ticket.contactPhone,
        contact_email: e.ticket.contactEmail,
        lead_name: e.profile.name ?? null,
        lead_email: e.profile.email ?? null,
        lead_phone: e.profile.phone ?? null,
        lead_address: e.profile.address ?? null,
        insight_status: e.insightStatus,
        insight_updated_at: new Date().toISOString(),
        is_signed_up: e.isSigned_up,
        order_id: e.orderId,
        zoho_created_at: e.ticket.createdTime,
        first_response_at: e.firstResponseAt,
        closed_at: e.ticket.closedTime,
        last_synced_at: new Date().toISOString(),
        conversations: e.conversations,
        conversation_count: e.conversations.length,
        tags: e.ticket.tags,
      }));

      const { error } = await supabase
        .from('campaign_ticket_snapshots')
        .upsert(rows, { onConflict: 'ticket_id' });

      if (error) {
        zohoLogger.error('[CampaignReport] Upsert failed', { error: error.message });
        throw new Error(`Upsert failed: ${error.message}`);
      }
    });

    // ── Step 6: Compute daily aggregate ──────────────────────────────────
    const aggregate = await step.run('compute-daily-aggregate', async () => {
      // Report window: previous calendar day SAST (UTC+2)
      const now = new Date();
      const sast = new Date(now.getTime() + 2 * 3600 * 1000);
      const reportDate = new Date(sast);
      reportDate.setDate(reportDate.getDate() - 1);
      const dateStr = reportDate.toISOString().slice(0, 10); // YYYY-MM-DD

      const dayStart = new Date(`${dateStr}T00:00:00+02:00`).toISOString();
      const dayEnd = new Date(`${dateStr}T23:59:59+02:00`).toISOString();

      const newLeads = enrichedWithSignUps.filter(
        (e) => e.ticket.createdTime >= dayStart && e.ticket.createdTime <= dayEnd
      );
      const conversionsToday = enrichedWithSignUps.filter(
        (e) =>
          e.isSigned_up &&
          e.ticket.createdTime >= dayStart &&
          e.ticket.createdTime <= dayEnd
      );

      const openTickets = enrichedWithSignUps.filter((e) => e.ticket.status !== 'Closed').length;
      const closedTickets = enrichedWithSignUps.filter((e) => e.ticket.status === 'Closed').length;
      const unassigned = enrichedWithSignUps.filter((e) => !e.ticket.assigneeName).length;

      // Agent breakdown
      const agentBreakdown: Record<string, number> = {};
      for (const e of enrichedWithSignUps) {
        const agent = e.ticket.assigneeName ?? 'Unassigned';
        agentBreakdown[agent] = (agentBreakdown[agent] ?? 0) + 1;
      }

      // Pipeline breakdown
      const pipelineBreakdown: Record<string, number> = {};
      for (const e of enrichedWithSignUps) {
        pipelineBreakdown[e.insightStatus] = (pipelineBreakdown[e.insightStatus] ?? 0) + 1;
      }

      // Avg first response time (ms) for tickets with responses
      const responseTimes = enrichedWithSignUps
        .filter((e) => e.firstResponseAt)
        .map((e) => {
          const created = new Date(e.ticket.createdTime).getTime();
          const first = new Date(e.firstResponseAt!).getTime();
          return first - created;
        })
        .filter((ms) => ms > 0);
      const avgFirstResponseMs =
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null;

      const conversionRate =
        newLeads.length > 0
          ? (conversionsToday.length / newLeads.length) * 100
          : 0;

      return {
        reportDate: dateStr,
        newLeadsToday: newLeads.length,
        cumulative: enrichedWithSignUps.length,
        openTickets,
        closedTickets,
        unassigned,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgFirstResponseMs,
        agentBreakdown,
        conversionsToday: conversionsToday.length,
        pipelineBreakdown,
        newSignUps: conversionsToday,
      };
    });

    // ── Step 7: Write report snapshot ─────────────────────────────────────
    await step.run('write-report-snapshot', async () => {
      const { error } = await supabase
        .from('campaign_report_snapshots')
        .upsert(
          {
            report_date: aggregate.reportDate,
            generated_at: new Date().toISOString(),
            new_leads_today: aggregate.newLeadsToday,
            cumulative_leads: aggregate.cumulative,
            open_tickets: aggregate.openTickets,
            closed_tickets: aggregate.closedTickets,
            unassigned_tickets: aggregate.unassigned,
            conversion_rate: aggregate.conversionRate,
            avg_first_response_ms: aggregate.avgFirstResponseMs,
            agent_breakdown: aggregate.agentBreakdown,
            conversions_today: aggregate.conversionsToday,
            pipeline_breakdown: aggregate.pipelineBreakdown,
          },
          { onConflict: 'report_date' }
        );

      if (error) throw new Error(`Snapshot write failed: ${error.message}`);
    });

    // ── Step 8: Send email report ─────────────────────────────────────────
    await step.run('send-email-report', async () => {
      const dateLabel = new Date(aggregate.reportDate + 'T00:00:00')
        .toLocaleDateString('en-ZA', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

      const { html, text } = buildEmailHtml({
        reportDate: dateLabel,
        newLeadsToday: aggregate.newLeadsToday,
        conversionsToday: aggregate.conversionsToday,
        conversionRate: aggregate.conversionRate,
        unassigned: aggregate.unassigned,
        openTickets: aggregate.openTickets,
        closedTickets: aggregate.closedTickets,
        cumulative: aggregate.cumulative,
        avgFirstResponseMs: aggregate.avgFirstResponseMs,
        agentBreakdown: aggregate.agentBreakdown,
        pipelineBreakdown: aggregate.pipelineBreakdown,
        newSignUps: aggregate.newSignUps,
      });

      const recipient =
        process.env.CAMPAIGN_REPORT_RECIPIENT ?? 'jeffrey.de.wee@circletel.co.za';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'billing@notify.circletel.co.za',
          to: [recipient],
          subject: `WhatsApp Campaign Report — ${dateLabel} | ${aggregate.newLeadsToday} new lead${aggregate.newLeadsToday !== 1 ? 's' : ''}`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Resend failed: ${err.message}`);
      }

      zohoLogger.debug('[CampaignReport] Email sent', { recipient, date: aggregate.reportDate });
    });

    return {
      reportDate: aggregate.reportDate,
      ticketsProcessed: enrichedWithSignUps.length,
      newLeads: aggregate.newLeadsToday,
      conversions: aggregate.conversionsToday,
    };
  }
);
