/**
 * Campaign Service
 * Pre-approved campaign definitions, zone tagging, and Arlan routing logic
 * for the Sniper Sales Engine.
 *
 * @module lib/sales-engine/campaign-service
 */

import { createClient } from '@/lib/supabase/server';
import type { ZoneType, SalesZone } from './types';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type CampaignTag =
  | 'business_boost_launch'
  | 'free_installation_summer'
  | 'arlan_volume_blitz'
  | 'switch_save'
  | 'enterprise_connect'
  | 'fy_fresh_start';

export type ArlanRouting = 'tarana_primary' | 'arlan_primary' | 'dual_funnel';

export interface CampaignDefinition {
  tag: CampaignTag;
  name: string;
  active_months: number[]; // 1=Jan, 12=Dec
  eligible_zone_types: ZoneType[];
  requires_tarana: boolean;
  requires_dfa: boolean;
  arlan_deal_categories: string[];
  primary_product: string;
  priority_boost: number;
}

// =============================================================================
// Campaign Definitions (PR #473 Strategy)
// =============================================================================

export const CAMPAIGN_DEFINITIONS: CampaignDefinition[] = [
  {
    tag: 'business_boost_launch',
    name: 'Business Boost Launch',
    active_months: [4, 5],
    eligible_zone_types: ['office_park', 'commercial_strip', 'mixed'],
    requires_tarana: false,
    requires_dfa: false,
    arlan_deal_categories: ['data_connectivity', 'backup_connectivity'],
    primary_product: 'Arlan Data + Backup Bundle',
    priority_boost: 15,
  },
  {
    tag: 'free_installation_summer',
    name: 'Free Installation Summer',
    active_months: [6, 7, 8],
    eligible_zone_types: ['office_park', 'commercial_strip', 'clinic_cluster', 'mixed'],
    requires_tarana: true,
    requires_dfa: false,
    arlan_deal_categories: [],
    primary_product: 'SkyFibre SMB 100/25',
    priority_boost: 20,
  },
  {
    tag: 'arlan_volume_blitz',
    name: 'Arlan Volume Blitz',
    active_months: [6, 7, 8, 9, 10, 11, 12, 1, 2, 3],
    eligible_zone_types: ['office_park', 'commercial_strip', 'clinic_cluster', 'residential_estate', 'mixed'],
    requires_tarana: false,
    requires_dfa: false,
    arlan_deal_categories: [
      'iot_m2m',
      'fleet_management',
      'data_connectivity',
      'backup_connectivity',
      'mobile_workforce',
      'voice_comms',
      'device_upgrade',
      'venue_wifi',
    ],
    primary_product: 'Arlan MTN Portfolio',
    priority_boost: 10,
  },
  {
    tag: 'switch_save',
    name: 'Switch & Save',
    active_months: [9, 10, 11],
    eligible_zone_types: ['office_park', 'commercial_strip', 'residential_estate', 'mixed'],
    requires_tarana: true,
    requires_dfa: false,
    arlan_deal_categories: [],
    primary_product: 'SkyFibre SMB Pro 200/50',
    priority_boost: 15,
  },
  {
    tag: 'enterprise_connect',
    name: 'Enterprise Connect',
    active_months: [9, 10, 11, 12, 1, 2, 3],
    eligible_zone_types: ['office_park', 'commercial_strip'],
    requires_tarana: false,
    requires_dfa: true,
    arlan_deal_categories: [],
    primary_product: 'BizFibreConnect 100/100',
    priority_boost: 25,
  },
  {
    tag: 'fy_fresh_start',
    name: 'FY Fresh Start',
    active_months: [1, 2, 3],
    eligible_zone_types: ['office_park', 'commercial_strip', 'clinic_cluster', 'mixed'],
    requires_tarana: true,
    requires_dfa: false,
    arlan_deal_categories: ['backup_connectivity'],
    primary_product: 'SkyFibre SMB Bundle + Arlan Backup',
    priority_boost: 15,
  },
];

// =============================================================================
// Arlan Routing
// =============================================================================

/**
 * Determine the routing strategy for a zone based on available infrastructure.
 * - No Tarana base stations AND no DFA → arlan_primary (Arlan deals only)
 * - Tarana base stations but no DFA → tarana_primary (SkyFibre focus)
 * - Any combination with both or DFA only → dual_funnel
 */
export function determineArlanRouting(
  baseStationCount: number,
  dfaConnectedCount: number
): ArlanRouting {
  const hasTarana = baseStationCount > 0;
  const hasDfa = dfaConnectedCount > 0;

  if (!hasTarana && !hasDfa) {
    return 'arlan_primary';
  }

  if (hasTarana && !hasDfa) {
    return 'tarana_primary';
  }

  return 'dual_funnel';
}

// =============================================================================
// Campaign Selection
// =============================================================================

/**
 * Select the best-fit campaign for a zone based on current month, zone type,
 * and infrastructure availability. Returns the highest priority_boost match,
 * with a fallback to any active campaign that has no infrastructure requirements.
 */
