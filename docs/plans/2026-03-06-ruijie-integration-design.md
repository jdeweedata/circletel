# Ruijie Cloud API Integration Design

**Date:** 2026-03-06
**Status:** Approved
**Author:** Claude Code + Human Review

## Overview

Integrate Ruijie Cloud API (V2.0.3) into CircleTel admin panel for managing WiFi access points and switches. Provides device monitoring, eWeb tunnel management, and remote reboot capabilities.

**Scope:** 20 devices (18 APs + 2 switches) across 2 groups (Newgen Network, Unjani)

## Architecture

```
Admin Panel
  /admin/network/devices (list) <-> /admin/network/devices/[sn] (detail)
                    |
                    v
Next.js API Routes (cache-first reads)
  /api/ruijie/devices      - List/search from Supabase
  /api/ruijie/devices/[sn] - Detail from Supabase
  /api/ruijie/tunnel       - Create tunnel (Ruijie API + DB)
  /api/ruijie/tunnel/[sn]  - Close tunnel (Ruijie API + DB)
  /api/ruijie/sync         - Manual refresh trigger
  /api/ruijie/reboot/[sn]  - Reboot device (Ruijie API + audit)
  /api/ruijie/audit/[sn]   - Get device action history
                    |
        +-----------+-----------+
        v                       v
Supabase Cache              lib/ruijie/
  ruijie_device_cache         auth.ts - OAuth2 token mgmt
  ruijie_tunnels              client.ts - API wrapper
  ruijie_sync_logs            mock.ts - Mock data generator
  ruijie_audit_log            sync-service.ts - DB helpers
        ^                       |
        |                       |
        +-----------+-----------+
                    v
Inngest (Background Jobs)
  ruijie-sync - cron */5 * * * * - fetch all -> upsert cache
  ruijie-sync-completed - log results, alert on errors
  ruijie-tunnel-cleanup - cron */15 * * * * - expire stale tunnels
                    |
                    v
+-------------------+-------------------+
| RUIJIE_MOCK_MODE=true                 | RUIJIE_MOCK_MODE=false        |
| mock.ts generates -> Supabase         | Ruijie Cloud -> Supabase      |
+-------------------+-------------------+
```

**Key principle:** API routes read from Supabase cache. Only Inngest sync and explicit actions (tunnel, reboot) call the external Ruijie API.

## Database Schema

### ruijie_device_cache
Synced every 5 mins from Ruijie Cloud API.

```sql
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
  status TEXT DEFAULT 'unknown',        -- 'online' | 'offline' | 'unknown'
  config_status TEXT,                   -- 'Synced' | 'Failed' | 'Pending'
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
```

### ruijie_tunnels
Active eWeb tunnels (10 max per tenant, 3-hour expiry).

```sql
CREATE TABLE ruijie_tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn TEXT NOT NULL REFERENCES ruijie_device_cache(sn) ON DELETE CASCADE,
  tunnel_type TEXT DEFAULT 'eweb',      -- 'eweb' | 'ssh' | 'webcli'
  tunnel_url TEXT,
  open_domain_url TEXT,
  open_ip_url TEXT,
  status TEXT DEFAULT 'active',         -- 'active' | 'expired' | 'closed'
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES admin_users(id)
);
```

### ruijie_sync_logs
Sync history (mirrors tarana_sync_logs pattern).

```sql
CREATE TABLE ruijie_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,                 -- 'running' | 'completed' | 'failed'
  devices_fetched INT DEFAULT 0,
  devices_updated INT DEFAULT 0,
  devices_added INT DEFAULT 0,
  errors TEXT[],
  error_message TEXT,
  triggered_by TEXT DEFAULT 'cron',     -- 'cron' | 'manual'
  triggered_by_user_id UUID REFERENCES admin_users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);
```

### ruijie_audit_log
Immutable audit log for device actions.

