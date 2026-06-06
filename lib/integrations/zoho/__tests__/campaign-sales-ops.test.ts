import {
  deriveSalesQueue,
  deriveSlaStatus,
  enrichSalesTicket,
  mapLiveCampaignTicketToSnapshot,
  summarizeSalesQueues,
  type SalesOpsTicketInput,
} from '../campaign-sales-ops';
import type { CampaignConversation, CampaignTicket, LeadProfile } from '../desk-campaign-service';

const NOW = new Date('2026-06-06T10:00:00.000Z');

function ticket(overrides: Partial<SalesOpsTicketInput> = {}): SalesOpsTicketInput {
  return {
    ticket_id: 'ticket-1',
    ticket_number: '123',
    subject: 'Hello! Can I get more info on this?',
    status: 'Open',
    assigned_agent: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    lead_name: null,
    lead_email: null,
    lead_phone: null,
    lead_address: null,
    insight_status: 'awaiting_agent',
    is_signed_up: false,
    order_id: null,
    zoho_created_at: '2026-06-06T08:00:00.000Z',
    first_response_at: null,
    closed_at: null,
    conversations: [
      {
        id: 'conv-1',
        author: 'Lead',
        direction: 'in',
        content: 'I need internet',
        timestamp: '2026-06-06T08:00:00.000Z',
        channel: 'whatsapp',
      },
    ],
    conversation_count: 1,
    ...overrides,
  };
}

describe('campaign sales ops helpers', () => {
  it('puts unresponded leads older than two hours into SLA risk', () => {
    const row = ticket({ zoho_created_at: '2026-06-06T07:45:00.000Z' });
    expect(deriveSlaStatus(row, NOW)).toBe('breached');
    expect(deriveSalesQueue(row, NOW)).toBe('sla_risk');
  });

  it('puts fresh unresponded inbound leads into needs agent', () => {
    const row = ticket({ zoho_created_at: '2026-06-06T09:15:00.000Z' });
    expect(deriveSlaStatus(row, NOW)).toBe('ok');
    expect(deriveSalesQueue(row, NOW)).toBe('needs_agent');
  });

  it('puts leads between 90 and 120 minutes without response into at-risk SLA', () => {
    const row = ticket({ zoho_created_at: '2026-06-06T08:20:00.000Z' });
    expect(deriveSlaStatus(row, NOW)).toBe('at_risk');
    expect(deriveSalesQueue(row, NOW)).toBe('needs_agent');
  });

  it('puts completed leads with contact details into ready to sell', () => {
    const row = ticket({
      insight_status: 'completed',
      first_response_at: '2026-06-06T08:10:00.000Z',
      lead_phone: '0831234567',
      lead_address: '15 Milner Road, Vaalview',
      conversation_count: 5,
    });
    expect(deriveSalesQueue(row, NOW)).toBe('ready_to_sell');
  });

  it('keeps no coverage and signed-up states ahead of operational queues', () => {
    expect(deriveSalesQueue(ticket({ insight_status: 'no_coverage' }), NOW)).toBe('coverage_issue');
    expect(deriveSalesQueue(ticket({ is_signed_up: true, insight_status: 'no_coverage' }), NOW)).toBe('converted');
  });

  it('normalizes live Zoho tickets into the same flattened shape as snapshot rows', () => {
    const zohoTicket: CampaignTicket = {
      id: 'z-ticket',
      ticketNumber: '456',
      subject: 'I want to know more',
      status: 'Open',
      assigneeName: 'Tamsyn',
      contactName: 'Zoho Contact',
      contactPhone: '0821112222',
      contactEmail: 'lead@example.com',
      createdTime: '2026-06-06T07:00:00.000Z',
      closedTime: null,
      tags: [],
    };
    const conversations: CampaignConversation[] = [
      {
        id: 'msg-1',
        author: 'Lead',
        direction: 'in',
        content: 'My address is 1 Main Road',
        timestamp: '2026-06-06T07:00:00.000Z',
        channel: 'whatsapp',
      },
    ];
    const profile: LeadProfile = {
      name: 'Lead Name',
      phone: '0831234567',
      email: 'lead.profile@example.com',
      address: '1 Main Road, Vaalview',
    };

    expect(mapLiveCampaignTicketToSnapshot({
      ticket: zohoTicket,
      conversations,
      profile,
      insightStatus: 'awaiting_agent',
      isSignedUp: false,
      orderId: null,
    })).toEqual({
      ticket_id: 'z-ticket',
      ticket_number: '456',
      subject: 'I want to know more',
      status: 'Open',
      assigned_agent: 'Tamsyn',
      contact_name: 'Zoho Contact',
      contact_phone: '0821112222',
      contact_email: 'lead@example.com',
      lead_name: 'Lead Name',
      lead_email: 'lead.profile@example.com',
      lead_phone: '0831234567',
      lead_address: '1 Main Road, Vaalview',
      insight_status: 'awaiting_agent',
      is_signed_up: false,
      order_id: null,
      zoho_created_at: '2026-06-06T07:00:00.000Z',
      first_response_at: null,
      closed_at: null,
      conversations,
      conversation_count: 1,
    });
  });

  it('summarizes queue counts from enriched tickets', () => {
    const rows = [
      enrichSalesTicket(ticket({ zoho_created_at: '2026-06-06T09:30:00.000Z' }), NOW),
      enrichSalesTicket(ticket({ ticket_id: 'ticket-2', insight_status: 'no_coverage' }), NOW),
      enrichSalesTicket(ticket({ ticket_id: 'ticket-3', is_signed_up: true }), NOW),
    ];
    expect(summarizeSalesQueues(rows)).toMatchObject({
      needs_agent: 1,
      coverage_issue: 1,
      converted: 1,
    });
  });
});
