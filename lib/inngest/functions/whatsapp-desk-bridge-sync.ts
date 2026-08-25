/**
 * WhatsApp ↔ Zoho Desk bridge — outbound sync
 *
 * Polls open whatsapp_desk_threads and sends new public Desk comments
 * to the customer via WhatsApp Cloud API.
 *
 * Schedule: every minute
 */

import { inngest } from '../client';
import { syncDeskCommentsToWhatsApp } from '@/lib/integrations/whatsapp/desk-bridge';
import { zohoLogger } from '@/lib/logging';

export const whatsappDeskBridgeSyncFunction = inngest.createFunction(
  {
    id: 'whatsapp-desk-bridge-sync',
    name: 'WhatsApp Desk Bridge Sync',
    retries: 1,
    triggers: [
      { cron: '* * * * *' },
      { event: 'whatsapp-desk/bridge.sync' },
    ],
  },
  async ({ step }) => {
    const result = await step.run('sync-desk-comments-to-whatsapp', async () => {
      return syncDeskCommentsToWhatsApp();
    });

    if (result.errors.length > 0) {
      zohoLogger.warn('[WA Desk Bridge Sync] Completed with errors', result);
    } else {
      zohoLogger.info('[WA Desk Bridge Sync] Completed', result);
    }

    return result;
  }
);
