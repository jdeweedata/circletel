import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

const VAT_RATE = 0.15;

export const b2bSiteActivationInvoice = inngest.createFunction(
  {
    id: 'b2b-site-activation-invoice',
    name: 'B2B Site Activation Pro-Rata Invoice',
    retries: 3,
  },
  { event: 'b2b/site.activated' },
  async ({ event, step }) => {
    const { site_id, organisation_id, activated_at, package_id, monthly_fee, service_id } = event.data;

    if (!monthly_fee || monthly_fee <= 0) {
      console.log(`[B2B Invoice] Skipping site ${site_id} — no monthly fee`);
      return { skipped: true, reason: 'no_monthly_fee' };
    }

    try {
      const supabase = await createClient();

      const duplicate = await step.run('check-duplicate', async () => {
        const activationDate = new Date(activated_at);
        const monthStart = new Date(activationDate.getFullYear(), activationDate.getMonth(), 1);
        const monthEnd = new Date(activationDate.getFullYear(), activationDate.getMonth() + 1, 0);

        const { data } = await supabase
          .from('customer_invoices')
          .select('id')
          .eq('corporate_account_id', organisation_id)
          .eq('service_id', service_id)
          .eq('invoice_type', 'pro_rata')
          .gte('period_start', monthStart.toISOString().split('T')[0])
          .lte('period_end', monthEnd.toISOString().split('T')[0])
          .limit(1);

        return data && data.length > 0;
      });

      if (duplicate) {
        console.log(`[B2B Invoice] Duplicate invoice exists for site ${site_id} this month`);
        return { skipped: true, reason: 'duplicate' };
      }

      const customerId = await step.run('resolve-customer', async () => {
        const { data: account } = await supabase
          .from('corporate_accounts')
          .select('id, company_name, primary_contact_name, primary_contact_email, primary_contact_phone')
          .eq('id', organisation_id)
          .single();

        if (!account) throw new Error(`Corporate account ${organisation_id} not found`);

        const email = account.primary_contact_email || `billing@${account.company_name.toLowerCase().replace(/\s+/g, '')}.co.za`;
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (existing && existing.length > 0) return existing[0].id;

        const nameParts = (account.primary_contact_name || account.company_name).split(' ');
        const firstName = nameParts[0] || account.company_name;
        const lastName = nameParts.slice(1).join(' ') || 'B2B';

        const { data: created, error } = await supabase
          .from('customers')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email,
            phone: account.primary_contact_phone || '0000000000',
          })
          .select('id')
          .single();

        if (error) throw new Error(`Failed to create customer record: ${error.message}`);
        return created.id;
      });

      const invoice = await step.run('create-pro-rata-invoice', async () => {
        const activationDate = new Date(activated_at);
        const year = activationDate.getFullYear();
        const month = activationDate.getMonth();
        const dayOfMonth = activationDate.getDate();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const remainingDays = daysInMonth - dayOfMonth + 1;

        const proRataAmount = Math.round((monthly_fee / daysInMonth) * remainingDays * 100) / 100;
        const vatAmount = Math.round(proRataAmount * VAT_RATE * 100) / 100;
        const totalAmount = Math.round((proRataAmount + vatAmount) * 100) / 100;

        const periodStart = activationDate.toISOString().split('T')[0];
        const periodEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
        const invoiceDate = periodStart;
        const dueDate = new Date(year, month + 1, 1).toISOString().split('T')[0];

        const { data: account } = await supabase
          .from('corporate_accounts')
          .select('company_name')
          .eq('id', organisation_id)
          .single();

        const { data: site } = await supabase
          .from('corporate_sites')
          .select('site_name')
          .eq('id', site_id)
          .single();

        const siteName = site?.site_name || 'Unknown Site';
        const companyName = account?.company_name || 'Unknown';

        const lineItems = [
          {
            description: `Pro-rata: ${siteName} — ${remainingDays}/${daysInMonth} days (${periodStart} to ${periodEnd})`,
            quantity: 1,
            unit_price: proRataAmount,
            amount: proRataAmount,
            type: 'pro_rata',
          },
        ];

        const invoiceNumber = `INV-${year}-${String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0')}`;

        const { data: inv, error } = await supabase
          .from('customer_invoices')
          .insert({
            customer_id: customerId,
            corporate_account_id: organisation_id,
            service_id: service_id || null,
            invoice_number: invoiceNumber,
            invoice_type: 'pro_rata',
            invoice_date: invoiceDate,
            due_date: dueDate,
            period_start: periodStart,
            period_end: periodEnd,
            subtotal: proRataAmount,
            vat_rate: VAT_RATE,
            tax_amount: vatAmount,
            total_amount: totalAmount,
            amount_due: totalAmount,
            amount_paid: 0,
            line_items: lineItems,
            status: 'unpaid',
            notes: `Pro-rata activation invoice for ${siteName} (${companyName})`,
          })
          .select('id, invoice_number, total_amount')
          .single();

        if (error) throw new Error(`Failed to create invoice: ${error.message}`);
        return inv;
      });

      console.log(`[B2B Invoice] Created ${invoice.invoice_number} for site ${site_id}: R${invoice.total_amount}`);
      return { invoice_id: invoice.id, invoice_number: invoice.invoice_number, total_amount: invoice.total_amount };

    } catch (error) {
      await step.run('send-failure-event', async () => {
        await inngest.send({
          name: 'b2b/site.activation-invoice.failed',
          data: {
            site_id,
            organisation_id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      });
      throw error;
    }
  }
);
