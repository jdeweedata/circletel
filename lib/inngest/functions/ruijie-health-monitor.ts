/**
 * Ruijie Device Health Monitor
 *
 * Proactive monitoring system that:
 * - Captures health snapshots after each sync
 * - Detects anomalies (client spikes/drops, offline flapping)
 * - Calculates health scores based on stability
 * - Creates alerts for degradation patterns
 *
 * Trigger: ruijie/sync.completed event
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// TYPES
// =============================================================================

interface DeviceMetrics {
  sn: string;
  device_name: string;
  status: string;
  online_clients: number;
  cpu_usage: number | null;
  memory_usage: number | null;
  customer_name: string | null;
  group_name: string | null;
}

interface HistoricalSnapshot {
  captured_at: string;
  online_clients: number | null;
  status: string | null;
  anomaly_detected: boolean;
}

interface AnomalyResult {
  detected: boolean;
  type: string | null;
  severity: 'info' | 'warning' | 'critical';
  message: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANOMALY_THRESHOLDS = {
  // Client count change thresholds (percentage)
  CLIENT_SPIKE_PERCENT: 50,
  CLIENT_DROP_PERCENT: 50,
  // Minimum client count for percentage-based detection
  MIN_CLIENTS_FOR_PERCENT: 5,
  // Offline flap detection (status changes in lookback period)
  FLAP_THRESHOLD: 3,
  FLAP_LOOKBACK_MINUTES: 60,
  // Resource usage thresholds
  HIGH_CPU_PERCENT: 90,
  HIGH_MEMORY_PERCENT: 90,
  // Health score weights
  OFFLINE_PENALTY: 20,
  ANOMALY_PENALTY: 10,
  HIGH_RESOURCE_PENALTY: 5,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate health score (0-100) based on device stability
 */
