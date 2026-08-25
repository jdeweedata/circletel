import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/admin/integrations/radius/estate/route'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getRadiusClient } from '@/lib/radius'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}))

jest.mock('@/lib/radius', () => {
  const actual = jest.requireActual('@/lib/radius') as typeof import('@/lib/radius')
  return {
    ...actual,
    getRadiusClient: jest.fn(),
  }
})

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>
const mockGetRadiusClient = getRadiusClient as jest.MockedFunction<typeof getRadiusClient>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const listEstate = jest.fn()

function request() {
  return new Request('http://localhost/api/admin/integrations/radius/estate') as NextRequest
}

function supabaseSites(rows: Array<Record<string, unknown>>) {
  const query = { select: '', order: '' }
  mockCreateClient.mockResolvedValue({
    from: () => ({
      select: (columns: string) => {
        query.select = columns
        return {
          order: async (column: string) => {
            query.order = column
            return { data: rows, error: null }
          },
        }
      },
    }),
  } as never)
  return query
}

describe('GET /api/admin/integrations/radius/estate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRadiusClient.mockReturnValue({ listEstate } as never)
  })

  it('returns 401 when the request is unauthenticated', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      error: 'No session',
    })

    const response = await GET(request())

    expect(response.status).toBe(401)
    expect(mockGetRadiusClient).not.toHaveBeenCalled()
  })

  it('reads corporate_sites.site_name and only lists owned RADIUS rows', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    const query = supabaseSites([
      {
        id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
        site_name: 'Unjani Clinic - Delmas',
        site_code: 'FWA-DELMAS-PILOT',
        radius_provider: 'radius',
        status: 'pending',
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        site_name: 'Other clinic',
        site_code: null,
        radius_provider: 'interstellio',
        status: 'active',
      },
    ])
    listEstate.mockResolvedValue({
      voucherCount: 0,
      voucherGrossCents: 0,
      sites: [
        {
          code: 'FWA-DELMAS-PILOT',
          name: 'Delmas',
          nasType: 'routeros',
          tunnelType: 'direct',
          overlayIp: null,
          isSite: false,
          openSessions: 0,
          voucherCount: 0,
          voucherGrossCents: 0,
          lastAcceptAt: null,
        },
      ],
    })

    const response = await GET(request())

    expect(query.select).toContain('site_name')
    expect(query.order).toBe('site_name')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      sites: [
        {
          id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
          name: 'Unjani Clinic - Delmas',
          siteCode: 'FWA-DELMAS-PILOT',
          isSite: false,
        },
      ],
    })
  })

  it('joins corporate sites to the FWA estate on site_code', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    supabaseSites([
      {
        id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
        site_name: 'Unjani Clinic - Delmas',
        site_code: 'FWA-DELMAS-PILOT',
        radius_provider: 'radius',
        status: 'pending',
      },
    ])
    listEstate.mockResolvedValue({
      voucherCount: 0,
      voucherGrossCents: 0,
      sites: [
        {
          code: 'FWA-DELMAS-PILOT',
          name: 'Delmas',
          nasType: 'routeros',
          tunnelType: 'direct',
          overlayIp: '10.10.0.2',
          openSessions: 0,
          voucherCount: 0,
          voucherGrossCents: 0,
          lastAcceptAt: null,
        },
      ],
    })

    const response = await GET(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      voucherCount: 0,
      voucherGrossCents: 0,
      sites: [
        {
          id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
          name: 'Unjani Clinic - Delmas',
          siteCode: 'FWA-DELMAS-PILOT',
          status: 'pending',
          radiusProvider: 'radius',
          nasType: 'routeros',
          tunnelType: 'direct',
          overlayIp: '10.10.0.2',
          isSite: true,
          openSessions: 0,
          voucherCount: 0,
          voucherGrossCents: 0,
          lastAcceptAt: null,
        },
      ],
    })
  })

  it('marks a flipped clinic without overlay as a candidate and an overlay NAS as a Site', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    supabaseSites([
      {
        id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
        site_name: 'Unjani Clinic - Delmas',
        site_code: 'FWA-DELMAS-PILOT',
        radius_provider: 'radius',
        status: 'pending',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        site_name: 'Lab generic NAS',
        site_code: 'LAB-GENERIC',
        radius_provider: 'radius',
        status: 'active',
      },
    ])
    listEstate.mockResolvedValue({
      voucherCount: 0,
      voucherGrossCents: 0,
      sites: [
        {
          code: 'FWA-DELMAS-PILOT',
          name: 'Delmas',
          nasType: 'routeros',
          tunnelType: 'direct',
          overlayIp: null,
          isSite: false,
          openSessions: 0,
          voucherCount: 0,
          voucherGrossCents: 0,
          lastAcceptAt: null,
        },
        {
          code: 'LAB-GENERIC',
          name: 'Lab generic NAS',
          nasType: 'generic',
          tunnelType: 'wireguard',
          overlayIp: '10.10.0.10',
          isSite: true,
          openSessions: 1,
          voucherCount: 0,
          voucherGrossCents: 0,
          lastAcceptAt: '2026-08-25T10:00:00.000Z',
        },
      ],
    })

    const response = await GET(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      sites: [
        {
          id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
          siteCode: 'FWA-DELMAS-PILOT',
          overlayIp: null,
          isSite: false,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Lab generic NAS',
          siteCode: 'LAB-GENERIC',
          overlayIp: '10.10.0.10',
          isSite: true,
        },
      ],
    })
  })

  it('still returns owned RADIUS rows when FWA is not configured', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    supabaseSites([
      {
        id: 'cfdccb00-9124-4eca-8080-9dbd90aa5059',
        site_name: 'Unjani Clinic - Delmas',
        site_code: 'FWA-DELMAS-PILOT',
        radius_provider: 'radius',
        status: 'pending',
      },
    ])
    const missing = Object.assign(new Error('RADIUS API is not configured'), {
      status: 500,
      code: 'RADIUS_NOT_CONFIGURED',
    })
    listEstate.mockRejectedValue(missing)

    const response = await GET(request())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      voucherCount: 0,
      sites: [
        {
          name: 'Unjani Clinic - Delmas',
          radiusProvider: 'radius',
          isSite: false,
          nasType: null,
          openSessions: 0,
        },
      ],
    })
  })
})
