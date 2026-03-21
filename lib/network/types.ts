/**
 * Network Device Types
 * Unified types for all deployed hardware: Tarana routers, Tozed CPEs, Ruijie APs, SIM cards
 */

export type DeviceType = 'tarana_router' | 'tozed_cpe' | 'ruijie_ap' | 'sim_card';
export type DeviceChannel = 'mtn_wholesale' | 'arlan' | 'dfa' | 'internal';
export type DeviceStatus = 'deployed' | 'active' | 'offline' | 'signal_issues' | 'pending' | 'reserved' | 'decommissioned';

export interface NetworkDevice {
  id: string;
  serial_number: string;
  device_name: string;
  device_type: DeviceType;
  model: string | null;
  site_name: string | null;
  channel: DeviceChannel | null;
  province: string | null;
  area: string | null;
  technology: string | null;
  pppoe_username: string | null;
  sim_number: string | null;
  mtn_reference: string | null;
  ip_address: string | null;
  mac_address: string | null;
  status: DeviceStatus;
  signal_notes: string | null;
  consumer_order_id: string | null;
  ruijie_device_sn: string | null;
  interstellio_subscriber_id: string | null;
  monthly_cost: number | null;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields from ruijie_device_cache
  ruijie_status?: string;
  ruijie_online_clients?: number;
  // Joined fields from consumer_orders
  order_number?: string;
  customer_name?: string;
}

export interface NetworkDeviceStats {
  total: number;
  by_type: Record<DeviceType, number>;
  by_status: Record<string, number>;
  by_channel: Record<string, number>;
  total_monthly_cost: number;
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  tarana_router: 'Tarana Router',
  tozed_cpe: 'Tozed 5G CPE',
  ruijie_ap: 'Ruijie AP',
  sim_card: 'SIM Card',
};

export const DEVICE_TYPE_COLORS: Record<DeviceType, string> = {
  tarana_router: 'bg-orange-100 text-orange-700 border-orange-200',
  tozed_cpe: 'bg-blue-100 text-blue-700 border-blue-200',
  ruijie_ap: 'bg-purple-100 text-purple-700 border-purple-200',
  sim_card: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const CHANNEL_LABELS: Record<DeviceChannel, string> = {
  mtn_wholesale: 'MTN Wholesale',
  arlan: 'Arlan MTN',
  dfa: 'DFA',
  internal: 'Internal',
};

export const STATUS_COLORS: Record<DeviceStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  deployed: 'bg-blue-100 text-blue-700 border-blue-200',
  offline: 'bg-slate-100 text-slate-600 border-slate-200',
  signal_issues: 'bg-amber-100 text-amber-700 border-amber-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  reserved: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  decommissioned: 'bg-red-100 text-red-700 border-red-200',
};
