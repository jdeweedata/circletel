/**
 * Unjani portal onboarding ops feed for Admin Clinic Onboarding.
 *
 * GET  /api/admin/unjani/portal-ops
 * POST /api/admin/unjani/portal-ops  { action, ticketId, siteId? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { UNJANI_CORPORATE_CODE } from '@/lib/billing/unjani-connect-rules';
import {
  buildActivationQueue,
  buildNominationQueue,
  portalStageForClinic,
} from '@/lib/admin/unjani-portal-ops';
import {
  markNominationTicketInProgress,
  resolveActivationTicket,
} from '@/lib/admin/unjani-ticket-sync';
import { fetchDeskStatusUpdates } from '@/lib/portal/create-desk-ticket';
import { submissionRank, stageDefinition } from '@/lib/portal/onboarding-stage';
import { apiLogger } from '@/lib/logging/logger';

const TICKET_COLUMNS =
  'id, subject, description, status, ticket_type, site_id, zoho_ticket_id, zoho_ticket_number, created_at, resolved_at';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const supabase = await createClient();

    const { data: org, error: orgError } = await supabase
      .from('corporate_accounts')
      .select('id, company_name, corporate_code')
      .eq('corporate_code', UNJANI_CORPORATE_CODE)
      .maybeSingle();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Unjani corporate account (UNJ) was not found' },
        { status: 404 }
      );
    }

    const [{ data: tickets }, { data: checks }, { data: sites }, { data: customers }] =
      await Promise.all([
        supabase
          .from('b2b_support_tickets')
          .select(TICKET_COLUMNS)
          .eq('organisation_id', org.id)
          .eq('ticket_type', 'activation_request')
          .order('created_at', { ascending: false }),
        supabase
          .from('b2b_coverage_checks')
          .select('id, clinic_name, address, results, created_at')
          .eq('organisation_id', org.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('corporate_sites')
          .select('id, site_name, status, installed_at')
          .eq('corporate_id', org.id),
        supabase
          .from('customers')
          .select('id, business_name, corporate_site_id, onboarding_status')
          .ilike('business_name', '%unjani%'),
      ]);

    const ticketRows = tickets ?? [];
    try {
      const updates = await fetchDeskStatusUpdates(ticketRows);
      for (const update of updates) {
        await supabase
          .from('b2b_support_tickets')
          .update({
            status: update.status,
            resolved_at: update.resolved_at,
            desk_status_synced_at: new Date().toISOString(),
          })
          .eq('id', update.id);
        const row = ticketRows.find((ticket) => ticket.id === update.id);
        if (row) {
          row.status = update.status;
          row.resolved_at = update.resolved_at;
        }
      }
    } catch (syncError) {
      apiLogger.warn('[Unjani portal-ops] Desk status sync failed', { error: syncError });
    }

    const customerIds = (customers ?? []).map((customer) => customer.id);
    const bestSubmission: Record<
      string,
      { status: string | null; rejection_reason: string | null }
    > = {};
    const linkSent = new Set<string>();

    if (customerIds.length > 0) {
      const [{ data: submissions }, { data: tokens }] = await Promise.all([
        supabase
          .from('onboarding_submissions')
          .select('customer_id, status, rejection_reason, submitted_at')
          .in('customer_id', customerIds),
        supabase
          .from('onboarding_tokens')
          .select('customer_id, sent_at')
          .in('customer_id', customerIds)
          .not('sent_at', 'is', null),
      ]);

      for (const submission of submissions ?? []) {
        const current = bestSubmission[submission.customer_id];
        if (!current || submissionRank(submission.status) > submissionRank(current.status)) {
          bestSubmission[submission.customer_id] = {
            status: submission.status,
            rejection_reason: submission.rejection_reason,
          };
        }
      }
      for (const token of tokens ?? []) linkSent.add(token.customer_id);
    }

    const siteById = new Map((sites ?? []).map((site) => [site.id, site]));
    const pipelineStages: Record<string, { key: string; label: string }> = {};

    for (const customer of customers ?? []) {
      const site = customer.corporate_site_id
        ? siteById.get(customer.corporate_site_id)
        : undefined;
      const submission = bestSubmission[customer.id];
      const key = portalStageForClinic({
        billingStage: customer.onboarding_status === 'in_progress' ? 'invited' : 'pending',
        siteStatus: site?.status ?? null,
        installedAt: site?.installed_at ?? null,
        submissionStatus: submission?.status ?? null,
        submissionRejectionReason: submission?.rejection_reason ?? null,
        onboardingLinkSent: linkSent.has(customer.id),
      });
      pipelineStages[customer.id] = { key, label: stageDefinition(key).label };
    }

    const existingClinicNames = [
      ...(sites ?? []).map((site) => site.site_name),
      ...(customers ?? []).map((customer) => customer.business_name),
    ];

    return NextResponse.json({
      organisationId: org.id,
      nominations: buildNominationQueue({
        tickets: ticketRows,
        coverageChecks: checks ?? [],
        existingClinicNames,
      }),
      activations: buildActivationQueue({
        tickets: ticketRows,
        sites: sites ?? [],
      }),
      pipelineStages,
    });
  } catch (error: unknown) {
    apiLogger.error('[Unjani portal-ops] GET failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');
    const ticketId = typeof body.ticketId === 'string' ? body.ticketId : '';
    const siteId = typeof body.siteId === 'string' ? body.siteId : null;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    if (action === 'mark_nomination') {
      await markNominationTicketInProgress(ticketId, siteId);
      return NextResponse.json({ success: true });
    }

    if (action === 'resolve_activation') {
      await resolveActivationTicket(ticketId, siteId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    apiLogger.error('[Unjani portal-ops] POST failed', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
