import { createRadiusClient, getRadiusClient } from '@/lib/radius'

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
})
