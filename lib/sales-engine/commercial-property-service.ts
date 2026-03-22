/**
 * Commercial Property Intelligence Service
 * Manages REIT portfolio data (Redefine, Growthpoint, Attacq) for sales zone enrichment.
 * Upserts scraped property records and links them to sales zones by proximity.
 *
 * @module lib/sales-engine/commercial-property-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface CommercialProperty {
  id?: string;
  name: string;
  address?: string;
  suburb?: string;
  city?: string;
  province?: string;
  property_type: 'office_park' | 'retail_centre' | 'industrial_park' | 'mixed_use' | 'other';
  sector?: string;
  gla_sqm?: number;
  grade?: string;
  center_lat?: number;
  center_lng?: number;
  source: string;
  source_url?: string;
}

// =============================================================================
// Classification
// =============================================================================

/**
 * Classify a commercial property into a property_type based on sector and name.
 * Uses case-insensitive matching against known keywords.
 */
export function classifyPropertyType(sector: string, name: string): CommercialProperty['property_type'] {
  const sectorLower = (sector || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (sectorLower.includes('office') || nameLower.includes('office park')) {
    return 'office_park';
  }
  if (
    sectorLower.includes('retail') ||
    nameLower.includes('mall') ||
    nameLower.includes('centre') ||
    nameLower.includes('shopping')
  ) {
    return 'retail_centre';
  }
  if (
    sectorLower.includes('industrial') ||
    nameLower.includes('industrial') ||
    nameLower.includes('warehouse') ||
    nameLower.includes('logistics')
  ) {
    return 'industrial_park';
  }
  if (nameLower.includes('business park')) {
    return 'mixed_use';
  }
  return 'other';
}

// =============================================================================
// Upsert Properties
// =============================================================================

/**
 * Upsert commercial properties into the database.
 * Uses source_url as the conflict key for deduplication.
 * Automatically classifies property_type from sector/name if not explicitly set.
 */
export async function upsertCommercialProperties(
  properties: CommercialProperty[]
): Promise<ServiceResult<{ inserted: number; updated: number }>> {
  try {
    if (properties.length === 0) {
      return { data: { inserted: 0, updated: 0 }, error: null };
    }

    const supabase = await createClient();

    // Classify property types where not explicitly provided
    const enriched = properties.map((p) => ({
      ...p,
      property_type: p.property_type || classifyPropertyType(p.sector || '', p.name),
      updated_at: new Date().toISOString(),
    }));

    // Split into properties with source_url (can upsert) and without (insert only)
    const withUrl = enriched.filter((p) => p.source_url);
    const withoutUrl = enriched.filter((p) => !p.source_url);

    let inserted = 0;
    let updated = 0;

    // Upsert properties that have a source_url (conflict on unique index)
    if (withUrl.length > 0) {
      // Check which source_urls already exist
      const sourceUrls = withUrl.map((p) => p.source_url as string);
      const { data: existing } = await supabase
        .from('commercial_properties')
        .select('source_url')
        .in('source_url', sourceUrls);

      const existingUrls = new Set((existing || []).map((r: { source_url: string }) => r.source_url));

      const { error: upsertError } = await supabase
        .from('commercial_properties')
        .upsert(withUrl, { onConflict: 'source_url' });

      if (upsertError) {
        return { data: null, error: `Upsert failed: ${upsertError.message}` };
      }

      const newCount = withUrl.filter((p) => !existingUrls.has(p.source_url as string)).length;
      inserted += newCount;
      updated += withUrl.length - newCount;
    }

    // Insert properties without source_url (no conflict key available)
    if (withoutUrl.length > 0) {
      const { error: insertError } = await supabase
        .from('commercial_properties')
        .insert(withoutUrl);

      if (insertError) {
        return { data: null, error: `Insert (no source_url) failed: ${insertError.message}` };
      }
      inserted += withoutUrl.length;
    }

    console.log(
      `[CommercialPropertyService] Upserted ${inserted} new, ${updated} updated (${properties.length} total)`
    );

    return { data: { inserted, updated }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `upsertCommercialProperties failed: ${message}` };
  }
}

// =============================================================================
// Query by Zone Proximity
// =============================================================================

/**
 * Get commercial properties within a radius of a sales zone's center point.
 * Uses a lat/lng bounding box approximation (1 degree ~ 111km).
 *
 * @param zoneId - UUID of the sales zone
 * @param radiusKm - Search radius in kilometers (default 5)
 */
export async function getCommercialPropertiesNearZone(
  zoneId: string,
  radiusKm = 5
): Promise<ServiceResult<CommercialProperty[]>> {
  try {
    const supabase = await createClient();

    // Fetch zone center coordinates
    const { data: zone, error: zoneError } = await supabase
      .from('sales_zones')
      .select('center_lat, center_lng')
      .eq('id', zoneId)
      .single();

    if (zoneError || !zone) {
      return { data: null, error: `Zone ${zoneId} not found: ${zoneError?.message ?? 'no data'}` };
    }

    // Approximate bounding box (1 degree ≈ 111km)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(zone.center_lat * Math.PI / 180));

    const { data: properties, error: queryError } = await supabase
      .from('commercial_properties')
      .select('*')
      .gte('center_lat', zone.center_lat - latDelta)
      .lte('center_lat', zone.center_lat + latDelta)
      .gte('center_lng', zone.center_lng - lngDelta)
      .lte('center_lng', zone.center_lng + lngDelta);

    if (queryError) {
      return { data: null, error: `Query failed: ${queryError.message}` };
    }

    return { data: (properties as CommercialProperty[]) || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `getCommercialPropertiesNearZone failed: ${message}` };
  }
}

// =============================================================================
// Zone Property Count Update
// =============================================================================

/**
 * Count commercial properties near a zone and update the zone's commercial_property_count.
 *
 * @param zoneId - UUID of the sales zone
 */
export async function updateZoneCommercialPropertyCount(
  zoneId: string
): Promise<ServiceResult<{ count: number }>> {
  try {
    const { data: properties, error: fetchError } = await getCommercialPropertiesNearZone(zoneId);

    if (fetchError || !properties) {
      return { data: null, error: fetchError ?? 'No properties data returned' };
    }

    const count = properties.length;
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from('sales_zones')
      .update({ commercial_property_count: count, updated_at: new Date().toISOString() })
      .eq('id', zoneId);

    if (updateError) {
      return { data: null, error: `Update zone failed: ${updateError.message}` };
    }

    return { data: { count }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `updateZoneCommercialPropertyCount failed: ${message}` };
  }
}

/**
 * Update commercial_property_count for all active sales zones.
 */
export async function updateAllZoneCommercialPropertyCounts(): Promise<
  ServiceResult<{ zones_updated: number }>
> {
  try {
    const supabase = await createClient();

    const { data: zones, error: zonesError } = await supabase
      .from('sales_zones')
      .select('id')
      .eq('status', 'active');

    if (zonesError || !zones) {
      return { data: null, error: `Fetch active zones failed: ${zonesError?.message ?? 'no data'}` };
    }

    let zonesUpdated = 0;
    const errors: string[] = [];

    for (const zone of zones) {
      const { error } = await updateZoneCommercialPropertyCount(zone.id);
      if (error) {
        errors.push(`Zone ${zone.id}: ${error}`);
      } else {
        zonesUpdated++;
      }
    }

    if (errors.length > 0) {
      console.warn(
        `[CommercialPropertyService] ${errors.length} zone update errors:`,
        errors.slice(0, 5)
      );
    }

    console.log(
      `[CommercialPropertyService] Updated ${zonesUpdated}/${zones.length} active zones`
    );

    return { data: { zones_updated: zonesUpdated }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `updateAllZoneCommercialPropertyCounts failed: ${message}` };
  }
}
