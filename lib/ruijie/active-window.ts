/**
 * Ruijie fleet retention: only devices active within a sliding window
 * (currently online, or lastOnline / last_seen_at within N days).
 */

export const RUIJIE_ACTIVE_WINDOW_DAYS = 14;

export type ActiveWindowDevice = {
  sn: string;
  status: string;
  last_seen_at?: string | null;
};

/**
 * True if the device is online now, or was last seen within `windowDays`.
 * Offline devices with missing/invalid last_seen are inactive.
 */
export function isDeviceActiveInWindow(
  device: ActiveWindowDevice,
  nowMs: number = Date.now(),
  windowDays: number = RUIJIE_ACTIVE_WINDOW_DAYS
): boolean {
  if (device.status === 'online') return true;
  if (!device.last_seen_at) return false;
  const seen = new Date(device.last_seen_at).getTime();
  if (Number.isNaN(seen)) return false;
  const cutoff = nowMs - windowDays * 24 * 60 * 60 * 1000;
  return seen >= cutoff;
}

export function filterActiveDevices<T extends ActiveWindowDevice>(
  devices: T[],
  nowMs: number = Date.now(),
  windowDays: number = RUIJIE_ACTIVE_WINDOW_DAYS
): T[] {
  return devices.filter((d) => isDeviceActiveInWindow(d, nowMs, windowDays));
}
