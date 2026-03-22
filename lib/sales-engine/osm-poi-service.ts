/**
 * OSM POI Service
 * Parses OpenStreetMap GeoJSON data and aggregates business POI counts per ward.
 * Used to enhance ward_demographics with real business density data.
 *
 * @module lib/sales-engine/osm-poi-service
 */

import { createClient } from '@/lib/supabase/server';

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, string | undefined>;
}

interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

interface POICategory {
  business: number;
  office: number;
  healthcare: number;
}

export type POICategoryKey = 'business' | 'office' | 'healthcare';

export type VerticalCategory =
  | 'fleet_logistics'
  | 'security'
  | 'hospitality'
  | 'retail_chain'
  | 'industrial';

export interface VerticalCounts {
  fleet_logistics: number;
  security: number;
  hospitality: number;
  retail_chain: number;
  industrial: number;
}

interface ClassifiedPOI {
  category: POICategoryKey | null;
  vertical: VerticalCategory | null;
}

interface WardPOICounts {
  ward_code: string;
  business_poi_count: number;
  office_poi_count: number;
  healthcare_poi_count: number;
}

// =============================================================================
// POI Classification
// =============================================================================

/**
 * Classify an OSM feature into a POI category based on its tags.
 */
function classifyPOI(properties: Record<string, string | undefined>): keyof POICategory | null {
  const amenity = properties.amenity;
  const office = properties.office;
  const shop = properties.shop;
  const landuse = properties.landuse;
  const building = properties.building;

  // Healthcare
  if (amenity === 'clinic' || amenity === 'hospital' || amenity === 'doctors' || amenity === 'pharmacy') {
    return 'healthcare';
  }

  // Office
  if (office) {
    return 'office';
  }

  // Business (shops, commercial areas, restaurants, etc.)
  if (shop || landuse === 'commercial' || landuse === 'retail') {
    return 'business';
  }
  if (amenity === 'restaurant' || amenity === 'bank' || amenity === 'fuel' || amenity === 'cafe') {
    return 'business';
  }
  if (building === 'commercial' || building === 'retail' || building === 'office') {
    return 'business';
  }

  return null;
}

/**
 * Classify an OSM feature into both a broad POI category and a granular vertical.
 * A POI can have BOTH a category AND a vertical (e.g., amenity=restaurant → business + hospitality).
 */
function classifyPOIDetailed(properties: Record<string, string | undefined>): ClassifiedPOI {
  const category = classifyPOI(properties);

  const amenity = properties.amenity;
  const office = properties.office;
  const shop = properties.shop;
  const building = properties.building;
  const landuse = properties.landuse;
  const tourism = properties.tourism;

  let vertical: VerticalCategory | null = null;

  // Fleet & logistics
  if (
    amenity === 'fuel' ||
    shop === 'car' ||
    shop === 'car_repair' ||
    office === 'logistics' ||
    office === 'transport' ||
    office === 'courier'
  ) {
    vertical = 'fleet_logistics';
  }

  // Security
  if (!vertical && (office === 'security' || shop === 'security')) {
    vertical = 'security';
  }

  // Hospitality
  if (
    !vertical &&
    (amenity === 'restaurant' ||
      amenity === 'cafe' ||
      amenity === 'bar' ||
      amenity === 'hotel' ||
      amenity === 'fast_food' ||
      tourism === 'hotel' ||
      tourism === 'guest_house')
  ) {
    vertical = 'hospitality';
  }

  // Retail chain
  if (
    !vertical &&
    (shop === 'supermarket' ||
      shop === 'department_store' ||
      shop === 'mall' ||
      shop === 'wholesale')
  ) {
    vertical = 'retail_chain';
  }

  // Industrial
  if (
    !vertical &&
    (building === 'industrial' ||
      building === 'warehouse' ||
      landuse === 'industrial' ||
      office === 'industrial')
  ) {
    vertical = 'industrial';
  }

  return { category, vertical };
}

/**
 * Get the centroid point from a GeoJSON geometry.
 */
