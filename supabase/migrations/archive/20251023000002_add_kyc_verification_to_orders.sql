-- Migration: Add KYC/FICA/RICA Verification to Orders
-- Date: 2025-10-23
-- Purpose: Add KYC verification status tracking to consumer_orders table for regulatory compliance

-- Add KYC verification columns to consumer_orders table
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS kyc_verification_status TEXT DEFAULT 'pending'
  CHECK (kyc_verification_status IN ('pending', 'under_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS kyc_reviewer_id UUID REFERENCES admin_users(id),
ADD COLUMN IF NOT EXISTS kyc_verification_notes TEXT,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;

-- Create index for KYC status queries
CREATE INDEX IF NOT EXISTS idx_consumer_orders_kyc_status
ON consumer_orders(kyc_verification_status);

-- Create index for reviewer tracking
CREATE INDEX IF NOT EXISTS idx_consumer_orders_kyc_reviewer
ON consumer_orders(kyc_reviewer_id);

-- Add comments
COMMENT ON COLUMN consumer_orders.kyc_verification_status IS
'KYC/FICA/RICA verification status: pending (not submitted), under_review (submitted for review), approved (verified), rejected (needs resubmission)';

COMMENT ON COLUMN consumer_orders.kyc_submitted_at IS
'Timestamp when customer submitted KYC documents for review';

COMMENT ON COLUMN consumer_orders.kyc_reviewed_at IS
'Timestamp when admin completed KYC review (approved or rejected)';

COMMENT ON COLUMN consumer_orders.kyc_reviewer_id IS
'Admin user who reviewed and approved/rejected the KYC documents';

COMMENT ON COLUMN consumer_orders.kyc_verification_notes IS
'Internal notes from KYC reviewer about the verification process';

COMMENT ON COLUMN consumer_orders.kyc_rejection_reason IS
'Reason for KYC rejection (shown to customer if rejected)';

-- Optional: Create a view for KYC statistics
CREATE OR REPLACE VIEW v_kyc_verification_stats AS
SELECT
  kyc_verification_status,
  COUNT(*) as count,
  COUNT(CASE WHEN kyc_submitted_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
  COUNT(CASE WHEN kyc_submitted_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7d,
  AVG(EXTRACT(EPOCH FROM (kyc_reviewed_at - kyc_submitted_at)) / 3600) as avg_review_time_hours
FROM consumer_orders
WHERE kyc_submitted_at IS NOT NULL
GROUP BY kyc_verification_status;

COMMENT ON VIEW v_kyc_verification_stats IS
'Statistics view showing KYC verification counts by status and average review time';
