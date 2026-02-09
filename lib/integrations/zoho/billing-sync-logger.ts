/**
 * ZOHO Billing Sync Logger
 *
 * Simple logging utility for ZOHO Billing sync operations
 * Logs to zoho_sync_logs table
 */

import { createClient } from '@/lib/supabase/server';
import { zohoLogger } from '@/lib/logging';

export interface SyncLogParams {
  entity_type: 'customer' | 'subscription' | 'invoice' | 'payment';
  entity_id: string;
  zoho_entity_type: 'Contacts' | 'Subscription' | 'Invoice' | 'Payment';
  zoho_entity_id: string | null;
  status: 'success' | 'failed' | 'retrying' | 'pending';
  attempt_number: number;
  error_message?: string;
  request_payload?: unknown;
  response_payload?: unknown;
}

/**
 * Log a ZOHO Billing sync attempt
 */
export async function logZohoSync(params: SyncLogParams): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('zoho_sync_logs')
      .insert({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        zoho_entity_type: params.zoho_entity_type,
        zoho_entity_id: params.zoho_entity_id,
        status: params.status,
        attempt_number: params.attempt_number,
        error_message: params.error_message || null,
        request_payload: params.request_payload as Record<string, unknown> || null,
        response_payload: params.response_payload as Record<string, unknown> || null,
      });

    if (error) {
      zohoLogger.error('[ZohoBillingLogger] Failed to log sync:', error);
      // Don't throw - logging failure shouldn't break sync
    }
  } catch (error) {
    zohoLogger.error('[ZohoBillingLogger] Error logging sync:', error);
    // Don't throw - logging failure shouldn't break sync
  }
}