function getFeaturePoint(geometry: GeoJSONFeature['geometry']): { lat: number; lng: number } | null {
  if (geometry.type === 'Point') {
    const coords = geometry.coordinates as number[];
    return { lat: coords[1], lng: coords[0] };
  }
  if (geometry.type === 'Polygon') {
    const ring = (geometry.coordinates as number[][][])[0];
    if (!ring || ring.length === 0) return null;
    const sumLat = ring.reduce((s, c) => s + c[1], 0);
    const sumLng = ring.reduce((s, c) => s + c[0], 0);
    return { lat: sumLat / ring.length, lng: sumLng / ring.length };
  }
  if (geometry.type === 'MultiPolygon') {
    const coords = geometry.coordinates as unknown as number[][][][];
    const firstRing = coords[0]?.[0];
    if (!firstRing || firstRing.length === 0) return null;
    const sumLat = firstRing.reduce((s, c) => s + c[1], 0);
    const sumLng = firstRing.reduce((s, c) => s + c[0], 0);
    return { lat: sumLat / firstRing.length, lng: sumLng / firstRing.length };
  }
  return null;
}

// =============================================================================
// Import & Aggregation
// =============================================================================

/**
 * Parse GeoJSON and aggregate POI counts per ward.
 * Each POI is assigned to the nearest ward based on centroid proximity.
 */
// =============================================================================
// Overpass API Types
// =============================================================================

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string | undefined>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// =============================================================================
// Overpass API Constants
// =============================================================================

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

function buildOverpassQuery(lat: number, lng: number, radiusM: number): string {
  return `
    [out:json][timeout:25];
    (
      node["amenity"~"clinic|hospital|doctors|pharmacy|restaurant|bank|fuel|cafe|bar|hotel|fast_food"](around:${radiusM},${lat},${lng});
      node["office"](around:${radiusM},${lat},${lng});
      node["shop"](around:${radiusM},${lat},${lng});
      node["tourism"~"hotel|guest_house"](around:${radiusM},${lat},${lng});
      node["building"~"industrial|warehouse"](around:${radiusM},${lat},${lng});
    );
    out body;
  `;
}

// =============================================================================
// Overpass Live Refresh
// =============================================================================

/**
 * Query OSM Overpass API for POIs near a coordinate and update ward_demographics.
 */
export async function refreshPoisFromOverpass(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5,
  wardCode?: string
): Promise<ServiceResult<POICategory & { verticals: VerticalCounts }>> {
  try {
    const radiusM = radiusKm * 1000;
    const query = buildOverpassQuery(centerLat, centerLng, radiusM);

    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      const body = await response.text();
      return { data: null, error: `Overpass API returned ${response.status}: ${body.slice(0, 200)}` };
    }

    const json = (await response.json()) as OverpassResponse;
    const elements = Array.isArray(json.elements) ? json.elements : [];

    const counts: POICategory = { business: 0, office: 0, healthcare: 0 };
    const verticals: VerticalCounts = {
      fleet_logistics: 0,
      security: 0,
      hospitality: 0,
      retail_chain: 0,
      industrial: 0,
    };

    for (const element of elements) {
      if (!element.tags) continue;
      const classified = classifyPOIDetailed(element.tags);
      if (classified.category) {
        counts[classified.category]++;
      }
      if (classified.vertical) {
        verticals[classified.vertical]++;
      }
    }

    // Update ward_demographics if wardCode provided
    if (wardCode) {
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from('ward_demographics')
        .update({
          business_poi_count: counts.business,
          office_poi_count: counts.office,
          healthcare_poi_count: counts.healthcare,
          fleet_logistics_poi_count: verticals.fleet_logistics,
          security_poi_count: verticals.security,
          hospitality_poi_count: verticals.hospitality,
          retail_chain_poi_count: verticals.retail_chain,
          industrial_poi_count: verticals.industrial,
        })
        .eq('ward_code', wardCode);

      if (updateError) {
        console.error(`[OSM POI] Failed to update ward ${wardCode}: ${updateError.message}`);
      }
    }

    return { data: { ...counts, verticals }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Overpass refresh failed: ${message}` };
  }
}

/**
 * Refresh POI data for the top-scoring wards using the Overpass API.
 * Adds a 1.5s delay between requests to respect Overpass rate limits.
 */
export async function refreshTopWardPois(
  limit: number = 20
): Promise<ServiceResult<{ wards_refreshed: number; errors: string[] }>> {
  try {
    const supabase = await createClient();

    const { data: wards, error: wardsError } = await supabase
      .from('ward_demographics')
      .select('ward_code, centroid_lat, centroid_lng')
      .not('centroid_lat', 'is', null)
      .not('centroid_lng', 'is', null)
      .order('demographic_fit_score', { ascending: false })
      .limit(limit);

    if (wardsError || !wards || wards.length === 0) {
      return {
        data: null,
        error: `No wards found for refresh: ${wardsError?.message ?? 'empty result'}`,
      };
    }

    let wardsRefreshed = 0;
    const errors: string[] = [];

    for (let i = 0; i < wards.length; i++) {
      const ward = wards[i];
      const result = await refreshPoisFromOverpass(
        ward.centroid_lat,
        ward.centroid_lng,
        5,
        ward.ward_code
      );

      if (result.error) {
        errors.push(`Ward ${ward.ward_code}: ${result.error}`);
      } else {
        wardsRefreshed++;
      }

      // Rate limit: 1.5s delay between requests (skip after last)
      if (i < wards.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    return {
      data: { wards_refreshed: wardsRefreshed, errors },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Top ward refresh failed: ${message}` };
  }
}

