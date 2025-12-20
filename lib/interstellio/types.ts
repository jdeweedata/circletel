/**
 * Interstellio (NebularStack) API Types
 *
 * Generated from: https://docs.interstellio.io/
 * Last Updated: 2025-12-15
 *
 * Use `/update-interstellio-docs` command to refresh documentation
 */

// ============================================================================
// Authentication
// ============================================================================

export interface InterstellioAuthRequest {
  domain: string
  username: string
  password: string
  otp?: string // Only if MFA enabled
}

export interface InterstellioAuthResponse {
  token: string
  token_id: string
  user_id: string
  username: string
  name: string
  roles: string[]
  context: {
    domain: string
    tenant_id: string
  }
  user_region?: string
  user_stack?: string
}

export interface InterstellioHeaders {
  'X-Auth-Token': string
  'X-Domain'?: string
  'X-Tenant-ID'?: string
  'X-Timezone'?: string
}

// ============================================================================
// Subscriber Accounts
// ============================================================================

export interface InterstellioSubscriber {
  id: string
  virtual_id: string
  service_id: string
  profile_id: string
  pool_id: string | null
  domain: string
  tenant_id: string
  name: string | null
  username: string
  calling_station_id: string | null
  static_ip4: string | null
  enabled: boolean
  creation_time: string
  updated_time: string
  expire: string | null
  timezone: string
  last_seen: string | null
  inactive_purge: boolean
  purge_if_seen: boolean
  service: string
  virtual: string
  profile: string
  uncapped_data: boolean
}

export interface CreateSubscriberRequest {
  virtual_id: string
  service_id: string
  profile_id: string
  username: string
  name?: string
  enabled?: boolean
  timezone?: string
  expire?: string
  calling_station_id?: string
  static_ip4?: string
  pool_id?: string
  inactive_purge?: boolean
  purge_if_seen?: boolean
  /**
   * PPPoE password for the subscriber.
   * NOTE: Password can only be set during creation - no update API exists.
   * Max 64 characters.
   */
  password?: string
}

export interface UpdateSubscriberRequest {
  name?: string
  username?: string
  enabled?: boolean
  expire?: string
  timezone?: string
  service_id?: string
  profile_id?: string
  pool_id?: string
  calling_station_id?: string
  static_ip4?: string
  inactive_purge?: boolean
  purge_if_seen?: boolean
}

export interface SubscriberStatus {
  active: boolean
  messages: string[]
  upload: string // GB
  download: string // GB
}

export interface LastSeenQuery {
  comparison: '>' | '<' | '>=' | '<='
  target_datetime: string
  not_seen?: boolean
  timezone?: string
}

// ============================================================================
// Subscriber Profiles (Speed Tiers)
// ============================================================================

export interface InterstellioProfile {
  id: string
  name: string
  domain: string
  uncapped_data: boolean
  upload: string // Mbit/s
  download: string // Mbit/s
  session_limit: number // 0 = unlimited, max 10
  pool_id: string | null
  pool_id_deactivate: string | null
  creation_time: string
}

export interface CreateProfileRequest {
  name: string
  download: string
  upload: string
  uncapped_data?: boolean
  session_limit?: number
  pool_id?: string
  pool_id_deactivate?: string
}

export interface UpdateProfileRequest {
  name?: string
  download?: string
  upload?: string
  uncapped_data?: boolean
  session_limit?: number
  pool_id?: string
  pool_id_deactivate?: string
}

// ============================================================================
// Service Profiles (RADIUS Configuration)
// ============================================================================

export interface InterstellioService {
  id: string
  name: string
  domain: string
  authentication: 'username+password' | 'username'
  pool_id: string | null
  pool_id_deactivate: string | null
  creation_time: string
}

export interface CreateServiceRequest {
  name: string
  authentication?: 'username+password' | 'username'
  pool_id?: string
  pool_id_deactivate?: string
}

export type SessionContext =
  | 'activate-login'
  | 'deactivate-login'
  | 'activate-coa'
  | 'deactivate-coa'
  | 'deactivate-pod'

export interface ContextAttribute {
  id: string
  attribute: string
  value: string
  ctx: SessionContext
  client_profile: string
  tag?: string
  creation_time: string
}

export interface CreateContextAttributeRequest {
  attribute: string
  client_profile: string
  ctx: SessionContext
  value: string
  tag?: string
}

// ============================================================================
// Virtual Servers & RADIUS Clients
// ============================================================================

export interface InterstellioVirtualServer {
  id: string
  domain: string
  name: string
}

export interface InterstellioClientProfile {
  id: string
  domain: string
  name: string
  description: string | null
}

export interface InterstellioRadiusClient {
  id: string
  virtual_id: string
  name: string
  type: 'nas' | 'proxy'
  profile: string
  secret: string
  ip4_address: string
  coa_port: number
  creation_time: string
}

export interface CreateRadiusClientRequest {
  name: string
  type: 'nas' | 'proxy'
  profile: string
  secret: string
  ip4_address: string
  coa_port: number
}

// ============================================================================
// Webhooks
// ============================================================================

export type WebhookContext = 'radius-authentication' | 'radius-accounting'

export type WebhookTrigger =
  | 'subscriber-authenticated'
  | 'subscriber-nas-updated'
  | 'subscriber-session-start'

export interface InterstellioWebhook {
  id: string
  domain: string
  url: string
  ssl_verify: boolean
  context: WebhookContext
  wh_trigger: WebhookTrigger
}

