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
      .select('*')
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

    // Fetch related user and import data separately to avoid FK issues
    const userIds = new Set<string>();
    const importIds = new Set<string>();

    approvals?.forEach(approval => {
      if (approval.assigned_to) userIds.add(approval.assigned_to);
      if (approval.reviewed_by) userIds.add(approval.reviewed_by);
      if (approval.import_id) importIds.add(approval.import_id);
    });

    // Fetch users
    const { data: users } = await supabase
      .from('admin_users')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(userIds));

    // Fetch imports
    const { data: imports } = await supabase
      .from('product_imports')
      .select('id, source_file, product_category, import_date')
      .in('id', Array.from(importIds));

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);
    const importsMap = new Map(imports?.map(i => [i.id, i]) || []);

    // Transform the data to match the frontend interface
    const transformedApprovals = approvals?.map(approval => {
      const productData = approval.product_data as any;
      const assignedUser = approval.assigned_to ? usersMap.get(approval.assigned_to) : null;
      const importData = approval.import_id ? importsMap.get(approval.import_id) : null;

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
          name: assignedUser
            ? `${assignedUser.first_name} ${assignedUser.last_name}`
            : 'System',
          email: assignedUser?.email || '',
          role: 'Product Manager'
        },
        submitted_at: approval.created_at,
        priority: approval.priority as 'low' | 'medium' | 'high' | 'urgent',
        category: importData?.product_category || 'General',
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
