import { createClient } from '@/lib/supabase/server';
import { billingEngine } from '@/lib/billing/engine';
import { MonthlyInvoiceGenerator } from '@/lib/billing/monthly-invoice-generator';
import {
  formatInvoiceNumber,
  nextInvoiceSequence,
} from '@/lib/billing/invoice-amounts';
import { roundMoney } from '@/lib/billing/invoice-vat-contract';
import { whatsAppService } from '@/lib/integrations/whatsapp/whatsapp-service';
import { billingLogger } from '@/lib/logging';
import { loadExceptionDetail } from './load-workbench';

export type CycleMatchAction =
  | 'create_invoice'
  | 'credit_note'
  | 'debit_note'
  | 'request_mandate'
  | 'accept_variance'
  | 'apply_to_pattern';

export interface ActionResult {
  ok: boolean;
  message: string;
  appliedCount?: number;
}

async function appendAudit(
  exceptionId: string,
  event: { kind: string; message: string; actor?: string }
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('billing_cycle_exceptions')
    .select('audit_events')
    .eq('id', exceptionId)
    .single();
  const events = Array.isArray(data?.audit_events) ? data.audit_events : [];
  events.push({ at: new Date().toISOString(), ...event });
  await supabase
    .from('billing_cycle_exceptions')
    .update({ audit_events: events })
    .eq('id', exceptionId);
}

async function markResolved(exceptionId: string, userId?: string) {
  const supabase = await createClient();
  await supabase
    .from('billing_cycle_exceptions')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId ?? null,
    })
    .eq('id', exceptionId);
}

async function createInvoiceForService(serviceId: string): Promise<string> {
  const supabase = await createClient();
  const { data: service, error } = await supabase
    .from('customer_services')
    .select(
      `
      id, customer_id, package_id, package_name, service_type, product_category,
      monthly_price, billing_day, last_invoice_date, billing_start_date, status, activation_date,
      customer:customers(id, first_name, last_name, email, phone, account_number, onboarding_status)
    `
    )
    .eq('id', serviceId)
    .single();
  if (error || !service) throw new Error('Service not found');
  const generator = new MonthlyInvoiceGenerator();
  const invoice = await generator.createInvoice({
    ...service,
    package: service.package_id
      ? { id: service.package_id, name: service.package_name }
      : null,
    customer: Array.isArray(service.customer) ? service.customer[0] : service.customer,
  } as never);
  if (!invoice) throw new Error('Invoice generator returned no invoice');
  return invoice.invoice_number;
}

