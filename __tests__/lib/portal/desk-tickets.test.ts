import {
  mapDeskStatusToPortal,
  mapPortalPriorityToDesk,
  deskCategoryForTicketType,
  deskStatusForPortalUpdate,
  splitContactName,
} from '@/lib/portal/desk-tickets';

describe('portal Desk ticket mapping', () => {
  it('maps Zoho Desk statuses onto portal ticket history statuses', () => {
    expect(mapDeskStatusToPortal('Open')).toBe('open');
    expect(mapDeskStatusToPortal('On Hold')).toBe('in_progress');
    expect(mapDeskStatusToPortal('Escalated')).toBe('in_progress');
    expect(mapDeskStatusToPortal('Closed')).toBe('closed');
    expect(mapDeskStatusToPortal('Resolved')).toBe('resolved');
  });

  it('maps portal priority to Desk title case', () => {
    expect(mapPortalPriorityToDesk('low')).toBe('Low');
    expect(mapPortalPriorityToDesk('medium')).toBe('Medium');
    expect(mapPortalPriorityToDesk('high')).toBe('High');
    expect(mapPortalPriorityToDesk('urgent')).toBe('Urgent');
  });

  it('picks a Desk category from the portal ticket type', () => {
    expect(deskCategoryForTicketType('fault_report')).toBe('Technical Support');
    expect(deskCategoryForTicketType('activation_request')).toBe('Onboarding');
    expect(deskCategoryForTicketType('support')).toBe('Customer Support');
    expect(deskCategoryForTicketType('change_request')).toBe('Customer Support');
  });

  it('maps portal status updates onto Desk statuses the API accepts', () => {
    expect(deskStatusForPortalUpdate('open')).toBe('Open');
    expect(deskStatusForPortalUpdate('in_progress')).toBe('On Hold');
    expect(deskStatusForPortalUpdate('resolved')).toBe('Closed');
    expect(deskStatusForPortalUpdate('closed')).toBe('Closed');
  });

  it('splits a display name into Desk contact first/last name', () => {
    expect(splitContactName('Julles Monisi')).toEqual({
      firstName: 'Julles',
      lastName: 'Monisi',
    });
    expect(splitContactName('finance@unjani.org')).toEqual({
      lastName: 'finance@unjani.org',
    });
  });
});
