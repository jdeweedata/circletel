import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniAdmin } from '@/lib/admin/require-unjani-admin';
import { createFieldJob } from '@/lib/services/technician-service';
import { bookVisitNotes } from '@/lib/admin/unjani-advance-stage';
import { assertScheduleAllowed } from '@/lib/admin/unjani-warehouse';
import { installJobType } from '@/lib/admin/unjani-install-schedule';
import { recommendedAccess } from '@/lib/portal/coverage-summary';
import {
  issueKitForOrder,
  receiveReplenishmentsForOrder,
  tryReserveOpenOrder,
} from '@/lib/admin/unjani-install-orders';
import { uploadFile } from '@/lib/storage/supabase-upload';
import { canIssueRfsCertificate } from '@/lib/billing/unjani-connect-rules';
import { apiLogger } from '@/lib/logging/logger';

const UPLOAD_KINDS = ['survey_speedtest', 'commission_speedtest', 'job_card'] as const;
type UploadKind = (typeof UPLOAD_KINDS)[number];

async function loadOrder(supabase: { from: (table: string) => any }, id: string, orgId: string) {
  const { data, error } = await supabase
    .from('unjani_install_orders')
    .select('*')
    .eq('id', id)
    .eq('organisation_id', orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUnjaniAdmin(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const order = await loadOrder(auth.supabase, id, auth.org.id);
    if (!order) {
      return NextResponse.json({ error: 'Install order not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const kind = String(form.get('kind') || '') as UploadKind;
      const file = form.get('file');
      if (!UPLOAD_KINDS.includes(kind) || !(file instanceof File)) {
        return NextResponse.json(
          { error: 'kind (survey_speedtest | commission_speedtest | job_card) and file are required' },
          { status: 400 }
        );
      }
      const uploaded = await uploadFile(file, {
        bucket: 'kyc-documents',
        folder: `unjani-connect/${order.corporate_site_id || order.id}/${kind}`,
        maxSizeBytes: 8 * 1024 * 1024,
        supabaseClient: auth.supabase,
      });
      if (!uploaded.success || !uploaded.path) {
        return NextResponse.json({ error: uploaded.error || 'Upload failed' }, { status: 400 });
      }

      const now = new Date().toISOString();
      const orderPatch: Record<string, unknown> = { updated_at: now };
      const sitePatch: Record<string, unknown> = {};
      if (kind === 'survey_speedtest') {
        orderPatch.survey_speedtest_path = uploaded.path;
        orderPatch.survey_speedtest_uploaded_at = now;
        sitePatch.survey_speedtest_path = uploaded.path;
      } else if (kind === 'commission_speedtest') {
        orderPatch.commission_speedtest_path = uploaded.path;
        orderPatch.commission_speedtest_uploaded_at = now;
        sitePatch.commission_speedtest_path = uploaded.path;
      } else {
        orderPatch.job_card_path = uploaded.path;
        sitePatch.job_card_path = uploaded.path;
        sitePatch.job_card_uploaded_at = now;
      }

      const { data: updated, error: updateError } = await auth.supabase
        .from('unjani_install_orders')
        .update(orderPatch)
        .eq('id', order.id)
        .select()
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      if (order.corporate_site_id && Object.keys(sitePatch).length > 0) {
        await auth.supabase.from('corporate_sites').update(sitePatch).eq('id', order.corporate_site_id);
      }
      return NextResponse.json({ order: updated, path: uploaded.path });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'assign_kit') {
      const updated = await tryReserveOpenOrder(auth.supabase, order.id, auth.adminUser.id);
      return NextResponse.json({ order: updated });
    }

    if (action === 'receive_stock') {
      const updated = await receiveReplenishmentsForOrder(auth.supabase, order.id, auth.adminUser.id);
      return NextResponse.json({ order: updated });
    }

    if (action === 'approve_job_card') {
      const ready = canIssueRfsCertificate({
        jobCardPath: order.job_card_path,
        jobCardApprovedAt: new Date().toISOString(),
        surveySpeedtestPath: order.survey_speedtest_path,
        commissionSpeedtestPath: order.commission_speedtest_path,
      });
      if (!order.job_card_path || !order.survey_speedtest_path || !order.commission_speedtest_path) {
        return NextResponse.json(
          { error: 'Upload the job card and both Ookla screenshots before approval' },
          { status: 400 }
        );
      }
      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await auth.supabase
        .from('unjani_install_orders')
        .update({
          job_card_approved_at: now,
          updated_at: now,
        })
        .eq('id', order.id)
        .select()
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      if (order.corporate_site_id) {
        await auth.supabase
          .from('corporate_sites')
          .update({
            job_card_approved_at: now,
            job_card_approved_by: auth.adminUser.id,
          })
          .eq('id', order.corporate_site_id);
      }
      return NextResponse.json({ order: updated, rfsReady: ready });
    }

    if (action === 'schedule') {
      const visitDate = String(body.visitDate || '').trim();
      const technicianId = String(body.technicianId || '').trim();
      const timeStart = String(body.timeStart || '08:00').trim();
      const timeEnd = String(body.timeEnd || '12:00').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate) || !technicianId) {
        return NextResponse.json(
          { error: 'technicianId and visitDate (YYYY-MM-DD) are required' },
          { status: 400 }
        );
      }
      assertScheduleAllowed({
        stockStatus: order.stock_status,
        visitDate,
        fulfilByMax: order.fulfil_by_max,
      });
      if (!order.customer_id) {
        return NextResponse.json(
          { error: 'Register the clinic (customer) before booking a technician visit' },
          { status: 400 }
        );
      }

      const { data: check } = await auth.supabase
        .from('b2b_coverage_checks')
        .select('results')
        .eq('id', order.coverage_check_id)
        .maybeSingle();
      const jobType = installJobType(recommendedAccess(check?.results));

      const job = await createFieldJob({
        job_type: jobType,
        title: `Unjani Connect install — ${order.clinic_name || 'Clinic'}`,
        description: 'Survey, install router + Wi-Fi AP, and commission with before/after Ookla screenshots.',
        priority: 'normal',
        address: order.address || 'South Africa',
        latitude: order.latitude != null ? Number(order.latitude) : undefined,
        longitude: order.longitude != null ? Number(order.longitude) : undefined,
        customer_name: order.contact_name || order.clinic_name || undefined,
        customer_phone: order.contact_phone || undefined,
        customer_email: order.contact_email || undefined,
        scheduled_date: visitDate,
        scheduled_time_start: timeStart,
        scheduled_time_end: timeEnd,
        estimated_duration_minutes: 180,
        assigned_technician_id: technicianId,
        customer_id: order.customer_id,
      });

      await issueKitForOrder(auth.supabase, order.id, auth.adminUser.id);

      const notes = bookVisitNotes(visitDate, typeof body.notes === 'string' ? body.notes : undefined);
      if (order.corporate_site_id) {
        await auth.supabase
          .from('corporate_sites')
          .update({ rfi_notes: notes, status: 'pending' })
          .eq('id', order.corporate_site_id);
        await auth.supabase.from('corporate_site_events').insert({
          site_id: order.corporate_site_id,
          event_type: 'visit_booked',
          new_value: { visit_date: visitDate, field_job_id: job.id, technician_id: technicianId },
          performed_by: auth.adminUser.id,
          notes,
        });
      } else {
        const { data: customer } = await auth.supabase
          .from('customers')
          .select('id, corporate_site_id')
          .eq('id', order.customer_id)
          .maybeSingle();
        if (customer?.corporate_site_id) {
          await auth.supabase
            .from('corporate_sites')
            .update({ rfi_notes: notes, status: 'pending' })
            .eq('id', customer.corporate_site_id);
          await auth.supabase.from('corporate_site_events').insert({
            site_id: customer.corporate_site_id,
            event_type: 'visit_booked',
            new_value: { visit_date: visitDate, field_job_id: job.id },
            performed_by: auth.adminUser.id,
            notes,
          });
        }
      }

      const { data: updated, error: updateError } = await auth.supabase
        .from('unjani_install_orders')
        .update({
          field_job_id: job.id,
          visit_date: visitDate,
          technician_id: technicianId,
          corporate_site_id: order.corporate_site_id,
          status: 'scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id)
        .select()
        .single();
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      return NextResponse.json({ order: updated, job });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /reserved|25th|21 business|Register the clinic/i.test(message) ? 400 : 500;
    apiLogger.error('[Unjani install-orders id] POST failed', { error });
    return NextResponse.json({ error: message }, { status });
  }
}