export interface CreateWebhookRequest {
  url: string
  ssl_verify: boolean
  context: WebhookContext
  wh_trigger: WebhookTrigger
}

export interface WebhookPayload {
  timestamp: string
  timezone: string
  context: WebhookContext
  trigger: WebhookTrigger
  subscriber: {
    id: string
    domain: string
    username: string
    tenant_id: string
    virtual_id: string
    last_known_nas_ip4: string
    calling_station_id: string | null
    profile_id: string
    service_id: string
  }
  radius_request: Record<string, unknown>
  radius_response: Record<string, unknown>
}

// ============================================================================
// Sessions
// ============================================================================

export interface InterstellioSession {
  id: string
  subscriber_id: string
  username: string
  realm: string | null
  calling_station_id: string | null
  framed_ip_address: string | null
  ctx: SessionContext
  start_time: string
  updated_time: string
  nas_ip_address: string
  nas_port: number
}

// ============================================================================
// Telemetry & Usage
// ============================================================================

export type DataAggregation = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface DataUsageQuery {
  start: string
  end: string
}

export interface DataUsageEntry {
  time: string
  download_kb: number
  upload_kb: number
  combined_kb: number
  download_kbps?: number
  upload_kbps?: number
}

export interface SubscriberCount {
  active: number
  inactive: number
  total: number
}

export interface TopUserEntry {
  subscriber_id: string
  username: string
  download_kb: number
  upload_kb: number
  combined_kb: number
}

export interface CDRRecord {
  id: string
  subscriber_id: string
  username: string
  start_time: string
  stop_time: string | null
  framed_ip_address: string
  calling_station_id: string | null
  download_kb: number
  upload_kb: number
  session_time: number
}

/**
 * CDR Record from telemetry API (POST /v1/subscriber/{id}/cdr/records)
 * This is the actual response format from the NebularStack telemetry service
 */
export interface TelemetryCDRRecord {
  id: string
  start_time: string
  update_time: string
  acct_unique_id: string
  username: string
  calling_station_id: string | null
  called_station_id: string | null
  nas_ip_address: string
  client_ip_address: string | null
  duration: number // Duration in seconds
  terminate_cause: string | null // e.g., "Lost-Carrier", "User-Request", null for active sessions
}

export interface CDRQuery {
  start_time: string // ISO 8601 format with timezone, e.g., "2025-12-19T00:00:00+02:00"
  end_time: string // ISO 8601 format with timezone, e.g., "2025-12-19T23:59:59+02:00"
}

/**
 * Session status analysis result
 */
export interface SessionAnalysis {
  isActive: boolean
  lastSession: TelemetryCDRRecord | null
  totalSessionsToday: number
  totalDurationSeconds: number
  terminateCauses: Record<string, number>
}

// ============================================================================
// Credits (Data Caps)
// ============================================================================

export interface InterstellioCredit {
  id: string
  subscriber_id: string
  credit_profile_id: string
  volume_gb: number
  used_gb: number
  remaining_gb: number
  start_hour: number
  end_hour: number
  expires: string | null
  creation_time: string
}

export interface CreateCreditRequest {
  subscriber_id: string
  credit_profile_id: string
  volume_gb: number
  expires?: string
}

export interface CreditStatus {
  total_gb: number
  used_gb: number
  remaining_gb: number
  is_capped: boolean
  credits: InterstellioCredit[]
}

// ============================================================================
// Routes
// ============================================================================

export interface InterstellioRoute {
  id: string
  subscriber_id: string
  ip_prefix: string
  ipv: '4' | '6'
  metric1: number
  metric2: number
  metric3: number
  pref: number
  tag: string | null
}

export interface CreateRouteRequest {
  ip_prefix: string
  ipv: '4' | '6'
  metric1?: number
  metric2?: number
  metric3?: number
  pref?: number
  tag?: string
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface PaginationMetadata {
  records: number
  page: number
  pages: number
  per_page: number
}

export interface PaginatedResponse<T> {
  payload: T[]
  metadata: PaginationMetadata
}

export interface InterstellioError {
  error: {
    title: string
    description: string
    request_id: string
  }
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface ListQueryParams {
  id?: string
  name?: string
  l?: number // limit (1-50, -1 for streaming)
  p?: number // page
  sc?: string // sort column
  sd?: 'asc' | 'desc' // sort direction
  [key: string]: string | number | undefined // Index signature for Record<string, unknown> compatibility
}

export interface SubscriberListParams extends ListQueryParams {
  username?: string
  calling_station_id?: string
}

// ============================================================================
// CircleTel Integration Types
// ============================================================================

/**
 * Maps CircleTel service package to Interstellio profile
 */
export interface PackageProfileMapping {
  circletel_package_id: string
  interstellio_profile_id: string
  interstellio_service_id: string
  interstellio_virtual_id: string
}

/**
 * Customer service provisioning data
 */
export interface ProvisioningData {
  customer_id: string
  service_id: string
  username: string
  password: string
  package_id: string
  mac_address?: string
  static_ip?: string
  timezone: string
}

/**
 * Webhook handler response for CircleTel processing
 */
export interface WebhookHandlerResult {
  success: boolean
  action: 'session_started' | 'nas_updated' | 'authenticated' | 'ignored'
  subscriber_id?: string
  error?: string
}
