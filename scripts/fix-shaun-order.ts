/**
 * Fix Shaun Robertson's Order
 * 
 * This script:
 * 1. Activates billing on his order
 * 2. Creates a customer_services record
 * 3. Generates his first invoice
 * 
 * Run with: npx ts-node scripts/fix-shaun-order.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY!; // Using anon key, will need service role for writes

// Shaun's details
const SHAUN_ORDER_ID = '052e143e-0b6f-48bb-a754-421d5864ba65';
const SHAUN_CUSTOMER_ID = '96cbba3b-bfc8-4324-a3fe-1283f5f01689';

async function fixShaunOrder() {
  console.log('=== Fixing Shaun Robertson Order ===\n');
  
  // Note: This script outputs the SQL commands to run manually
  // since we need service_role access for writes
  
  const now = new Date();
  const activationDate = new Date('2025-11-24'); // His installation was completed on Nov 24
  
  // Calculate billing details
  // Since activation was Nov 24, next billing cycle would be Dec 1
  const nextBillingDate = new Date('2025-12-01');
  const billingCycleDay = 1;
  
  // Pro-rata calculation: Nov 24 to Dec 1 = 7 days
  const daysInNov = 30;
  const prorataDays = 7;
  const monthlyPrice = 899;
  const dailyRate = monthlyPrice / daysInNov;
  const prorataAmount = Math.round(dailyRate * prorataDays * 100) / 100;
  
  console.log('Billing Calculation:');
  console.log(`- Activation Date: 2025-11-24`);
  console.log(`- Next Billing Date: 2025-12-01`);
  console.log(`- Pro-rata Days: ${prorataDays}`);
  console.log(`- Pro-rata Amount: R${prorataAmount.toFixed(2)}`);
  console.log(`- Monthly Amount: R${monthlyPrice}`);
  console.log('');
  
  // Generate SQL commands
  console.log('=== SQL Commands to Execute ===\n');
  
  // 1. Update consumer_orders to activate billing
  console.log('-- 1. Activate billing on consumer_orders');
  console.log(`UPDATE consumer_orders SET
  billing_active = true,
  billing_activated_at = '${now.toISOString()}',
  billing_start_date = '2025-11-24',
  next_billing_date = '2025-12-01',
  billing_cycle_day = 1,
  prorata_amount = ${prorataAmount},
  prorata_days = ${prorataDays},
  updated_at = '${now.toISOString()}'
WHERE id = '${SHAUN_ORDER_ID}';
`);

  // 2. Create customer_services record
  // NOTE: Using actual columns from customer_services table
  console.log('-- 2. Create customer_services record');
  console.log(`INSERT INTO customer_services (
  id,
  customer_id,
  service_type,
  package_name,
  speed_down,
  speed_up,
  data_cap_gb,
  installation_address,
  monthly_price,
  setup_fee,
  status,
  active,
  activation_date,
  provider_name,
  provider_code,
  contract_months,
  contract_start_date,
  contract_end_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${SHAUN_CUSTOMER_ID}',
  'wireless',
  'SkyFibre Home Plus',
  100,
  50,
  NULL,
  'Farrar St, Comet, Boksburg, 1459, Gauteng, 1501',
  899.00,
  0.00,
  'active',
  true,
  '2025-11-24',
  'MTN',
  'MTN',
  24,
  '2025-11-24',
  '2027-11-24',
  '${now.toISOString()}',
  '${now.toISOString()}'
);
`);

  // 3. Generate invoice for December
  const invoiceNumber = `INV-2025-${String(Date.now()).slice(-6)}`;
  const invoiceDueDate = '2025-12-01';
  
  console.log('-- 3. Generate December invoice');
  console.log(`INSERT INTO customer_invoices (
  id,
  customer_id,
  invoice_number,
  invoice_date,
  due_date,
  period_start,
  period_end,
  subtotal,
  vat_amount,
  total_amount,
  status,
  payment_method,
  notes,
  created_at
) VALUES (
  gen_random_uuid(),
  '${SHAUN_CUSTOMER_ID}',
  '${invoiceNumber}',
  '${now.toISOString().split('T')[0]}',
  '${invoiceDueDate}',
  '2025-12-01',
  '2025-12-31',
  ${(monthlyPrice / 1.15).toFixed(2)},
  ${(monthlyPrice - monthlyPrice / 1.15).toFixed(2)},
  ${monthlyPrice.toFixed(2)},
  'unpaid',
  'debit_order',
  'December 2025 - SkyFibre Home Plus subscription',
  '${now.toISOString()}'
);
`);

  // 4. Log the status change
  console.log('-- 4. Log status change');
  console.log(`INSERT INTO order_status_history (
  entity_type,
  entity_id,
  old_status,
  new_status,
  change_reason,
  automated,
  customer_notified,
  status_changed_at,
  created_at
) VALUES (
  'consumer_order',
  '${SHAUN_ORDER_ID}',
  'active',
  'billing_active',
  'Manual billing activation - customer payment method verified',
  false,
  false,
  '${now.toISOString()}',
  '${now.toISOString()}'
);
`);

  console.log('=== Instructions ===');
  console.log('1. Copy the SQL commands above');
  console.log('2. Go to Supabase Dashboard > SQL Editor');
  console.log('3. Paste and run each command');
  console.log('4. Verify the changes in the admin panel');
  console.log('');
  console.log('After running these commands:');
  console.log('- Shaun\'s order will have billing_active = true');
  console.log('- A customer_services record will exist for invoice generation');
  console.log('- His December invoice will be ready for debit order collection');
}

fixShaunOrder().catch(console.error);
