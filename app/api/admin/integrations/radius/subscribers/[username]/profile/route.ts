import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getProviderForSite } from '@/lib/provisioning'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { siteId, profileId } = await request.json() as {
      siteId?: unknown
      profileId?: unknown
    }
    if (typeof siteId !== 'string' || !siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
    }
    if (typeof profileId !== 'string' || !profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    }

    const { username } = await context.params
    const provider = await getProviderForSite(siteId)
    return NextResponse.json(await provider.changeProfile(username, profileId))
  } catch (error) {
    const status = error instanceof SyntaxError
      ? 400
      : error instanceof Error && 'status' in error
        ? Number((error as Error & { status: number }).status)
        : 500

    return NextResponse.json(
      { error: 'Failed to change subscriber profile' },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
