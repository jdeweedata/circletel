import { createClient } from '@/lib/supabase/server';
import { syncDeskTicketStatus } from '@/lib/portal/create-desk-ticket';
import { activateTicketPatch, registerTicketPatch } from '@/lib/admin/unjani-portal-ops';

export async function markNominationTicketInProgress(
  ticketId: string,
  siteId?: string | null
): Promise<void> {
  const supabase = await createClient();
  const patch = {
    ...registerTicketPatch(siteId),
    desk_status_synced_at: new Date().toISOString(),
  };
  await supabase.from('b2b_support_tickets').update(patch).eq('id', ticketId);

  const { data } = await supabase
    .from('b2b_support_tickets')
    .select('zoho_ticket_id')
    .eq('id', ticketId)
    .maybeSingle();

  await syncDeskTicketStatus(data?.zoho_ticket_id, 'in_progress');
}

export async function resolveActivationTicketsForSite(siteId: string): Promise<void> {
  const supabase = await createClient();
  const { data: tickets } = await supabase
    .from('b2b_support_tickets')
    .select('id, zoho_ticket_id, status')
    .eq('site_id', siteId)
    .eq('ticket_type', 'activation_request');

  const patch = {
    ...activateTicketPatch(),
    desk_status_synced_at: new Date().toISOString(),
  };

  for (const ticket of tickets ?? []) {
    if (ticket.status === 'resolved' || ticket.status === 'closed') continue;
    await supabase.from('b2b_support_tickets').update(patch).eq('id', ticket.id);
    await syncDeskTicketStatus(ticket.zoho_ticket_id, 'resolved');
  }
}

export async function resolveActivationTicket(
  ticketId: string,
  siteId?: string | null
): Promise<void> {
  const supabase = await createClient();
  const patch = {
    ...activateTicketPatch(),
    ...(siteId ? { site_id: siteId } : {}),
    desk_status_synced_at: new Date().toISOString(),
  };
  await supabase.from('b2b_support_tickets').update(patch).eq('id', ticketId);

  const { data } = await supabase
    .from('b2b_support_tickets')
    .select('zoho_ticket_id')
    .eq('id', ticketId)
    .maybeSingle();

  await syncDeskTicketStatus(data?.zoho_ticket_id, 'resolved');
}
