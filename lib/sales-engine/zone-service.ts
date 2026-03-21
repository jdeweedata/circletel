/**
 * Zone Management Service
 * CRUD operations and statistics for sales zones (Layer 1 of Sales Engine)
 *
 * @module lib/sales-engine/zone-service
 */

import { createClient } from '@/lib/supabase/server';
import type { SalesZone, CreateZoneInput, ZoneStatus, ZonePriority } from './types';

// =============================================================================
// Types
// =============================================================================

export interface ZoneFilters {
  status?: ZoneStatus;
  priority?: ZonePriority;
  sort_by?: 'zone_score' | 'penetration_rate' | 'name' | 'created_at';
}

export interface ZoneStats {
  total_zones: number;
  active_zones: number;
  avg_zone_score: number;
  avg_penetration: number;
}

interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// =============================================================================
// Zone CRUD
// =============================================================================

/**
 * List all sales zones with optional filtering and sorting.
 * Default sort is by zone_score descending (highest priority zones first).
 */
export async function getZones(filters?: ZoneFilters): Promise<ServiceResult<SalesZone[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('sales_zones')
      .select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const sortColumn = filters?.sort_by ?? 'zone_score';
    const ascending = sortColumn === 'name';
    query = query.order(sortColumn, { ascending });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SalesZone[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch zones: ${message}` };
  }
}

/**
 * Get a single zone by its ID.
 */
export async function getZoneById(id: string): Promise<ServiceResult<SalesZone>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SalesZone, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch zone ${id}: ${message}` };
  }
}

/**
 * Create a new sales zone.
 * Defaults: status = 'active', priority = 'medium', scores = 0.
 */
export async function createZone(input: CreateZoneInput): Promise<ServiceResult<SalesZone>> {
  try {
    const supabase = await createClient();

    const insertData = {
      name: input.name,
      zone_type: input.zone_type,
      description: input.description ?? null,
      center_lat: input.center_lat,
      center_lng: input.center_lng,
      sme_density_score: input.sme_density_score ?? 0,
      penetration_rate: input.penetration_rate ?? 0,
      competitor_weakness_score: input.competitor_weakness_score ?? 0,
      serviceable_addresses: input.serviceable_addresses ?? 0,
      active_customers: input.active_customers ?? 0,
      status: input.status ?? 'active',
      priority: input.priority ?? 'medium',
      province: input.province ?? 'Gauteng',
      suburb: input.suburb ?? null,
      notes: input.notes ?? null,
    };

    const { data, error } = await supabase
      .from('sales_zones')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SalesZone, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to create zone: ${message}` };
  }
}

/**
 * Update an existing sales zone.
 * Only provided fields are updated; others remain unchanged.
 */
export async function updateZone(
  id: string,
  input: Partial<CreateZoneInput>
): Promise<ServiceResult<SalesZone>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_zones')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SalesZone, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to update zone ${id}: ${message}` };
  }
}

/**
 * Soft-delete a zone by setting its status to 'parked'.
 * The zone remains in the database for historical reporting.
 */
export async function deleteZone(id: string): Promise<ServiceResult<SalesZone>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_zones')
      .update({ status: 'parked' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as SalesZone, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to delete zone ${id}: ${message}` };
  }
}

// =============================================================================
// Zone Statistics
// =============================================================================

/**
 * Get aggregate statistics across all zones.
 * Returns total zones, active count, average zone score, and average penetration rate.
 */
export async function getZoneStats(): Promise<ServiceResult<ZoneStats>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_zones')
      .select('id, status, zone_score, penetration_rate');

    if (error) {
      return { data: null, error: error.message };
    }

    const zones = data ?? [];
    const totalZones = zones.length;
    const activeZones = zones.filter((z) => z.status === 'active').length;

    const avgZoneScore =
      totalZones > 0
        ? zones.reduce((sum, z) => sum + (z.zone_score ?? 0), 0) / totalZones
        : 0;

    const avgPenetration =
      totalZones > 0
        ? zones.reduce((sum, z) => sum + (z.penetration_rate ?? 0), 0) / totalZones
        : 0;

    return {
      data: {
        total_zones: totalZones,
        active_zones: activeZones,
        avg_zone_score: Math.round(avgZoneScore * 100) / 100,
        avg_penetration: Math.round(avgPenetration * 100) / 100,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: `Failed to fetch zone stats: ${message}` };
  }
}