export function selectCampaignForZone(
  zone: Pick<SalesZone, 'zone_type' | 'base_station_count' | 'dfa_connected_count'>,
  currentMonth?: number
): CampaignTag | null {
  const month = currentMonth ?? new Date().getMonth() + 1; // 1-indexed
  const hasTarana = zone.base_station_count > 0;
  const hasDfa = zone.dfa_connected_count > 0;

  // Filter to campaigns active this month
  const activeCampaigns = CAMPAIGN_DEFINITIONS.filter((c) =>
    c.active_months.includes(month)
  );

  if (activeCampaigns.length === 0) {
    return null;
  }

  // Filter by zone type eligibility
  const zoneEligible = activeCampaigns.filter((c) =>
    c.eligible_zone_types.includes(zone.zone_type)
  );

  if (zoneEligible.length === 0) {
    return null;
  }

  // Filter by infrastructure requirements
  const infraMatch = zoneEligible.filter((c) => {
    if (c.requires_tarana && !hasTarana) return false;
    if (c.requires_dfa && !hasDfa) return false;
    return true;
  });

  // Pick highest priority_boost from infra-matched campaigns
  if (infraMatch.length > 0) {
    const best = infraMatch.reduce((top, c) =>
      c.priority_boost > top.priority_boost ? c : top
    );
    return best.tag;
  }

  // Fallback: find any active campaign without infra requirements
  const noInfraRequired = zoneEligible.filter(
    (c) => !c.requires_tarana && !c.requires_dfa
  );

  if (noInfraRequired.length > 0) {
    const best = noInfraRequired.reduce((top, c) =>
      c.priority_boost > top.priority_boost ? c : top
    );
    return best.tag;
  }

  return null;
}

// =============================================================================
// Slug Generation
// =============================================================================

/**
 * Generate a URL-safe slug from a zone name, optionally appending province.
 * Lowercase, replace non-alphanumeric with hyphens, strip leading/trailing hyphens.
 */
export function generateSlug(name: string, province?: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (province) {
    const provinceSuffix = province
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    slug = `${slug}-${provinceSuffix}`;
  }

  return slug;
}

// =============================================================================
// Zone Tagging (Database Operations)
// =============================================================================

/**
 * Tag a single zone with its best-fit campaign and Arlan routing.
 * Fetches the zone from the database, determines campaign + routing,
 * and updates the record.
 */
export async function tagZoneWithCampaign(
  zoneId: string
): Promise<ServiceResult<{ campaign_tag: CampaignTag | null; arlan_routing: ArlanRouting }>> {
  try {
    const supabase = await createClient();

    // Fetch zone data
    const { data: zone, error: fetchError } = await supabase
      .from('sales_zones')
      .select('zone_type, base_station_count, dfa_connected_count')
      .eq('id', zoneId)
      .single();

    if (fetchError || !zone) {
      return { data: null, error: fetchError?.message ?? `Zone ${zoneId} not found` };
    }

    const campaignTag = selectCampaignForZone(zone as Pick<SalesZone, 'zone_type' | 'base_station_count' | 'dfa_connected_count'>);
    const arlanRouting = determineArlanRouting(zone.base_station_count, zone.dfa_connected_count);

    // Update zone with campaign tag and routing
    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({
        campaign_tag: campaignTag,
        arlan_routing: arlanRouting,
        campaign_tagged_at: new Date().toISOString(),
      })
      .eq('id', zoneId);

    if (updateError) {
      return { data: null, error: `Failed to update zone ${zoneId}: ${updateError.message}` };
    }

    return { data: { campaign_tag: campaignTag, arlan_routing: arlanRouting }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: `tagZoneWithCampaign failed: ${message}` };
  }
}

/**
 * Tag all active zones that haven't been tagged this month.
 * Fetches zones where campaign_tagged_at is null or before the start of
 * the current month, then tags each one.
 */
export async function tagAllActiveZones(): Promise<
  ServiceResult<{ tagged: number; errors: string[] }>
> {
  try {
    const supabase = await createClient();

    // Start of current month in ISO format
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch active zones needing (re-)tagging
    const { data: zones, error: fetchError } = await supabase
      .from('sales_zones')
      .select('id')
      .eq('status', 'active')
      .or(`campaign_tagged_at.is.null,campaign_tagged_at.lt.${monthStart}`);

    if (fetchError) {
      return { data: null, error: `Failed to fetch zones: ${fetchError.message}` };
    }

    if (!zones || zones.length === 0) {
      return { data: { tagged: 0, errors: [] }, error: null };
    }

    let tagged = 0;
    const errors: string[] = [];

    for (const zone of zones) {
      const result = await tagZoneWithCampaign(zone.id);
      if (result.error) {
        errors.push(result.error);
      } else {
        tagged++;
      }
    }

    return { data: { tagged, errors }, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, error: `tagAllActiveZones failed: ${message}` };
  }
}
