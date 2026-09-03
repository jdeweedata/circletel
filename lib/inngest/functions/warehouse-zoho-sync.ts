import { inngest } from '../client';
import {
  pollMappedZohoInventoryItems,
  pushWarehouseMovementById,
} from '@/lib/admin/warehouse-zoho-sync';
import { zohoLogger } from '@/lib/logging';

export const warehouseZohoPushFunction = inngest.createFunction(
  {
    id: 'warehouse-zoho-push',
    name: 'Push warehouse movement to Zoho Inventory',
    retries: 4,
    triggers: [{ event: 'warehouse/zoho.push' }],
  },
  async ({ event, step }) => {
    const movementId = String(event.data?.movementId || '');
    if (!movementId) {
      throw new Error('warehouse/zoho.push requires movementId');
    }

    return step.run('push-movement', async () => {
      const result = await pushWarehouseMovementById(movementId);
      if (result.status === 'failed') {
        zohoLogger.error('[WarehouseZohoSync] Push failed', {
          movementId,
          error: result.error,
        });
        throw new Error(result.error || 'Zoho Inventory push failed');
      }
      return result;
    });
  }
);

export const warehouseZohoPollFunction = inngest.createFunction(
  {
    id: 'warehouse-zoho-poll',
    name: 'Poll Zoho Inventory stock for mapped SKUs',
    retries: 2,
    triggers: [
      { cron: 'TZ=Africa/Johannesburg 15 2 * * *' },
      { event: 'warehouse/zoho.poll' },
    ],
  },
  async ({ step }) => {
    return step.run('poll-mapped-items', async () => {
      return pollMappedZohoInventoryItems();
    });
  }
);