```sql
CREATE TABLE ruijie_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  device_sn TEXT,
  action TEXT NOT NULL,                 -- 'reboot' | 'tunnel_create' | 'tunnel_close' | 'refresh'
  action_detail JSONB,
  ip_address TEXT,
  status TEXT DEFAULT 'success',        -- 'success' | 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_ruijie_device_cache_status ON ruijie_device_cache(status);
CREATE INDEX idx_ruijie_device_cache_group ON ruijie_device_cache(group_name);
CREATE INDEX idx_ruijie_device_cache_model ON ruijie_device_cache(model);
CREATE INDEX idx_ruijie_device_cache_synced ON ruijie_device_cache(synced_at);
CREATE INDEX idx_ruijie_tunnels_sn_status ON ruijie_tunnels(device_sn, status);
CREATE INDEX idx_ruijie_tunnels_expires ON ruijie_tunnels(expires_at) WHERE status = 'active';
CREATE INDEX idx_ruijie_audit_log_device ON ruijie_audit_log(device_sn);
CREATE INDEX idx_ruijie_audit_log_admin ON ruijie_audit_log(admin_user_id);
CREATE INDEX idx_ruijie_audit_log_created ON ruijie_audit_log(created_at DESC);
```

### Trigger

```sql
-- Reuse existing function if available, otherwise create
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ruijie_device_cache_updated_at
  BEFORE UPDATE ON ruijie_device_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### RLS Policies

```sql
ALTER TABLE ruijie_device_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_tunnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_audit_log ENABLE ROW LEVEL SECURITY;

-- Device cache: admin read, service_role write
CREATE POLICY "Admin users can read device cache" ON ruijie_device_cache
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Tunnels: admin read/write
CREATE POLICY "Admin users can manage tunnels" ON ruijie_tunnels
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Sync logs: admin read
CREATE POLICY "Admin users can read sync logs" ON ruijie_sync_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Audit log: admin read + insert (immutable - no update/delete)
CREATE POLICY "Admin users can read audit log" ON ruijie_audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );
CREATE POLICY "Admin users can insert audit log" ON ruijie_audit_log
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );
```

## lib/ruijie/ Module

### Structure

```
lib/ruijie/
  index.ts          - Barrel export
  types.ts          - TypeScript interfaces
  auth.ts           - OAuth2 token management
  client.ts         - API wrapper (mock mode switch)
  mock.ts           - Mock data generator
  sync-service.ts   - DB helpers for Inngest
