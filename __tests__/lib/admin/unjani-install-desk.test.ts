import {
  assertConfirmSlotAllowed,
  assertOpenJobAllowed,
  fulfilmentDesk,
  isKitBookedOut,
} from '@/lib/admin/unjani-install-desk';

describe('Unjani install desks', () => {
  it('books a kit out only when stock is reserved against the site', () => {
    expect(isKitBookedOut('reserved')).toBe(true);
    expect(isKitBookedOut('on_order')).toBe(false);
    expect(isKitBookedOut('checking')).toBe(false);
  });

  it('keeps ops on kit and job-card work until a field job exists', () => {
    expect(
      fulfilmentDesk({
        stock_status: 'reserved',
        field_job_id: null,
        visit_date: null,
      })
    ).toBe('ops');
  });

  it('hands off to the scheduler once the job card is open and no slot is confirmed', () => {
    expect(
      fulfilmentDesk({
        stock_status: 'reserved',
        field_job_id: 'job-1',
        visit_date: null,
        technician_id: 'tech-1',
      })
    ).toBe('scheduler');
  });

  it('blocks opening a job card until the kit is booked out and a technician is chosen', () => {
    expect(() =>
      assertOpenJobAllowed({
        stockStatus: 'on_order',
        technicianId: 'tech-1',
        proposedDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/booked out/i);

    expect(() =>
      assertOpenJobAllowed({
        stockStatus: 'reserved',
        technicianId: '',
        proposedDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/technician/i);

    expect(
      assertOpenJobAllowed({
        stockStatus: 'reserved',
        technicianId: 'tech-1',
        proposedDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toBe(true);
  });

  it('blocks confirming a slot until the job card is open', () => {
    expect(() =>
      assertConfirmSlotAllowed({
        fieldJobId: null,
        technicianId: 'tech-1',
        stockStatus: 'reserved',
        visitDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toThrow(/job card/i);

    expect(
      assertConfirmSlotAllowed({
        fieldJobId: 'job-1',
        technicianId: 'tech-1',
        stockStatus: 'reserved',
        visitDate: '2026-09-10',
        fulfilByMax: '2026-09-15',
      })
    ).toBe(true);
  });
});
