import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/admin/integrations/radius/vouchers/route'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getRadiusClient } from '@/lib/radius'

jest.mock('@/lib/auth/admin-api-auth', () => ({
  authenticateAdmin: jest.fn(),
}))

jest.mock('@/lib/radius', () => ({
  getRadiusClient: jest.fn(),
}))

const mockAuthenticateAdmin = authenticateAdmin as jest.MockedFunction<typeof authenticateAdmin>
const mockGetRadiusClient = getRadiusClient as jest.MockedFunction<typeof getRadiusClient>
const issueVoucherBatch = jest.fn()

const voucherRequest = {
  count: 2,
  profile: 'voucher-24h',
  priceCents: 1000,
  expiresAt: '2026-08-25T09:00:00.000Z',
}

function request() {
  return new Request('http://localhost/api/admin/integrations/radius/vouchers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voucherRequest),
  }) as NextRequest
}

describe('POST /api/admin/integrations/radius/vouchers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetRadiusClient.mockReturnValue({ issueVoucherBatch } as never)
  })

  it('returns 401 when the request is unauthenticated', async () => {
    mockAuthenticateAdmin.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      error: 'No session',
    })

    const response = await POST(request())

    expect(response.status).toBe(401)
    expect(mockGetRadiusClient).not.toHaveBeenCalled()
  })

  it('issues an authenticated voucher batch and returns its codes', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    issueVoucherBatch.mockResolvedValue({ codes: ['ABC123', 'DEF456'] })

    const response = await POST(request())

    expect(response.status).toBe(200)
    expect(issueVoucherBatch).toHaveBeenCalledTimes(1)
    expect(issueVoucherBatch).toHaveBeenCalledWith(voucherRequest)
    await expect(response.json()).resolves.toEqual({ codes: ['ABC123', 'DEF456'] })
  })

  it('fails when the client returns fewer codes than requested', async () => {
    mockAuthenticateAdmin.mockResolvedValue({ success: true } as never)
    issueVoucherBatch.mockResolvedValue({ codes: ['ABC123'] })

    const response = await POST(request())

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.status).toBeLessThan(600)
  })
})
