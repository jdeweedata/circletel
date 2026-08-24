import type {
  CreateSubscriber,
  DateRange,
  IssueVoucherBatch,
  Profile,
  RadiusClientOptions,
  RadiusError,
  Session,
  Subscriber,
  Usage,
} from './types'

type CreateRadiusClientOptions = Partial<Omit<RadiusClientOptions, 'fetch'>> & {
  fetch?: typeof fetch
}

type ApiErrorBody = {
  code?: string
  message?: string
  error?: string | {
    code?: string
    message?: string
    description?: string
  }
}

function configurationError(): RadiusError {
  const error = new Error('RADIUS API is not configured') as RadiusError
  error.status = 500
  error.code = 'RADIUS_NOT_CONFIGURED'
  return error
}

export class RadiusClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly fetch: typeof fetch

  constructor(opts: RadiusClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '')
    this.token = opts.token
    this.fetch = opts.fetch ?? globalThis.fetch
  }

  issueVoucherBatch(input: IssueVoucherBatch): Promise<{ codes: string[] }> {
    return this.request('POST', '/v1/vouchers/batches', input)
  }

  createSubscriber(input: CreateSubscriber): Promise<Subscriber> {
    return this.request('POST', '/v1/subscribers', input)
  }

  enableSubscriber(username: string): Promise<Subscriber> {
    return this.request('POST', `/v1/subscribers/${encodeURIComponent(username)}/enable`, {})
  }

  disableSubscriber(username: string): Promise<Subscriber> {
    return this.request('POST', `/v1/subscribers/${encodeURIComponent(username)}/disable`, {})
  }

  changeProfile(username: string, profile: string): Promise<Subscriber> {
    return this.request(
      'POST',
      `/v1/subscribers/${encodeURIComponent(username)}/profile`,
      { profile }
    )
  }

  async listSessions(username: string): Promise<Session[]> {
    const response = await this.request<{ sessions: Session[] }>(
      'GET',
      `/v1/subscribers/${encodeURIComponent(username)}/sessions`
    )
    return response.sessions
  }

  disconnectSession(sessionId: string): Promise<{ pod: boolean }> {
    return this.request(
      'POST',
      `/v1/sessions/${encodeURIComponent(sessionId)}/disconnect`,
      {}
    )
  }

  getUsage(username: string, range: DateRange): Promise<Usage> {
    const query = new URLSearchParams()
    if (range.from) query.set('from', range.from.toISOString())
    if (range.to) query.set('to', range.to.toISOString())
    const suffix = query.size > 0 ? `?${query.toString()}` : ''

    return this.request(
      'GET',
      `/v1/subscribers/${encodeURIComponent(username)}/usage${suffix}`
    )
  }

  async listProfiles(): Promise<Profile[]> {
    const response = await this.request<{ profiles: string[] }>('GET', '/v1/profiles')
    return response.profiles.map((profile) => ({ id: profile, name: profile }))
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
      throw await this.toError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  private async toError(response: Response): Promise<RadiusError> {
    let body: ApiErrorBody | undefined

    try {
      body = await response.json() as ApiErrorBody
    } catch {
      body = undefined
    }

    const nestedError = typeof body?.error === 'object' ? body.error : undefined
    const message =
      body?.message ??
      (typeof body?.error === 'string' ? body.error : undefined) ??
      nestedError?.message ??
      nestedError?.description ??
      `HTTP ${response.status}: ${response.statusText}`
    const error = new Error(message) as RadiusError
    error.status = response.status
    error.code = body?.code ?? nestedError?.code
    return error
  }
}

let clientInstance: RadiusClient | null = null

export function getRadiusClient(): RadiusClient {
  if (clientInstance) return clientInstance

  const baseUrl = process.env.RADIUS_API_URL
  const token = process.env.RADIUS_API_TOKEN
  if (!baseUrl || !token) throw configurationError()

  clientInstance = new RadiusClient({ baseUrl, token })
  return clientInstance
}

export function createRadiusClient(opts: CreateRadiusClientOptions = {}): RadiusClient {
  const baseUrl = opts.baseUrl ?? process.env.RADIUS_API_URL
  const token = opts.token ?? process.env.RADIUS_API_TOKEN
  if (!baseUrl || !token) throw configurationError()

  return new RadiusClient({ baseUrl, token, fetch: opts.fetch })
}
