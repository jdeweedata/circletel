/**
 * OSM POI Sync Inngest Function
 *
 * Aggregates OpenStreetMap business POI counts per ward.
 * Monthly schedule — OSM data doesn't change frequently.
 *
 * Schedule: 1st of each month at 2AM SAST (midnight UTC)
 * Also triggered manually via 'osm/poi.sync.requested' event.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

export const osmPoiSyncFunction = inngest.createFunction(
  {
    id: 'osm-poi-sync',
    name: 'OSM POI Sync',
    retries: 2,
  },
  [
    // Monthly: 1st at 2AM SAST = midnight UTC
    { cron: '0 0 1 * *' },
    // Manual trigger
    { event: 'osm/poi.sync.requested' },
  ],
  async ({ event, step }) => {
    const startTime = Date.now();

    // Step 1: Check if ward data exists
    const hasWards = await step.run('check-ward-data', async () => {
      const supabase = await createClient();
      const { count, error } = await supabase
        .from('ward_demographics')
        .select('id', { count: 'exact', head: true });

      if (error) throw new Error(`Ward check failed: ${error.message}`);
      return (count ?? 0) > 0;
    });

    if (!hasWards) {
      return { status: 'skipped', reason: 'No ward data loaded — import wards first' };
    }

    // Step 2: POI import would be triggered by the API route uploading GeoJSON
    // This function serves as the scheduled trigger point
    // In practice, the heavy lifting happens via the /api/admin/sales-engine/demographics/poi-import route
    return {
      status: 'completed',
      message: 'OSM POI sync check completed. Upload GeoJSON via the demographics POI import API.',
      duration_ms: Date.now() - startTime,
    };
  }
);
