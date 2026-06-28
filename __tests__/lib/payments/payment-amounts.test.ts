import {
  LEGACY_VALIDATION_CHARGE_AMOUNT,
  ORDER_PROCESSING_FEE_AMOUNT,
  ORDER_PROCESSING_FEE_LABEL,
  isLegacyValidationChargeAmount,
  isOrderProcessingFeeAmount,
} from '@/lib/payments/payment-amounts';

describe('checkout payment amounts', () => {
  it('uses a once-off order processing fee instead of the legacy R1 validation charge', () => {
    expect(LEGACY_VALIDATION_CHARGE_AMOUNT).toBe(1.0);
    expect(ORDER_PROCESSING_FEE_AMOUNT).toBe(149.0);
    expect(ORDER_PROCESSING_FEE_LABEL).toBe('Order processing fee');
  });

  it('keeps legacy validation detection separate from processing-fee detection', () => {
    expect(isLegacyValidationChargeAmount(1.0)).toBe(true);
    expect(isLegacyValidationChargeAmount(ORDER_PROCESSING_FEE_AMOUNT)).toBe(false);

    expect(isOrderProcessingFeeAmount(ORDER_PROCESSING_FEE_AMOUNT)).toBe(true);
    expect(isOrderProcessingFeeAmount(LEGACY_VALIDATION_CHARGE_AMOUNT)).toBe(false);
  });
});
