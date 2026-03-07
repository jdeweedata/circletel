/**
 * Ruijie Mock Data Generator
 * Realistic test data matching actual device fleet from screenshots
 *
 * 20 devices total:
 * - Newgen Network: 3 RAP2200(F) APs
 * - Unjani: 15 APs + 2 switches
 */

import { RuijieDevice, RuijieTunnel } from './types';

// =============================================================================
// BASE DEVICE DATA (from actual Ruijie Cloud screenshots)
// =============================================================================

type BaseDevice = Omit<
  RuijieDevice,
  'cpu_usage' | 'memory_usage' | 'online_clients' | 'radio_2g_utilization' | 'radio_5g_utilization' | 'last_seen_at'
>;

const MOCK_DEVICES_BASE: BaseDevice[] = [
  // Newgen Network (3 RAP2200F APs)
  {
    sn: 'G1U511Y076983',
    device_name: 'AP_Downstairs',
    model: 'RAP2200(F)',
    group_id: 'newgen-001',
    group_name: 'Newgen Network',
    management_ip: '192.168.1.10',
    wan_ip: '41.76.108.21',
    egress_ip: '41.76.108.21',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:11:22:33',
    uptime_seconds: 864000,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'newgen',
  },
  {
    sn: 'G1U511Y07910C',
    device_name: 'Boardroom AP',
    model: 'RAP2200(F)',
    group_id: 'newgen-001',
    group_name: 'Newgen Network',
    management_ip: '192.168.1.11',
    wan_ip: '41.76.108.21',
    egress_ip: '41.76.108.21',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:11:22:34',
    uptime_seconds: 864000,
    radio_2g_channel: 1,
    radio_5g_channel: 36,
    project_id: 'newgen',
  },
  {
    sn: 'G1U511Y079276',
    device_name: 'AP_Upstairs',
    model: 'RAP2200(F)',
    group_id: 'newgen-001',
    group_name: 'Newgen Network',
    management_ip: '192.168.1.12',
    wan_ip: '41.76.108.21',
    egress_ip: '41.76.108.21',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:11:22:35',
    uptime_seconds: 864000,
    radio_2g_channel: 11,
    radio_5g_channel: 44,
    project_id: 'newgen',
  },

  // Unjani APs (15 total)
  {
    sn: 'G1U52HL044404',
    device_name: 'UNJANISICELO',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.10',
    wan_ip: '41.76.109.50',
    egress_ip: '41.76.109.50',
    status: 'online',
    config_status: 'Failed', // Hardcoded - matches actual screenshot
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:44',
    uptime_seconds: 432000,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'unjani',
  },
  {
    sn: 'G1U52HL044425',
    device_name: 'UNJANICLINICSKYCITY',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.11',
    wan_ip: '41.76.109.51',
    egress_ip: '41.76.109.51',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:45',
    uptime_seconds: 518400,
    radio_2g_channel: 1,
    radio_5g_channel: 36,
    project_id: 'unjani',
  },
  {
    sn: 'G1U52HL044450',
    device_name: 'UNJANICOSMOCITY',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.12',
    wan_ip: '41.76.109.52',
    egress_ip: '41.76.109.52',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:46',
    uptime_seconds: 604800,
    radio_2g_channel: 11,
    radio_5g_channel: 44,
    project_id: 'unjani',
  },
  {
    sn: 'G1U52HL044467',
    device_name: 'UNJANICLINICTHOKOZA',
    model: 'RAP62-OD',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.13',
    wan_ip: '41.76.109.53',
    egress_ip: '41.76.109.53',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:47',
    uptime_seconds: 691200,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'unjani',
  },
  {
    sn: 'G1U52HL044518',
    device_name: 'UNJANIHEIDELBURG',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.14',
    wan_ip: '41.76.109.54',
    egress_ip: '41.76.109.54',
    status: 'offline', // Always offline for testing
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:48',
    uptime_seconds: 0,
    radio_2g_channel: 0,
    radio_5g_channel: 0,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C8000083B',
    device_name: 'UNJANICLINICNOKANENG',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.15',
    wan_ip: '41.76.109.55',
    egress_ip: '41.76.109.55',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:49',
    uptime_seconds: 777600,
    radio_2g_channel: 1,
    radio_5g_channel: 36,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009021',
    device_name: 'UNJANICLINICJABULANI',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.16',
    wan_ip: '41.76.109.56',
    egress_ip: '41.76.109.56',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:50',
    uptime_seconds: 864000,
    radio_2g_channel: 11,
    radio_5g_channel: 44,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009022',
    device_name: 'UNJANICLINICMABOPANE',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.17',
    wan_ip: '41.76.109.57',
    egress_ip: '41.76.109.57',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:51',
    uptime_seconds: 950400,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009023',
    device_name: 'UNJANICLINICATTERIDGEVILLE',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.18',
    wan_ip: '41.76.109.58',
    egress_ip: '41.76.109.58',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:52',
    uptime_seconds: 1036800,
    radio_2g_channel: 1,
    radio_5g_channel: 36,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009024',
    device_name: 'UNJANICLINICSOWETO',
    model: 'RAP62-OD',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.19',
    wan_ip: '41.76.109.59',
    egress_ip: '41.76.109.59',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:53',
    uptime_seconds: 1123200,
    radio_2g_channel: 11,
    radio_5g_channel: 44,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009025',
    device_name: 'UNJANICLINICDIEPSLOOT',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.20',
    wan_ip: '41.76.109.60',
    egress_ip: '41.76.109.60',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:54',
    uptime_seconds: 1209600,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009026',
    device_name: 'UNJANICLINICMAMELODI',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.21',
    wan_ip: '41.76.109.61',
    egress_ip: '41.76.109.61',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:55',
    uptime_seconds: 1296000,
    radio_2g_channel: 1,
    radio_5g_channel: 36,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009027',
    device_name: 'UNJANICLINICALEXANDRA',
    model: 'RAP2200(F)',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.22',
    wan_ip: '41.76.109.62',
    egress_ip: '41.76.109.62',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:56',
    uptime_seconds: 1382400,
    radio_2g_channel: 11,
    radio_5g_channel: 44,
    project_id: 'unjani',
  },
  {
    sn: 'G1U9C80009028',
    device_name: 'UNJANICLINICTEMBISA',
    model: 'RAP62-OD',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.23',
    wan_ip: '41.76.109.63',
    egress_ip: '41.76.109.63',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '11.1(6)B9P2',
    mac_address: 'A8:5A:F3:22:33:57',
    uptime_seconds: 1468800,
    radio_2g_channel: 6,
    radio_5g_channel: 149,
    project_id: 'unjani',
  },

  // Unjani Switches (2 total)
  {
    sn: 'G1USWITCH0001',
    device_name: 'UNJANI-SWITCH-01',
    model: 'RG-S2910-24GT4SFP-UP-H',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.1',
    wan_ip: '41.76.109.1',
    egress_ip: '41.76.109.1',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '12.5(1)B0602',
    mac_address: 'A8:5A:F3:00:00:01',
    uptime_seconds: 2592000,
    radio_2g_channel: 0,
    radio_5g_channel: 0,
    project_id: 'unjani',
  },
  {
    sn: 'G1USWITCH0002',
    device_name: 'UNJANI-SWITCH-02',
    model: 'RG-S2910-24GT4SFP-UP-H',
    group_id: 'unjani-001',
    group_name: 'Unjani',
    management_ip: '10.10.1.2',
    wan_ip: '41.76.109.2',
    egress_ip: '41.76.109.2',
    status: 'online',
    config_status: 'Synced',
    firmware_version: '12.5(1)B0602',
    mac_address: 'A8:5A:F3:00:00:02',
    uptime_seconds: 2592000,
    radio_2g_channel: 0,
    radio_5g_channel: 0,
    project_id: 'unjani',
  },
];

