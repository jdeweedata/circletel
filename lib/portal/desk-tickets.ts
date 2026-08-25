/**
 * B2B portal ↔ Zoho Desk ticket mapping.
 * Portal history stays in b2b_support_tickets; Desk is the support queue.
 */

export type PortalTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type PortalTicketType =
  | 'support'
  | 'fault_report'
  | 'activation_request'
  | 'change_request';

export function mapDeskStatusToPortal(deskStatus: string | undefined): PortalTicketStatus {
  const normalized = (deskStatus || '').trim().toLowerCase();
  if (normalized === 'closed') return 'closed';
  if (normalized === 'resolved') return 'resolved';
  if (normalized === 'on hold' || normalized === 'escalated' || normalized === 'in progress') {
    return 'in_progress';
  }
  return 'open';
}

export function mapPortalPriorityToDesk(
  priority: string
): 'Low' | 'Medium' | 'High' | 'Urgent' {
  switch (priority) {
    case 'low':
      return 'Low';
    case 'high':
      return 'High';
    case 'urgent':
      return 'Urgent';
    default:
      return 'Medium';
  }
}

export function deskCategoryForTicketType(ticketType: string | undefined): string {
  if (ticketType === 'fault_report') return 'Technical Support';
  if (ticketType === 'activation_request') return 'Onboarding';
  return 'Customer Support';
}

/** Desk's update API has no Resolved status — close the ticket when the portal resolves it. */
export function deskStatusForPortalUpdate(
  status: PortalTicketStatus
): 'Open' | 'On Hold' | 'Closed' {
  if (status === 'resolved' || status === 'closed') return 'Closed';
  if (status === 'in_progress') return 'On Hold';
  return 'Open';
}

export function splitContactName(displayName: string): {
  firstName?: string;
  lastName: string;
} {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: 'Portal user' };
  if (parts.length === 1) return { lastName: parts[0] };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}
