import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { replyInboxThread } from '@/lib/integrations/whatsapp/inbox-service';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(request);
  if (!auth.success) return auth.response;

  const { id } = await params;
  const threadId = decodeURIComponent(id);
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const text = (body.text || '').trim();
  if (!text) {
    return NextResponse.json(
      { success: false, error: 'text is required' },
      { status: 400 }
    );
  }

  try {
    const result = await replyInboxThread(threadId, text);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
