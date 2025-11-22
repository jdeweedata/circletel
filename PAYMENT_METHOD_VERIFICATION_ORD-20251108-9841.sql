-- =====================================================
-- Payment Method Verification for Order ORD-20251108-9841
-- Run this in Supabase Dashboard → SQL Editor
--
-- IMPORTANT: This is a R1.00 verification payment, NOT the R899.00 monthly fee
-- The order is NOT paid yet - first billing will be December 1st, 2025
-- =====================================================

-- Step 1: Record R1.00 verification payment transaction
INSERT INTO payment_transactions (
  transaction_id,
  reference,
  provider,
  amount,
  currency,
  status,
  payment_method,
  customer_id,
  customer_email,
  customer_name,
  order_id,
  metadata,
  initiated_at,
  completed_at,
  created_at,
  updated_at
) VALUES (
  'NETCASH-VERIFY-052e143e',
  'ORD-20251108-9841-VERIFY',
  'netcash',
  1.00,  -- R1.00 verification charge
  'ZAR',
  'completed',
  'Debit Order Verification',
  '96cbba3b-bfc8-4324-a3fe-1283f5f01689',
  'shaunr07@gmail.com',
  'Shaun Robertson',
  '052e143e-0b6f-48bb-a754-421d5864ba65',
  '{
    "source": "manual_entry",
    "note": "R1.00 payment method verification via NetCash",
    "manually_created": true,
    "processed_by": "admin",
    "date": "2025-11-22",
    "verification_only": true,
    "first_billing_date": "2025-12-01",
    "monthly_amount": 899.00
  }'::jsonb,
  NOW() - INTERVAL '1 hour',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (transaction_id) DO NOTHING;

-- Step 2: Update order with payment method info (BUT NOT AS PAID)
-- Order remains unpaid until Dec 1st first billing
-- Note: Billing cycle details will be set during service activation
UPDATE consumer_orders SET
  payment_method = 'Debit Order',
  updated_at = NOW()
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65';

-- Step 3: Create or update payment method with debit order mandate
DO $$
DECLARE
  v_customer_id uuid := '96cbba3b-bfc8-4324-a3fe-1283f5f01689';
  v_payment_method_id uuid;
BEGIN
  -- Check if payment method exists
  SELECT id INTO v_payment_method_id
  FROM customer_payment_methods
  WHERE customer_id = v_customer_id
  AND method_type = 'debit_order'
  AND is_active = true
  LIMIT 1;

  -- If no debit order payment method exists, create one
  IF v_payment_method_id IS NULL THEN
    INSERT INTO customer_payment_methods (
      customer_id,
      method_type,
      display_name,
      last_four,
      encrypted_details,
      mandate_status,
      is_primary,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_customer_id,
      'debit_order',
      'NetCash Debit Order',
      'XXXX',
      '{
        "provider": "netcash",
        "verified": true,
        "verification_date": "2025-11-22",
        "verification_amount": 1.00,
        "manually_created": true,
        "note": "Debit order mandate verified via R1.00 charge",
        "first_billing_date": "2025-12-01",
        "monthly_amount": 899.00
      }'::jsonb,
      'active',  -- Mandate is active and verified
      true,      -- Set as primary payment method
      true,      -- Active
      NOW(),
      NOW()
    )
    RETURNING id INTO v_payment_method_id;

    RAISE NOTICE 'Created new debit order payment method: %', v_payment_method_id;
  ELSE
    -- Update existing payment method to active
    UPDATE customer_payment_methods SET
      is_active = true,
      mandate_status = 'active',
      updated_at = NOW()
    WHERE id = v_payment_method_id;

    RAISE NOTICE 'Updated existing payment method: %', v_payment_method_id;
  END IF;
END $$;

-- Step 4: Verify the updates
SELECT
  'ORDER STATUS' as check_type,
  order_number,
  status::text as current_status,
  payment_status,
  payment_method,
  payment_reference,
  total_paid::text || ' ZAR' as amount_paid,
  'Set during activation' as first_billing_date,
  NULL::integer as billing_cycle_day
FROM consumer_orders
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65'

UNION ALL

SELECT
  'VERIFICATION PAYMENT' as check_type,
  transaction_id as order_number,
  status::text as current_status,
  payment_method as payment_status,
  provider as payment_method,
  reference as payment_reference,
  amount::text || ' ' || currency as amount_paid,
  to_char(completed_at, 'YYYY-MM-DD HH24:MI') as first_billing_date,
  NULL::integer as billing_cycle_day
