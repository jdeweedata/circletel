import type {
  CampaignConversation,
  CampaignTicket,
  InsightStatus,
  LeadProfile,
} from './desk-campaign-service';

export type SalesQueue =
  | 'needs_agent'
  | 'sla_risk'
  | 'ready_to_sell'
  | 'waiting_on_customer'
  | 'coverage_issue'
  | 'unresponsive'
  | 'converted';

export type SlaStatus = 'breached' | 'at_risk' | 'ok' | 'responded' | 'closed';

export interface SalesOpsTicketInput {
  ticket_id: string;
  ticket_number: string | null;
  subject: string | null;
  status: string | null;
  assigned_agent: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_address: string | null;
  insight_status: InsightStatus;
  is_signed_up: boolean;
  order_id: string | null;
  zoho_created_at: string | null;
  first_response_at: string | null;
  closed_at: string | null;
  conversations: CampaignConversation[];
  conversation_count: number;
}

export interface SalesOpsTicket extends SalesOpsTicketInput {
  sales_queue: SalesQueue;
  sla_status: SlaStatus;
  display_name: string;
  display_phone: string | null;
  display_email: string | null;
  lead_age_ms: number | null;
  first_response_ms: number | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
}

export interface LiveCampaignTicketParams {
  ticket: CampaignTicket;
  conversations: CampaignConversation[];
  profile: LeadProfile;
  insightStatus: InsightStatus;
  isSignedUp: boolean;
  orderId: string | null;
}

const SLA_BREACH_MS = 2 * 60 * 60 * 1000;
const SLA_AT_RISK_MS = 90 * 60 * 1000;

function timestampMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function getLastInboundAt(conversations: CampaignConversation[]): string | null {
  return conversations.filter((c) => c.direction === 'in').at(-1)?.timestamp ?? null;
}

export function getLastOutboundAt(conversations: CampaignConversation[]): string | null {
  return conversations.filter((c) => c.direction === 'out').at(-1)?.timestamp ?? null;
}

export function getLeadAgeMs(row: SalesOpsTicketInput, now = new Date()): number | null {
  const createdMs = timestampMs(row.zoho_created_at);
  if (createdMs === null) return null;
  return Math.max(0, now.getTime() - createdMs);
}

export function getFirstResponseMs(row: SalesOpsTicketInput): number | null {
  const createdMs = timestampMs(row.zoho_created_at);
  const responseMs = timestampMs(row.first_response_at);
  if (createdMs === null || responseMs === null) return null;
  return Math.max(0, responseMs - createdMs);
}

export function getDisplayName(row: SalesOpsTicketInput): string {
  return row.lead_name || row.contact_name || 'Unknown lead';
}

export function getDisplayPhone(row: SalesOpsTicketInput): string | null {
  return row.lead_phone || row.contact_phone || null;
}

export function getDisplayEmail(row: SalesOpsTicketInput): string | null {
  return row.lead_email || row.contact_email || null;
}

export function hasInbound(row: SalesOpsTicketInput): boolean {
  return row.conversations.some((conversation) => conversation.direction === 'in');
}

export function deriveSlaStatus(row: SalesOpsTicketInput, now = new Date()): SlaStatus {
  if (row.status === 'Closed') return 'closed';
  if (row.first_response_at) return 'responded';

  const ageMs = getLeadAgeMs(row, now);
  if (ageMs === null) return 'ok';
  if (ageMs >= SLA_BREACH_MS) return 'breached';
  if (ageMs >= SLA_AT_RISK_MS) return 'at_risk';
  return 'ok';
}

export function deriveSalesQueue(row: SalesOpsTicketInput, now = new Date()): SalesQueue {
  if (row.is_signed_up || row.order_id) return 'converted';
  if (row.insight_status === 'no_coverage') return 'coverage_issue';
  if (row.insight_status === 'unresponsive') return 'unresponsive';

  const slaStatus = deriveSlaStatus(row, now);
  const inboundExists = hasInbound(row);

  if (!row.first_response_at && inboundExists && slaStatus === 'breached') return 'sla_risk';
  if (!row.first_response_at && inboundExists) return 'needs_agent';

  const hasUsableContact = Boolean(getDisplayPhone(row) || getDisplayEmail(row));
  const hasAddress = Boolean(row.lead_address);
  if (
    (row.insight_status === 'completed' || row.insight_status === 'in_progress') &&
    (hasUsableContact || hasAddress)
  ) {
    return 'ready_to_sell';
  }

  if (row.insight_status === 'awaiting_details') return 'waiting_on_customer';
  return 'needs_agent';
}

export function enrichSalesTicket(row: SalesOpsTicketInput, now = new Date()): SalesOpsTicket {
  return {
    ...row,
    sales_queue: deriveSalesQueue(row, now),
    sla_status: deriveSlaStatus(row, now),
    display_name: getDisplayName(row),
    display_phone: getDisplayPhone(row),
    display_email: getDisplayEmail(row),
    lead_age_ms: getLeadAgeMs(row, now),
    first_response_ms: getFirstResponseMs(row),
    last_inbound_at: getLastInboundAt(row.conversations),
    last_outbound_at: getLastOutboundAt(row.conversations),
  };
}

export function summarizeSalesQueues(rows: SalesOpsTicket[]): Record<SalesQueue, number> {
  return rows.reduce<Record<SalesQueue, number>>(
    (summary, row) => {
      summary[row.sales_queue] += 1;
      return summary;
    },
    {
      needs_agent: 0,
      sla_risk: 0,
      ready_to_sell: 0,
      waiting_on_customer: 0,
      coverage_issue: 0,
      unresponsive: 0,
      converted: 0,
    }
  );
}

export function mapLiveCampaignTicketToSnapshot({
  ticket,
  conversations,
  profile,
  insightStatus,
  isSignedUp,
  orderId,
}: LiveCampaignTicketParams): SalesOpsTicketInput {
  const firstOutbound = conversations.find((conversation) => conversation.direction === 'out');

  return {
    ticket_id: ticket.id,
    ticket_number: ticket.ticketNumber ?? null,
    subject: ticket.subject ?? null,
    status: ticket.status ?? null,
    assigned_agent: ticket.assigneeName ?? 'Unassigned',
    contact_name: ticket.contactName ?? null,
    contact_phone: ticket.contactPhone ?? null,
    contact_email: ticket.contactEmail ?? null,
    lead_name: profile.name ?? null,
    lead_email: profile.email ?? null,
    lead_phone: profile.phone ?? null,
    lead_address: profile.address ?? null,
    insight_status: insightStatus,
    is_signed_up: isSignedUp,
    order_id: orderId,
    zoho_created_at: ticket.createdTime ?? null,
    first_response_at: firstOutbound?.timestamp ?? null,
    closed_at: ticket.closedTime ?? null,
    conversations,
    conversation_count: conversations.length,
  };
}
