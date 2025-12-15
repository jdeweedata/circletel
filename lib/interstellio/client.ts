/**
 * Interstellio (NebularStack) API Client
 *
 * RADIUS service client for customer provisioning and usage tracking.
 *
 * @see docs/api/INTERSTELLIO_API.md for full documentation
 * @see https://docs.interstellio.io/ for official docs
 */

import type {
  InterstellioAuthRequest,
  InterstellioAuthResponse,
  InterstellioSubscriber,
  CreateSubscriberRequest,
  UpdateSubscriberRequest,
  SubscriberStatus,
  LastSeenQuery,
  InterstellioProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  InterstellioService,
  InterstellioVirtualServer,
  InterstellioWebhook,
  CreateWebhookRequest,
  InterstellioSession,
  DataAggregation,
  DataUsageQuery,
  DataUsageEntry,
  SubscriberCount,
  CreditStatus,
  PaginatedResponse,
  InterstellioError,
  ListQueryParams,
  SubscriberListParams,
} from './types'

// ============================================================================
// Configuration
// ============================================================================

const BASE_URLS = {
  identity: process.env.INTERSTELLIO_IDENTITY_URL || 'https://identity-za.nebularstack.com',
  subscriber: process.env.INTERSTELLIO_SUBSCRIBER_URL || 'https://subscriber-za.nebularstack.com',
  telemetry: process.env.INTERSTELLIO_TELEMETRY_URL || 'https://telemetry-za.nebularstack.com',
} as const

const DEFAULT_TIMEZONE = 'Africa/Johannesburg'

// ============================================================================
// Client Class
// ============================================================================

export class InterstellioClient {
  private token: string | null = null
  private tenantId: string | null = null
  private domain: string

  constructor(domain?: string) {
    this.domain = domain || process.env.INTERSTELLIO_DOMAIN || 'circletel.co.za'

    // Auto-initialize with pre-authenticated token if available
    if (process.env.INTERSTELLIO_API_TOKEN) {
      this.token = process.env.INTERSTELLIO_API_TOKEN
      this.tenantId = process.env.INTERSTELLIO_TENANT_ID || null
    }
  }

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  /**
   * Authenticate and get a JWT token
   */
  async authenticate(credentials: InterstellioAuthRequest): Promise<InterstellioAuthResponse> {
    const response = await fetch(`${BASE_URLS.identity}/v3/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw await this.handleError(response)
    }

    const data: InterstellioAuthResponse = await response.json()
    this.token = data.token
    this.tenantId = data.context.tenant_id
    return data
  }

  /**
   * Initialize client with existing token
   */
  setToken(token: string, tenantId: string): void {
    this.token = token
    this.tenantId = tenantId
  }

  /**
   * Revoke the current token
   */
  async revokeToken(): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.identity}/v3/token`)
    this.token = null
    this.tenantId = null
  }

  // --------------------------------------------------------------------------
  // Subscriber Accounts
  // --------------------------------------------------------------------------

