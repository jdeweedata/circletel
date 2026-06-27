-- Persist the authoritative charge amount for payment initiation.
--
-- Security: /api/payment/netcash/initiate previously trusted a client-supplied
-- `amount`. It now derives the NetCash charge from this column, which is set
-- server-side at order creation. Nullable + no default so legacy rows (created
-- before this column existed) fall back to the validation-charge constant in
-- the initiate route.

ALTER TABLE consumer_orders
  ADD COLUMN IF NOT EXISTS payment_amount numeric;

COMMENT ON COLUMN consumer_orders.payment_amount IS
  'Authoritative charge amount (Rands) for payment initiation. Server-set at order creation; never client-trusted. Currently the R1.00 card-validation charge; becomes the once-off processing fee in Phase 5.';
