/**
 * URL search-param codec for the Product Workspace (/admin/products).
 * Old routes redirect here with these params (e.g. /admin/products?status=draft),
 * so parsing must accept short aliases ("hardware", "mtn") as well as the
 * canonical UnifiedProductSource labels.
 */
import type {
  UnifiedProductSource,
  UnifiedProductStatus,
} from '@/lib/types/unified-product';

export type WorkspaceSection = 'catalogue' | 'suppliers' | 'mtn-tools';

export interface WorkspaceParams {
  section: WorkspaceSection;
  source: UnifiedProductSource | 'all';
  status: UnifiedProductStatus | 'all';
  search: string;
  sort: 'updated_desc' | 'created_desc' | 'name_asc' | 'price_desc' | 'price_asc';
  page: number;
}

export const WORKSPACE_DEFAULTS: WorkspaceParams = {
  section: 'catalogue',
  source: 'all',
  status: 'all',
  search: '',
  sort: 'updated_desc',
  page: 1,
};

const SECTIONS: WorkspaceSection[] = ['catalogue', 'suppliers', 'mtn-tools'];
const STATUSES: Array<UnifiedProductStatus> = ['active', 'draft', 'pending', 'archived', 'inactive'];
const SORTS: WorkspaceParams['sort'][] = ['updated_desc', 'created_desc', 'name_asc', 'price_desc', 'price_asc'];

/** Accepts canonical labels and redirect-friendly aliases. */
const SOURCE_ALIASES: Record<string, UnifiedProductSource> = {
  circletel: 'CircleTel',
  CircleTel: 'CircleTel',
  mtn: 'MTN / Arlan',
  'MTN / Arlan': 'MTN / Arlan',
  hardware: 'Hardware',
  Hardware: 'Hardware',
};

export function parseWorkspaceParams(sp: URLSearchParams): WorkspaceParams {
  const section = sp.get('section') as WorkspaceSection | null;
  const status = sp.get('status') as UnifiedProductStatus | null;
  const sort = sp.get('sort') as WorkspaceParams['sort'] | null;
  const rawSource = sp.get('source');
  const page = Number(sp.get('page'));
  return {
    section: section && SECTIONS.includes(section) ? section : WORKSPACE_DEFAULTS.section,
    source: (rawSource && SOURCE_ALIASES[rawSource]) || WORKSPACE_DEFAULTS.source,
    status: status && STATUSES.includes(status) ? status : WORKSPACE_DEFAULTS.status,
    search: sp.get('search') ?? '',
    sort: sort && SORTS.includes(sort) ? sort : WORKSPACE_DEFAULTS.sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Omits default values so the canonical URL stays clean. */
export function buildWorkspaceQuery(params: WorkspaceParams): string {
  const sp = new URLSearchParams();
  if (params.section !== WORKSPACE_DEFAULTS.section) sp.set('section', params.section);
  if (params.source !== 'all') sp.set('source', params.source);
  if (params.status !== 'all') sp.set('status', params.status);
  if (params.search.trim()) sp.set('search', params.search.trim());
  if (params.sort !== WORKSPACE_DEFAULTS.sort) sp.set('sort', params.sort);
  if (params.page > 1) sp.set('page', String(params.page));
  return sp.toString();
}
