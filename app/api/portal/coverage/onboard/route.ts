import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireUnjaniSuperUser } from '@/lib/portal/require-portal-user';
import { openDeskTicketForPortal } from '@/lib/portal/create-desk-ticket';

/**
 * Proceed to onboard after a coverage check (PDF steps 1–3).
 * Creates an activation_request ticket (no site_id) and emails onboarding@.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUnjaniSuperUser();
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

    if (!clinic_name?.trim() || !address?.trim() || !contact_name?.trim() || !contact_mobile?.trim()) {
      return NextResponse.json(
        {
          error:
            'clinic_name, address, contact_name, and contact_mobile are required',
        },
        { status: 400 }
      );
    }

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
    }

    const summary = coverageResults?.summary as
      | { tarana?: string; '5g_lte'?: string }
      | undefined;

    const description = [
      `ONBOARDING REQUEST (nomination → go-live step 1–3)`,
      ``,
      `Clinic: ${clinic_name.trim()}`,
      `Service address: ${address.trim()}`,
      `On-site contact: ${contact_name.trim()}`,
      `Mobile: ${contact_mobile.trim()}`,
      contact_email ? `Email: ${contact_email.trim()}` : null,
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
    ]
      .filter(Boolean)
      .join('\n');

    const subject = `Onboard clinic: ${clinic_name.trim()}`;

    const { data: ticket, error: insertError } = await adminDb
      .from('b2b_support_tickets')
      .insert({
        organisation_id: portalUser.organisation_id,
        site_id: null,
        submitted_by: portalUser.id,
        subject,
        description,
        priority: 'medium',
        ticket_type: 'activation_request',
      })
      .select('id, subject, status, ticket_type, created_at')
      .single();

    if (insertError || !ticket) {
      return NextResponse.json({ error: insertError?.message || 'Failed to create ticket' }, { status: 500 });
    }

    try {
      const deskTicket = await openDeskTicketForPortal({
        subject: `[${portalUser.organisation_name}] ${subject}`,
        description: `${description}\n\n---\nPortal ticket: ${ticket.id}`,
        customerEmail: portalUser.email,
        customerName: portalUser.display_name,
        priority: 'medium',
        ticketType: 'activation_request',
      });
      if (deskTicket) {
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
      console.error('[Portal /coverage/onboard] Zoho Desk create failed:', deskError);
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            'noreply@notifications.circletelsa.co.za',
          to: ['onboarding@circletel.co.za', 'contactus@circletel.co.za'],
          replyTo: portalUser.email,
          subject: `[Portal Onboarding] ${subject} — ${portalUser.organisation_name}`,
          text: description + `\n\n---\nTicket ID: ${ticket.id}`,
        });
      } catch (emailError) {
        console.error('[Portal /coverage/onboard] Email error:', emailError);
      }
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
