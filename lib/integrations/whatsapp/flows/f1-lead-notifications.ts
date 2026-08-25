/**
 * F1 Lead Qualification — post-create notifications.
 *
 * Called via `onLeadCreated` after coverage_leads insert succeeds.
 * Failures are logged; they must never fail the webhook (handler already
 * wraps the hook in try/catch).
 *
 * - Sales: email + Zoho via sendCoverageLeadAlert (admin deep link on email)
 * - Customer: free-form WhatsApp confirmation (no approved lead template yet)
 */

import { sendCoverageLeadAlert } from '@/lib/notifications/sales-alerts';
import { whatsAppService } from '../whatsapp-service';
import { normalizeCustomerType } from './types';
import type { LeadCreatedHookContext } from './flow-response-handler';

// Planned Meta template — not registered; do not call sendTemplate with this name.
const PLANNED_CONFIRMATION_TEMPLATE = 'circletel_lead_received';

export interface F1LeadNotificationResult {
  salesAlertOk: boolean;
  confirmationOk: boolean;
  errors: string[];
}

function buildConfirmationBody(firstName: string): string {
  const name = firstName.trim() || 'there';
  return `Thanks ${name}, we received your enquiry. We'll contact you during business hours.`;
}

/**
 * Sales alert (email/SMS/Slack/Zoho) + customer WhatsApp confirmation.
 * Safe for production: does not invent unapproved WhatsApp template names.
 */
export async function notifyF1LeadCreated(
  ctx: LeadCreatedHookContext
): Promise<F1LeadNotificationResult> {
  const result: F1LeadNotificationResult = {
    salesAlertOk: false,
    confirmationOk: false,
    errors: [],
  };

  const customerType = normalizeCustomerType(ctx.form.customer_type);
  const phone =
    (ctx.phone && ctx.phone.trim()) ||
    ctx.form.phone?.trim() ||
    ctx.session.phone ||
    '';

  // --- Sales alert (reuse coverage lead path; includes admin deep link) ---
  try {
    const alert = await sendCoverageLeadAlert({
      id: ctx.leadId,
      customer_type: customerType,
      first_name: ctx.form.first_name,
      last_name: ctx.form.last_name,
      email: ctx.form.email?.trim() || '',
      phone,
      company_name: ctx.form.company_name,
      address: ctx.form.address,
      suburb: ctx.form.suburb,
      city: ctx.form.city,
      province: ctx.form.province,
      requested_service_type: ctx.form.service_interest,
      requested_speed: ctx.form.speed,
      budget_range: ctx.form.budget_range,
      lead_source: 'whatsapp_flow',
      source_campaign: ctx.session.source_campaign ?? undefined,
    });

    result.salesAlertOk = alert.success;
    if (!alert.success && alert.errors?.length) {
      result.errors.push(...alert.errors.map((e) => `sales: ${e}`));
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`sales: ${msg}`);
    console.error('[F1Notifications] Sales alert failed', {
      leadId: ctx.leadId,
      error: msg,
    });
  }

  // --- Customer confirmation (session window: free-form text) ---
  // Template `circletel_lead_received` is not approved in Meta yet — skip sendTemplate.
  console.info(
    '[F1Notifications] Skipping WhatsApp confirmation template (not approved)',
    {
      leadId: ctx.leadId,
      plannedTemplate: PLANNED_CONFIRMATION_TEMPLATE,
      fallback: 'free-form text',
    }
  );

  try {
    if (!phone) {
      result.errors.push('confirmation: no phone number');
    } else if (!whatsAppService.isConfigured()) {
      result.errors.push('confirmation: WhatsApp not configured');
      console.warn('[F1Notifications] WhatsApp not configured — skip confirmation', {
        leadId: ctx.leadId,
      });
    } else {
      const textResult = await whatsAppService.sendText(
        phone,
        buildConfirmationBody(ctx.form.first_name)
      );
      result.confirmationOk = textResult.success;
      if (!textResult.success) {
        result.errors.push(
          `confirmation: ${textResult.error || 'send failed'}`
        );
        console.warn('[F1Notifications] Free-form confirmation failed', {
          leadId: ctx.leadId,
          error: textResult.error,
          errorCode: textResult.errorCode,
        });
      } else {
        console.info('[F1Notifications] Free-form confirmation sent', {
          leadId: ctx.leadId,
          messageId: textResult.messageId,
        });
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`confirmation: ${msg}`);
    console.error('[F1Notifications] Confirmation exception', {
      leadId: ctx.leadId,
      error: msg,
    });
  }

  return result;
}

/** Default `onLeadCreated` hook for the WhatsApp webhook / handleFlowCompletion */
export async function onF1LeadCreated(
  ctx: LeadCreatedHookContext
): Promise<void> {
  const outcome = await notifyF1LeadCreated(ctx);
  if (outcome.errors.length > 0) {
    console.warn('[F1Notifications] Completed with errors', {
      leadId: ctx.leadId,
      salesAlertOk: outcome.salesAlertOk,
      confirmationOk: outcome.confirmationOk,
      errors: outcome.errors,
    });
  }
}
