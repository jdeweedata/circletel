import { NextRequest, NextResponse } from 'next/server';
import { createClientWithSession } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function GET() {
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: tickets, error } = await supabase
    .from('b2b_support_tickets')
    .select(`
      id,
      subject,
      description,
      priority,
      status,
      ticket_type,
      created_at,
      resolved_at,
      corporate_sites (id, site_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Portal /support] Query error:', error.message);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClientWithSession();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: portalUser, error: profileError } = await supabase
    .from('b2b_portal_users')
    .select(`
      id,
      organisation_id,
      site_id,
      display_name,
      email,
      role,
      corporate_accounts!inner (company_name),
      corporate_sites (site_name)
    `)
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError || !portalUser) {
    return NextResponse.json({ error: 'Portal user not found' }, { status: 403 });
  }

  const body = await request.json();
  const { subject, description, priority, site_id, ticket_type } = body;

  const validTicketTypes = ['support', 'fault_report', 'activation_request', 'change_request'];
  const resolvedTicketType = validTicketTypes.includes(ticket_type) ? ticket_type : 'support';

  if (!subject || !description) {
    return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

  const resolvedSiteId = portalUser.role === 'site_user'
    ? portalUser.site_id
    : site_id || null;

  if (resolvedTicketType === 'activation_request' && resolvedSiteId) {
    const { data: site } = await supabase
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

  const { data: ticket, error: insertError } = await supabase
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
    .select('id, subject, priority, status, ticket_type, created_at')
    .single();

  if (insertError) {
    console.error('[Portal /support] Insert error:', insertError.message);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }

  const orgName = (portalUser.corporate_accounts as any)?.company_name ?? 'Unknown';
  const siteName = resolvedSiteId
    ? ((portalUser.corporate_sites as any)?.site_name ?? 'Unknown site')
    : 'N/A (org-wide)';

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@notifications.circletelsa.co.za',
        to: 'contactus@circletel.co.za',
        replyTo: portalUser.email,
        subject: resolvedTicketType === 'activation_request'
          ? `[Portal Activation] ${subject} — ${orgName}`
          : `[Portal Support] ${subject} — ${orgName}`,
        text: [
          `New support ticket from B2B Portal`,
          ``,
          `Organisation: ${orgName}`,
          `Site: ${siteName}`,
          `Submitted by: ${portalUser.display_name} (${portalUser.email})`,
          `Role: ${portalUser.role}`,
          `Priority: ${ticketPriority}`,
          ``,
          `Subject: ${subject}`,
          ``,
          `Description:`,
          description,
          ``,
          `---`,
          `Ticket ID: ${ticket.id}`,
        ].join('\n'),
      });
    } catch (emailError) {
      console.error('[Portal /support] Email send error:', emailError);
    }
  }

  return NextResponse.json({ ticket }, { status: 201 });
}
