import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { getProviderForSite } from '@/lib/provisioning'
import { isUuid } from '../../validation'

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
    const { siteId } = await request.json() as { siteId?: unknown }
    if (!isUuid(siteId)) {
      return NextResponse.json({ error: 'siteId must be a UUID' }, { status: 400 })
    }

    const { username } = await context.params
    const provider = await getProviderForSite(siteId)
    const sessions = (await provider.listSessions(username)).filter(
      (session) => !session.stoppedAt
    )
    const results = await Promise.allSettled(
      sessions.map((session) => provider.disconnectSession(session.sessionId))
    )
    const successfulSessions = results.filter(
      (result) => result.status === 'fulfilled'
    ).length

    return NextResponse.json({
      success: true,
      attemptedSessions: sessions.length,
      successfulSessions,
      failedSessions: sessions.length - successfulSessions,
    })
  } catch (error) {
    const status = error instanceof SyntaxError
      ? 400
      : error instanceof Error && 'status' in error
        ? Number((error as Error & { status: number }).status)
        : 500

    return NextResponse.json(
      { error: 'Failed to disconnect subscriber sessions' },
      { status: status >= 400 && status < 600 ? status : 500 }
    )
  }
}
