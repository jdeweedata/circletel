import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession, createClient } from '@/lib/supabase/server';
import type { CreateRoleInput } from '@/lib/types/role';

/**
 * GET /api/admin/roles
 * List all role templates
 * Requires: Super Admin permission
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('role_templates')
      .select('*')
      .order('department', { ascending: true })
      .order('level', { ascending: true });

    // Apply filters
    if (department) {
      query = query.eq('department', department);
    }
    if (level) {
      query = query.eq('level', level);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: roles, error: rolesError } = await query;

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch roles', details: rolesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/roles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create a new role template
 * Requires: Super Admin permission
 */
export async function POST(request: NextRequest) {
  try {
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
    const body: CreateRoleInput = await request.json();

    // Validate required fields
    if (!body.id || !body.name || !body.description || !body.department || !body.level || !body.permissions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name, description, department, level, permissions' },
        { status: 400 }
      );
    }

    // Validate ID format (lowercase, snake_case)
    const idPattern = /^[a-z][a-z0-9_]*$/;
    if (!idPattern.test(body.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format. Use lowercase letters, numbers, and underscores only (e.g., custom_role)' },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ['executive', 'management', 'staff', 'support'];
    if (!validLevels.includes(body.level)) {
      return NextResponse.json(
        { success: false, error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate permissions array
    if (!Array.isArray(body.permissions) || body.permissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Permissions must be a non-empty array' },
        { status: 400 }
      );
    }

    // Check if role ID already exists
    const { data: existingRole } = await supabase
      .from('role_templates')
      .select('id')
      .eq('id', body.id)
      .single();

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: `Role with ID '${body.id}' already exists` },
        { status: 409 }
      );
    }

    // Create role template
    const { data: newRole, error: insertError } = await supabase
      .from('role_templates')
      .insert({
        id: body.id,
        name: body.name,
        description: body.description,
        department: body.department,
        level: body.level,
        permissions: body.permissions,
        color: body.color || null,
        icon: body.icon || null,
        is_default: body.is_default || false,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating role:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create role', details: insertError.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('admin_audit_logs').insert({
      user_id: user.id,
      action: 'CREATE_ROLE',
      entity_type: 'role_templates',
      entity_id: newRole.id,
      changes: {
        role_id: newRole.id,
        role_name: newRole.name,
        department: newRole.department,
        level: newRole.level,
        permission_count: body.permissions.length,
      },
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Role '${newRole.name}' created successfully by ${adminUser.role}`);

    return NextResponse.json({
      success: true,
      data: newRole,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/roles:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
