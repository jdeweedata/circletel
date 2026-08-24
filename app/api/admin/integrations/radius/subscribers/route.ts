import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import {
  getProviderForSite,
  type CreateSubscriber,
  type ListQuery,
} from '@/lib/provisioning'

export const dynamic = 'force-dynamic'

function errorResponse(error: unknown, message: string) {
  const status = error instanceof SyntaxError
    ? 400
    : error instanceof Error && 'status' in error
      ? Number((error as Error & { status: number }).status)
      : 500

  return NextResponse.json(
    { error: message },
    { status: status >= 400 && status < 600 ? status : 500 }
  )
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    const query: ListQuery = {
      page: Number(searchParams.get('page') ?? 1),
      perPage: Number(searchParams.get('perPage') ?? 20),
      search: searchParams.get('search') ?? undefined,
    }
    const provider = await getProviderForSite(siteId)
    return NextResponse.json(await provider.listSubscribers(query))
  } catch (error) {
    return errorResponse(error, 'Failed to list subscribers')
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json() as Record<string, unknown>
    const { siteId, ...subscriber } = body
    if (typeof siteId !== 'string' || !siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }

    const provider = await getProviderForSite(siteId)
    return NextResponse.json(
      await provider.createSubscriber(subscriber as unknown as CreateSubscriber),
      { status: 201 }
    )
  } catch (error) {
    return errorResponse(error, 'Failed to create subscriber')
  }
}
