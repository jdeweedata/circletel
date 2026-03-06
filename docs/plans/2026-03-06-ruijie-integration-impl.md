# Ruijie Cloud API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Ruijie Cloud API for device monitoring, eWeb tunnels, and remote management in admin panel.

**Architecture:** Cache-first pattern - Inngest syncs devices every 5 mins to Supabase, API routes read from cache, only tunnel/reboot actions hit Ruijie API directly. Mock mode for development.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Inngest, TanStack Query, shadcn/ui

**Design Doc:** `docs/plans/2026-03-06-ruijie-integration-design.md`

---

## Phase 1: Database Schema

### Task 1: Create Supabase Migration

**Files:**
- Create: `supabase/migrations/20260306000001_ruijie_integration.sql`

**Step 1: Create migration file**

```sql
-- =============================================================================
-- RUIJIE CLOUD INTEGRATION SCHEMA
-- Migration: 20260306000001_ruijie_integration.sql
-- =============================================================================

-- Device cache (synced every 5 mins)
CREATE TABLE ruijie_device_cache (
  sn TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  model TEXT,
  group_id TEXT,
  group_name TEXT,
  management_ip TEXT,
  wan_ip TEXT,
  egress_ip TEXT,
  online_clients INT DEFAULT 0,
  status TEXT DEFAULT 'unknown',
  config_status TEXT,
  firmware_version TEXT,
  mac_address TEXT,
  cpu_usage INT,
  memory_usage INT,
  uptime_seconds BIGINT,
  radio_2g_channel INT,
  radio_5g_channel INT,
  radio_2g_utilization INT,
  radio_5g_utilization INT,
  project_id TEXT,
  last_seen_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_json JSONB,
  mock_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active eWeb tunnels
CREATE TABLE ruijie_tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn TEXT NOT NULL REFERENCES ruijie_device_cache(sn) ON DELETE CASCADE,
  tunnel_type TEXT DEFAULT 'eweb',
  tunnel_url TEXT,
  open_domain_url TEXT,
  open_ip_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES admin_users(id)
);

-- Sync history
CREATE TABLE ruijie_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  devices_fetched INT DEFAULT 0,
  devices_updated INT DEFAULT 0,
  devices_added INT DEFAULT 0,
  errors TEXT[],
  error_message TEXT,
  triggered_by TEXT DEFAULT 'cron',
  triggered_by_user_id UUID REFERENCES admin_users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

-- Audit log (immutable)
CREATE TABLE ruijie_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  device_sn TEXT,
  action TEXT NOT NULL,
  action_detail JSONB,
  ip_address TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ruijie_device_cache_status ON ruijie_device_cache(status);
CREATE INDEX idx_ruijie_device_cache_group ON ruijie_device_cache(group_name);
CREATE INDEX idx_ruijie_device_cache_model ON ruijie_device_cache(model);
CREATE INDEX idx_ruijie_device_cache_synced ON ruijie_device_cache(synced_at);
CREATE INDEX idx_ruijie_tunnels_sn_status ON ruijie_tunnels(device_sn, status);
CREATE INDEX idx_ruijie_tunnels_expires ON ruijie_tunnels(expires_at) WHERE status = 'active';
CREATE INDEX idx_ruijie_audit_log_device ON ruijie_audit_log(device_sn);
CREATE INDEX idx_ruijie_audit_log_admin ON ruijie_audit_log(admin_user_id);
CREATE INDEX idx_ruijie_audit_log_created ON ruijie_audit_log(created_at DESC);

-- updated_at trigger
CREATE TRIGGER update_ruijie_device_cache_updated_at
  BEFORE UPDATE ON ruijie_device_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE ruijie_device_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_tunnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read device cache" ON ruijie_device_cache
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin users can manage tunnels" ON ruijie_tunnels
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin users can read sync logs" ON ruijie_sync_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin users can read audit log" ON ruijie_audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin users can insert audit log" ON ruijie_audit_log
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );
```

**Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard

**Step 3: Commit**

```bash
git add supabase/migrations/20260306000001_ruijie_integration.sql
git commit -m "feat(db): add Ruijie integration schema"
```

---

## Phase 2: lib/ruijie Module

### Task 2: Create Types

**Files:**
- Create: `lib/ruijie/types.ts`

```typescript
/**
 * Ruijie Cloud API Types
 * Based on Ruijie Cloud API V2.0.3
 */

export interface RuijieDevice {
  sn: string;
  deviceName: string;
  model: string;
  groupId: string;
  groupName: string;
  managementIp: string;
  wanIp: string;
  egressIp: string;
  onlineClients: number;
  status: 'online' | 'offline' | 'unknown';
  configStatus: 'Synced' | 'Failed' | 'Pending';
  firmwareVersion: string;
  macAddress: string;
  cpuUsage: number;
  memoryUsage: number;
  uptimeSeconds: number;
  radio2gChannel: number;
  radio5gChannel: number;
  radio2gUtilization: number;
  radio5gUtilization: number;
  projectId: string;
  lastSeenAt: string;
}

export interface RuijieTunnel {
  tunnelId: string;
  deviceSn: string;
  openDomainUrl: string;
  openIpUrl: string;
  expiresAt: string;
}

export interface RuijieAuthResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface SyncResult {
  updated: number;
  added: number;
  errors: string[];
}

export interface RuijieAuditEntry {
  id: string;
  adminUserId: string;
  adminName?: string;
  deviceSn: string;
  action: 'reboot' | 'tunnel_create' | 'tunnel_close' | 'refresh';
  actionDetail: Record<string, unknown>;
  ipAddress: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

// Database row types (snake_case)
export interface RuijieDeviceCacheRow {
  sn: string;
  device_name: string;
  model: string | null;
  group_id: string | null;
  group_name: string | null;
  management_ip: string | null;
  wan_ip: string | null;
  egress_ip: string | null;
  online_clients: number;
  status: string;
  config_status: string | null;
  firmware_version: string | null;
  mac_address: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  project_id: string | null;
  last_seen_at: string | null;
  synced_at: string;
  raw_json: Record<string, unknown> | null;
  mock_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface RuijieTunnelRow {
  id: string;
  device_sn: string;
  tunnel_type: string;
  tunnel_url: string | null;
  open_domain_url: string | null;
  open_ip_url: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  created_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
}
```

