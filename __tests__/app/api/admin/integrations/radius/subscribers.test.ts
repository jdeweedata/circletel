import { NextRequest } from 'next/server'
import {
  GET as listSubscribers,
  POST as createSubscriber,
} from '@/app/api/admin/integrations/radius/subscribers/route'
import { POST as disconnectSubscriber } from '@/app/api/admin/integrations/radius/subscribers/[username]/disconnect/route'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getProviderForSite } from '@/lib/provisioning'
import { RadiusSubscriberProvider } from '@/lib/provisioning/radius'

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}))

jest.mock('@/lib/provisioning', () => ({
  getProviderForSite: jest.fn(),
}))

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>
const mockGetProviderForSite = getProviderForSite as jest.MockedFunction<typeof getProviderForSite>
const create = jest.fn()
const listSessions = jest.fn()
const disconnectSession = jest.fn()
const siteId = '11111111-1111-4111-8111-111111111111'

const subscriber = {
  username: 'home-001',
  password: 'secret',
  profileId: 'home-20m',
  siteCode: 'SITE-1',
  paidThrough: '2026-09-24T00:00:00.000Z',
  virtualId: 'virtual-001',
  serviceId: 'service-001',
}

function request(path: string, body: Record<string, unknown>) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest
}

function getRequest(path: string) {
  return new Request(`http://localhost${path}`) as NextRequest
}

describe('RADIUS subscriber admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    create.mockResolvedValue(subscriber)
    mockGetProviderForSite.mockResolvedValue({
      kind: 'radius',
      createSubscriber: create,
      listSessions,
      disconnectSession,
    } as never)
  })

  it('rejects a non-UUID siteId before resolving a provider', async () => {
    const response = await createSubscriber(request(
      '/api/admin/integrations/radius/subscribers',
      { siteId: 'not-a-uuid', ...subscriber }
    ))

    expect(response.status).toBe(400)
    expect(mockGetProviderForSite).not.toHaveBeenCalled()
  })

  it('returns only subscribers from the selected RADIUS site', async () => {
    const client = {
      listSubscribers: jest.fn().mockResolvedValue([
        {
          username: 'home-001',
          siteCode: 'SITE-001',
          profile: 'home-20m',
          paidThrough: '2026-09-24T00:00:00.000Z',
          enabled: true,
        },
        {
          username: 'home-002',
          siteCode: 'SITE-002',
          profile: 'home-20m',
          paidThrough: '2026-09-24T00:00:00.000Z',
          enabled: true,
        },
      ]),
    }
    mockGetProviderForSite.mockResolvedValue(
      new RadiusSubscriberProvider(client as never, 'SITE-001')
    )

    const response = await listSubscribers(getRequest(
      `/api/admin/integrations/radius/subscribers?siteId=${siteId}`
    ))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      provider: 'radius',
      total: 1,
      items: [{ username: 'home-001', siteCode: 'SITE-001' }],
    })
  })

  it('accepts RADIUS creation without Interstellio fields', async () => {
    const { virtualId: _virtualId, serviceId: _serviceId, siteCode: _siteCode, ...radius } =
      subscriber

    const response = await createSubscriber(request(
      '/api/admin/integrations/radius/subscribers',
      { siteId, ...radius }
    ))

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(radius)
  })

  it('accepts Interstellio creation without paidThrough', async () => {
    mockGetProviderForSite.mockResolvedValue({
      kind: 'interstellio',
      createSubscriber: create,
    } as never)
    const {
      paidThrough: _paidThrough,
      siteCode: _siteCode,
      ...interstellio
    } = subscriber

    const response = await createSubscriber(request(
      '/api/admin/integrations/radius/subscribers',
      { siteId, ...interstellio }
    ))

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(interstellio)
  })

  it('rejects subscriber creation when a shared field is missing', async () => {
    const { password: _password, ...incompleteSubscriber } = subscriber

    const response = await createSubscriber(request(
      '/api/admin/integrations/radius/subscribers',
      { siteId, ...incompleteSubscriber }
    ))

    expect(response.status).toBe(400)
    expect(mockGetProviderForSite).toHaveBeenCalledWith(siteId)
  })

  it('counts pod false as failed and does not attempt stopped sessions', async () => {
    const client = {
      getSubscriber: jest.fn().mockResolvedValue({
        username: 'home-001',
        siteCode: 'SITE-001',
        profile: 'home-20m',
        paidThrough: '2026-09-24T00:00:00.000Z',
        enabled: true,
      }),
      listSessions: jest.fn().mockResolvedValue([
        { sessionId: 'session-1' },
        { sessionId: 'session-2' },
        { sessionId: 'session-stopped', stoppedAt: '2026-08-24T00:00:00.000Z' },
      ]),
      disconnectSession: jest.fn()
        .mockResolvedValueOnce({ pod: false })
        .mockResolvedValueOnce({ pod: true }),
    }
    mockGetProviderForSite.mockResolvedValue(
      new RadiusSubscriberProvider(client as never, 'SITE-001')
    )

    const response = await disconnectSubscriber(
      request(
        '/api/admin/integrations/radius/subscribers/home-001/disconnect',
        { siteId }
      ),
      { params: Promise.resolve({ username: 'home-001' }) }
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      attemptedSessions: 2,
      successfulSessions: 1,
      failedSessions: 1,
    })
    expect(client.disconnectSession).toHaveBeenCalledTimes(2)
    expect(client.disconnectSession).not.toHaveBeenCalledWith('session-stopped')
  })
})
