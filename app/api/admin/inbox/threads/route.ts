import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { listInboxThreads } from '@/lib/integrations/whatsapp/inbox-service';
import type { InboxChannel } from '@/lib/integrations/whatsapp/inbox-thread';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  const channelParam = request.nextUrl.searchParams.get('channel') || 'all';
  const channel =
    channelParam === 'sales' || channelParam === 'support' || channelParam === 'all'
      ? channelParam
      : 'all';

  try {
    const result = await listInboxThreads(channel as 'all' | InboxChannel);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
