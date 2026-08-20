import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { getInboxThread } from '@/lib/integrations/whatsapp/inbox-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const threadId = decodeURIComponent(id);

  try {
    const detail = await getInboxThread(threadId);
    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...detail });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
