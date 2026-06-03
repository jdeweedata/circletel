-- W3 (debit-order B2B/B2C generalization): make emandate_requests.order_id nullable.
--
-- B2B customers (customers.account_type='business') have no consumer_orders row, so an
-- order-less mandate must be recordable. The FK to consumer_orders is retained and still
-- enforced when order_id IS NOT NULL; B2B mandates are keyed on customer_id +
-- netcash_account_reference instead.
--
-- Safe/additive: only relaxes a NOT NULL constraint; no data is modified.

ALTER TABLE public.emandate_requests
  ALTER COLUMN order_id DROP NOT NULL;
