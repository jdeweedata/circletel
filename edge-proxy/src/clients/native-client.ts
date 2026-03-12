/**
 * MikroTik Native API Client
 *
 * Uses RouterOS native API (port 8728/8729) for RouterOS 6.x.
 * Falls back from routeros-client package.
 */

import { RouterOSClient } from 'routeros-client';

interface SystemResource {
  identity: string;
  version: string;
  uptime: string;
  uptime_seconds: number;
  cpu_load: number;
  cpu_count: number;
  free_memory: number;
  total_memory: number;
  free_hdd_space: number;
  total_hdd_space: number;
  architecture_name: string;
  board_name: string;
}

interface NetworkInterface {
  name: string;
  type: string;
  mac_address?: string;
  running: boolean;
  disabled: boolean;
  tx_bytes: number;
  rx_bytes: number;
  tx_packets: number;
  rx_packets: number;
}

interface WifiConfig {
  interface_name: string;
  ssid: string;
  security: string;
  vlan_id: number;
  band: string;
  channel: string;
  disabled: boolean;
}

export class MikrotikNativeClient {
  private ip: string;
  private username: string;
  private password: string;

  constructor(ip: string, username: string, password: string) {
    this.ip = ip;
    this.username = username;
    this.password = password;
  }

  private async withConnection<T>(fn: (client: RouterOSClient) => Promise<T>): Promise<T> {
    const client = new RouterOSClient({
      host: this.ip,
      user: this.username,
      password: this.password,
      port: 8729,
      tls: true,
      timeout: 10000,
    });

    try {
      await client.connect();
      const result = await fn(client);
      return result;
    } finally {
      await client.close();
    }
  }

  async getIdentity(): Promise<string> {
    return this.withConnection(async (client) => {
      const [result] = await client.write('/system/identity/print');
      return result.name || 'Unknown';
    });
  }

  async getVersion(): Promise<string> {
    return this.withConnection(async (client) => {
      const [result] = await client.write('/system/resource/print');
      return result.version || 'Unknown';
    });
  }

  async getSystemResource(): Promise<SystemResource> {
    return this.withConnection(async (client) => {
      const [resource] = await client.write('/system/resource/print');
      const [identity] = await client.write('/system/identity/print');

      // Parse uptime string to seconds (e.g., "1d2h3m4s")
      const uptimeStr = resource.uptime || '0s';
      let uptimeSeconds = 0;
      const daysMatch = uptimeStr.match(/(\d+)d/);
      const hoursMatch = uptimeStr.match(/(\d+)h/);
      const minsMatch = uptimeStr.match(/(\d+)m/);
      const secsMatch = uptimeStr.match(/(\d+)s/);
      if (daysMatch) uptimeSeconds += parseInt(daysMatch[1], 10) * 86400;
      if (hoursMatch) uptimeSeconds += parseInt(hoursMatch[1], 10) * 3600;
      if (minsMatch) uptimeSeconds += parseInt(minsMatch[1], 10) * 60;
      if (secsMatch) uptimeSeconds += parseInt(secsMatch[1], 10);

      return {
        identity: identity.name || 'Unknown',
        version: resource.version || 'Unknown',
        uptime: uptimeStr,
        uptime_seconds: uptimeSeconds,
        cpu_load: parseInt(resource['cpu-load'] || '0', 10),
        cpu_count: parseInt(resource['cpu-count'] || '1', 10),
        free_memory: parseInt(resource['free-memory'] || '0', 10),
        total_memory: parseInt(resource['total-memory'] || '0', 10),
        free_hdd_space: parseInt(resource['free-hdd-space'] || '0', 10),
        total_hdd_space: parseInt(resource['total-hdd-space'] || '0', 10),
        architecture_name: resource['architecture-name'] || '',
        board_name: resource['board-name'] || '',
      };
    });
  }

  async getInterfaces(): Promise<NetworkInterface[]> {
    return this.withConnection(async (client) => {
      const interfaces = await client.write('/interface/print');
      return interfaces.map((iface: Record<string, string>) => ({
        name: iface.name || '',
        type: iface.type || 'other',
        mac_address: iface['mac-address'],
        running: iface.running === 'true',
        disabled: iface.disabled === 'true',
        tx_bytes: parseInt(iface['tx-byte'] || '0', 10),
        rx_bytes: parseInt(iface['rx-byte'] || '0', 10),
        tx_packets: parseInt(iface['tx-packet'] || '0', 10),
        rx_packets: parseInt(iface['rx-packet'] || '0', 10),
      }));
    });
  }

  async getWifiConfigs(): Promise<WifiConfig[]> {
    return this.withConnection(async (client) => {
      // Try wireless interfaces first
      try {
        const securityProfiles = await client.write('/interface/wireless/security-profiles/print');
        const interfaces = await client.write('/interface/wireless/print');

        return interfaces.map((iface: Record<string, string>) => {
          const profile = securityProfiles.find(
            (p: Record<string, string>) => p.name === iface['security-profile']
          );

          return {
            interface_name: iface.name || '',
            ssid: iface.ssid || '',
            security: profile ? profile.mode || 'none' : 'none',
            vlan_id: parseInt(iface['vlan-id'] || '0', 10),
            band: iface.band || 'unknown',
            channel: iface.frequency || 'auto',
            disabled: iface.disabled === 'true',
          };
        });
      } catch {
        return [];
      }
    });
  }

  async updateWifiPassword(vlanId: number, password: string, ssid?: string): Promise<void> {
    return this.withConnection(async (client) => {
      // Find the security profile for this VLAN
      const interfaces = await client.write('/interface/wireless/print');
      const targetInterface = interfaces.find(
        (iface: Record<string, string>) =>
          parseInt(iface['vlan-id'] || '0', 10) === vlanId ||
          iface.name?.includes(`vlan${vlanId}`)
      );

      if (!targetInterface) {
        throw new Error(`No wireless interface found for VLAN ${vlanId}`);
      }

      const profileName = targetInterface['security-profile'];
      if (profileName) {
        await client.write([
          '/interface/wireless/security-profiles/set',
          `=.id=${profileName}`,
          `=wpa2-pre-shared-key=${password}`,
        ]);
      }

      if (ssid) {
        await client.write([
          '/interface/wireless/set',
          `=.id=${targetInterface['.id']}`,
          `=ssid=${ssid}`,
        ]);
      }
    });
  }

  async exportConfig(): Promise<string> {
    return this.withConnection(async (client) => {
      const result = await client.write('/export');
      return result.map((line: Record<string, string>) => line.ret || '').join('\n');
    });
  }

  async reboot(): Promise<void> {
    return this.withConnection(async (client) => {
      await client.write('/system/reboot');
    });
  }
}
