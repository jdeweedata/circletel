/**
 * Ruijie Sync Health Cron
 *
 * Guards the per-device traffic sync (#702). `ruijie_traffic_rollups` is the
 * system of record — Ruijie Cloud itself serves only ~3 days of per-device flow
 * (measured 2026-08-02), so a sync outage longer than that is permanent,
 * unrecoverable data loss. Nothing watched this before.
 *
 * Runs every 4 hours, which detects a stall with ~60h of runway remaining.
 *
 * Sends from notify.circletel.co.za — the ONLY domain verified in Resend
 * (checked 2026-08-02). Other senders in this codebase use unverified domains
 * and fail silently, which is exactly the failure an alert must not have.
 *
 * @module app/api/cron/ruijie-sync-health/route
 */

import { NextRequest, NextResponse } from 'next/server';

import { cronLogger } from '@/lib/logging';
import { createClient } from '@/lib/supabase/server';
import {
  evaluateRuijieSyncHealth,
  RUIJIE_SOURCE_RETENTION_HOURS,
  type RuijieSyncHealthResult,
} from '@/lib/network/ruijie-sync-health';

const ALERT_EMAIL =
  process.env.NETWORK_ALERT_EMAIL || process.env.ALERT_EMAIL_TO || 'dev@circletel.co.za';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_FROM = 'CircleTel Alerts <alerts@notify.circletel.co.za>';

/** Window for "is the fleet still reporting per-device?" */
const COVERAGE_WINDOW_HOURS = 6;

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const coverageSince = new Date(
      now.getTime() - COVERAGE_WINDOW_HOURS * 3_600_000
    ).toISOString();

    const [newestRollup, recentRows, enrolledDevices, newestStaff] = await Promise.all([
      supabase
        .from('ruijie_traffic_rollups')
        .select('captured_at')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ruijie_traffic_rollups')
        .select('device_sn')
        .gte('captured_at', coverageSince),
      supabase
        .from('ruijie_device_cache')
        .select('sn')
        .not('group_id', 'is', null),
      supabase
        .from('ruijie_ssid_traffic_rollups')
        .select('hour_bucket')
        .order('hour_bucket', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const devicesReportingRecently = new Set(
      (recentRows.data ?? [])
        .map((row) => row.device_sn as string | null)
        // The legacy sentinel is not a real device — counting it would mask a
        // regression to group-only collection.
        .filter((sn): sn is string => Boolean(sn) && sn !== '__legacy_group__')
    ).size;

    const result = evaluateRuijieSyncHealth({
      now,
      newestRollupAt: (newestRollup.data?.captured_at as string | undefined) ?? null,
      devicesReportingRecently,
      devicesExpected: (enrolledDevices.data ?? []).length,
      newestStaffRollupAt: (newestStaff.data?.hour_bucket as string | undefined) ?? null,
    });

    let emailSent = false;
    if (result.status !== 'healthy') {
      emailSent = await sendAlert(result);
      cronLogger.warn('[RuijieSyncHealth] Unhealthy', {
        status: result.status,
        hoursUntilUnrecoverable: result.hoursUntilUnrecoverable,
        emailSent,
      });
    }

    return NextResponse.json({
      status: result.status,
      checks: result.checks,
      hoursUntilUnrecoverable: Number(result.hoursUntilUnrecoverable.toFixed(1)),
      sourceRetentionHours: RUIJIE_SOURCE_RETENTION_HOURS,
      alertSent: emailSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    cronLogger.error('[RuijieSyncHealth] Check failed', { error: message });
    return NextResponse.json(
      { error: 'Ruijie sync health check failed', details: message },
      { status: 500 }
    );
  }
}

async function sendAlert(result: RuijieSyncHealthResult): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  const rows = result.checks
    .map(
      (check) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${check.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:${
            check.status === 'fail'
              ? '#b91c1c'
              : check.status === 'warn'
                ? '#b45309'
                : '#15803d'
          };">${check.status.toUpperCase()}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;">${check.value}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#475569;">${check.message}</td>
        </tr>`
    )
    .join('');

  const runway = result.hoursUntilUnrecoverable;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:720px;">
      <h2 style="color:#0f172a;">Ruijie sync ${result.status.toUpperCase()}</h2>
      <div style="border-left:4px solid #E87A1E;background:#fff7ed;padding:12px 16px;margin:16px 0;">
        <strong>Roughly ${runway.toFixed(0)} hours before this becomes unrecoverable.</strong><br/>
        Ruijie Cloud retains only about ${RUIJIE_SOURCE_RETENTION_HOURS} hours of per-device flow.
        Anything not collected inside that window cannot be backfilled from any source —
        <code>ruijie_traffic_rollups</code> is the system of record, not a cache.
      </div>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="text-align:left;background:#f8fafc;">
            <th style="padding:8px 12px;">Check</th><th style="padding:8px 12px;">Status</th>
            <th style="padding:8px 12px;">Value</th><th style="padding:8px 12px;">Detail</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:20px;">
        The sync runs on an Inngest cron every 30 minutes
        (<code>ruijie-sync</code> → <code>ruijie-traffic-rollup</code>).
        If it has stalled, re-register with
        <code>curl -X PUT https://www.circletel.co.za/api/inngest</code> and check the Inngest dashboard.
      </p>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: [ALERT_EMAIL],
      subject: `[${result.status.toUpperCase()}] Ruijie sync — ${runway.toFixed(0)}h before data loss`,
      html,
    }),
  });

  return response.ok;
}
