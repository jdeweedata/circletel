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
import { buildActivationQueue, buildNominationQueue } from '@/lib/admin/unjani-portal-ops';
import {
  markNominationTicketInProgress,
  resolveActivationTicket,
} from '@/lib/admin/unjani-ticket-sync';
import { clinicKey, isNominatedCoverageCheck } from '@/lib/portal/coverage-summary';
import {
  countOnboardingStages,
  scopeOnboardingCustomers,
  stageClinicRefs,
} from '@/lib/portal/count-onboarding-stages';
import { fetchDeskStatusUpdates } from '@/lib/portal/create-desk-ticket';
import { billedSiteIdSet, unjaniDashboardKpis } from '@/lib/portal/dashboard-kpis';
import { buildUnjaniKpiLists } from '@/lib/admin/unjani-kpi-lists';
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
          .select('id, clinic_name, address, latitude, longitude, results, created_at')
          .eq('organisation_id', org.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('corporate_sites')
          .select('id, site_name, status, installed_at, monthly_fee')
          .eq('corporate_id', org.id),
        supabase.from('customers').select('id, business_name, corporate_site_id'),
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

    const siteList = sites ?? [];
    const siteIds = new Set(siteList.map((site) => site.id));
    const checkKeys = new Set((checks ?? []).map((check) => clinicKey(check.clinic_name)));
    const customerList = scopeOnboardingCustomers(customers ?? [], siteIds, checkKeys);
    const customerIds = customerList.map((customer) => customer.id);
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

    const nominatedChecks = (checks ?? []).filter(isNominatedCoverageCheck);
    const { stageCounts, stageByCustomerId, stageBySiteId } = countOnboardingStages({
      sites: siteList,
      customers: customerList,
      bestSubmission,
      linkSent,
      nominatedCheckKeys: nominatedChecks.map((check) => check.clinic_name ?? ''),
    });

    const siteCustomerIds = customerList
      .filter((customer) => customer.corporate_site_id && siteIds.has(customer.corporate_site_id))
      .map((customer) => customer.id);
    const { data: siteServices } = siteCustomerIds.length
      ? await supabase
          .from('customer_services')
          .select('customer_id, billing_start_date, status, active')
          .in('customer_id', siteCustomerIds)
      : { data: [] };

    const stageClinics = stageClinicRefs({
      sites: siteList,
      customers: customerList,
      stageBySiteId,
      stageByCustomerId,
      nominatedChecks,
    });

    const billedSiteIds = billedSiteIdSet(customerList, siteServices ?? []);
    const kpis = unjaniDashboardKpis({
      stageCounts,
      sites: siteList,
      coverageChecks: checks ?? [],
      stageBySiteId,
      billedSiteIds,
    });
    const kpiLists = buildUnjaniKpiLists({
      stageClinics,
      sites: siteList,
      coverageChecks: checks ?? [],
      billedSiteIds,
    });

    const pipelineStages: Record<string, { key: string; label: string }> = {};
    for (const [customerId, key] of Object.entries(stageByCustomerId)) {
      pipelineStages[customerId] = { key, label: stageDefinition(key).label };
    }
    for (const ref of stageClinics) {
      if (ref.customerId || !ref.siteId) continue;
      pipelineStages[`site:${ref.siteId}`] = {
        key: ref.stage,
        label: stageDefinition(ref.stage).label,
      };
    }

    const existingClinicNames = [
      ...siteList.map((site) => site.site_name),
      ...customerList.map((customer) => customer.business_name),
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
        sites: siteList,
      }),
      pipelineStages,
      stageCounts,
      stageClinics,
      kpis,
      kpiLists,
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
