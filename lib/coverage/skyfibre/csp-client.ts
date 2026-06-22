import type {
  CspFeasibilityMethod,
  CspOrderabilityResult,
  SkyFibreCapacityMbps,
} from './types';

const DEFAULT_CSP_API_BASE = 'https://mtnsi.mtn.co.za/newcsp_api/components';
const CSP_PRODUCT_NAME = 'Fixed Wireless Broadband';
const SESSION_TTL_MS = 25 * 60 * 1000;

type FetchLike = typeof fetch;

interface CspClientOptions {
  baseUrl?: string;
  username?: string;
  password?: string;
  fetchImpl?: FetchLike;
}

interface CspSession {
  cookieHeader: string;
  expiresAt: number;
}

let cachedSession: CspSession | null = null;

/**
 * Rich Fixed Wireless Broadband feasibility result from the CSP `feasibilityCheck`
 * method (flat `outputs[0]` shape). Used by the admin coverage checker's MTN tab.
 */
export interface CspFwbFeasibility {
  feasible: boolean;
  region: string | null;
  capacityMbps: number | null;
  medium: string | null;
  nni: string | null;
  upNode: string | null;
  reference: string | null;
}

function cspString(value: unknown): string | null {
  const s = String(value ?? '').trim();
  return s && s.toLowerCase() !== 'none' ? s : null;
}

export function normalizeFwbFeasibility(raw: unknown): CspFwbFeasibility {
  const output = firstOutput(raw);
  const capRaw = output?.product_capacity;
  const cap = capRaw === '' || capRaw == null ? NaN : Number(capRaw);
  return {
    feasible: parseBoolean(output?.product_feasible) === true,
    region: cspString(output?.product_region),
    capacityMbps: Number.isFinite(cap) ? cap : null,
    medium: cspString(output?.product_medium),
    nni: cspString(output?.product_nni),
    upNode: cspString(output?.product_up_node),
    reference: cspString(output?.id),
  };
}

export function selectCspFeasibilityMethod(
  capacityMbps: SkyFibreCapacityMbps
): CspFeasibilityMethod {
  return capacityMbps >= 200 ? 'feasibilityCheck' : 'feasibilityOld';
}

export function normalizeCspFeasibilityResponse(
  raw: unknown,
  capacityMbps: SkyFibreCapacityMbps,
  responseTimeMs?: number
): CspOrderabilityResult {
  const method = selectCspFeasibilityMethod(capacityMbps);
  const output = firstOutput(raw);
  let orderable: boolean | null = null;
  let taranaFeasible: boolean | undefined;
  let taranaZone: number | null | undefined;

  if (method === 'feasibilityCheck') {
    orderable = parseBoolean(output?.product_feasible);
  } else {
    const fwa = asRecord(output?.FWA);
    taranaFeasible = parseBoolean(fwa?.Tarana_Feasible) ?? undefined;
    taranaZone = parseNullableNumber(fwa?.Tarana_zone);
    orderable = taranaFeasible ?? null;
  }

  return {
    provider: 'mtn-csp',
    productName: CSP_PRODUCT_NAME,
    method,
    capacityMbps,
    orderable,
    status: orderable === true ? 'orderable' : orderable === false ? 'not_orderable' : 'unknown',
    ...(taranaFeasible !== undefined ? { taranaFeasible } : {}),
    ...(taranaZone !== undefined ? { taranaZone } : {}),
    checkedAt: new Date().toISOString(),
    ...(responseTimeMs !== undefined ? { responseTimeMs } : {}),
  };
}

export class MtnCspClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: CspClientOptions = {}) {
    this.baseUrl = stripTrailingSlash(
      options.baseUrl || process.env.MTN_CSP_API_BASE || DEFAULT_CSP_API_BASE
    );
    this.username = options.username || process.env.MTN_CSP_USERNAME || '';
    this.password = options.password || process.env.MTN_CSP_PASSWORD || '';
    this.fetchImpl = options.fetchImpl || fetch;
  }

  async checkOrderability(params: {
    latitude: number;
    longitude: number;
    capacityMbps: SkyFibreCapacityMbps;
  }): Promise<CspOrderabilityResult> {
    const startedAt = Date.now();

    try {
      const session = await this.getSession();
      const method = selectCspFeasibilityMethod(params.capacityMbps);
      const query = new URLSearchParams({
        method,
        latitude: String(params.latitude),
        longitude: String(params.longitude),
        capacity_mbps: String(params.capacityMbps),
        product_name: CSP_PRODUCT_NAME,
      });

      const response = await this.fetchImpl(`${this.baseUrl}/feasibility.cfc?${query.toString()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          Cookie: session.cookieHeader,
        },
      });

      if (!response.ok) {
        throw new Error(`CSP feasibility failed with status ${response.status}`);
      }

      const raw = await response.json();
      return normalizeCspFeasibilityResponse(raw, params.capacityMbps, Date.now() - startedAt);
    } catch (error) {
      return {
        provider: 'mtn-csp',
        productName: CSP_PRODUCT_NAME,
        method: selectCspFeasibilityMethod(params.capacityMbps),
        capacityMbps: params.capacityMbps,
        orderable: null,
        status: 'error',
        checkedAt: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'CSP orderability check failed',
      };
    }
  }

  /**
   * Rich FWB feasibility via the CSP `feasibilityCheck` method (returns region,
   * capacity, medium, NNI, up-node, ref). Authenticates with username/password.
   */
  async checkFwbFeasibility(params: {
    latitude: number;
    longitude: number;
    capacityMbps?: number;
  }): Promise<CspFwbFeasibility> {
    const capacityMbps = params.capacityMbps ?? 100;
    const session = await this.getSession();
    const query = new URLSearchParams({
      method: 'feasibilityCheck',
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      capacity_mbps: String(capacityMbps),
      product_name: CSP_PRODUCT_NAME,
    });

    const response = await this.fetchImpl(`${this.baseUrl}/feasibility.cfc?${query.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        Cookie: session.cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`CSP FWB feasibility failed with status ${response.status}`);
    }

    return normalizeFwbFeasibility(await response.json());
  }

  private async getSession(): Promise<CspSession> {
    const now = Date.now();
    if (cachedSession && cachedSession.expiresAt > now) {
      return cachedSession;
    }

    if (!this.username || !this.password) {
      throw new Error('MTN CSP credentials are not configured');
    }

    const response = await this.fetchImpl(`${this.baseUrl}/login.cfc?method=login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.username,
        password: this.password,
      }),
    });

    if (!response.ok) {
      throw new Error(`CSP login failed with status ${response.status}`);
    }

    const cookieHeader = extractCookieHeader(response.headers);
    if (!cookieHeader) {
      throw new Error('CSP login did not return a session cookie');
    }

    cachedSession = {
      cookieHeader,
      expiresAt: now + SESSION_TTL_MS,
    };

    return cachedSession;
  }
}

export const mtnCspClient = new MtnCspClient();

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function extractCookieHeader(headers: Headers): string {
  const raw = headers.get('set-cookie');
  if (!raw) return '';

  return raw
    .split(/,(?=[^;,]+=)/)
    .map((cookie) => cookie.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function firstOutput(raw: unknown): Record<string, unknown> | null {
  const record = asRecord(raw);
  const outputs = Array.isArray(record?.outputs) ? record.outputs : [];
  return asRecord(outputs[0]);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function parseNullableNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'feasible', 'available'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0', 'not feasible', 'unavailable'].includes(normalized)) return false;
  }
  return null;
}
