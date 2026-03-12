/**
 * MikroTik REST API Client
 *
 * Uses RouterOS REST API (port 443) for RouterOS 7.x+.
 * REST API was introduced in RouterOS 7.1.
 */

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

export class MikrotikRestClient {
  private baseUrl: string;
  private auth: string;

  constructor(ip: string, username: string, password: string) {
    this.baseUrl = `https://${ip}/rest`;
    this.auth = Buffer.from(`${username}:${password}`).toString('base64');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Skip TLS verification for self-signed certs
      // @ts-expect-error - Node.js fetch option
      rejectUnauthorized: false,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RouterOS API error: ${response.status} - ${text}`);
    }

    return response.json();
  }

  async getIdentity(): Promise<string> {
    const result = await this.request<Array<{ name: string }>>('/system/identity');
    return result[0]?.name || 'Unknown';
  }

  async getVersion(): Promise<string> {
    const result = await this.request<Array<{ version: string }>>('/system/resource');
    return result[0]?.version || 'Unknown';
  }

  async getSystemResource(): Promise<SystemResource> {
    const [resource] = await this.request<Array<Record<string, string | number>>>('/system/resource');
    const [identity] = await this.request<Array<{ name: string }>>('/system/identity');

    // Parse uptime string to seconds
    const uptimeStr = String(resource.uptime || '0s');
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
      version: String(resource.version || 'Unknown'),
      uptime: uptimeStr,
      uptime_seconds: uptimeSeconds,
      cpu_load: Number(resource['cpu-load'] || 0),
      cpu_count: Number(resource['cpu-count'] || 1),
      free_memory: Number(resource['free-memory'] || 0),
      total_memory: Number(resource['total-memory'] || 0),
      free_hdd_space: Number(resource['free-hdd-space'] || 0),
      total_hdd_space: Number(resource['total-hdd-space'] || 0),
      architecture_name: String(resource['architecture-name'] || ''),
      board_name: String(resource['board-name'] || ''),
    };
  }

  async getInterfaces(): Promise<NetworkInterface[]> {
    const interfaces = await this.request<Array<Record<string, string | number | boolean>>>('/interface');

    return interfaces.map((iface) => ({
      name: String(iface.name || ''),
      type: String(iface.type || 'other'),
      mac_address: iface['mac-address'] ? String(iface['mac-address']) : undefined,
      running: Boolean(iface.running),
      disabled: Boolean(iface.disabled),
      tx_bytes: Number(iface['tx-byte'] || 0),
      rx_bytes: Number(iface['rx-byte'] || 0),
      tx_packets: Number(iface['tx-packet'] || 0),
      rx_packets: Number(iface['rx-packet'] || 0),
    }));
  }

  async getWifiConfigs(): Promise<WifiConfig[]> {
    try {
      // RouterOS 7.x uses /interface/wifi for WiFi configuration
      const interfaces = await this.request<Array<Record<string, string | number | boolean>>>('/interface/wifi');

      return interfaces.map((iface) => ({
        interface_name: String(iface.name || ''),
        ssid: String(iface.ssid || ''),
        security: String(iface['security.authentication-types'] || 'wpa2-psk'),
        vlan_id: Number(iface['vlan-id'] || 0),
        band: String(iface.band || 'unknown'),
        channel: String(iface.channel || 'auto'),
        disabled: Boolean(iface.disabled),
      }));
    } catch {
      // Fall back to legacy wireless
      try {
        const interfaces = await this.request<Array<Record<string, string | number | boolean>>>('/interface/wireless');
        return interfaces.map((iface) => ({
          interface_name: String(iface.name || ''),
          ssid: String(iface.ssid || ''),
          security: 'unknown',
          vlan_id: Number(iface['vlan-id'] || 0),
          band: String(iface.band || 'unknown'),
          channel: String(iface.frequency || 'auto'),
          disabled: Boolean(iface.disabled),
        }));
      } catch {
        return [];
      }
    }
  }

  async updateWifiPassword(vlanId: number, password: string, ssid?: string): Promise<void> {
    // Get WiFi interfaces
    const interfaces = await this.request<Array<Record<string, string | number>>>('/interface/wifi');

    const targetInterface = interfaces.find(
      (iface) =>
        Number(iface['vlan-id'] || 0) === vlanId ||
        String(iface.name || '').includes(`vlan${vlanId}`)
    );

    if (!targetInterface) {
      throw new Error(`No WiFi interface found for VLAN ${vlanId}`);
    }

    const updateData: Record<string, string> = {
      'security.passphrase': password,
    };

    if (ssid) {
      updateData.ssid = ssid;
    }

    await this.request(`/interface/wifi/${targetInterface['.id']}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async exportConfig(): Promise<string> {
    // REST API doesn't have a direct export endpoint, use system script
    const result = await this.request<{ ret: string }>('/export', {
      method: 'POST',
    });
    return result.ret || '';
  }

  async reboot(): Promise<void> {
    await this.request('/system/reboot', {
      method: 'POST',
    });
  }
}
