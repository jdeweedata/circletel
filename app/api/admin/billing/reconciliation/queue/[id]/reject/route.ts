import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { reason, admin_user_id } = body as {
      reason?: string;
      admin_user_id?: string;
    };

    const supabase = await createClient();

    const { data: queueItem, error: fetchError } = await supabase
      .from('reconciliation_queue')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !queueItem) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    if (queueItem.status !== 'pending') {
      return NextResponse.json(
        { error: `Item already ${queueItem.status}` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('reconciliation_queue')
      .update({
        status: 'rejected',
        resolved_by: admin_user_id || null,
        resolved_at: now,
        resolution_notes: reason || 'Rejected by admin',
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to reject: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
