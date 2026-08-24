import { NextRequest } from 'next/server'
import { POST as createSubscriber } from '@/app/api/admin/integrations/radius/subscribers/route'
import { POST as disconnectSubscriber } from '@/app/api/admin/integrations/radius/subscribers/[username]/disconnect/route'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getProviderForSite } from '@/lib/provisioning'

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

describe('RADIUS subscriber admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    mockGetProviderForSite.mockResolvedValue({
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

  it('rejects subscriber creation when a required field is missing', async () => {
    const { password: _password, ...incompleteSubscriber } = subscriber

    const response = await createSubscriber(request(
      '/api/admin/integrations/radius/subscribers',
      { siteId, ...incompleteSubscriber }
    ))

    expect(response.status).toBe(400)
    expect(mockGetProviderForSite).not.toHaveBeenCalled()
  })

  it('settles failed disconnects and reports honest counts', async () => {
    listSessions.mockResolvedValue([
      { sessionId: 'session-1' },
      { sessionId: 'session-2' },
    ])
    disconnectSession
      .mockRejectedValueOnce(new Error('PoD unavailable'))
      .mockResolvedValueOnce(undefined)

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
    expect(disconnectSession).toHaveBeenCalledTimes(2)
  })
})
