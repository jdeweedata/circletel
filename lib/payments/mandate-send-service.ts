/**
 * Mandate Send Service
 *
 * Reusable, customer-context NetCash eMandate submission shared by every initiator
 * (consumer self-service, admin order page, and B2B). Decouples mandate-send from
 * `consumer_orders` so B2B customers (customers.account_type='business', no order) can be
 * onboarded — order context is optional.
 *
 * Responsibilities:
 *  - Build the EMandateBatchRequest, populating company fields for business customers
 *    (NetCash requires trading/registered/registration name for the Mandates instruction).
 *  - Create the emandate_requests record (order_id optional — null for B2B).
 *  - Submit to NetCash and record the result.
 *
 * The active payment method is written to customer_payment_methods by the webhook /
 * approve-validation on signing (see activate-debit-order-mandate.ts) — not here.
 *
 * @module lib/payments/mandate-send-service
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  NetCashEMandateBatchService,
  EMandateBatchRequest,
} from '@/lib/payments/netcash-emandate-batch-service';
import { paymentLogger } from '@/lib/logging';

const VALID_BILLING_DAYS = [1, 5, 25, 30];

export interface MandateCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  account_type: string | null;
  account_number: string | null;
  business_name?: string | null;
  business_registration?: string | null;
}

export interface SendMandateInput {
  supabase: SupabaseClient;
  customer: MandateCustomer;
  amount: number;
  billingDay: number; // normalised to {1,5,25,30}
  agreementReference: string; // order_number (B2C) or contract/quote ref (B2B)
  orderId?: string | null; // null for B2B
  notes?: string | null;
  initiatedBy?: 'admin' | 'customer';
  createdBy?: string | null; // admin_users.id
  ipAddress?: string | null;
  userAgent?: string | null;
  bankDetails?: {
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    branch_code?: string;
    account_type?: string;
  } | null;
}

export interface SendMandateResult {
  success: boolean;
  emandateRequestId?: string;
  fileToken?: string;
  accountReference: string;
  expiresAt?: string;
  error?: string;
}

function mapBankAccountType(type?: string): number {
  const m: Record<string, number> = {
    cheque: 1, current: 1, savings: 2, transmission: 3,
    Current: 1, Savings: 2, Transmission: 3,
  };
  return (type && m[type]) || 1;
}

export async function sendMandateRequest(input: SendMandateInput): Promise<SendMandateResult> {
  const { supabase, customer } = input;
  const accountReference = customer.account_number || '';

  if (!accountReference) {
    return { success: false, accountReference: '', error: 'Customer account number not assigned' };
  }

  const debitDay = VALID_BILLING_DAYS.includes(input.billingDay) ? input.billingDay : 1;
  const isConsumer = customer.account_type !== 'business';
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const fullName = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();

  const batchRequest: EMandateBatchRequest = {
    accountReference,
    mandateName: fullName || customer.business_name || accountReference,
    mandateAmount: input.amount,
    isConsumer,
    firstName: customer.first_name ?? '',
    surname: customer.last_name ?? '',
    mobileNumber: (customer.phone || '').replace(/^\+27/, '0').replace(/\D/g, ''),
    debitFrequency: 1, // Monthly
    commencementMonth: nextMonth.getMonth() + 1,
    commencementDay: String(debitDay).padStart(2, '0'),
    agreementDate: today,
    agreementReference: input.agreementReference,
    field1: input.orderId || '',
    field2: input.agreementReference,
    field3: customer.id,
    emailAddress: customer.email || undefined,
    sendMandate: true,
    publicHolidayOption: 1,
    // B2B company fields (required by NetCash for the Mandates instruction; omitted for individuals)
    ...(!isConsumer && {
      tradingName: customer.business_name || undefined,
      registeredName: customer.business_name || undefined,
      registrationNumber: customer.business_registration || undefined,
    }),
    ...(input.bankDetails && {
      bankDetailType: 1,
      bankAccountName: input.bankDetails.account_name,
      bankAccountNumber: input.bankDetails.account_number,
      branchCode: input.bankDetails.branch_code,
      bankAccountType: mapBankAccountType(input.bankDetails.account_type),
    }),
  };

  // Create emandate_requests record (order_id optional — null for B2B).
  const { data: emandateRecord, error: erError } = await supabase
    .from('emandate_requests')
    .insert({
      payment_method_id: null,
      order_id: input.orderId ?? null,
      customer_id: customer.id,
      request_type: 'batch',
      status: 'pending',
      netcash_account_reference: accountReference,
      request_payload: {
        ...batchRequest,
        billing_day: debitDay,
        mandate_amount: input.amount,
        initiated_by: input.initiatedBy ?? 'admin',
        is_consumer: isConsumer,
        admin_notes: input.notes ?? null,
      },
      notification_email: customer.email,
      notification_phone: customer.phone,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      created_by: input.createdBy ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (erError || !emandateRecord) {
    paymentLogger.error('[MandateSend] Failed to create emandate request', { error: erError?.message });
    return { success: false, accountReference, error: 'Failed to create eMandate request' };
  }

  // Submit to NetCash.
  try {
    const service = new NetCashEMandateBatchService();
    const batchResult = await service.submitMandate(batchRequest);

    if (!batchResult.success) {
      throw new Error(
        `NetCash API error: ${batchResult.errorCode} - ${batchResult.errorMessage || 'Unknown error'}`
      );
    }

    const fileToken = batchResult.fileToken;

    await supabase
      .from('emandate_requests')
      .update({
        status: 'sent',
        netcash_response_code: 'SUCCESS',
        request_payload: {
          ...(emandateRecord.request_payload || {}),
          file_token: fileToken,
          submitted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', emandateRecord.id);

    return {
      success: true,
      emandateRequestId: emandateRecord.id,
      fileToken,
      accountReference,
      expiresAt: emandateRecord.expires_at,
    };
  } catch (netcashError: unknown) {
    const msg = netcashError instanceof Error ? netcashError.message : String(netcashError);
    paymentLogger.error('[MandateSend] NetCash API error', { error: msg });

    await supabase
      .from('emandate_requests')
      .update({
        status: 'failed',
        netcash_response_code: 'ERROR',
        netcash_error_messages: [msg],
        updated_at: new Date().toISOString(),
      })
      .eq('id', emandateRecord.id);

    return { success: false, emandateRequestId: emandateRecord.id, accountReference, error: msg };
  }
}
