import { NextRequest, NextResponse } from 'next/server';
import { requireUnjaniCapability } from '@/lib/portal/require-portal-user';
import { openDeskTicketForPortal } from '@/lib/portal/create-desk-ticket';
import { sendUnjaniIntroductionEmail } from '@/lib/portal/unjani-introduction-email';
import {
  nurseFirstName,
  unjaniNominationDeskDepartmentId,
  withNominationFlags,
} from '@/lib/portal/unjani-nomination';
import { apiLogger } from '@/lib/logging/logger';

/**
 * Nominate a clinic after coverage check (PDF steps 1–3).
 *
 * 1. Marks the coverage check as nominated (admin pipeline / KPIs)
 * 2. Creates portal activation_request ticket (Admin → Nominations queue)
 * 3. Opens Zoho Desk ticket in Sales for CircleTel to attend
 * 4. Sends Unjani Connect introduction email to the nurse (Ruth + ops CC)
 */
export async function POST(request: NextRequest) {
  const auth = await requireUnjaniCapability('coverage.write');
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  try {
    const body = await request.json();
    const {
      coverage_check_id,
      clinic_name,
      address,
      contact_name,
      contact_mobile,
      contact_email,
      notes,
    } = body as {
      coverage_check_id?: string;
      clinic_name?: string;
      address?: string;
      contact_name?: string;
      contact_mobile?: string;
      contact_email?: string;
      notes?: string;
    };

    if (
      !clinic_name?.trim() ||
      !address?.trim() ||
      !contact_name?.trim() ||
      !contact_mobile?.trim() ||
      !contact_email?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            'clinic_name, address, contact_name, contact_mobile, and contact_email are required',
        },
        { status: 400 }
      );
    }

    const clinicName = clinic_name.trim();
    const contactName = contact_name.trim();
    const contactEmail = contact_email.trim().toLowerCase();
    const contactMobile = contact_mobile.trim();
    const serviceAddress = address.trim();

    let coverageResults: Record<string, unknown> | null = null;
    let coverageLat: number | null = null;
    let coverageLng: number | null = null;

    if (coverage_check_id) {
      const { data: check } = await adminDb
        .from('b2b_coverage_checks')
        .select('id, results, latitude, longitude, address')
        .eq('id', coverage_check_id)
        .eq('organisation_id', portalUser.organisation_id)
        .maybeSingle();

      if (!check) {
        return NextResponse.json(
          { error: 'Coverage check not found' },
          { status: 404 }
        );
      }
      coverageResults = check.results as Record<string, unknown>;
      coverageLat = check.latitude;
      coverageLng = check.longitude;

      const nominatedAt = new Date().toISOString();
      const { error: nominateError } = await adminDb
        .from('b2b_coverage_checks')
        .update({
          results: withNominationFlags(coverageResults, {
            nominatedAt,
            nominatedBy: portalUser.id,
          }),
          clinic_name: clinicName,
          address: serviceAddress,
        })
        .eq('id', coverage_check_id)
        .eq('organisation_id', portalUser.organisation_id);

      if (nominateError) {
        apiLogger.warn('[Portal /coverage/onboard] failed to mark nominated', {
          coverage_check_id,
          error: nominateError.message,
        });
      } else {
        coverageResults = withNominationFlags(coverageResults, {
          nominatedAt,
          nominatedBy: portalUser.id,
        });
      }
    }

    const summary = coverageResults?.summary as
      | { tarana?: string; '5g_lte'?: string }
      | undefined;

    const description = [
      `UNJANI CONNECT NOMINATION (Sales — attend to onboard)`,
      ``,
      `Clinic: ${clinicName}`,
      `Service address: ${serviceAddress}`,
      `On-site contact: ${contactName}`,
      `Mobile: ${contactMobile}`,
      `Email: ${contactEmail}`,
      coverageLat != null && coverageLng != null
        ? `Coordinates: ${coverageLat}, ${coverageLng}`
        : null,
      ``,
      `Coverage findings:`,
      `  Tarana / FWB: ${summary?.tarana ?? 'n/a'}`,
      `  5G/LTE: ${summary?.['5g_lte'] ?? 'n/a'}`,
      coverage_check_id ? `  Coverage check ID: ${coverage_check_id}` : null,
      ``,
      notes?.trim() ? `Notes:\n${notes.trim()}` : null,
      ``,
      `Submitted by: ${portalUser.display_name} (${portalUser.email})`,
      `Organisation: ${portalUser.organisation_name}`,
      `Action: Confirm details, send onboarding link, schedule installation.`,
    ]
      .filter(Boolean)
      .join('\n');

    const subject = `Unjani nomination: ${clinicName}`;

    const { data: ticket, error: insertError } = await adminDb
      .from('b2b_support_tickets')
      .insert({
        organisation_id: portalUser.organisation_id,
        site_id: null,
        submitted_by: portalUser.id,
        subject,
        description,
        priority: 'high',
        ticket_type: 'activation_request',
      })
      .select('id, subject, status, ticket_type, created_at')
      .single();

    if (insertError || !ticket) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create ticket' },
        { status: 500 }
      );
    }

    let zohoTicketNumber: string | null = null;
    try {
      const deskTicket = await openDeskTicketForPortal({
        subject: `[Sales · Unjani] ${subject}`,
        description: `${description}\n\n---\nPortal ticket: ${ticket.id}`,
        customerEmail: contactEmail,
        customerName: contactName,
        phone: contactMobile,
        priority: 'high',
        ticketType: 'activation_request',
        departmentId: unjaniNominationDeskDepartmentId(),
      });
      if (deskTicket) {
        zohoTicketNumber = deskTicket.ticketNumber;
        await adminDb
          .from('b2b_support_tickets')
          .update({
            zoho_ticket_id: deskTicket.id,
            zoho_ticket_number: deskTicket.ticketNumber,
            desk_status_synced_at: new Date().toISOString(),
          })
          .eq('id', ticket.id);
      }
    } catch (deskError) {
      apiLogger.error('[Portal /coverage/onboard] Zoho Desk create failed', {
        ticketId: ticket.id,
        error: deskError instanceof Error ? deskError.message : String(deskError),
      });
    }

    const intro = await sendUnjaniIntroductionEmail({
      to: contactEmail,
      clinicName,
      nurseName: nurseFirstName(contactName),
      cc: [portalUser.email],
    });

    if (!intro.success) {
      apiLogger.warn('[Portal /coverage/onboard] intro email failed', {
        ticketId: ticket.id,
        to: contactEmail,
        error: intro.error,
      });
    }

    return NextResponse.json(
      {
        ticket,
        introductionEmail: {
          sent: intro.success,
          messageId: intro.messageId ?? null,
          error: intro.success ? null : intro.error ?? 'send_failed',
        },
        zohoTicketNumber,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
