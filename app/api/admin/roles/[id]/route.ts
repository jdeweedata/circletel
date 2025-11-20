import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import type { UpdateRoleInput } from '@/lib/types/role';

/**
 * GET /api/admin/roles/[id]
 * Fetch a single role template by ID
 * Requires: Super Admin permission
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Check if user is a super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role_template_id, role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || (adminUser.role !== 'super_admin' && adminUser.role_template_id !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    // Fetch role with user count
    const { data: role, error: roleError } = await supabase
      .from('role_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Get user count for this role
    const { count: userCount } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role_template_id', id)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      data: {
        ...role,
        user_count: userCount || 0,
      },
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/roles/[id]:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/roles/[id]
 * Update an existing role template
 * Requires: Super Admin permission
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Check if user is a super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role_template_id, role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || (adminUser.role !== 'super_admin' && adminUser.role_template_id !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateRoleInput = await request.json();

    // Validate level if provided
    if (body.level) {
      const validLevels = ['executive', 'management', 'staff', 'support'];
      if (!validLevels.includes(body.level)) {
        return NextResponse.json(
          { success: false, error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate permissions array if provided
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Permissions must be a non-empty array' },
          { status: 400 }
        );
      }
    }

    // Get existing role to check if it exists
    const { data: existingRole, error: fetchError } = await supabase
      .from('role_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check how many users are assigned to this role (for warning purposes)
    const { count: userCount } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role_template_id', id)
      .eq('is_active', true);

    // Update role template
    const { data: updatedRole, error: updateError } = await supabase
      .from('role_templates')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating role:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update role', details: updateError.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('admin_audit_logs').insert({
      user_id: user.id,
      action: 'UPDATE_ROLE',
      entity_type: 'role_templates',
      entity_id: id,
      changes: {
        role_id: id,
        updated_fields: Object.keys(body),
        affected_users: userCount || 0,
      },
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Role '${updatedRole.name}' updated successfully by ${adminUser.role}`);
    if (userCount && userCount > 0) {
      console.log(`   ⚠️ This role is assigned to ${userCount} active users`);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRole,
        user_count: userCount || 0,
      },
    });
  } catch (error) {
    console.error(`Error in PUT /api/admin/roles/[id]:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[id]
 * Soft delete a role template (set is_active = false)
 * Requires: Super Admin permission
 * Restriction: Cannot delete if users are assigned to this role
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Session client to read the authenticated user from cookies
    const supabaseSession = await createClientWithSession();

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Service-role client for privileged operations
    const supabase = await createClient();

    // Check if user is a super admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role_template_id, role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || (adminUser.role !== 'super_admin' && adminUser.role_template_id !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    // Get existing role
    const { data: existingRole, error: fetchError } = await supabase
      .from('role_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if any users are assigned to this role
    const { count: userCount } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('role_template_id', id)
      .eq('is_active', true);

    if (userCount && userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role: ${userCount} active user(s) are assigned to this role`,
          details: 'Please reassign users to another role before deleting',
        },
        { status: 400 }
      );
    }

    // Soft delete (set is_active = false)
    const { error: deleteError } = await supabase
      .from('role_templates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting role:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete role', details: deleteError.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('admin_audit_logs').insert({
      user_id: user.id,
      action: 'DELETE_ROLE',
      entity_type: 'role_templates',
      entity_id: id,
      changes: {
        role_id: id,
        role_name: existingRole.name,
        action: 'soft_delete',
      },
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Role '${existingRole.name}' deleted successfully by ${adminUser.role}`);

    return NextResponse.json({
      success: true,
      message: `Role '${existingRole.name}' has been deactivated`,
    });
  } catch (error) {
    console.error(`Error in DELETE /api/admin/roles/[id]:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
