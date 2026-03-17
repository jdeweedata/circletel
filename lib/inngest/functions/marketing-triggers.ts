/**
 * Marketing Campaign Triggers
 *
 * Automated marketing intelligence triggers that fire when
 * infrastructure changes create new outreach opportunities.
 *
 * 1. DFA Near-Net Alert: When DFA sync finds new connected buildings,
 *    check for no-coverage leads within proximity and flag for outreach.
 *
 * 2. Demand Threshold Alert: When no-coverage leads for an area
 *    exceed a threshold, flag for expansion review.
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';

/**
 * After DFA sync completes, check if any newly connected buildings
 * are near existing no-coverage leads. If so, flag those leads
 * as potential outreach targets.
 */
export const marketingDfaLeadMatchFunction = inngest.createFunction(
  {
    id: 'marketing-dfa-lead-match',
    name: 'Marketing: Match DFA Buildings to No-Coverage Leads',
    retries: 2,
  },
  { event: 'dfa/sync.completed' },
  async ({ event, step }) => {
    const result = await step.run('match-leads-to-buildings', async () => {
      const supabase = await createClient();

      // Get recently synced connected buildings (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data: recentBuildings, error: buildingsError } = await supabase
        .from('dfa_buildings')
        .select('id, building_name, street_address, latitude, longitude')
        .eq('coverage_type', 'connected')
        .gte('last_synced_at', oneDayAgo.toISOString());

      if (buildingsError || !recentBuildings?.length) {
        return {
          matched: 0,
          message: buildingsError
            ? `Error: ${buildingsError.message}`
            : 'No recently synced connected buildings found',
        };
      }

      // Get all new/contacted no-coverage leads with coordinates
      const { data: leads, error: leadsError } = await supabase
        .from('no_coverage_leads')
        .select('id, full_name, address, latitude, longitude, status')
        .in('status', ['new', 'contacted'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (leadsError || !leads?.length) {
        return {
          matched: 0,
          buildings: recentBuildings.length,
          message: leadsError
            ? `Error: ${leadsError.message}`
            : 'No eligible leads with coordinates found',
        };
      }

      // Match leads within ~1km of connected buildings
      const PROXIMITY_DEGREES = 0.01; // ~1.1km
      const matchedLeadIds: string[] = [];

      for (const lead of leads) {
        if (lead.latitude == null || lead.longitude == null) continue;

        const isNearBuilding = recentBuildings.some((building) => {
          if (building.latitude == null || building.longitude == null) return false;
          const latDiff = Math.abs(building.latitude - lead.latitude!);
          const lngDiff = Math.abs(building.longitude - lead.longitude!);
          return latDiff <= PROXIMITY_DEGREES && lngDiff <= PROXIMITY_DEGREES;
        });

        if (isNearBuilding) {
          matchedLeadIds.push(lead.id);
        }
      }

      // Update matched leads status to 'qualified' with a note
      if (matchedLeadIds.length > 0) {
        await supabase
          .from('no_coverage_leads')
          .update({
            status: 'qualified',
            notes: `Auto-qualified: DFA fibre now available near this address (${new Date().toISOString().split('T')[0]})`,
            updated_at: new Date().toISOString(),
          })
          .in('id', matchedLeadIds);
      }

      return {
        matched: matchedLeadIds.length,
        buildings: recentBuildings.length,
        leadsChecked: leads.length,
      };
    });

    return result;
  }
);

/**
 * Periodic check (weekly) for areas with high demand but no coverage.
 * Flags areas that exceed a threshold of no-coverage leads.
 */
export const marketingDemandThresholdFunction = inngest.createFunction(
  {
    id: 'marketing-demand-threshold-check',
    name: 'Marketing: Demand Threshold Alert',
    retries: 2,
  },
  [
    { cron: '0 8 * * 1' }, // Weekly on Monday at 8 AM
  ],
  async ({ step }) => {
    const result = await step.run('check-demand-thresholds', async () => {
      const supabase = await createClient();
      const THRESHOLD = 5; // Minimum leads in an area to flag

      // Get all no-coverage leads with coordinates from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: leads, error } = await supabase
        .from('no_coverage_leads')
        .select('id, address, latitude, longitude, service_type, status')
        .in('status', ['new', 'contacted'])
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('created_at', ninetyDaysAgo.toISOString());

      if (error || !leads?.length) {
        return {
          hotspots: 0,
          message: error ? `Error: ${error.message}` : 'No leads to analyze',
        };
      }

      // Group by ~1km grid
      const areaMap = new Map<string, { count: number; lat: number; lng: number; addresses: string[] }>();

      for (const lead of leads) {
        if (lead.latitude == null || lead.longitude == null) continue;

        const gridLat = Math.round(lead.latitude * 100) / 100;
        const gridLng = Math.round(lead.longitude * 100) / 100;
        const key = `${gridLat},${gridLng}`;

        const existing = areaMap.get(key) || {
          count: 0,
          lat: gridLat,
          lng: gridLng,
          addresses: [],
        };

        existing.count++;
        if (lead.address && existing.addresses.length < 3) {
          existing.addresses.push(lead.address);
        }

        areaMap.set(key, existing);
      }

      // Find hotspots above threshold
      const hotspots = Array.from(areaMap.values())
        .filter((area) => area.count >= THRESHOLD)
        .sort((a, b) => b.count - a.count);

      return {
        totalLeadsAnalyzed: leads.length,
        hotspots: hotspots.length,
        topAreas: hotspots.slice(0, 10).map((h) => ({
          lat: h.lat,
          lng: h.lng,
          leads: h.count,
          sampleAddresses: h.addresses,
        })),
      };
    });

    return result;
  }
);
