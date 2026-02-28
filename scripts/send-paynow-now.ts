/**
 * One-time script to send PayNow notifications for specific invoices
 * Run with: npx tsx scripts/send-paynow-now.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { processPayNowForInvoice } from '../lib/billing/paynow-billing-service';

const invoices = [
  {
    invoiceId: '8fc309dc-0192-4286-abb9-7a80d2aee71d',
    customer: 'Prins Mhlanga',
    invoiceNumber: 'INV-2026-00003',
    amount: 999.00
  },
  {
    invoiceId: 'b770a33b-14e3-4ec6-8992-440ef12b80a2',
    customer: 'Shaun Robertson',
    invoiceNumber: 'INV-2026-00004',
    amount: 899.00
  }
];

async function main() {
  console.log('🚀 Processing PayNow for invoices...\n');
  
  for (const inv of invoices) {
    console.log(`📧 Processing ${inv.customer} - ${inv.invoiceNumber} (R${inv.amount})`);
    
    try {
      const result = await processPayNowForInvoice(inv.invoiceId, {
        sendEmail: true,
        sendSms: true,
        smsTemplate: 'paymentDue',
        forceRegenerate: false,
      });
      
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   💳 PayNow URL: ${result.paymentUrl || 'N/A'}`);
      console.log(`   📧 Email sent: ${result.notificationResult?.emailSent || false}`);
      console.log(`   📱 SMS sent: ${result.notificationResult?.smsSent || false}`);
      if (result.errors.length > 0) {
        console.log(`   ⚠️ Errors: ${result.errors.join(', ')}`);
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }
  
  console.log('Done!');
}

main().catch(console.error);
