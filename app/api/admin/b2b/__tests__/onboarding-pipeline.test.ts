/**
 * Tests for onboarding-pipeline determineStage function
 */

import { determineStage } from '../onboarding-pipeline/route';

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

    it('should return service_order_pending when docs are approved and the service order is awaiting signoff', () => {
      const stage = determineStage(
        'in_progress',
        'submitted',
        'approved',
        'pending',
        'pending_signoff'
      );
      expect(stage).toBe('service_order_pending');
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
