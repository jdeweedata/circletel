/**
 * Ruijie Offline Device Alerts
 *
 * Runs after each sync completion, checks for devices offline > 15 min
 * Sends Slack alert for newly offline devices (deduplicated to prevent spam)
 *
 * Trigger: ruijie/sync.completed event
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

const SLACK_WEBHOOK_URL = process.env.SLACK_NETWORK_ALERTS_WEBHOOK;
const OFFLINE_THRESHOLD_MINUTES = 15;

interface OfflineDevice {
  sn: string;
  device_name: string;
  group_name: string | null;
  customer_name: string | null;
  last_seen_at: string | null;
  offline_minutes: number;
}

// =============================================================================
// RUIJIE OFFLINE ALERTS FUNCTION
// =============================================================================

/**
 * Check for offline devices after sync and send Slack alerts.
 * Triggered by: ruijie/sync.completed event
 */
export const ruijieOfflineAlertsFunction = inngest.createFunction(
  {
    id: 'ruijie-offline-alerts',
    name: 'Ruijie Offline Device Alerts',
    retries: 2,
  },
  { event: 'ruijie/sync.completed' },
  async ({ event, step }) => {
    // Step 1: Find devices offline > threshold
    const offlineDevices = await step.run('find-offline-devices', async () => {
      const supabase = await createClient();
      const thresholdTime = new Date(
        Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000
      ).toISOString();

      const { data: devices, error } = await supabase
        .from('ruijie_device_cache')
        .select('sn, device_name, group_name, customer_name, last_seen_at')
        .eq('status', 'offline')
        .lt('last_seen_at', thresholdTime)
        .order('last_seen_at', { ascending: true });

      if (error) {
        console.error('[OfflineAlerts] Query error:', error);
        return [];
      }

      return (devices || []).map((d) => ({
        ...d,
        offline_minutes: Math.floor(
          (Date.now() - new Date(d.last_seen_at || 0).getTime()) / 60000
        ),
      })) as OfflineDevice[];
    });

    if (offlineDevices.length === 0) {
      return { alertsSent: 0, message: 'No offline devices exceeding threshold' };
    }

    // Step 2: Check for already-alerted devices (prevent spam)
    const newOfflineDevices = await step.run('filter-new-alerts', async () => {
      const supabase = await createClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: recentAlerts } = await supabase
        .from('ruijie_audit_log')
        .select('device_sn')
        .eq('action', 'offline_alert')
        .gte('created_at', oneHourAgo);

      const alertedSns = new Set(recentAlerts?.map((a) => a.device_sn) || []);
      return offlineDevices.filter((d) => !alertedSns.has(d.sn));
    });

    if (newOfflineDevices.length === 0) {
      return {
        alertsSent: 0,
        message: 'All offline devices already alerted recently',
      };
    }

    // Step 3: Send Slack alert
    if (SLACK_WEBHOOK_URL) {
      await step.run('send-slack-alert', async () => {
        const blocks = [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🔴 ${newOfflineDevices.length} Device(s) Offline`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: newOfflineDevices
                .slice(0, 10)
                .map(
                  (d) =>
                    `• *${d.device_name}* (${d.group_name || 'Unknown'}) - ${d.offline_minutes}min${d.customer_name ? ` - ${d.customer_name}` : ''}`
                )
                .join('\n'),
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Devices' },
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za'}/admin/network/devices?status=offline`,
              },
            ],
          },
        ];

        await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks }),
        });

        console.log(
          `[OfflineAlerts] Sent Slack alert for ${newOfflineDevices.length} devices`
        );
      });
    } else {
      console.log('[OfflineAlerts] No SLACK_NETWORK_ALERTS_WEBHOOK configured, skipping Slack notification');
    }

    // Step 4: Log alerts to audit table
    await step.run('log-alerts', async () => {
      const supabase = await createClient();
      const entries = newOfflineDevices.map((d) => ({
        device_sn: d.sn,
        action: 'offline_alert',
        action_detail: {
          offline_minutes: d.offline_minutes,
          customer_name: d.customer_name,
          group_name: d.group_name,
        },
        status: 'success',
        admin_user_id: null, // System-generated alert (requires nullable column)
      }));

      const { error } = await supabase.from('ruijie_audit_log').insert(entries);
      if (error) {
        console.error('[OfflineAlerts] Failed to log alerts:', error);
      } else {
        console.log(`[OfflineAlerts] Logged ${entries.length} alert entries to audit log`);
      }
    });

    return {
      alertsSent: newOfflineDevices.length,
      devices: newOfflineDevices.map((d) => d.sn),
    };
  }
);
