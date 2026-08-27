import { customerMayReadOrder } from '@/lib/orders/consumer-order-access';

describe('customerMayReadOrder', () => {
  const order = {
    customer_id: 'cust-1',
    email: 'ishmael.poloko@yahoo.com',
  };

  it('allows the owning customer id', () => {
    expect(customerMayReadOrder({ customerId: 'cust-1', order })).toBe(true);
  });

  it('allows a matching session email (case-insensitive)', () => {
    expect(
      customerMayReadOrder({ userEmail: 'Ishmael.Poloko@yahoo.com', order })
    ).toBe(true);
  });

  it('denies a guessed id or another email', () => {
    expect(customerMayReadOrder({ customerId: 'cust-other', order })).toBe(false);
    expect(
      customerMayReadOrder({ userEmail: 'kassim@example.com', order })
    ).toBe(false);
    expect(customerMayReadOrder({ order })).toBe(false);
  });
});
