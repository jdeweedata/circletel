import { extractCustomerEmail } from '@/lib/payments/netcash-webhook-email';

describe('extractCustomerEmail', () => {
  it('returns the email from the Email field', () => {
    expect(extractCustomerEmail({ Email: 'shaunr07@gmail.com' })).toBe('shaunr07@gmail.com');
  });

  it('falls back to CustomerEmail when Email is absent', () => {
    expect(extractCustomerEmail({ CustomerEmail: 'raycdfg@gmail.com' })).toBe('raycdfg@gmail.com');
  });

  it('prefers Email over CustomerEmail when both present', () => {
    expect(extractCustomerEmail({ Email: 'a@x.com', CustomerEmail: 'b@x.com' })).toBe('a@x.com');
  });

  it('trims surrounding whitespace', () => {
    expect(extractCustomerEmail({ Email: '  user@x.com  ' })).toBe('user@x.com');
  });

  // Regression: the original bug read Extra2 (the notify URL) into customer_email.
  it('never returns Extra2 (the notify URL)', () => {
    expect(
      extractCustomerEmail({ Extra2: 'https://www.circletel.co.za/api/payment/netcash/webhook' })
    ).toBeNull();
  });

  it('rejects a URL even if it somehow lands in an email field', () => {
    expect(extractCustomerEmail({ Email: 'https://www.circletel.co.za/api/payments' })).toBeNull();
  });

  it('returns null when no email fields are present', () => {
    expect(extractCustomerEmail({ Reference: 'CT-PAY-ORD-20260529-1561', Amount: '1.00' })).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractCustomerEmail({ Email: '' })).toBeNull();
  });

  it('returns null for a value with no @', () => {
    expect(extractCustomerEmail({ Email: 'not-an-email' })).toBeNull();
  });
});