```

### types.ts

```typescript
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
```

### auth.ts

- Module-level token cache (survives warm Vercel instances)
- On cold start: re-fetches token (acceptable cost at our scale)
- **IMPORTANT:** Ruijie uses `access_token` as query param, NOT Bearer header

```typescript
// Token fetched via POST /maint/token/login with { appId, secret }
// Passed to subsequent requests as ?access_token=xxx (NOT Authorization header)
```

### client.ts

- `getAllDevices()` - fetch all devices
- `getDevice(sn)` - fetch single device
- `createTunnel(sn, type)` - create eWeb/ssh/webcli tunnel
- `deleteTunnel(sn)` - close tunnel
- `rebootDevice(sn)` - reboot device

All functions check `RUIJIE_MOCK_MODE` and delegate to mock.ts when true.

### sync-service.ts

- `upsertDevices(devices)` - bulk upsert to cache
- `logSyncRun(result, triggeredBy)` - write to sync logs
- `getActiveTunnelCount()` - count for 10-tunnel limit guard
- `expireStaleTunnels()` - mark expired tunnels
- `seedMockData()` - first-run mock seeder

### mock.ts

20 devices with real names from screenshots:

**Newgen Network (3 RAP2200F):**
- G1U511Y076983 - AP_Downstairs
- G1U511Y07910C - Boardroom AP
- G1U511Y079276 - AP_Upstairs

**Unjani (15 APs + 2 switches):**
- G1U52HL044404 - UNJANISICELO (configStatus: 'Failed' - hardcoded)
- G1U52HL044425 - UNJANICLINICSKYCITY
- G1U52HL044450 - UNJANICOSMOCITY
- G1U52HL044467 - UNJANICLINICTHOKOZA
- G1U52HL044518 - UNJANIHEIDELBURG
- G1U9C8000083B - UNJANICLINICNOKANENG
- G1U9C80009021 - UNJANICLINICJABULANI
- (remaining 10 devices with generated UNJANI* names)

**Seeded variance:**
- Stable fields: device_name, model, group, configStatus for known failures
- Variable fields: cpu, memory, clients, channel utilization (±10% per 5-min seed)
- One device always has stale synced_at > 15 mins (tests warning banner)

## API Routes

### GET /api/ruijie/devices
List devices from cache with filters.

**Query params:**
- `search` - SN, hostname, mgmt IP
- `status` - online | offline | unknown
- `group` - group name
- `model` - model name

**Response:** `{ devices: RuijieDevice[], total: number, lastSynced: string }`

### GET /api/ruijie/devices/[sn]
Device detail from cache.

**Response:** `{ device: RuijieDevice, tunnels: RuijieTunnel[] }`

### POST /api/ruijie/tunnel
Create tunnel with limit guard.

**Body:** `{ sn: string, tunnelType?: 'eweb' | 'ssh' | 'webcli' }`

**Guards:**
1. Admin auth check
2. `getActiveTunnelCount()` - if >= 10, return 429
3. Check for existing active tunnel for this SN (reuse if found)
4. Only create new if no existing AND count < 10

**Response 200:** `{ tunnel: RuijieTunnel, reused: boolean }`
**Response 429:** `{ error: 'Tunnel limit reached', active: number, max: 10 }`

### DELETE /api/ruijie/tunnel/[sn]
Close tunnel.

**Response:** `{ success: boolean }`

### POST /api/ruijie/sync
Trigger manual sync.

**Body:** `{ deviceSns?: string[] }` (optional - specific devices or all)

**Response:** `{ syncLogId: string, status: 'queued' }`

### POST /api/ruijie/reboot/[sn]
Reboot device with confirm dialog on frontend.

**Response:** `{ success: boolean }`

**Side effect:** Writes to ruijie_audit_log

### GET /api/ruijie/audit/[sn]
Get audit log for device.

**Response:** `{ actions: RuijieAuditEntry[] }`

## Inngest Functions

### ruijie-sync
**Triggers:**
- Cron: `*/5 * * * *` (every 5 mins)
- Event: `ruijie/sync.requested` (manual trigger)

**Steps:**
1. `create-sync-log` - init sync log entry
2. `check-mock-seed` - if MOCK_MODE + cache empty, seedMockData()
3. `fetch-devices` - getAllDevices() (mock or real)
4. `upsert-devices` - bulk upsert to cache
5. `update-sync-log` - write final results
6. `send-completion-event` - trigger completed handler

### ruijie-sync-completed
**Trigger:** `ruijie/sync.completed`

Logs results, alerts on errors.

### ruijie-tunnel-cleanup
**Trigger:** Cron `*/15 * * * *` (every 15 mins)

Marks expired tunnels as 'expired' where status = 'active' AND expires_at < now().

## Admin UI

### /admin/network/devices (list)

**Table columns:**
Status | Device Name | Model | SN | Group | Mgmt IP | Clients | Last Synced | Actions

**Filters (URL params):**
- Search: SN, hostname, mgmt IP
- Status: Online / Offline / Unknown
- Group: (dynamic from API)
- Model: (dynamic from API)

**Bulk actions:**
- Refresh (re-sync selected)
- Export CSV

**Row actions:**
- View Detail
- Launch eWeb (with slot count: "Launch eWeb - 3/10 slots")
- Reboot (with confirm dialog)
- Copy SN

**Header:**
- "Last synced X mins ago"
- Stale warning at 15 mins: "Device data may be outdated [Refresh Now]"

**Footer:**
- "Showing X of Y devices"
- Active tunnels: x/10

### /admin/network/devices/[sn] (detail)

**Device info card:**
- Name, model, SN, group
- Management IP, WAN IP, egress IP
- Firmware version
- Uptime (formatted: "3d 4h 12m")
- Config status badge

**Metrics section:**
- CPU usage gauge
- Memory usage gauge
- Radio 2.4GHz: channel, utilization
- Radio 5GHz: channel, utilization
- Online clients count

**eWeb section:**
- "Launch eWeb - X/10 slots used" button
- If tunnel exists: countdown timer, "Disconnect" button
- If limit reached: disabled button with tooltip

**Audit log section:**
- Recent actions for this device
- Action, admin name, timestamp, status

**Actions:**
- Reboot (with confirm dialog + audit entry)

### Sidebar Update

Add to Network section (components/admin/layout/Sidebar.tsx):

```typescript
{
  name: 'Devices',
  href: '/admin/network/devices',
  icon: PiWifiBold,
  description: 'Ruijie Cloud device management'
}
```

## Environment Variables

Add to `.env.example`:

```env
# Ruijie Cloud API
RUIJIE_APP_ID=
RUIJIE_SECRET=
RUIJIE_BASE_URL=https://cloud.ruijienetworks.com/service/api
RUIJIE_MOCK_MODE=true   # Set to false when live credentials received
```

## Mock Mode Behavior

| RUIJIE_MOCK_MODE | Inngest Sync Source | Supabase | UI |
|------------------|---------------------|----------|-----|
| true | mock.ts generates data | Same tables | Reads from Supabase |
| false | Ruijie Cloud API | Same tables | Reads from Supabase |

**Zero code path differences** in API routes or UI - only lib/ruijie/client.ts checks the flag.

Mock data in Supabase has `mock_data = true` for visual "MOCK" badge in dev UI.

## Success Criteria

1. Device list loads from Supabase cache with all filters working
2. Device detail shows all metrics and eWeb tunnel launch
3. Tunnel limit (10) enforced with reuse logic
4. Sync runs every 5 mins, logs visible in sync_logs
5. Stale warning appears after 15 mins without sync
6. Reboot action logged to audit_log
7. Mock mode produces realistic test data
8. Flip to RUIJIE_MOCK_MODE=false works with real credentials

## Files to Create/Modify

**New files:**
- `lib/ruijie/index.ts`
- `lib/ruijie/types.ts`
- `lib/ruijie/auth.ts`
- `lib/ruijie/client.ts`
- `lib/ruijie/mock.ts`
- `lib/ruijie/sync-service.ts`
- `lib/inngest/functions/ruijie-sync.ts`
- `lib/inngest/functions/ruijie-tunnel-cleanup.ts`
- `app/api/ruijie/devices/route.ts`
- `app/api/ruijie/devices/[sn]/route.ts`
- `app/api/ruijie/tunnel/route.ts`
- `app/api/ruijie/tunnel/[sn]/route.ts`
- `app/api/ruijie/sync/route.ts`
- `app/api/ruijie/reboot/[sn]/route.ts`
- `app/api/ruijie/audit/[sn]/route.ts`
- `app/admin/network/devices/page.tsx`
- `app/admin/network/devices/[sn]/page.tsx`
- `components/admin/ruijie/DeviceTable.tsx`
- `components/admin/ruijie/DeviceDetail.tsx`
- `components/admin/ruijie/TunnelLauncher.tsx`
- `components/admin/ruijie/DeviceMetrics.tsx`
- `supabase/migrations/YYYYMMDD_ruijie_integration.sql`

**Modified files:**
- `components/admin/layout/Sidebar.tsx` - add Devices nav item
- `lib/inngest/index.ts` - register new functions
- `.env.example` - add RUIJIE_* vars
