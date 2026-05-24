-- Add attempts column to otp_verifications for serverless-safe attempt tracking
ALTER TABLE public.otp_verifications
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.otp_verifications.attempts IS 'Number of verification attempts made against this OTP code';