async function raiseDebitNote(
  serviceId: string,
  amountIncl: number,
  originalInvoiceId: string | null
): Promise<string> {
  const supabase = await createClient();
  const { data: service } = await supabase
    .from('customer_services')
    .select('id, customer_id, package_name')
    .eq('id', serviceId)
    .single();
  if (!service) throw new Error('Service not found');

  const year = new Date().getFullYear();
  const { data: yearInvoices } = await supabase
    .from('customer_invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-${year}-%`);
  const invoiceNumber = formatInvoiceNumber(
    year,
    nextInvoiceSequence(
      (yearInvoices || []).map((r) => r.invoice_number as string),
      year
    )
  );

  const totalAmount = roundMoney(Math.abs(amountIncl));
  const subtotal = roundMoney(totalAmount / 1.15);
  const taxAmount = roundMoney(totalAmount - subtotal);
  const today = new Date().toISOString().slice(0, 10);

  const { data: invoice, error } = await supabase
    .from('customer_invoices')
    .insert({
      invoice_number: invoiceNumber,
      customer_id: service.customer_id,
      service_id: service.id,
      invoice_date: today,
      due_date: today,
      period_start: today.slice(0, 8) + '01',
      period_end: today,
      subtotal,
      vat_rate: 15,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_due: totalAmount,
      amount_paid: 0,
      invoice_type: 'adjustment',
      status: 'sent',
      notes: originalInvoiceId
        ? `Cycle-match debit note against ${originalInvoiceId}`
        : 'Cycle-match catch-up debit note',
      line_items: [
        {
          description: `Contract catch-up — ${service.package_name}`,
          quantity: 1,
          unit_price: subtotal,
          amount: subtotal,
          type: 'adjustment',
        },
      ],
    })
    .select('invoice_number')
    .single();

  if (error || !invoice) throw new Error(error?.message || 'Failed to create debit note');
  return invoice.invoice_number;
}

async function raiseCreditNote(invoiceId: string, amountIncl: number): Promise<string> {
  const note = await billingEngine.createCreditNote(
    {
      original_invoice_id: invoiceId,
      line_items: [
        {
          description: 'Cycle-match credit — cancelled service still billed',
          quantity: 1,
          unit_price: Math.abs(amountIncl),
          amount: Math.abs(amountIncl),
          type: 'adjustment',
        },
      ],
      reason: 'Service cancelled but still billed this cycle',
      reason_category: 'cancellation',
      auto_apply: true,
    },
    { source: 'admin', reason: 'cycle-match credit note' }
  );
  return (note as { credit_note_number?: string }).credit_note_number || 'credit note';
}

async function requestMandate(customerId: string): Promise<string> {
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, phone, first_name, business_name')
    .eq('id', customerId)
    .single();
  if (!customer) throw new Error('Customer not found');
  if (!customer.phone) throw new Error('Customer has no phone number');
  const { data: svcRow } = await supabase
    .from('customer_services')
    .select('monthly_price')
    .eq('customer_id', customerId)
    .maybeSingle();
  const amount = `R${(Number(svcRow?.monthly_price ?? 0) || 0).toFixed(2)}`;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://www.circletel.co.za';
  const result = await whatsAppService.sendDebiCheckReminder(
    customer.phone,
    {
      firstName: customer.first_name || 'there',
      clinicName: customer.business_name || 'your account',
      amount,
      headerImageUrl: `${base}/images/onboarding/debicheck-whatsapp-header.png`,
    },
    { customerId: customer.id, createdBy: 'cycle-match' }
  );
  if (!result.success) throw new Error(result.error || 'Mandate reminder failed');
  return 'Mandate reminder sent';
}

async function applyOne(
  exceptionId: string,
  action: Exclude<CycleMatchAction, 'apply_to_pattern'>,
  actor?: { id?: string; email?: string }
): Promise<ActionResult> {
  const detail = await loadExceptionDetail(exceptionId);
  if (!detail) return { ok: false, message: 'Exception not found' };
  const match = detail.match;
  const recoverable = Number(detail.exception.recoverable) || Math.abs(Number(match.variance) || 0);

  try {
    let message = '';
    if (action === 'create_invoice') {
      const number = await createInvoiceForService(match.service_id);
      message = `Created invoice ${number}`;
    } else if (action === 'debit_note') {
      const number = await raiseDebitNote(
        match.service_id,
        recoverable || Math.abs(Number(match.variance) || 0),
        match.zoho_invoice_id
      );
      message = `Raised debit note ${number}`;
    } else if (action === 'credit_note') {
      if (!match.zoho_invoice_id) throw new Error('No Zoho invoice to credit');
      const number = await raiseCreditNote(
        match.zoho_invoice_id,
        Number(match.zoho_amount_incl_vat) || recoverable
      );
      message = `Created credit note ${number}`;
    } else if (action === 'request_mandate') {
      message = await requestMandate(match.customer_id);
    } else if (action === 'accept_variance') {
      message = 'Variance accepted';
    }

    await appendAudit(exceptionId, {
      kind: action,
      message,
      actor: actor?.email,
    });
    await markResolved(exceptionId, actor?.id);
    return { ok: true, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Action failed';
    billingLogger.error('[cycle-match] action failed', {
      exceptionId,
      action,
      error: message,
    });
    await appendAudit(exceptionId, {
      kind: `${action}_failed`,
      message,
      actor: actor?.email,
    });
    return { ok: false, message };
  }
}

export async function applyCycleMatchAction(
  exceptionId: string,
  action: CycleMatchAction,
  actor?: { id?: string; email?: string }
): Promise<ActionResult> {
  if (action !== 'apply_to_pattern') {
    return applyOne(exceptionId, action, actor);
  }

  const detail = await loadExceptionDetail(exceptionId);
  if (!detail) return { ok: false, message: 'Exception not found' };
  const patternKey = detail.exception.pattern_key;
  if (!patternKey) return { ok: false, message: 'No pattern to apply' };

  const primaryAction = (detail.match.recommended_action || 'debit_note') as Exclude<
    CycleMatchAction,
    'apply_to_pattern'
  >;

  const supabase = await createClient();
  const { data: peers } = await supabase
    .from('billing_cycle_exceptions')
    .select('id')
    .eq('pattern_key', patternKey)
    .eq('status', 'open');

  let applied = 0;
  let lastMessage = '';
  for (const peer of peers || []) {
    const result = await applyOne(peer.id, primaryAction, actor);
    if (result.ok) {
      applied += 1;
      lastMessage = result.message;
    }
  }
  return {
    ok: applied > 0,
    message: lastMessage || `Applied to ${applied} exceptions`,
    appliedCount: applied,
  };
}
