import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLogger } from '@/lib/logging/logger';

/**
 * GET /api/admin/reminders
 * Get reminders for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('due_date', { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const pendingCount = reminders?.filter(r => r.status === 'pending').length || 0;

    return NextResponse.json({
      success: true,
      reminders,
      pending_count: pendingCount
    });

  } catch (error: any) {
    apiLogger.error('Error in GET /api/admin/reminders', { error });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/reminders
 * Create a new reminder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      due_date,
      reminder_type = 'one_time',
      related_entity_type,
      related_entity_id,
      notify_email = false
    } = body;

    if (!title || !due_date) {
      return NextResponse.json(
        { success: false, error: 'Title and due_date are required' },
        { status: 400 }
      );
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        title,
        description,
        due_date,
        reminder_type,
        related_entity_type,
        related_entity_id,
        notify_email
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reminder });

  } catch (error: any) {
    apiLogger.error('Error in POST /api/admin/reminders', { error });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