  /**
   * List all subscribers with pagination
   */
  async listSubscribers(
    params?: SubscriberListParams
  ): Promise<PaginatedResponse<InterstellioSubscriber>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v1/subscribers${query}`)
  }

  /**
   * Get a single subscriber by ID
   */
  async getSubscriber(subscriberId: string): Promise<InterstellioSubscriber> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/subscriber/${subscriberId}`)
  }

  /**
   * Create a new subscriber account
   */
  async createSubscriber(data: CreateSubscriberRequest): Promise<InterstellioSubscriber> {
    return this.request('POST', `${BASE_URLS.subscriber}/v1/subscriber`, data)
  }

  /**
   * Update a subscriber account
   */
  async updateSubscriber(
    subscriberId: string,
    data: UpdateSubscriberRequest
  ): Promise<InterstellioSubscriber> {
    return this.request('PATCH', `${BASE_URLS.subscriber}/v1/subscriber/${subscriberId}`, data)
  }

  /**
   * Delete a subscriber account
   */
  async deleteSubscriber(subscriberId: string): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.subscriber}/v1/subscriber/${subscriberId}`)
  }

  /**
   * Get subscriber status (active state and data usage)
   */
  async getSubscriberStatus(subscriberId: string): Promise<SubscriberStatus> {
    return this.request('GET', `${BASE_URLS.subscriber}/v2/subscriber/status/${subscriberId}`)
  }

  /**
   * Find subscribers by last seen datetime
   */
  async findSubscribersByLastSeen(query: LastSeenQuery): Promise<InterstellioSubscriber[]> {
    return this.request('POST', `${BASE_URLS.subscriber}/v1/subscribers/last_seen`, query)
  }

  /**
   * Enable a subscriber
   */
  async enableSubscriber(subscriberId: string): Promise<InterstellioSubscriber> {
    return this.updateSubscriber(subscriberId, { enabled: true })
  }

  /**
   * Disable/suspend a subscriber
   */
  async disableSubscriber(subscriberId: string): Promise<InterstellioSubscriber> {
    return this.updateSubscriber(subscriberId, { enabled: false })
  }

  /**
   * Change subscriber's speed profile (upgrade/downgrade)
   */
  async changeSubscriberProfile(
    subscriberId: string,
    profileId: string
  ): Promise<InterstellioSubscriber> {
    return this.updateSubscriber(subscriberId, { profile_id: profileId })
  }

  // --------------------------------------------------------------------------
  // Subscriber Profiles (Speed Tiers)
  // --------------------------------------------------------------------------

  /**
   * List all subscriber profiles
   */
  async listProfiles(params?: ListQueryParams): Promise<PaginatedResponse<InterstellioProfile>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v1/profiles${query}`)
  }

  /**
   * Get a single profile by ID
   */
  async getProfile(profileId: string): Promise<InterstellioProfile> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/profile/${profileId}`)
  }

  /**
   * Create a new subscriber profile
   */
  async createProfile(data: CreateProfileRequest): Promise<InterstellioProfile> {
    return this.request('POST', `${BASE_URLS.subscriber}/v1/profile`, data)
  }

  /**
   * Update a subscriber profile
   */
  async updateProfile(profileId: string, data: UpdateProfileRequest): Promise<InterstellioProfile> {
    return this.request('PATCH', `${BASE_URLS.subscriber}/v1/profile/${profileId}`, data)
  }

  /**
   * Delete a subscriber profile
   */
  async deleteProfile(profileId: string): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.subscriber}/v1/profile/${profileId}`)
  }

  // --------------------------------------------------------------------------
  // Services
  // --------------------------------------------------------------------------

  /**
   * List all services
   */
  async listServices(params?: ListQueryParams): Promise<PaginatedResponse<InterstellioService>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v1/services${query}`)
  }

  /**
   * Get a single service by ID
   */
  async getService(serviceId: string): Promise<InterstellioService> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/service/${serviceId}`)
  }

  // --------------------------------------------------------------------------
  // Virtual Servers
  // --------------------------------------------------------------------------

  /**
   * List all virtual servers
   */
  async listVirtualServers(
    params?: ListQueryParams
  ): Promise<PaginatedResponse<InterstellioVirtualServer>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v1/virtuals${query}`)
  }

  /**
   * Get a single virtual server by ID
   */
  async getVirtualServer(virtualId: string): Promise<InterstellioVirtualServer> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/virtual/${virtualId}`)
  }

  // --------------------------------------------------------------------------
  // Sessions
  // --------------------------------------------------------------------------

  /**
   * List active sessions for a subscriber
   */
  async listSessions(
    subscriberId: string,
    params?: ListQueryParams
  ): Promise<PaginatedResponse<InterstellioSession>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v2/sessions/${subscriberId}${query}`)
  }

  /**
   * Get a single session by ID
   */
  async getSession(sessionId: string): Promise<InterstellioSession> {
    return this.request('GET', `${BASE_URLS.subscriber}/v2/session/${sessionId}`)
  }

  /**
   * Disconnect a single session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.subscriber}/v1/disconnect/${sessionId}`)
  }

  /**
   * Disconnect all sessions for a subscriber
   */
  async disconnectAllSessions(subscriberId: string): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.subscriber}/v1/disconnect/subscriber/${subscriberId}`)
  }

  // --------------------------------------------------------------------------
  // Telemetry & Usage
  // --------------------------------------------------------------------------

  /**
   * Get data usage for a subscriber
   */
  async getSubscriberUsage(
    subscriberId: string,
    aggregation: DataAggregation,
    query: DataUsageQuery
  ): Promise<DataUsageEntry[]> {
    const result = await this.request<{ payload?: DataUsageEntry[] } | DataUsageEntry[]>(
      'POST',
      `${BASE_URLS.telemetry}/v1/subscriber/${subscriberId}/data/${aggregation}`,
      query
    )
    if (Array.isArray(result)) {
      return result
    }
    return result.payload || []
  }

  /**
   * Get subscriber count (active/inactive)
   */
  async getSubscriberCount(): Promise<SubscriberCount> {
    return this.request('POST', `${BASE_URLS.subscriber}/v1/subscriber/count`)
  }

  /**
   * Get total subscriber count
   */
  async getTotalSubscriberCount(): Promise<number> {
    const result = await this.request<{ count?: number } | number>(
      'GET',
      `${BASE_URLS.subscriber}/v1/subscribers/count`
    )
    if (typeof result === 'number') {
      return result
    }
    return result.count || 0
  }

  // --------------------------------------------------------------------------
  // Credits
  // --------------------------------------------------------------------------

  /**
   * Get credit status for a subscriber
   */
  async getCreditStatus(subscriberId: string): Promise<CreditStatus> {
    return this.request(
      'GET',
      `${BASE_URLS.subscriber}/v1/subscriber/${subscriberId}/credit/status`
    )
  }

  // --------------------------------------------------------------------------
  // Webhooks
  // --------------------------------------------------------------------------

  /**
   * List all webhooks
   */
  async listWebhooks(params?: ListQueryParams): Promise<PaginatedResponse<InterstellioWebhook>> {
    const query = this.buildQuery(params)
    return this.request('GET', `${BASE_URLS.subscriber}/v1/webhooks${query}`)
  }

  /**
   * Create a webhook
   */
  async createWebhook(data: CreateWebhookRequest): Promise<InterstellioWebhook> {
    return this.request('POST', `${BASE_URLS.subscriber}/v1/webhooks`, data)
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request('DELETE', `${BASE_URLS.subscriber}/v1/webhooks/${webhookId}`)
  }

  /**
   * Get available webhook contexts
   */
  async getWebhookContexts(): Promise<string[]> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/webhooks/contexts`)
  }

  /**
   * Get available webhook triggers
   */
  async getWebhookTriggers(): Promise<string[]> {
    return this.request('GET', `${BASE_URLS.subscriber}/v1/webhooks/triggers`)
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.')
    }

    const headers: Record<string, string> = {
      'X-Auth-Token': this.token,
      'X-Domain': this.domain,
      'X-Timezone': DEFAULT_TIMEZONE,
      'Content-Type': 'application/json',
    }

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw await this.handleError(response)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  private async handleError(response: Response): Promise<Error> {
    let errorData: InterstellioError | null = null

    try {
      errorData = await response.json()
    } catch {
      // Response body is not JSON
    }

    const message = errorData?.error?.description || `HTTP ${response.status}: ${response.statusText}`

    const error = new Error(message) as Error & {
      status: number
      requestId?: string
    }
    error.status = response.status
    error.requestId = errorData?.error?.request_id

    return error
  }

  private buildQuery(params?: Record<string, unknown>): string {
    if (!params) return ''

    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    }

    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let clientInstance: InterstellioClient | null = null

/**
 * Get or create the Interstellio client singleton
 */
export function getInterstellioClient(): InterstellioClient {
  if (!clientInstance) {
    clientInstance = new InterstellioClient()
  }
  return clientInstance
}

/**
 * Create a new Interstellio client instance
 */
export function createInterstellioClient(domain?: string): InterstellioClient {
  return new InterstellioClient(domain)
}

// ============================================================================
// Exports
// ============================================================================

export * from './types'
