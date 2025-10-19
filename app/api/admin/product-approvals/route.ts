import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

/**
 * GET /api/admin/product-approvals
 * Get all pending product approvals
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const import_id = searchParams.get('import_id');

    // Build query
    let query = supabase
      .from('product_approval_queue')
      .select(`
        *,
        import:product_imports(id, product_category, source_file, import_date),
        assigned_user:admin_users!assigned_to(id, email, full_name),
        reviewed_user:admin_users!reviewed_by(id, email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (import_id) {
      query = query.eq('import_id', import_id);
    }

    const { data: approvals, error } = await query;

    if (error) {
      console.error('Error fetching approvals:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approvals,
      total_count: approvals?.length || 0
    });

  } catch (error: any) {
    console.error('Error in GET /api/admin/product-approvals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
