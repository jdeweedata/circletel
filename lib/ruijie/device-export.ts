/**
 * Device report export model.
 *
 * Assembles everything the device detail page knows about one AP — cached
 * identity, live metrics, traffic window, connected clients, management logs —
 * into a single model that the PDF and Excel generators render. Sections that
 * fail upstream (offline device, Ruijie timeout) degrade to "unavailable"
 * rather than failing the whole export.
 */

import { createClient } from '@/lib/supabase/server';
import {
  getDeviceMetrics,
  getDeviceClients,
  getDeviceLogs,
  getNetworkTraffic,
  type DeviceMetrics,
  type RuijieClient,
  type RuijieLogEntry,
  type TrafficSummary,
} from './client';

export const EXPORT_WINDOW_HOURS = [6, 24, 72, 168] as const;

/** Snap an arbitrary hours value onto the windows the traffic panel offers. */
export function clampHours(value: number | null | undefined): number {
  return value != null && (EXPORT_WINDOW_HOURS as readonly number[]).includes(value)
    ? value
    : 24;
}

export function windowLabel(hours: number): string {
  if (hours % 24 === 0 && hours >= 24) return `Last ${hours / 24} day${hours > 24 ? 's' : ''}`;
  return `Last ${hours} hours`;
}

/** Identity fields as cached in ruijie_device_cache (the page's own source). */
export interface DeviceExportDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_id: string | null;
  group_name: string | null;
  management_ip: string | null;
  wan_ip: string | null;
  egress_ip: string | null;
  status: string;
  config_status: string | null;
  firmware_version: string | null;
  mac_address: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  online_clients: number | null;
  synced_at: string | null;
}

export interface DeviceExportModel {
  device: DeviceExportDevice;
  metrics: DeviceMetrics | null;
  traffic: TrafficSummary | null;
  clients: RuijieClient[];
  logs: RuijieLogEntry[];
  hours: number;
  generatedAtIso: string;
  unavailable: {
    metrics?: string;
    traffic?: string;
    clients?: string;
    logs?: string;
  };
}

function reasonFrom(rejection: PromiseRejectedResult): string {
  const cause = rejection.reason;
  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Build the export model for one device.
 * Returns null when the SN is not in the device cache (route turns this into 404).
 */
export async function buildDeviceExportModel(
  sn: string,
  hours: number
): Promise<DeviceExportModel | null> {
  const supabase = await createClient();
  const { data: device } = await supabase
    .from('ruijie_device_cache')
    .select(
      'sn, device_name, model, group_id, group_name, management_ip, wan_ip, egress_ip, status, config_status, firmware_version, mac_address, cpu_usage, memory_usage, uptime_seconds, online_clients, synced_at'
    )
    .eq('sn', sn)
    .single();

  if (!device) return null;

  const window = clampHours(hours);
  const unavailable: DeviceExportModel['unavailable'] = {};

  const [metricsResult, trafficResult, clientsResult, logsResult] = await Promise.allSettled([
    getDeviceMetrics(sn, device.group_id ?? undefined),
    getNetworkTraffic({ sn, hours: window }),
    device.group_id
      ? getDeviceClients(sn, device.group_id)
      : Promise.resolve([] as RuijieClient[]),
    getDeviceLogs(sn),
  ]);

  let metrics: DeviceMetrics | null = null;
  if (metricsResult.status === 'fulfilled') {
    metrics = metricsResult.value;
  } else {
    unavailable.metrics = reasonFrom(metricsResult);
  }

  let traffic: TrafficSummary | null = null;
  if (trafficResult.status === 'fulfilled') {
    traffic = trafficResult.value;
    // getNetworkTraffic swallows upstream errors into an empty summary — an
    // empty window on an online device still renders, just with a note.
    if (traffic.dataPoints.length === 0) {
      unavailable.traffic = 'No traffic samples returned for this window';
    }
  } else {
    unavailable.traffic = reasonFrom(trafficResult);
  }

  let clients: RuijieClient[] = [];
  if (clientsResult.status === 'fulfilled') {
    clients = clientsResult.value;
  } else {
    unavailable.clients = reasonFrom(clientsResult);
  }
  if (!device.group_id && !unavailable.clients) {
    unavailable.clients = 'Device has no Ruijie group — client list requires one';
  }

  let logs: RuijieLogEntry[] = [];
  if (logsResult.status === 'fulfilled') {
    logs = logsResult.value;
  } else {
    unavailable.logs = reasonFrom(logsResult);
  }

  return {
    device: device as DeviceExportDevice,
    metrics,
    traffic,
    clients,
    logs,
    hours: window,
    generatedAtIso: new Date().toISOString(),
    unavailable,
  };
}

export function exportFilename(sn: string, hours: number, extension: 'pdf' | 'xlsx'): string {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
  }).format(new Date());
  return `CircleTel_Device_${sn}_${date}_${hours}h.${extension}`;
}
