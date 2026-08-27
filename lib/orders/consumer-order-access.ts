export function customerMayReadOrder(input: {
  userEmail?: string | null;
  customerId?: string | null;
  order: { customer_id?: string | null; email?: string | null };
}): boolean {
  if (input.customerId && input.order.customer_id && input.customerId === input.order.customer_id) {
    return true;
  }
  const userEmail = (input.userEmail || '').trim().toLowerCase();
  const orderEmail = (input.order.email || '').trim().toLowerCase();
  return Boolean(userEmail && orderEmail && userEmail === orderEmail);
}
