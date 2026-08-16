import {
  bookVisitNotes,
  confirmDetailsPatch,
  goLiveActivatePayload,
  requestChangesPatch,
} from '@/lib/admin/unjani-advance-stage';
import { isVisitWindowBlocked } from '@/lib/admin/unjani-operator-actions';

describe('Unjani advance-stage helpers', () => {
  it('approves clinic details by setting the submission approved and clearing the rejection', () => {
    expect(confirmDetailsPatch()).toEqual({
      status: 'approved',
      rejection_reason: null,
    });
  });

  it('requests changes with a required reason and keeps the submission submitted', () => {
    expect(requestChangesPatch('Wrong street number')).toEqual({
      status: 'submitted',
      rejection_reason: 'Wrong street number',
    });
    expect(() => requestChangesPatch('   ')).toThrow(/reason/i);
  });

  it('stores the agreed visit date in site notes without inventing a visit_date column', () => {
    expect(bookVisitNotes('2026-08-20')).toBe('Visit booked: 2026-08-20');
    expect(bookVisitNotes('2026-08-20', 'Use staff entrance')).toBe(
      'Visit booked: 2026-08-20. Use staff entrance'
    );
    expect(isVisitWindowBlocked('2026-08-20')).toBe(false);
  });

  it('builds the same go-live activate payload the activations tab already sends', () => {
    expect(
      goLiveActivatePayload({
        technology: 'lte_5g',
        installedAt: '2026-08-20',
        installedBy: 'Thabo',
        wholesaleOrderRef: 'WH-1',
        notes: 'RFS issued',
      })
    ).toEqual({
      technology: 'lte_5g',
      package_id: 'f6828ecf-4a8d-42c0-9fd7-d7cac5c1537e',
      monthly_fee: 450,
      wholesale_order_ref: 'WH-1',
      installed_at: '2026-08-20',
      installed_by: 'Thabo',
      notes: 'RFS issued',
    });
  });
});
