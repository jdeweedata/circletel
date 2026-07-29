/**
 * Typed Ruijie Inngest events + session helpers (SDK v4).
 *
 * Sessions group sync → rollup → health → offline-alert runs in the
 * Inngest dashboard (AI → Sessions → search sync_log_id).
 *
 * @see https://www.inngest.com/docs/features/events-triggers/sessions
 */

import { eventType, staticSchema } from 'inngest';

export type RuijieSyncCompletedData = {
  sync_log_id: string;
  devices_fetched: number;
  added: number;
  updated: number;
  pruned: number;
  errors: number;
  duration_ms: number;
};

/** Event: device sync finished; fans out to rollup / health / offline alerts. */
export const ruijieSyncCompleted = eventType('ruijie/sync.completed', {
  schema: staticSchema<RuijieSyncCompletedData>(),
});

/**
 * Session metadata for the Ruijie network refresh pipeline.
 * High-cardinality: one ID per sync run (UUID from ruijie_sync_logs).
 */
export function ruijieSyncSessions(syncLogId: string) {
  return {
    sync_log_id: syncLogId,
  } as const;
}
