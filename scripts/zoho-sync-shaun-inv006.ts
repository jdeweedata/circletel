/**
 * Sync Shaun Robertson's INV-2026-00006 payment to Zoho Books
 * 3-step: Customer → Invoice → Payment
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/zoho-sync-shaun-inv006.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const IDS = {
  customer: '96cbba3b-bfc8-4324-a3fe-1283f5f01689',
  invoice: '168cd835-5e0d-4a59-bc49-dd218f7e2cb4',
  payment: '73e2fc8d-c92f-4533-8e55-f2356405be6b',
};

const CUSTOMER = {
  firstName: 'Shaun',
  lastName: 'Robertson',
  email: 'shaunr07@gmail.com',
  phone: '0826574256',
  accountNumber: 'CT-2025-00012',
};

const INVOICE = {
  number: 'INV-2026-00006',
  amount: 899.00,
  date: '2026-04-01',
  dueDate: '2026-04-10',
  period: 'April 2026',
  service: 'SkyFibre Home Plus (100/50 Mbps)',
};

const PAYMENT = {
  amount: 899.00,
  date: '2026-04-07',
  method: 'Ozow',
  reference: 'CT-20260407-netcash',
};

// Zoho Books API helpers
const ZOHO_REGION = process.env.ZOHO_REGION || 'US';
const ZOHO_ORG_ID = process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORG_ID || '';

function getBooksBaseUrl(): string {
  const regionMap: Record<string, string> = {
    US: 'https://www.zohoapis.com/books/v3',
    EU: 'https://www.zohoapis.eu/books/v3',
    IN: 'https://www.zohoapis.in/books/v3',
    AU: 'https://www.zohoapis.com.au/books/v3',
  };
  return regionMap[ZOHO_REGION] || regionMap.US;
}

async function getAccessToken(): Promise<string> {
  // Self Client credentials (has ZohoBooks.fullaccess.ALL scope)
  const refreshToken = process.env.ZOHO_BOOKS_REFRESH_TOKEN || '1000.e10c748912f5df1e0d200340927e2323.7d9a7ccf1f7273b5f78b104ae6bde1a0';
  const clientId = process.env.ZOHO_BOOKS_CLIENT_ID || '1000.EIDKFRP87CAZYVGZKABAOV1Y4LP8RF';
  const clientSecret = process.env.ZOHO_BOOKS_CLIENT_SECRET || '3c5ed40803e136bcb749efe8ae02e188fef9df34ff';

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Missing Zoho OAuth credentials');
  }

  const tokenUrl = ZOHO_REGION === 'EU'
    ? 'https://accounts.zoho.eu/oauth/v2/token'
    : ZOHO_REGION === 'IN'
    ? 'https://accounts.zoho.in/oauth/v2/token'
    : 'https://accounts.zoho.com/oauth/v2/token';

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function zohoRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const accessToken = await getAccessToken();
  const baseUrl = getBooksBaseUrl();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}${endpoint}${separator}organization_id=${ZOHO_ORG_ID}`;

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Zoho API ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

// Step 1: Sync Customer
async function syncCustomer(): Promise<string> {
  console.log('\n=== Step 1: Sync Customer to Zoho Books ===');

  // Check if already synced
  const { data: customer } = await supabase
    .from('customers')
    .select('zoho_books_contact_id')
    .eq('id', IDS.customer)
    .single();

  if (customer?.zoho_books_contact_id) {
    console.log('✅ Customer already synced:', customer.zoho_books_contact_id);
    return customer.zoho_books_contact_id;
  }

  // Search by email first
  const searchResult = await zohoRequest(`/contacts?email=${encodeURIComponent(CUSTOMER.email)}`);
  let contactId: string;

  if (searchResult.contacts && searchResult.contacts.length > 0) {
    contactId = searchResult.contacts[0].contact_id;
    console.log('Found existing contact:', contactId);
  } else {
    // Create new contact
    const payload = {
      contact_name: `${CUSTOMER.firstName} ${CUSTOMER.lastName}`,
      first_name: CUSTOMER.firstName,
      last_name: CUSTOMER.lastName,
      email: CUSTOMER.email,
      phone: CUSTOMER.phone,
      contact_type: 'customer',
      custom_fields: [
        { label: 'Account Number', value: CUSTOMER.accountNumber },
      ],
    };

    const createResult = await zohoRequest('/contacts', 'POST', payload);
    contactId = createResult.contact.contact_id;
    console.log('Created new contact:', contactId);
  }

  // Update Supabase
  const { error } = await supabase
    .from('customers')
    .update({
      zoho_books_contact_id: contactId,
      zoho_sync_status: 'synced',
      zoho_last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', IDS.customer);

  if (error) {
    console.error('Failed to update customer record:', error.message);
  } else {
    console.log('✅ Customer synced to Zoho Books');
  }

  return contactId;
}

// Step 2: Sync Invoice
async function syncInvoice(contactId: string): Promise<string> {
  console.log('\n=== Step 2: Sync Invoice to Zoho Books ===');

  // Check if already synced
  const { data: invoice } = await supabase
    .from('customer_invoices')
    .select('zoho_books_invoice_id')
    .eq('id', IDS.invoice)
    .single();

  if (invoice?.zoho_books_invoice_id) {
    console.log('✅ Invoice already synced:', invoice.zoho_books_invoice_id);
    return invoice.zoho_books_invoice_id;
  }

  // Search by number first
  const searchResult = await zohoRequest(`/invoices?invoice_number=${encodeURIComponent(INVOICE.number)}`);

  let invoiceId: string;

  if (searchResult.invoices && searchResult.invoices.length > 0) {
    invoiceId = searchResult.invoices[0].invoice_id;
    console.log('Found existing invoice:', invoiceId);
  } else {
    // Create invoice
    const payload = {
      customer_id: contactId,
      invoice_number: INVOICE.number,
      date: INVOICE.date,
      due_date: INVOICE.dueDate,
      line_items: [
        {
          name: INVOICE.service,
          description: `Monthly subscription - ${INVOICE.period}`,
          rate: INVOICE.amount,
          quantity: 1,
        },
      ],
      notes: `CircleTel invoice for ${INVOICE.period}. Account: ${CUSTOMER.accountNumber}`,
    };

    const createResult = await zohoRequest(
      '/invoices?ignore_auto_number_generation=true',
      'POST',
      payload
    );
    invoiceId = createResult.invoice.invoice_id;
    console.log('Created invoice:', invoiceId);

    // Mark as sent
    await zohoRequest(`/invoices/${invoiceId}/status/sent`, 'POST');
    console.log('Marked invoice as sent');
  }

  // Update Supabase
  const { error } = await supabase
    .from('customer_invoices')
    .update({
      zoho_books_invoice_id: invoiceId,
      zoho_sync_status: 'synced',
      zoho_last_synced_at: new Date().toISOString(),
      zoho_last_sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', IDS.invoice);

  if (error) {
    console.error('Failed to update invoice record:', error.message);
  } else {
    console.log('✅ Invoice synced to Zoho Books');
  }

  return invoiceId;
}

// Step 3: Sync Payment
async function syncPayment(contactId: string, invoiceId: string): Promise<void> {
  console.log('\n=== Step 3: Sync Payment to Zoho Books ===');

  // Check if already synced
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('zoho_books_payment_id')
    .eq('id', IDS.payment)
    .single();

  if (payment?.zoho_books_payment_id) {
    console.log('✅ Payment already synced:', payment.zoho_books_payment_id);
    return;
  }

  // Record payment in Zoho Books
  const payload = {
    customer_id: contactId,
    payment_mode: 'Online Payment',
    amount: PAYMENT.amount,
    date: PAYMENT.date,
    reference_number: PAYMENT.reference,
    description: `Payment via ${PAYMENT.method} for ${INVOICE.number}`,
    invoices: [
      {
        invoice_id: invoiceId,
        amount_applied: PAYMENT.amount,
      },
    ],
  };

  const result = await zohoRequest('/customerpayments', 'POST', payload);
  const paymentId = result.payment.payment_id;
  console.log('Recorded payment:', paymentId);

  // Update Supabase
  const { error } = await supabase
    .from('payment_transactions')
    .update({
      zoho_books_payment_id: paymentId,
      zoho_sync_status: 'synced',
      updated_at: new Date().toISOString(),
    })
    .eq('id', IDS.payment);

  if (error) {
    console.error('Failed to update payment record:', error.message);
  } else {
    console.log('✅ Payment synced to Zoho Books');
  }
}

async function main() {
  console.log('============================================');
  console.log('Zoho Books Sync — Shaun Robertson INV-2026-00006');
  console.log('============================================');

  const missing = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.ZOHO_REFRESH_TOKEN) missing.push('ZOHO_REFRESH_TOKEN');
  if (!process.env.ZOHO_CLIENT_ID) missing.push('ZOHO_CLIENT_ID');
  if (!process.env.ZOHO_CLIENT_SECRET) missing.push('ZOHO_CLIENT_SECRET');
  if (!ZOHO_ORG_ID) missing.push('ZOHO_BOOKS_ORGANIZATION_ID or ZOHO_ORG_ID');

  if (missing.length > 0) {
    console.error('\n❌ Missing env vars:', missing.join(', '));
    process.exit(1);
  }

  try {
    const contactId = await syncCustomer();
    await new Promise(r => setTimeout(r, 200));

    const invoiceId = await syncInvoice(contactId);
    await new Promise(r => setTimeout(r, 200));

    await syncPayment(contactId, invoiceId);

    console.log('\n============================================');
    console.log('✅ All 3 steps completed successfully!');
    console.log('============================================');
    console.log(`Customer → Zoho Contact: ${contactId}`);
    console.log(`Invoice  → Zoho Invoice: ${invoiceId}`);
    console.log('Payment  → Zoho Payment: recorded & linked');
  } catch (error) {
    console.error('\n❌ Sync failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
