import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requirePortalUser } from '@/lib/portal/require-portal-user';
import {
  fetchDeskStatusUpdates,
  openDeskTicketForPortal,
} from '@/lib/portal/create-desk-ticket';

const TICKET_SELECT =
  'id, subject, description, priority, status, ticket_type, created_at, resolved_at, zoho_ticket_id, zoho_ticket_number, site_id, corporate_sites (id, site_name)';

export async function GET() {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  let query = adminDb
    .from('b2b_support_tickets')
    .select(TICKET_SELECT)
    .eq('organisation_id', portalUser.organisation_id)
    .order('created_at', { ascending: false });

  // Clinic / site users only see tickets for their site (they can still log their own).
  if (portalUser.role === 'site_user') {
    if (portalUser.site_id) {
      query = query.eq('site_id', portalUser.site_id);
    } else {
      query = query.eq('submitted_by', portalUser.id);
    }
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error('[Portal /support] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }

  const rows = tickets ?? [];

  try {
    const updates = await fetchDeskStatusUpdates(rows);
    for (const update of updates) {
      await adminDb
        .from('b2b_support_tickets')
        .update({
          status: update.status,
          resolved_at: update.resolved_at,
          desk_status_synced_at: new Date().toISOString(),
        })
        .eq('id', update.id);
      const row = rows.find((ticket) => ticket.id === update.id);
      if (row) {
        row.status = update.status;
        row.resolved_at = update.resolved_at;
      }
    }
  } catch (syncError) {
    console.error('[Portal /support] Desk status sync failed:', syncError);
  }

  return NextResponse.json({ tickets: rows });
}

export async function POST(request: NextRequest) {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const { portalUser, adminDb } = auth;

  const body = await request.json();
  const { subject, description, priority, site_id, ticket_type } = body;

  const validTicketTypes = ['support', 'fault_report', 'activation_request', 'change_request'];
  const resolvedTicketType = validTicketTypes.includes(ticket_type) ? ticket_type : 'support';

  if (!subject || !description) {
    return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

  const resolvedSiteId =
    portalUser.role === 'site_user' ? portalUser.site_id : site_id || null;

  if (resolvedTicketType === 'activation_request' && resolvedSiteId) {
    const { data: site } = await adminDb
      .from('corporate_sites')
      .select('id, status')
      .eq('id', resolvedSiteId)
      .single();

    if (!site || (site.status !== 'pending' && site.status !== 'ready')) {
      return NextResponse.json(
        { error: 'Site must be in pending or ready status for activation requests' },
        { status: 400 }
      );
    }
  }

  const { data: ticket, error: insertError } = await adminDb
    .from('b2b_support_tickets')
    .insert({
      organisation_id: portalUser.organisation_id,
      site_id: resolvedSiteId,
      submitted_by: portalUser.id,
      subject,
      description,
      priority: ticketPriority,
      ticket_type: resolvedTicketType,
    })
    .select(
      'id, subject, description, priority, status, ticket_type, created_at, zoho_ticket_id, zoho_ticket_number'
    )
    .single();

  if (insertError || !ticket) {
    console.error('[Portal /support] Insert error:', insertError?.message);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }

  const orgName = portalUser.organisation_name || 'Unknown';
  let siteName = resolvedSiteId ? 'Unknown site' : 'N/A (org-wide)';
  if (resolvedSiteId) {
    const { data: site } = await adminDb
      .from('corporate_sites')
      .select('site_name')
      .eq('id', resolvedSiteId)
      .maybeSingle();
    if (site?.site_name) siteName = site.site_name;
  }

  const deskDescription = [
    description,
    '',
    '---',
    `Organisation: ${orgName}`,
    `Site: ${siteName}`,
    `Submitted by: ${portalUser.display_name} (${portalUser.email})`,
    `Role: ${portalUser.role === 'admin' ? 'Super User' : 'Site user'}`,
    `Portal ticket: ${ticket.id}`,
  ].join('\n');

  try {
    const deskTicket = await openDeskTicketForPortal({
      subject: `[${orgName}] ${subject}`,
      description: deskDescription,
      customerEmail: portalUser.email,
      customerName: portalUser.display_name,
      priority: ticketPriority,
      ticketType: resolvedTicketType,
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
      ticket.zoho_ticket_id = deskTicket.id;
      ticket.zoho_ticket_number = deskTicket.ticketNumber;
    } else {
      console.error('[Portal /support] Zoho Desk create returned no ticket');
    }
  } catch (deskError) {
    console.error('[Portal /support] Zoho Desk create failed:', deskError);
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const isActivation = resolvedTicketType === 'activation_request';
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@notifications.circletelsa.co.za',
        to: isActivation
          ? ['onboarding@circletel.co.za', 'contactus@circletel.co.za']
          : 'contactus@circletel.co.za',
        replyTo: portalUser.email,
        subject: isActivation
          ? `[Portal Activation] ${subject} — ${orgName}`
          : `[Portal Support] ${subject} — ${orgName}`,
        text: [
          `New support ticket from B2B Portal`,
          ``,
          `Organisation: ${orgName}`,
          `Site: ${siteName}`,
          `Submitted by: ${portalUser.display_name} (${portalUser.email})`,
          `Role: ${portalUser.role === 'admin' ? 'Super User' : portalUser.role}`,
          `Priority: ${ticketPriority}`,
          ticket.zoho_ticket_number ? `Zoho Desk: #${ticket.zoho_ticket_number}` : null,
          ``,
          `Subject: ${subject}`,
          ``,
          `Description:`,
          description,
          ``,
          `---`,
          `Ticket ID: ${ticket.id}`,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (emailError) {
      console.error('[Portal /support] Email send error:', emailError);
    }
  }

  return NextResponse.json({ ticket }, { status: 201 });
}
