-- ============================================================================
-- Manual KYC Approval for Order ORD-20251108-9841
-- ============================================================================
-- Order ID: 052e143e-0b6f-48bb-a754-421d5864ba65
-- Didit Session: e313507c-8f1d-4076-894b-69ca80d27dd8
-- Manual Verification Links:
--   - ID Verification: https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/id-verification
--   - Proof of Address: https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/proof-of-address
-- ============================================================================

BEGIN;

-- 1. Create KYC session record for manual verification
INSERT INTO kyc_sessions (
  id,
  quote_id,
  didit_session_id,
  flow_type,
  user_type,
  status,
  verification_result,
  completed_at,
  created_at,
  extracted_data
)
VALUES (
  gen_random_uuid(),
  NULL, -- This is a consumer order, not a B2B quote
  'e313507c-8f1d-4076-894b-69ca80d27dd8',
  'consumer_light', -- Valid flow_type: sme_light, consumer_light, or full_kyc
  'consumer',
  'completed',
  'approved',
  NOW(),
  NOW(),
  jsonb_build_object(
    'manual_verification', true,
    'verified_by', 'admin',
    'verification_date', NOW(),
    'order_id', '052e143e-0b6f-48bb-a754-421d5864ba65',
    'order_number', 'ORD-20251108-9841',
    'didit_console_links', jsonb_build_array(
      'https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/id-verification',
      'https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/proof-of-address'
    ),
    'notes', 'Manual KYC verification completed in Didit console'
  )
)
ON CONFLICT (didit_session_id) DO NOTHING;

-- 2. Update order status to kyc_approved
UPDATE consumer_orders
SET
  status = 'kyc_approved'::order_status,
  updated_at = NOW()
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65'
AND status = 'kyc_pending'::order_status;

-- 3. Add entry to order status history (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'order_status_history'
  ) THEN
    INSERT INTO order_status_history (
      entity_type,
      entity_id,
      old_status,
      new_status,
      status_changed_at,
      changed_by,
      change_reason,
      automated,
      notes,
      metadata,
      created_at
    )
    VALUES (
      'consumer_orders',
      '052e143e-0b6f-48bb-a754-421d5864ba65',
      'kyc_pending',
      'kyc_approved',
      NOW(),
      NULL, -- changed_by is UUID, set to NULL for manual admin action
      'Manual KYC verification completed in Didit console',
      false,
      'ID verification and proof of address verified via Didit manual checks',
      jsonb_build_object(
        'verification_type', 'manual',
        'didit_session_id', 'e313507c-8f1d-4076-894b-69ca80d27dd8',
        'verification_links', jsonb_build_array(
          'https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/id-verification',
          'https://business.didit.me/console/d3882834-3005-41b4-8738-9dac04c17f8c/e313507c-8f1d-4076-894b-69ca80d27dd8/manual-checks/proof-of-address'
        )
      ),
      NOW()
    );
  END IF;
END $$;

-- 4. Verify the update
SELECT
  id,
  order_number,
  status,
  first_name,
  last_name,
  email,
  updated_at
FROM consumer_orders
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65';

COMMIT;
