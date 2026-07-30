/**
 * NetCash Pay Now CollectionRail adapter.
 */

import { PayNowBillingService } from '@/lib/billing/paynow-billing-service';
import type { CollectionRail, PayLinkResult } from './collection-rail';

export function createNetcashPaynowRail(): CollectionRail {
  return {
    id: 'netcash_paynow',

    async sendPayLink(
      invoiceId: string,
      options: Record<string, unknown> = {}
    ): Promise<PayLinkResult> {
      const result = await PayNowBillingService.processPayNowForInvoice(
        invoiceId,
        {
          sendEmail: options.sendEmail !== false,
          sendSms: options.sendSms !== false,
          forceRegenerate: Boolean(options.forceRegenerate),
          allowCollectionMethodOverride: Boolean(
            options.allowCollectionMethodOverride
          ),
          includeEmandateReminder: Boolean(options.includeEmandateReminder),
          smsTemplate:
            (options.smsTemplate as
              | 'paymentDue'
              | 'paymentReminder'
              | 'debitFailed'
              | 'emandatePending'
              | undefined) || 'paymentDue',
        }
      );

      return {
        success: result.success,
        paymentUrl: result.paymentUrl,
        error: result.errors?.[0],
        errors: result.errors,
      };
    },
  };
}
