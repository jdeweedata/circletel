-- The eMandate postback webhook and the clinic-mandate-poll cron both set
-- mandate_status='failed' on declined DebiCheck mandates, but the CHECK
-- constraint only allowed pending|active|cancelled|expired — every such
-- update has been failing silently. Widen the constraint to match the code.
-- (Applied to the live DB via MCP apply_migration on 2026-06-11.)
ALTER TABLE customer_payment_methods
  DROP CONSTRAINT customer_payment_methods_mandate_status_check;
ALTER TABLE customer_payment_methods
  ADD CONSTRAINT customer_payment_methods_mandate_status_check
  CHECK (
    mandate_status IS NULL OR mandate_status::text = ANY (ARRAY[
      'pending'::character varying,
      'active'::character varying,
      'approved'::character varying,
      'cancelled'::character varying,
      'expired'::character varying,
      'failed'::character varying
    ]::text[])
  );
