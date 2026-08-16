/**
 * POST /api/admin/unjani/advance-stage
 *
 * Writes the evidence deriveStage() already reads:
 *   confirm_details → onboarding_submissions.status = approved
 *   request_changes → rejection_reason set, status stays submitted
 *   book_visit      → pending corporate_sites + customers.corporate_site_id
 *   go_live         → site active + installed_at
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, requirePermission } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import { CorporateSiteService } from '@/lib/corporate/site-service';
import {
  UNJANI_CORPORATE_CODE,
  canIssueRfsCertificate,
} from '@/lib/billing/unjani-connect-rules';
import { canGoLiveFromFulfilment } from '@/lib/admin/unjani-onsite';
import { activationSteps } from '@/lib/admin/unjani-portal-ops';
import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';
import {
  bookVisitNotes,
  confirmDetailsPatch,
  goLiveActivatePayload,
  requestChangesPatch,
  UNJANI_CONNECT_MONTHLY_FEE,
  UNJANI_CONNECT_PACKAGE_ID,
} from '@/lib/admin/unjani-advance-stage';
import {
  markNominationTicketInProgress,
  resolveActivationTicketsForSite,
} from '@/lib/admin/unjani-ticket-sync';
import { submissionRank } from '@/lib/portal/onboarding-stage';
import { apiLogger } from '@/lib/logging/logger';
import { inngest } from '@/lib/inngest/client';

type AdvanceAction = 'confirm_details' | 'request_changes' | 'book_visit' | 'go_live';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['ready', 'provisioned'],
  ready: ['provisioned'],
  provisioned: ['active'],
  active: ['suspended', 'decommissioned'],
  suspended: ['active'],
};

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if (!auth.success) return auth.response;
    const perm = requirePermission(auth.adminUser, ['customers:write', 'kyc:verify']);
    if (perm) return perm;

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '') as AdvanceAction;
    const customerId = typeof body.customerId === 'string' ? body.customerId : '';
    const siteId = typeof body.siteId === 'string' ? body.siteId : '';
    const ticketId = typeof body.ticketId === 'string' ? body.ticketId : '';

    if (!['confirm_details', 'request_changes', 'book_visit', 'go_live'].includes(action)) {
      return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    if (action !== 'go_live' && !customerId) {
      return NextResponse.json({ success: false, error: 'customerId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    if (action === 'confirm_details' || action === 'request_changes') {
      const { data: submissions, error } = await supabase
        .from('onboarding_submissions')
        .select('id, status, rejection_reason')
        .eq('customer_id', customerId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const latest = (submissions ?? []).sort(
        (a, b) => submissionRank(b.status) - submissionRank(a.status)
      )[0];

      if (!latest) {
        return NextResponse.json(
          { success: false, error: 'No clinic-details submission to review' },
          { status: 404 }
        );
      }

      let patch: Record<string, unknown>;
      try {
        patch =
          action === 'confirm_details'
            ? confirmDetailsPatch()
            : requestChangesPatch(String(body.reason || ''));
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'Invalid request' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('onboarding_submissions')
        .update({
          ...patch,
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: auth.adminUser.id,
        })
        .eq('id', latest.id);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, action, submissionId: latest.id });
    }

    if (action === 'book_visit') {
      const visitDate = String(body.visitDate || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
        return NextResponse.json(
          { success: false, error: 'visitDate is required (YYYY-MM-DD)' },
          { status: 400 }
        );
      }
      if (isVisitWindowBlocked(visitDate)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Installation visits must avoid the 25th to the 7th',
          },
          { status: 400 }
        );
      }

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, business_name, email, phone, first_name, last_name, clinic_details, corporate_site_id')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
      }

      const { data: stockOrder } = await supabase
        .from('unjani_install_orders')
        .select('id, stock_status')
        .eq('customer_id', customerId)
        .in('status', ['open', 'scheduled', 'in_progress'])
        .order('ordered_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (stockOrder && stockOrder.stock_status !== 'reserved') {
        return NextResponse.json(
          {
            success: false,
            error: 'Booking is blocked until the Unjani Connect kit is reserved',
          },
          { status: 400 }
        );
      }

      const notes = bookVisitNotes(visitDate, typeof body.notes === 'string' ? body.notes : undefined);

      if (customer.corporate_site_id) {
        const { error: noteError } = await supabase
          .from('corporate_sites')
          .update({ rfi_notes: notes, status: 'pending' })
          .eq('id', customer.corporate_site_id);
        if (noteError) {
          return NextResponse.json({ success: false, error: noteError.message }, { status: 500 });
        }
        await supabase.from('corporate_site_events').insert({
          site_id: customer.corporate_site_id,
          event_type: 'visit_booked',
          new_value: { visit_date: visitDate },
          performed_by: auth.adminUser.id,
          notes,
        });
        if (ticketId) await markNominationTicketInProgress(ticketId, customer.corporate_site_id);
        return NextResponse.json({
          success: true,
          action,
          siteId: customer.corporate_site_id,
        });
      }

      const { data: org, error: orgError } = await supabase
        .from('corporate_accounts')
        .select('id')
        .eq('corporate_code', UNJANI_CORPORATE_CODE)
        .maybeSingle();

      if (orgError || !org) {
        return NextResponse.json(
          { success: false, error: 'Unjani corporate account (UNJ) was not found' },
          { status: 404 }
        );
      }

      const clinicDetails = (customer.clinic_details ?? {}) as {
        site_address?: string;
        province?: string;
        clinic_name?: string;
      };
      const address = clinicDetails.site_address || customer.business_name || 'South Africa';
      const province = clinicDetails.province || '';

      const created = await CorporateSiteService.create({
        corporateId: org.id,
        siteName: customer.business_name || 'Unjani Clinic',
        siteContactName:
          [customer.first_name, customer.last_name].filter(Boolean).join(' ') || undefined,
        siteContactEmail: customer.email || undefined,
        siteContactPhone: customer.phone || undefined,
        installationAddress: {
          street: address,
          city: province || 'South Africa',
          province: province || undefined,
        },
        province: province || undefined,
        packageId: UNJANI_CONNECT_PACKAGE_ID,
        monthlyFee: UNJANI_CONNECT_MONTHLY_FEE,
        rfiNotes: notes,
      });

      if (!created.success || !created.site) {
        return NextResponse.json(
          { success: false, error: created.error || 'Failed to create pending site' },
          { status: 500 }
        );
      }

      await supabase
        .from('corporate_sites')
        .update({ status: 'pending' })
        .eq('id', created.site.id);

      const { error: linkError } = await supabase
        .from('customers')
        .update({ corporate_site_id: created.site.id })
        .eq('id', customerId);

      if (linkError) {
        return NextResponse.json({ success: false, error: linkError.message }, { status: 500 });
      }

      await supabase.from('corporate_site_events').insert({
        site_id: created.site.id,
        event_type: 'visit_booked',
        new_value: { visit_date: visitDate },
        performed_by: auth.adminUser.id,
        notes,
      });

      if (ticketId) await markNominationTicketInProgress(ticketId, created.site.id);

      return NextResponse.json({ success: true, action, siteId: created.site.id });
    }

    const { data: customer } = customerId
      ? await supabase
          .from('customers')
          .select('id, corporate_site_id')
          .eq('id', customerId)
          .maybeSingle()
      : { data: null };

    const resolvedSiteId = siteId || customer?.corporate_site_id;
    if (!resolvedSiteId) {
      return NextResponse.json(
        { success: false, error: 'siteId or a linked customer is required to go live' },
        { status: 400 }
      );
    }

    const { data: site, error: siteError } = await supabase
      .from('corporate_sites')
      .select(
        'id, site_name, status, corporate_id, service_id, package_id, monthly_fee, job_card_path, job_card_approved_at, survey_speedtest_path, commission_speedtest_path'
      )
      .eq('id', resolvedSiteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ success: false, error: 'Site not found' }, { status: 404 });
    }

    const { data: installOrder } = await supabase
      .from('unjani_install_orders')
      .select(
        'id, stock_status, kit_issued_at, survey_speedtest_path, commission_speedtest_path, job_card_path, job_card_approved_at'
      )
      .eq('corporate_site_id', site.id)
      .in('status', ['open', 'scheduled', 'in_progress', 'completed'])
      .order('ordered_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const rfsInput = {
      jobCardPath: installOrder?.job_card_path || site.job_card_path,
      jobCardApprovedAt: installOrder?.job_card_approved_at || site.job_card_approved_at,
      surveySpeedtestPath: installOrder?.survey_speedtest_path || site.survey_speedtest_path,
      commissionSpeedtestPath:
        installOrder?.commission_speedtest_path || site.commission_speedtest_path,
    };
    const fulfilmentReady = installOrder
      ? canGoLiveFromFulfilment({
          stockStatus: installOrder.stock_status,
          kitIssuedAt: installOrder.kit_issued_at,
          ...rfsInput,
        })
      : canIssueRfsCertificate(rfsInput);
    if (!fulfilmentReady) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Go live is blocked until the kit is issued, both Ookla screenshots are uploaded, and the job card is approved',
        },
        { status: 400 }
      );
    }

    const activateFields = goLiveActivatePayload({
      technology: typeof body.technology === 'string' ? body.technology : undefined,
      installedAt: typeof body.installedAt === 'string' ? body.installedAt : undefined,
      installedBy: typeof body.installedBy === 'string' ? body.installedBy : undefined,
      wholesaleOrderRef:
        typeof body.wholesaleOrderRef === 'string' ? body.wholesaleOrderRef : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });

    const steps = activationSteps(site.status);
    if (steps.length === 0) {
      await resolveActivationTicketsForSite(site.id);
      return NextResponse.json({ success: true, action, siteId: site.id, status: site.status });
    }

    let currentStatus = site.status;
    for (const nextStatus of steps) {
      const allowed = VALID_TRANSITIONS[currentStatus];
      if (!allowed || !allowed.includes(nextStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid transition: ${currentStatus} → ${nextStatus}` },
          { status: 400 }
        );
      }

      const updateFields: Record<string, unknown> = {
        status: nextStatus,
        technology: activateFields.technology,
        package_id: activateFields.package_id,
        monthly_fee: activateFields.monthly_fee,
      };
      if (activateFields.wholesale_order_ref) {
        updateFields.wholesale_order_ref = activateFields.wholesale_order_ref;
      }
      if (nextStatus === 'active') {
        updateFields.installed_at = activateFields.installed_at || new Date().toISOString();
        updateFields.rfs_issued_at = updateFields.installed_at;
        if (activateFields.installed_by) updateFields.installed_by = activateFields.installed_by;
      }

      const { error: updateError } = await supabase
        .from('corporate_sites')
        .update(updateFields)
        .eq('id', site.id);

      if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      await supabase.from('corporate_site_events').insert({
        site_id: site.id,
        event_type: `status_change:${currentStatus}→${nextStatus}`,
        old_value: { status: currentStatus },
        new_value: { status: nextStatus, ...updateFields },
        performed_by: auth.adminUser.id,
        notes: activateFields.notes || null,
      });

      currentStatus = nextStatus;
    }

    if (currentStatus === 'active') {
      if (installOrder?.id) {
        await supabase
          .from('unjani_install_orders')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', installOrder.id);
      }
      await inngest.send({
        name: 'b2b/site.activated',
        data: {
          site_id: site.id,
          organisation_id: site.corporate_id,
          activated_at: new Date().toISOString(),
          activated_by: auth.adminUser.id,
          package_id: activateFields.package_id,
          monthly_fee: activateFields.monthly_fee,
          service_id: site.service_id,
        },
      });
      try {
        await resolveActivationTicketsForSite(site.id);
      } catch (ticketError) {
        apiLogger.warn('[Unjani advance-stage] Activation ticket close-loop failed', {
          error: ticketError,
        });
      }
    }

    return NextResponse.json({ success: true, action, siteId: site.id, status: currentStatus });
  } catch (error: unknown) {
    apiLogger.error('[Unjani advance-stage] POST failed', { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
