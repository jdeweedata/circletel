import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/notifications
 * Get notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unread_only = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unread_only) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    return NextResponse.json({
      success: true,
      notifications,
      unread_count: unreadCount
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
