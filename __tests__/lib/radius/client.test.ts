import { createRadiusClient, getRadiusClient } from '../../../lib/radius'

describe('RadiusClient', () => {
  const baseUrl = 'https://radius.test'
  const token = 'test-token'

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('issues a voucher batch with bearer authentication and a JSON body', async () => {
    const response = { codes: ['ABC'] }
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => response,
    })
    const client = createRadiusClient({ baseUrl, token, fetch: mockFetch as typeof fetch })
    const input = {
      count: 1,
      profile: 'day-pass',
      priceCents: 500,
      agentCode: 'AGENT-1',
      expiresAt: '2026-08-25T06:00:00.000Z',
    }

    await expect(client.issueVoucherBatch(input)).resolves.toEqual(response)
    expect(mockFetch).toHaveBeenCalledWith(`${baseUrl}/v1/vouchers/batches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
  })

  it('throws the configured error shape when the API token is missing', () => {
    const previousUrl = process.env.RADIUS_API_URL
    const previousToken = process.env.RADIUS_API_TOKEN
    process.env.RADIUS_API_URL = baseUrl
    delete process.env.RADIUS_API_TOKEN

    try {
      expect(getRadiusClient).toThrow(
        expect.objectContaining({
          status: 500,
          code: 'RADIUS_NOT_CONFIGURED',
        })
      )
    } finally {
      if (previousUrl === undefined) delete process.env.RADIUS_API_URL
      else process.env.RADIUS_API_URL = previousUrl
      if (previousToken === undefined) delete process.env.RADIUS_API_TOKEN
      else process.env.RADIUS_API_TOKEN = previousToken
    }
  })

  it('throws a 401 response instead of swallowing it', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Unauthorized' }),
    })
    const client = createRadiusClient({ baseUrl, token, fetch: mockFetch as typeof fetch })

    await expect(client.listProfiles()).rejects.toMatchObject({ status: 401 })
  })

  it('disables a subscriber and returns the response body', async () => {
    const subscriber = {
      username: 'user/name',
      siteCode: 'SITE-1',
      profile: 'basic',
      paidThrough: '2026-08-31',
      enabled: false,
    }
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => subscriber,
    })
    const client = createRadiusClient({ baseUrl, token, fetch: mockFetch as typeof fetch })

    await expect(client.disableSubscriber('user/name')).resolves.toEqual(subscriber)
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/v1/subscribers/user%2Fname/disable`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )
  })

  it('uses a listed session identifier to disconnect that session', async () => {
    const mockFetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sessions: [{ sessionId: 'session-123' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ pod: true }),
      })
    const client = createRadiusClient({ baseUrl, token, fetch: mockFetch as typeof fetch })

    const sessions = await client.listSessions('subscriber-1')
    await expect(client.disconnectSession(sessions[0].sessionId)).resolves.toEqual({ pod: true })

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `${baseUrl}/v1/subscribers/subscriber-1/sessions`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: undefined,
      }
    )
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `${baseUrl}/v1/sessions/session-123/disconnect`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )
  })
})
