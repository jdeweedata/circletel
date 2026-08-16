import { createMintedZohoDeskService } from '@/lib/integrations/zoho/desk-service';
import {
  deskCategoryForTicketType,
  mapDeskStatusToPortal,
  mapPortalPriorityToDesk,
  type PortalTicketStatus,
} from '@/lib/portal/desk-tickets';

export async function openDeskTicketForPortal(input: {
  subject: string;
  description: string;
  customerEmail: string;
  customerName: string;
  priority: string;
  ticketType?: string;
}): Promise<{ id: string; ticketNumber: string } | null> {
  const desk = await createMintedZohoDeskService();
  const result = await desk.createTicket({
    subject: input.subject,
    description: input.description,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    priority: mapPortalPriorityToDesk(input.priority),
    category: deskCategoryForTicketType(input.ticketType),
  });

  if (!result.success || !result.ticket?.id) {
    return null;
  }

  return {
    id: result.ticket.id,
    ticketNumber: result.ticket.ticketNumber,
  };
}

export async function fetchDeskStatusUpdates(
  tickets: Array<{ id: string; zoho_ticket_id: string | null; status: string }>
): Promise<Array<{ id: string; status: PortalTicketStatus; resolved_at: string | null }>> {
  const pending = tickets.filter(
    (ticket) =>
      ticket.zoho_ticket_id &&
      ticket.status !== 'closed' &&
      ticket.status !== 'resolved'
  );
  if (pending.length === 0) return [];

  const desk = await createMintedZohoDeskService();
  const updates: Array<{ id: string; status: PortalTicketStatus; resolved_at: string | null }> = [];

  for (const ticket of pending.slice(0, 15)) {
    const details = await desk.getTicketDetails(ticket.zoho_ticket_id as string);
    if (!details.success || !details.ticket) continue;
    const status = mapDeskStatusToPortal(details.ticket.status);
    if (status === ticket.status) continue;
    updates.push({
      id: ticket.id,
      status,
      resolved_at: status === 'closed' || status === 'resolved' ? new Date().toISOString() : null,
    });
  }

  return updates;
}
