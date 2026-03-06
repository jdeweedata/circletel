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
  'cpuUsage' | 'memoryUsage' | 'onlineClients' | 'radio2gUtilization' | 'radio5gUtilization' | 'lastSeenAt'
>;

const MOCK_DEVICES_BASE: BaseDevice[] = [
  // Newgen Network (3 RAP2200F APs)
  {
    sn: 'G1U511Y076983',
    deviceName: 'AP_Downstairs',
    model: 'RAP2200(F)',
    groupId: 'newgen-001',
    groupName: 'Newgen Network',
    managementIp: '192.168.1.10',
    wanIp: '41.76.108.21',
    egressIp: '41.76.108.21',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:11:22:33',
    uptimeSeconds: 864000,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'newgen',
  },
  {
    sn: 'G1U511Y07910C',
    deviceName: 'Boardroom AP',
    model: 'RAP2200(F)',
    groupId: 'newgen-001',
    groupName: 'Newgen Network',
    managementIp: '192.168.1.11',
    wanIp: '41.76.108.21',
    egressIp: '41.76.108.21',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:11:22:34',
    uptimeSeconds: 864000,
    radio2gChannel: 1,
    radio5gChannel: 36,
    projectId: 'newgen',
  },
  {
    sn: 'G1U511Y079276',
    deviceName: 'AP_Upstairs',
    model: 'RAP2200(F)',
    groupId: 'newgen-001',
    groupName: 'Newgen Network',
    managementIp: '192.168.1.12',
    wanIp: '41.76.108.21',
    egressIp: '41.76.108.21',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:11:22:35',
    uptimeSeconds: 864000,
    radio2gChannel: 11,
    radio5gChannel: 44,
    projectId: 'newgen',
  },

  // Unjani APs (15 total)
  {
    sn: 'G1U52HL044404',
    deviceName: 'UNJANISICELO',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.10',
    wanIp: '41.76.109.50',
    egressIp: '41.76.109.50',
    status: 'online',
    configStatus: 'Failed', // Hardcoded - matches actual screenshot
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:44',
    uptimeSeconds: 432000,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'unjani',
  },
  {
    sn: 'G1U52HL044425',
    deviceName: 'UNJANICLINICSKYCITY',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.11',
    wanIp: '41.76.109.51',
    egressIp: '41.76.109.51',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:45',
    uptimeSeconds: 518400,
    radio2gChannel: 1,
    radio5gChannel: 36,
    projectId: 'unjani',
  },
  {
    sn: 'G1U52HL044450',
    deviceName: 'UNJANICOSMOCITY',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.12',
    wanIp: '41.76.109.52',
    egressIp: '41.76.109.52',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:46',
    uptimeSeconds: 604800,
    radio2gChannel: 11,
    radio5gChannel: 44,
    projectId: 'unjani',
  },
  {
    sn: 'G1U52HL044467',
    deviceName: 'UNJANICLINICTHOKOZA',
    model: 'RAP62-OD',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.13',
    wanIp: '41.76.109.53',
    egressIp: '41.76.109.53',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:47',
    uptimeSeconds: 691200,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'unjani',
  },
  {
    sn: 'G1U52HL044518',
    deviceName: 'UNJANIHEIDELBURG',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.14',
    wanIp: '41.76.109.54',
    egressIp: '41.76.109.54',
    status: 'offline', // Always offline for testing
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:48',
    uptimeSeconds: 0,
    radio2gChannel: 0,
    radio5gChannel: 0,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C8000083B',
    deviceName: 'UNJANICLINICNOKANENG',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.15',
    wanIp: '41.76.109.55',
    egressIp: '41.76.109.55',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:49',
    uptimeSeconds: 777600,
    radio2gChannel: 1,
    radio5gChannel: 36,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009021',
    deviceName: 'UNJANICLINICJABULANI',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.16',
    wanIp: '41.76.109.56',
    egressIp: '41.76.109.56',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:50',
    uptimeSeconds: 864000,
    radio2gChannel: 11,
    radio5gChannel: 44,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009022',
    deviceName: 'UNJANICLINICMABOPANE',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.17',
    wanIp: '41.76.109.57',
    egressIp: '41.76.109.57',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:51',
    uptimeSeconds: 950400,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009023',
    deviceName: 'UNJANICLINICATTERIDGEVILLE',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.18',
    wanIp: '41.76.109.58',
    egressIp: '41.76.109.58',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:52',
    uptimeSeconds: 1036800,
    radio2gChannel: 1,
    radio5gChannel: 36,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009024',
    deviceName: 'UNJANICLINICSOWETO',
    model: 'RAP62-OD',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.19',
    wanIp: '41.76.109.59',
    egressIp: '41.76.109.59',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:53',
    uptimeSeconds: 1123200,
    radio2gChannel: 11,
    radio5gChannel: 44,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009025',
    deviceName: 'UNJANICLINICDIEPSLOOT',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.20',
    wanIp: '41.76.109.60',
    egressIp: '41.76.109.60',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:54',
    uptimeSeconds: 1209600,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009026',
    deviceName: 'UNJANICLINICMAMELODI',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.21',
    wanIp: '41.76.109.61',
    egressIp: '41.76.109.61',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:55',
    uptimeSeconds: 1296000,
    radio2gChannel: 1,
    radio5gChannel: 36,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009027',
    deviceName: 'UNJANICLINICALEXANDRA',
    model: 'RAP2200(F)',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.22',
    wanIp: '41.76.109.62',
    egressIp: '41.76.109.62',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:56',
    uptimeSeconds: 1382400,
    radio2gChannel: 11,
    radio5gChannel: 44,
    projectId: 'unjani',
  },
  {
    sn: 'G1U9C80009028',
    deviceName: 'UNJANICLINICTEMBISA',
    model: 'RAP62-OD',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.23',
    wanIp: '41.76.109.63',
    egressIp: '41.76.109.63',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '11.1(6)B9P2',
    macAddress: 'A8:5A:F3:22:33:57',
    uptimeSeconds: 1468800,
    radio2gChannel: 6,
    radio5gChannel: 149,
    projectId: 'unjani',
  },

  // Unjani Switches (2 total)
  {
    sn: 'G1USWITCH0001',
    deviceName: 'UNJANI-SWITCH-01',
    model: 'RG-S2910-24GT4SFP-UP-H',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.1',
    wanIp: '41.76.109.1',
    egressIp: '41.76.109.1',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '12.5(1)B0602',
    macAddress: 'A8:5A:F3:00:00:01',
    uptimeSeconds: 2592000,
    radio2gChannel: 0,
    radio5gChannel: 0,
    projectId: 'unjani',
  },
  {
    sn: 'G1USWITCH0002',
    deviceName: 'UNJANI-SWITCH-02',
    model: 'RG-S2910-24GT4SFP-UP-H',
    groupId: 'unjani-001',
    groupName: 'Unjani',
    managementIp: '10.10.1.2',
    wanIp: '41.76.109.2',
    egressIp: '41.76.109.2',
    status: 'online',
    configStatus: 'Synced',
    firmwareVersion: '12.5(1)B0602',
    macAddress: 'A8:5A:F3:00:00:02',
    uptimeSeconds: 2592000,
    radio2gChannel: 0,
    radio5gChannel: 0,
    projectId: 'unjani',
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
    cpuUsage: isFailedDevice ? 85 : Math.floor(20 + rand(1) * 40),
    memoryUsage: isFailedDevice ? 92 : Math.floor(30 + rand(2) * 35),
    onlineClients: device.status === 'offline' ? 0 : Math.floor(rand(3) * 15),
    radio2gUtilization: device.status === 'offline' || device.radio2gChannel === 0
      ? 0
      : Math.floor(10 + rand(4) * 50),
    radio5gUtilization: device.status === 'offline' || device.radio5gChannel === 0
      ? 0
      : Math.floor(5 + rand(5) * 40),
    lastSeenAt: device.status === 'offline'
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
    tunnelId: `mock-${sn}-${Date.now()}`,
    deviceSn: sn,
    openDomainUrl: `https://tunnel-mock-${sn.toLowerCase()}.ruijie-dev.local`,
    openIpUrl: `http://192.168.250.2:8443`,
    expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours
  };
}

/**
 * Get mock devices for seeding database (same as getMockDevices)
 */
export function getMockDevicesForSeeding(): RuijieDevice[] {
  return getMockDevices();
}
