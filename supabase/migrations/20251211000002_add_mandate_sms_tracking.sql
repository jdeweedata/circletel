-- Add SMS tracking fields to emandate_requests table for Clickatell delivery tracking
ALTER TABLE emandate_requests
ADD COLUMN IF NOT EXISTS sms_message_id TEXT,
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sms_delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_error TEXT,
ADD COLUMN IF NOT EXISTS sms_provider TEXT DEFAULT 'netcash';

-- Create index for SMS tracking queries
CREATE INDEX IF NOT EXISTS idx_emandate_requests_sms_status 
ON emandate_requests(sms_delivery_status) 
WHERE sms_message_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN emandate_requests.sms_message_id IS 'Clickatell message ID for delivery tracking';
COMMENT ON COLUMN emandate_requests.sms_sent_at IS 'Timestamp when SMS was sent';
COMMENT ON COLUMN emandate_requests.sms_delivery_status IS 'SMS delivery status: pending, delivered, failed, expired';
COMMENT ON COLUMN emandate_requests.sms_delivered_at IS 'Timestamp when SMS was delivered';
COMMENT ON COLUMN emandate_requests.sms_error IS 'Error message if SMS failed';
COMMENT ON COLUMN emandate_requests.sms_provider IS 'SMS provider: netcash or clickatell';