// =============================================================================
// SEEDED RANDOM HELPERS
// =============================================================================

/**
 * Simple seeded random for deterministic variance
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Apply seeded variance to metrics (changes every 5 mins)
 * Stable fields: device_name, model, group, configStatus (for known failures)
 * Variable fields: cpu, memory, clients, channel utilization
 */
function applySeededVariance(device: BaseDevice, seed: number): RuijieDevice {
  const deviceSeed = seed + device.sn.charCodeAt(0) + device.sn.charCodeAt(device.sn.length - 1);
  const rand = (offset: number = 0) => seededRandom(deviceSeed + offset);

  // UNJANISICELO always has high CPU/memory (known problematic device)
  const isFailedDevice = device.sn === 'G1U52HL044404';

  // One device always stale for testing warning banner (> 15 mins)
  const isStaleDevice = device.sn === 'G1U52HL044518';
  const staleSyncedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  return {
    ...device,
    cpu_usage: isFailedDevice ? 85 : Math.floor(20 + rand(1) * 40),
    memory_usage: isFailedDevice ? 92 : Math.floor(30 + rand(2) * 35),
    online_clients: device.status === 'offline' ? 0 : Math.floor(rand(3) * 15),
    radio_2g_utilization: device.status === 'offline' || device.radio_2g_channel === 0
      ? 0
      : Math.floor(10 + rand(4) * 50),
    radio_5g_utilization: device.status === 'offline' || device.radio_5g_channel === 0
      ? 0
      : Math.floor(5 + rand(5) * 40),
    last_seen_at: device.status === 'offline'
      ? new Date(Date.now() - 3600000).toISOString()
      : isStaleDevice
        ? staleSyncedAt
        : new Date().toISOString(),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Get all mock devices with seeded variance
 */
export function getMockDevices(): RuijieDevice[] {
  const seed = Math.floor(Date.now() / 300000); // Changes every 5 mins
  return MOCK_DEVICES_BASE.map(d => applySeededVariance(d, seed));
}

/**
 * Get single mock device by SN
 */
export function getMockDevice(sn: string): RuijieDevice {
  const device = MOCK_DEVICES_BASE.find(d => d.sn === sn);
  if (!device) {
    throw new Error(`Mock device not found: ${sn}`);
  }
  const seed = Math.floor(Date.now() / 300000);
  return applySeededVariance(device, seed);
}

/**
 * Create mock tunnel
 */
export function createMockTunnel(sn: string, type: string = 'eweb'): RuijieTunnel {
  return {
    tunnel_id: `mock-${sn}-${Date.now()}`,
    device_sn: sn,
    open_domain_url: `https://tunnel-mock-${sn.toLowerCase()}.ruijie-dev.local`,
    open_ip_url: `http://192.168.250.2:8443`,
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
  };
}

/**
 * Get mock devices for seeding database (same as getMockDevices)
 */
export function getMockDevicesForSeeding(): RuijieDevice[] {
  return getMockDevices();
}
