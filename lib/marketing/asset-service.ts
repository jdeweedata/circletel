/**
 * Marketing Asset Service
 *
 * Manages the marketing asset library for ambassadors, partners, and internal use.
 */

import { createClient } from '@/lib/supabase/server';

export type AssetCategory =
  | 'logo'
  | 'banner'
  | 'social'
  | 'flyer'
  | 'video'
  | 'document'
  | 'template'
  | 'other';

export type AssetVisibility = 'public' | 'ambassadors' | 'partners' | 'internal';

export interface AssetVariation {
  label: string;
  url: string;
  width?: number;
  height?: number;
}

export interface MarketingAsset {
  id: string;
  title: string;
  description: string | null;
  category: AssetCategory;
  subcategory: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  variations: AssetVariation[];
  visibility: AssetVisibility;
  requires_approval: boolean;
  download_count: number;
  last_downloaded_at: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetInput {
  title: string;
  description?: string;
  category: AssetCategory;
  subcategory?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration?: number;
  variations?: AssetVariation[];
  visibility?: AssetVisibility;
  requires_approval?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface AssetFilters {
  category?: AssetCategory;
  visibility?: AssetVisibility;
  tags?: string[];
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get all assets with optional filters
 */
export async function getAssets(
  filters?: AssetFilters
): Promise<{ assets: MarketingAsset[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_assets')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }

  return {
    assets: (data as MarketingAsset[]) || [],
    total: count || 0,
  };
}

/**
 * Get assets accessible to ambassadors
 */
export async function getAmbassadorAssets(
  filters?: Omit<AssetFilters, 'visibility'>
): Promise<MarketingAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_assets')
    .select('*')
    .in('visibility', ['public', 'ambassadors'])
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching ambassador assets:', error);
    return [];
  }

  return (data as MarketingAsset[]) || [];
}

/**
 * Get assets accessible to partners
 */
export async function getPartnerAssets(
  filters?: Omit<AssetFilters, 'visibility'>
): Promise<MarketingAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_assets')
    .select('*')
    .in('visibility', ['public', 'ambassadors', 'partners'])
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching partner assets:', error);
    return [];
  }

  return (data as MarketingAsset[]) || [];
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(id: string): Promise<MarketingAsset | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketing_assets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching asset:', error);
    return null;
  }

  return data as MarketingAsset;
}

/**
 * Create a new asset
 */
export async function createAsset(
  input: CreateAssetInput,
  createdBy?: string
): Promise<{ asset?: MarketingAsset; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketing_assets')
    .insert({
      title: input.title,
      description: input.description || null,
      category: input.category,
      subcategory: input.subcategory || null,
      file_url: input.file_url,
      file_name: input.file_name,
      file_size: input.file_size || null,
      mime_type: input.mime_type || null,
      width: input.width || null,
      height: input.height || null,
      duration: input.duration || null,
      variations: input.variations || [],
      visibility: input.visibility || 'internal',
      requires_approval: input.requires_approval || false,
      tags: input.tags || [],
      metadata: input.metadata || {},
      is_active: true,
      created_by: createdBy || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset:', error);
    return { error: error.message };
  }

  return { asset: data as MarketingAsset };
}

/**
 * Update an asset
 */
export async function updateAsset(
  id: string,
  updates: Partial<CreateAssetInput> & { is_active?: boolean }
): Promise<{ asset?: MarketingAsset; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketing_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset:', error);
    return { error: error.message };
  }

  return { asset: data as MarketingAsset };
}

/**
 * Delete an asset
 */
export async function deleteAsset(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('marketing_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting asset:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Track asset download
 */
export async function trackDownload(
  assetId: string
): Promise<void> {
  const supabase = await createClient();

  // Increment download count
  await supabase.rpc('increment_asset_downloads', { asset_id: assetId });
}

/**
 * Get popular assets
 */
export async function getPopularAssets(
  limit = 10,
  visibility?: AssetVisibility[]
): Promise<MarketingAsset[]> {
  const supabase = await createClient();

  let query = supabase
    .from('marketing_assets')
    .select('*')
    .eq('is_active', true)
    .order('download_count', { ascending: false })
    .limit(limit);

  if (visibility && visibility.length > 0) {
    query = query.in('visibility', visibility);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching popular assets:', error);
    return [];
  }

  return (data as MarketingAsset[]) || [];
}

/**
 * Get asset categories with counts
 */
export async function getAssetCategoryCounts(): Promise<
  Array<{ category: AssetCategory; count: number }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('marketing_assets')
    .select('category')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching category counts:', error);
    return [];
  }

  // Count by category
  const counts: Record<string, number> = {};
  data?.forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });

  return Object.entries(counts).map(([category, count]) => ({
    category: category as AssetCategory,
    count,
  }));
}
