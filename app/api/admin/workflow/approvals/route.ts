import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Fetch approval queue items with related data
    const { data: approvals, error } = await supabase
      .from('product_approval_queue')
      .select(`
        *,
        import:product_imports(
          id,
          source_file,
          product_category,
          import_date
        ),
        assigned_user:admin_users!product_approval_queue_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        reviewed_user:admin_users!product_approval_queue_reviewed_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('status', ['pending', 'needs_review'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching approvals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch approvals' },
        { status: 500 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedApprovals = approvals?.map(approval => {
      const productData = approval.product_data as any;

      // Extract changes from product_data
      const changes: { field: string; old_value: string | null; new_value: string }[] = [];

      if (productData) {
        Object.keys(productData).forEach(key => {
          if (key !== 'metadata' && productData[key] !== null && productData[key] !== undefined) {
            changes.push({
              field: key,
              old_value: null, // For new products, old value is null
              new_value: String(productData[key])
            });
          }
        });
      }

      return {
        id: approval.id,
        type: 'product_create' as const, // Default to product_create, can be enhanced later
        title: approval.product_name,
        description: productData?.description || 'Product pending approval',
        submitted_by: {
          name: approval.assigned_user
            ? `${approval.assigned_user.first_name} ${approval.assigned_user.last_name}`
            : 'System',
          email: approval.assigned_user?.email || '',
          role: 'Product Manager'
        },
        submitted_at: approval.created_at,
        priority: approval.priority as 'low' | 'medium' | 'high' | 'urgent',
        category: approval.import?.product_category || 'General',
        changes,
        estimated_impact: {
          revenue: productData?.estimated_revenue || 'Not specified',
          users_affected: productData?.users_affected || 0,
          go_live_date: approval.approval_deadline || undefined
        },
        requires_review_from: ['super_admin', 'product_manager'],
        status: approval.status === 'needs_review' ? 'under_review' : 'pending'
      };
    }) || [];

    return NextResponse.json({
      approvals: transformedApprovals,
      total: transformedApprovals.length
    });
  } catch (error) {
    console.error('Unexpected error in workflow approvals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    const body = await request.json();
    const { approvalId, action, comment } = body;

    if (!approvalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updates: any = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      status: action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'approve') {
      updates.approval_notes = comment || null;
    } else {
      updates.rejection_reason = comment || null;
    }

    const { data, error } = await supabase
      .from('product_approval_queue')
      .update(updates)
      .eq('id', approvalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating approval:', error);
      return NextResponse.json(
        { error: 'Failed to update approval' },
        { status: 500 }
      );
    }

    // Log the action in activity log
    await supabase
      .from('product_approval_activity_log')
      .insert({
        approval_queue_id: approvalId,
        user_id: user.id,
        action: action === 'approve' ? 'approved' : 'rejected',
        details: { comment }
      });

    return NextResponse.json({
      success: true,
      approval: data
    });
  } catch (error) {
    console.error('Unexpected error updating approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
