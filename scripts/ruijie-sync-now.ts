/**
 * Manual Ruijie Sync Script
 * Run with: npx tsx scripts/ruijie-sync-now.ts
 *
 * Directly syncs devices from Ruijie Cloud to Supabase cache
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const RUIJIE_BASE_URL = process.env.RUIJIE_BASE_URL || 'https://cloud-eu.ruijienetworks.com/service/api';
const RUIJIE_APP_ID = process.env.RUIJIE_APP_ID || '';
const RUIJIE_SECRET = process.env.RUIJIE_SECRET || '';
const AUTH_TOKEN_PARAM = 'd63dss0a81e4415a889ac5b78fsc904a';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function syncNow() {
  console.log('='.repeat(60));
  console.log('Ruijie Manual Sync');
  console.log('='.repeat(60));

  const startTime = Date.now();

  // 1. Authenticate with Ruijie
  console.log('\n1. Authenticating with Ruijie Cloud...');
  const authUrl = `${RUIJIE_BASE_URL}/oauth20/client/access_token?token=${AUTH_TOKEN_PARAM}`;
  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appid: RUIJIE_APP_ID, secret: RUIJIE_SECRET }),
  });
  const authData = await authResponse.json();

  if (authData.code !== 0) {
    console.error('   Auth failed:', authData.msg);
    process.exit(1);
  }
  const accessToken = authData.accessToken;
  console.log('   ✓ Authenticated');

  // 2. Get all groups
  console.log('\n2. Fetching groups...');
  const groupsUrl = `${RUIJIE_BASE_URL}/maint/groups?access_token=${accessToken}`;
  const groupsResponse = await fetch(groupsUrl);
  const groupsData = await groupsResponse.json();

  interface GroupNode { id: number; name: string; children?: GroupNode[] }
  function extractGroupIds(node: GroupNode): number[] {
    const ids: number[] = [];
    if (node.id && node.name !== 'dumy') ids.push(node.id);
    if (node.children) {
      for (const child of node.children) ids.push(...extractGroupIds(child));
    }
    return ids;
  }

  const groupIds = extractGroupIds(groupsData.groupTree || {});
  console.log(`   ✓ Found ${groupIds.length} groups`);

  // 3. Fetch devices from all groups
  console.log('\n3. Fetching devices...');
  const deviceMap = new Map<string, any>();

  for (const gid of groupIds) {
    const devicesUrl = `${RUIJIE_BASE_URL}/maint/devices?access_token=${accessToken}&group_id=${gid}&page=0&per_page=500`;
    const devicesResponse = await fetch(devicesUrl);
    const devicesData = await devicesResponse.json();

    if (devicesData.code === 0 && devicesData.deviceList) {
      for (const d of devicesData.deviceList) {
        if (!deviceMap.has(d.serialNumber)) {
          deviceMap.set(d.serialNumber, {
            sn: d.serialNumber,
            device_name: d.aliasName || d.name || d.serialNumber,
            model: d.productClass || null,
            group_id: String(d.groupId),
            group_name: d.groupName || null,
            management_ip: d.localIp || null,
            wan_ip: d.cpeIp || null,
            egress_ip: d.cpeIp || null,
            online_clients: 0,
            status: d.onlineStatus === 'ON' ? 'online' : 'offline',
            config_status: d.confSyncType || null,
            firmware_version: d.softwareVersion || null,
            mac_address: d.mac || null,
            cpu_usage: null,
            memory_usage: null,
            uptime_seconds: null,
            radio_2g_channel: null,
            radio_5g_channel: null,
            radio_2g_utilization: null,
            radio_5g_utilization: null,
            project_id: String(d.groupId),
            last_seen_at: d.lastOnline ? new Date(d.lastOnline).toISOString() : null,
            synced_at: new Date().toISOString(),
            raw_json: d,
            mock_data: false,
          });
        }
      }
    }
  }

  const devices = Array.from(deviceMap.values());
  console.log(`   ✓ Found ${devices.length} unique devices`);

  // 4. Upsert to Supabase
  console.log('\n4. Upserting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get existing count
  const { count: existingCount } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  // Clear mock data first
  const { error: deleteError } = await supabase
    .from('ruijie_device_cache')
    .delete()
    .eq('mock_data', true);

  if (deleteError) {
    console.log(`   Warning: Could not clear mock data: ${deleteError.message}`);
  }

  // Upsert real devices
  const { error: upsertError } = await supabase
    .from('ruijie_device_cache')
    .upsert(devices, { onConflict: 'sn' });

  if (upsertError) {
    console.error('   Upsert failed:', upsertError.message);
    process.exit(1);
  }

  // Get new count
  const { count: newCount } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  console.log(`   ✓ Upserted ${devices.length} devices (was ${existingCount}, now ${newCount})`);

  // 5. Log sync
  console.log('\n5. Logging sync...');
  const duration = Date.now() - startTime;
  await supabase.from('ruijie_sync_logs').insert({
    status: 'completed',
    devices_fetched: devices.length,
    devices_updated: devices.length,
    devices_added: 0,
    triggered_by: 'manual',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: duration,
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✓ Sync completed in ${duration}ms`);
  console.log(`  ${devices.length} devices synced to ruijie_device_cache`);
  console.log('='.repeat(60));
}

syncNow().catch(console.error);
