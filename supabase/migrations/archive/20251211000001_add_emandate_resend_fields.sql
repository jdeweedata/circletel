-- Add resend tracking fields to emandate_requests table
ALTER TABLE emandate_requests
ADD COLUMN IF NOT EXISTS resend_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_resent_at TIMESTAMPTZ;

-- Add index for tracking resends
CREATE INDEX IF NOT EXISTS idx_emandate_requests_resend 
ON emandate_requests(last_resent_at DESC) 
WHERE resend_count > 0;

-- Comment
COMMENT ON COLUMN emandate_requests.resend_count IS 'Number of times the mandate has been resent to the customer';
COMMENT ON COLUMN emandate_requests.last_resent_at IS 'Timestamp of the last resend attempt';