**Step 2: Commit**

```bash
git add lib/ruijie/types.ts
git commit -m "feat(ruijie): add TypeScript types"
```

### Task 3: Create Auth Module

**Files:**
- Create: `lib/ruijie/auth.ts`

```typescript
/**
 * Ruijie Cloud API Authentication
 * OAuth2 token management with module-level cache
 */

import { RuijieAuthResponse } from './types';

const RUIJIE_BASE_URL = process.env.RUIJIE_BASE_URL || 'https://cloud.ruijienetworks.com/service/api';
const RUIJIE_APP_ID = process.env.RUIJIE_APP_ID || '';
const RUIJIE_SECRET = process.env.RUIJIE_SECRET || '';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

// Module-level cache (survives warm Vercel instances)
let tokenCache: TokenCache | null = null;

/**
 * Authenticate with Ruijie Cloud and get access token
 */
export async function authenticateRuijie(): Promise<RuijieAuthResponse> {
  if (!RUIJIE_APP_ID || !RUIJIE_SECRET) {
    throw new Error(
      'Ruijie credentials not configured. Set RUIJIE_APP_ID and RUIJIE_SECRET environment variables.'
    );
  }

  const response = await fetch(`${RUIJIE_BASE_URL}/maint/token/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      appId: RUIJIE_APP_ID,
      secret: RUIJIE_SECRET,
    }),
  });

  if (!response.ok) {
    clearRuijieAuth();
    const error = await response.text();
    throw new Error(
      `Ruijie auth failed: ${response.status} — check RUIJIE_APP_ID and RUIJIE_SECRET env vars. Details: ${error}`
    );
  }

  const data = await response.json();

  // Cache the token with 60s buffer before expiry
  tokenCache = {
    accessToken: data.access_token || data.accessToken,
    expiresAt: Date.now() + ((data.expires_in || data.expiresIn || 3600) * 1000) - 60000,
  };

  return {
    accessToken: tokenCache.accessToken,
    expiresIn: data.expires_in || data.expiresIn || 3600,
    tokenType: 'Bearer',
  };
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string> {
  // Return cached if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Token expired or not cached, re-authenticate
  const auth = await authenticateRuijie();
  return auth.accessToken;
}

/**
 * Clear cached token (for logout or error recovery)
 */
export function clearRuijieAuth(): void {
  tokenCache = null;
}

/**
 * Check if we have valid cached credentials
 */
export function hasRuijieAuth(): boolean {
  return tokenCache !== null && tokenCache.expiresAt > Date.now();
}
```

**Step 2: Commit**

```bash
git add lib/ruijie/auth.ts
git commit -m "feat(ruijie): add OAuth2 auth module"
```

### Task 4: Create Mock Data Generator

**Files:**
- Create: `lib/ruijie/mock.ts`

```typescript
/**
 * Ruijie Mock Data Generator
 * Realistic test data matching actual device fleet
 */

import { RuijieDevice, RuijieTunnel } from './types';

