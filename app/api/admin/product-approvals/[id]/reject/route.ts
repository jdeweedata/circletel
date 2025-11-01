import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/product-approvals/[id]/reject
 * Reject a product approval
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rejection_reason } = body;

    if (!rejection_reason) {
      return NextResponse.json({ success: false, error: 'Rejection reason is required' }, { status: 400 });
    }

    // 1. Get the approval queue item
    const { data: approval, error: fetchError } = await supabase
      .from('product_approval_queue')
      .select('*, import:product_imports(*)')
      .eq('id', id)
      .single();

    if (fetchError || !approval) {
      return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 });
    }

    if (approval.status !== 'pending' && approval.status !== 'needs_review') {
      return NextResponse.json({ success: false, error: 'Product already processed' }, { status: 400 });
    }

    // 2. Update approval queue item
    const { error: updateError } = await supabase
      .from('product_approval_queue')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating approval:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 3. Log activity
    await supabase
      .from('product_approval_activity_log')
      .insert({
        import_id: approval.import_id,
        approval_queue_id: id,
        user_id: user.id,
        action: 'rejected',
        details: { rejection_reason }
      });

    // 4. Create notification for the importer
    if (approval.import?.imported_by) {
      await supabase
        .from('notifications')
        .insert({
          user_id: approval.import.imported_by,
          title: 'Product Rejected',
          message: `Your product "${approval.product_name}" has been rejected. Reason: ${rejection_reason}`,
          type: 'warning',
          category: 'product_approval',
          related_entity_type: 'product_approval',
          related_entity_id: id,
          action_url: `/admin/products/approvals/${approval.import_id}`,
          action_label: 'View Details'
        });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in POST /api/admin/product-approvals/[id]/reject:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
