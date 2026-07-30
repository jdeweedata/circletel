/**
 * Lead first-response SLA escalation cron
 *
 * Finds coverage_leads past first_response_due_at that are still `new` and
 * unanswered, emails the sales inbox, and stamps metadata.sla_escalated_at
 * so we do not re-spam every tick (re-alert only after 24h).
 *
 * Schedule: every 30 minutes (vercel.json + host crontab from generator)
 *
 * Auth: Authorization: Bearer $CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailChannel } from '@/lib/notifications/channels/email-channel';
import { cronLogger } from '@/lib/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SALES_TEAM_EMAIL = process.env.SALES_TEAM_EMAIL || 'sales@circletel.co.za';
const APP_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'https://www.circletel.co.za';

/** Minimum gap between escalation emails for the same lead */
const REALERT_AFTER_MS = 24 * 60 * 60 * 1000;
/** Safety cap per cron run */
const MAX_LEADS_PER_RUN = 50;

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  customer_type: string | null;
  lead_source: string | null;
  source_campaign: string | null;
  address: string | null;
  suburb: string | null;
  city: string | null;
  first_response_due_at: string;
  created_at: string | null;
  assigned_admin_id: string | null;
  metadata: Record<string, unknown> | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatSast(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function hoursOverdue(dueAtIso: string, now: Date): number {
  const due = new Date(dueAtIso).getTime();
  if (Number.isNaN(due)) return 0;
  return Math.max(0, (now.getTime() - due) / (60 * 60 * 1000));
}

function shouldEscalate(
  metadata: Record<string, unknown> | null | undefined,
  now: Date
): boolean {
  const raw = metadata?.sla_escalated_at;
  if (typeof raw !== 'string' || !raw) return true;
  const last = new Date(raw).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= REALERT_AFTER_MS;
}

function buildEscalationHtml(lead: LeadRow, now: Date): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';
  const location = [lead.suburb, lead.city].filter(Boolean).join(', ') || lead.address || '—';
  const adminUrl = `${APP_BASE.replace(/\/$/, '')}/admin/leads/${lead.id}`;
  const overdueH = hoursOverdue(lead.first_response_due_at, now).toFixed(1);

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1B2A4A; line-height: 1.5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #B91C1C; font-size: 20px; margin: 0 0 8px;">First-response SLA breached</h1>
    <p style="margin: 0 0 16px; color: #4B5563;">
      This lead is still <strong>new</strong> with no first response past the due time
      (${escapeHtml(overdueH)}h overdue as of ${escapeHtml(formatSast(now.toISOString()))} SAST).
    </p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #6B7280; width: 140px;">Lead</td>
        <td style="padding: 8px 0;"><strong>${escapeHtml(name)}</strong></td>
      </tr>
      ${
        lead.company_name
          ? `<tr><td style="padding: 8px 0; color: #6B7280;">Company</td><td style="padding: 8px 0;">${escapeHtml(lead.company_name)}</td></tr>`
          : ''
      }
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Phone</td>
        <td style="padding: 8px 0;"><a href="tel:${escapeHtml(lead.phone || '')}">${escapeHtml(lead.phone || '—')}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Email</td>
        <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(lead.email || '')}">${escapeHtml(lead.email || '—')}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Location</td>
        <td style="padding: 8px 0;">${escapeHtml(location)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Customer type</td>
        <td style="padding: 8px 0;">${escapeHtml(lead.customer_type || '—')}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Source</td>
        <td style="padding: 8px 0;">${escapeHtml(lead.lead_source || '—')}${
          lead.source_campaign ? ` / ${escapeHtml(lead.source_campaign)}` : ''
        }</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Created</td>
        <td style="padding: 8px 0;">${escapeHtml(formatSast(lead.created_at))}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6B7280;">Response due</td>
        <td style="padding: 8px 0; color: #B91C1C;"><strong>${escapeHtml(formatSast(lead.first_response_due_at))}</strong></td>
      </tr>
    </table>
    <a href="${escapeHtml(adminUrl)}"
       style="display: inline-block; background: #E87A1E; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: 600;">
      Open lead in admin
    </a>
    <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF;">
      CircleTel SLA escalation · re-alerts at most once per 24 hours while still overdue
    </p>
  </div>
</body>
</html>`.trim();
}

function authorize(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    cronLogger.error('[LeadFollowupSla] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    cronLogger.error('[LeadFollowupSla] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

async function runEscalation(): Promise<NextResponse> {
  const startTime = Date.now();
  const now = new Date();
  const nowIso = now.toISOString();

  cronLogger.info('[LeadFollowupSla] Starting SLA escalation run', { at: nowIso });

  const supabase = await createClient();

  const { data: rows, error: fetchError } = await supabase
    .from('coverage_leads')
    .select(
      [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'company_name',
        'customer_type',
        'lead_source',
        'source_campaign',
        'address',
        'suburb',
        'city',
        'first_response_due_at',
        'created_at',
        'assigned_admin_id',
        'metadata',
      ].join(',')
    )
    .eq('status', 'new')
    .is('first_responded_at', null)
    .not('first_response_due_at', 'is', null)
    .lt('first_response_due_at', nowIso)
    .order('first_response_due_at', { ascending: true })
    .limit(MAX_LEADS_PER_RUN);

  if (fetchError) {
    cronLogger.error('[LeadFollowupSla] Failed to query overdue leads', {
      error: fetchError.message,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to query overdue leads', details: fetchError.message },
      { status: 500 }
    );
  }

  const leads = (rows || []) as unknown as LeadRow[];
  const candidates = leads.filter((lead) => shouldEscalate(lead.metadata, now));

  if (candidates.length === 0) {
    cronLogger.info('[LeadFollowupSla] No leads needing escalation', {
      overdueFetched: leads.length,
      durationMs: Date.now() - startTime,
    });
    return NextResponse.json({
      success: true,
      message: 'No leads needing SLA escalation',
      overdue_fetched: leads.length,
      escalated: 0,
      skipped_recent: leads.length,
      duration_ms: Date.now() - startTime,
    });
  }

  let escalated = 0;
  let emailFailed = 0;
  let updateFailed = 0;
  const escalatedIds: string[] = [];
  const errors: string[] = [];

  for (const lead of candidates) {
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown';
    const overdueH = hoursOverdue(lead.first_response_due_at, now).toFixed(1);

    try {
      const emailResult = await EmailChannel.send({
        to: SALES_TEAM_EMAIL,
        subject: `[SLA Breach] First response overdue — ${name} (${overdueH}h)`,
        html: buildEscalationHtml(lead, now),
        from: 'CircleTel Alerts <devadmin@notifications.circletelsa.co.za>',
      });

      if (!emailResult.success) {
        emailFailed += 1;
        errors.push(`${lead.id}: email ${emailResult.error || 'failed'}`);
        cronLogger.warn('[LeadFollowupSla] Email failed', {
          leadId: lead.id,
          error: emailResult.error,
        });
        // Still stamp escalation if email service is misconfigured? Prefer not —
        // leave unstamped so next run retries.
        continue;
      }

      const prevMeta =
        lead.metadata && typeof lead.metadata === 'object' && !Array.isArray(lead.metadata)
          ? { ...lead.metadata }
          : {};

      const nextMeta = {
        ...prevMeta,
        sla_escalated_at: nowIso,
        sla_escalation_count:
          typeof prevMeta.sla_escalation_count === 'number'
            ? prevMeta.sla_escalation_count + 1
            : 1,
      };

      const { error: updateError } = await supabase
        .from('coverage_leads')
        .update({
          metadata: nextMeta,
          updated_at: nowIso,
        })
        .eq('id', lead.id);

      if (updateError) {
        updateFailed += 1;
        errors.push(`${lead.id}: metadata update ${updateError.message}`);
        cronLogger.error('[LeadFollowupSla] Failed to stamp sla_escalated_at', {
          leadId: lead.id,
          error: updateError.message,
        });
        // Email already sent — count as escalated to avoid double-count confusion
      }

      escalated += 1;
      escalatedIds.push(lead.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      emailFailed += 1;
      errors.push(`${lead.id}: ${message}`);
      cronLogger.error('[LeadFollowupSla] Lead escalation exception', {
        leadId: lead.id,
        error: message,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  cronLogger.info('[LeadFollowupSla] Run complete', {
    overdueFetched: leads.length,
    candidates: candidates.length,
    escalated,
    emailFailed,
    updateFailed,
    durationMs,
  });

  return NextResponse.json({
    success: emailFailed === 0 && updateFailed === 0,
    message: `Escalated ${escalated} of ${candidates.length} overdue lead(s)`,
    overdue_fetched: leads.length,
    candidates: candidates.length,
    escalated,
    email_failed: emailFailed,
    update_failed: updateFailed,
    escalated_ids: escalatedIds,
    errors: errors.length ? errors : undefined,
    duration_ms: durationMs,
  });
}

/**
 * GET /api/cron/lead-followup-sla
 * Host crontab / Vercel Cron entrypoint.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const denied = authorize(request);
  if (denied) return denied;

  try {
    return await runEscalation();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    cronLogger.error('[LeadFollowupSla] Fatal error', { error: message });
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}

/** POST — same as GET (manual trigger) */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
