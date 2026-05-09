import { NextRequest, NextResponse } from 'next/server'
import { createClientWithSession, createClient } from '@/lib/supabase/server'
import { authenticateAdmin } from '@/lib/auth/admin-api-auth'
import { apiLogger } from '@/lib/logging/logger'

/**
 * GET /api/admin/users/pending
 * Fetch all pending admin access requests
 * Requires: Super Admin permission
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request)
    if (!authResult.success) return authResult.response

    // Service-role client for privileged queries (bypasses RLS recursion)
    const supabase = await createClient()

    // Fetch pending requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('pending_admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (requestsError) {
      apiLogger.error('Error fetching pending requests', { error: requestsError })
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
    apiLogger.error('Error in GET /api/admin/users/pending', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

