/**
 * Router API Routes
 *
 * Handles router communication via Native API (6.x) or REST API (7.x+).
 */

import { Hono } from 'hono';
import { MikrotikNativeClient } from '../clients/native-client';
import { MikrotikRestClient } from '../clients/rest-client';

const DEFAULT_USER = process.env.MIKROTIK_DEFAULT_USER || 'thinkadmin';
const DEFAULT_PASS = process.env.MIKROTIK_DEFAULT_PASS || '';

export const routerRoutes = new Hono();

// Cache for router version detection
const versionCache = new Map<string, { version: string; timestamp: number }>();
const VERSION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Detect RouterOS version and return appropriate client
 */
async function getClient(ip: string): Promise<MikrotikNativeClient | MikrotikRestClient> {
  // Check cache
  const cached = versionCache.get(ip);
  if (cached && Date.now() - cached.timestamp < VERSION_CACHE_TTL) {
    if (cached.version.startsWith('7.')) {
      return new MikrotikRestClient(ip, DEFAULT_USER, DEFAULT_PASS);
    }
    return new MikrotikNativeClient(ip, DEFAULT_USER, DEFAULT_PASS);
  }

  // Try REST API first (RouterOS 7.x+)
  try {
    const restClient = new MikrotikRestClient(ip, DEFAULT_USER, DEFAULT_PASS);
    const version = await restClient.getVersion();
    versionCache.set(ip, { version, timestamp: Date.now() });
    return restClient;
  } catch {
    // Fall back to Native API (RouterOS 6.x)
    const nativeClient = new MikrotikNativeClient(ip, DEFAULT_USER, DEFAULT_PASS);
    const version = await nativeClient.getVersion();
    versionCache.set(ip, { version, timestamp: Date.now() });
    return nativeClient;
  }
}

// =============================================================================
// PING / HEALTH CHECK
// =============================================================================

routerRoutes.get('/:ip/ping', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    const identity = await client.getIdentity();
    const version = await client.getVersion();

    return c.json({ identity, version });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      503
    );
  }
});

// =============================================================================
// STATUS
// =============================================================================

routerRoutes.get('/:ip/status', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);

    const [status, interfaces, wifiConfigs] = await Promise.all([
      client.getSystemResource(),
      client.getInterfaces(),
      client.getWifiConfigs(),
    ]);

    return c.json({
      status,
      interfaces,
      wifi_configs: wifiConfigs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      503
    );
  }
});

routerRoutes.get('/:ip/status/basic', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    const status = await client.getSystemResource();
    return c.json(status);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      503
    );
  }
});

routerRoutes.get('/:ip/system/resource', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    const resource = await client.getSystemResource();
    return c.json(resource);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get resource' },
      503
    );
  }
});

// =============================================================================
// WIFI
// =============================================================================

routerRoutes.get('/:ip/wifi', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    const configs = await client.getWifiConfigs();
    return c.json(configs);
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get WiFi config' },
      503
    );
  }
});

routerRoutes.patch('/:ip/wifi', async (c) => {
  const ip = c.req.param('ip');
  const body = await c.req.json<{
    vlan_id: number;
    ssid?: string;
    password: string;
    security?: string;
  }>();

  try {
    const client = await getClient(ip);
    await client.updateWifiPassword(body.vlan_id, body.password, body.ssid);
    return c.json({ success: true, message: 'WiFi password updated' });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update WiFi' },
      503
    );
  }
});

// =============================================================================
// CONFIG EXPORT
// =============================================================================

routerRoutes.get('/:ip/export', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    const config = await client.exportConfig();
    const version = await client.getVersion();
    const identity = await client.getIdentity();

    return c.json({
      config,
      version,
      identity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to export config' },
      503
    );
  }
});

// =============================================================================
// REBOOT
// =============================================================================

routerRoutes.post('/:ip/reboot', async (c) => {
  const ip = c.req.param('ip');

  try {
    const client = await getClient(ip);
    await client.reboot();
    return c.json({ success: true, message: 'Reboot command sent' });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to reboot' },
      503
    );
  }
});
