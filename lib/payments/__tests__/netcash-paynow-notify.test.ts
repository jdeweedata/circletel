import {
  classifyPayNowNotify,
  parseNotifyAmount,
  parseTransactionAccepted,
  shouldMarkInvoicePaid,
  shouldReverseInvoicePaid,
} from '@/lib/payments/netcash-paynow-notify';

describe('netcash-paynow-notify', () => {
  describe('parseTransactionAccepted', () => {
    it('parses string and boolean true/false without || collapse', () => {
      expect(parseTransactionAccepted({ TransactionAccepted: 'true' })).toBe(true);
      expect(parseTransactionAccepted({ TransactionAccepted: true })).toBe(true);
      expect(parseTransactionAccepted({ TransactionAccepted: 'false' })).toBe(false);
      expect(parseTransactionAccepted({ TransactionAccepted: false })).toBe(false);
      expect(parseTransactionAccepted({})).toBeUndefined();
    });
  });

  describe('classifyPayNowNotify', () => {
    it('classifies INV-00061 Success notify as completed', () => {
      expect(
        classifyPayNowNotify({
          TransactionAccepted: 'true',
          Reason: 'Success',
          Amount: '517.50',
        })
      ).toBe('completed');
    });

    it('classifies Declined notify as failed', () => {
      expect(
        classifyPayNowNotify({
          TransactionAccepted: 'false',
          Reason: 'Declined',
          Amount: '517.50',
        })
      ).toBe('failed');
    });

    it('classifies boolean false Accepted as failed (JSON footgun)', () => {
      expect(
        classifyPayNowNotify({
          TransactionAccepted: false,
          Reason: 'Declined',
        })
      ).toBe('failed');
    });
  });

  describe('shouldMarkInvoicePaid', () => {
    it('allows completed with amount > 0', () => {
      expect(shouldMarkInvoicePaid('completed', 517.5)).toBe(true);
    });

    it('blocks R0 Auth / completed with zero amount', () => {
      expect(shouldMarkInvoicePaid('completed', 0)).toBe(false);
      expect(shouldMarkInvoicePaid('completed', -1)).toBe(false);
    });

    it('blocks failed and cancelled', () => {
      expect(shouldMarkInvoicePaid('failed', 517.5)).toBe(false);
      expect(shouldMarkInvoicePaid('cancelled', 517.5)).toBe(false);
    });
  });

  describe('shouldReverseInvoicePaid', () => {
    it('reverses on failed or cancelled (Success→Declined)', () => {
      expect(shouldReverseInvoicePaid('failed')).toBe(true);
      expect(shouldReverseInvoicePaid('cancelled')).toBe(true);
      expect(shouldReverseInvoicePaid('completed')).toBe(false);
      expect(shouldReverseInvoicePaid('pending')).toBe(false);
    });
  });

  describe('parseNotifyAmount', () => {
    it('parses rands string', () => {
      expect(parseNotifyAmount({ Amount: '517.50' })).toBe(517.5);
      expect(parseNotifyAmount({ Amount: '0.00' })).toBe(0);
    });
  });
});