FROM payment_transactions
WHERE order_id = '052e143e-0b6f-48bb-a754-421d5864ba65'
AND metadata->>'verification_only' = 'true'
ORDER BY check_type;

-- Step 5: Show payment method status
SELECT
  'PAYMENT METHOD' as info,
  id,
  method_type,
  display_name,
  mandate_status,
  CASE WHEN is_active THEN 'ACTIVE ✓' ELSE 'INACTIVE ✗' END as active_status,
  CASE WHEN is_primary THEN 'PRIMARY ✓' ELSE 'NOT PRIMARY' END as primary_status,
  encrypted_details->>'verified' as verified,
  encrypted_details->>'verification_amount' as verification_amount,
  encrypted_details->>'first_billing_date' as first_billing_date
FROM customer_payment_methods
WHERE customer_id = '96cbba3b-bfc8-4324-a3fe-1283f5f01689';

-- =====================================================
-- ✅ SUMMARY OF CHANGES:
--
-- ✓ R1.00 verification payment recorded (NOT R899.00 full payment)
-- ✓ Payment method created with mandate_status='active'
-- ✓ Order payment_method updated to 'Debit Order'
-- ✓ Billing cycle details: Will be set during service activation
-- ✓ Order payment_status remains 'pending' (NOT paid yet)
-- ✓ Order status remains 'installation_in_progress'
--
-- 📋 WHAT THIS MEANS:
--
-- 1. Payment Method Status:
--    ✅ Verified with R1.00 charge
--    ✅ Debit order mandate active
--    ✅ Ready for monthly billing
--
-- 2. Order Status:
--    ⏳ NOT paid yet (payment_status = 'pending')
--    ⏳ Total paid = R0.00 (only verification charge processed)
--    ⏳ First payment: December 1st, 2025 for R899.00
--
-- 3. Customer Experience:
--    🎁 Free service: Nov 22 - Nov 30 (9 days)
--    💳 First charge: Dec 1st for R899.00
--    🔁 Recurring: 1st of each month thereafter
--
-- 📋 NEXT STEPS TO COMPLETE ORDER:
--
-- 1. 📸 Complete installation (DO THIS NEXT):
--    - Go to: https://www.circletel.co.za/admin/orders/052e143e-0b6f-48bb-a754-421d5864ba65
--    - Click "Complete Installation" button
--    - Upload installation proof:
--      • Router/ONT equipment photos
--      • Cable installation photos
--      • Signed technician forms (if available)
--    - Add notes: "Installation completed successfully. Customer confirmed service working."
--    - Submit → Order moves to 'installation_completed'
--
-- 2. 🚀 Activate service with Dec 1st billing (FINAL STEP):
--    - Click "Activate Service" button
--    - System validates:
--      ✓ Installation document uploaded
--      ✓ Payment method verified (mandate_status = 'active') ✅
--    - Set billing parameters:
--      • Activation date: Today (2025-11-22)
--      • First billing date: December 1st, 2025 ⚠️ IMPORTANT
--      • Monthly amount: R899.00
--      • Billing cycle: 1st of month
--    - NO pro-rata charge (customer gets free service until Dec 1st)
--    - Submit → Order moves to 'active'
--    - 🎉 Service is live! First billing: Dec 1st!
--
-- ⚠️ CRITICAL NOTES:
--
-- 1. This is NOT a paid order:
--    - Only R1.00 verification was charged
--    - Customer has NOT paid R899.00 yet
--    - First payment will be automatically charged on Dec 1st
--
-- 2. When activating the service:
--    - Set billing_start_date = '2025-12-01'
--    - Do NOT charge pro-rata
--    - Customer gets 9 days free (Nov 22-30)
--
-- 3. Debit order will run automatically:
--    - First run: December 1st, 2025 for R899.00
--    - Recurring: 1st of each month
--    - NetCash will charge the customer's payment method
--
-- ⚠️ WEBHOOK CONFIGURATION FOR FUTURE:
-- To prevent manual processing, configure NetCash webhook URL:
-- https://www.circletel.co.za/api/payments/netcash/webhook
--
-- Contact NetCash support to add this webhook URL to your account.
-- This will automatically process payments and update orders in real-time.
-- =====================================================
