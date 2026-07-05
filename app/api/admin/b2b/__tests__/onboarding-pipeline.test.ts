/**
 * Tests for onboarding-pipeline determineStage function
 */

import {
  calculateVettingSla,
  determineStage,
  pickCurrentService,
  pickLatestInvoice,
} from '../onboarding-pipeline/route';

describe('determineStage', () => {
  describe('stage transitions without eMandate signature', () => {
    it('should return billing_ready when onboarding_status is billing_ready', () => {
      const stage = determineStage('billing_ready', 'submitted', 'approved', 'pending');
      expect(stage).toBe('billing_ready');
    });

    it('should return docs_approved when vetting_status is approved, regardless of mandate_status', () => {
      // This is the key change: docs_approved no longer requires mandate_status='active'
      const stage = determineStage('in_progress', 'submitted', 'approved', 'pending');
      expect(stage).toBe('docs_approved');
    });

    it('should NOT return mandate_active for any input (stage is retired)', () => {
      // Verify that no combination of inputs returns 'mandate_active'
      const inputs = [
        { onboarding: null, submission: null, vetting: null, mandate: 'active' },
        { onboarding: 'in_progress', submission: 'submitted', vetting: 'approved', mandate: 'active' },
        { onboarding: null, submission: 'submitted', vetting: 'approved', mandate: 'active' },
      ];
      for (const input of inputs) {
        const stage = determineStage(input.onboarding, input.submission, input.vetting, input.mandate);
        expect(stage).not.toBe('mandate_active');
      }
    });
  });

  describe('other stage transitions (unchanged)', () => {
    it('should return changes_requested when vetting_status is rejected', () => {
      const stage = determineStage('in_progress', 'submitted', 'rejected', null);
      expect(stage).toBe('changes_requested');
    });

    it('should return submitted when submission_status is submitted', () => {
      const stage = determineStage('in_progress', 'submitted', null, null);
      expect(stage).toBe('submitted');
    });

    it('should return invited when onboarding_status is in_progress (no submission yet)', () => {
      const stage = determineStage('in_progress', null, null, null);
      expect(stage).toBe('invited');
    });

    it('should return pending as default', () => {
      const stage = determineStage(null, null, null, null);
      expect(stage).toBe('pending');
    });
  });

  describe('billing_ready precedence', () => {
    it('billing_ready should override all other states', () => {
      const stage = determineStage('billing_ready', null, null, null);
      expect(stage).toBe('billing_ready');
    });

    it('billing_ready should override even if docs_approved', () => {
      const stage = determineStage('billing_ready', 'submitted', 'approved', 'pending');
      expect(stage).toBe('billing_ready');
    });
  });
});

describe('calculateVettingSla', () => {
  const now = new Date('2026-07-06T08:00:00+02:00');

  it('clears SLA for approved vetting even when the due date is in the past', () => {
    const sla = calculateVettingSla(
      {
        document_vetting_status: 'approved',
        vetting_due_date: '2026-06-18T17:27:43.267+02:00',
      },
      now
    );

    expect(sla).toEqual({
      dueDate: null,
      overdue: false,
      businessDaysLeft: null,
    });
  });

  it('clears SLA for rejected vetting because internal review has completed', () => {
    const sla = calculateVettingSla(
      {
        document_vetting_status: 'rejected',
        vetting_due_date: '2026-06-18T17:27:43.267+02:00',
      },
      now
    );

    expect(sla).toEqual({
      dueDate: null,
      overdue: false,
      businessDaysLeft: null,
    });
  });

  it('keeps overdue SLA for submitted documents still awaiting review', () => {
    const sla = calculateVettingSla(
      {
        document_vetting_status: 'documents_pending',
        vetting_due_date: '2026-07-02T08:00:00+02:00',
      },
      now
    );

    expect(sla.dueDate).toBe('2026-07-02T08:00:00+02:00');
    expect(sla.overdue).toBe(true);
    expect(sla.businessDaysLeft).toBeLessThan(0);
  });

  it('keeps SLA open for under-review documents that are not yet overdue', () => {
    const sla = calculateVettingSla(
      {
        document_vetting_status: 'under_review',
        vetting_due_date: '2026-07-07T08:00:00+02:00',
      },
      now
    );

    expect(sla.dueDate).toBe('2026-07-07T08:00:00+02:00');
    expect(sla.overdue).toBe(false);
    expect(sla.businessDaysLeft).toBeGreaterThanOrEqual(0);
  });
});

describe('pipeline service and invoice summaries', () => {
  it('prefers an active service over newer inactive service shells', () => {
    const service = pickCurrentService([
      {
        status: 'pending',
        active: false,
        package_name: 'Future setup',
        monthly_price: 450,
        activation_date: null,
        billing_day: 1,
        last_invoice_date: null,
        created_at: '2026-07-01T08:00:00+02:00',
      },
      {
        status: 'active',
        active: true,
        package_name: 'Unjani Connectivity',
        monthly_price: 450,
        activation_date: '2026-06-01',
        billing_day: 1,
        last_invoice_date: '2026-07-01',
        created_at: '2026-06-01T08:00:00+02:00',
      },
    ]);

    expect(service).toMatchObject({
      status: 'active',
      active: true,
      package_name: 'Unjani Connectivity',
      activation_date: '2026-06-01',
    });
  });

  it('uses the most recent invoice by invoice date for the drawer summary', () => {
    const invoice = pickLatestInvoice([
      {
        invoice_number: 'INV-2026-00015',
        invoice_date: '2026-06-19',
        due_date: '2026-06-24',
        status: 'paid',
        total_amount: 276,
        amount_paid: 276,
        amount_due: 0,
        paid_at: '2026-06-26T08:00:00+02:00',
        payment_collection_method: 'debit_order',
        created_at: '2026-06-19T08:00:00+02:00',
      },
      {
        invoice_number: 'INV-2026-00025',
        invoice_date: '2026-07-01',
        due_date: '2026-07-01',
        status: 'sent',
        total_amount: 450,
        amount_paid: 0,
        amount_due: 450,
        paid_at: null,
        payment_collection_method: 'debit_order',
        created_at: '2026-07-01T08:00:00+02:00',
      },
    ]);

    expect(invoice).toMatchObject({
      invoice_number: 'INV-2026-00025',
      status: 'sent',
      payment_collection_method: 'debit_order',
    });
  });
});
