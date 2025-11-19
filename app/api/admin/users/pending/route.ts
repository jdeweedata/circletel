import { NextRequest, NextResponse } from 'next/server'
import { createClientWithSession, createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/users/pending
 * Fetch all pending admin access requests
 * Requires: Super Admin permission
 */
export async function GET(request: NextRequest) {
  try {
    // Session client (reads auth cookies)
    const supabaseSession = await createClientWithSession()

    // Get current user
    const { data: { user }, error: authError } = await supabaseSession.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Service-role client for privileged queries (bypasses RLS recursion)
    const supabase = await createClient()

    // Check if user is a super admin (enforced only in production)
    if (process.env.NODE_ENV === 'production') {
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role_template_id, role')
        .eq('id', user.id)
        .single()

      if (adminError || !adminUser || (adminUser.role !== 'super_admin' && adminUser.role_template_id !== 'super_admin')) {
        return NextResponse.json(
          { error: 'Forbidden: Super Admin access required' },
          { status: 403 }
        )
      }
    }

    // Fetch pending requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('pending_admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch pending requests', details: requestsError.message },
        { status: 500 }
      )
    }

    // Fetch role templates separately to enrich the data
    const { data: roleTemplates } = await supabase
      .from('role_templates')
      .select('id, name, description, department, level, color, icon')

    // Enrich pending requests with role template information
    const enrichedRequests = pendingRequests?.map(request => ({
      ...request,
      role_template: roleTemplates?.find(rt => rt.id === request.requested_role_template_id) || null
    }))

    return NextResponse.json({ data: enrichedRequests })
  } catch (error) {
    console.error('Error in GET /api/admin/users/pending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
