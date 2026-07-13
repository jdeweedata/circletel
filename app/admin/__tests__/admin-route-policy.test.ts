import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { getAdminRouteMode } from '../admin-route-policy';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/admin/dashboard';
const mockSignOut = jest.fn();
const mockSupabase = { auth: { signOut: mockSignOut } };

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname
}));

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null
}));

jest.mock('@/components/admin/layout/Sidebar', () => ({
  Sidebar: () => React.createElement('aside', { 'data-admin-shell': 'sidebar' })
}));

jest.mock('@/components/admin/layout/AdminHeader', () => ({
  AdminHeader: () =>
    React.createElement('header', { 'data-admin-shell': 'header' })
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AdminLayoutClient = require('../AdminLayoutClient').default;

describe('getAdminRouteMode', () => {
  it.each([
    '/admin/login',
    '/admin/signup',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/admin/sales/feasibility/designs'
  ])('%s is public', (pathname) => {
    expect(getAdminRouteMode(pathname, false)).toBe('public');
  });

  it('keeps descendants of public routes public', () => {
    expect(getAdminRouteMode('/admin/reset-password/confirm', false)).toBe(
      'public'
    );
  });

  it.each(['/admin/login-help', '/admin/sales/feasibility/designs-archive'])(
    'does not treat the sibling route %s as public',
    (pathname) => {
      expect(getAdminRouteMode(pathname, false)).toBe('standard');
    }
  );

  it('preserves studio public mode', () => {
    expect(getAdminRouteMode('/admin/operations-preview', true)).toBe('public');
  });

  it.each(['/admin/cms/builder', '/admin/cms/builder/page-1'])(
    '%s remains full-screen and unguarded',
    (pathname) => {
      expect(getAdminRouteMode(pathname, false)).toBe('full-screen-unguarded');
    }
  );

  it('does not make a CMS builder sibling full-screen', () => {
    expect(getAdminRouteMode('/admin/cms/builder-tools', false)).toBe(
      'standard'
    );
  });

  it.each([
    '/admin/operations-preview',
    '/admin/operations-preview/network/incidents'
  ])('%s is full-screen and authenticated', (pathname) => {
    expect(getAdminRouteMode(pathname, false)).toBe(
      'full-screen-authenticated'
    );
  });

  it('does not make an operations preview sibling full-screen', () => {
    expect(getAdminRouteMode('/admin/operations-preview-other', false)).toBe(
      'standard'
    );
  });

  it.each(['/admin/dashboard', '/admin/customers', null])(
    '%s uses the standard admin shell',
    (pathname) => {
      expect(getAdminRouteMode(pathname, false)).toBe('standard');
    }
  );
});

describe('AdminLayoutClient route policy', () => {
  it('authenticates operations preview before rendering it without the admin shell', async () => {
    mockPathname = '/admin/operations-preview';

    let resolveFetch!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockReturnValueOnce(pendingResponse);

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        React.createElement(
          AdminLayoutClient,
          null,
          React.createElement('div', { 'data-preview': true })
        )
      );
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/me');
    expect(JSON.stringify(renderer.toJSON())).not.toContain('data-preview');

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-user',
            email: 'admin@example.com',
            role: 'super_admin'
          }
        })
      } as Response);
      await pendingResponse;
      await Promise.resolve();
    });

    const rendered = JSON.stringify(renderer.toJSON());
    expect(rendered).toContain('data-preview');
    expect(rendered).not.toContain('data-admin-shell');
  });
});
