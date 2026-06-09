-- Scope the duplicate-phone protection to PERSONAL accounts only.
-- Business/clinic accounts (e.g. Unjani) legitimately share one nurse's number
-- across multiple clinics, so the global one-number-one-account rule must not
-- apply to them. Consumer dedupe (mobile OTP login resolution) is preserved.

DROP INDEX IF EXISTS customers_phone_unique_not_blank;

CREATE UNIQUE INDEX customers_phone_unique_not_blank
  ON public.customers USING btree (phone)
  WHERE ((phone)::text <> ''::text AND (account_type)::text = 'personal'::text);