function calculateHealthScore(
  currentStatus: string,
  recentAnomalies: number,
  cpuUsage: number | null,
  memoryUsage: number | null
): number {
  let score = 100;

  // Offline penalty
  if (currentStatus === 'offline') {
    score -= ANOMALY_THRESHOLDS.OFFLINE_PENALTY;
  }

  // Anomaly penalties
  score -= recentAnomalies * ANOMALY_THRESHOLDS.ANOMALY_PENALTY;

  // High resource usage penalty
  if (cpuUsage && cpuUsage > ANOMALY_THRESHOLDS.HIGH_CPU_PERCENT) {
    score -= ANOMALY_THRESHOLDS.HIGH_RESOURCE_PENALTY;
  }
  if (memoryUsage && memoryUsage > ANOMALY_THRESHOLDS.HIGH_MEMORY_PERCENT) {
    score -= ANOMALY_THRESHOLDS.HIGH_RESOURCE_PENALTY;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Detect anomalies by comparing current metrics to historical data
 */
function detectAnomaly(
  currentClients: number,
  currentStatus: string,
  history: HistoricalSnapshot[]
): AnomalyResult {
  const noAnomaly: AnomalyResult = {
    detected: false,
    type: null,
    severity: 'info',
    message: null,
  };

  if (history.length === 0) {
    return noAnomaly;
  }

  // Get previous snapshot
  const previous = history[0];
  const previousClients = previous.online_clients ?? 0;

  // Client spike detection
  if (
    previousClients >= ANOMALY_THRESHOLDS.MIN_CLIENTS_FOR_PERCENT &&
    currentClients > previousClients * (1 + ANOMALY_THRESHOLDS.CLIENT_SPIKE_PERCENT / 100)
  ) {
    const increase = currentClients - previousClients;
    return {
      detected: true,
      type: 'client_spike',
      severity: increase > 20 ? 'warning' : 'info',
      message: `Client count spiked from ${previousClients} to ${currentClients} (+${Math.round((increase / previousClients) * 100)}%)`,
    };
  }

  // Client drop detection
  if (
    previousClients >= ANOMALY_THRESHOLDS.MIN_CLIENTS_FOR_PERCENT &&
    currentClients < previousClients * (1 - ANOMALY_THRESHOLDS.CLIENT_DROP_PERCENT / 100)
  ) {
    const decrease = previousClients - currentClients;
    return {
      detected: true,
      type: 'client_drop',
      severity: currentClients === 0 ? 'critical' : 'warning',
      message: `Client count dropped from ${previousClients} to ${currentClients} (-${Math.round((decrease / previousClients) * 100)}%)`,
    };
  }

  // Offline flapping detection (multiple status changes in lookback period)
  const statusChanges = history.filter((h, i) => {
    if (i === 0) return h.status !== currentStatus;
    return h.status !== history[i - 1].status;
  }).length;

  if (statusChanges >= ANOMALY_THRESHOLDS.FLAP_THRESHOLD) {
    return {
      detected: true,
      type: 'offline_flap',
      severity: 'critical',
      message: `Device status is flapping: ${statusChanges} status changes in the last hour`,
    };
  }

  return noAnomaly;
}

// =============================================================================
// RUIJIE HEALTH MONITOR FUNCTION
// =============================================================================

/**
 * Main health monitoring function.
 * Triggered after each device sync to capture health snapshots and detect anomalies.
 */
export const ruijieHealthMonitorFunction = inngest.createFunction(
  {
    id: 'ruijie-health-monitor',
    name: 'Ruijie Device Health Monitor',
    retries: 2,
  },
  { event: 'ruijie/sync.completed' },
  async ({ event, step }) => {
    const syncLogId = event.data?.sync_log_id;
    const capturedAt = new Date().toISOString();

    // Step 1: Get all devices with current metrics
    const devices = await step.run('fetch-device-metrics', async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('ruijie_device_cache')
        .select('sn, device_name, status, online_clients, cpu_usage, memory_usage, customer_name, group_name')
        .order('device_name');

      if (error) {
        console.error('[HealthMonitor] Failed to fetch devices:', error);
        return [];
      }

      return data as DeviceMetrics[];
    });

    if (devices.length === 0) {
      return { snapshotsCreated: 0, alertsCreated: 0 };
    }

    // Step 2: Get recent history for anomaly detection (last hour)
    const deviceHistory = await step.run('fetch-device-history', async () => {
      const supabase = await createClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('device_health_snapshots')
        .select('device_sn, captured_at, online_clients, status, anomaly_detected')
        .gte('captured_at', oneHourAgo)
        .order('captured_at', { ascending: false });

      if (error) {
        console.error('[HealthMonitor] Failed to fetch history:', error);
        return {};
      }

      // Group by device
      const grouped: Record<string, HistoricalSnapshot[]> = {};
      for (const row of data || []) {
        if (!grouped[row.device_sn]) {
          grouped[row.device_sn] = [];
        }
        grouped[row.device_sn].push({
          captured_at: row.captured_at,
          online_clients: row.online_clients,
          status: row.status,
          anomaly_detected: row.anomaly_detected,
        });
      }

      return grouped;
    });

    // Step 3: Process each device - capture snapshot and detect anomalies
    const results = await step.run('process-devices', async () => {
      const supabase = await createClient();
      const snapshots: Array<{
        device_sn: string;
        captured_at: string;
        online_clients: number;
        status: string;
        cpu_usage: number | null;
        memory_usage: number | null;
        health_score: number;
        anomaly_detected: boolean;
        anomaly_type: string | null;
      }> = [];
      const alerts: Array<{
        device_sn: string;
        alert_type: string;
        severity: string;
        message: string;
        metadata: Record<string, unknown>;
      }> = [];

      for (const device of devices) {
        const history = deviceHistory[device.sn] || [];
        const recentAnomalies = history.filter((h) => h.anomaly_detected).length;

        // Detect anomaly
        const anomaly = detectAnomaly(device.online_clients, device.status, history);

        // Calculate health score
        const healthScore = calculateHealthScore(
          device.status,
          recentAnomalies + (anomaly.detected ? 1 : 0),
          device.cpu_usage,
          device.memory_usage
        );

        // Create snapshot
        snapshots.push({
          device_sn: device.sn,
          captured_at: capturedAt,
          online_clients: device.online_clients,
          status: device.status,
          cpu_usage: device.cpu_usage,
          memory_usage: device.memory_usage,
          health_score: healthScore,
          anomaly_detected: anomaly.detected,
          anomaly_type: anomaly.type,
        });

        // Create alert for anomalies
        if (anomaly.detected && anomaly.message) {
          alerts.push({
            device_sn: device.sn,
            alert_type: anomaly.type!,
            severity: anomaly.severity,
            message: anomaly.message,
            metadata: {
              device_name: device.device_name,
              customer_name: device.customer_name,
              group_name: device.group_name,
              online_clients: device.online_clients,
              health_score: healthScore,
              sync_log_id: syncLogId,
            },
          });
        }

        // Create alert for low health score
        if (healthScore < 50 && !anomaly.detected) {
          alerts.push({
            device_sn: device.sn,
            alert_type: 'low_health_score',
            severity: healthScore < 30 ? 'critical' : 'warning',
            message: `Device health score is low: ${healthScore}/100`,
            metadata: {
              device_name: device.device_name,
              customer_name: device.customer_name,
              group_name: device.group_name,
              health_score: healthScore,
              recent_anomalies: recentAnomalies,
              sync_log_id: syncLogId,
            },
          });
        }
      }

      // Batch insert snapshots
      if (snapshots.length > 0) {
        const { error: snapshotError } = await supabase
          .from('device_health_snapshots')
          .upsert(snapshots, { onConflict: 'device_sn,captured_at' });

        if (snapshotError) {
          console.error('[HealthMonitor] Failed to insert snapshots:', snapshotError);
        } else {
          console.log(`[HealthMonitor] Created ${snapshots.length} health snapshots`);
        }
      }

      // Batch insert alerts (deduplicate by checking recent alerts)
      let alertsCreated = 0;
      if (alerts.length > 0) {
        // Check for recently created alerts (within 30 mins) to avoid duplicates
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentAlerts } = await supabase
          .from('network_health_alerts')
          .select('device_sn, alert_type')
          .gte('created_at', thirtyMinsAgo);

        const recentAlertKeys = new Set(
          (recentAlerts || []).map((a) => `${a.device_sn}:${a.alert_type}`)
        );

        const newAlerts = alerts.filter(
          (a) => !recentAlertKeys.has(`${a.device_sn}:${a.alert_type}`)
        );

        if (newAlerts.length > 0) {
          const { error: alertError } = await supabase
            .from('network_health_alerts')
            .insert(newAlerts);

          if (alertError) {
            console.error('[HealthMonitor] Failed to insert alerts:', alertError);
          } else {
            alertsCreated = newAlerts.length;
            console.log(`[HealthMonitor] Created ${alertsCreated} health alerts`);
          }
        }
      }

      return {
        snapshotsCreated: snapshots.length,
        alertsCreated,
        anomaliesDetected: alerts.length,
      };
    });

    // Step 4: Cleanup old snapshots (keep last 7 days)
    await step.run('cleanup-old-snapshots', async () => {
      const supabase = await createClient();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('device_health_snapshots')
        .delete()
        .lt('captured_at', sevenDaysAgo);

      if (error) {
        console.error('[HealthMonitor] Failed to cleanup old snapshots:', error);
      } else {
        console.log('[HealthMonitor] Cleaned up snapshots older than 7 days');
      }
    });

    return {
      success: true,
      ...results,
    };
  }
);
