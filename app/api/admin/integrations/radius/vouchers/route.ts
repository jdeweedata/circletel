import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getRadiusClient, type IssueVoucherBatch } from '@/lib/radius'

export const dynamic = 'force-dynamic'

function isVoucherBatch(value: unknown): value is IssueVoucherBatch {
  if (!value || typeof value !== 'object') return false

  const input = value as Partial<IssueVoucherBatch>
  return Number.isInteger(input.count)
    && (input.count ?? 0) > 0
    && typeof input.profile === 'string'
    && input.profile.length > 0
    && Number.isInteger(input.priceCents)
    && (input.priceCents ?? -1) >= 0
    && typeof input.expiresAt === 'string'
    && !Number.isNaN(Date.parse(input.expiresAt))
    && (input.agentCode === undefined || typeof input.agentCode === 'string')
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const input: unknown = await request.json()
    if (!isVoucherBatch(input)) {
      return NextResponse.json(
        { error: 'Invalid voucher batch request' },
        { status: 400 }
      )
    }

    const result = await getRadiusClient().issueVoucherBatch(input)
    if (!Array.isArray(result.codes) || result.codes.length !== input.count) {
      return NextResponse.json(
        { error: 'RADIUS returned an incomplete voucher batch' },
        { status: 502 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    const status = error instanceof SyntaxError
      ? 400
      : error instanceof Error && 'status' in error
        ? Number((error as Error & { status: number }).status)
        : 500

    return NextResponse.json(
      { error: 'Failed to issue voucher batch' },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