// Actual device data from screenshots
const MOCK_DEVICES_BASE: Omit<RuijieDevice, 'cpuUsage' | 'memoryUsage' | 'onlineClients' | 'radio2gUtilization' | 'radio5gUtilization' | 'lastSeenAt'>[] = [
  // Newgen Network (3 RAP2200F APs)
  { sn: 'G1U511Y076983', deviceName: 'AP_Downstairs', model: 'RAP2200(F)', groupId: 'newgen-001', groupName: 'Newgen Network', managementIp: '192.168.1.10', wanIp: '41.76.108.21', egressIp: '41.76.108.21', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:11:22:33', uptimeSeconds: 864000, radio2gChannel: 6, radio5gChannel: 149, projectId: 'newgen' },
  { sn: 'G1U511Y07910C', deviceName: 'Boardroom AP', model: 'RAP2200(F)', groupId: 'newgen-001', groupName: 'Newgen Network', managementIp: '192.168.1.11', wanIp: '41.76.108.21', egressIp: '41.76.108.21', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:11:22:34', uptimeSeconds: 864000, radio2gChannel: 1, radio5gChannel: 36, projectId: 'newgen' },
  { sn: 'G1U511Y079276', deviceName: 'AP_Upstairs', model: 'RAP2200(F)', groupId: 'newgen-001', groupName: 'Newgen Network', managementIp: '192.168.1.12', wanIp: '41.76.108.21', egressIp: '41.76.108.21', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:11:22:35', uptimeSeconds: 864000, radio2gChannel: 11, radio5gChannel: 44, projectId: 'newgen' },

  // Unjani (15 APs + 2 switches)
  { sn: 'G1U52HL044404', deviceName: 'UNJANISICELO', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.10', wanIp: '41.76.109.50', egressIp: '41.76.109.50', status: 'online', configStatus: 'Failed', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:44', uptimeSeconds: 432000, radio2gChannel: 6, radio5gChannel: 149, projectId: 'unjani' },
  { sn: 'G1U52HL044425', deviceName: 'UNJANICLINICSKYCITY', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.11', wanIp: '41.76.109.51', egressIp: '41.76.109.51', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:45', uptimeSeconds: 518400, radio2gChannel: 1, radio5gChannel: 36, projectId: 'unjani' },
  { sn: 'G1U52HL044450', deviceName: 'UNJANICOSMOCITY', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.12', wanIp: '41.76.109.52', egressIp: '41.76.109.52', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:46', uptimeSeconds: 604800, radio2gChannel: 11, radio5gChannel: 44, projectId: 'unjani' },
  { sn: 'G1U52HL044467', deviceName: 'UNJANICLINICTHOKOZA', model: 'RAP62-OD', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.13', wanIp: '41.76.109.53', egressIp: '41.76.109.53', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:47', uptimeSeconds: 691200, radio2gChannel: 6, radio5gChannel: 149, projectId: 'unjani' },
  { sn: 'G1U52HL044518', deviceName: 'UNJANIHEIDELBURG', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.14', wanIp: '41.76.109.54', egressIp: '41.76.109.54', status: 'offline', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:48', uptimeSeconds: 0, radio2gChannel: 0, radio5gChannel: 0, projectId: 'unjani' },
  { sn: 'G1U9C8000083B', deviceName: 'UNJANICLINICNOKANENG', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.15', wanIp: '41.76.109.55', egressIp: '41.76.109.55', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:49', uptimeSeconds: 777600, radio2gChannel: 1, radio5gChannel: 36, projectId: 'unjani' },
  { sn: 'G1U9C80009021', deviceName: 'UNJANICLINICJABULANI', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.16', wanIp: '41.76.109.56', egressIp: '41.76.109.56', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:50', uptimeSeconds: 864000, radio2gChannel: 11, radio5gChannel: 44, projectId: 'unjani' },
  // Additional Unjani devices
  { sn: 'G1U9C80009022', deviceName: 'UNJANICLINICMABOPANE', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.17', wanIp: '41.76.109.57', egressIp: '41.76.109.57', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:51', uptimeSeconds: 950400, radio2gChannel: 6, radio5gChannel: 149, projectId: 'unjani' },
  { sn: 'G1U9C80009023', deviceName: 'UNJANICLINICATTRIDGEVILLE', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.18', wanIp: '41.76.109.58', egressIp: '41.76.109.58', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:52', uptimeSeconds: 1036800, radio2gChannel: 1, radio5gChannel: 36, projectId: 'unjani' },
  { sn: 'G1U9C80009024', deviceName: 'UNJANICLINICSOWETO', model: 'RAP62-OD', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.19', wanIp: '41.76.109.59', egressIp: '41.76.109.59', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:53', uptimeSeconds: 1123200, radio2gChannel: 11, radio5gChannel: 44, projectId: 'unjani' },
  { sn: 'G1U9C80009025', deviceName: 'UNJANICLINICDIEPSLOOT', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.20', wanIp: '41.76.109.60', egressIp: '41.76.109.60', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:54', uptimeSeconds: 1209600, radio2gChannel: 6, radio5gChannel: 149, projectId: 'unjani' },
  { sn: 'G1U9C80009026', deviceName: 'UNJANICLINICMAMELODI', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.21', wanIp: '41.76.109.61', egressIp: '41.76.109.61', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:55', uptimeSeconds: 1296000, radio2gChannel: 1, radio5gChannel: 36, projectId: 'unjani' },
  { sn: 'G1U9C80009027', deviceName: 'UNJANICLINICALEXANDRA', model: 'RAP2200(F)', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.22', wanIp: '41.76.109.62', egressIp: '41.76.109.62', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:56', uptimeSeconds: 1382400, radio2gChannel: 11, radio5gChannel: 44, projectId: 'unjani' },
  { sn: 'G1U9C80009028', deviceName: 'UNJANICLINICTEMBISA', model: 'RAP62-OD', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.23', wanIp: '41.76.109.63', egressIp: '41.76.109.63', status: 'online', configStatus: 'Synced', firmwareVersion: '11.1(6)B9P2', macAddress: 'A8:5A:F3:22:33:57', uptimeSeconds: 1468800, radio2gChannel: 6, radio5gChannel: 149, projectId: 'unjani' },
  // Switches
  { sn: 'G1USWITCH0001', deviceName: 'UNJANI-SWITCH-01', model: 'RG-S2910-24GT4SFP-UP-H', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.1', wanIp: '41.76.109.1', egressIp: '41.76.109.1', status: 'online', configStatus: 'Synced', firmwareVersion: '12.5(1)B0602', macAddress: 'A8:5A:F3:00:00:01', uptimeSeconds: 2592000, radio2gChannel: 0, radio5gChannel: 0, projectId: 'unjani' },
  { sn: 'G1USWITCH0002', deviceName: 'UNJANI-SWITCH-02', model: 'RG-S2910-24GT4SFP-UP-H', groupId: 'unjani-001', groupName: 'Unjani', managementIp: '10.10.1.2', wanIp: '41.76.109.2', egressIp: '41.76.109.2', status: 'online', configStatus: 'Synced', firmwareVersion: '12.5(1)B0602', macAddress: 'A8:5A:F3:00:00:02', uptimeSeconds: 2592000, radio2gChannel: 0, radio5gChannel: 0, projectId: 'unjani' },
];

/**
 * Simple seeded random for deterministic variance
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Apply seeded variance to metrics (changes every 5 mins)
 */
function applySeededVariance(device: typeof MOCK_DEVICES_BASE[0], seed: number): RuijieDevice {
  const deviceSeed = seed + device.sn.charCodeAt(0);
  const rand = () => seededRandom(deviceSeed + Math.random() * 1000);

  // Stable fields for known failure device
  const isFailedDevice = device.sn === 'G1U52HL044404';

  // One device always stale for testing warning banner
  const isStaleDevice = device.sn === 'G1U52HL044518';
  const staleSyncedAt = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 mins ago

  return {
    ...device,
    cpuUsage: isFailedDevice ? 85 : Math.floor(20 + rand() * 40),
    memoryUsage: isFailedDevice ? 92 : Math.floor(30 + rand() * 35),
    onlineClients: device.status === 'offline' ? 0 : Math.floor(rand() * 15),
    radio2gUtilization: device.status === 'offline' ? 0 : Math.floor(10 + rand() * 50),
    radio5gUtilization: device.status === 'offline' ? 0 : Math.floor(5 + rand() * 40),
    lastSeenAt: device.status === 'offline'
      ? new Date(Date.now() - 3600000).toISOString()
      : isStaleDevice
        ? staleSyncedAt
        : new Date().toISOString(),
  };
}

/**
 * Get all mock devices with seeded variance
 */
export function getMockDevices(): RuijieDevice[] {
  const seed = Math.floor(Date.now() / 300000); // Changes every 5 mins
  return MOCK_DEVICES_BASE.map(d => applySeededVariance(d, seed));
}

/**
 * Get single mock device
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
 * Get mock devices for seeding database
 */
export function getMockDevicesForSeeding(): RuijieDevice[] {
  return getMockDevices();
}
```

**Step 2: Commit**

```bash
git add lib/ruijie/mock.ts
git commit -m "feat(ruijie): add mock data generator with 20 devices"
```

### Task 5: Create API Client

**Files:**
- Create: `lib/ruijie/client.ts`

```typescript
/**
 * Ruijie Cloud API Client
 * Wraps all API calls with mock mode support
 */

import { getAccessToken } from './auth';
import { getMockDevices, getMockDevice, createMockTunnel } from './mock';
import { RuijieDevice, RuijieTunnel } from './types';

const RUIJIE_BASE_URL = process.env.RUIJIE_BASE_URL || 'https://cloud.ruijienetworks.com/service/api';
const MOCK_MODE = process.env.RUIJIE_MOCK_MODE === 'true';

/**
 * Make authenticated API request to Ruijie Cloud
 * Note: Ruijie uses access_token as query param, NOT Bearer header
 */
async function ruijieFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  // Ruijie API uses query param for auth, not header
  const url = new URL(`${RUIJIE_BASE_URL}${endpoint}`);
  url.searchParams.set('access_token', token);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ruijie API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// =============================================================================
// DEVICE OPERATIONS
// =============================================================================

/**
 * Get all devices from Ruijie Cloud
 */
export async function getAllDevices(): Promise<RuijieDevice[]> {
  if (MOCK_MODE) {
    return getMockDevices();
  }

  // Real API call - adjust endpoint based on actual V2.0.3 docs
  const response = await ruijieFetch<{ data: RuijieDevice[] }>('/device/list');
  return response.data || [];
}

/**
 * Get single device by serial number
 */
export async function getDevice(sn: string): Promise<RuijieDevice> {
  if (MOCK_MODE) {
    return getMockDevice(sn);
  }

  const response = await ruijieFetch<{ data: RuijieDevice }>(`/device/${sn}`);
  return response.data;
}

// =============================================================================
// TUNNEL OPERATIONS
// =============================================================================

/**
 * Create eWeb tunnel for device
 */
export async function createTunnel(
  sn: string,
  type: 'eweb' | 'ssh' | 'webcli' = 'eweb'
): Promise<RuijieTunnel> {
  if (MOCK_MODE) {
    return createMockTunnel(sn, type);
  }

  const response = await ruijieFetch<{ data: RuijieTunnel }>('/tunnel/create', {
    method: 'POST',
    body: JSON.stringify({ sn, type }),
  });
  return response.data;
}

/**
 * Delete/close tunnel for device
 */
export async function deleteTunnel(sn: string): Promise<void> {
  if (MOCK_MODE) {
    return; // No-op in mock mode
  }

  await ruijieFetch(`/tunnel/${sn}`, { method: 'DELETE' });
}

// =============================================================================
// DEVICE CONTROL
// =============================================================================

/**
 * Reboot device remotely
 */
export async function rebootDevice(sn: string): Promise<{ success: boolean }> {
  if (MOCK_MODE) {
    // Simulate slight delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  const response = await ruijieFetch<{ success: boolean }>(`/device/${sn}/reboot`, {
    method: 'POST',
  });
  return response;
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return MOCK_MODE;
}
```

**Step 2: Commit**

```bash
git add lib/ruijie/client.ts
git commit -m "feat(ruijie): add API client with mock mode switch"
```

### Task 6: Create Sync Service

**Files:**
- Create: `lib/ruijie/sync-service.ts`

```typescript
/**
 * Ruijie Sync Service
 * Database helpers for Inngest sync operations
 */

import { createClient } from '@/lib/supabase/server';
import { RuijieDevice, SyncResult, RuijieDeviceCacheRow } from './types';
import { getMockDevicesForSeeding } from './mock';

/**
 * Convert API device to database row format
 */
function deviceToRow(device: RuijieDevice, mockData: boolean = false): Omit<RuijieDeviceCacheRow, 'created_at' | 'updated_at'> {
  return {
    sn: device.sn,
    device_name: device.deviceName,
    model: device.model,
    group_id: device.groupId,
    group_name: device.groupName,
    management_ip: device.managementIp,
    wan_ip: device.wanIp,
    egress_ip: device.egressIp,
    online_clients: device.onlineClients,
    status: device.status,
    config_status: device.configStatus,
    firmware_version: device.firmwareVersion,
    mac_address: device.macAddress,
    cpu_usage: device.cpuUsage,
    memory_usage: device.memoryUsage,
    uptime_seconds: device.uptimeSeconds,
    radio_2g_channel: device.radio2gChannel,
    radio_5g_channel: device.radio5gChannel,
    radio_2g_utilization: device.radio2gUtilization,
    radio_5g_utilization: device.radio5gUtilization,
    project_id: device.projectId,
    last_seen_at: device.lastSeenAt,
    synced_at: new Date().toISOString(),
    raw_json: device as unknown as Record<string, unknown>,
    mock_data: mockData,
  };
}

/**
 * Bulk upsert devices to cache
 */
export async function upsertDevices(
  devices: RuijieDevice[],
  mockData: boolean = false
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { updated: 0, added: 0, errors: [] };

  // Get existing SNs to determine added vs updated
  const { data: existing } = await supabase
    .from('ruijie_device_cache')
    .select('sn');

  const existingSnSet = new Set(existing?.map(e => e.sn) || []);

  // Convert to rows
  const rows = devices.map(d => deviceToRow(d, mockData));

  // Upsert all at once
  const { error } = await supabase
    .from('ruijie_device_cache')
    .upsert(rows, { onConflict: 'sn' });

  if (error) {
    result.errors.push(`Upsert failed: ${error.message}`);
    return result;
  }

  // Count added vs updated
  for (const device of devices) {
    if (existingSnSet.has(device.sn)) {
      result.updated++;
    } else {
      result.added++;
    }
  }

  return result;
}

/**
 * Log sync run to ruijie_sync_logs
 */
export async function logSyncRun(
  result: SyncResult & { devicesFetched: number; durationMs: number },
  triggeredBy: 'cron' | 'manual',
  triggeredByUserId?: string,
  syncLogId?: string
): Promise<string> {
  const supabase = await createClient();

  const logEntry = {
    status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
    devices_fetched: result.devicesFetched,
    devices_updated: result.updated,
    devices_added: result.added,
    errors: result.errors.length > 0 ? result.errors : null,
    error_message: result.errors.length > 0 ? result.errors.slice(0, 3).join('; ') : null,
    triggered_by: triggeredBy,
    triggered_by_user_id: triggeredByUserId || null,
    completed_at: new Date().toISOString(),
    duration_ms: result.durationMs,
  };

  if (syncLogId) {
    // Update existing log
    await supabase
      .from('ruijie_sync_logs')
      .update(logEntry)
      .eq('id', syncLogId);
    return syncLogId;
  }

  // Create new log
  const { data, error } = await supabase
    .from('ruijie_sync_logs')
    .insert({ ...logEntry, started_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) {
    console.error('[RuijieSync] Failed to log sync run:', error);
    return '';
  }

  return data?.id || '';
}

/**
 * Create initial sync log entry
 */
export async function createSyncLog(
  triggeredBy: 'cron' | 'manual',
  triggeredByUserId?: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ruijie_sync_logs')
    .insert({
      status: 'running',
      triggered_by: triggeredBy,
      triggered_by_user_id: triggeredByUserId || null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[RuijieSync] Failed to create sync log:', error);
    return '';
  }

  return data?.id || '';
}

/**
 * Get count of active tunnels (for 10-tunnel limit guard)
 */
export async function getActiveTunnelCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('ruijie_tunnels')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[RuijieSync] Failed to count active tunnels:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark expired tunnels as 'expired'
 */
export async function expireStaleTunnels(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ruijie_tunnels')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('[RuijieSync] Failed to expire stale tunnels:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Seed mock data on first run (when cache is empty)
 */
export async function seedMockData(): Promise<boolean> {
  const supabase = await createClient();

  // Check if cache is empty
  const { count } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('[RuijieSync] Cache not empty, skipping mock seed');
    return false;
  }

  // Seed with mock data
  const mockDevices = getMockDevicesForSeeding();
  const result = await upsertDevices(mockDevices, true);

  console.log(`[RuijieSync] Seeded ${result.added} mock devices`);
  return true;
}

/**
 * Check if cache is empty
 */
export async function isCacheEmpty(): Promise<boolean> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  return !count || count === 0;
}
```

**Step 2: Commit**

```bash
git add lib/ruijie/sync-service.ts
git commit -m "feat(ruijie): add sync service with DB helpers"
```

### Task 7: Create Index File

**Files:**
- Create: `lib/ruijie/index.ts`

```typescript
/**
 * Ruijie Cloud API Integration
 * @module lib/ruijie
 */

// Types
export * from './types';

// Auth
export { getAccessToken, clearRuijieAuth, hasRuijieAuth } from './auth';

// Client
export {
  getAllDevices,
  getDevice,
  createTunnel,
  deleteTunnel,
  rebootDevice,
  isMockMode,
} from './client';

// Sync Service
export {
  upsertDevices,
  logSyncRun,
  createSyncLog,
  getActiveTunnelCount,
  expireStaleTunnels,
  seedMockData,
  isCacheEmpty,
} from './sync-service';

// Mock (for testing)
export { getMockDevices, getMockDevice, createMockTunnel } from './mock';
```

**Step 2: Commit**

```bash
git add lib/ruijie/index.ts
git commit -m "feat(ruijie): add barrel export"
```

---

## Phase 3: Inngest Functions

### Task 8: Create Ruijie Sync Function

**Files:**
- Create: `lib/inngest/functions/ruijie-sync.ts`

```typescript
/**
 * Ruijie Device Sync Inngest Function
 *
 * Syncs device data from Ruijie Cloud API to ruijie_device_cache table with:
 * - Automatic retries on failure (3 attempts)
 * - Step-based execution for reliability
 * - Dual triggers: scheduled cron and manual event
 * - Progress tracking via ruijie_sync_logs table
 *
 * Schedule: Every 5 minutes
 */

import { inngest } from '../client';
import {
  getAllDevices,
  upsertDevices,
  createSyncLog,
  logSyncRun,
  seedMockData,
  isCacheEmpty,
  isMockMode,
} from '@/lib/ruijie';

export const ruijieSyncFunction = inngest.createFunction(
  {
    id: 'ruijie-sync',
    name: 'Ruijie Device Sync',
    retries: 3,
    cancelOn: [
      {
        event: 'ruijie/sync.cancelled',
        match: 'data.sync_log_id',
      },
    ],
  },
  [
    { cron: '*/5 * * * *' },
    { event: 'ruijie/sync.requested' },
  ],
  async ({ event, step }) => {
    const startTime = Date.now();
    const eventData = event?.data as {
      sync_log_id?: string;
      triggered_by?: 'cron' | 'manual';
      admin_user_id?: string;
    } | undefined;

    const triggeredBy = eventData?.triggered_by ?? 'cron';
    const adminUserId = eventData?.admin_user_id;

    // Step 1: Create sync log
    const syncLogId = await step.run('create-sync-log', async () => {
      if (eventData?.sync_log_id) {
        return eventData.sync_log_id;
      }
      return await createSyncLog(triggeredBy, adminUserId);
    });

    // Step 2: Check if mock mode needs seeding
    if (isMockMode()) {
      await step.run('check-mock-seed', async () => {
        const empty = await isCacheEmpty();
        if (empty) {
          console.log('[RuijieSync] Mock mode, cache empty, seeding...');
          await seedMockData();
        }
      });
    }

    // Step 3: Fetch devices
    const devices = await step.run('fetch-devices', async () => {
      console.log('[RuijieSync] Fetching devices...');
      const result = await getAllDevices();
      console.log(`[RuijieSync] Fetched ${result.length} devices`);
      return result;
    });

    // Step 4: Upsert devices
    const syncResult = await step.run('upsert-devices', async () => {
      console.log('[RuijieSync] Upserting devices to cache...');
      const result = await upsertDevices(devices, isMockMode());
      console.log(`[RuijieSync] Upserted: ${result.added} added, ${result.updated} updated`);
      return result;
    });

    // Step 5: Update sync log
    const duration = Date.now() - startTime;
    await step.run('update-sync-log', async () => {
      await logSyncRun(
        {
          ...syncResult,
          devicesFetched: devices.length,
          durationMs: duration,
        },
        triggeredBy,
        adminUserId,
        syncLogId
      );
    });

    // Step 6: Send completion event
    await step.run('send-completion-event', async () => {
      await inngest.send({
        name: 'ruijie/sync.completed',
        data: {
          sync_log_id: syncLogId,
          devices_fetched: devices.length,
          added: syncResult.added,
          updated: syncResult.updated,
          errors: syncResult.errors.length,
          duration_ms: duration,
        },
      });
    });

    return {
      success: syncResult.errors.length === 0,
      syncLogId,
      devicesFetched: devices.length,
      added: syncResult.added,
      updated: syncResult.updated,
      errors: syncResult.errors.length,
      duration,
    };
  }
);

/**
 * Handle sync completion
 */
export const ruijieSyncCompletedFunction = inngest.createFunction(
  {
    id: 'ruijie-sync-completed',
    name: 'Ruijie Sync Completed Handler',
  },
  { event: 'ruijie/sync.completed' },
  async ({ event, step }) => {
    const { sync_log_id, devices_fetched, added, updated, errors, duration_ms } = event.data;

    await step.run('log-completion', async () => {
      console.log(
        `[RuijieSync] Sync ${sync_log_id} completed: ` +
        `${devices_fetched} fetched, ${added} added, ${updated} updated, ${errors} errors (${duration_ms}ms)`
      );
    });

    return { logged: true };
  }
);
```

**Step 2: Commit**

```bash
git add lib/inngest/functions/ruijie-sync.ts
git commit -m "feat(inngest): add Ruijie sync function"
```

### Task 9: Create Tunnel Cleanup Function

**Files:**
- Create: `lib/inngest/functions/ruijie-tunnel-cleanup.ts`

```typescript
/**
 * Ruijie Tunnel Cleanup Inngest Function
 *
 * Marks expired tunnels as 'expired' to keep slot count accurate.
 * Handles cases where admin closes browser without clicking Disconnect.
 *
 * Schedule: Every 15 minutes
 */

import { inngest } from '../client';
import { expireStaleTunnels } from '@/lib/ruijie';

export const ruijieTunnelCleanupFunction = inngest.createFunction(
  {
    id: 'ruijie-tunnel-cleanup',
    name: 'Ruijie Tunnel Cleanup',
    retries: 2,
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const expiredCount = await step.run('expire-stale-tunnels', async () => {
      const count = await expireStaleTunnels();
      if (count > 0) {
        console.log(`[RuijieTunnelCleanup] Expired ${count} stale tunnels`);
      }
      return count;
    });

    return { expiredCount };
  }
);
```

**Step 2: Commit**

```bash
git add lib/inngest/functions/ruijie-tunnel-cleanup.ts
git commit -m "feat(inngest): add tunnel cleanup function"
```

### Task 10: Register Inngest Functions

**Files:**
- Modify: `lib/inngest/index.ts`

**Step 1: Read current file**

Run: Read lib/inngest/index.ts

**Step 2: Add imports and exports**

Add to imports:
```typescript
import { ruijieSyncFunction, ruijieSyncCompletedFunction } from './functions/ruijie-sync';
import { ruijieTunnelCleanupFunction } from './functions/ruijie-tunnel-cleanup';
```

Add to exports array:
```typescript
ruijieSyncFunction,
ruijieSyncCompletedFunction,
ruijieTunnelCleanupFunction,
```

**Step 3: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "feat(inngest): register Ruijie functions"
```

---

## Phase 4: API Routes

### Task 11: Create Device List API

**Files:**
- Create: `app/api/ruijie/devices/route.ts`

```typescript
/**
 * Ruijie Devices API
 * GET /api/ruijie/devices - List devices from cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const group = searchParams.get('group') || '';
    const model = searchParams.get('model') || '';

    // Build query
    let query = supabase
      .from('ruijie_device_cache')
      .select('*')
      .order('status', { ascending: true })
      .order('device_name', { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(
        `sn.ilike.%${search}%,device_name.ilike.%${search}%,management_ip.ilike.%${search}%`
      );
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (group) {
      query = query.eq('group_name', group);
    }
    if (model) {
      query = query.eq('model', model);
    }

    const { data: devices, error } = await query;

    if (error) {
      apiLogger.error('Failed to fetch devices', { error });
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
    }

    // Get last sync time
    const { data: lastSync } = await supabase
      .from('ruijie_sync_logs')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Get unique groups and models for filter dropdowns
    const groups = [...new Set(devices?.map(d => d.group_name).filter(Boolean))];
    const models = [...new Set(devices?.map(d => d.model).filter(Boolean))];

    return NextResponse.json({
      devices: devices || [],
      total: devices?.length || 0,
      lastSynced: lastSync?.completed_at || null,
      filters: { groups, models },
    });

  } catch (error) {
    apiLogger.error('Ruijie devices API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/devices/route.ts
git commit -m "feat(api): add GET /api/ruijie/devices"
```

### Task 12: Create Device Detail API

**Files:**
- Create: `app/api/ruijie/devices/[sn]/route.ts`

```typescript
/**
 * Ruijie Device Detail API
 * GET /api/ruijie/devices/[sn] - Get device detail from cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get device
    const { data: device, error } = await supabase
      .from('ruijie_device_cache')
      .select('*')
      .eq('sn', sn)
      .single();

    if (error || !device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Get active tunnels for this device
    const { data: tunnels } = await supabase
      .from('ruijie_tunnels')
      .select('*')
      .eq('device_sn', sn)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    return NextResponse.json({
      device,
      tunnels: tunnels || [],
    });

  } catch (error) {
    apiLogger.error('Ruijie device detail API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/devices/\[sn\]/route.ts
git commit -m "feat(api): add GET /api/ruijie/devices/[sn]"
```

### Task 13: Create Tunnel API

**Files:**
- Create: `app/api/ruijie/tunnel/route.ts`

```typescript
/**
 * Ruijie Tunnel API
 * POST /api/ruijie/tunnel - Create tunnel with limit guard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { createTunnel, getActiveTunnelCount } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

const TUNNEL_LIMIT = 10;
const TUNNEL_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, full_name')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { sn, tunnelType = 'eweb' } = body;

    if (!sn) {
      return NextResponse.json({ error: 'Device SN required' }, { status: 400 });
    }

    // Guard 1: Check tunnel limit
    const activeCount = await getActiveTunnelCount();
    if (activeCount >= TUNNEL_LIMIT) {
      return NextResponse.json(
        { error: 'Tunnel limit reached', active: activeCount, max: TUNNEL_LIMIT },
        { status: 429 }
      );
    }

    // Guard 2: Check for existing active tunnel for this device (reuse)
    const { data: existingTunnel } = await supabase
      .from('ruijie_tunnels')
      .select('*')
      .eq('device_sn', sn)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingTunnel) {
      return NextResponse.json({
        tunnel: {
          tunnelId: existingTunnel.id,
          deviceSn: existingTunnel.device_sn,
          openDomainUrl: existingTunnel.open_domain_url,
          openIpUrl: existingTunnel.open_ip_url,
          expiresAt: existingTunnel.expires_at,
        },
        reused: true,
        active: activeCount,
        max: TUNNEL_LIMIT,
      });
    }

    // Create new tunnel via Ruijie API
    const tunnel = await createTunnel(sn, tunnelType as 'eweb' | 'ssh' | 'webcli');

    // Store in database
    const expiresAt = new Date(Date.now() + TUNNEL_DURATION_MS).toISOString();
    const { data: dbTunnel, error: insertError } = await supabase
      .from('ruijie_tunnels')
      .insert({
        device_sn: sn,
        tunnel_type: tunnelType,
        tunnel_url: tunnel.openDomainUrl,
        open_domain_url: tunnel.openDomainUrl,
        open_ip_url: tunnel.openIpUrl,
        status: 'active',
        expires_at: tunnel.expiresAt || expiresAt,
        created_by: adminUser.id,
      })
      .select()
      .single();

    if (insertError) {
      apiLogger.error('Failed to store tunnel', { error: insertError });
    }

    // Audit log
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: sn,
      action: 'tunnel_create',
      action_detail: { tunnelType, tunnelId: dbTunnel?.id },
      ip_address: clientIp,
      status: 'success',
    });

    return NextResponse.json({
      tunnel: {
        tunnelId: dbTunnel?.id || tunnel.tunnelId,
        deviceSn: sn,
        openDomainUrl: tunnel.openDomainUrl,
        openIpUrl: tunnel.openIpUrl,
        expiresAt: tunnel.expiresAt || expiresAt,
      },
      reused: false,
      active: activeCount + 1,
      max: TUNNEL_LIMIT,
    });

  } catch (error) {
    apiLogger.error('Ruijie tunnel create API error', { error });
    return NextResponse.json({ error: 'Failed to create tunnel' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/tunnel/route.ts
git commit -m "feat(api): add POST /api/ruijie/tunnel with limit guard"
```

### Task 14: Create Tunnel Delete API

**Files:**
- Create: `app/api/ruijie/tunnel/[sn]/route.ts`

```typescript
/**
 * Ruijie Tunnel Delete API
 * DELETE /api/ruijie/tunnel/[sn] - Close tunnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { deleteTunnel } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Close tunnel via Ruijie API
    await deleteTunnel(sn);

    // Update database
    const { error: updateError } = await supabase
      .from('ruijie_tunnels')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closed_by: adminUser.id,
      })
      .eq('device_sn', sn)
      .eq('status', 'active');

    if (updateError) {
      apiLogger.error('Failed to update tunnel status', { error: updateError });
    }

    // Audit log
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    await supabase.from('ruijie_audit_log').insert({
      admin_user_id: adminUser.id,
      device_sn: sn,
      action: 'tunnel_close',
      action_detail: {},
      ip_address: clientIp,
      status: 'success',
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    apiLogger.error('Ruijie tunnel delete API error', { error });
    return NextResponse.json({ error: 'Failed to close tunnel' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/tunnel/\[sn\]/route.ts
git commit -m "feat(api): add DELETE /api/ruijie/tunnel/[sn]"
```

### Task 15: Create Sync Trigger API

**Files:**
- Create: `app/api/ruijie/sync/route.ts`

```typescript
/**
 * Ruijie Sync Trigger API
 * POST /api/ruijie/sync - Trigger manual sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { inngest } from '@/lib/inngest/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Send Inngest event
    await inngest.send({
      name: 'ruijie/sync.requested',
      data: {
        triggered_by: 'manual',
        admin_user_id: adminUser.id,
      },
    });

    return NextResponse.json({
      status: 'queued',
      message: 'Sync triggered successfully',
    });

  } catch (error) {
    apiLogger.error('Ruijie sync trigger API error', { error });
    return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/sync/route.ts
git commit -m "feat(api): add POST /api/ruijie/sync"
```

### Task 16: Create Reboot API

**Files:**
- Create: `app/api/ruijie/reboot/[sn]/route.ts`

```typescript
/**
 * Ruijie Reboot API
 * POST /api/ruijie/reboot/[sn] - Reboot device
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';
import { rebootDevice } from '@/lib/ruijie';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get device info for audit
    const { data: device } = await supabase
      .from('ruijie_device_cache')
      .select('device_name, model')
      .eq('sn', sn)
      .single();

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    try {
      // Reboot via Ruijie API
      const result = await rebootDevice(sn);

      // Audit log - success
      await supabase.from('ruijie_audit_log').insert({
        admin_user_id: adminUser.id,
        device_sn: sn,
        action: 'reboot',
        action_detail: { deviceName: device?.device_name, model: device?.model },
        ip_address: clientIp,
        status: 'success',
      });

      return NextResponse.json({ success: result.success });

    } catch (rebootError) {
      // Audit log - failure
      await supabase.from('ruijie_audit_log').insert({
        admin_user_id: adminUser.id,
        device_sn: sn,
        action: 'reboot',
        action_detail: { deviceName: device?.device_name, model: device?.model },
        ip_address: clientIp,
        status: 'failed',
        error_message: rebootError instanceof Error ? rebootError.message : 'Unknown error',
      });

      throw rebootError;
    }

  } catch (error) {
    apiLogger.error('Ruijie reboot API error', { error });
    return NextResponse.json({ error: 'Failed to reboot device' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/reboot/\[sn\]/route.ts
git commit -m "feat(api): add POST /api/ruijie/reboot/[sn]"
```

### Task 17: Create Audit Log API

**Files:**
- Create: `app/api/ruijie/audit/[sn]/route.ts`

```typescript
/**
 * Ruijie Audit Log API
 * GET /api/ruijie/audit/[sn] - Get device action history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sn: string }> }
) {
  try {
    const { sn } = await context.params;
    const supabase = await createClient();

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get audit log entries with admin name
    const { data: actions, error } = await supabase
      .from('ruijie_audit_log')
      .select(`
        id,
        admin_user_id,
        device_sn,
        action,
        action_detail,
        ip_address,
        status,
        error_message,
        created_at,
        admin_users (full_name)
      `)
      .eq('device_sn', sn)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      apiLogger.error('Failed to fetch audit log', { error });
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
    }

    // Format response
    const formattedActions = (actions || []).map(a => ({
      id: a.id,
      adminUserId: a.admin_user_id,
      adminName: Array.isArray(a.admin_users)
        ? a.admin_users[0]?.full_name
        : (a.admin_users as { full_name?: string } | null)?.full_name || 'Unknown',
      deviceSn: a.device_sn,
      action: a.action,
      actionDetail: a.action_detail,
      ipAddress: a.ip_address,
      status: a.status,
      errorMessage: a.error_message,
      createdAt: a.created_at,
    }));

    return NextResponse.json({ actions: formattedActions });

  } catch (error) {
    apiLogger.error('Ruijie audit log API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ruijie/audit/\[sn\]/route.ts
git commit -m "feat(api): add GET /api/ruijie/audit/[sn]"
```

---

## Phase 5: Admin UI

### Task 18: Update Sidebar Navigation

**Files:**
- Modify: `components/admin/layout/Sidebar.tsx`

**Step 1: Read current file around line 223-245 (Network section)**

**Step 2: Add Devices nav item after Diagnostics**

Find the Network section items array and add:
```typescript
{
  name: 'Devices',
  href: '/admin/network/devices',
  icon: PiWifiBold,
  description: 'Ruijie Cloud device management'
}
```

**Step 3: Add PiWifiBold to imports**

**Step 4: Commit**

```bash
git add components/admin/layout/Sidebar.tsx
git commit -m "feat(ui): add Devices to Network sidebar section"
```

### Task 19: Create Device List Page

**Files:**
- Create: `app/admin/network/devices/page.tsx`

See design doc for full component spec. Key elements:
- Table with Status | Device Name | Model | SN | Group | Mgmt IP | Clients | Last Synced | Actions
- Filters: search, status, group, model (URL params)
- Bulk actions: Refresh, Export CSV
- Row actions: View, Launch eWeb, Reboot, Copy SN
- Header: "Last synced X mins ago" + stale warning
- Footer: device count + tunnel slots (x/10)

**Step 2: Commit**

```bash
git add app/admin/network/devices/page.tsx
git commit -m "feat(ui): add /admin/network/devices list page"
```

### Task 20: Create Device Detail Page

**Files:**
- Create: `app/admin/network/devices/[sn]/page.tsx`

See design doc for full component spec. Key elements:
- Device info card
- Metrics section with gauges
- eWeb tunnel launcher with countdown
- Audit log section
- Reboot action with confirm dialog

**Step 2: Commit**

```bash
git add app/admin/network/devices/\[sn\]/page.tsx
git commit -m "feat(ui): add /admin/network/devices/[sn] detail page"
```

---

## Phase 6: Environment & Finalization

### Task 21: Update .env.example

**Files:**
- Modify: `.env.example`

**Step 1: Add Ruijie env vars**

```env
# Ruijie Cloud API
RUIJIE_APP_ID=
RUIJIE_SECRET=
RUIJIE_BASE_URL=https://cloud.ruijienetworks.com/service/api
RUIJIE_MOCK_MODE=true
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add Ruijie env vars to .env.example"
```

### Task 22: Generate TypeScript Types

**Files:**
- Modify: `lib/supabase/database.types.ts`

**Step 1: Run type generation**

```bash
npx supabase gen types typescript --project-id agyjovdugmtopasyvlng > lib/supabase/database.types.ts
```

**Step 2: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore: regenerate Supabase types for Ruijie tables"
```

### Task 23: Type Check & Build Test

**Step 1: Run type check**

```bash
npm run type-check:memory
```

**Step 2: Fix any type errors**

**Step 3: Run build**

```bash
npm run build:memory
```

**Step 4: Commit any fixes**

---

## Summary

**23 tasks total across 6 phases:**

1. **Database** (1 task): Migration with 4 tables, indexes, RLS
2. **lib/ruijie** (6 tasks): Types, auth, mock, client, sync-service, index
3. **Inngest** (3 tasks): Sync function, tunnel cleanup, register
4. **API Routes** (7 tasks): Devices, tunnel, sync, reboot, audit
5. **Admin UI** (3 tasks): Sidebar, list page, detail page
6. **Finalization** (3 tasks): Env vars, types, build test

**Estimated time:** 4-6 hours with mock mode for immediate testing.
