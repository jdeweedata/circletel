/**
 * Admin Leads Queue API
 * GET /api/admin/leads — list coverage_leads for follow-up queue
 *
 * Query params:
 * - status
 * - assigned_admin_id (uuid | "unassigned")
 * - overdue ("true" | "1") — first_response_due_at < now AND first_responded_at is null AND status=new
 * - q — search first_name, last_name, phone, email
 * - lead_source
 * - limit (default 50, max 100)
 * - offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIST_SELECT = [
  'id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'company_name',
  'customer_type',
  'status',
  'lead_source',
  'source_campaign',
  'assigned_admin_id',
  'follow_up_notes',
  'last_contacted_at',
  'next_follow_up_at',
  'follow_up_count',
  'first_response_due_at',
  'first_responded_at',
  'zoho_lead_id',
  'zoho_sync_status',
  'zoho_sync_error',
  'zoho_synced_at',
  'address',
  'suburb',
  'city',
  'province',
  'created_at',
  'updated_at',
  'assigned_admin:admin_users!coverage_leads_assigned_admin_id_fkey(id,full_name,email)',
].join(',');

/** Strip PostgREST filter metacharacters from free-text search. */
function sanitizeSearch(q: string): string {
  return q.replace(/[%_,.()]/g, ' ').replace(/\s+/g, ' ').trim();
}

type ListFilters = {
  status: string | null;
  assignedAdminId: string | null;
  isOverdue: boolean;
  leadSource: string | null;
  q: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLeadFilters(query: any, filters: ListFilters) {
  let q = query;

  if (filters.isOverdue) {
    // SLA breach: still new, never responded, past first-response due
    q = q
      .eq('status', 'new')
      .is('first_responded_at', null)
      .lt('first_response_due_at', new Date().toISOString());
  } else if (filters.status) {
    q = q.eq('status', filters.status);
  }

  if (filters.assignedAdminId) {
    if (
      filters.assignedAdminId === 'unassigned' ||
      filters.assignedAdminId === 'null'
    ) {
      q = q.is('assigned_admin_id', null);
    } else {
      q = q.eq('assigned_admin_id', filters.assignedAdminId);
    }
  }

  if (filters.leadSource) {
    q = q.eq('lead_source', filters.leadSource);
  }

  if (filters.q) {
    const term = sanitizeSearch(filters.q);
    if (term) {
      q = q.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }
  }

  return q;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLeadOrder(query: any, isOverdue: boolean) {
  if (isOverdue) {
    return query
      .order('first_response_due_at', { ascending: true })
      .order('created_at', { ascending: false });
  }
  return query.order('created_at', { ascending: false });
}

function isRelationshipError(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === 'PGRST200' ||
    !!error.message?.includes('coverage_leads_assigned_admin_id_fkey') ||
    !!error.message?.includes('Could not find a relationship')
  );
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const filters: ListFilters = {
      status: searchParams.get('status'),
      assignedAdminId: searchParams.get('assigned_admin_id'),
      isOverdue: ['true', '1', 'yes'].includes(
        (searchParams.get('overdue') || '').toLowerCase()
      ),
      leadSource: searchParams.get('lead_source'),
      q: searchParams.get('q'),
    };

    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1),
      100
    );
    const offset = Math.max(
      parseInt(searchParams.get('offset') || '0', 10) || 0,
      0
    );

    const base = applyLeadOrder(
      applyLeadFilters(
        supabase.from('coverage_leads').select(LIST_SELECT, { count: 'exact' }),
        filters
      ),
      filters.isOverdue
    ).range(offset, offset + limit - 1);

    const { data: leads, error, count } = await base;

    if (error) {
      if (isRelationshipError(error)) {
        apiLogger.warn(
          '[Admin Leads] FK embed failed; falling back to flat select',
          { error: error.message }
        );

        const fallback = applyLeadOrder(
          applyLeadFilters(
            supabase.from('coverage_leads').select('*', { count: 'exact' }),
            filters
          ),
          filters.isOverdue
        ).range(offset, offset + limit - 1);

        const retry = await fallback;
        if (retry.error) {
          apiLogger.error('[Admin Leads] List query failed', {
            error: retry.error,
          });
          return NextResponse.json(
            { success: false, error: retry.error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          leads: retry.data ?? [],
          total_count: retry.count ?? 0,
          limit,
          offset,
        });
      }

      apiLogger.error('[Admin Leads] List query failed', { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      leads: leads ?? [],
      total_count: count ?? 0,
      limit,
      offset,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Admin Leads] GET list error', { error: message });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