// =============================================================================
// Import & Aggregation
// =============================================================================

export async function importOsmPois(
  geojson: GeoJSONCollection
): Promise<ServiceResult<{ total_pois: number; wards_updated: number; errors: string[] }>> {
  try {
    const supabase = await createClient();
    const errors: string[] = [];

    // Classify all features
    const classifiedPois: Array<{ lat: number; lng: number; category: keyof POICategory }> = [];

    for (const feature of geojson.features) {
      const category = classifyPOI(feature.properties);
      if (!category) continue;

      const point = getFeaturePoint(feature.geometry);
      if (!point) continue;

      classifiedPois.push({ ...point, category });
    }

    if (classifiedPois.length === 0) {
      return { data: { total_pois: 0, wards_updated: 0, errors: ['No classifiable POIs found in GeoJSON'] }, error: null };
    }

    // Fetch all wards with centroids
    const { data: wards, error: wardsError } = await supabase
      .from('ward_demographics')
      .select('ward_code, centroid_lat, centroid_lng')
      .not('centroid_lat', 'is', null)
      .not('centroid_lng', 'is', null);

    if (wardsError || !wards || wards.length === 0) {
      return { data: null, error: `No wards with coordinates found: ${wardsError?.message ?? 'empty'}` };
    }

    // Simple nearest-ward assignment using Euclidean distance on lat/lng
    // (sufficient for South Africa's scale, not crossing date line)
    const wardCounts: Record<string, POICategory> = {};

    for (const poi of classifiedPois) {
      let nearestWard = '';
      let nearestDist = Infinity;

      for (const ward of wards) {
        const dlat = poi.lat - ward.centroid_lat;
        const dlng = poi.lng - ward.centroid_lng;
        const dist = dlat * dlat + dlng * dlng;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestWard = ward.ward_code;
        }
      }

      if (nearestWard) {
        if (!wardCounts[nearestWard]) {
          wardCounts[nearestWard] = { business: 0, office: 0, healthcare: 0 };
        }
        wardCounts[nearestWard][poi.category]++;
      }
    }

    // Batch update ward_demographics
    let wardsUpdated = 0;
    const wardCodes = Object.keys(wardCounts);

    for (let i = 0; i < wardCodes.length; i += 50) {
      const batch = wardCodes.slice(i, i + 50);

      for (const wardCode of batch) {
        const counts = wardCounts[wardCode];
        const { error: updateError } = await supabase
          .from('ward_demographics')
          .update({
            business_poi_count: counts.business,
            office_poi_count: counts.office,
            healthcare_poi_count: counts.healthcare,
          })
          .eq('ward_code', wardCode);

        if (updateError) {
          errors.push(`Ward ${wardCode}: ${updateError.message}`);
        } else {
          wardsUpdated++;
        }
      }
    }

    return {
      data: {
        total_pois: classifiedPois.length,
        wards_updated: wardsUpdated,
        errors,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `OSM POI import failed: ${message}` };
  }
}
