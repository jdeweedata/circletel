
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env parser
function parseEnv(content: string) {
  const res: Record<string, string> = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/\\n/gm, '\n');
      }
      value = value.replace(/(^['"]|['"]$)/g, '').trim();
      res[match[1]] = value;
    }
  });
  return res;
}

// Try to load env vars from .env.production.latest if standard env vars are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const envPath = path.resolve(process.cwd(), '.env.production.latest');
  if (fs.existsSync(envPath)) {
    const envConfig = parseEnv(fs.readFileSync(envPath, 'utf8'));
    for (const k in envConfig) {
      if (!process.env[k]) process.env[k] = envConfig[k];
    }
    console.log('Loaded environment from .env.production.latest');
  } else {
    // Fallback to .env
    const localEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(localEnvPath)) {
       const envConfig = parseEnv(fs.readFileSync(localEnvPath, 'utf8'));
        for (const k in envConfig) {
           if (!process.env[k]) process.env[k] = envConfig[k];
        }
        console.log('Loaded environment from .env');
    }
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    console.error('Please ensure .env or .env.production.latest exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Inspecting NetCash Data...');
  console.log('==============================');

  // 1. Check Payment Webhook Logs
  console.log('\n📡 Recent NetCash Webhooks (payment_webhook_logs):');
  const { data: webhooks, error: webhookError } = await supabase
    .from('payment_webhook_logs')
    .select('id, event_type, status, received_at, transaction_id, reference, body_parsed')
    .eq('provider', 'netcash')
    .order('received_at', { ascending: false })
    .limit(5);

  if (webhookError) {
    console.error('Error fetching webhooks:', webhookError.message);
  } else if (!webhooks || webhooks.length === 0) {
    console.log('No recent NetCash webhooks found.');
  } else {
    webhooks.forEach(hook => {
      console.log(`- [${new Date(hook.received_at).toLocaleString()}] ${hook.event_type} (${hook.status})`);
      console.log(`  Transaction ID: ${hook.transaction_id}, Reference: ${hook.reference}`);
      console.log(`  Parsed Body: ${JSON.stringify(hook.body_parsed).substring(0, 100)}...`);
    });
  }

  // 2. Check Payment Transactions
  console.log('\n💳 Recent NetCash Transactions (payment_transactions):');
  const { data: transactions, error: transactionError } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('provider', 'netcash')
    .order('initiated_at', { ascending: false })
    .limit(5);

  if (transactionError) {
    console.error('Error fetching transactions:', transactionError.message);
  } else if (!transactions || transactions.length === 0) {
    console.log('No recent NetCash transactions found.');
  } else {
    transactions.forEach(tx => {
      console.log(`- [${new Date(tx.initiated_at).toLocaleString()}] Status: ${tx.status}`);
      console.log(`  Amount: ${tx.amount} ${tx.currency}`);
      console.log(`  Transaction ID: ${tx.transaction_id}, Reference: ${tx.reference}`);
    });
  }

  // 3. Check Consumer Orders Payment Status
  console.log('\n📦 Recent Orders (consumer_orders):');
  const { data: orders, error: orderError } = await supabase
    .from('consumer_orders')
    .select('order_number, status, payment_status, payment_method, updated_at, total_paid')
    .order('updated_at', { ascending: false })
    .limit(5);
    
  if (orderError) {
    console.error('Error fetching orders:', orderError.message);
  } else {
    orders.forEach(order => {
        console.log(`- ${order.order_number}: Status=${order.status}, Payment=${order.payment_status} (Method: ${order.payment_method || 'None'})`);
        console.log(`  Updated: ${new Date(order.updated_at).toLocaleString()}, Total Paid: ${order.total_paid}`);
    });
  }
  
  console.log('\n✅ Inspection Complete');
}

main().catch(console.error);
