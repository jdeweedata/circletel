/**
 * Admin Lead Detail API
 * GET   /api/admin/leads/[id] — single coverage_lead
 * PATCH /api/admin/leads/[id] — update notes, status, assignment, next follow-up
 *
 * First-response SLA: when status moves new → non-new OR follow_up_notes is
 * updated while first_responded_at is null, stamp first_responded_at and
 * last_contacted_at.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { apiLogger } from '@/lib/logging/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set([
  'new',
  'contacted',
  'interested',
  'not_interested',
  'coverage_available',
  'converted_to_order',
  'lost',
  'follow_up_scheduled',
]);

type RouteContext = { params: Promise<{ id: string }> };

interface LeadPatchBody {
  follow_up_notes?: string | null;
  /** Alias for follow_up_notes */
  notes?: string | null;
  status?: string;
  assigned_admin_id?: string | null;
  next_follow_up_at?: string | null;
}

async function attachAssignedAdmin(
  supabase: SupabaseClient,
  lead: Record<string, unknown> | null
): Promise<Record<string, unknown> | null> {
  if (!lead) return lead;
  const assignedId = lead.assigned_admin_id as string | null | undefined;
  if (!assignedId) {
    return { ...lead, assigned_admin: null };
  }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, full_name, email')
    .eq('id', assignedId)
    .maybeSingle();

  return { ...lead, assigned_admin: admin ?? null };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from('coverage_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }
      apiLogger.error('[Admin Leads] GET one failed', { error, id });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const lead = await attachAssignedAdmin(supabase, row);

    return NextResponse.json({ success: true, lead });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Admin Leads] GET one error', { error: message });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead id is required' },
        { status: 400 }
      );
    }

    const body = (await request.json()) as LeadPatchBody;
    const supabase = await createClient();

    // Load current row for first-response + follow_up_count logic
    const { data: current, error: fetchError } = await supabase
      .from('coverage_leads')
      .select(
        'id, status, follow_up_notes, follow_up_count, first_responded_at, last_contacted_at'
      )
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }
      apiLogger.error('[Admin Leads] PATCH fetch failed', {
        error: fetchError.message,
        id,
      });
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const notesValue =
      body.follow_up_notes !== undefined
        ? body.follow_up_notes
        : body.notes !== undefined
          ? body.notes
          : undefined;

    const notesProvided = notesValue !== undefined;
    const statusProvided = body.status !== undefined;
    const assignmentProvided = body.assigned_admin_id !== undefined;
    const nextFollowUpProvided = body.next_follow_up_at !== undefined;

    if (
      !notesProvided &&
      !statusProvided &&
      !assignmentProvided &&
      !nextFollowUpProvided
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No updatable fields provided. Allowed: follow_up_notes|notes, status, assigned_admin_id, next_follow_up_at',
        },
        { status: 400 }
      );
    }

    if (statusProvided) {
      if (typeof body.status !== 'string' || !ALLOWED_STATUSES.has(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Allowed: ${Array.from(ALLOWED_STATUSES).join(', ')}`,
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (assignmentProvided) {
      // null / empty clears assignment
      if (body.assigned_admin_id !== null && body.assigned_admin_id !== '') {
        if (typeof body.assigned_admin_id !== 'string') {
          return NextResponse.json(
            {
              success: false,
              error: 'assigned_admin_id must be a uuid or null',
            },
            { status: 400 }
          );
        }
        updates.assigned_admin_id = body.assigned_admin_id;
      } else {
        updates.assigned_admin_id = null;
      }
    }

    if (nextFollowUpProvided) {
      updates.next_follow_up_at = body.next_follow_up_at || null;
    }

    if (notesProvided) {
      updates.follow_up_notes = notesValue;
      const prevNotes = current.follow_up_notes ?? '';
      const nextNotes = notesValue ?? '';
      if (prevNotes !== nextNotes) {
        const nowIso = new Date().toISOString();
        updates.last_contacted_at = nowIso;
        updates.follow_up_count = (current.follow_up_count ?? 0) + 1;
      }
    }

    // First-response stamp: status new→non-new OR notes updated, when still null
    const statusLeavingNew =
      statusProvided && current.status === 'new' && body.status !== 'new';

    const notesUpdated =
      notesProvided &&
      (current.follow_up_notes ?? '') !== (notesValue ?? '');

    if (
      current.first_responded_at == null &&
      (statusLeavingNew || notesUpdated)
    ) {
      const nowIso = new Date().toISOString();
      updates.first_responded_at = nowIso;
      if (!updates.last_contacted_at) {
        updates.last_contacted_at = nowIso;
      }
    }

    const { data: row, error: updateError } = await supabase
      .from('coverage_leads')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      apiLogger.error('[Admin Leads] PATCH update failed', {
        error: updateError,
        id,
      });
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    const lead = await attachAssignedAdmin(supabase, row);

    apiLogger.info('[Admin Leads] Lead updated', {
      id,
      fields: Object.keys(updates),
      adminId: authResult.adminUser.id,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    apiLogger.error('[Admin Leads] PATCH error', { error: message });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
