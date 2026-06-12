import {
  parseWorkspaceParams,
  buildWorkspaceQuery,
  type WorkspaceParams,
} from '@/lib/products/workspace-params';

describe('parseWorkspaceParams', () => {
  it('returns defaults for empty params', () => {
    expect(parseWorkspaceParams(new URLSearchParams())).toEqual({
      section: 'catalogue',
      source: 'all',
      status: 'all',
      search: '',
      sort: 'updated_desc',
      page: 1,
    });
  });

  it('parses redirect-style params from old routes', () => {
    expect(parseWorkspaceParams(new URLSearchParams('status=draft'))).toMatchObject({
      status: 'draft',
    });
    expect(parseWorkspaceParams(new URLSearchParams('source=hardware'))).toMatchObject({
      source: 'Hardware',
    });
    expect(parseWorkspaceParams(new URLSearchParams('source=mtn'))).toMatchObject({
      source: 'MTN / Arlan',
    });
    expect(parseWorkspaceParams(new URLSearchParams('section=suppliers'))).toMatchObject({
      section: 'suppliers',
    });
  });

  it('ignores invalid values', () => {
    const p = parseWorkspaceParams(new URLSearchParams('status=bogus&source=nope&page=-3'));
    expect(p.status).toBe('all');
    expect(p.source).toBe('all');
    expect(p.page).toBe(1);
  });
});

describe('buildWorkspaceQuery', () => {
  it('round-trips and omits defaults', () => {
    const params: WorkspaceParams = {
      section: 'catalogue',
      source: 'Hardware',
      status: 'draft',
      search: 'router',
      sort: 'price_desc',
      page: 2,
    };
    const qs = buildWorkspaceQuery(params);
    expect(parseWorkspaceParams(new URLSearchParams(qs))).toEqual(params);
    expect(buildWorkspaceQuery(parseWorkspaceParams(new URLSearchParams()))).toBe('');
  });
});
