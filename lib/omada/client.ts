/**
 * TP-Link Omada Open API client (Client Credentials).
 *
 * Auth header format: Authorization: AccessToken=<token>
 * @see https://omada-northbound-docs.tplinkcloud.com/
 */

import type {
  OmadaApiResponse,
  OmadaClient as OmadaWifiClient,
  OmadaConfig,
  OmadaDevice,
  OmadaSite,
  OmadaTokenResponse,
} from './types'

function requireConfig(): OmadaConfig {
  const baseUrl = (process.env.OMADA_BASE_URL || '').replace(/\/$/, '')
  const omadaId = process.env.OMADA_ID || ''
  const clientId = process.env.OMADA_CLIENT_ID || ''
  const clientSecret = process.env.OMADA_CLIENT_SECRET || ''

  if (!baseUrl || !omadaId || !clientId || !clientSecret) {
    throw new Error(
      'Omada Open API not configured. Set OMADA_BASE_URL, OMADA_ID, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET. ' +
        'Create an app under Omada Cloud → Settings → Platform Integration → Open API (Client Credentials).'
    )
  }

  return { baseUrl, omadaId, clientId, clientSecret }
}

export class OmadaClient {
  private config: OmadaConfig
  private accessToken: string | null = null
  private tokenExpiresAt = 0

  constructor(config?: Partial<OmadaConfig>) {
    const defaults = (() => {
      try {
        return requireConfig()
      } catch {
        return {
          baseUrl: process.env.OMADA_BASE_URL?.replace(/\/$/, '') || '',
          omadaId: process.env.OMADA_ID || '',
          clientId: process.env.OMADA_CLIENT_ID || '',
          clientSecret: process.env.OMADA_CLIENT_SECRET || '',
        }
      }
    })()

    this.config = {
      baseUrl: config?.baseUrl ?? defaults.baseUrl,
      omadaId: config?.omadaId ?? defaults.omadaId,
      clientId: config?.clientId ?? defaults.clientId,
      clientSecret: config?.clientSecret ?? defaults.clientSecret,
    }
  }

  /** True when Client Credentials Open API vars are complete. */
  isConfigured(): boolean {
    return Boolean(
      this.config.baseUrl &&
        this.config.omadaId &&
        this.config.clientId &&
        this.config.clientSecret
    )
  }

  /** TP-Link ID login present (portal / Authorization Code); not enough alone for Open API GETs. */
  hasTplinkIdLogin(): boolean {
    return Boolean(process.env.OMADA_USERNAME && process.env.OMADA_PASSWORD)
  }

  async getAccessToken(): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        'Omada Open API not configured. Set OMADA_BASE_URL, OMADA_ID, OMADA_CLIENT_ID, OMADA_CLIENT_SECRET.'
      )
    }

    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.accessToken
    }

    const url = `${this.config.baseUrl}/openapi/authorize/token?grant_type=client_credentials`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        omadacId: this.config.omadaId,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Omada token request failed: ${response.status} ${text}`)
    }

    const data = (await response.json()) as OmadaTokenResponse
    if (data.errorCode !== 0 || !data.result?.accessToken) {
      throw new Error(`Omada token error: ${data.msg || JSON.stringify(data)}`)
    }

    this.accessToken = data.result.accessToken
    const expiresIn = data.result.expiresIn ?? 7200
    this.tokenExpiresAt = Date.now() + expiresIn * 1000
    return this.accessToken
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AccessToken=${token}`,
        ...init.headers,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Omada API ${response.status}: ${text}`)
    }

    const data = (await response.json()) as OmadaApiResponse<T>
    if (data.errorCode !== 0) {
      throw new Error(`Omada API error ${data.errorCode}: ${data.msg || 'unknown'}`)
    }
    return data.result as T
  }

  get omadaId(): string {
    return this.config.omadaId
  }

  async listSites(page = 1, pageSize = 100): Promise<OmadaSite[]> {
    const result = await this.request<{ data?: OmadaSite[]; list?: OmadaSite[] } | OmadaSite[]>(
      `/openapi/v1/${this.config.omadaId}/sites?page=${page}&pageSize=${pageSize}`
    )
    if (Array.isArray(result)) return result
    return result?.data || result?.list || []
  }

  async listDevices(siteId: string, page = 1, pageSize = 100): Promise<OmadaDevice[]> {
    const result = await this.request<{ data?: OmadaDevice[]; list?: OmadaDevice[] } | OmadaDevice[]>(
      `/openapi/v1/${this.config.omadaId}/sites/${siteId}/devices?page=${page}&pageSize=${pageSize}`
    )
    if (Array.isArray(result)) return result
    return result?.data || result?.list || []
  }

  async listClients(siteId: string, page = 1, pageSize = 100): Promise<OmadaWifiClient[]> {
    const result = await this.request<{ data?: OmadaWifiClient[]; list?: OmadaWifiClient[] } | OmadaWifiClient[]>(
      `/openapi/v1/${this.config.omadaId}/sites/${siteId}/clients?page=${page}&pageSize=${pageSize}`
    )
    if (Array.isArray(result)) return result
    return result?.data || result?.list || []
  }

  async findSitesByName(names: string[]): Promise<OmadaSite[]> {
    const sites = await this.listSites()
    const lower = names.map((n) => n.toLowerCase())
    return sites.filter((s) => lower.includes((s.name || '').toLowerCase()))
  }
}

let singleton: OmadaClient | null = null

export function getOmadaClient(): OmadaClient {
  if (!singleton) singleton = new OmadaClient()
  return singleton
}

export function createOmadaClient(config?: Partial<OmadaConfig>): OmadaClient {
  return new OmadaClient(config)
}
