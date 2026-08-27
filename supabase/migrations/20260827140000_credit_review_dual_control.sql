-- Dual Control Override sign-offs (MD + CFO) on a credit review.
ALTER TABLE public.order_credit_reviews
  ADD COLUMN IF NOT EXISTS override_signoffs jsonb;

COMMENT ON COLUMN public.order_credit_reviews.override_signoffs IS
  'MD and CFO sign-offs for Dual Control Override. Sales cannot mark PASS.';
