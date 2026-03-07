/**
 * MikroTik Proxy Client
 *
 * Communicates with the Edge Proxy service deployed on 34.35.85.28.
 * The proxy handles actual router communication via the L2TP tunnel network.
 *
 * All requests are authenticated using API key + HMAC signature.
 *
 * @module lib/mikrotik/proxy-client
 */

import crypto from 'crypto';
import type {
  MikrotikProxyStatus,
  MikrotikStatusResponse,
  MikrotikWifiConfig,
  MikrotikWifiPasswordUpdate,
  MikrotikConfigBackup,
  MikrotikConnectionTestResult,
} from '@/lib/types/mikrotik';

// =============================================================================
// CONFIGURATION
// =============================================================================

function getProxyConfig() {
  const proxyUrl = process.env.MIKROTIK_PROXY_URL;
  const apiKey = process.env.MIKROTIK_PROXY_API_KEY;
  const secret = process.env.MIKROTIK_PROXY_SECRET;

  if (!proxyUrl) {
    throw new Error('MIKROTIK_PROXY_URL environment variable is not set');
  }
  if (!apiKey) {
    throw new Error('MIKROTIK_PROXY_API_KEY environment variable is not set');
  }
  if (!secret) {
    throw new Error('MIKROTIK_PROXY_SECRET environment variable is not set');
  }

  return { proxyUrl, apiKey, secret };
}

// =============================================================================
// PROXY CLIENT
// =============================================================================

export class MikrotikProxyClient {
  private proxyUrl: string;
  private apiKey: string;
  private secret: string;

  constructor() {
    const config = getProxyConfig();
    this.proxyUrl = config.proxyUrl;
    this.apiKey = config.apiKey;
    this.secret = config.secret;
  }

  /**
   * Sign a request with HMAC-SHA256
   */
  private signRequest(path: string, timestamp: number): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(`${path}:${timestamp}`);
    return hmac.digest('hex');
  }

  /**
   * Make an authenticated request to the proxy
   */
  private async request<T>(
    path: string,
    options?: RequestInit & { timeout?: number }
  ): Promise<T> {
    const timestamp = Date.now();
    const signature = this.signRequest(path, timestamp);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 30000);

    try {
      const response = await fetch(`${this.proxyUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'X-API-Key': this.apiKey,
          'X-Timestamp': timestamp.toString(),
          'X-Signature': signature,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ProxyError(
          `Proxy request failed: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProxyError('Request timeout', 408, 'Request timed out');
      }

      throw error;
    }
  }

  // ===========================================================================
  // STATUS ENDPOINTS
  // ===========================================================================

  /**
   * Get full router status including interfaces and WiFi
   */
  async getStatus(routerIp: string): Promise<MikrotikStatusResponse> {
    return this.request<MikrotikStatusResponse>(`/routers/${routerIp}/status`);
  }

  /**
   * Get basic router status (faster, less data)
   */
  async getBasicStatus(routerIp: string): Promise<MikrotikProxyStatus> {
    return this.request<MikrotikProxyStatus>(`/routers/${routerIp}/status/basic`);
  }

  /**
   * Ping/test router connectivity (lightweight)
   */
  async ping(routerIp: string): Promise<MikrotikConnectionTestResult> {
    const start = Date.now();
    try {
      const result = await this.request<{ identity: string; version: string }>(
        `/routers/${routerIp}/ping`,
        { timeout: 10000 }
      );
      return {
        success: true,
        router_ip: routerIp,
        identity: result.identity,
        version: result.version,
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      return {
        success: false,
        router_ip: routerIp,
        error: error instanceof Error ? error.message : 'Connection failed',
        latency_ms: Date.now() - start,
      };
    }
  }

  // ===========================================================================
  // WIFI ENDPOINTS
  // ===========================================================================

  /**
   * Get WiFi configuration for all interfaces
   */
  async getWifiConfig(routerIp: string): Promise<MikrotikWifiConfig[]> {
    return this.request<MikrotikWifiConfig[]>(`/routers/${routerIp}/wifi`);
  }

  /**
   * Update WiFi password for a specific VLAN
   */
  async updateWifiPassword(
    routerIp: string,
    update: MikrotikWifiPasswordUpdate
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/routers/${routerIp}/wifi`,
      {
        method: 'PATCH',
        body: JSON.stringify(update),
      }
    );
  }

  // ===========================================================================
  // CONFIG ENDPOINTS
  // ===========================================================================

  /**
   * Export router configuration
   */
  async exportConfig(routerIp: string): Promise<MikrotikConfigBackup> {
    return this.request<MikrotikConfigBackup>(`/routers/${routerIp}/export`);
  }

  /**
   * Get router system resource info
   */
  async getSystemResource(routerIp: string): Promise<{
    uptime: string;
    cpu_load: number;
    free_memory: number;
    total_memory: number;
    version: string;
  }> {
    return this.request(`/routers/${routerIp}/system/resource`);
  }

  // ===========================================================================
  // CONTROL ENDPOINTS
  // ===========================================================================

  /**
   * Reboot the router
   */
  async reboot(routerIp: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/routers/${routerIp}/reboot`,
      { method: 'POST' }
    );
  }

  // ===========================================================================
  // BATCH OPERATIONS
  // ===========================================================================

  /**
   * Batch ping multiple routers
   */
  async batchPing(
    routerIps: string[]
  ): Promise<Map<string, MikrotikConnectionTestResult>> {
    const results = new Map<string, MikrotikConnectionTestResult>();

    // Run pings in parallel with concurrency limit
    const CONCURRENCY = 10;
    const chunks: string[][] = [];
    for (let i = 0; i < routerIps.length; i += CONCURRENCY) {
      chunks.push(routerIps.slice(i, i + CONCURRENCY));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((ip) => this.ping(ip))
      );
      chunkResults.forEach((result) => {
        results.set(result.router_ip, result);
      });
    }

    return results;
  }

  /**
   * Test proxy health/connectivity
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    version: string;
    timestamp: string;
  }> {
    return this.request('/health');
  }
}

// =============================================================================
// ERROR CLASS
// =============================================================================

export class ProxyError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: string
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let proxyClientInstance: MikrotikProxyClient | null = null;

/**
 * Get singleton proxy client instance
 */
export function getProxyClient(): MikrotikProxyClient {
  if (!proxyClientInstance) {
    proxyClientInstance = new MikrotikProxyClient();
  }
  return proxyClientInstance;
}
